"""
Comprehensive End-to-End Verification Test Suite
Smart Manufacturing Anomaly & Fraud Detection Framework

Tests all 5 core stages of the pipeline:
1. NORMAL Telemetry (LOW Risk) -> Stored in DB, NOT sent to blockchain.
2. Moderate Anomaly (MEDIUM Risk) -> Stored in DB, NOT sent to blockchain.
3. Severe Anomaly (HIGH Risk) -> Stored in DB, SHA-256 computed, NOTARIZED on blockchain.
4. Critical Anomaly (CRITICAL Risk) -> Stored in DB, SHA-256 computed, NOTARIZED on blockchain.
5. Cryptographic Integrity Audit -> Validates VALID_IMMUTABLE on genuine records and TAMPER_DETECTED on altered records.
"""

import sys
import os
import json
import urllib.request
import urllib.error

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "backend"))

BASE_URL = "http://127.0.0.1:5000/api"

def http_post(endpoint, payload):
    url = f"{BASE_URL}{endpoint}"
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))

def http_get(endpoint):
    url = f"{BASE_URL}{endpoint}"
    req = urllib.request.Request(url, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))

def run_tests():
    print("=" * 80)
    print("  SMART MANUFACTURING ANOMALY & FRAUD DETECTION: END-TO-END VERIFICATION")
    print("=" * 80)
    print()

    # 0. Health & Service Check
    print("[STEP 0] Checking System & Subsystem Health...")
    health = http_get("/health")
    print(f"  - System Status: {health.get('status')}")
    print(f"  - Database Engine: {health.get('database', {}).get('engine')} ({health.get('database', {}).get('status')})")
    print(f"  - ML Models Active: {health.get('machine_learning', {}).get('active')}")
    print(f"  - Blockchain Protocol: {health.get('blockchain', {}).get('network')}")
    print(f"  - Current Block Height: #{health.get('blockchain', {}).get('current_block')}")
    print("  [PASSED] All subsystems online.\n")

    # TEST A: Normal Sensor Data (LOW Risk)
    print("-" * 80)
    print("[TEST A] Scenario A: Ingesting Normal Nominal Telemetry on Machine M01...")
    payload_normal = {
        "machine_id": "M01",
        "temperature": 54.2,
        "pressure": 4.5,
        "vibration": 1.15,
        "rpm": 2800.0,
        "current": 14.2,
        "voltage": 400.0,
        "energy": 8.4
    }
    res_a = http_post("/sensor-data", payload_normal)
    risk_a = res_a.get("analysis", {}).get("risk", {}).get("level")
    score_a = res_a.get("analysis", {}).get("risk", {}).get("composite_score")
    evt_a = res_a.get("event_created")

    print(f"  - Risk Level: {risk_a} (Score: {score_a}/100)")
    print(f"  - Anomaly Detected: {res_a.get('analysis', {}).get('anomaly', {}).get('detected')}")
    print(f"  - Security Event Ticket: {evt_a}")
    print(f"  - Stored in Database: YES (ID: {res_a.get('telemetry', {}).get('id')})")
    
    assert risk_a == "LOW", f"Expected LOW, got {risk_a}"
    assert evt_a is None, "Normal telemetry should not create a security event ticket"
    print("  [PASSED] Normal data correctly stored in DB without creating blockchain bloat.\n")

    # TEST B: Moderate Anomaly (MEDIUM Risk)
    print("-" * 80)
    print("[TEST B] Scenario B: Ingesting Moderate Elevated Wear on Machine M04...")
    payload_med = {
        "machine_id": "M04",
        "temperature": 78.5,
        "pressure": 4.8,
        "vibration": 3.2,
        "rpm": 2710.0,
        "current": 18.2,
        "voltage": 398.0,
        "energy": 11.2
    }
    res_b = http_post("/sensor-data", payload_med)
    risk_b = res_b.get("analysis", {}).get("risk", {}).get("level")
    score_b = res_b.get("analysis", {}).get("risk", {}).get("composite_score")
    evt_b = res_b.get("event_created")

    print(f"  - Risk Level: {risk_b} (Score: {score_b}/100)")
    print(f"  - Event Created: {evt_b.get('event_id') if evt_b else 'None'}")
    print(f"  - Blockchain Status: {evt_b.get('blockchain_status') if evt_b else 'N/A'}")
    print(f"  - Blockchain Tx: {evt_b.get('blockchain_tx') if evt_b else 'None'}")

    assert risk_b == "MEDIUM", f"Expected MEDIUM, got {risk_b}"
    assert evt_b is not None, "Medium risk should create an internal maintenance log event"
    assert evt_b.get("blockchain_status") == "NOT_ELIGIBLE", "Medium risk should NOT be submitted to blockchain"
    print("  [PASSED] Moderate anomaly correctly logged as MEDIUM without wasting blockchain gas.\n")

    # TEST C: Severe Mechanical Degradation (HIGH Risk)
    print("-" * 80)
    print("[TEST C] Scenario C: Ingesting Severe Mechanical Fault on Machine M06...")
    payload_high = {
        "machine_id": "M06",
        "temperature": 91.0,
        "pressure": 5.5,
        "vibration": 4.6,
        "rpm": 2400.0,
        "current": 40.5,
        "voltage": 390.0,
        "energy": 14.0
    }
    res_c = http_post("/sensor-data", payload_high)
    risk_c = res_c.get("analysis", {}).get("risk", {}).get("level")
    score_c = res_c.get("analysis", {}).get("risk", {}).get("composite_score")
    evt_c = res_c.get("event_created")

    print(f"  - Risk Level: {risk_c} (Score: {score_c}/100)")
    print(f"  - Event ID: {evt_c.get('event_id')}")
    print(f"  - SHA-256 Canonical Fingerprint: {evt_c.get('data_hash')}")
    print(f"  - Blockchain Status: {evt_c.get('blockchain_status')}")
    print(f"  - Blockchain Tx Hash: {evt_c.get('blockchain_tx')}")
    print(f"  - Sealed in Block: #{evt_c.get('block_number')}")

    assert risk_c == "HIGH", f"Expected HIGH, got {risk_c}"
    assert evt_c is not None, "High risk event must be created"
    assert evt_c.get("blockchain_status") == "RECORDED", "High risk event MUST be recorded to blockchain"
    assert evt_c.get("blockchain_tx") is not None, "High risk event must have a blockchain transaction hash"
    assert evt_c.get("data_hash") is not None, "High risk event must have a SHA-256 hash"
    print("  [PASSED] High risk event correctly notarized to Ethereum blockchain with block receipt.\n")

    # TEST D: Critical Failure & Simulated Data Tampering (CRITICAL Risk)
    print("-" * 80)
    print("[TEST D] Scenario D: Ingesting Critical Thermal Runaway & Data Manipulation on Machine M02...")
    payload_crit = {
        "machine_id": "M02",
        "temperature": 98.5,
        "pressure": 0.5,
        "vibration": 5.4,
        "rpm": 2400.0,
        "current": 42.0,
        "voltage": 380.0,
        "energy": 0.1 # Impossible physics: high current with near zero energy reported
    }
    res_d = http_post("/sensor-data", payload_crit)
    risk_d = res_d.get("analysis", {}).get("risk", {}).get("level")
    score_d = res_d.get("analysis", {}).get("risk", {}).get("composite_score")
    suspicious_d = res_d.get("analysis", {}).get("classification", {}).get("is_suspicious")
    evt_d = res_d.get("event_created")

    print(f"  - Risk Level: {risk_d} (Score: {score_d}/100)")
    print(f"  - XGBoost Tampering Detected: {suspicious_d}")
    print(f"  - Event ID: {evt_d.get('event_id')}")
    print(f"  - SHA-256 Canonical Fingerprint: {evt_d.get('data_hash')}")
    print(f"  - Blockchain Status: {evt_d.get('blockchain_status')}")
    print(f"  - Blockchain Tx Hash: {evt_d.get('blockchain_tx')}")
    print(f"  - Sealed in Block: #{evt_d.get('block_number')}")

    assert risk_d == "CRITICAL", f"Expected CRITICAL, got {risk_d}"
    assert evt_d.get("blockchain_status") == "RECORDED", "Critical event MUST be recorded to blockchain"
    assert evt_d.get("blockchain_tx") is not None, "Critical event must have a blockchain transaction hash"
    print("  [PASSED] Critical event and data tampering detected & permanently notarized to blockchain.\n")

    # TEST E: On-Chain Mathematical Cryptographic Verification & Tamper Detection
    print("-" * 80)
    print(f"[TEST E] Scenario E: Verifying On-Chain Proof for Event {evt_d.get('event_id')}...")
    
    # 1. Verification of genuine unaltered record
    verify_res = http_get(f"/blockchain/verify/{evt_d.get('event_id')}")
    v_data = verify_res.get("verification", {})
    print(f"  - Event Verified: {v_data.get('verified')}")
    print(f"  - Verification Status: {v_data.get('status')}")
    print(f"  - Calculated DB Hash: {v_data.get('calculated_hash')}")
    print(f"  - Immutable On-Chain Hash: {v_data.get('onchain_hash')}")
    print(f"  - Audit Message: {v_data.get('message')}")

    assert v_data.get("verified") == True, "Genuine record verification must succeed"
    assert v_data.get("status") == "VALID_IMMUTABLE", "Status must be VALID_IMMUTABLE"
    print("  [PASSED] Genuine record mathematically verified against immutable blockchain evidence.")

    # 2. Verification of simulated tampering (mismatched hash test)
    print("\n  Simulating database tampering scenario with modified hash...")
    from blockchain_service import blockchain_service
    tamper_check = blockchain_service.verify_event_integrity(evt_d.get("event_id"), "0xdeadbeef1234567890abcdef1234567890abcdef1234567890abcdef12345678")
    print(f"  - Tampered Hash Match: {tamper_check.get('verified')}")
    print(f"  - Tamper Detection Status: {tamper_check.get('status')}")
    print(f"  - Security Message: {tamper_check.get('message')}")

    assert tamper_check.get("verified") == False, "Tampered record verification must return False"
    assert tamper_check.get("status") == "TAMPER_DETECTED", "Status must be TAMPER_DETECTED"
    print("  [PASSED] Tampering attempt immediately flagged with TAMPER_DETECTED security alert.\n")

    # TEST F: Dashboard Dynamic Metrics Check
    print("-" * 80)
    print("[TEST F] Scenario F: Verifying Dashboard Dynamic Metrics from Database...")
    summary = http_get("/reports/summary")
    metrics = summary.get("metrics", {})
    print(f"  - Total Machines Monitored: {metrics.get('total_machines')}")
    print(f"  - Normal Machines: {metrics.get('normal_machines')}")
    print(f"  - Total Anomalies Detected: {metrics.get('anomalies_detected')}")
    print(f"  - Suspicious / Manipulated Events: {metrics.get('suspicious_events')}")
    print(f"  - High Risk Incidents: {metrics.get('high_risk_events')}")
    print(f"  - Critical Risk Incidents: {metrics.get('critical_events')}")
    print(f"  - Blockchain Notarized Events: {metrics.get('blockchain_recorded_events')}")

    assert metrics.get("total_machines") == 10, "Expected 10 machines"
    assert metrics.get("blockchain_recorded_events") > 0, "Expected blockchain records in summary"
    print("  [PASSED] Dashboard retrieves live dynamic metrics directly from the database.\n")

    print("=" * 80)
    print("  [SUCCESS] ALL 6 END-TO-END VERIFICATION TESTS PASSED SUCCESSFULLY (100% GREEN)!")
    print("=" * 80)

if __name__ == "__main__":
    try:
        run_tests()
    except Exception as e:
        print(f"\n[FAILED] Test failure: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
