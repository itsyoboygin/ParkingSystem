from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
import oracledb
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db.connect import get_db_connection
import models

router = APIRouter(prefix="/api/vehicles", tags=["vehicles"])

class VehicleCreate(BaseModel):
    resident_id: int
    license_plate: str
    vehicle_type: str

class VehicleUpdate(BaseModel):
    license_plate: str = None
    vehicle_type: str = None

@router.get("/")
def get_vehicles(
    limit: int = 100,
    offset: int = 0,
    connection: oracledb.Connection = Depends(get_db_connection)
):
    """Get list of vehicles"""
    try:
        vehicles = models.get_all_vehicles(connection, limit, offset)
        return {"data": vehicles, "count": len(vehicles)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/resident/{resident_id}")
def get_vehicles_by_resident(
    resident_id: int,
    connection: oracledb.Connection = Depends(get_db_connection)
):
    """Get vehicles for a specific resident"""
    try:
        vehicles = models.get_vehicles_by_resident(connection, resident_id)
        return {"data": vehicles, "count": len(vehicles)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{vehicle_id}")
def get_vehicle(
    vehicle_id: int,
    connection: oracledb.Connection = Depends(get_db_connection)
):
    """Get specific vehicle details"""
    try:
        query = """
            SELECT v.vehicle_id, v.resident_id, v.license_plate, v.vehicle_type,
                   r.name as resident_name
            FROM Vehicle v
            JOIN Resident r ON v.resident_id = r.resident_id
            WHERE v.vehicle_id = :vehicle_id
        """
        result = models.execute_query(connection, query, {"vehicle_id": vehicle_id})
        if not result:
            raise HTTPException(status_code=404, detail="Vehicle not found")
        return result[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/")
def create_vehicle(
    vehicle: VehicleCreate,
    connection: oracledb.Connection = Depends(get_db_connection)
):
    """Register new vehicle"""
    try:
        # Get next vehicle ID
        cursor = connection.cursor()
        cursor.execute("SELECT NVL(MAX(vehicle_id), 0) + 1 FROM Vehicle")
        new_id = cursor.fetchone()[0]
        cursor.close()
        
        query = """
            INSERT INTO Vehicle (vehicle_id, resident_id, license_plate, vehicle_type)
            VALUES (:vehicle_id, :resident_id, :license_plate, :vehicle_type)
        """
        models.execute_update(connection, query, {
            "vehicle_id": new_id,
            "resident_id": vehicle.resident_id,
            "license_plate": vehicle.license_plate,
            "vehicle_type": vehicle.vehicle_type
        })
        
        return {"message": "Vehicle registered successfully", "vehicle_id": new_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{vehicle_id}")
def update_vehicle(
    vehicle_id: int,
    vehicle: VehicleUpdate,
    connection: oracledb.Connection = Depends(get_db_connection)
):
    """Update vehicle information"""
    try:
        updates = []
        params = {"vehicle_id": vehicle_id}
        
        if vehicle.license_plate:
            updates.append("license_plate = :license_plate")
            params["license_plate"] = vehicle.license_plate
        if vehicle.vehicle_type:
            updates.append("vehicle_type = :vehicle_type")
            params["vehicle_type"] = vehicle.vehicle_type
        
        if not updates:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        query = f"UPDATE Vehicle SET {', '.join(updates)} WHERE vehicle_id = :vehicle_id"
        rowcount = models.execute_update(connection, query, params)
        
        if rowcount == 0:
            raise HTTPException(status_code=404, detail="Vehicle not found")
        
        return {"message": "Vehicle updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{vehicle_id}")
def delete_vehicle(
    vehicle_id: int,
    connection: oracledb.Connection = Depends(get_db_connection)
):
    """Delete vehicle"""
    try:
        query = "DELETE FROM Vehicle WHERE vehicle_id = :vehicle_id"
        rowcount = models.execute_update(connection, query, {"vehicle_id": vehicle_id})
        
        if rowcount == 0:
            raise HTTPException(status_code=404, detail="Vehicle not found")
        
        return {"message": "Vehicle deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/validate-entry")
def validate_entry(
    license_plate: str,
    connection: oracledb.Connection = Depends(get_db_connection)
):
    """Validate vehicle entry with license plate (ALPR simulation)"""
    try:
        result = models.validate_resident_entry(connection, license_plate)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))