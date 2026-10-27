"""
Unified ML Inference Pipeline
Orchestrates Preprocessing, Isolation Forest Anomaly Detection, XGBoost Suspicious Event Classification, and Risk Assessment.
"""

import os
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any

try:
    from ml.preprocessing import prepare_single_sample, load_preprocessor, FEATURE_COLUMNS
    from ml.risk_assessment import calculate_risk
except ImportError:
    from preprocessing import prepare_single_sample, load_preprocessor, FEATURE_COLUMNS
    from risk_assessment import calculate_risk

class MLInferenceEngine:
    def __init__(self, models_dir: str = None):
        if models_dir is None:
            base_dir = os.path.dirname(os.path.abspath(__file__))
            self.models_dir = os.path.join(base_dir, "saved_models")
        else:
            self.models_dir = models_dir
            
        self.scaler = None
        self.iso_forest = None
        self.xgb_classifier = None
        self.is_loaded = False
        
        self.load_models()

    def load_models(self) -> bool:
        scaler_path = os.path.join(self.models_dir, "scaler.pkl")
        iso_path = os.path.join(self.models_dir, "isolation_forest.pkl")
        xgb_path = os.path.join(self.models_dir, "xgboost_model.pkl")

        if os.path.exists(scaler_path) and os.path.exists(iso_path) and os.path.exists(xgb_path):
            try:
                self.scaler = joblib.load(scaler_path)
                self.iso_forest = joblib.load(iso_path)
                self.xgb_classifier = joblib.load(xgb_path)
                self.is_loaded = True
                print("Successfully loaded trained ML models from disk.")
                return True
            except Exception as e:
                print(f"Error loading trained models: {e}. Falling back to rule-based fallback.")
                self.is_loaded = False
                return False
        else:
            print("Trained models not found on disk. Initializing with rule-based fallback engine.")
            self.is_loaded = False
            return False

    def predict_anomaly(self, sensor_dict: Dict[str, float]) -> Dict[str, Any]:
        """
        Stage 1: Isolation Forest Inference
        """
        if self.is_loaded and self.iso_forest and self.scaler:
            X_scaled = prepare_single_sample(sensor_dict, self.scaler)
            raw_pred = self.iso_forest.predict(X_scaled)[0]
            is_anomaly = bool(raw_pred == -1)
            
            # Decision function: Negative score = anomaly. Sigmoid mapping to [0.0, 1.0]
            decision_score = self.iso_forest.decision_function(X_scaled)[0]
            anomaly_score = float(1.0 / (1.0 + np.exp(decision_score * 6.0)))
        else:
            # Fallback heuristic if models not yet trained
            temp = float(sensor_dict.get("temperature", 50.0))
            vib = float(sensor_dict.get("vibration", 1.0))
            is_anomaly = (temp > 75.0 or vib > 3.0)
            anomaly_score = 0.85 if is_anomaly else 0.15
            
        return {
            "is_anomaly": is_anomaly,
            "anomaly_status": "YES" if is_anomaly else "NO",
            "anomaly_score": round(anomaly_score, 4)
        }

    def predict_suspicious(self, sensor_dict: Dict[str, float]) -> Dict[str, Any]:
        """
        Stage 2: XGBoost Classifier Inference for Controlled Data Manipulation / Tampering
        """
        if self.is_loaded and self.xgb_classifier and self.scaler:
            X_scaled = prepare_single_sample(sensor_dict, self.scaler)
            prob_suspicious = float(self.xgb_classifier.predict_proba(X_scaled)[0][1])
            is_suspicious = bool(prob_suspicious >= 0.5)
        else:
            # Fallback heuristic
            curr = float(sensor_dict.get("current", 15.0))
            energy = float(sensor_dict.get("energy", 5.0))
            rpm = float(sensor_dict.get("rpm", 2000.0))
            is_suspicious = (curr > 20.0 and energy < 0.5) or (rpm > 1500 and curr < 1.0)
            prob_suspicious = 0.88 if is_suspicious else 0.12

        classification = "Suspicious / Manipulated" if is_suspicious else "Standard / Normal Physical"
        
        return {
            "is_suspicious": is_suspicious,
            "classification": classification,
            "suspicious_probability": round(prob_suspicious, 4)
        }

    def analyze_telemetry(self, sensor_dict: Dict[str, float]) -> Dict[str, Any]:
        """
        Full End-to-End Pipeline
        """
        anomaly_res = self.predict_anomaly(sensor_dict)
        suspicious_res = self.predict_suspicious(sensor_dict)
        
        risk_res = calculate_risk(
            sensor_data=sensor_dict,
            anomaly_score=anomaly_res["anomaly_score"],
            suspicious_prob=suspicious_res["suspicious_probability"],
            is_anomaly=anomaly_res["is_anomaly"],
            is_suspicious=suspicious_res["is_suspicious"]
        )

        return {
            "sensor_input": {k: round(float(sensor_dict.get(k, 0.0)), 2) for k in FEATURE_COLUMNS},
            "anomaly": {
                "detected": anomaly_res["is_anomaly"],
                "status": anomaly_res["anomaly_status"],
                "score": anomaly_res["anomaly_score"]
            },
            "classification": {
                "is_suspicious": suspicious_res["is_suspicious"],
                "label": suspicious_res["classification"],
                "probability": suspicious_res["suspicious_probability"]
            },
            "risk": {
                "level": risk_res["risk_level"],
                "composite_score": risk_res["composite_score"],
                "reasons": risk_res["reasons"],
                "explanation": risk_res["explanation"],
                "recommended_action": risk_res["recommended_action"],
                "eligible_for_blockchain": risk_res["eligible_for_blockchain"],
                "feature_impacts": risk_res["feature_impacts"]
            }
        }

# Global singleton
_engine_instance = None

def get_inference_engine() -> MLInferenceEngine:
    global _engine_instance
    if _engine_instance is None:
        _engine_instance = MLInferenceEngine()
    return _engine_instance

if __name__ == "__main__":
    engine = get_inference_engine()
    test_normal = {"temperature": 55.0, "pressure": 4.5, "vibration": 1.2, "rpm": 2800, "current": 14.5, "voltage": 400.0, "energy": 8.8}
    test_critical = {"temperature": 96.5, "pressure": 1.2, "vibration": 5.4, "rpm": 2400, "current": 42.0, "voltage": 380.0, "energy": 0.2}
    
    print("Normal Reading Analysis:")
    print(engine.analyze_telemetry(test_normal))
    print("\nCritical / Suspicious Reading Analysis:")
    print(engine.analyze_telemetry(test_critical))
