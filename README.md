# AI and Blockchain-Based Anomaly and Fraud Detection Framework for Smart Manufacturing

An end-to-end industrial cybersecurity and predictive condition-monitoring framework for smart manufacturing systems. This framework integrates dual-stage Machine Learning, domain-specific physical risk stratification, cryptographic SHA-256 hashing, and selective on-chain evidence notarization via Ethereum Solidity smart contracts.

---

## 🏛️ Academic & Research Objective

Modern smart manufacturing relies on interconnected cyber-physical systems (CPS) comprising CNC machines, robotic arms, pumps, and presses. These systems are vulnerable to mechanical degradation, thermal runaways, and malicious sensor telemetry tampering (e.g., sensor spoofing, falsified zero-energy billing records, out-of-bounds packet injection).

### Core Architectural Principle
- **High-Velocity Telemetry in MySQL**: Large-scale continuous sensor streams (temperature, pressure, vibration, RPM, current, voltage, energy) are stored in a relational MySQL database.
- **Selective Cryptographic Proofs on Blockchain**: The blockchain is **not** used to detect fraud or store high-frequency sensor readings. Instead, when a high- or critical-risk anomaly/manipulation event is detected by the AI pipeline, a **canonical SHA-256 checksum** of the event payload is permanently notarized onto the **Ethereum Solidity Smart Contract**.
- **Tamper Evidence**: If a malicious actor alters historical database records, comparing the recalculated SHA-256 hash against the on-chain receipt immediately flags cryptographic tampering.

---

## 🏗️ System Architecture

```
                                [ Factory Floor Sensor Telemetry ]
                      (Temperature, Pressure, Vibration, RPM, Current, Voltage, Energy)
                                                 │
                                                 ▼
                                     [ MySQL / Relational DB ]
                                     (Raw Telemetry & Machines)
                                                 │
                                                 ▼
                                     [ Data Preprocessing ]
                                 (StandardScaler, Feature Eng.)
                                                 │
                                                 ▼
                                     [ Stage 1: Isolation Forest ]
                                       (Unsupervised Anomaly)
                                                 │
                                        ┌────────┴────────┐
                                        ▼                 ▼
                                  Normal Behavior      Anomaly Detected
                                                          │
                                                          ▼
                                              [ Stage 2: XGBoost Classifier ]
                                           (Simulated Tampering / Manipulation)
                                                          │
                                                 ┌────────┴────────┐
                                                 ▼                 ▼
                                          Standard Anomaly   Suspicious / Tampered
                                                 │                 │
                                                 └────────┬────────┘
                                                          ▼
                                                [ Risk Assessment Engine ]
                                             (LOW / MEDIUM / HIGH / CRITICAL)
                                                          │
                                           ┌──────────────┴──────────────┐
                                           ▼                             ▼
                                 Low/Medium Risk Event         High/Critical Event
                                 (Stored in MySQL Only)                  │
                                                                         ▼
                                                              [ Canonical JSON Payload ]
                                                                         │
                                                                         ▼
                                                              [ Cryptographic SHA-256 ]
                                                                         │
                                                                         ▼
                                                               [ Solidity Smart Contract ]
                                                               (Web3.py Selective Evidence)
                                                                         │
                                                                         ▼
                                                              [ Tamper-Evident Receipt ]
                                                             (Tx Hash, Block Number, Hash)
                                                                         │
                                                                         ▼
                                                              [ Flask REST API Server ]
                                                                         │
                                                                         ▼
                                                             [ React + Tailwind Dashboard ]
                                                            (Admin & Operator Workspaces)
```

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Tailwind CSS, Recharts, Lucide Icons, Axios, Vite |
| **Backend API** | Python 3.11, Flask, Flask-CORS, Python-Dotenv |
| **Database** | MySQL (InnoDB) via SQLAlchemy & PyMySQL (with zero-friction local SQLite fallback) |
| **Machine Learning** | Scikit-Learn (Isolation Forest), XGBoost / Gradient Boosted Trees, Pandas, NumPy, Joblib |
| **Blockchain** | Solidity (`SmartManufacturing.sol`), Web3.py, Local EVM / Ganache RPC |
| **Cryptography** | SHA-256 Canonical JSON Hashing, Keccak-256 |

---

## 📂 Project Structure

