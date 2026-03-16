from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey, Text, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from .database import Base

class TripType(str, enum.Enum):
    one_way = "one_way"
    round_trip = "round_trip"

class BookingStatus(str, enum.Enum):
    pending = "pending"
    confirmed = "confirmed"
    assigned = "assigned"
    completed = "completed"
    cancelled = "cancelled"
    no_show = "no_show"

class PaymentStatus(str, enum.Enum):
    unpaid = "unpaid"
    partially_paid = "partially_paid"
    paid = "paid"
    refunded = "refunded"
    failed = "failed"

class Customer(Base):
    __tablename__ = "customers"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=False)
    zalo_id = Column(String(50), nullable=True)
    whatsapp = Column(String(50), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    reservations = relationship("Reservation", back_populates="customer")

class Vehicle(Base):
    __tablename__ = "vehicles"
    
    id = Column(Integer, primary_key=True, index=True)
    vehicle_name = Column(String(100), nullable=False)
    vehicle_type = Column(String(50), nullable=False)
    plate_number = Column(String(20), nullable=False, unique=True)
    seat_count = Column(Integer, nullable=False)
    luggage_capacity = Column(Integer, nullable=False)
    active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    reservations = relationship("Reservation", back_populates="assigned_vehicle")

class Driver(Base):
    __tablename__ = "drivers"
    
    id = Column(Integer, primary_key=True, index=True)
    driver_name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=False)
    license_info = Column(String(100), nullable=True)
    active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    reservations = relationship("Reservation", back_populates="assigned_driver")

class Schedule(Base):
    __tablename__ = "schedules"
    
    id = Column(Integer, primary_key=True, index=True)
    route_name = Column(String(100), nullable=False)
    from_location = Column(String(100), nullable=False)
    to_location = Column(String(100), nullable=False)
    departure_time = Column(String(10), nullable=False) # e.g. "08:00"
    estimated_duration = Column(Float, nullable=False) # hours
    base_price = Column(Float, nullable=False)
    available_vehicle_type = Column(String(50), nullable=False)
    active = Column(Boolean, default=True)

class Admin(Base):
    __tablename__ = "admins"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), default="admin")
    active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Reservation(Base):
    __tablename__ = "reservations"
    
    id = Column(Integer, primary_key=True, index=True)
    booking_code = Column(String(20), unique=True, index=True, nullable=False)
    trip_type = Column(Enum(TripType), nullable=False, default=TripType.one_way)
    from_location = Column(String(100), nullable=False)
    to_location = Column(String(100), nullable=False)
    depart_date = Column(String(20), nullable=False) # "YYYY-MM-DD"
    depart_time = Column(String(10), nullable=False) # "HH:MM"
    return_date = Column(String(20), nullable=True)
    return_time = Column(String(10), nullable=True)
    passenger_count = Column(Integer, nullable=False)
    luggage_count = Column(Integer, default=0)
    special_note = Column(Text, nullable=True)
    
    customer_id = Column(Integer, ForeignKey("customers.id"))
    status = Column(Enum(BookingStatus), nullable=False, default=BookingStatus.pending)
    payment_status = Column(Enum(PaymentStatus), nullable=False, default=PaymentStatus.unpaid)
    
    assigned_vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=True)
    assigned_driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=True)
    
    total_amount = Column(Float, nullable=True)
    deposit_amount = Column(Float, nullable=True, default=0)
    balance_amount = Column(Float, nullable=True, default=0)
    admin_note = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    customer = relationship("Customer", back_populates="reservations")
    assigned_vehicle = relationship("Vehicle", back_populates="reservations")
    assigned_driver = relationship("Driver", back_populates="reservations")
    status_logs = relationship("ReservationStatusLog", back_populates="reservation")
    payment_transactions = relationship("PaymentTransaction", back_populates="reservation", cascade="all, delete-orphan")

class ReservationStatusLog(Base):
    __tablename__ = "reservation_status_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    reservation_id = Column(Integer, ForeignKey("reservations.id"), nullable=False)
    old_status = Column(String(50), nullable=False)
    new_status = Column(String(50), nullable=False)
    changed_by_admin_id = Column(Integer, ForeignKey("admins.id"), nullable=True)
    changed_at = Column(DateTime(timezone=True), server_default=func.now())
    note = Column(Text, nullable=True)
    
    reservation = relationship("Reservation", back_populates="status_logs")

class PaymentTransaction(Base):
    __tablename__ = "payment_transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    reservation_id = Column(Integer, ForeignKey("reservations.id"), nullable=False)
    payment_provider = Column(String(50), nullable=False) # 'manual', 'vnpay', 'zalopay'
    payment_method = Column(String(50), nullable=False) # 'cash', 'bank_transfer', 'credit_card'
    transaction_code = Column(String(100), unique=True, index=True, nullable=True)
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="VND")
    payment_status = Column(String(20), nullable=False) # 'pending', 'success', 'failed', 'refunded'
    payment_url = Column(Text, nullable=True)
    raw_response = Column(Text, nullable=True)
    paid_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    reservation = relationship("Reservation", back_populates="payment_transactions")

class TripStatus(str, enum.Enum):
    scheduled = "scheduled"
    boarding = "boarding"
    en_route = "en_route"
    arrived = "arrived"
    cancelled = "cancelled"

class Trip(Base):
    __tablename__ = "trips"
    
    id = Column(Integer, primary_key=True, index=True)
    trip_code = Column(String(20), unique=True, index=True, nullable=False)
    schedule_id = Column(Integer, ForeignKey("schedules.id"), nullable=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=False)
    
    route_name = Column(String(100), nullable=False)
    from_location = Column(String(100), nullable=False)
    to_location = Column(String(100), nullable=False)
    
    planned_departure_time = Column(DateTime(timezone=True), nullable=False)
    actual_departure_time = Column(DateTime(timezone=True), nullable=True)
    estimated_arrival_time = Column(DateTime(timezone=True), nullable=True)
    
    current_status = Column(Enum(TripStatus), nullable=False, default=TripStatus.scheduled)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    vehicle = relationship("Vehicle")
    driver = relationship("Driver")
    live_locations = relationship("TripLiveLocation", back_populates="trip", cascade="all, delete-orphan")
    trip_status_logs = relationship("TripStatusLog", back_populates="trip", cascade="all, delete-orphan")

class TripLiveLocation(Base):
    __tablename__ = "trip_live_locations"
    
    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    speed = Column(Float, nullable=True) # km/h
    heading = Column(Float, nullable=True) # degrees
    recorded_at = Column(DateTime(timezone=True), server_default=func.now())
    
    trip = relationship("Trip", back_populates="live_locations")

class TripStatusLog(Base):
    __tablename__ = "trip_status_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=False)
    status = Column(Enum(TripStatus), nullable=False)
    note = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    trip = relationship("Trip", back_populates="trip_status_logs")
