"""
Machines API Routes
"""

from flask import Blueprint, jsonify, request
from database import SessionLocal
from models import Machine, SensorData, SecurityEvent

machines_bp = Blueprint("machines", __name__, url_prefix="/api/machines")

@machines_bp.route("", methods=["GET"])
def get_all_machines():
    from ml_service import analyze_machine_telemetry
    db = SessionLocal()
    try:
        machines = db.query(Machine).order_by(Machine.machine_id).all()
        result = []
        
        for m in machines:
            # Fetch latest sensor reading for this machine
            latest_sensor = (
                db.query(SensorData)
                .filter(SensorData.machine_id == m.machine_id)
                .order_by(SensorData.timestamp.desc())
                .first()
            )
            
            # Dynamic status computed in real time from latest telemetry
            if latest_sensor:
                analysis = analyze_machine_telemetry(latest_sensor.to_dict())
                lvl = analysis["risk"]["level"]
                m_status = "NORMAL" if lvl == "LOW" else ("CRITICAL" if lvl == "CRITICAL" else "ANOMALY")
            else:
                m_status = m.status
            
            # Count recent critical/high risk events
            unresolved_events = (
                db.query(SecurityEvent)
                .filter(SecurityEvent.machine_id == m.machine_id)
                .count()
            )
            
            m_dict = m.to_dict()
            m_dict["status"] = m_status
            m_dict["latest_telemetry"] = latest_sensor.to_dict() if latest_sensor else None
            m_dict["total_events"] = unresolved_events
            result.append(m_dict)
            
        return jsonify({"status": "success", "count": len(result), "data": result})
    finally:
        db.close()

@machines_bp.route("/<machine_id>", methods=["GET"])
def get_machine_details(machine_id):
    db = SessionLocal()
    try:
        machine = db.query(Machine).filter(Machine.machine_id == machine_id).first()
        if not machine:
            return jsonify({"status": "error", "message": f"Machine {machine_id} not found"}), 404
        
        # Recent sensor readings for historical plotting (up to 100 points)
        recent_sensors = (
            db.query(SensorData)
            .filter(SensorData.machine_id == machine_id)
            .order_by(SensorData.timestamp.desc())
            .limit(100)
            .all()
        )
        # Reverse to chronological order for charts
        history = [s.to_dict() for s in reversed(recent_sensors)]
        
        # Recent events for this machine
        events = (
            db.query(SecurityEvent)
            .filter(SecurityEvent.machine_id == machine_id)
            .order_by(SecurityEvent.timestamp.desc())
            .limit(20)
            .all()
        )
        
        latest_reading = history[-1] if history else None
        
        return jsonify({
            "status": "success",
            "machine": machine.to_dict(),
            "latest_reading": latest_reading,
            "telemetry_history": history,
            "events": [e.to_dict() for e in events]
        })
    finally:
        db.close()

@machines_bp.route("/<machine_id>/status", methods=["PUT"])
def update_machine_status(machine_id):
    db = SessionLocal()
    try:
        machine = db.query(Machine).filter(Machine.machine_id == machine_id).first()
        if not machine:
            return jsonify({"status": "error", "message": f"Machine {machine_id} not found"}), 404
            
        data = request.get_json() or {}
        new_status = data.get("status", machine.status)
        machine.status = new_status
        db.commit()
        
        return jsonify({"status": "success", "machine": machine.to_dict()})
    finally:
        db.close()
