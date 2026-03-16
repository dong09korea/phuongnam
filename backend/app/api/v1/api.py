from fastapi import APIRouter, APIRouter

api_router = APIRouter()

from .endpoints import public, admin, live, payments

api_router.include_router(public.router, prefix="/public", tags=["Public"])
api_router.include_router(admin.router, prefix="/admin", tags=["Admin"])
api_router.include_router(live.router, prefix="/live", tags=["In-Vehicle Display"])
api_router.include_router(payments.router, prefix="/payments", tags=["Payments"])
