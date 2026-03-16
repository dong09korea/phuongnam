from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
import uuid

from app import models, schemas
from app.database import get_db

router = APIRouter()

@router.post("/initialize", response_model=schemas.PaymentTransactionOut)
def initialize_payment(
    booking_code: str, 
    payment_method: str, # e.g. "bank_transfer", "vnpay", "zalopay"
    payment_type: str, # "deposit" or "full"
    db: Session = Depends(get_db)
):
    """
    Initialize a payment transaction for a booking.
    Returns transaction details. If online gateway, payment_url would be generated here.
    """
    reservation = db.query(models.Reservation).filter(models.Reservation.booking_code == booking_code).first()
    if not reservation:
        raise HTTPException(status_code=404, detail="Booking not found")
        
    # Calculate amount to pay
    if not reservation.total_amount:
        raise HTTPException(status_code=400, detail="Booking total amount is not set. Cannot initialize payment.")
        
    amount_to_pay = reservation.total_amount
    if payment_type == "deposit":
        # MVP logic: assume 30% deposit if not explicitly set
        amount_to_pay = reservation.deposit_amount or (reservation.total_amount * 0.3)
        
    transaction_code = f"TXN-{uuid.uuid4().hex[:8].upper()}"
    
    # Create pending transaction
    transaction = models.PaymentTransaction(
        reservation_id=reservation.id,
        payment_provider="manual" if payment_method in ["bank_transfer", "cash"] else payment_method,
        payment_method=payment_method,
        transaction_code=transaction_code,
        amount=amount_to_pay,
        currency="VND",
        payment_status="pending"
    )
    
    # Future Strategy Pattern: If this was VNPAY, we would call the VNPAY adapter here
    if payment_method not in ["bank_transfer", "cash"]:
        # Mock payment URL for online gateways
        transaction.payment_url = f"https://mock-gateway.com/checkout?txn={transaction_code}"
    
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    
    return transaction

@router.post("/webhook/{provider}")
def payment_webhook(provider: str, payload: dict, db: Session = Depends(get_db)):
    """
    Webhook for external payment gateways (ZaloPay, VNPAY, etc).
    """
    # MVP mock handling
    txn_code = payload.get("transaction_code")
    status = payload.get("status", "success") # "success", "failed"
    
    if not txn_code:
        raise HTTPException(status_code=400, detail="Missing transaction_code fallback")
        
    transaction = db.query(models.PaymentTransaction).filter(models.PaymentTransaction.transaction_code == txn_code).first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
        
    transaction.payment_status = status
    transaction.raw_response = str(payload)
    
    if status == "success":
        from datetime import timezone
        transaction.paid_at = datetime.now(timezone.utc)
        
        # update reservation
        reservation = transaction.reservation
        if transaction.amount >= reservation.total_amount or transaction.amount >= reservation.balance_amount:
            reservation.payment_status = models.PaymentStatus.paid
            reservation.balance_amount = 0
        else:
            reservation.payment_status = models.PaymentStatus.partially_paid
            # naive calculation for MVP
            reservation.balance_amount = reservation.total_amount - transaction.amount
            
    db.commit()
    return {"message": f"Webhook processed successfully for {provider}"}
