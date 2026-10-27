"""
Database Seeding Script
Populates machines, historical sensor telemetry, and security events from the dataset.
Notarizes critical initial events onto the blockchain ledger.
"""

import os
import time
import pandas as pd
from datetime import datetime
from database import engine, SessionLocal, init_db
from models import Base, Machine, SensorData, SecurityEvent
from blockchain_service import blockchain_service

def seed_database(max_sensor_rows: int = 1500):
    # Re-create fresh tables
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()

    base_dir = os.path.dirname(os.path.abspath(__file__))
    dataset_path = os.path.join(os.path.dirname(base_dir), "dataset", "manufacturing_data.csv")

    if not os.path.exists(dataset_path):
        print(f"Dataset not found at {dataset_path}. Please generate dataset first.")
        return

    print("Reading dataset for database seeding...")
    df = pd.read_csv(dataset_path)

    # 1. Seed Machines
    print("Seeding machine fleet registry (M01 - M10)...")
    machine_meta = df[["machine_id", "machine_name", "machine_type"]].drop_duplicates()
    
    for _, row in machine_meta.iterrows():
        m_id = row["machine_id"]
        # Realistic showcase fleet distribution: 7 Normal, 2 Anomaly/Warning, 1 Critical
        status_map = {
            "M01": "NORMAL",
            "M02": "CRITICAL",
            "M03": "NORMAL",
            "M04": "ANOMALY",
            "M05": "NORMAL",
            "M06": "NORMAL",
            "M07": "ANOMALY",
            "M08": "NORMAL",
            "M09": "NORMAL",
            "M10": "NORMAL"
        }
        status = status_map.get(m_id, "NORMAL")

        machine = Machine(
            machine_id=row["machine_id"],
            machine_name=row["machine_name"],
            machine_type=row["machine_type"],
            status=status
        )
        db.add(machine)
    db.commit()
    print(f"Seeded {len(machine_meta)} machines.")

    # 2. Seed Sensor Telemetry Data
    print(f"Seeding historical sensor telemetry (subset of {max_sensor_rows} readings)...")
    sample_df = df.head(max_sensor_rows)
    sensor_objs = []
    
    for _, row in sample_df.iterrows():
        dt = datetime.strptime(row["timestamp"], "%Y-%m-%d %H:%M:%S")
        sensor_obj = SensorData(
            machine_id=row["machine_id"],
            timestamp=dt,
            temperature=float(row["temperature"]),
            pressure=float(row["pressure"]),
            vibration=float(row["vibration"]),
            rpm=float(row["rpm"]),
            current=float(row["current"]),
            voltage=float(row["voltage"]),
            energy=float(row["energy"])
        )
        sensor_objs.append(sensor_obj)
    
    db.add_all(sensor_objs)
    db.commit()
    print(f"Seeded {len(sensor_objs)} sensor telemetry records.")

    # 3. Seed Security & Operational Events
    print("Extracting anomaly and data manipulation events for event registry...")
    anomaly_df = df[df["is_anomaly"] == 1].head(150).copy() # Seed top 150 events for responsive queries
    
    event_counter = 1000
    for _, row in anomaly_df.iterrows():
        event_counter += 1
        event_id = f"EVT-{event_counter}"
        dt = datetime.strptime(row["timestamp"], "%Y-%m-%d %H:%M:%S")
        epoch_time = int(time.mktime(dt.timetuple()))
        
        anomaly_score = 0.92 if row["risk_level"] == "CRITICAL" else (0.78 if row["risk_level"] == "HIGH" else 0.55)
        classification = "Suspicious / Manipulated" if row["is_manipulated"] == 1 else "Standard Physical Anomaly"
        
        telemetry_snapshot = {
            "temperature": row["temperature"],
            "pressure": row["pressure"],
            "vibration": row["vibration"],
            "rpm": row["rpm"],
            "current": row["current"],
            "voltage": row["voltage"],
            "energy": row["energy"]
        }
        
        event_dict = {
            "event_id": event_id,
            "machine_id": row["machine_id"],
            "event_type": row["anomaly_type"],
            "anomaly_score": anomaly_score,
            "classification": classification,
            "risk_level": row["risk_level"],
            "timestamp": row["timestamp"]
        }
        
        # Generate SHA-256 Canonical Hash
        data_hash = blockchain_service.generate_canonical_hash(event_dict, telemetry_snapshot)
        
        # Record critical / high risk events to blockchain
        if row["risk_level"] in ["CRITICAL", "HIGH"]:
            b_res = blockchain_service.record_event_evidence(
                event_id=event_id,
                machine_id=row["machine_id"],
                timestamp_epoch=epoch_time,
                risk_level=row["risk_level"],
                data_hash=data_hash
            )
            bc_tx = b_res.get("blockchain_tx")
            bc_status = "RECORDED"
            b_num = b_res.get("block_number")
            rec_at = datetime.utcnow()
        else:
            bc_tx = None
            bc_status = "NOT_ELIGIBLE"
            b_num = None
            rec_at = None

        event_obj = SecurityEvent(
            event_id=event_id,
            machine_id=row["machine_id"],
            timestamp=dt,
            event_type=row["anomaly_type"],
            anomaly_score=anomaly_score,
            classification=classification,
            risk_level=row["risk_level"],
            description=row["scenario_description"],
            data_hash=data_hash,
            blockchain_tx=bc_tx,
            blockchain_status=bc_status,
            block_number=b_num,
            recorded_at=rec_at
        )
        db.add(event_obj)

    db.commit()
    print(f"Seeded {len(anomaly_df)} security events into event registry with blockchain notarization.")
    db.close()
    print("Database seeding completed successfully!")

if __name__ == "__main__":
    seed_database()
