from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from datetime import datetime
import oracledb
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db.connect import get_db_connection
import models

router = APIRouter(prefix="/api/subscriptions", tags=["subscriptions"])

class SubscriptionCreate(BaseModel):
    vehicle_id: int
    resident_id: int
    subscription_type: str  # 'monthly', 'quarterly', 'yearly'
    cost: float

class SubscriptionRenew(BaseModel):
    renewal_type: str = "SAME"  # 'SAME' or 'CHANGE'
    new_subscription_type: str = None  # 'monthly', 'quarterly', 'yearly'

@router.get("/")
def get_subscriptions(
    limit: int = 100,
    offset: int = 0,
    connection: oracledb.Connection = Depends(get_db_connection)
):
    """Get list of parking subscriptions"""
    try:
        subscriptions = models.get_subscriptions(connection, limit, offset)
        return {"data": subscriptions, "count": len(subscriptions)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/expiring")
def get_expiring_subscriptions(
    days: int = 7,
    connection: oracledb.Connection = Depends(get_db_connection)
):
    """Get subscriptions expiring within specified days"""
    try:
        subscriptions = models.get_expiring_subscriptions(connection, days)
        return {"data": subscriptions, "count": len(subscriptions)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{subscription_id}")
def get_subscription(
    subscription_id: int,
    connection: oracledb.Connection = Depends(get_db_connection)
):
    """Get specific subscription details"""
    try:
        query = """
            SELECT ps.subscription_id, ps.vehicle_id, ps.resident_id,
                   ps.is_monthly, ps.is_quarterly, ps.is_yearly,
                   ps.start_date, ps.expiration_date, ps.cost,
                   v.license_plate, r.name as resident_name
            FROM ParkingSubscription ps
            JOIN Vehicle v ON ps.vehicle_id = v.vehicle_id
            JOIN Resident r ON ps.resident_id = r.resident_id
            WHERE ps.subscription_id = :subscription_id
        """
        result = models.execute_query(connection, query, {"subscription_id": subscription_id})
        if not result:
            raise HTTPException(status_code=404, detail="Subscription not found")
        return result[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/")
def create_subscription(
    subscription: SubscriptionCreate,
    connection: oracledb.Connection = Depends(get_db_connection)
):
    """Create new parking subscription"""
    try:
        # Get next subscription ID
        cursor = connection.cursor()
        cursor.execute("SELECT NVL(MAX(subscription_id), 0) + 1 FROM ParkingSubscription")
        new_id = cursor.fetchone()[0]
        cursor.close()
        
        # Determine subscription flags
        is_monthly = 1 if subscription.subscription_type == 'monthly' else 0
        is_quarterly = 1 if subscription.subscription_type == 'quarterly' else 0
        is_yearly = 1 if subscription.subscription_type == 'yearly' else 0
        
        # Calculate expiration date
        if subscription.subscription_type == 'monthly':
            expiration_clause = "ADD_MONTHS(SYSDATE, 1)"
        elif subscription.subscription_type == 'quarterly':
            expiration_clause = "ADD_MONTHS(SYSDATE, 3)"
        else:  # yearly
            expiration_clause = "ADD_MONTHS(SYSDATE, 12)"
        
        query = f"""
            INSERT INTO ParkingSubscription (
                subscription_id, vehicle_id, resident_id,
                is_monthly, is_quarterly, is_yearly,
                start_date, expiration_date, cost
            )
            VALUES (
                :subscription_id, :vehicle_id, :resident_id,
                :is_monthly, :is_quarterly, :is_yearly,
                SYSDATE, {expiration_clause}, :cost
            )
        """
        
        models.execute_update(connection, query, {
            "subscription_id": new_id,
            "vehicle_id": subscription.vehicle_id,
            "resident_id": subscription.resident_id,
            "is_monthly": is_monthly,
            "is_quarterly": is_quarterly,
            "is_yearly": is_yearly,
            "cost": subscription.cost
        })
        
        return {"message": "Subscription created successfully", "subscription_id": new_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{subscription_id}/renew")
def renew_subscription(
    subscription_id: int,
    renewal: SubscriptionRenew,
    connection: oracledb.Connection = Depends(get_db_connection)
):
    """Renew parking subscription"""
    try:
        # Get current subscription details
        query = """
            SELECT expiration_date,
                   CASE
                       WHEN is_monthly = 1 THEN 'monthly'
                       WHEN is_quarterly = 1 THEN 'quarterly'
                       WHEN is_yearly = 1 THEN 'yearly'
                   END as subscription_type,
                   cost, vehicle_id, resident_id
            FROM ParkingSubscription
            WHERE subscription_id = :subscription_id
        """
        result = models.execute_query(connection, query, {"subscription_id": subscription_id})
        
        if not result:
            raise HTTPException(status_code=404, detail="Subscription not found")
        
        current_sub = result[0]
        sub_type = renewal.new_subscription_type if renewal.renewal_type == 'CHANGE' and renewal.new_subscription_type else current_sub['subscription_type']
        
        # Get next subscription ID
        cursor = connection.cursor()
        cursor.execute("SELECT NVL(MAX(subscription_id), 0) + 1 FROM ParkingSubscription")
        new_id = cursor.fetchone()[0]
        cursor.close()
        
        # Determine subscription flags
        is_monthly = 1 if sub_type == 'monthly' else 0
        is_quarterly = 1 if sub_type == 'quarterly' else 0
        is_yearly = 1 if sub_type == 'yearly' else 0
        
        # Calculate new dates
        if sub_type == 'monthly':
            months = 1
        elif sub_type == 'quarterly':
            months = 3
        else:  # yearly
            months = 12
        
        query = f"""
            INSERT INTO ParkingSubscription (
                subscription_id, vehicle_id, resident_id,
                is_monthly, is_quarterly, is_yearly,
                start_date, expiration_date, cost
            )
            VALUES (
                :subscription_id, :vehicle_id, :resident_id,
                :is_monthly, :is_quarterly, :is_yearly,
                :start_date + 1, ADD_MONTHS(:start_date + 1, :months), :cost
            )
        """
        
        models.execute_update(connection, query, {
            "subscription_id": new_id,
            "vehicle_id": current_sub['vehicle_id'],
            "resident_id": current_sub['resident_id'],
            "is_monthly": is_monthly,
            "is_quarterly": is_quarterly,
            "is_yearly": is_yearly,
            "start_date": current_sub['expiration_date'],
            "months": months,
            "cost": current_sub['cost']
        })
        
        return {"message": "Subscription renewed successfully", "new_subscription_id": new_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{subscription_id}")
def delete_subscription(
    subscription_id: int,
    connection: oracledb.Connection = Depends(get_db_connection)
):
    """Delete subscription"""
    try:
        query = "DELETE FROM ParkingSubscription WHERE subscription_id = :subscription_id"
        rowcount = models.execute_update(connection, query, {"subscription_id": subscription_id})
        
        if rowcount == 0:
            raise HTTPException(status_code=404, detail="Subscription not found")
        
        return {"message": "Subscription deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))