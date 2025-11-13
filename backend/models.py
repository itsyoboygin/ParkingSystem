from typing import List, Dict, Any, Optional
from datetime import datetime, date
import oracledb

def execute_query(connection, query: str, params: dict = None) -> List[Dict[str, Any]]:
    """Execute a SELECT query and return results as list of dicts"""
    cursor = connection.cursor()
    try:
        if params:
            cursor.execute(query, params)
        else:
            cursor.execute(query)
        
        # Get column names
        columns = [col[0].lower() for col in cursor.description]
        
        # Fetch all rows and convert to dicts
        rows = cursor.fetchall()
        result = [dict(zip(columns, row)) for row in rows]
        
        return result
    finally:
        cursor.close()

def execute_update(connection, query: str, params: dict = None) -> int:
    """Execute an INSERT/UPDATE/DELETE query"""
    cursor = connection.cursor()
    try:
        if params:
            cursor.execute(query, params)
        else:
            cursor.execute(query)
        connection.commit()
        return cursor.rowcount
    except Exception as e:
        connection.rollback()
        raise e
    finally:
        cursor.close()

def get_residents(connection, limit: int = 100, offset: int = 0) -> List[Dict]:
    """Get list of residents with pagination"""
    query = """
        SELECT r.resident_id, r.apartment_id, r.name, r.phone_number, r.email,
               a.building_id, a.floor
        FROM Resident r
        JOIN Apartment a ON r.apartment_id = a.apartment_id
        ORDER BY r.resident_id
        OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY
    """
    return execute_query(connection, query, {"offset": offset, "limit": limit})

def get_vehicles_by_resident(connection, resident_id: int) -> List[Dict]:
    """Get vehicles for a specific resident"""
    query = """
        SELECT vehicle_id, resident_id, license_plate, vehicle_type
        FROM Vehicle
        WHERE resident_id = :resident_id
    """
    return execute_query(connection, query, {"resident_id": resident_id})

def get_all_vehicles(connection, limit: int = 100, offset: int = 0) -> List[Dict]:
    """Get all vehicles with pagination"""
    query = """
        SELECT v.vehicle_id, v.resident_id, v.license_plate, v.vehicle_type,
               r.name as resident_name
        FROM Vehicle v
        JOIN Resident r ON v.resident_id = r.resident_id
        ORDER BY v.vehicle_id
        OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY
    """
    return execute_query(connection, query, {"offset": offset, "limit": limit})

def get_subscriptions(connection, limit: int = 100, offset: int = 0) -> List[Dict]:
    """Get parking subscriptions"""
    query = """
        SELECT ps.subscription_id, ps.vehicle_id, ps.resident_id,
               ps.is_monthly, ps.is_quaterly, ps.is_yearly,
               ps.start_date, ps.expiration_date, ps.cost,
               v.license_plate, r.name as resident_name
        FROM ParkingSubscription ps
        JOIN Vehicle v ON ps.vehicle_id = v.vehicle_id
        JOIN Resident r ON ps.resident_id = r.resident_id
        ORDER BY ps.subscription_id DESC
        OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY
    """
    return execute_query(connection, query, {"offset": offset, "limit": limit})

def get_expiring_subscriptions(connection, days: int = 7) -> List[Dict]:
    """Get subscriptions expiring within specified days"""
    query = """
        SELECT ps.subscription_id, ps.vehicle_id, ps.resident_id,
               ps.expiration_date, ps.cost,
               CASE
                   WHEN ps.is_monthly = 1 THEN 'Monthly'
                   WHEN ps.is_quaterly = 1 THEN 'Quarterly'
                   WHEN ps.is_yearly = 1 THEN 'Yearly'
               END as subscription_type,
               v.license_plate, r.name as resident_name, r.email, r.phone_number
        FROM ParkingSubscription ps
        JOIN Vehicle v ON ps.vehicle_id = v.vehicle_id
        JOIN Resident r ON ps.resident_id = r.resident_id
        WHERE ps.expiration_date BETWEEN SYSDATE AND SYSDATE + :days
        AND ps.expiration_date >= SYSDATE
        ORDER BY ps.expiration_date
    """
    return execute_query(connection, query, {"days": days})

