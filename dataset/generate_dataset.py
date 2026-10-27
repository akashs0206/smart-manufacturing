"""
Smart Manufacturing Dataset Generator
Academic & Research Project: AI & Blockchain-Based Anomaly & Fraud Detection

Generates physically realistic industrial sensor telemetry with:
1. Normal operational variations across diverse machine types.
2. Genuine physical machine degradation / mechanical faults.
3. Controlled / Simulated sensor data manipulation scenarios (clearly labeled for academic research).
"""

import os
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

def generate_manufacturing_dataset(num_samples: int = 5000, random_seed: int = 42) -> pd.DataFrame:
    np.random.seed(random_seed)
    
    machines = [
        {"id": "M01", "name": "CNC Milling Machine 5-Axis", "type": "Milling", "base_temp": 55.0, "base_press": 4.5, "base_vib": 1.2, "base_rpm": 2800, "base_curr": 14.5, "base_volt": 400.0},
        {"id": "M02", "name": "Heavy Hydraulic Press 500T", "type": "Press", "base_temp": 62.0, "base_press": 8.5, "base_vib": 1.8, "base_rpm": 950, "base_curr": 22.0, "base_volt": 400.0},
        {"id": "M03", "name": "Industrial Robotic Arm 6-DOF", "type": "Robotics", "base_temp": 48.0, "base_press": 3.0, "base_vib": 0.8, "base_rpm": 1800, "base_curr": 11.0, "base_volt": 395.0},
        {"id": "M04", "name": "High-Pressure Centrifugal Pump", "type": "Pump", "base_temp": 68.0, "base_press": 6.2, "base_vib": 2.1, "base_rpm": 3200, "base_curr": 18.5, "base_volt": 405.0},
        {"id": "M05", "name": "Plastic Injection Molding Machine", "type": "Molding", "base_temp": 78.0, "base_press": 7.0, "base_vib": 1.4, "base_rpm": 1400, "base_curr": 19.0, "base_volt": 400.0},
        {"id": "M06", "name": "Automated Precision Lathe", "type": "Lathe", "base_temp": 52.0, "base_press": 3.8, "base_vib": 1.1, "base_rpm": 2400, "base_curr": 12.5, "base_volt": 398.0},
        {"id": "M07", "name": "Rotary Screw Air Compressor", "type": "Compressor", "base_temp": 72.0, "base_press": 7.8, "base_vib": 2.0, "base_rpm": 3000, "base_curr": 21.0, "base_volt": 402.0},
        {"id": "M08", "name": "Fiber Laser Cutting System", "type": "Laser", "base_temp": 42.0, "base_press": 5.0, "base_vib": 0.6, "base_rpm": 800, "base_curr": 16.0, "base_volt": 400.0},
        {"id": "M09", "name": "Heavy Conveyor Drive Unit", "type": "Conveyor", "base_temp": 58.0, "base_press": 2.5, "base_vib": 1.9, "base_rpm": 1200, "base_curr": 13.0, "base_volt": 397.0},
        {"id": "M10", "name": "High-Speed Automated Packaging Arm", "type": "Packaging", "base_temp": 46.0, "base_press": 3.2, "base_vib": 0.9, "base_rpm": 2100, "base_curr": 10.5, "base_volt": 401.0}
    ]

    start_time = datetime.now() - timedelta(days=14)
    rows = []

    for i in range(num_samples):
        # Pick machine in round-robin / randomized distribution
        m = machines[i % len(machines)]
        timestamp = start_time + timedelta(minutes=int(i * (14 * 24 * 60 / num_samples)))
        
        # Decide scenario
        # 75% Normal, 15% Physical Degradation Anomaly, 10% Controlled Data Manipulation
        scenario_rand = np.random.rand()
        
        if scenario_rand < 0.75:
            # 1. NORMAL OPERATING REGIME
            temp = m["base_temp"] + np.random.normal(0, 2.0)
            press = m["base_press"] + np.random.normal(0, 0.25)
            vib = max(0.2, m["base_vib"] + np.random.normal(0, 0.15))
            rpm = m["base_rpm"] + np.random.normal(0, 35)
            curr = m["base_curr"] + np.random.normal(0, 0.8)
            volt = m["base_volt"] + np.random.normal(0, 3.0)
            # Power calculation: P = sqrt(3) * V * I * cos(phi)
            power_kw = (1.732 * volt * curr * 0.88) / 1000.0
            energy = power_kw * (1.0 + np.random.uniform(-0.03, 0.03))
            
            is_anomaly = 0
            anomaly_type = "NORMAL"
            is_manipulated = 0
            risk_level = "LOW"
            scenario_desc = "Normal nominal manufacturing operating cycle."

        elif scenario_rand < 0.90:
            # 2. GENUINE PHYSICAL ANOMALIES (Degradation / Physical Faults)
            fault_type = np.random.choice(["BEARING_FAULT", "THERMAL_OVERLOAD", "HYDRAULIC_LEAK", "MOTOR_OVERLOAD"])
            is_anomaly = 1
            is_manipulated = 0
            
            if fault_type == "BEARING_FAULT":
                # High vibration, rising temperature, slight RPM fluctuation
                vib = m["base_vib"] * np.random.uniform(2.8, 5.0)
                temp = m["base_temp"] + np.random.uniform(12.0, 25.0)
                press = m["base_press"] + np.random.normal(0, 0.3)
                rpm = m["base_rpm"] * np.random.uniform(0.92, 0.98)
                curr = m["base_curr"] * np.random.uniform(1.2, 1.45)
                volt = m["base_volt"] + np.random.normal(0, 4.0)
                anomaly_type = "BEARING_WEAR_ANOMALY"
                risk_level = "HIGH" if vib > 4.0 else "MEDIUM"
                scenario_desc = f"Excessive bearing mechanical vibration ({vib:.2f} mm/s) accompanied by localized friction heating."

            elif fault_type == "THERMAL_OVERLOAD":
                # Severe overheating, cooling failure
                temp = m["base_temp"] + np.random.uniform(28.0, 50.0)
                press = m["base_press"] * np.random.uniform(1.1, 1.3)
                vib = m["base_vib"] * np.random.uniform(1.4, 2.2)
                rpm = m["base_rpm"] * np.random.uniform(0.85, 0.95)
                curr = m["base_curr"] * np.random.uniform(1.3, 1.7)
                volt = m["base_volt"] - np.random.uniform(5.0, 15.0)
                anomaly_type = "THERMAL_RUNAWAY"
                risk_level = "CRITICAL" if temp > 95.0 else "HIGH"
                scenario_desc = f"Critical thermal threshold breach ({temp:.1f}°C) indicating cooling failure or insulation breakdown."

            elif fault_type == "HYDRAULIC_LEAK":
                # Loss of pressure, pump overspeed compensation
                press = max(0.5, m["base_press"] * np.random.uniform(0.2, 0.45))
                rpm = m["base_rpm"] * np.random.uniform(1.15, 1.35)
                temp = m["base_temp"] + np.random.uniform(5.0, 12.0)
                vib = m["base_vib"] * np.random.uniform(1.3, 2.0)
                curr = m["base_curr"] * np.random.uniform(1.25, 1.5)
                volt = m["base_volt"] + np.random.normal(0, 3.0)
                anomaly_type = "HYDRAULIC_PRESSURE_DROP"
                risk_level = "HIGH"
                scenario_desc = f"Sudden hydraulic pressure collapse to {press:.2f} bar with automated pump speed surge."

            else: # MOTOR_OVERLOAD
                curr = m["base_curr"] * np.random.uniform(1.8, 2.8)
                rpm = m["base_rpm"] * np.random.uniform(0.60, 0.80)
                temp = m["base_temp"] + np.random.uniform(18.0, 32.0)
                press = m["base_press"] + np.random.normal(0, 0.4)
                vib = m["base_vib"] * np.random.uniform(2.0, 3.5)
                volt = m["base_volt"] - np.random.uniform(12.0, 25.0)
                anomaly_type = "MOTOR_ELECTROMECHANICAL_STALL"
                risk_level = "CRITICAL"
                scenario_desc = f"Motor heavy overload drawing {curr:.1f} A with significant mechanical slip."

            power_kw = (1.732 * volt * curr * 0.85) / 1000.0
            energy = power_kw * (1.0 + np.random.uniform(-0.02, 0.05))

        else:
            # 3. CONTROLLED / SIMULATED DATA MANIPULATION SCENARIOS
            # Clearly labeled for academic integrity
            tamper_type = np.random.choice([
                "SENSOR_FREEZE_SPOOFING",
                "OUT_OF_BOUNDS_TAMPERING",
                "CORRELATED_PHYSICS_VIOLATION",
                "FALSE_NORMALCY_INJECTION"
            ])
            is_anomaly = 1
            is_manipulated = 1
            
            if tamper_type == "SENSOR_FREEZE_SPOOFING":
                # Sensor report frozen at unrealistically flat baseline despite heavy electrical load
                temp = float(m["base_temp"]) # Perfect flatline
                press = float(m["base_press"])
                vib = float(m["base_vib"])
                rpm = m["base_rpm"] * np.random.uniform(1.4, 1.8)
                curr = m["base_curr"] * np.random.uniform(1.9, 2.5)
                volt = m["base_volt"] + np.random.normal(0, 2.0)
                power_kw = (1.732 * volt * curr * 0.85) / 1000.0
                energy = power_kw
                anomaly_type = "SIMULATED_SENSOR_FREEZE"
                risk_level = "HIGH"
                scenario_desc = "[Simulated Scenario] Telemetry spoofing: Vibration & temperature reported as perfectly constant despite 2x motor current surge."

            elif tamper_type == "OUT_OF_BOUNDS_TAMPERING":
                # Injected impossible physical readings (sensor packet modification)
                temp = np.random.choice([-15.0, 185.0])
                press = np.random.choice([-1.0, 45.0])
                vib = np.random.uniform(12.0, 25.0)
                rpm = np.random.choice([0, 12000])
                curr = np.random.uniform(55.0, 90.0)
                volt = np.random.choice([150.0, 650.0])
                energy = (1.732 * volt * curr * 0.85) / 1000.0
                anomaly_type = "SIMULATED_PACKET_CORRUPTION"
                risk_level = "CRITICAL"
                scenario_desc = "[Simulated Scenario] Arbitrary out-of-bounds telemetry injection violating industrial sensor operational limits."

            elif tamper_type == "CORRELATED_PHYSICS_VIOLATION":
                # Physics violation: Zero RPM with 40 Amps current and 0 kW reported energy
                rpm = 0.0
                curr = m["base_curr"] * np.random.uniform(2.0, 3.2)
                volt = m["base_volt"]
                temp = m["base_temp"] + np.random.uniform(25.0, 40.0)
                press = m["base_press"]
                vib = 0.05 # Artificial suppression
                energy = 0.1 # Falsified zero-energy billing/audit record
                anomaly_type = "SIMULATED_PHYSICS_INCONSISTENCY"
                risk_level = "CRITICAL"
                scenario_desc = "[Simulated Scenario] Energy metering tampering: High current draw with falsified zero-energy reporting."

            else: # FALSE_NORMALCY_INJECTION
                # Stealth manipulation: Normal metrics reported while underlying voltage/current collapse
                temp = m["base_temp"] + np.random.normal(0, 0.5)
                press = m["base_press"] + np.random.normal(0, 0.05)
                vib = m["base_vib"] + np.random.normal(0, 0.05)
                rpm = m["base_rpm"]
                curr = 0.5 # Near zero current despite normal RPM and Temp
                volt = 110.0 # Extreme phase drop
                energy = 0.2
                anomaly_type = "SIMULATED_STEALTH_MANIPULATION"
                risk_level = "HIGH"
                scenario_desc = "[Simulated Scenario] Stealth telemetry manipulation: Falsified normal vibration/RPM mask electrical phase collapse."

        rows.append({
            "timestamp": timestamp.strftime("%Y-%m-%d %H:%M:%S"),
            "machine_id": m["id"],
            "machine_name": m["name"],
            "machine_type": m["type"],
            "temperature": round(float(temp), 2),
            "pressure": round(float(press), 2),
            "vibration": round(float(vib), 3),
            "rpm": round(float(rpm), 1),
            "current": round(float(curr), 2),
            "voltage": round(float(volt), 2),
            "energy": round(float(energy), 3),
            "is_anomaly": int(is_anomaly),
            "anomaly_type": str(anomaly_type),
            "is_manipulated": int(is_manipulated),
            "risk_level": str(risk_level),
            "scenario_description": str(scenario_desc)
        })

    df = pd.DataFrame(rows)
    return df

if __name__ == "__main__":
    output_dir = os.path.dirname(os.path.abspath(__file__))
    csv_path = os.path.join(output_dir, "manufacturing_data.csv")
    print(f"Generating realistic smart manufacturing dataset ({5000} records)...")
    df = generate_manufacturing_dataset(5000)
    df.to_csv(csv_path, index=False)
    print(f"Dataset successfully generated and saved to: {csv_path}")
    print(f"Summary of classes:\n{df['anomaly_type'].value_counts()}")
    print(f"Summary of risk levels:\n{df['risk_level'].value_counts()}")
