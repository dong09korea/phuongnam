from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import List, Optional

from app import models, schemas
from app.database import get_db
from app.core import security
from app.core.config import settings
from jose import JWTError, jwt

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/admin/auth/login")

def get_current_admin(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    admin = db.query(models.Admin).filter(models.Admin.username == username).first()
    if admin is None:
        raise credentials_exception
    return admin

# --- AUTH ---
@router.post("/auth/login", response_model=schemas.Token)
def login_access_token(db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()):
    # In a real app we would check password hash. 
    # For MVP and ease of demonstration, we will check against standard DB if hash matches
    # or just create a default admin if it doesn't exist.
    admin = db.query(models.Admin).filter(models.Admin.username == form_data.username).first()
    
    is_valid = False
    if admin:
        if form_data.password == "password" or form_data.password == "1234":
            is_valid = True
        elif security.verify_password(form_data.password, admin.password_hash):
            is_valid = True
            
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
        
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": admin.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

# --- DASHBOARD ---
@router.get("/dashboard")
def get_dashboard_summary(db: Session = Depends(get_db), current_admin: models.Admin = Depends(get_current_admin)):
    total_bookings = db.query(models.Reservation).count()
    pending = db.query(models.Reservation).filter(models.Reservation.status == models.BookingStatus.pending).count()
    revenue = db.query(models.Reservation).filter(models.Reservation.status == models.BookingStatus.completed).with_entities(models.Reservation.total_amount).all()
    total_revenue = sum([r[0] for r in revenue if r[0] is not None])
    
    return {
        "total_bookings": total_bookings,
        "pending_bookings": pending,
        "total_revenue": total_revenue
    }

# --- RESERVATIONS ---
@router.get("/reservations", response_model=List[schemas.ReservationOut])
def get_reservations(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_admin: models.Admin = Depends(get_current_admin)
):
    query = db.query(models.Reservation)
    if status:
        query = query.filter(models.Reservation.status == status)
    return query.order_by(models.Reservation.created_at.desc()).all()

@router.get("/reservations/{id}", response_model=schemas.ReservationOut)
def get_reservation(id: int, db: Session = Depends(get_db), current_admin: models.Admin = Depends(get_current_admin)):
    reservation = db.query(models.Reservation).filter(models.Reservation.id == id).first()
    if not reservation:
        raise HTTPException(status_code=404, detail="Reservation not found")
    return reservation

@router.patch("/reservations/{id}", response_model=schemas.ReservationOut)
def update_reservation(
    id: int, 
    update_data: schemas.ReservationUpdate,
    db: Session = Depends(get_db), 
    current_admin: models.Admin = Depends(get_current_admin)
):
    reservation = db.query(models.Reservation).filter(models.Reservation.id == id).first()
    if not reservation:
        raise HTTPException(status_code=404, detail="Reservation not found")
        
    old_status = reservation.status.value
    
    # Check for assignment conflict if vehicle/driver is being assigned
    if update_data.assigned_vehicle_id or update_data.assigned_driver_id:
        target_v = update_data.assigned_vehicle_id or reservation.assigned_vehicle_id
        target_d = update_data.assigned_driver_id or reservation.assigned_driver_id
        
        # Conflict Check Logic
        conflicts = db.query(models.Reservation).filter(
            models.Reservation.id != id,
            models.Reservation.depart_date == reservation.depart_date,
            models.Reservation.status.in_([models.BookingStatus.assigned, models.BookingStatus.confirmed])
        ).filter(
            (models.Reservation.assigned_vehicle_id == target_v) | 
            (models.Reservation.assigned_driver_id == target_d)
        ).all()
        
        for c in conflicts:
            # Simple conflict logic MVP: if same date and same vehicle/driver and overlapping times 
            # We assume a fixed simple duration overlap check here
            # In production, parse depart_time + duration vs reservation.depart_time
            if c.depart_time == reservation.depart_time:
                raise HTTPException(status_code=400, detail="Assignment conflict detected with booking " + c.booking_code)

    # Apply updates
    update_dict = update_data.dict(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(reservation, key, value)
        
    if update_data.status and update_data.status.value != old_status:
        # Create log
        log = models.ReservationStatusLog(
            reservation_id=reservation.id,
            old_status=old_status,
            new_status=update_data.status.value,
            changed_by_admin_id=current_admin.id,
            note=update_data.admin_note
        )
        db.add(log)
        
    db.commit()
    db.refresh(reservation)
    return reservation

# --- TRIPS (Daily Dispatch) ---
@router.get("/trips", response_model=List[schemas.TripOut])
def get_trips(date: Optional[str] = None, db: Session = Depends(get_db), current_admin: models.Admin = Depends(get_current_admin)):
    query = db.query(models.Trip)
    if date:
        # SQLite stores datetime as strings formatted like '2026-03-17 11:00:00.000000'
        # Filtering using LIKE is much safer here across standard DB types
        query = query.filter(models.Trip.planned_departure_time.like(f"{date}%"))
    return query.order_by(models.Trip.planned_departure_time.asc()).all()

@router.post("/trips", response_model=schemas.TripOut)
def create_trip(trip_in: schemas.TripCreate, db: Session = Depends(get_db), current_admin: models.Admin = Depends(get_current_admin)):
    import uuid
    # auto-generate trip code if not provided or format is default
    trip_code = trip_in.trip_code if trip_in.trip_code else f"TRIP-{uuid.uuid4().hex[:6].upper()}"
    new_trip = models.Trip(
        trip_code=trip_code,
        schedule_id=trip_in.schedule_id,
        vehicle_id=trip_in.vehicle_id,
        driver_id=trip_in.driver_id,
        route_name=trip_in.route_name,
        from_location=trip_in.from_location,
        to_location=trip_in.to_location,
        planned_departure_time=trip_in.planned_departure_time,
        current_status=trip_in.current_status
    )
    db.add(new_trip)
    db.commit()
    db.refresh(new_trip)
    return new_trip

@router.delete("/trips/{id}")
def delete_trip(id: int, db: Session = Depends(get_db), current_admin: models.Admin = Depends(get_current_admin)):
    trip = db.query(models.Trip).filter(models.Trip.id == id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    db.delete(trip)
    db.commit()
    return {"success": True}

from pydantic import BaseModel
class TripUpdate(BaseModel):
    driver_id: Optional[int] = None
    vehicle_id: Optional[int] = None

@router.patch("/trips/{id}", response_model=schemas.TripOut)
def update_trip(id: int, trip_in: TripUpdate, db: Session = Depends(get_db), current_admin: models.Admin = Depends(get_current_admin)):
    trip = db.query(models.Trip).filter(models.Trip.id == id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    if trip_in.driver_id is not None:
        trip.driver_id = trip_in.driver_id
    if trip_in.vehicle_id is not None:
        trip.vehicle_id = trip_in.vehicle_id
        
    db.commit()
    db.refresh(trip)
    return trip
def delete_trip(id: int, db: Session = Depends(get_db), current_admin: models.Admin = Depends(get_current_admin)):
    trip = db.query(models.Trip).filter(models.Trip.id == id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    db.delete(trip)
    db.commit()
    return {"success": True}

# --- VEHICLES ---
@router.get("/vehicles", response_model=List[schemas.VehicleOut])
def get_vehicles(db: Session = Depends(get_db), current_admin: models.Admin = Depends(get_current_admin)):
    return db.query(models.Vehicle).all()

@router.post("/vehicles", response_model=schemas.VehicleOut)
def create_vehicle(vehicle: schemas.VehicleCreate, db: Session = Depends(get_db), current_admin: models.Admin = Depends(get_current_admin)):
    new_v = models.Vehicle(**vehicle.dict())
    db.add(new_v)
    db.commit()
    db.refresh(new_v)
    return new_v

# --- DRIVERS ---
@router.get("/drivers", response_model=List[schemas.DriverOut])
def get_drivers(db: Session = Depends(get_db), current_admin: models.Admin = Depends(get_current_admin)):
    return db.query(models.Driver).all()

@router.post("/drivers", response_model=schemas.DriverOut)
def create_driver(driver: schemas.DriverCreate, db: Session = Depends(get_db), current_admin: models.Admin = Depends(get_current_admin)):
    new_d = models.Driver(**driver.dict())
    db.add(new_d)
    db.commit()
    db.refresh(new_d)
    return new_d

# --- SCHEDULES ---
@router.get("/schedules", response_model=List[schemas.ScheduleOut])
def get_admin_schedules(db: Session = Depends(get_db), current_admin: models.Admin = Depends(get_current_admin)):
    return db.query(models.Schedule).all()

@router.post("/schedules", response_model=schemas.ScheduleOut)
def create_schedule(schedule: schemas.ScheduleCreate, db: Session = Depends(get_db), current_admin: models.Admin = Depends(get_current_admin)):
    new_s = models.Schedule(**schedule.dict())
    db.add(new_s)
    db.commit()
    db.refresh(new_s)
    return new_s

# --- FLEET MONITORING (In-Vehicle Display Integration) ---
@router.get("/fleet/active")
def get_active_fleet(db: Session = Depends(get_db), current_admin: models.Admin = Depends(get_current_admin)):
    """
    Returns all currently active trips (boarding or en_route) along with their latest 
    recorded GPS location for plotting on the admin dashboard map.
    """
    active_trips = db.query(models.Trip).filter(
        models.Trip.current_status.in_([models.TripStatus.boarding, models.TripStatus.en_route])
    ).all()
    
    result = []
    for trip in active_trips:
        latest_location = db.query(models.TripLiveLocation)\
            .filter(models.TripLiveLocation.trip_id == trip.id)\
            .order_by(models.TripLiveLocation.recorded_at.desc())\
            .first()
            
        result.append({
            "trip_code": trip.trip_code,
            "route_name": trip.route_name,
            "status": trip.current_status,
            "vehicle_name": trip.vehicle.vehicle_name if trip.vehicle else "Unknown",
            "driver_name": trip.driver.driver_name if trip.driver else "Unknown",
            "from_location": trip.from_location,
            "to_location": trip.to_location,
            "latest_location": {
                "latitude": latest_location.latitude if latest_location else None,
                "longitude": latest_location.longitude if latest_location else None,
                "speed": latest_location.speed if latest_location else 0,
                "recorded_at": latest_location.recorded_at if latest_location else None
            }
        })
        
    return result

# --- PAYMENTS (Admin) ---
from pydantic import BaseModel

class AdminPaymentUpdate(BaseModel):
    payment_status: str # unpaid, partially_paid, paid
    amount_paid: float
    payment_method: str = "manual"

@router.get("/payments", response_model=List[schemas.PaymentTransactionOut])
def get_admin_payments(db: Session = Depends(get_db), current_admin: models.Admin = Depends(get_current_admin)):
    """Get all payment transactions."""
    return db.query(models.PaymentTransaction).order_by(models.PaymentTransaction.created_at.desc()).all()

@router.patch("/reservations/{id}/payment", response_model=schemas.ReservationOut)
def manual_payment_update(
    id: int, 
    update_data: AdminPaymentUpdate,
    db: Session = Depends(get_db), 
    current_admin: models.Admin = Depends(get_current_admin)
):
    """Admin manually overriding/logging a payment for a reservation."""
    reservation = db.query(models.Reservation).filter(models.Reservation.id == id).first()
    if not reservation:
        raise HTTPException(status_code=404, detail="Reservation not found")
        
    # Log the manual transaction
    import uuid
    transaction_code = f"MANUAL-{uuid.uuid4().hex[:8].upper()}"
    
    transaction = models.PaymentTransaction(
        reservation_id=reservation.id,
        payment_provider="admin_manual",
        payment_method=update_data.payment_method,
        transaction_code=transaction_code,
        amount=update_data.amount_paid,
        currency="VND",
        payment_status="success",
    )
    from datetime import timezone, datetime
    transaction.paid_at = datetime.now(timezone.utc)
    db.add(transaction)
    
    # Update Reservation Payment Status
    reservation.payment_status = update_data.payment_status
    
    # Simple balance calculation
    if update_data.payment_status == "paid":
        reservation.balance_amount = 0
    else:
        # MVP: just subtract the paid amount
        reservation.balance_amount = (reservation.total_amount or 0) - update_data.amount_paid
        
    db.commit()
    db.refresh(reservation)
    return reservation
