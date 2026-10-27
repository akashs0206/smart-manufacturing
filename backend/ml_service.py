"""
Backend ML Service Interface
Connects Flask routes to the trained Machine Learning inference engine.
"""

import os
import sys
from typing import Dict, Any

# Ensure ML package is reachable in Python sys.path
backend_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(backend_dir)
ml_dir = os.path.join(project_root, "ml")

if ml_dir not in sys.path:
    sys.path.insert(0, ml_dir)

try:
    from predict import get_inference_engine
    _engine = get_inference_engine()
except Exception as e:
    print(f"[MLService] Warning loading inference engine: {e}")
    _engine = None

def analyze_machine_telemetry(sensor_dict: Dict[str, float]) -> Dict[str, Any]:
    """
    Executes end-to-end telemetry analysis:
    Isolation Forest -> XGBoost -> Risk Assessment -> Feature Attribution
    """
    if _engine is not None:
        return _engine.analyze_telemetry(sensor_dict)
    
    # Fallback response structure if engine failed to load
    temp = float(sensor_dict.get("temperature", 50.0))
    vib = float(sensor_dict.get("vibration", 1.0))
    is_anomaly = (temp > 75.0 or vib > 3.0)
    
    return {
        "sensor_input": sensor_dict,
        "anomaly": {
            "detected": is_anomaly,
            "status": "YES" if is_anomaly else "NO",
            "score": 0.85 if is_anomaly else 0.15
        },
        "classification": {
            "is_suspicious": False,
            "label": "Standard Operational Reading",
            "probability": 0.1
        },
        "risk": {
            "level": "HIGH" if is_anomaly else "LOW",
            "composite_score": 75.0 if is_anomaly else 15.0,
            "reasons": ["Heuristic fallback rule triggered due to elevated parameters." if is_anomaly else "Nominal parameters."],
            "explanation": "Elevated thermal or vibration signature detected." if is_anomaly else "Nominal.",
            "recommended_action": "Inspection recommended." if is_anomaly else "Normal operation.",
            "eligible_for_blockchain": is_anomaly,
            "feature_impacts": {"temperature": 0.8 if is_anomaly else 0.2}
        }
    }

def get_ml_status() -> Dict[str, Any]:
    models_dir = os.path.join(ml_dir, "saved_models")
    return {
        "engine_active": _engine is not None and getattr(_engine, "is_loaded", False),
        "stage1_model": "Isolation Forest (Unsupervised Anomaly Detection)",
        "stage2_model": "Gradient Boosted Trees / XGBoost (Simulated Data Manipulation Classifier)",
        "risk_engine": "Dynamic Multi-Factor Boundary & Attribution Scorer",
        "models_path": models_dir
    }
