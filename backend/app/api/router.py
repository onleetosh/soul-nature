from fastapi import APIRouter

from app.api.routes import checkout, health, orders, products

api_router = APIRouter(prefix="/api")
api_router.include_router(health.router)
api_router.include_router(products.router)
api_router.include_router(orders.router)
api_router.include_router(checkout.router)
