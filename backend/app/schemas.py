from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime
from app.models import TripType, BookingStatus, PaymentStatus

# --- Generic Base ---
class ConfiguredBaseModel(BaseModel):
    class Config:
        from_attributes = True

# --- Customer ---
class CustomerBase(ConfiguredBaseModel):
    name: str
    phone: str
    zalo_id: Optional[str] = None
    whatsapp: Optional[str] = None
    notes: Optional[str] = None

class CustomerCreate(CustomerBase):
    pass

class CustomerOut(CustomerBase):
    id: int
    created_at: datetime

# --- Vehicle ---
class VehicleBase(ConfiguredBaseModel):
    vehicle_name: str
    vehicle_type: str
    plate_number: str
    seat_count: int
    luggage_capacity: int
    active: bool = True

class VehicleCreate(VehicleBase):
    pass

class VehicleUpdate(VehicleBase):
    vehicle_name: Optional[str] = None
    vehicle_type: Optional[str] = None
    plate_number: Optional[str] = None
    seat_count: Optional[int] = None
    luggage_capacity: Optional[int] = None

class VehicleOut(VehicleBase):
    id: int
    created_at: datetime

# --- Driver ---
class DriverBase(ConfiguredBaseModel):
    driver_name: str
    phone: str
    license_info: Optional[str] = None
    active: bool = True

class DriverCreate(DriverBase):
    pass

class DriverUpdate(DriverBase):
    driver_name: Optional[str] = None
    phone: Optional[str] = None
    license_info: Optional[str] = None
    active: Optional[bool] = None

class DriverOut(DriverBase):
    id: int
    created_at: datetime

# --- Schedule ---
class ScheduleBase(ConfiguredBaseModel):
    route_name: str
    from_location: str
    to_location: str
    departure_time: str
    estimated_duration: float
    base_price: float
    available_vehicle_type: str
    active: bool = True

class ScheduleCreate(ScheduleBase):
    pass

class ScheduleUpdate(ScheduleBase):
    route_name: Optional[str] = None
    from_location: Optional[str] = None
    to_location: Optional[str] = None
    departure_time: Optional[str] = None
    estimated_duration: Optional[float] = None
    base_price: Optional[float] = None
    available_vehicle_type: Optional[str] = None
    active: Optional[bool] = None

class ScheduleOut(ScheduleBase):
    id: int
    booked_seats: List[str] = []

# --- Reservation ---
class ReservationBase(ConfiguredBaseModel):
    trip_type: TripType = TripType.one_way
    from_location: str
    to_location: str
    depart_date: str
    depart_time: str
    return_date: Optional[str] = None
    return_time: Optional[str] = None
    passenger_count: int = Field(..., gt=0)
    luggage_count: int = 0
    special_note: Optional[str] = None
    seat_number: Optional[str] = None

class ReservationCreate(ReservationBase):
    customer: CustomerCreate # nested creation

class ReservationUpdate(ConfiguredBaseModel):
    status: Optional[BookingStatus] = None
    payment_status: Optional[PaymentStatus] = None
    assigned_vehicle_id: Optional[int] = None
    assigned_driver_id: Optional[int] = None
    admin_note: Optional[str] = None
    total_amount: Optional[float] = None
    deposit_amount: Optional[float] = None
    balance_amount: Optional[float] = None

class ReservationOut(ReservationBase):
    id: int
    booking_code: str
    status: BookingStatus
    payment_status: PaymentStatus
    customer_id: int
    assigned_vehicle_id: Optional[int] = None
    assigned_driver_id: Optional[int] = None
    total_amount: Optional[float] = None
    deposit_amount: Optional[float] = None
    balance_amount: Optional[float] = None
    admin_note: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    # Optional nested info
    customer: Optional[CustomerOut] = None
    assigned_vehicle: Optional[VehicleOut] = None
    assigned_driver: Optional[DriverOut] = None
    payment_transactions: List['PaymentTransactionOut'] = []

# --- Payments ---
class PaymentTransactionBase(ConfiguredBaseModel):
    payment_provider: str
    payment_method: str
    amount: float
    currency: str = "VND"
    payment_status: str

class PaymentTransactionCreate(PaymentTransactionBase):
    reservation_id: int

class PaymentTransactionOut(PaymentTransactionBase):
    id: int
    reservation_id: int
    transaction_code: Optional[str] = None
    payment_url: Optional[str] = None
    paid_at: Optional[datetime] = None
    created_at: datetime

ReservationOut.update_forward_refs()

# --- Admin Auth ---
class AdminLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# --- In-Vehicle Display (Trips) ---
from app.models import TripStatus

class TripLiveLocationBase(ConfiguredBaseModel):
    latitude: float
    longitude: float
    speed: Optional[float] = None
    heading: Optional[float] = None

class TripLiveLocationCreate(TripLiveLocationBase):
    pass

class TripLiveLocationOut(TripLiveLocationBase):
    id: int
    trip_id: int
    recorded_at: datetime

class TripBase(ConfiguredBaseModel):
    trip_code: str
    route_name: str
    from_location: str
    to_location: str
    planned_departure_time: datetime
    actual_departure_time: Optional[datetime] = None
    estimated_arrival_time: Optional[datetime] = None
    current_status: TripStatus = TripStatus.scheduled

class TripCreate(TripBase):
    schedule_id: Optional[int] = None
    vehicle_id: int
    driver_id: int

class TripOut(TripBase):
    id: int
    schedule_id: Optional[int] = None
    vehicle_id: int
    driver_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    # Nested info
    vehicle: Optional[VehicleOut] = None
    driver: Optional[DriverOut] = None
    live_locations: List[TripLiveLocationOut] = []

class TripLocationUpdate(BaseModel):
    """Payload expected from GPS Webhooks / Devices"""
    latitude: float
    longitude: float
    speed: Optional[float] = None
    heading: Optional[float] = None
