from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Any
import math

from app.database import get_db
from app import models, schemas

router = APIRouter()

def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance in km using Haversine formula"""
    R = 6371.0 # Earth radius in kilometers
    
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    distance = R * c
    return distance

@router.post("/trips/{trip_id}/location", response_model=schemas.TripLiveLocationOut)
def record_live_location(
    trip_id: int, 
    location_in: schemas.TripLocationUpdate,
    db: Session = Depends(get_db)
):
    """
    Ingest GPS data from a vehicle tracker or webhook.
    """
    trip = db.query(models.Trip).filter(models.Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
        
    new_location = models.TripLiveLocation(
        trip_id=trip_id,
        latitude=location_in.latitude,
        longitude=location_in.longitude,
        speed=location_in.speed,
        heading=location_in.heading
    )
    db.add(new_location)
    db.commit()
    db.refresh(new_location)
    return new_location

@router.get("/trips/{trip_code}/status", response_model=Any)
def get_trip_live_status(
    trip_code: str,
    db: Session = Depends(get_db)
):
    """
    Get the current live status for the In-Vehicle display TV.
    Calculates progress and returns latest coordinates.
    """
    trip = db.query(models.Trip).filter(models.Trip.trip_code == trip_code).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
        
    latest_location = db.query(models.TripLiveLocation)\
        .filter(models.TripLiveLocation.trip_id == trip.id)\
        .order_by(models.TripLiveLocation.recorded_at.desc())\
        .first()
        
    # Mocking standard destination coordinates for calculation
    # In a full app, these would be retrieved from a mapping service
    dest_coords = {
        "HCMC District 1": {"lat": 10.7769, "lon": 106.7009},
        "Vung Tau City Center": {"lat": 10.3459, "lon": 107.0843},
        "Tan Son Nhat Airport": {"lat": 10.8185, "lon": 106.6588}
    }
    
    remaining_distance = None
    progress_percent = 0
    estimated_mins_remaining = None
    
    if latest_location and trip.to_location in dest_coords:
        dest_lat = dest_coords[trip.to_location]["lat"]
        dest_lon = dest_coords[trip.to_location]["lon"]
        
        remaining_distance = calculate_distance(
            latest_location.latitude, 
            latest_location.longitude,
            dest_lat,
            dest_lon
        )
        
        # Simple assumed total logic for mockup UI
        total_assumed_dist = 110.0 # avg HCMC to Vung Tau
        progress_percent = max(0, min(100, 100 - ((remaining_distance / total_assumed_dist) * 100)))
        
        # Estimate based on avg speed of 60km/h
        current_speed = latest_location.speed if latest_location.speed and latest_location.speed > 0 else 60.0
        estimated_hours = remaining_distance / current_speed
        estimated_mins_remaining = int(estimated_hours * 60)
        
    return {
        "trip_code": trip.trip_code,
        "route_name": trip.route_name,
        "from_location": trip.from_location,
        "to_location": trip.to_location,
        "status": trip.current_status,
        "vehicle_name": trip.vehicle.vehicle_name if trip.vehicle else None,
        "latest_location": {
            "latitude": latest_location.latitude if latest_location else None,
            "longitude": latest_location.longitude if latest_location else None,
            "speed": latest_location.speed if latest_location else None,
            "recorded_at": latest_location.recorded_at if latest_location else None
        },
        "metrics": {
            "progress_percent": round(progress_percent, 1),
            "remaining_distance_km": round(remaining_distance, 1) if remaining_distance else None,
            "estimated_mins_remaining": estimated_mins_remaining
        },
        "messages": [
            "Please keep your seatbelt fastened.",
            "Free Wi-Fi: PhuongNam_VIP | Pass: 12345678"
        ]
    }
