from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import string
import random

from app import models, schemas
from app.database import get_db

router = APIRouter()

def generate_booking_code(length=8):
    chars = string.ascii_uppercase + string.digits
    return ''.join(random.choice(chars) for _ in range(length))

@router.get("/schedules", response_model=List[schemas.ScheduleOut])
def get_schedules(db: Session = Depends(get_db)):
    """Get all active schedules/routes."""
    schedules = db.query(models.Schedule).filter(models.Schedule.active == True).all()
    return schedules

@router.get("/search", response_model=List[schemas.ScheduleOut])
def search_schedules(
    from_location: str,
    to_location: str,
    depart_date: str, # For future filtering if schedules become date-specific
    db: Session = Depends(get_db)
):
    """Search for available schedules between two locations."""
    # In a real app, this might check vehicle availability on that specific date.
    # For MVP, we just return the active schedules matching the route.
    schedules = db.query(models.Schedule).filter(
        models.Schedule.from_location.ilike(f"%{from_location}%"),
        models.Schedule.to_location.ilike(f"%{to_location}%"),
        models.Schedule.active == True
    ).all()
    return schedules

@router.post("/bookings", response_model=schemas.ReservationOut)
def create_booking(booking_in: schemas.ReservationCreate, db: Session = Depends(get_db)):
    """Create a new booking request."""
    # 1. Check or create customer
    customer = db.query(models.Customer).filter(models.Customer.phone == booking_in.customer.phone).first()
    if not customer:
        customer = models.Customer(
            name=booking_in.customer.name,
            phone=booking_in.customer.phone,
            zalo_id=booking_in.customer.zalo_id,
            whatsapp=booking_in.customer.whatsapp,
            notes=booking_in.customer.notes
        )
        db.add(customer)
        db.flush() # get customer.id
    
    # 2. Prevent duplicate booking code
    while True:
        code = generate_booking_code()
        existing = db.query(models.Reservation).filter(models.Reservation.booking_code == code).first()
        if not existing:
            break
            
    # Basic MVP Pricing Logic (e.g. 500k VND per passenger)
    # In a real app, this would query the DB for exact route/vehicle prices
    base_price_per_pax = 500000 
    total_amount = base_price_per_pax * booking_in.passenger_count
    
    # 3. Create reservation
    reservation = models.Reservation(
        booking_code=code,
        trip_type=booking_in.trip_type,
        from_location=booking_in.from_location,
        to_location=booking_in.to_location,
        depart_date=booking_in.depart_date,
        depart_time=booking_in.depart_time,
        return_date=booking_in.return_date,
        return_time=booking_in.return_time,
        passenger_count=booking_in.passenger_count,
        luggage_count=booking_in.luggage_count,
        special_note=booking_in.special_note,
        seat_number=booking_in.seat_number,
        customer_id=customer.id,
        status=models.BookingStatus.pending,
        total_amount=total_amount,
        deposit_amount=total_amount * 0.3 # 30% default deposit
    )
    db.add(reservation)
    db.commit()
    db.refresh(reservation)
    
    # 4. Create log
    log = models.ReservationStatusLog(
        reservation_id=reservation.id,
        old_status="draft",
        new_status=models.BookingStatus.pending.value,
        note="Customer created booking"
    )
    db.add(log)
    db.commit()
    
    return reservation

@router.get("/bookings/{booking_code}", response_model=schemas.ReservationOut)
def get_booking(booking_code: str, db: Session = Depends(get_db)):
    """Get booking details by code."""
    reservation = db.query(models.Reservation).filter(models.Reservation.booking_code == booking_code).first()
    if not reservation:
        raise HTTPException(status_code=404, detail="Booking not found")
    return reservation
