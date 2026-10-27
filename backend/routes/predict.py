"""
AI Inference & Prediction API Routes
Connects React frontend manual analysis form and automated telemetry checks to ML pipeline.
"""

from datetime import datetime
from flask import Blueprint, jsonify, request
from ml_service import analyze_machine_telemetry, get_ml_status
from blockchain_service import blockchain_service
from database import SessionLocal
from models import SecurityEvent, Machine, SensorData

predict_bp = Blueprint("predict", __name__, url_prefix="/api/predict")

@predict_bp.route("", methods=["POST"])
def run_prediction():
    payload = request.get_json()
    if not payload:
        return jsonify({"status": "error", "message": "JSON body required"}), 400

    machine_id = payload.get("machine_id", "M01")
    
    # Run multi-stage AI analysis pipeline
    analysis = analyze_machine_telemetry(payload)
    
    # Compute prospective canonical hash
    mock_event = {
        "event_id": f"INSPECT-{int(datetime.utcnow().timestamp())}",
        "machine_id": machine_id,
        "event_type": "MANUAL_AI_INSPECTION",
        "anomaly_score": analysis["anomaly"]["score"],
        "classification": analysis["classification"]["label"],
        "risk_level": analysis["risk"]["level"],
        "timestamp": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    }
    canonical_hash = blockchain_service.generate_canonical_hash(mock_event, payload)

    # If requested to persist event
    save_to_db = payload.get("save_event", False)
    persisted_event = None
    
    if save_to_db:
        db = SessionLocal()
        try:
            event_id = f"EVT-{int(datetime.utcnow().timestamp())}"
            risk_level = analysis["risk"]["level"]
            
            # Record to blockchain if HIGH or CRITICAL
            bc_tx = None
            bc_status = "NOT_ELIGIBLE"
            b_num = None
            rec_at = None

            if risk_level in ["CRITICAL", "HIGH"]:
                b_res = blockchain_service.record_event_evidence(
                    event_id=event_id,
                    machine_id=machine_id,
                    timestamp_epoch=int(datetime.utcnow().timestamp()),
                    risk_level=risk_level,
                    data_hash=canonical_hash
                )
                bc_tx = b_res.get("blockchain_tx")
                bc_status = "RECORDED"
                b_num = b_res.get("block_number")
                rec_at = datetime.utcnow()

            event_obj = SecurityEvent(
                event_id=event_id,
                machine_id=machine_id,
                timestamp=datetime.utcnow(),
                event_type="MANUAL_DIAGNOSTIC_TRIGGER",
                anomaly_score=analysis["anomaly"]["score"],
                classification=analysis["classification"]["label"],
                risk_level=risk_level,
                description=analysis["risk"]["explanation"],
                data_hash=canonical_hash,
                blockchain_tx=bc_tx,
                blockchain_status=bc_status,
                block_number=b_num,
                recorded_at=rec_at
            )
            db.add(event_obj)
            
            # Also store sensor record
            sensor_obj = SensorData(
                machine_id=machine_id,
                timestamp=datetime.utcnow(),
                temperature=float(payload.get("temperature", 50.0)),
                pressure=float(payload.get("pressure", 4.0)),
                vibration=float(payload.get("vibration", 1.0)),
                rpm=float(payload.get("rpm", 2000.0)),
                current=float(payload.get("current", 15.0)),
                voltage=float(payload.get("voltage", 400.0)),
                energy=float(payload.get("energy", 8.0))
            )
            db.add(sensor_obj)
            db.commit()
            persisted_event = event_obj.to_dict()
        finally:
            db.close()

    return jsonify({
        "status": "success",
        "analysis": analysis,
        "prospective_canonical_hash": canonical_hash,
        "persisted_event": persisted_event
    })

@predict_bp.route("/status", methods=["GET"])
def get_status():
    return jsonify({
        "status": "success",
        "ml_engine": get_ml_status()
    })
