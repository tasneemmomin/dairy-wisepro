from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import numpy as np
from typing import Optional
import random

app = FastAPI(title="DairyOS Pro ML API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============ Models ============

class DemandInput(BaseModel):
    day_of_week: int = 1
    month: int = 1
    temperature: float = 30.0
    festival: int = 0
    previous_demand: float = 100.0


class InventoryInput(BaseModel):
    current_stock: float = 50.0
    daily_usage: float = 20.0
    lead_time: float = 2.0
    safety_stock: float = 10.0


class ChurnInput(BaseModel):
    days_since_order: int = 15
    total_orders: int = 8
    avg_order_value: float = 200.0
    subscription_active: int = 0


class SalesInput(BaseModel):
    month: int = 1
    product_count: int = 8
    avg_price: float = 250.0
    customer_count: int = 50


class SpoilageInput(BaseModel):
    ph_level: float = 6.5
    temperature: float = 4.0
    hours_since_collection: float = 12.0
    color_score: float = 0.9


# ============ Helper functions (simulating ML models) ============

def predict_demand_model(data: DemandInput) -> dict:
    """Predict milk demand using features."""
    base_demand = data.previous_demand

    # Day of week factor (weekends have higher demand)
    day_factors = [1.0, 0.95, 0.9, 0.95, 1.0, 1.15, 1.2]
    day_factor = day_factors[data.day_of_week % 7]

    # Month/season factor
    month_factors = [1.1, 1.05, 1.0, 0.95, 0.9, 0.85, 0.9, 0.95, 1.0, 1.05, 1.1, 1.15]
    month_factor = month_factors[(data.month - 1) % 12]

    # Temperature factor (higher temp = more buttermilk/cold products demand)
    temp_factor = 1.0 + (data.temperature - 25) * 0.005

    # Festival factor
    festival_factor = 1.3 if data.festival else 1.0

    predicted = base_demand * day_factor * month_factor * temp_factor * festival_factor
    predicted = round(predicted + random.uniform(-5, 5), 1)
    confidence = round(random.uniform(0.78, 0.95), 2)

    return {
        "predicted_demand": max(predicted, 10),
        "confidence": confidence,
        "factors": {
            "day_effect": round(day_factor, 2),
            "season_effect": round(month_factor, 2),
            "temperature_effect": round(temp_factor, 2),
            "festival_effect": festival_factor
        },
        "suggestion": f"Based on analysis, prepare approximately {int(predicted)}L of milk for tomorrow. "
                      f"{'Festival season increases demand by 30%. ' if data.festival else ''}"
                      f"Confidence: {int(confidence * 100)}%."
    }


def predict_inventory_model(data: InventoryInput) -> dict:
    """Optimize inventory levels."""
    days_until_stockout = data.current_stock / max(data.daily_usage, 0.1)
    reorder_point = (data.daily_usage * data.lead_time) + data.safety_stock
    economic_order_qty = round(data.daily_usage * 7 + data.safety_stock, 0)
    needs_reorder = data.current_stock <= reorder_point

    return {
        "reorder_quantity": int(economic_order_qty),
        "reorder_point": int(reorder_point),
        "days_until_stockout": round(days_until_stockout, 1),
        "needs_reorder": needs_reorder,
        "suggestion": f"{'URGENT: ' if days_until_stockout < 1 else ''}"
                      f"Order {int(economic_order_qty)} units {'now' if needs_reorder else 'within ' + str(int(days_until_stockout - data.lead_time)) + ' days'}. "
                      f"Current stock will last ~{round(days_until_stockout, 1)} days at current usage rate."
    }


def predict_churn_model(data: ChurnInput) -> dict:
    """Predict customer churn probability."""
    score = 0.0

    # Days since last order
    if data.days_since_order > 30:
        score += 0.35
    elif data.days_since_order > 14:
        score += 0.2
    elif data.days_since_order > 7:
        score += 0.1

    # Order frequency
    if data.total_orders < 3:
        score += 0.25
    elif data.total_orders < 10:
        score += 0.1

    # Average order value
    if data.avg_order_value < 100:
        score += 0.15
    elif data.avg_order_value < 200:
        score += 0.05

    # Subscription
    if not data.subscription_active:
        score += 0.15

    score = min(score + random.uniform(-0.05, 0.05), 1.0)
    score = max(score, 0.05)

    risk_level = "High" if score > 0.6 else "Medium" if score > 0.3 else "Low"

    return {
        "churn_probability": round(score, 2),
        "risk_level": risk_level,
        "key_factors": [
            f"Last order: {data.days_since_order} days ago",
            f"Total orders: {data.total_orders}",
            f"{'No active subscription' if not data.subscription_active else 'Has active subscription'}"
        ],
        "suggestion": f"Churn risk is {risk_level.lower()} ({int(score * 100)}%). "
                      f"{'Consider sending a re-engagement offer or discount coupon.' if score > 0.3 else 'Customer appears engaged. Maintain current service quality.'}"
    }


def predict_sales_model(data: SalesInput) -> dict:
    """Forecast sales for the month."""
    base_revenue = data.customer_count * data.avg_price * 2.5
    month_multipliers = [1.1, 1.0, 0.95, 0.9, 0.85, 0.8, 0.85, 0.9, 1.0, 1.1, 1.15, 1.2]
    multiplier = month_multipliers[(data.month - 1) % 12]

    predicted_revenue = round(base_revenue * multiplier + random.uniform(-2000, 2000), 0)
    predicted_orders = int(data.customer_count * 4.5 * multiplier)
    growth_rate = round(random.uniform(5, 20), 1)

    return {
        "predicted_revenue": int(predicted_revenue),
        "predicted_orders": predicted_orders,
        "growth_rate": growth_rate,
        "suggestion": f"Revenue expected to be around Rs.{int(predicted_revenue):,} this month "
                      f"with approximately {predicted_orders} orders. "
                      f"Growth rate: {growth_rate}%. Focus on top-selling products to maximize revenue."
    }


def predict_spoilage_model(data: SpoilageInput) -> dict:
    """Detect milk spoilage risk."""
    risk_score = 0.0

    # pH level (normal milk: 6.5-6.7)
    if data.ph_level < 6.3 or data.ph_level > 6.9:
        risk_score += 0.35
    elif data.ph_level < 6.4 or data.ph_level > 6.8:
        risk_score += 0.15

    # Temperature (should be < 4C)
    if data.temperature > 8:
        risk_score += 0.35
    elif data.temperature > 4:
        risk_score += 0.15

    # Hours since collection
    if data.hours_since_collection > 48:
        risk_score += 0.3
    elif data.hours_since_collection > 24:
        risk_score += 0.15

    # Color score (1.0 = perfect)
    risk_score += (1.0 - data.color_score) * 0.3

    risk_score = min(risk_score, 1.0)
    quality = "Good" if risk_score < 0.3 else "Warning" if risk_score < 0.6 else "Poor"

    return {
        "spoilage_risk": round(risk_score, 2),
        "quality": quality,
        "suggestion": f"Milk quality is {quality.lower()}. "
                      f"{'Safe for consumption and sale.' if risk_score < 0.3 else 'Monitor closely and consider testing before distribution.' if risk_score < 0.6 else 'High risk of spoilage. Do not distribute. Check storage conditions.'}"
    }


# ============ API Endpoints ============

@app.get("/")
async def root():
    return {"message": "DairyOS Pro ML API", "version": "1.0.0", "status": "running"}


@app.get("/health")
async def health():
    return {"status": "ok", "service": "ml-api"}


@app.post("/predict/demand")
async def predict_demand(data: DemandInput):
    return predict_demand_model(data)


@app.post("/predict/inventory")
async def predict_inventory(data: InventoryInput):
    return predict_inventory_model(data)


@app.post("/predict/churn")
async def predict_churn(data: ChurnInput):
    return predict_churn_model(data)


@app.post("/predict/sales")
async def predict_sales(data: SalesInput):
    return predict_sales_model(data)


@app.post("/predict/spoilage")
async def predict_spoilage(data: SpoilageInput):
    return predict_spoilage_model(data)
