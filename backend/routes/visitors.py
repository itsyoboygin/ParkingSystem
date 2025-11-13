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

router = APIRouter(prefix="/api/visitors", tags=["visitors"])

class VisitorEntry(BaseModel):
    license_plate: str
    space_id: int

class VisitorExit(BaseModel):
    license_plate: str

@router.get("/")
def get_visitors(
    limit: int = 100,
    offset: int = 0,
    connection: oracledb.Connection = Depends(get_db_connection)
):
    """Get visitor parking records"""
    try:
        visitors = models.get_visitors(connection, limit, offset)
        return {"data": visitors, "count": len(visitors)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/active")
def get_active_visitors(
    connection: oracledb.Connection = Depends(get_db_connection)
):
    """Get currently parked visitors"""
    try:
        query = """
            SELECT record_id, space_id, license_plate, arrival_time, parking_fee
            FROM VisitorParkingRecord
            WHERE departure_time IS NULL
            ORDER BY arrival_time DESC
        """
        visitors = models.execute_query(connection, query)
        return {"data": visitors, "count": len(visitors)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats")
def get_visitor_stats(
    connection: oracledb.Connection = Depends(get_db_connection)
):
    """Get visitor parking statistics"""
    try:
        query = """
            SELECT 
                COUNT(*) as total_visitors_today,
                COUNT(CASE WHEN departure_time IS NULL THEN 1 END) as currently_parked,
                COALESCE(SUM(parking_fee), 0) as total_revenue_today
            FROM VisitorParkingRecord
            WHERE TRUNC(arrival_time) = TRUNC(SYSDATE)
        """
        result = models.execute_query(connection, query)
        return result[0] if result else {}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/entry")
def visitor_entry(
    visitor: VisitorEntry,
    connection: oracledb.Connection = Depends(get_db_connection)
):
    """Record visitor entry"""
    try:
        # Get next record ID
        cursor = connection.cursor()
        cursor.execute("SELECT NVL(MAX(record_id), 0) + 1 FROM VisitorParkingRecord")
        new_id = cursor.fetchone()[0]
        cursor.close()
        
        # Insert visitor record
        query = """
            INSERT INTO VisitorParkingRecord (
                record_id, space_id, license_plate, arrival_time, departure_time, parking_fee
            )
            VALUES (
                :record_id, :space_id, :license_plate, SYSTIMESTAMP, NULL, 0
            )
        """
        models.execute_update(connection, query, {
            "record_id": new_id,
            "space_id": visitor.space_id,
            "license_plate": visitor.license_plate
        })
        
        # Update space availability
        update_query = """
            UPDATE ParkingSpace
            SET spaces_available = spaces_available - 1
            WHERE space_id = :space_id AND space_type = 'Visitor'
        """
        models.execute_update(connection, update_query, {"space_id": visitor.space_id})
        
        return {
            "message": "Visitor entry recorded successfully",
            "record_id": new_id,
            "license_plate": visitor.license_plate
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/exit")
def visitor_exit(
    visitor: VisitorExit,
    connection: oracledb.Connection = Depends(get_db_connection)
):
    """Record visitor exit and calculate parking fee"""
    try:
        cursor = connection.cursor()
        
        # Get arrival time and space_id
        query = """
            SELECT record_id, arrival_time, space_id
            FROM VisitorParkingRecord
            WHERE license_plate = :license_plate
            AND departure_time IS NULL
        """
        result = models.execute_query(connection, query, {"license_plate": visitor.license_plate})
        
        if not result:
            raise HTTPException(status_code=404, detail="Active visitor record not found")
        
        record = result[0]
        record_id = record['record_id']
        arrival_time = record['arrival_time']
        space_id = record['space_id']
        
        # Calculate duration and fee using PL/SQL block
        pl_sql = """
        DECLARE
            v_arrival_time TIMESTAMP;
            v_departure_time TIMESTAMP;
            v_duration_hours NUMBER;
            v_parking_fee NUMBER;
            v_hourly_rate NUMBER;
        BEGIN
            SELECT arrival_time INTO v_arrival_time
            FROM VisitorParkingRecord
            WHERE record_id = :record_id;
            
            v_departure_time := SYSTIMESTAMP;
            
            -- Calculate duration in hours (round up)
            v_duration_hours := CEIL(
                EXTRACT(DAY FROM (v_departure_time - v_arrival_time)) * 24 +
                EXTRACT(HOUR FROM (v_departure_time - v_arrival_time)) +
                EXTRACT(MINUTE FROM (v_departure_time - v_arrival_time)) / 60
            );
            
            -- Apply day/night tariff
            -- Day rate (6:00-18:00): 15,000 VND/hour
            -- Night rate (18:00-6:00): 10,000 VND/hour
            IF EXTRACT(HOUR FROM v_departure_time) BETWEEN 6 AND 17 THEN
                v_hourly_rate := 15000;
            ELSE
                v_hourly_rate := 10000;
            END IF;
            
            v_parking_fee := v_duration_hours * v_hourly_rate;
            
            -- Update visitor record
            UPDATE VisitorParkingRecord
            SET departure_time = v_departure_time,
                parking_fee = v_parking_fee
            WHERE record_id = :record_id;
            
            -- Free up space
            UPDATE ParkingSpace
            SET spaces_available = spaces_available + 1
            WHERE space_id = :space_id;
            
            :fee := v_parking_fee;
            
            COMMIT;
        END;
        """
        
        fee_var = cursor.var(int)
        cursor.execute(pl_sql, {
            "record_id": record_id,
            "space_id": space_id,
            "fee": fee_var
        })
        
        parking_fee = fee_var.getvalue()
        cursor.close()
        
        return {
            "message": "Visitor exit recorded successfully",
            "license_plate": visitor.license_plate,
            "parking_fee": parking_fee,
            "record_id": record_id
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{record_id}")
def get_visitor_record(
    record_id: int,
    connection: oracledb.Connection = Depends(get_db_connection)
):
    """Get specific visitor record"""
    try:
        query = """
            SELECT record_id, space_id, license_plate, arrival_time, 
                   departure_time, parking_fee
            FROM VisitorParkingRecord
            WHERE record_id = :record_id
        """
        result = models.execute_query(connection, query, {"record_id": record_id})
        if not result:
            raise HTTPException(status_code=404, detail="Visitor record not found")
        return result[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))