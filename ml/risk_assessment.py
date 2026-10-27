"""
Smart Manufacturing Risk Assessment Engine
Computes multi-dimensional risk index, diagnostic explanations, and blockchain eligibility.
"""

from typing import Dict, Any, List, Tuple

# Configurable Risk Thresholds
RISK_THRESHOLDS = {
    "LOW_MAX": 30.0,
    "MEDIUM_MAX": 60.0,
    "HIGH_MAX": 84.0,
    "CRITICAL_MIN": 85.0
}

# Domain physical boundaries for manufacturing equipment
PHYSICAL_LIMITS = {
    "temperature": {"warn": 75.0, "critical": 90.0},
    "pressure": {"min_warn": 2.0, "max_warn": 8.0, "critical_high": 10.0, "critical_low": 0.8},
    "vibration": {"warn": 2.8, "critical": 4.5},
    "current": {"warn": 25.0, "critical": 40.0},
    "voltage": {"min_warn": 370.0, "max_warn": 430.0, "critical_low": 320.0, "critical_high": 460.0}
}

def calculate_risk(
    sensor_data: Dict[str, float],
    anomaly_score: float,
    suspicious_prob: float,
    is_anomaly: bool,
    is_suspicious: bool
) -> Dict[str, Any]:
    """
    Computes a composite risk score (0-100), categorical risk level,
    detailed explanation of abnormal feature behavior, and blockchain eligibility.
    """
    reasons: List[str] = []
    feature_impacts: Dict[str, float] = {}

    temp = float(sensor_data.get("temperature", 50.0))
    press = float(sensor_data.get("pressure", 4.0))
    vib = float(sensor_data.get("vibration", 1.2))
    rpm = float(sensor_data.get("rpm", 2000.0))
    curr = float(sensor_data.get("current", 15.0))
    volt = float(sensor_data.get("voltage", 400.0))
    energy = float(sensor_data.get("energy", 8.0))

    # Base score derived from ML models (0 to 60 points)
    # Isolation Forest contribution: up to 30 pts
    # XGBoost manipulation contribution: up to 30 pts
    ml_base_score = (anomaly_score * 30.0) + (suspicious_prob * 30.0)

    # Physical Boundary Rule Checks (up to 40 additional points)
    rule_score = 0.0

    # 1. Temperature Analysis
    if temp >= PHYSICAL_LIMITS["temperature"]["critical"]:
        rule_score += 15.0
        reasons.append(f"Severe thermal runaway: Temperature ({temp:.1f}°C) exceeds critical safety limit of {PHYSICAL_LIMITS['temperature']['critical']}°C.")
        feature_impacts["temperature"] = 0.95
    elif temp >= PHYSICAL_LIMITS["temperature"]["warn"]:
        rule_score += 7.0
        reasons.append(f"Elevated operating temperature ({temp:.1f}°C) exceeding nominal threshold.")
        feature_impacts["temperature"] = 0.65
    else:
        feature_impacts["temperature"] = max(0.05, round(temp / 100.0, 2))

    # 2. Vibration Analysis
    if vib >= PHYSICAL_LIMITS["vibration"]["critical"]:
        rule_score += 15.0
        reasons.append(f"Extreme mechanical vibration ({vib:.2f} mm/s RMS) indicating severe bearing wear or structural looseness.")
        feature_impacts["vibration"] = 0.98
    elif vib >= PHYSICAL_LIMITS["vibration"]["warn"]:
        rule_score += 8.0
        reasons.append(f"High vibration level ({vib:.2f} mm/s RMS) exceeding ISO 10816 standards.")
        feature_impacts["vibration"] = 0.70
    else:
        feature_impacts["vibration"] = max(0.05, round(vib / 5.0, 2))

    # 3. Current & Voltage Analysis
    if curr >= PHYSICAL_LIMITS["current"]["critical"]:
        rule_score += 15.0
        reasons.append(f"Severe motor overcurrent ({curr:.1f} A) indicates electromechanical stall or phase short.")
        feature_impacts["current"] = 0.95
    elif curr >= PHYSICAL_LIMITS["current"]["warn"]:
        rule_score += 6.0
        reasons.append(f"Heavy electrical current draw ({curr:.1f} A) detected.")
        feature_impacts["current"] = 0.60
    else:
        feature_impacts["current"] = max(0.05, round(curr / 50.0, 2))

    if volt < PHYSICAL_LIMITS["voltage"]["critical_low"] or volt > PHYSICAL_LIMITS["voltage"]["critical_high"]:
        rule_score += 12.0
        reasons.append(f"Abnormal 3-phase line voltage ({volt:.1f} V) out of tolerable industrial grid range.")
        feature_impacts["voltage"] = 0.85
    else:
        feature_impacts["voltage"] = 0.10

    # 4. Pressure Analysis
    if press <= PHYSICAL_LIMITS["pressure"]["critical_low"]:
        rule_score += 12.0
        reasons.append(f"Hydraulic pressure collapse ({press:.2f} bar) indicating line rupture or pump cavitation.")
        feature_impacts["pressure"] = 0.90
    elif press >= PHYSICAL_LIMITS["pressure"]["critical_high"]:
        rule_score += 12.0
        reasons.append(f"Hydraulic over-pressurization ({press:.2f} bar) posing safety valve relief hazard.")
        feature_impacts["pressure"] = 0.90
    else:
        feature_impacts["pressure"] = 0.10

    # 5. Physics Consistency (Manipulated / Spoofed Telemetry Checks)
    apparent_power = (1.73205 * volt * curr) / 1000.0
    if apparent_power > 5.0 and energy < 0.5:
        rule_score += 20.0
        reasons.append("[Controlled Scenario] Inconsistent power telemetry: High apparent electrical power but falsified near-zero energy consumption reported.")
        feature_impacts["energy"] = 0.99
    elif rpm > 1500 and curr < 1.0:
        rule_score += 20.0
        reasons.append("[Controlled Scenario] Impossible physics state: High RPM reported with near-zero motor current draw (sensor spoofing signature).")
        feature_impacts["rpm"] = 0.95
    else:
        feature_impacts["energy"] = max(0.05, round(energy / 25.0, 2))
        feature_impacts["rpm"] = max(0.05, round(rpm / 5000.0, 2))

    # Total composite score (0-100)
    composite_score = min(100.0, ml_base_score + rule_score)

    # Categorize Risk Level
    if composite_score >= RISK_THRESHOLDS["CRITICAL_MIN"]:
        risk_level = "CRITICAL"
        action = "Immediate automated machine shutdown recommended. Cryptographic evidence committed to blockchain."
    elif composite_score > RISK_THRESHOLDS["MEDIUM_MAX"]:
        risk_level = "HIGH"
        action = "Urgent operator inspection required. Cryptographic evidence scheduled for blockchain notarization."
    elif composite_score > RISK_THRESHOLDS["LOW_MAX"]:
        risk_level = "MEDIUM"
        action = "Flagged for scheduled maintenance review during next shift."
    else:
        risk_level = "LOW"
        action = "Machine operating within nominal bounds. Standard routine monitoring."

    if not reasons:
        reasons.append("All sensor parameters, electromechanical signatures, and ML inference scores are within nominal limits.")

    explanation = " | ".join(reasons)

    # Blockchain evidence criteria: HIGH or CRITICAL
    eligible_for_blockchain = (risk_level in ["HIGH", "CRITICAL"])

    return {
        "risk_level": risk_level,
        "composite_score": round(composite_score, 1),
        "reasons": reasons,
        "explanation": explanation,
        "recommended_action": action,
        "eligible_for_blockchain": eligible_for_blockchain,
        "feature_impacts": feature_impacts
    }
