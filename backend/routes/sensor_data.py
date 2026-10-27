"""
Sensor Data API Routes
Handles streaming telemetry retrieval and continuous ingestion.
"""

import time
from datetime import datetime
from flask import Blueprint, jsonify, request
from database import SessionLocal
from models import SensorData, SecurityEvent, Machine
from ml_service import analyze_machine_telemetry
from blockchain_service import blockchain_service

sensor_bp = Blueprint("sensor_data", __name__, url_prefix="/api/sensor-data")

@sensor_bp.route("", methods=["GET"])
def get_sensor_data():
    db = SessionLocal()
    try:
        machine_id = request.args.get("machine_id")
        limit = min(int(request.args.get("limit", 100)), 500)
        
        query = db.query(SensorData)
        if machine_id:
            query = query.filter(SensorData.machine_id == machine_id)
            
        readings = query.order_by(SensorData.timestamp.desc()).limit(limit).all()
        return jsonify({
            "status": "success",
            "count": len(readings),
            "data": [r.to_dict() for r in reversed(readings)]
        })
    finally:
        db.close()

@sensor_bp.route("", methods=["POST"])
def ingest_sensor_reading():
    data = request.get_json()
    if not data:
        return jsonify({"status": "error", "message": "Missing JSON body"}), 400

    machine_id = data.get("machine_id")
    if not machine_id:
        return jsonify({"status": "error", "message": "machine_id is required"}), 400

    db = SessionLocal()
    try:
        # Validate machine exists
        machine = db.query(Machine).filter(Machine.machine_id == machine_id).first()
        if not machine:
            return jsonify({"status": "error", "message": f"Machine {machine_id} does not exist"}), 404

        dt = datetime.utcnow()
        if "timestamp" in data:
            try:
                dt = datetime.strptime(data["timestamp"], "%Y-%m-%d %H:%M:%S")
            except Exception:
                pass

        sensor_obj = SensorData(
            machine_id=machine_id,
            timestamp=dt,
            temperature=float(data.get("temperature", 50.0)),
            pressure=float(data.get("pressure", 4.0)),
            vibration=float(data.get("vibration", 1.0)),
            rpm=float(data.get("rpm", 2000.0)),
            current=float(data.get("current", 15.0)),
            voltage=float(data.get("voltage", 400.0)),
            energy=float(data.get("energy", 8.0))
        )
        db.add(sensor_obj)

        # Run Real-Time ML Pipeline on newly ingested telemetry
        analysis = analyze_machine_telemetry(sensor_obj.to_dict())
        anomaly_detected = analysis["anomaly"]["detected"]
        risk_level = analysis["risk"]["level"]

        created_event = None
        if anomaly_detected or risk_level in ["MEDIUM", "HIGH", "CRITICAL"]:
            event_id = f"EVT-{int(time.time() * 1000)}"
            event_type = "ANOMALOUS_TELEMETRY" if not analysis["classification"]["is_suspicious"] else "SIMULATED_MANIPULATION_DETECTED"
            
            # Canonical Hash
            data_hash = blockchain_service.generate_canonical_hash({
                "event_id": event_id,
                "machine_id": machine_id,
                "event_type": event_type,
                "anomaly_score": analysis["anomaly"]["score"],
                "classification": analysis["classification"]["label"],
                "risk_level": risk_level,
                "timestamp": dt.strftime("%Y-%m-%d %H:%M:%S")
            }, sensor_obj.to_dict())

            # Selective Blockchain Notarization for Critical / High
            bc_tx = None
            bc_status = "NOT_ELIGIBLE"
            b_num = None
            rec_at = None

            if risk_level in ["CRITICAL", "HIGH"]:
                b_res = blockchain_service.record_event_evidence(
                    event_id=event_id,
                    machine_id=machine_id,
                    timestamp_epoch=int(dt.timestamp()),
                    risk_level=risk_level,
                    data_hash=data_hash
                )
                bc_tx = b_res.get("blockchain_tx")
                bc_status = "RECORDED"
                b_num = b_res.get("block_number")
                rec_at = datetime.utcnow()

            event_obj = SecurityEvent(
                event_id=event_id,
                machine_id=machine_id,
                timestamp=dt,
                event_type=event_type,
                anomaly_score=analysis["anomaly"]["score"],
                classification=analysis["classification"]["label"],
                risk_level=risk_level,
                description=analysis["risk"]["explanation"],
                data_hash=data_hash,
                blockchain_tx=bc_tx,
                blockchain_status=bc_status,
                block_number=b_num,
                recorded_at=rec_at
            )
            db.add(event_obj)
            
            # Update Machine Status
            machine.status = risk_level
            db.commit()
            created_event = event_obj.to_dict()
        else:
            machine.status = "NORMAL"
            db.commit()

        return jsonify({
            "status": "success",
            "telemetry": sensor_obj.to_dict(),
            "analysis": analysis,
            "event_created": created_event
        }), 201
    finally:
        db.close()

