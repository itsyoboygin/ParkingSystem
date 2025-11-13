from fastapi import APIRouter, Depends, HTTPException
import oracledb
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db.connect import get_db_connection
import models

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

@router.get("/stats")
def get_dashboard_stats(
    connection: oracledb.Connection = Depends(get_db_connection)
):
    """Get dashboard statistics"""
    try:
        stats = models.get_dashboard_stats(connection)
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/manager/{manager_id}")
def get_manager_dashboard(
    manager_id: int,
    connection: oracledb.Connection = Depends(get_db_connection)
):
    """Get manager-specific dashboard data"""
    try:
        # Get general stats
        stats = models.get_dashboard_stats(connection)
        
        # Get manager financial report for current month
        query = """
            SELECT manager_report_id, manager_id, month,
                   total_subscription_made, total_money_made,
                   monthly_subs, quaterly_subs, yearly_subs, salary
            FROM ManagerFinancialReport
            WHERE manager_id = :manager_id
            AND TRUNC(month, 'MM') = TRUNC(SYSDATE, 'MM')
        """
        financial_report = models.execute_query(connection, query, {"manager_id": manager_id})
        
        return {
            "stats": stats,
            "financial_report": financial_report[0] if financial_report else None
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/occupancy")
def get_occupancy_details(
    connection: oracledb.Connection = Depends(get_db_connection)
):
    """Get detailed occupancy analysis"""
    try:
        query = """
            SELECT
                ps.space_type,
                ps.space_id,
                ps.spaces_available,
                COUNT(pr.record_id) AS total_usage_today,
                ROUND(AVG(
                    EXTRACT(HOUR FROM (pr.departure_time - pr.arrival_time)) * 60 +
                    EXTRACT(MINUTE FROM (pr.departure_time - pr.arrival_time))
                ), 2) AS avg_duration_minutes
            FROM ParkingSpace ps
            LEFT JOIN ParkingRecord pr ON ps.space_id = pr.space_id
                AND TRUNC(pr.arrival_time) = TRUNC(SYSDATE)
            GROUP BY ps.space_type, ps.space_id, ps.spaces_available
            ORDER BY ps.space_type, ps.space_id
        """
        occupancy = models.execute_query(connection, query)
        return {"data": occupancy, "count": len(occupancy)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/alerts")
def get_alerts(
    connection: oracledb.Connection = Depends(get_db_connection)
):
    """Get system alerts for violations and issues"""
    try:
        query = """
            SELECT
                'EXPIRED_SUBSCRIPTION' AS alert_type,
                r.name AS resident_name,
                r.email,
                v.license_plate,
                ps.expiration_date,
                'Subscription expired - parking access revoked' AS message
            FROM ParkingSubscription ps
            JOIN Resident r ON ps.resident_id = r.resident_id
            JOIN Vehicle v ON ps.vehicle_id = v.vehicle_id
            WHERE ps.expiration_date < SYSDATE
            
            UNION ALL
            
            SELECT
                'OVERSTAY_VISITOR' AS alert_type,
                'Visitor' AS resident_name,
                NULL AS email,
                vpr.license_plate,
                vpr.arrival_time AS expiration_date,
                'Visitor overstay - parked for > 24 hours' AS message
            FROM VisitorParkingRecord vpr
            WHERE vpr.departure_time IS NULL
            AND vpr.arrival_time < SYSDATE - 1
            
            UNION ALL
            
            SELECT
                'SPACE_CAPACITY_LOW' AS alert_type,
                NULL AS resident_name,
                NULL AS email,
                NULL AS license_plate,
                NULL AS expiration_date,
                'Parking space ' || space_id || ' has only ' || spaces_available || ' spaces remaining' AS message
            FROM ParkingSpace
            WHERE spaces_available <= 5
            AND space_type IN ('Car', 'Motorcycle')
        """
        alerts = models.execute_query(connection, query)
        return {"data": alerts, "count": len(alerts)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/revenue")
def get_revenue_details(
    connection: oracledb.Connection = Depends(get_db_connection)
):
    """Get revenue breakdown"""
    try:
        query = """
            SELECT
                'Today' as period,
                COALESCE(SUM(parking_fee), 0) as visitor_revenue,
                0 as subscription_revenue
            FROM VisitorParkingRecord
            WHERE TRUNC(departure_time) = TRUNC(SYSDATE)
            
            UNION ALL
            
            SELECT
                'This Month' as period,
                (SELECT COALESCE(SUM(parking_fee), 0)
                 FROM VisitorParkingRecord
                 WHERE TRUNC(departure_time, 'MM') = TRUNC(SYSDATE, 'MM')) as visitor_revenue,
                (SELECT COALESCE(SUM(cost), 0)
                 FROM ParkingSubscription
                 WHERE TRUNC(start_date, 'MM') = TRUNC(SYSDATE, 'MM')) as subscription_revenue
            FROM DUAL
        """
        revenue = models.execute_query(connection, query)
        return {"data": revenue}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/supervisors")
def get_supervisors_summary(
    connection: oracledb.Connection = Depends(get_db_connection)
):
    """Get supervisors and their collection summary"""
    try:
        # Get all supervisors
        supervisors = models.get_supervisors(connection)
        
        # Get collection summary for each supervisor
        query = """
            SELECT 
                supervisor_id,
                COUNT(*) as total_shifts_this_month,
                SUM(total_money_collected) as total_collected_this_month
            FROM SupervisionShift
            WHERE TRUNC(check_in_time, 'MM') = TRUNC(SYSDATE, 'MM')
            GROUP BY supervisor_id
        """
        collections = models.execute_query(connection, query)
        
        # Merge data
        collections_dict = {c['supervisor_id']: c for c in collections}
        for supervisor in supervisors:
            sid = supervisor['supervisor_id']
            if sid in collections_dict:
                supervisor.update(collections_dict[sid])
            else:
                supervisor['total_shifts_this_month'] = 0
                supervisor['total_collected_this_month'] = 0
        
        return {"data": supervisors, "count": len(supervisors)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))