```
smart-manufacturing/
│
├── dataset/
│   ├── generate_dataset.py       # Realistic telemetry generator with physics & tampering scenarios
│   └── manufacturing_data.csv    # 5,000+ operational records across 10 industrial machines
│
├── ml/
│   ├── preprocessing.py          # Feature engineering, scaling & normalization
│   ├── train_anomaly.py          # Stage 1: Isolation Forest training (unsupervised)
│   ├── train_fraud.py            # Stage 2: XGBoost / Gradient Boosted tampering classifier
│   ├── predict.py                # Unified multi-stage inference pipeline
│   ├── risk_assessment.py        # Domain-specific physical limits & composite risk scorer
│   └── saved_models/
│       ├── isolation_forest.pkl  # Serialized Isolation Forest
│       ├── xgboost_model.pkl     # Serialized Gradient Boosted Classifier
│       └── scaler.pkl            # Serialized StandardScaler
│
├── backend/
│   ├── app.py                    # Flask REST API application entry point
│   ├── database.py               # SQLAlchemy database session & MySQL/SQLite manager
│   ├── models.py                 # ORM models (Machine, SensorData, SecurityEvent)
│   ├── ml_service.py             # ML inference abstraction interface
│   ├── blockchain_service.py     # Web3 & SHA-256 cryptographic notarization service
│   ├── seed_data.py              # Telemetry & event database seeder
│   ├── schema.sql                # Complete MySQL DDL schema script
│   ├── .env.example              # Environment variables template
│   └── routes/
│       ├── machines.py           # Machine fleet & historical telemetry endpoints
│       ├── sensor_data.py        # Telemetry ingestion & streaming
│       ├── events.py             # Security events audit & search
│       ├── predict.py            # Manual AI analysis workbench endpoints
│       ├── blockchain.py         # On-chain proof query & verification endpoints
│       └── reports.py            # Summary analytics & compliance metrics
│
├── blockchain/
│   ├── SmartManufacturing.sol   # Solidity Smart Contract for event evidence notarization
│   ├── compile_and_deploy.py     # Contract compilation & deployment automation
│   └── deployment/
│       └── contract_details.json # Verified ABI & deployment configuration
│
├── frontend/
│   ├── src/
│   │   ├── components/           # Reusable UI widgets (StatCard, RiskBadge, SensorChart, EventTable)
│   │   ├── pages/                # Application views (Dashboard, Machines, AI Lab, Events, Blockchain, Reports)
│   │   ├── services/api.js       # Axios REST client
│   │   └── context/AuthContext   # Role-based access control (Admin / Operator)
│   ├── package.json
│   └── vite.config.js
│
├── requirements.txt              # Python dependencies
└── README.md                     # Documentation & setup guide
```

---

## 🚀 Quickstart Guide

### Step 1: Install Python Dependencies
```bash
pip install -r requirements.txt
```

### Step 2: Generate Dataset & Train ML Models
```bash
# Generate 5,000 synthetic industrial records
python dataset/generate_dataset.py

# Train Stage 1: Isolation Forest (ROC-AUC ~ 0.99)
python ml/train_anomaly.py

# Train Stage 2: XGBoost / Gradient Boosted Tampering Classifier (ROC-AUC ~ 1.00)
python ml/train_fraud.py

# Test inference pipeline
python ml/predict.py
```

### Step 3: Seed Database
```bash
# Initializes tables and seeds 10 machines, 1,500 telemetry records, and 150 events
python backend/seed_data.py
```
*(By default, the backend connects to MySQL. If MySQL is not running, it automatically initializes a zero-friction local SQLite database with the exact same relational schema).*

### Step 4: Start Backend REST API
```bash
cd backend
python app.py
```
The REST API will start at `http://127.0.0.1:5000`.

### Step 5: Start React Frontend
In a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000` in your web browser.

---

## 🔐 Role-Based Access Control

- **Admin Account**:
  - Full access to the Dashboard, Machine Fleet, Interactive AI Lab, Event Log, Blockchain Audit Ledger, and Compliance Reports.
  - Can trigger manual on-chain evidence notarization and run live cryptographic SHA-256 vs Smart Contract proofs.
- **Operator Account**:
  - Access to Machine Monitoring, Live Telemetry Drilldowns, AI Diagnostics Lab, and Event logs.

---

## 📡 REST API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check for DB, ML Engine, and Blockchain |
| `GET` | `/api/machines` | Machine fleet with latest telemetry snapshots |
| `GET` | `/api/machines/<id>` | Machine profile, 100 historical readings & events |
| `GET` | `/api/sensor-data` | Telemetry stream with filtering by machine & limit |
| `POST` | `/api/sensor-data` | Ingest new sensor reading with real-time AI evaluation |
| `GET` | `/api/events` | Search and filter security events by machine, risk, status |
| `GET` | `/api/events/<id>` | Event details, sensor context, and blockchain verification |
| `POST` | `/api/events/<id>/record-blockchain` | Commit SHA-256 evidence to Ethereum Smart Contract |
| `POST` | `/api/predict` | Run multi-stage AI inference with feature attribution |
| `GET` | `/api/blockchain/status` | Current block height, contract address, and network status |
| `GET` | `/api/blockchain/events` | List all on-chain recorded event hashes |
| `GET` | `/api/blockchain/verify/<id>` | Mathematically verify MySQL hash against on-chain receipt |
| `GET` | `/api/reports/summary` | Aggregated metrics, risk matrices, and trend curves |

---

## 📜 Smart Contract Specification (`SmartManufacturing.sol`)

```solidity
struct EventEvidence {
    string eventId;
    string machineId;
    uint256 timestamp;
    string riskLevel;
    string dataHash;        // SHA-256 hex digest
    address recordedBy;
    uint256 blockTimestamp;
    bool isRecorded;
}

function recordEvent(string eventId, string machineId, uint256 timestamp, string riskLevel, string dataHash) external returns (bool);
function getEventEvidence(string eventId) external view returns (...);
function verifyEvidence(string eventId, string dataHash) external view returns (bool isValid, string riskLevel, uint256 blockTimestamp);
```

---

## 🧪 Verification & Academic Integrity Notice

1. **Anomaly != Fraud**: The framework explicitly separates unsupervised physical degradation anomalies from deliberate telemetry tampering patterns.
2. **Simulated Manipulation Scenarios**: Data tampering patterns (sensor freezing, impossible thermodynamic states, out-of-bounds packet injection) are labeled as *Controlled/Simulated Scenarios* for academic integrity.
3. **Blockchain Scope**: Blockchain provides **tamper-evident cryptographic notarization**; it does not replace the AI models or store raw high-frequency telemetry.