MACHINE_PROFILES = {
    # Normal Stable Operations
    "M01": {"temp": 54.0, "press": 4.5, "vib": 1.1, "rpm": 2800, "curr": 14.2, "volt": 400.0, "type": "nominal"},
    "M03": {"temp": 48.0, "press": 3.2, "vib": 0.8, "rpm": 1800, "curr": 11.0, "volt": 396.0, "type": "nominal"},
    "M06": {"temp": 52.0, "press": 3.8, "vib": 1.1, "rpm": 2400, "curr": 12.5, "volt": 398.0, "type": "nominal"},
    "M08": {"temp": 42.0, "press": 5.0, "vib": 0.6, "rpm": 850, "curr": 16.0, "volt": 400.0, "type": "nominal"},
    "M09": {"temp": 34.0, "press": 2.5, "vib": 0.9, "rpm": 1200, "curr": 13.0, "volt": 397.0, "type": "nominal"},
    "M10": {"temp": 46.0, "press": 3.5, "vib": 0.9, "rpm": 2100, "curr": 10.5, "volt": 401.0, "type": "nominal"},

    # Moderate Warning / Anomaly Machine
    "M05": {"temp": 78.0, "press": 6.8, "vib": 3.1, "rpm": 1400, "curr": 20.0, "volt": 398.0, "type": "warning"},

    # High Risk Machines (Severe Thermal / Mechanical Wear)
    "M04": {"temp": 89.5, "press": 6.2, "vib": 4.4, "rpm": 3200, "curr": 39.0, "volt": 392.0, "type": "high_risk"},
    "M07": {"temp": 91.0, "press": 7.8, "vib": 4.5, "rpm": 2900, "curr": 40.2, "volt": 390.0, "type": "high_risk"},

    # Critical Risk Machine (Thermal Runaway & Hydraulic Pressure Collapse)
    "M02": {"temp": 95.5, "press": 0.6, "vib": 5.2, "rpm": 950, "curr": 44.0, "volt": 380.0, "type": "critical"}
}

def generate_random_telemetry(machine_id: str):
    import random
    base = MACHINE_PROFILES.get(machine_id, {"temp": 55.0, "press": 4.5, "vib": 1.2, "rpm": 2000, "curr": 15.0, "volt": 400.0, "type": "nominal"})
    
    # Natural Gaussian fluctuations around baseline
    temp = base["temp"] + random.gauss(0, 1.2)
    vib = max(0.2, base["vib"] + random.gauss(0, 0.12))
    press = max(0.4, base["press"] + random.gauss(0, 0.15))
    rpm = max(100.0, base["rpm"] + random.gauss(0, 30))
    curr = max(1.0, base["curr"] + random.gauss(0, 0.6))
    volt = base["volt"] + random.gauss(0, 2.0)

    # Occasional transient surge (8% chance)
    if random.random() < 0.08 and base["type"] == "nominal":
        temp += random.uniform(8.0, 18.0)
        vib += random.uniform(1.0, 2.2)
        curr += random.uniform(5.0, 12.0)

    power_kw = (1.732 * volt * curr * 0.88) / 1000.0
    energy = power_kw * (1.0 + random.uniform(-0.02, 0.02))

    return {
        "machine_id": machine_id,
        "temperature": round(temp, 2),
        "pressure": round(press, 2),
        "vibration": round(vib, 2),
        "rpm": round(rpm, 0),
        "current": round(curr, 2),
        "voltage": round(volt, 1),
        "energy": round(energy, 2)
    }

@sensor_bp.route("/simulate-tick", methods=["POST"])
def simulate_live_tick():
    data = request.get_json(silent=True) or {}
    machine_id = data.get("machine_id", "M01")
    reading_payload = generate_random_telemetry(machine_id)

    db = SessionLocal()
    try:
        sensor_obj = SensorData(
            timestamp=datetime.utcnow(),
            **reading_payload
        )
        db.add(sensor_obj)
        
        analysis = analyze_machine_telemetry(reading_payload)
        lvl = analysis["risk"]["level"]
        m_status = "NORMAL" if lvl == "LOW" else ("CRITICAL" if lvl == "CRITICAL" else "ANOMALY")
        
        machine = db.query(Machine).filter(Machine.machine_id == machine_id).first()
        if machine:
            machine.status = m_status

        db.commit()

        return jsonify({
            "status": "success",
            "telemetry": sensor_obj.to_dict(),
            "analysis": analysis
        })
    finally:
        db.close()

@sensor_bp.route("/simulate-fleet-tick", methods=["POST"])
def simulate_fleet_tick():
    db = SessionLocal()
    try:
        machines = db.query(Machine).all()
        results = []
        for m in machines:
            payload = generate_random_telemetry(m.machine_id)
            sensor_obj = SensorData(
                timestamp=datetime.utcnow(),
                **payload
            )
            db.add(sensor_obj)
            
            analysis = analyze_machine_telemetry(payload)
            lvl = analysis["risk"]["level"]
            m.status = "NORMAL" if lvl == "LOW" else ("CRITICAL" if lvl == "CRITICAL" else "ANOMALY")
            results.append({"machine_id": m.machine_id, "status": m.status, "risk_level": lvl, "telemetry": payload})

        db.commit()
        return jsonify({"status": "success", "count": len(results), "fleet": results})
    finally:
        db.close()
