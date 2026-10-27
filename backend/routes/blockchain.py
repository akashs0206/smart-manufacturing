"""
Blockchain Evidence Ledger & Verification API Routes
"""

from flask import Blueprint, jsonify, request
from blockchain_service import blockchain_service
from database import SessionLocal
from models import SecurityEvent

blockchain_bp = Blueprint("blockchain", __name__, url_prefix="/api/blockchain")

@blockchain_bp.route("/status", methods=["GET"])
def get_blockchain_status():
    return jsonify({
        "status": "success",
        "blockchain": blockchain_service.get_blockchain_status()
    })

@blockchain_bp.route("/events", methods=["GET"])
def get_recorded_blockchain_events():
    db = SessionLocal()
    try:
        events = (
            db.query(SecurityEvent)
            .filter(SecurityEvent.blockchain_status == "RECORDED")
            .order_by(SecurityEvent.recorded_at.desc())
            .all()
        )
        return jsonify({
            "status": "success",
            "total_onchain_events": len(events),
            "data": [e.to_dict() for e in events]
        })
    finally:
        db.close()

@blockchain_bp.route("/events/<event_id>", methods=["GET"])
def get_onchain_event_evidence(event_id):
    evidence = blockchain_service.get_event_evidence(event_id)
    return jsonify({
        "status": "success",
        "evidence": evidence
    })

@blockchain_bp.route("/verify/<event_id>", methods=["GET"])
def verify_event_hash(event_id):
    db = SessionLocal()
    try:
        event = db.query(SecurityEvent).filter(SecurityEvent.event_id == event_id).first()
        if not event:
            return jsonify({"status": "error", "message": f"Event {event_id} not found in database"}), 404

        if not event.data_hash:
            return jsonify({
                "status": "error",
                "message": f"Event {event_id} does not have a registered SHA-256 data hash"
            }), 400

        verification = blockchain_service.verify_event_integrity(event.event_id, event.data_hash)
        
        return jsonify({
            "status": "success",
            "event_id": event.event_id,
            "machine_id": event.machine_id,
            "risk_level": event.risk_level,
            "verification": verification
        })
    finally:
        db.close()
