#!/usr/bin/env python3
"""Quick database connection test"""

import oracledb
import os
from dotenv import load_dotenv

load_dotenv()

print("🔍 Quick Database Connection Test")
print("=" * 50)

user = os.getenv('DB_USER', 'system')
password = os.getenv('DB_PASSWORD', 'oracle')
host = os.getenv('DB_HOST', 'localhost')
port = os.getenv('DB_PORT', '1522')
service = os.getenv('DB_SERVICE_NAME', 'xe')
dsn = f'{host}:{port}/{service}'

print(f"\n📋 Thông tin kết nối:")
print(f"   Host: {host}")
print(f"   Port: {port}")
print(f"   Service: {service}")
print(f"   User: {user}")
print(f"   DSN: {dsn}")
print(f"   Password: {'*' * len(password)}")

print(f"\n🔌 Đang kết nối...")

try:
    conn = oracledb.connect(user=user, password=password, dsn=dsn)
    print("✅ KẾT NỐI THÀNH CÔNG!")
    
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM Resident")
    count = cursor.fetchone()[0]
    print(f"✅ Tìm thấy {count} residents trong database")
    
    cursor.close()
    conn.close()
    
    print("\n✅ Database sẵn sàng! Có thể chạy backend:")
    print("   uvicorn app:app --reload")
    
except Exception as e:
    print(f"\n❌ LỖI KẾT NỐI!")
    print(f"   {e}")
    print("\n🔧 Kiểm tra:")
    print("   1. Oracle có đang chạy? -> lsnrctl status")
    print("   2. File .env có đúng thông tin?")
    print("   3. Mật khẩu có đúng?")
    print(f"   4. Test: sqlplus {user}/{password}@{dsn}")