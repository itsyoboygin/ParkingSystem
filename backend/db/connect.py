import oracledb
from typing import Optional
import os
from dotenv import load_dotenv

load_dotenv()

class Database:
    def __init__(self):
        self.user = os.getenv("DB_USER", "system")
        self.password = os.getenv("DB_PASSWORD", "123")
        self.host = os.getenv("DB_HOST", "localhost")
        self.port = os.getenv("DB_PORT", "1522")
        self.service_name = os.getenv("DB_SERVICE_NAME", "xe")
        # Construct DSN from components
        self.dsn = f"{self.host}:{self.port}/{self.service_name}"
        self.pool: Optional[oracledb.ConnectionPool] = None
    
    def create_pool(self):
        """Create connection pool"""
        try:
            self.pool = oracledb.create_pool(
                user=self.user,
                password=self.password,
                dsn=self.dsn,
                min=2,
                max=10,
                increment=1
            )
            print("✅ Connection pool created successfully")
        except Exception as e:
            print(f"❌ Error creating connection pool: {e}")
            raise
    
    def get_connection(self):
        """Get a connection from the pool"""
        if not self.pool:
            self.create_pool()
        return self.pool.acquire()
    
    def close_pool(self):
        """Close the connection pool"""
        if self.pool:
            self.pool.close()
            print("Connection pool closed")

# Global database instance
db = Database()

def get_db_connection():
    """Dependency for getting database connection"""
    connection = None
    try:
        connection = db.get_connection()
        yield connection
    finally:
        if connection:
            connection.close()