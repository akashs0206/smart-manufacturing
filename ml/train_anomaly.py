"""
Train Stage 1: Isolation Forest Anomaly Detection Model
Unsupervised detection of multidimensional mechanical and thermal operational anomalies.
"""

import os
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report, roc_auc_score, confusion_matrix
from sklearn.model_selection import train_test_split

from preprocessing import (
    FEATURE_COLUMNS,
    ENGINEERED_COLUMNS,
    load_and_preprocess_dataset,
    save_preprocessor
)

def train_isolation_forest(
    dataset_path: str = None,
    output_model_path: str = None,
    output_scaler_path: str = None,
    contamination: float = 0.25,
    random_state: int = 42
):
    base_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(base_dir, ".."))
    
    if dataset_path is None:
        dataset_path = os.path.join(project_root, "dataset", "manufacturing_data.csv")
    if output_model_path is None:
        output_model_path = os.path.join(base_dir, "saved_models", "isolation_forest.pkl")
    if output_scaler_path is None:
        output_scaler_path = os.path.join(base_dir, "saved_models", "scaler.pkl")

    print("=" * 60)
    print("STAGE 1: TRAINING ISOLATION FOREST ANOMALY DETECTOR")
    print("=" * 60)
    
    df, X_engineered, y_anomaly, _ = load_and_preprocess_dataset(dataset_path)
    print(f"Loaded {len(df)} records. Features engineered: {list(X_engineered.columns)}")
    print(f"Actual anomalies in dataset: {y_anomaly.sum()} ({y_anomaly.mean()*100:.1f}%)")

    # Fit standard scaler on baseline engineered features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X_engineered)
    save_preprocessor(scaler, output_scaler_path)

    # Train/Validation Split for academic evaluation
    X_train, X_val, y_train, y_val = train_test_split(
        X_scaled, y_anomaly, test_size=0.25, random_state=random_state, stratify=y_anomaly
    )

    # Train Isolation Forest
    # n_estimators=150, max_samples='auto', contamination=contamination
    iso_forest = IsolationForest(
        n_estimators=200,
        max_samples="auto",
        contamination=contamination,
        random_state=random_state,
        n_jobs=-1
    )
    
    print("Fitting Isolation Forest model...")
    iso_forest.fit(X_train)

    # Evaluation
    # IsolationForest.predict returns -1 for anomaly, 1 for normal
    raw_preds = iso_forest.predict(X_val)
    binary_preds = np.where(raw_preds == -1, 1, 0)
    
    # Anomaly score: decision_function gives negative values for anomalies
    # Convert to standard normalized anomaly score in [0.0, 1.0] where 1.0 = extreme anomaly
    decision_scores = iso_forest.decision_function(X_val)
    normalized_scores = 1.0 / (1.0 + np.exp(decision_scores * 6.0)) # Sigmoid transformation

    roc_auc = roc_auc_score(y_val, normalized_scores)
    print("\n--- Model Evaluation (Validation Set) ---")
    print(f"ROC-AUC Score: {roc_auc:.4f}")
    print("\nClassification Report (1 = Anomaly, 0 = Normal):")
    print(classification_report(y_val, binary_preds, target_names=["Normal", "Anomaly"]))
    print("Confusion Matrix:")
    print(confusion_matrix(y_val, binary_preds))

    # Save model
    os.makedirs(os.path.dirname(os.path.abspath(output_model_path)), exist_ok=True)
    joblib.dump(iso_forest, output_model_path)
    print(f"\nIsolation Forest model successfully saved to: {output_model_path}")
    print("=" * 60)

if __name__ == "__main__":
    train_isolation_forest()
