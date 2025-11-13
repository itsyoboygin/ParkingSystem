from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
import oracledb
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db.connect import get_db_connection
import models

router = APIRouter(prefix="/api/supervisors", tags=["supervisors"])

class SupervisorCreate(BaseModel):
    name: str
    phone_number: str
    email: str

class ShiftCheckIn(BaseModel):
    supervisor_id: int
    space_id: int

@router.get("/")
def get_supervisors(
    connection: oracledb.Connection = Depends(get_db_connection)
):
    """Get all supervisors"""
    try:
        supervisors = models.get_supervisors(connection)
        return {"data": supervisors, "count": len(supervisors)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{supervisor_id}")
def get_supervisor(
    supervisor_id: int,
    connection: oracledb.Connection = Depends(get_db_connection)
):
    """Get specific supervisor details"""
    try:
        query = """
            SELECT supervisor_id, name, phone_number, email
            FROM Supervisor
            WHERE supervisor_id = :supervisor_id
        """
        result = models.execute_query(connection, query, {"supervisor_id": supervisor_id})
        if not result:
            raise HTTPException(status_code=404, detail="Supervisor not found")
        return result[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/")
def create_supervisor(
    supervisor: SupervisorCreate,
    connection: oracledb.Connection = Depends(get_db_connection)
):
    """Create new supervisor"""
    try:
        # Get next supervisor ID
        cursor = connection.cursor()
        cursor.execute("SELECT NVL(MAX(supervisor_id), 0) + 1 FROM Supervisor")
        new_id = cursor.fetchone()[0]
        cursor.close()
        
        query = """
            INSERT INTO Supervisor (supervisor_id, name, phone_number, email)
            VALUES (:supervisor_id, :name, :phone_number, :email)
        """
        models.execute_update(connection, query, {
            "supervisor_id": new_id,
            "name": supervisor.name,
            "phone_number": supervisor.phone_number,
            "email": supervisor.email
        })
        
        return {"message": "Supervisor created successfully", "supervisor_id": new_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{supervisor_id}/shifts")
def get_supervisor_shifts(
    supervisor_id: int,
    connection: oracledb.Connection = Depends(get_db_connection)
):
    """Get shifts for a specific supervisor"""
    try:
        shifts = models.get_supervisor_shifts(connection, supervisor_id)
        return {"data": shifts, "count": len(shifts)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/shifts/all")
def get_all_shifts(
    connection: oracledb.Connection = Depends(get_db_connection)
):
    """Get all supervisor shifts"""
    try:
        shifts = models.get_supervisor_shifts(connection)
        return {"data": shifts, "count": len(shifts)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/shifts/check-in")
def shift_check_in(
    shift: ShiftCheckIn,
    connection: oracledb.Connection = Depends(get_db_connection)
):
    """Supervisor check-in to start shift"""
    try:
        # Get next shift ID
        cursor = connection.cursor()
        cursor.execute("SELECT NVL(MAX(shift_id), 0) + 1 FROM SupervisionShift")
        new_id = cursor.fetchone()[0]
        cursor.close()
        
        query = """
            INSERT INTO SupervisionShift (
                shift_id, space_id, supervisor_id, day,
                check_in_time, check_out_time, total_money_collected
            )
            VALUES (
                :shift_id, :space_id, :supervisor_id,
                TO_CHAR(SYSDATE, 'Day'),
                SYSTIMESTAMP, NULL, 0
            )
        """
        models.execute_update(connection, query, {
            "shift_id": new_id,
            "space_id": shift.space_id,
            "supervisor_id": shift.supervisor_id
        })
        
        return {"message": "Shift checked in successfully", "shift_id": new_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/shifts/{shift_id}/check-out")
def shift_check_out(
    shift_id: int,
    connection: oracledb.Connection = Depends(get_db_connection)
):
    """Supervisor check-out to end shift"""
    try:
        query = """
            UPDATE SupervisionShift
            SET check_out_time = SYSTIMESTAMP
            WHERE shift_id = :shift_id
            AND check_out_time IS NULL
        """
        rowcount = models.execute_update(connection, query, {"shift_id": shift_id})
        
        if rowcount == 0:
            raise HTTPException(status_code=404, detail="Active shift not found")
        
        return {"message": "Shift checked out successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{supervisor_id}/financial-report")
def get_supervisor_financial_report(
    supervisor_id: int,
    connection: oracledb.Connection = Depends(get_db_connection)
):
    """Get financial report for a supervisor"""
    try:
        query = """
            SELECT supervisor_report_id, supervisor_id, manager_id, month,
                   total_shifts_made, total_money_made, salary
            FROM SupervisorFinancialReport
            WHERE supervisor_id = :supervisor_id
            ORDER BY month DESC
        """
        reports = models.execute_query(connection, query, {"supervisor_id": supervisor_id})
        return {"data": reports, "count": len(reports)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/financial-report/current-month")
def get_all_supervisor_reports_current_month(
    connection: oracledb.Connection = Depends(get_db_connection)
):
    """Get financial reports for all supervisors for current month"""
    try:
        query = """
            SELECT sfr.supervisor_report_id, sfr.supervisor_id, sfr.manager_id, sfr.month,
                   sfr.total_shifts_made, sfr.total_money_made, sfr.salary,
                   s.name as supervisor_name
            FROM SupervisorFinancialReport sfr
            JOIN Supervisor s ON sfr.supervisor_id = s.supervisor_id
            WHERE TRUNC(sfr.month, 'MM') = TRUNC(SYSDATE, 'MM')
            ORDER BY sfr.total_money_made DESC
        """
        reports = models.execute_query(connection, query)
        return {"data": reports, "count": len(reports)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))