-- =====================================================
-- APARTMENT BUILDING PARKING MANAGEMENT SYSTEM
-- DATA INSERTION SCRIPT - Updated based on ERD
-- =====================================================
-- Run this script AFTER running schema_updated.sql
-- =====================================================

-- Xóa dữ liệu cũ (nếu có)
DELETE FROM SupervisorFinancialReport;
DELETE FROM ManagerFinancialReport;
DELETE FROM SupervisionShift;
DELETE FROM Supervisor;
DELETE FROM BuildingManager;
DELETE FROM VisitorParkingRecord;
DELETE FROM ParkingSubscription;
DELETE FROM ParkingRecord;
DELETE FROM Vehicle;
DELETE FROM Resident;
DELETE FROM Apartment;
DELETE FROM ParkingSpace;
DELETE FROM Building;

-- =====================================================
-- 1. BUILDING TABLE
-- =====================================================
-- 3 tòa nhà với building_id là CHAR(4)
INSERT INTO Building (building_id, apartments_available)
VALUES ('B001', 200); -- 20 tầng * 10 căn = 200 căn

INSERT INTO Building (building_id, apartments_available)
VALUES ('B002', 200);

INSERT INTO Building (building_id, apartments_available)
VALUES ('B003', 200);

COMMIT;

-- =====================================================
-- 2. APARTMENT TABLE
-- =====================================================
-- Tổng: 3 tòa * 20 tầng * 10 căn = 600 căn hộ
DECLARE
    v_apt_id NUMBER := 1;
    v_building_id CHAR(4);
BEGIN
    FOR building_num IN 1..3 LOOP
        v_building_id := 'B00' || building_num;
        
        FOR floor_num IN 1..20 LOOP
            FOR apt_num IN 1..10 LOOP
                INSERT INTO Apartment (apartment_id, building_id, floor)
                VALUES (v_apt_id, v_building_id, floor_num);
                v_apt_id := v_apt_id + 1;
            END LOOP;
        END LOOP;
    END LOOP;
    COMMIT;
END;
/

-- =====================================================
-- 3. RESIDENT TABLE
-- =====================================================
-- Mỗi căn hộ có 2 người = 600 * 2 = 1200 residents
DECLARE
    v_resident_id NUMBER := 1;
    v_phone NUMBER;
    TYPE name_array IS VARRAY(50) OF VARCHAR2(50);
    first_names name_array := name_array(
        'Nguyen Van', 'Tran Thi', 'Le Van', 'Pham Thi', 'Hoang Van',
        'Phan Thi', 'Vu Van', 'Dang Thi', 'Bui Van', 'Do Thi',
        'Ngo Van', 'Duong Thi', 'Ly Van', 'Truong Thi', 'Vo Van',
        'Dinh Thi', 'Trinh Van', 'Ho Thi', 'Lam Van', 'Cao Thi'
    );
    last_names name_array := name_array(
        'An', 'Binh', 'Cuong', 'Dung', 'Hai', 'Hoa', 'Hung', 'Khoa', 
        'Linh', 'Long', 'Mai', 'Nam', 'Phuong', 'Quan', 'Son', 
        'Tam', 'Tuan', 'Van', 'Yen', 'Minh'
    );
    v_full_name VARCHAR2(100);
BEGIN
    FOR apt_id IN 1..600 LOOP
        FOR person IN 1..2 LOOP
            v_phone := 900000000 + TRUNC(DBMS_RANDOM.VALUE(10000000, 99999999));
            v_full_name := first_names(MOD(v_resident_id, 20) + 1) || ' ' || last_names(MOD(v_resident_id, 20) + 1);
            
            INSERT INTO Resident (resident_id, apartment_id, name, phone_number, email)
            VALUES (
                v_resident_id,
                apt_id,
                v_full_name,
                v_phone,
                'res' || v_resident_id || '@email.com'
            );
            v_resident_id := v_resident_id + 1;
        END LOOP;
    END LOOP;
    COMMIT;
END;
/

