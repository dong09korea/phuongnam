from sqlalchemy.orm import Session
from app.database import SessionLocal, engine, Base
from app import models
from app.core.security import get_password_hash

def seed_db():
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    
    db: Session = SessionLocal()
    
    print("Seeding Admin User...")
    if not db.query(models.Admin).filter(models.Admin.username == "admin").first():
        admin = models.Admin(
            username="admin",
            password_hash=get_password_hash("1234"),
            role="superadmin"
        )
        db.add(admin)
        
    print("Seeding Vehicles...")
    if not db.query(models.Vehicle).first():
        db.add_all([
            models.Vehicle(vehicle_name="Premium Limo A", vehicle_type="Limousine", plate_number="51H-123.45", seat_count=9, luggage_capacity=10),
            models.Vehicle(vehicle_name="Premium Limo B", vehicle_type="Limousine", plate_number="51H-678.90", seat_count=9, luggage_capacity=10),
            models.Vehicle(vehicle_name="Shuttle Minibus C", vehicle_type="Minibus", plate_number="51F-111.11", seat_count=16, luggage_capacity=15),
        ])
        
    print("Seeding Drivers...")
    if not db.query(models.Driver).first():
        db.add_all([
            models.Driver(driver_name="Nguyen Van A", phone="0901234567", license_info="D Class"),
            models.Driver(driver_name="Tran Van B", phone="0911234567", license_info="D Class"),
            models.Driver(driver_name="Le Van C", phone="0921234567", license_info="E Class"),
        ])
        
    print("Seeding Schedules...")
    if not db.query(models.Schedule).first():
        db.add_all([
            models.Schedule(route_name="HCMC -> Vung Tau (Morning)", from_location="HCMC District 1", to_location="Vung Tau City Center", departure_time="08:00", estimated_duration=2.5, base_price=250000, available_vehicle_type="Limousine"),
            models.Schedule(route_name="HCMC -> Vung Tau (Noon)", from_location="HCMC District 1", to_location="Vung Tau City Center", departure_time="12:00", estimated_duration=2.5, base_price=250000, available_vehicle_type="Limousine"),
            models.Schedule(route_name="Vung Tau -> HCMC (Afternoon)", from_location="Vung Tau City Center", to_location="HCMC District 1", departure_time="14:00", estimated_duration=2.5, base_price=250000, available_vehicle_type="Limousine"),
            models.Schedule(route_name="Vung Tau -> HCMC (Evening)", from_location="Vung Tau City Center", to_location="HCMC District 1", departure_time="18:00", estimated_duration=2.5, base_price=250000, available_vehicle_type="Limousine"),
        ])
        
    db.commit() # ensure vehicle and drivers are flushed to use their IDs below
    
    print("Seeding Active Trips (For Live TV MVP)...")
    if not db.query(models.Trip).first():
        import datetime
        now = datetime.datetime.now(datetime.timezone.utc)
        
        vehicle = db.query(models.Vehicle).first()
        driver = db.query(models.Driver).first()
        
        if vehicle and driver:
            db.add_all([
                models.Trip(
                    trip_code="LIVE-VN-1",
                    vehicle_id=vehicle.id,
                    driver_id=driver.id,
                    route_name="HCMC -> Vung Tau",
                    from_location="HCMC District 1",
                    to_location="Vung Tau City Center",
                    planned_departure_time=now,
                    current_status=models.TripStatus.en_route
                )
            ])
            db.commit()
            
            trip = db.query(models.Trip).first()
            # Feed some initial GPS locations
            db.add_all([
                models.TripLiveLocation(trip_id=trip.id, latitude=10.7769, longitude=106.7009, speed=40, heading=90),
                models.TripLiveLocation(trip_id=trip.id, latitude=10.6000, longitude=106.9000, speed=65, heading=105) # Halfway there
            ])
        
    try:
        db.commit()
        print("Database seeded successfully!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
