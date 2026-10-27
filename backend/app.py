"""
Main Flask REST API Server
AI and Blockchain-Based Anomaly & Fraud Detection Framework for Smart Manufacturing
"""

import os
from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

from database import init_db, db_type
from ml_service import get_ml_status
from blockchain_service import blockchain_service

# Load environment variables
load_dotenv()

# Import Blueprints
from routes.machines import machines_bp
from routes.sensor_data import sensor_bp
from routes.events import events_bp
from routes.predict import predict_bp
from routes.blockchain import blockchain_bp
from routes.reports import reports_bp

def create_app():
    app = Flask(__name__)
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Register Blueprints
    app.register_blueprint(machines_bp)
    app.register_blueprint(sensor_bp)
    app.register_blueprint(events_bp)
    app.register_blueprint(predict_bp)
    app.register_blueprint(blockchain_bp)
    app.register_blueprint(reports_bp)

    @app.route("/", methods=["GET"])
    def root():
        return jsonify({
            "project": "AI & Blockchain-Based Anomaly & Fraud Detection Framework for Smart Manufacturing",
            "status": "online",
            "version": "1.0.0-academic-release",
            "endpoints": [
                "/api/health",
                "/api/machines",
                "/api/sensor-data",
                "/api/events",
                "/api/predict",
                "/api/blockchain/status",
                "/api/blockchain/events",
                "/api/reports/summary"
            ]
        })

    @app.route("/api/health", methods=["GET"])
    def health_check():
        ml_stat = get_ml_status()
        bc_stat = blockchain_service.get_blockchain_status()
        
        return jsonify({
            "status": "healthy",
            "database": {
                "engine": db_type,
                "status": "connected"
            },
            "machine_learning": {
                "active": ml_stat["engine_active"],
                "stage1": ml_stat["stage1_model"],
                "stage2": ml_stat["stage2_model"]
            },
            "blockchain": {
                "network": bc_stat["network"],
                "contract_address": bc_stat["contract_address"],
                "current_block": bc_stat["current_block"],
                "total_notarized_events": bc_stat["total_notarized_events"]
            }
        })

    return app

if __name__ == "__main__":
    init_db()
    app = create_app()
    port = int(os.getenv("PORT", 5000))
    print(f"Starting Smart Manufacturing REST API on port {port}...")
    app.run(host="0.0.0.0", port=port, debug=False)