-- =====================================================
-- 4. VEHICLE TABLE
-- =====================================================
-- Mỗi căn hộ có 2 xe = 600 * 2 = 1200 vehicles
DECLARE
    v_vehicle_id NUMBER := 1;
    v_resident_id NUMBER;
    v_license_plate VARCHAR2(50);
    TYPE vehicle_type_array IS VARRAY(4) OF VARCHAR2(20);
    vehicle_types vehicle_type_array := vehicle_type_array('Car', 'Motorcycle', 'Bicycle', 'Truck');
    v_vehicle_type VARCHAR2(20);
    v_province NUMBER;
    v_number NUMBER;
BEGIN
    FOR apt_id IN 1..600 LOOP
        -- Lấy resident_id đầu tiên của căn hộ
        SELECT MIN(resident_id) INTO v_resident_id 
        FROM Resident 
        WHERE apartment_id = apt_id;
        
        FOR vehicle_num IN 1..2 LOOP
            -- Random loại xe
            v_vehicle_type := vehicle_types(TRUNC(DBMS_RANDOM.VALUE(1, 5)));
            
            -- Gen biển số xe (format: 29A12345)
            v_province := TRUNC(DBMS_RANDOM.VALUE(29, 99));
            v_number := TRUNC(DBMS_RANDOM.VALUE(10000, 99999));
            v_license_plate := v_province || 'A' || v_number;
            
            INSERT INTO Vehicle (vehicle_id, resident_id, license_plate, vehicle_type)
            VALUES (
                v_vehicle_id,
                v_resident_id + (vehicle_num - 1),
                v_license_plate,
                v_vehicle_type
            );
            v_vehicle_id := v_vehicle_id + 1;
        END LOOP;
    END LOOP;
    COMMIT;
END;
/

-- =====================================================
-- 5. PARKING SPACE TABLE
-- =====================================================
-- Tạo 800 chỗ đỗ xe
DECLARE
    TYPE space_type_array IS VARRAY(4) OF VARCHAR2(20);
    space_types space_type_array := space_type_array('Standard', 'Compact', 'Handicapped', 'Electric');
    v_space_type VARCHAR2(20);
BEGIN
    FOR i IN 1..800 LOOP
        v_space_type := space_types(MOD(i, 4) + 1);
        
        INSERT INTO ParkingSpace (space_id, space_type, spaces_available)
        VALUES (i, v_space_type, TRUNC(DBMS_RANDOM.VALUE(0, 3)));
    END LOOP;
    COMMIT;
END;
/

-- =====================================================
-- 6. PARKING SUBSCRIPTION TABLE
-- =====================================================
-- Tạo subscription cho tất cả 1200 xe
DECLARE
    v_sub_type NUMBER;
    v_start_date DATE;
    v_expiration_date DATE;
    v_cost NUMBER;
    v_resident_id NUMBER;
BEGIN
    FOR v_id IN 1..1200 LOOP
        -- Lấy resident_id của vehicle
        SELECT resident_id INTO v_resident_id 
        FROM Vehicle 
        WHERE vehicle_id = v_id;
        
        -- Random loại subscription (1=monthly, 2=quarterly, 3=yearly)
        v_sub_type := TRUNC(DBMS_RANDOM.VALUE(1, 4));
        v_start_date := ADD_MONTHS(SYSDATE, -TRUNC(DBMS_RANDOM.VALUE(0, 12)));
        
        IF v_sub_type = 1 THEN
            -- Monthly
            v_expiration_date := ADD_MONTHS(v_start_date, 1);
            v_cost := TRUNC(DBMS_RANDOM.VALUE(500000, 1000000));
            
            INSERT INTO ParkingSubscription (
                subscription_id, vehicle_id, resident_id, 
                is_monthly, is_quaterly, is_yearly,
                start_date, expiration_date, cost
            ) VALUES (
                v_id, v_id, v_resident_id,
                1, 0, 0,
                v_start_date, v_expiration_date, ROUND(v_cost, -3)
            );
        ELSIF v_sub_type = 2 THEN
            -- Quarterly
            v_expiration_date := ADD_MONTHS(v_start_date, 3);
            v_cost := TRUNC(DBMS_RANDOM.VALUE(1500000, 2500000));
            
            INSERT INTO ParkingSubscription (
                subscription_id, vehicle_id, resident_id,
                is_monthly, is_quaterly, is_yearly,
                start_date, expiration_date, cost
            ) VALUES (
                v_id, v_id, v_resident_id,
                0, 1, 0,
                v_start_date, v_expiration_date, ROUND(v_cost, -3)
            );
        ELSE
            -- Yearly
            v_expiration_date := ADD_MONTHS(v_start_date, 12);
            v_cost := TRUNC(DBMS_RANDOM.VALUE(5000000, 8000000));
            
            INSERT INTO ParkingSubscription (
                subscription_id, vehicle_id, resident_id,
                is_monthly, is_quaterly, is_yearly,
                start_date, expiration_date, cost
            ) VALUES (
                v_id, v_id, v_resident_id,
                0, 0, 1,
                v_start_date, v_expiration_date, ROUND(v_cost, -3)
            );
        END IF;
    END LOOP;
    COMMIT;
