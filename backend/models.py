"""
SQLAlchemy Database Models for Smart Manufacturing Framework
Fully compatible with both MySQL (InnoDB) and SQLite.
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, Index
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class Machine(Base):
    __tablename__ = "machines"

    id = Column(Integer, primary_key=True, autoincrement=True)
    machine_id = Column(String(50), unique=True, nullable=False, index=True)
    machine_name = Column(String(150), nullable=False)
    machine_type = Column(String(100), nullable=False)
    status = Column(String(50), default="NORMAL", index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    sensor_data = relationship("SensorData", back_populates="machine", cascade="all, delete-orphan")
    events = relationship("SecurityEvent", back_populates="machine", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "machine_id": self.machine_id,
            "machine_name": self.machine_name,
            "machine_type": self.machine_type,
            "status": self.status,
            "created_at": self.created_at.strftime("%Y-%m-%d %H:%M:%S") if self.created_at else None
        }

class SensorData(Base):
    __tablename__ = "sensor_data"

    id = Column(Integer, primary_key=True, autoincrement=True)
    machine_id = Column(String(50), ForeignKey("machines.machine_id", ondelete="CASCADE"), nullable=False, index=True)
    timestamp = Column(DateTime, nullable=False, index=True, default=datetime.utcnow)
    temperature = Column(Float, nullable=False)
    pressure = Column(Float, nullable=False)
    vibration = Column(Float, nullable=False)
    rpm = Column(Float, nullable=False)
    current = Column(Float, nullable=False)
    voltage = Column(Float, nullable=False)
    energy = Column(Float, nullable=False)

    machine = relationship("Machine", back_populates="sensor_data")

    def to_dict(self):
        return {
            "id": self.id,
            "machine_id": self.machine_id,
            "timestamp": self.timestamp.strftime("%Y-%m-%d %H:%M:%S") if self.timestamp else None,
            "temperature": round(self.temperature, 2),
            "pressure": round(self.pressure, 2),
            "vibration": round(self.vibration, 3),
            "rpm": round(self.rpm, 1),
            "current": round(self.current, 2),
            "voltage": round(self.voltage, 2),
            "energy": round(self.energy, 3)
        }

class SecurityEvent(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    event_id = Column(String(100), unique=True, nullable=False, index=True)
    machine_id = Column(String(50), ForeignKey("machines.machine_id", ondelete="CASCADE"), nullable=False, index=True)
    timestamp = Column(DateTime, nullable=False, index=True, default=datetime.utcnow)
    event_type = Column(String(100), nullable=False)
    anomaly_score = Column(Float, nullable=False)
    classification = Column(String(100), nullable=False)
    risk_level = Column(String(50), nullable=False, index=True)
    description = Column(Text, nullable=True)
    
    # Blockchain Evidence Notarization Fields
    data_hash = Column(String(64), nullable=True, index=True)
    blockchain_tx = Column(String(128), nullable=True)
    blockchain_status = Column(String(50), default="PENDING", index=True) # PENDING, RECORDED, NOT_ELIGIBLE, VERIFIED
    block_number = Column(Integer, nullable=True)
    recorded_at = Column(DateTime, nullable=True)

    machine = relationship("Machine", back_populates="events")

    def to_dict(self):
        return {
            "id": self.id,
            "event_id": self.event_id,
            "machine_id": self.machine_id,
            "timestamp": self.timestamp.strftime("%Y-%m-%d %H:%M:%S") if self.timestamp else None,
            "event_type": self.event_type,
            "anomaly_score": round(self.anomaly_score, 4),
            "classification": self.classification,
            "risk_level": self.risk_level,
            "description": self.description,
            "data_hash": self.data_hash,
            "blockchain_tx": self.blockchain_tx,
            "blockchain_status": self.blockchain_status,
            "block_number": self.block_number,
            "recorded_at": self.recorded_at.strftime("%Y-%m-%d %H:%M:%S") if self.recorded_at else None
        }
