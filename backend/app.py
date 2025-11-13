from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from db.connect import db
from routes import residents, vehicles, subscriptions, visitors, dashboard, supervisors

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("🚀 Starting Parking Management System API...")
    try:
        db.create_pool()
        print("✅ Database connection pool initialized")
    except Exception as e:
        print(f"❌ Failed to initialize database: {e}")
    
    yield
    
    # Shutdown
    print("🛑 Shutting down...")
    db.close_pool()
    print("✅ Database connection pool closed")

app = FastAPI(
    title="Parking Management System API",
    description="Modern parking management and monitoring system with FastAPI and OracleDB",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(residents.router)
app.include_router(vehicles.router)
app.include_router(subscriptions.router)
app.include_router(visitors.router)
app.include_router(dashboard.router)
app.include_router(supervisors.router)

@app.get("/")
def root():
    """Root endpoint"""
    return {
        "message": "🚗 Welcome to Parking Management System API",
        "version": "1.0.0",
        "docs": "/docs",
        "endpoints": {
            "residents": "/api/residents",
            "vehicles": "/api/vehicles",
            "subscriptions": "/api/subscriptions",
            "visitors": "/api/visitors",
            "dashboard": "/api/dashboard",
            "supervisors": "/api/supervisors"
        }
    }

@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "parking-management-api"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)