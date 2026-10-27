"""
Smart Manufacturing ML Preprocessing Pipeline
Standardizes feature engineering, scaling, and data normalization for anomaly & fraud detection models.
"""

import os
import joblib
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
from typing import Tuple, Dict, Any, List

FEATURE_COLUMNS = [
    "temperature",
    "pressure",
    "vibration",
    "rpm",
    "current",
    "voltage",
    "energy"
]

ENGINEERED_COLUMNS = [
    "temperature",
    "pressure",
    "vibration",
    "rpm",
    "current",
    "voltage",
    "energy",
    "power_factor_approx",
    "vibration_per_rpm",
    "temp_per_current"
]

def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Computes domain-specific industrial physical relationships:
    - power_factor_approx: Checks electrical thermodynamic alignment
    - vibration_per_rpm: Normalized mechanical stress index
    - temp_per_current: Thermal dissipation efficiency
    """
    df_feat = df.copy()
    
    # Apparent power (kVA) = (sqrt(3) * V * I) / 1000
    apparent_power = (1.73205 * df_feat["voltage"] * df_feat["current"]) / 1000.0
    # Avoid division by zero
    df_feat["power_factor_approx"] = np.clip(df_feat["energy"] / (apparent_power + 1e-5), 0.0, 1.5)
    
    df_feat["vibration_per_rpm"] = df_feat["vibration"] / (df_feat["rpm"] + 1.0)
    df_feat["temp_per_current"] = df_feat["temperature"] / (df_feat["current"] + 0.1)
    
    return df_feat[ENGINEERED_COLUMNS]

def load_and_preprocess_dataset(csv_path: str) -> Tuple[pd.DataFrame, pd.DataFrame, pd.Series, pd.Series]:
    """
    Loads raw CSV and returns feature dataframe, engineered features, anomaly labels, and manipulation labels.
    """
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"Dataset not found at {csv_path}. Please run generate_dataset.py first.")
    
    df = pd.read_csv(csv_path)
    X_engineered = engineer_features(df[FEATURE_COLUMNS])
    y_anomaly = df["is_anomaly"]
    y_manipulation = df["is_manipulated"]
    
    return df, X_engineered, y_anomaly, y_manipulation

def prepare_single_sample(data_dict: Dict[str, float], scaler: StandardScaler = None) -> np.ndarray:
    """
    Prepares a single incoming sensor reading dictionary for inference.
    """
    # Ensure all core features exist
    sample_df = pd.DataFrame([{col: float(data_dict.get(col, 0.0)) for col in FEATURE_COLUMNS}])
    engineered_df = engineer_features(sample_df)
    
    if scaler is not None:
        return scaler.transform(engineered_df)
    return engineered_df.values

def save_preprocessor(scaler: StandardScaler, file_path: str) -> None:
    os.makedirs(os.path.dirname(os.path.abspath(file_path)), exist_ok=True)
    joblib.dump(scaler, file_path)
    print(f"Scaler saved to {file_path}")

def load_preprocessor(file_path: str) -> StandardScaler:
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Scaler file not found at {file_path}")
    return joblib.load(file_path)