def get_visitors(connection, limit: int = 100, offset: int = 0) -> List[Dict]:
    """Get visitor parking records"""
    query = """
        SELECT record_id, space_id, license_plate, arrival_time, 
               departure_time, parking_fee
        FROM VisitorParkingRecord
        ORDER BY arrival_time DESC
        OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY
    """
    return execute_query(connection, query, {"offset": offset, "limit": limit})

def get_supervisors(connection) -> List[Dict]:
    """Get all supervisors"""
    query = """
        SELECT supervisor_id, name, phone_number, email
        FROM Supervisor
        ORDER BY supervisor_id
    """
    return execute_query(connection, query)

def get_supervisor_shifts(connection, supervisor_id: Optional[int] = None) -> List[Dict]:
    """Get supervisor shifts"""
    if supervisor_id:
        query = """
            SELECT ss.shift_id, ss.space_id, ss.supervisor_id, ss.day,
                   ss.check_in_time, ss.check_out_time, ss.total_money_collected,
                   s.name as supervisor_name
            FROM SupervisionShift ss
            JOIN Supervisor s ON ss.supervisor_id = s.supervisor_id
            WHERE ss.supervisor_id = :supervisor_id
            ORDER BY ss.check_in_time DESC
        """
        return execute_query(connection, query, {"supervisor_id": supervisor_id})
    else:
        query = """
            SELECT ss.shift_id, ss.space_id, ss.supervisor_id, ss.day,
                   ss.check_in_time, ss.check_out_time, ss.total_money_collected,
                   s.name as supervisor_name
            FROM SupervisionShift ss
            JOIN Supervisor s ON ss.supervisor_id = s.supervisor_id
            ORDER BY ss.check_in_time DESC
            FETCH FIRST 100 ROWS ONLY
        """
        return execute_query(connection, query)

def get_dashboard_stats(connection) -> Dict:
    """Get dashboard statistics from manager_dashboard view"""
    query = """
        SELECT 
            (SELECT COUNT(*) FROM ParkingRecord WHERE departure_time IS NULL) as current_occupied_spaces,
            (SELECT SUM(spaces_available) FROM ParkingSpace) as total_available_spaces,
            (SELECT COUNT(*) FROM VisitorParkingRecord WHERE departure_time IS NULL) as current_visitors,
            (SELECT COALESCE(SUM(parking_fee), 0) FROM VisitorParkingRecord 
             WHERE TRUNC(departure_time) = TRUNC(SYSDATE)) as today_visitor_revenue,
            (SELECT COUNT(*) FROM ParkingSubscription 
             WHERE SYSDATE BETWEEN start_date AND expiration_date) as active_subscriptions,
            (SELECT COUNT(*) FROM ParkingSubscription 
             WHERE expiration_date BETWEEN SYSDATE AND SYSDATE + 7) as expiring_soon
        FROM DUAL
    """
    results = execute_query(connection, query)
    return results[0] if results else {}

def validate_resident_entry(connection, license_plate: str) -> Dict:
    """Validate resident entry with license plate"""
    cursor = connection.cursor()
    v_vehicle_id = cursor.var(int)
    v_subscription_valid = cursor.var(int)
    v_available_space = cursor.var(int)
    v_message = cursor.var(str)
    
    try:
        # Check vehicle existence
        cursor.execute("""
            SELECT vehicle_id INTO :v_id FROM Vehicle WHERE license_plate = :plate
        """, {"v_id": v_vehicle_id, "plate": license_plate})
        
        # Validate subscription
        cursor.execute("""
            SELECT COUNT(*) INTO :valid
            FROM ParkingSubscription ps
            WHERE ps.vehicle_id = :v_id
            AND SYSDATE BETWEEN ps.start_date AND ps.expiration_date
            AND (ps.is_monthly = 1 OR ps.is_quaterly = 1 OR ps.is_yearly = 1)
        """, {"valid": v_subscription_valid, "v_id": v_vehicle_id.getvalue()})
        
        if v_subscription_valid.getvalue() > 0:
            return {"status": "BARRIER_OPEN", "message": "Welcome! Barrier opened."}
        else:
            return {"status": "SUBSCRIPTION_EXPIRED", "message": "Subscription expired. Please renew."}
            
    except Exception as e:
        return {"status": "VEHICLE_NOT_REGISTERED", "message": "Vehicle not registered."}
    finally:
        cursor.close()