END;
/

-- =====================================================
-- 7. PARKING RECORD TABLE
-- =====================================================
-- Tạo 2000 records (một số xe đã ra, một số còn đỗ)
DECLARE
    v_space_id NUMBER;
    v_vehicle_id NUMBER;
    v_arrival TIMESTAMP;
    v_departure TIMESTAMP;
BEGIN
    FOR i IN 1..2000 LOOP
        v_space_id := TRUNC(DBMS_RANDOM.VALUE(1, 801));
        v_vehicle_id := TRUNC(DBMS_RANDOM.VALUE(1, 1201));
        v_arrival := SYSTIMESTAMP - DBMS_RANDOM.VALUE(1, 30);
        
        -- 70% xe đã rời đi, 30% còn đỗ (departure_time = NULL)
        IF DBMS_RANDOM.VALUE(0, 1) > 0.3 THEN
            v_departure := v_arrival + DBMS_RANDOM.VALUE(1, 24)/24;
            
            INSERT INTO ParkingRecord (record_id, space_id, vehicle_id, arrival_time, departure_time)
            VALUES (i, v_space_id, v_vehicle_id, v_arrival, v_departure);
        ELSE
            INSERT INTO ParkingRecord (record_id, space_id, vehicle_id, arrival_time, departure_time)
            VALUES (i, v_space_id, v_vehicle_id, v_arrival, NULL);
        END IF;
    END LOOP;
    COMMIT;
END;
/

-- =====================================================
-- 8. VISITOR PARKING RECORD TABLE
-- =====================================================
-- Tạo 500 records cho xe khách
DECLARE
    v_space_id NUMBER;
    v_license_plate VARCHAR2(50);
    v_arrival TIMESTAMP;
    v_departure TIMESTAMP;
    v_parking_fee NUMBER;
    v_province NUMBER;
    v_number NUMBER;
BEGIN
    FOR i IN 1..500 LOOP
        v_space_id := TRUNC(DBMS_RANDOM.VALUE(1, 801));
        
        -- Gen biển số xe khách (format: 29V12345)
        v_province := TRUNC(DBMS_RANDOM.VALUE(29, 99));
        v_number := TRUNC(DBMS_RANDOM.VALUE(10000, 99999));
        v_license_plate := v_province || 'V' || v_number;
        
        v_arrival := SYSTIMESTAMP - DBMS_RANDOM.VALUE(1, 60);
        
        -- 80% xe khách đã rời đi
        IF DBMS_RANDOM.VALUE(0, 1) > 0.2 THEN
            v_departure := v_arrival + DBMS_RANDOM.VALUE(1, 12)/24;
            v_parking_fee := ROUND(TRUNC(DBMS_RANDOM.VALUE(10000, 100000)), -3);
            
            INSERT INTO VisitorParkingRecord (record_id, space_id, license_plate, arrival_time, departure_time, parking_fee)
            VALUES (i, v_space_id, v_license_plate, v_arrival, v_departure, v_parking_fee);
        ELSE
            INSERT INTO VisitorParkingRecord (record_id, space_id, license_plate, arrival_time, departure_time, parking_fee)
            VALUES (i, v_space_id, v_license_plate, v_arrival, NULL, 0);
        END IF;
    END LOOP;
    COMMIT;
END;
/

