from fastapi import APIRouter, Depends, HTTPException
from typing import List
from pydantic import BaseModel
import oracledb
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db.connect import get_db_connection
import models

router = APIRouter(prefix="/api/residents", tags=["residents"])

class ResidentCreate(BaseModel):
    apartment_id: int
    name: str
    phone_number: str
    email: str

class ResidentUpdate(BaseModel):
    name: str = None
    phone_number: str = None
    email: str = None

@router.get("/")
def get_residents(
    limit: int = 100,
    offset: int = 0,
    connection: oracledb.Connection = Depends(get_db_connection)
):
    """Get list of residents"""
    try:
        residents = models.get_residents(connection, limit, offset)
        return {"data": residents, "count": len(residents)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{resident_id}")
def get_resident(
    resident_id: int,
    connection: oracledb.Connection = Depends(get_db_connection)
):
    """Get specific resident details"""
    try:
        query = """
            SELECT r.resident_id, r.apartment_id, r.name, r.phone_number, r.email,
                   a.building_id, a.floor
            FROM Resident r
            JOIN Apartment a ON r.apartment_id = a.apartment_id
            WHERE r.resident_id = :resident_id
        """
        result = models.execute_query(connection, query, {"resident_id": resident_id})
        if not result:
            raise HTTPException(status_code=404, detail="Resident not found")
        return result[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/")
def create_resident(
    resident: ResidentCreate,
    connection: oracledb.Connection = Depends(get_db_connection)
):
    """Create new resident"""
    try:
        # Get next resident ID
        cursor = connection.cursor()
        cursor.execute("SELECT NVL(MAX(resident_id), 0) + 1 FROM Resident")
        new_id = cursor.fetchone()[0]
        cursor.close()
        
        query = """
            INSERT INTO Resident (resident_id, apartment_id, name, phone_number, email)
            VALUES (:resident_id, :apartment_id, :name, :phone_number, :email)
        """
        models.execute_update(connection, query, {
            "resident_id": new_id,
            "apartment_id": resident.apartment_id,
            "name": resident.name,
            "phone_number": resident.phone_number,
            "email": resident.email
        })
        
        return {"message": "Resident created successfully", "resident_id": new_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{resident_id}")
def update_resident(
    resident_id: int,
    resident: ResidentUpdate,
    connection: oracledb.Connection = Depends(get_db_connection)
):
    """Update resident information"""
    try:
        updates = []
        params = {"resident_id": resident_id}
        
        if resident.name:
            updates.append("name = :name")
            params["name"] = resident.name
        if resident.phone_number:
            updates.append("phone_number = :phone_number")
            params["phone_number"] = resident.phone_number
        if resident.email:
            updates.append("email = :email")
            params["email"] = resident.email
        
        if not updates:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        query = f"UPDATE Resident SET {', '.join(updates)} WHERE resident_id = :resident_id"
        rowcount = models.execute_update(connection, query, params)
        
        if rowcount == 0:
            raise HTTPException(status_code=404, detail="Resident not found")
        
        return {"message": "Resident updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{resident_id}")
def delete_resident(
    resident_id: int,
    connection: oracledb.Connection = Depends(get_db_connection)
):
    """Delete resident"""
    try:
        query = "DELETE FROM Resident WHERE resident_id = :resident_id"
        rowcount = models.execute_update(connection, query, {"resident_id": resident_id})
        
        if rowcount == 0:
            raise HTTPException(status_code=404, detail="Resident not found")
        
        return {"message": "Resident deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))