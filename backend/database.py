"""
Database connection manager supporting MySQL with automatic SQLite development fallback.
"""

import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, scoped_session
from models import Base

# Load environment variables
load_dotenv()

MYSQL_USER = os.getenv("MYSQL_USER", "root")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "")
MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
MYSQL_PORT = os.getenv("MYSQL_PORT", "3306")
MYSQL_DB = os.getenv("MYSQL_DB", "smart_manufacturing")

# Database URL construction
# MySQL connection string
mysql_url = f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DB}"

# SQLite local fallback database path
base_dir = os.path.dirname(os.path.abspath(__file__))
sqlite_path = os.path.join(base_dir, "smart_manufacturing.db")
sqlite_url = f"sqlite:///{sqlite_path}"

engine = None
db_type = "UNKNOWN"

# Attempt MySQL connection
try:
    # Quick probe with timeout
    probe_engine = create_engine(mysql_url, connect_args={"connect_timeout": 2}, pool_pre_ping=True)
    with probe_engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    engine = probe_engine
    db_type = "MySQL"
    print(f"Connected to MySQL Database: {MYSQL_DB}@{MYSQL_HOST}:{MYSQL_PORT}")
except Exception as e:
    # Seamlessly fallback to SQLite
    print(f"[Notice] MySQL server at {MYSQL_HOST}:{MYSQL_PORT} is not currently active: {e}")
    print(f"[Notice] Initializing zero-friction local SQLite database at: {sqlite_path}")
    engine = create_engine(
        sqlite_url, 
        connect_args={"check_same_thread": False},
        pool_pre_ping=True
    )
    db_type = "SQLite (MySQL-compatible mode)"

# Session Factory
session_factory = sessionmaker(autocommit=False, autoflush=False, bind=engine)
SessionLocal = scoped_session(session_factory)

def get_db():
    """
    Context generator for database sessions.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """
    Creates all tables if they do not exist.
    """
    print(f"Initializing database tables ({db_type})...")
    Base.metadata.create_all(bind=engine)
    print("Database tables verified.")

if __name__ == "__main__":
    init_db()
