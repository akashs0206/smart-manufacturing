"""
Security & Anomaly Events API Routes
Manages event filtering, detailed auditing, and manual blockchain notarization triggers.
"""

from datetime import datetime
import time
from flask import Blueprint, jsonify, request
from database import SessionLocal
from models import SecurityEvent, SensorData
from blockchain_service import blockchain_service

events_bp = Blueprint("events", __name__, url_prefix="/api/events")

@events_bp.route("", methods=["GET"])
def get_events():
    db = SessionLocal()
    try:
        search = request.args.get("search", "").strip().lower()
        machine_id = request.args.get("machine_id", "").strip()
        risk_level = request.args.get("risk_level", "").strip()
        blockchain_status = request.args.get("blockchain_status", "").strip()
        limit = min(int(request.args.get("limit", 100)), 500)
        offset = int(request.args.get("offset", 0))

        query = db.query(SecurityEvent)

        if machine_id:
            query = query.filter(SecurityEvent.machine_id == machine_id)
        if risk_level and risk_level != "ALL":
            query = query.filter(SecurityEvent.risk_level == risk_level)
        if blockchain_status and blockchain_status != "ALL":
            query = query.filter(SecurityEvent.blockchain_status == blockchain_status)

        if search:
            query = query.filter(
                (SecurityEvent.event_id.ilike(f"%{search}%")) |
                (SecurityEvent.machine_id.ilike(f"%{search}%")) |
                (SecurityEvent.event_type.ilike(f"%{search}%")) |
                (SecurityEvent.description.ilike(f"%{search}%"))
            )

        total_count = query.count()
        events = (
            query.order_by(SecurityEvent.timestamp.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )

        return jsonify({
            "status": "success",
            "total": total_count,
            "count": len(events),
            "offset": offset,
            "limit": limit,
            "data": [e.to_dict() for e in events]
        })
    finally:
        db.close()

@events_bp.route("/<event_id>", methods=["GET"])
def get_event_details(event_id):
    db = SessionLocal()
    try:
        event = db.query(SecurityEvent).filter(SecurityEvent.event_id == event_id).first()
        if not event:
            return jsonify({"status": "error", "message": f"Event {event_id} not found"}), 404

        # Nearest sensor telemetry at time of event
        sensor_snapshot = (
            db.query(SensorData)
            .filter(SensorData.machine_id == event.machine_id)
            .filter(SensorData.timestamp <= event.timestamp)
            .order_by(SensorData.timestamp.desc())
            .first()
        )

        # Blockchain verification check
        blockchain_verification = None
        if event.blockchain_status == "RECORDED" and event.data_hash:
            blockchain_verification = blockchain_service.verify_event_integrity(event.event_id, event.data_hash)

        return jsonify({
            "status": "success",
            "event": event.to_dict(),
            "telemetry_context": sensor_snapshot.to_dict() if sensor_snapshot else None,
            "blockchain_verification": blockchain_verification
        })
    finally:
        db.close()

@events_bp.route("/<event_id>/record-blockchain", methods=["POST"])
def record_event_to_blockchain(event_id):
    db = SessionLocal()
    try:
        payload = request.get_json(silent=True) or {}
        client_tx = payload.get("blockchain_tx") or payload.get("tx_hash")
        client_block = payload.get("block_number")
        client_sender = payload.get("recorded_by")

        event = db.query(SecurityEvent).filter(SecurityEvent.event_id == event_id).first()
        if not event:
            if client_tx:
                # If transaction was confirmed on-chain via MetaMask, persist as a new SecurityEvent
                event = SecurityEvent(
                    event_id=event_id,
                    machine_id=payload.get("machine_id", "M01"),
                    timestamp=datetime.utcnow(),
                    event_type=payload.get("event_type", "METAMASK_INTERACTIVE_NOTARIZATION"),
                    anomaly_score=float(payload.get("anomaly_score", 0.95)),
                    classification=payload.get("classification", "On-Chain Verified Event"),
                    risk_level=payload.get("risk_level", "CRITICAL"),
                    description=payload.get("description", "Directly notarized onto Ethereum blockchain via connected MetaMask wallet."),
                    data_hash=payload.get("data_hash", ""),
                    blockchain_tx=client_tx,
                    blockchain_status="RECORDED",
                    block_number=client_block or blockchain_service._current_block,
                    recorded_at=datetime.utcnow()
                )
                db.add(event)
                db.commit()
            else:
                return jsonify({"status": "error", "message": f"Event {event_id} not found"}), 404

        if event.blockchain_status == "RECORDED" and not client_tx:
            return jsonify({
                "status": "already_recorded",
                "message": f"Event {event_id} is already notarized on blockchain",
                "event": event.to_dict()
            }), 200

        # Generate canonical data hash if not already computed
        if not event.data_hash:
            event.data_hash = blockchain_service.generate_canonical_hash(event.to_dict())

        epoch_time = int(time.mktime(event.timestamp.timetuple())) if event.timestamp else int(time.time())

        if client_tx:
            # Client provided MetaMask transaction receipt
            b_res = {
                "success": True,
                "event_id": event.event_id,
                "machine_id": event.machine_id,
                "data_hash": event.data_hash,
                "blockchain_tx": client_tx,
                "block_number": client_block or blockchain_service._current_block,
                "network": "MetaMask-Client-Tx",
                "recorded_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
            }
            # Register in simulated ledger index if running in standalone mode
            blockchain_service._simulated_chain[event.event_id] = {
                "eventId": event.event_id,
                "machineId": event.machine_id,
                "timestamp": epoch_time,
                "riskLevel": event.risk_level,
                "dataHash": event.data_hash,
                "recordedBy": client_sender or "MetaMask-User",
                "blockTimestamp": int(time.time()),
                "blockNumber": client_block or blockchain_service._current_block,
                "txHash": client_tx,
                "isRecorded": True
            }
        else:
            # Commit via Server-Side Web3 Provider
            b_res = blockchain_service.record_event_evidence(
                event_id=event.event_id,
                machine_id=event.machine_id,
                timestamp_epoch=epoch_time,
                risk_level=event.risk_level,
                data_hash=event.data_hash
            )

        event.blockchain_tx = b_res.get("blockchain_tx")
        event.blockchain_status = "RECORDED"
        event.block_number = b_res.get("block_number")
        event.recorded_at = datetime.utcnow()
        db.commit()

        return jsonify({
            "status": "success",
            "message": f"Event {event_id} cryptographic evidence permanently committed to smart contract.",
            "blockchain_receipt": b_res,
            "event": event.to_dict()
        })
    finally:
        db.close()
