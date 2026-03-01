# PhishGuard — AI-Powered Phishing Detection Platform

A full-stack cybersecurity tool that analyzes URLs and emails for phishing threats,
combining heuristic rules, typosquatting detection, threat intelligence APIs, and a
trained machine learning classifier.

---

## Architecture

```
phish-guard/
 ├── frontend/       Next.js 16.1.6 (App Router) + TailwindCSS
 ├── backend/        Node.js + Express API
 ├── ml-service/     Python FastAPI + XGBoost (trained model included)
 └── database/       (Stub — add PostgreSQL or MongoDB)
```

---

## Current Status

| Service | Port | State |
|---------|------|-------|
| Frontend (Next.js 16) | 3000 | Ready |
| Backend (Express) | 4000 | Ready — VirusTotal active |
| ML Service (FastAPI) | 8000 | Ready — model trained |

---

## Quick Start

### 1. Backend

```bash
cd backend
cp .env.example .env          # add your VirusTotal API key
npm install
npm run dev                   # http://localhost:4000
```

### 2. ML Service

```bash
cd ml-service
pip install -r requirements.txt

# Build the dataset (downloads ~789k phishing URLs automatically)
python build_dataset.py       # creates data/urls.csv (100k rows)

# Train the model
python train_model.py         # creates model.pkl

# Start the API
python -m uvicorn main:app --port 8000
```

### 3. Frontend

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev                   # http://localhost:3000
```

---

## ML Service — Dataset & Model

### Dataset (`data/urls.csv`)

Built by `build_dataset.py` using two sources:

| Source | Count | Label |
|--------|-------|-------|
| [Phishing.Database](https://github.com/mitchellkrogza/Phishing.Database) (active phishing URLs) | 50,000 | 1 (Phishing) |
| Generated from 100 known-trusted domains (Google, GitHub, PayPal, etc.) | 50,000 | 0 (Legitimate) |
| **Total** | **100,000** | balanced |

### Model (`model.pkl`)

| Property | Value |
|----------|-------|
| Algorithm | XGBoost (200 estimators, depth 6) |
| Features | 20 URL structural features |
| Test accuracy | 100% (20,000 held-out samples) |
| Train/test split | 80/20, stratified |

### Features Extracted

`url_length`, `hostname_length`, `path_length`, `num_dots`, `num_hyphens`,
`num_underscores`, `num_slashes`, `num_question_marks`, `num_equals`, `num_at`,
`num_percent`, `num_ampersand`, `has_ip`, `is_https`, `has_www`,
`has_encoded_chars`, `suspicious_keyword_count`, `has_suspicious_tld`,
`subdomain_count`, `brand_impersonation`

---

## API Endpoints

### Backend (port 4000)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/url/analyze` | Analyze a URL for phishing risk |
| POST | `/api/email/analyze` | Analyze email content |
| GET | `/health` | Health check |

#### URL Analyze — Request
```json
{ "url": "https://suspicious-site.xyz/login?verify=account" }
```

#### URL Analyze — Response
```json
{
  "url": "http://paypa1.com/login?verify=account",
  "risk_score": 50,
  "classification": "Medium Risk",
  "reasons": [
    "Suspicious keyword(s): login, verify, account",
    "Not using HTTPS",
    "Possible typosquatting of \"paypal\" (distance: 1)"
  ],
  "threat_intel": { "malicious": 0, "suspicious": 0, "harmless": 0, "blacklisted": false },
  "ml_prediction": { "prediction": "Phishing", "probability": 1.0 }
}
```

#### Email Analyze — Request
```json
{ "email_text": "Dear customer, act now! Your account is suspended...", "sender_domain": "paypal.com" }
```

### ML Service (port 8000)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/predict` | Classify a URL (returns prediction + probability + features) |
| GET | `/health` | Health check + model load status |

#### Predict — Response
```json
{
  "url": "http://paypa1-secure-verify.xyz/login?account=update",
  "prediction": "Phishing",
  "probability": 1.0,
  "features": { "is_https": 0, "has_suspicious_tld": 1, "suspicious_keyword_count": 5, "..." : "..." }
}
```

---

## Environment Variables

### Backend `.env`
| Variable | Description |
|----------|-------------|
| `PORT` | Backend port (default 4000) |
| `VIRUSTOTAL_API_KEY` | VirusTotal v3 API key — **configured** |
| `GOOGLE_SAFE_BROWSING_API_KEY` | Google Safe Browsing API key (free, 10k req/day — see below) |
| `ML_SERVICE_URL` | ML microservice URL (default `http://localhost:8000`) |
| `ALLOWED_ORIGINS` | Comma-separated allowed CORS origins |
| `ANTHROPIC_API_KEY` | Claude API key for LLM email classification (optional) |

### Getting a Google Safe Browsing API Key (free)

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a project (or select an existing one)
3. Search for **"Safe Browsing API"** and click **Enable**
4. Go to **Credentials → Create Credentials → API Key**
5. Copy the key into `backend/.env` as `GOOGLE_SAFE_BROWSING_API_KEY`

Free quota: **10,000 requests/day** — no billing required.

---

## Risk Score Formula

| Signal | Points |
|--------|--------|
| IP address as hostname | +20 |
| URL length > 75 chars | +10 |
| Excessive subdomains | +10 |
| Suspicious keywords | +5–15 |
| Suspicious TLD | +15 |
| No HTTPS | +10 |
| Typosquatting detected | +25 |
| Encoded characters | +10 |
| VirusTotal blacklisted | +25 |
| Recently registered domain (<1 year) | +10 |
| Google Safe Browsing flagged (phishing/malware) | +20 |

Score range: 0–100. Classification: Low (<40), Medium (40–69), High (≥70).

---

## Security Notes

- Input validation on all endpoints via `express-validator`
- Rate limiting: 60 req/min per IP
- Helmet.js security headers
- URLs are **never fetched** — only their structure is analyzed (SSRF-safe)
- API keys stored in `.env` — never commit them

---

## Roadmap

- [x] Backend heuristic URL analyzer
- [x] Typosquatting detection (Levenshtein)
- [x] VirusTotal threat intel integration
- [x] Email phishing analyzer
- [x] ML classifier (XGBoost, trained on 100k URLs)
- [x] FastAPI ML microservice
- [x] Next.js frontend (URL analyzer, email analyzer, dashboard stub)
- [x] Domain age lookup (WHOIS via whoiser)
- [x] Google Safe Browsing API integration (free, 10k req/day)
- [x] SQLite scan history (url_scans + email_scans tables)
- [x] Live dashboard with stats and recent scans table
- [x] LLM-based email classification (Claude claude-haiku-4-5)
- [x] Grammar anomaly detection in email analyzer
- [x] Chrome browser extension (Manifest V3)
- [ ] User authentication (NextAuth.js)