-- =====================================================
-- 9. SUPERVISOR TABLE
-- =====================================================
-- Tạo 20 nhân viên giám sát (không có role và total_money_collected)
DECLARE
    TYPE name_array IS VARRAY(20) OF VARCHAR2(50);
    names name_array := name_array(
        'Nguyen Van An', 'Tran Thi Binh', 'Le Van Cuong', 'Pham Thi Dung',
        'Hoang Van Hai', 'Phan Thi Hoa', 'Vu Van Hung', 'Dang Thi Khoa',
        'Bui Van Linh', 'Do Thi Long', 'Ngo Van Mai', 'Duong Thi Nam',
        'Ly Van Phuong', 'Truong Thi Quan', 'Vo Van Son', 'Dinh Thi Tam',
        'Trinh Van Tuan', 'Ho Thi Van', 'Lam Van Yen', 'Cao Thi Minh'
    );
    v_phone NUMBER;
BEGIN
    FOR i IN 1..20 LOOP
        v_phone := 900000000 + TRUNC(DBMS_RANDOM.VALUE(10000000, 99999999));
        
        INSERT INTO Supervisor (supervisor_id, name, email, phone_number, address)
        VALUES (
            i,
            names(i),
            'sup' || i || '@parking.com',
            v_phone,
            i || ' Le Loi St, D1, HCMC'
        );
    END LOOP;
    COMMIT;
END;
/

-- =====================================================
-- 10. SUPERVISION SHIFT TABLE
-- =====================================================
-- Tạo ca làm việc cho 1 tháng (total_money_collected thay vì total_money)
DECLARE
    TYPE day_array IS VARRAY(7) OF VARCHAR2(10);
    days day_array := day_array('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday');
    v_shift_id NUMBER := 1;
    v_day VARCHAR2(10);
    v_supervisor_id NUMBER;
    v_check_in TIMESTAMP;
    v_check_out TIMESTAMP;
BEGIN
    -- Mỗi parking space có 3 ca/ngày * 7 ngày
    FOR space_id IN 1..50 LOOP
        FOR day_idx IN 1..7 LOOP
            v_day := days(day_idx);
            
            FOR shift_idx IN 1..3 LOOP
                v_supervisor_id := MOD(v_shift_id, 20) + 1;
                
                -- Define shifts
                IF shift_idx = 1 THEN
                    v_check_in := TO_TIMESTAMP('08:00:00', 'HH24:MI:SS');
                    v_check_out := TO_TIMESTAMP('16:00:00', 'HH24:MI:SS');
                ELSIF shift_idx = 2 THEN
                    v_check_in := TO_TIMESTAMP('16:00:00', 'HH24:MI:SS');
                    v_check_out := TO_TIMESTAMP('23:59:59', 'HH24:MI:SS');
                ELSE
                    v_check_in := TO_TIMESTAMP('00:00:00', 'HH24:MI:SS');
                    v_check_out := TO_TIMESTAMP('08:00:00', 'HH24:MI:SS');
                END IF;
                
                INSERT INTO SupervisionShift (
                    shift_id, space_id, supervisor_id, day,
                    check_in_time, check_out_time, total_money_collected
                ) VALUES (
                    v_shift_id,
                    space_id,
                    v_supervisor_id,
                    v_day,
                    v_check_in,
                    v_check_out,
                    ROUND(TRUNC(DBMS_RANDOM.VALUE(100000, 5000000)), -4)
                );
                
                v_shift_id := v_shift_id + 1;
            END LOOP;
        END LOOP;
    END LOOP;
    COMMIT;
END;
/

-- =====================================================
-- 11. BUILDING MANAGER TABLE
-- =====================================================
-- Tạo 3 quản lý cho 3 tòa nhà
DECLARE
    TYPE name_array IS VARRAY(3) OF VARCHAR2(50);
    names name_array := name_array(
        'Nguyen Hoang Minh', 'Tran Thanh Tam', 'Le Duc Anh'
    );
    v_phone NUMBER;
    v_building_id CHAR(4);
BEGIN
    FOR i IN 1..3 LOOP
        v_phone := 900000000 + TRUNC(DBMS_RANDOM.VALUE(10000000, 99999999));
        v_building_id := 'B00' || i;
        
        INSERT INTO BuildingManager (manager_id, building_id, name, email, phone_number, address)
        VALUES (
            i,
            v_building_id,
            names(i),
            'mgr' || i || '@building.com',
            v_phone,
            i || ' Hai Ba Trung, D1, HCMC'
        );
    END LOOP;
    COMMIT;
