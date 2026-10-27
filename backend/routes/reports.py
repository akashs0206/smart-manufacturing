"""
Analytics & Summary Reports API Routes
Supplies aggregated metrics, distributions, and trend data for the main dashboard and reports page.
"""

from collections import Counter
from flask import Blueprint, jsonify
from sqlalchemy import func
from database import SessionLocal
from models import Machine, SensorData, SecurityEvent

reports_bp = Blueprint("reports", __name__, url_prefix="/api/reports")

@reports_bp.route("/summary", methods=["GET"])
def get_dashboard_summary():
    db = SessionLocal()
    try:
        # 1. Total Machines & Statuses
        total_machines = db.query(Machine).count()
        machines = db.query(Machine).all()
        
        from ml_service import analyze_machine_telemetry
        dynamic_statuses = []
        for m in machines:
            latest_sensor = (
                db.query(SensorData)
                .filter(SensorData.machine_id == m.machine_id)
                .order_by(SensorData.timestamp.desc())
                .first()
            )
            if latest_sensor:
                analysis = analyze_machine_telemetry(latest_sensor.to_dict())
                lvl = analysis["risk"]["level"]
                st = "NORMAL" if lvl == "LOW" else ("CRITICAL" if lvl == "CRITICAL" else "ANOMALY")
            else:
                st = m.status
            dynamic_statuses.append(st)

        machine_status_counts = Counter(dynamic_statuses)
        normal_machines = machine_status_counts.get("NORMAL", 0)

        # 2. Events Aggregations
        total_events = db.query(SecurityEvent).count()
        
        # Risk level counts
        risk_query = (
            db.query(SecurityEvent.risk_level, func.count(SecurityEvent.id))
            .group_by(SecurityEvent.risk_level)
            .all()
        )
        risk_distribution = {r[0]: r[1] for r in risk_query}
        
        high_risk_count = risk_distribution.get("HIGH", 0)
        critical_risk_count = risk_distribution.get("CRITICAL", 0)
        medium_risk_count = risk_distribution.get("MEDIUM", 0)
        low_risk_count = risk_distribution.get("LOW", 0)

        # Suspicious events count
        suspicious_count = (
            db.query(SecurityEvent)
            .filter(SecurityEvent.classification.ilike("%Suspicious%"))
            .count()
        )

        # Anomalies count (any event with anomaly_score > 0.5 or event_type != 'NORMAL')
        total_anomalies = total_events

        # Blockchain recorded events
        blockchain_recorded_count = (
            db.query(SecurityEvent)
            .filter(SecurityEvent.blockchain_status == "RECORDED")
            .count()
        )

        # 3. Machine-wise Anomaly Breakdown
        machine_anomalies_query = (
            db.query(SecurityEvent.machine_id, func.count(SecurityEvent.id))
            .group_by(SecurityEvent.machine_id)
            .order_by(func.count(SecurityEvent.id).desc())
            .all()
        )
        machine_anomalies = [{"machine_id": ma[0], "count": ma[1]} for ma in machine_anomalies_query]

        # 4. Event Type Distribution
        event_types_query = (
            db.query(SecurityEvent.event_type, func.count(SecurityEvent.id))
            .group_by(SecurityEvent.event_type)
            .order_by(func.count(SecurityEvent.id).desc())
            .all()
        )
        event_type_distribution = [{"type": et[0], "count": et[1]} for et in event_types_query]

        # 5. Recent 10 Events
        recent_events = (
            db.query(SecurityEvent)
            .order_by(SecurityEvent.timestamp.desc())
            .limit(10)
            .all()
        )

        # 6. Global Telemetry Averages / Trends
        recent_telemetry = (
            db.query(SensorData)
            .order_by(SensorData.timestamp.desc())
            .limit(30)
            .all()
        )
        telemetry_trend = [
            {
                "time": s.timestamp.strftime("%H:%M") if s.timestamp else "",
                "temperature": round(s.temperature, 1),
                "vibration": round(s.vibration, 2),
                "energy": round(s.energy, 2),
                "pressure": round(s.pressure, 1),
                "rpm": round(s.rpm, 0)
            }
            for s in reversed(recent_telemetry)
        ]

        return jsonify({
            "status": "success",
            "metrics": {
                "total_machines": total_machines,
                "normal_machines": normal_machines,
                "anomalies_detected": total_anomalies,
                "suspicious_events": suspicious_count,
                "high_risk_events": high_risk_count,
                "critical_events": critical_risk_count,
                "blockchain_recorded_events": blockchain_recorded_count
            },
            "machine_status_distribution": [
                {"name": "Normal", "value": normal_machines, "color": "#10B981"},
                {"name": "Anomalous", "value": machine_status_counts.get("ANOMALY", 0), "color": "#F59E0B"},
                {"name": "Critical", "value": machine_status_counts.get("CRITICAL", 0), "color": "#EF4444"}
            ],
            "risk_distribution": [
                {"name": "Low", "count": low_risk_count, "color": "#10B981"},
                {"name": "Medium", "count": medium_risk_count, "color": "#F59E0B"},
                {"name": "High", "count": high_risk_count, "color": "#F97316"},
                {"name": "Critical", "count": critical_risk_count, "color": "#EF4444"}
            ],
            "machine_anomalies": machine_anomalies,
            "event_type_distribution": event_type_distribution,
            "telemetry_trend": telemetry_trend,
            "recent_events": [e.to_dict() for e in recent_events]
        })
    finally:
        db.close()
