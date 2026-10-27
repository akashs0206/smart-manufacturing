"""
Train Stage 2: Gradient Boosted / XGBoost Classifier for Controlled Data Manipulation & Fraud Scenarios
Academic Note: Evaluates telemetry signatures against simulated data tampering patterns.
Does not claim general real-world fraud detection unless supported by domain labels.
"""

import os
import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import classification_report, roc_auc_score, confusion_matrix
from sklearn.model_selection import train_test_split

try:
    from xgboost import XGBClassifier
    HAS_XGBOOST = True
except ImportError:
    from sklearn.ensemble import GradientBoostingClassifier as XGBClassifier
    HAS_XGBOOST = False

from preprocessing import (
    ENGINEERED_COLUMNS,
    load_and_preprocess_dataset,
    load_preprocessor
)

def train_fraud_classifier(
    dataset_path: str = None,
    scaler_path: str = None,
    output_model_path: str = None,
    random_state: int = 42
):
    base_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(base_dir, ".."))
    
    if dataset_path is None:
        dataset_path = os.path.join(project_root, "dataset", "manufacturing_data.csv")
    if scaler_path is None:
        scaler_path = os.path.join(base_dir, "saved_models", "scaler.pkl")
    if output_model_path is None:
        output_model_path = os.path.join(base_dir, "saved_models", "xgboost_model.pkl")

    print("=" * 60)
    print(f"STAGE 2: TRAINING GRADIENT BOOSTED SUSPICIOUS / TAMPERING CLASSIFIER")
    print(f"Backend Engine: {'XGBoost Native' if HAS_XGBOOST else 'Scikit-Learn Gradient Boosting'}")
    print("Academic Context: Simulated/Controlled Data Manipulation Scenarios")
    print("=" * 60)

    df, X_engineered, _, y_manipulation = load_and_preprocess_dataset(dataset_path)
    scaler = load_preprocessor(scaler_path)
    X_scaled = scaler.transform(X_engineered)

    print(f"Total samples: {len(df)}")
    print(f"Manipulated samples in dataset: {y_manipulation.sum()} ({y_manipulation.mean()*100:.1f}%)")

    # Stratified Train/Val split
    X_train, X_val, y_train, y_val = train_test_split(
        X_scaled, y_manipulation, test_size=0.25, random_state=random_state, stratify=y_manipulation
    )

    if HAS_XGBOOST:
        scale_pos_weight = (len(y_train) - sum(y_train)) / (sum(y_train) + 1e-5)
        xgb_model = XGBClassifier(
            n_estimators=150,
            max_depth=5,
            learning_rate=0.05,
            subsample=0.85,
            colsample_bytree=0.85,
            scale_pos_weight=scale_pos_weight,
            random_state=random_state,
            eval_metric="logloss"
        )
    else:
        xgb_model = XGBClassifier(
            n_estimators=150,
            max_depth=5,
            learning_rate=0.05,
            subsample=0.85,
            random_state=random_state
        )

    print("Fitting model to training split...")
    xgb_model.fit(X_train, y_train)

    # Evaluation
    val_preds = xgb_model.predict(X_val)
    val_probs = xgb_model.predict_proba(X_val)[:, 1]
    roc_auc = roc_auc_score(y_val, val_probs)

    print("\n--- Model Evaluation (Validation Set) ---")
    print(f"ROC-AUC Score: {roc_auc:.4f}")
    print("\nClassification Report (1 = Manipulated / Suspicious, 0 = Standard / Physical):")
    print(classification_report(y_val, val_preds, target_names=["Standard/Physical", "Suspicious/Manipulated"]))
    print("Confusion Matrix:")
    print(confusion_matrix(y_val, val_preds))

    # Feature Importance
    importances = xgb_model.feature_importances_
    print("\nFeature Importances:")
    for col, imp in sorted(zip(ENGINEERED_COLUMNS, importances), key=lambda x: x[1], reverse=True):
        print(f"  - {col:22s}: {imp*100:.2f}%")

    # Save model
    os.makedirs(os.path.dirname(os.path.abspath(output_model_path)), exist_ok=True)
    joblib.dump(xgb_model, output_model_path)
    print(f"\nModel successfully saved to: {output_model_path}")
    print("=" * 60)

if __name__ == "__main__":
    train_fraud_classifier()