END;
/

-- =====================================================
-- 12. MANAGER FINANCIAL REPORT TABLE
-- =====================================================
-- Tạo báo cáo cho 3 quản lý, 12 tháng
DECLARE
    v_report_id NUMBER := 1;
    v_month DATE;
BEGIN
    FOR manager_id IN 1..3 LOOP
        FOR month_offset IN 0..11 LOOP
            v_month := ADD_MONTHS(TRUNC(SYSDATE, 'MM'), -month_offset);
            
            INSERT INTO ManagerFinancialReport (
                manager_report_id, manager_id, month,
                total_subscription_made, total_money_made,
                monthly_subs, quaterly_subs, yearly_subs, salary
            ) VALUES (
                v_report_id,
                manager_id,
                v_month,
                ROUND(TRUNC(DBMS_RANDOM.VALUE(150, 200))),
                ROUND(TRUNC(DBMS_RANDOM.VALUE(50000000, 100000000)), -5),
                ROUND(TRUNC(DBMS_RANDOM.VALUE(50, 100))),
                ROUND(TRUNC(DBMS_RANDOM.VALUE(30, 60))),
                ROUND(TRUNC(DBMS_RANDOM.VALUE(20, 40))),
                ROUND(TRUNC(DBMS_RANDOM.VALUE(15000000, 30000000)), -5)
            );
            
            v_report_id := v_report_id + 1;
        END LOOP;
    END LOOP;
    COMMIT;
END;
/

-- =====================================================
-- 13. SUPERVISOR FINANCIAL REPORT TABLE
-- =====================================================
-- Tạo báo cáo cho supervisors qua managers
DECLARE
    v_report_id NUMBER := 1;
    v_month DATE;
    v_manager_id NUMBER;
BEGIN
    FOR sup_id IN 1..20 LOOP
        -- Mỗi supervisor thuộc 1 manager (phân bổ đều)
        v_manager_id := MOD(sup_id - 1, 3) + 1;
        
        FOR month_offset IN 0..11 LOOP
            v_month := ADD_MONTHS(TRUNC(SYSDATE, 'MM'), -month_offset);
            
            INSERT INTO SupervisorFinancialReport (
                supervisor_report_id, manager_id, month,
                total_shifts_made, total_money_made, salary
            ) VALUES (
                v_report_id,
                v_manager_id,
                v_month,
                ROUND(TRUNC(DBMS_RANDOM.VALUE(20, 30))),
                ROUND(TRUNC(DBMS_RANDOM.VALUE(5000000, 20000000)), -5),
                ROUND(TRUNC(DBMS_RANDOM.VALUE(8000000, 15000000)), -5)
            );
            
            v_report_id := v_report_id + 1;
        END LOOP;
    END LOOP;
    COMMIT;
END;
/

-- Kiểm tra số lượng records
SELECT 'Building' AS table_name, COUNT(*) AS record_count FROM Building
UNION ALL
SELECT 'Apartment', COUNT(*) FROM Apartment
UNION ALL
SELECT 'Resident', COUNT(*) FROM Resident
UNION ALL
SELECT 'Vehicle', COUNT(*) FROM Vehicle
UNION ALL
SELECT 'ParkingSpace', COUNT(*) FROM ParkingSpace
UNION ALL
SELECT 'ParkingSubscription', COUNT(*) FROM ParkingSubscription
UNION ALL
SELECT 'ParkingRecord', COUNT(*) FROM ParkingRecord
UNION ALL
SELECT 'VisitorParkingRecord', COUNT(*) FROM VisitorParkingRecord
UNION ALL
SELECT 'Supervisor', COUNT(*) FROM Supervisor
UNION ALL
SELECT 'SupervisionShift', COUNT(*) FROM SupervisionShift
UNION ALL
SELECT 'BuildingManager', COUNT(*) FROM BuildingManager
UNION ALL
SELECT 'ManagerFinancialReport', COUNT(*) FROM ManagerFinancialReport
UNION ALL
SELECT 'SupervisorFinancialReport', COUNT(*) FROM SupervisorFinancialReport;

COMMIT;