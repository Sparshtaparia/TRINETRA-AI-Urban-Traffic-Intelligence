# TRINETRA-P

### Parking-Induced Congestion Intelligence Platform for Targeted Urban Enforcement

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-181717?style=for-the-badge&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Gemini%20AI-8E75B2?style=for-the-badge&logo=google&logoColor=white)
![Pandas](https://img.shields.io/badge/Pandas-150458?style=for-the-badge&logo=pandas&logoColor=white)
![scikit-learn](https://img.shields.io/badge/scikit--learn-F7931E?style=for-the-badge&logo=scikitlearn&logoColor=white)

</div>

---

## Overview

**TRINETRA-P** is an AI-powered urban mobility intelligence platform that converts parking violation records and live violation events into explainable, road-segment-level congestion impact intelligence. It helps enforcement teams prioritize where towing and patrol action will recover the maximum road capacity.

The platform combines a **novel PICQ (Parking-Induced Congestion Quantification) methodology**, **dual-mode architecture** (historical + live), **real-time CSV replay engine**, **geospatial intelligence**, **mathematical audit verification**, and **Gemini-powered AI assistant** into a single enforcement command center.

Built as a full-stack product prototype with a **Next.js frontend**, **FastAPI backend**, **PICQ analytics engine**, **deque-based live session memory**, and **Gemini-powered AI chat**.

---

## Problem Statement

Traffic police and enforcement teams today rely on patrol-based, reactive enforcement. Existing systems show simple violation heatmaps, but they do not answer the most critical operational question:

**Which parking violations are causing the highest congestion damage, and where should enforcement act first to recover the most road capacity?**

Standard heatmaps over-prioritize high-volume but low-impact zones (Q3), while missing **Hidden Impact Zones (Q2)** — locations with fewer violations but disproportionately high congestion damage.

TRINETRA-P solves this by combining parking violation records, geospatial context, temporal recurrence, road sensitivity, and congestion-impact proxies into an explainable enforcement intelligence platform.

---

## Key Features

### 1. PICQ Methodology (Novel Research)

Four-metric composite scoring pipeline:

1. **POP** — Parking Obstruction Pressure (frequency × persistence)
2. **CSI** — Capacity Sensitivity Index (road sensitivity to obstruction)
3. **PICL** — Parking-Induced Capacity Loss (POP × CSI)
4. **PICQ** — Parking-Induced Congestion Quantification (normalized 0–100)
5. **RRE** — Road Recovery Estimate (% capacity recoverable after enforcement)

### 2. Dual-Mode Architecture

| Mode | Purpose | Data Source |
|------|---------|-------------|
| **Historical Intelligence** | Plan enforcement strategy | Uploaded CSV / Flipkart dataset |
| **Live Operations** | Real-time dispatch decisions | CSV replay polling (2s intervals) |

### 3. Quadrant Classification

| Quadrant | Violation Count | Congestion Impact | Action |
|----------|----------------|-------------------|--------|
| Q1 Immediate Dispatch | High | High | Urgent towing |
| **Q2 Hidden Impact Zone** | **Low/Medium** | **High** | **Missed by heatmaps** |
| Q3 Suppressed Heatmap | High | Low | Over-prioritized |
| Q4 Routine Monitor | Low | Low | Regular patrol |

### 4. Live CSV Replay Engine

- HTTP polling (2s intervals) — **no WebSocket required**
- `deque(maxlen=500)` in-memory session
- `compute_analytics()` runs on full deque each tick
- Events emitted with 1–2 second latency
- Kafka-style streaming animations in the Command Center

### 5. Live Command Center

- 4-tab dashboard: Command Center, Live Map, Active Violations, Ask TRINETRA
- Real-time metrics: events/sec, critical alerts, PICQ delta, dispatch recommendation
- Scan-line overlay, new-event glow, pulse counters on stale data
- Per-segment violation aggregation with severity bars

### 6. Mathematical Audit Verification

Every dashboard metric is verified against raw computed data:

```
Hidden Impact Zones
Formula: count(quadrant == "Q2")
Computed: 1,562
Displayed: 1,562
Status: PASS ✓
```

12 cross-validated checks with PASS/FAIL badges and zero hardcoded values.

### 7. AI Assistant (Ask TRINETRA)
- Gemini 2.5 Flash B2G enforcement expert
- Strict guardrails preventing token leakage, code writing, or general knowledge responses
- SHA256 integrity hash on all mathematical explanations
- Dual session state: Historical full-data context vs. Live 5-minute sliding window
- Gemini-powered natural language querying
- Session-persistent chat history via `sessionStorage`
- Answers: dispatch recommendations, zone summaries, severity analysis, PICQ explanations
- Green theme (`#39FF14`) matching the command center aesthetic

### 8. System Architecture & API Optimizations
- **Gemini API Fallback Mechanism:** Backend implements dynamic fallback routing across multiple Gemini API keys (`GEMINI_API_KEY_1`, `2`, `3`) to ensure high availability and bypass rate limits automatically.
- **Map SDK Persistence:** Frontend uses advanced DOM management (`display: none` persistence + `ResizeObserver`/dynamic `.resize()` triggers) during tab switching. This ensures the MapMyIndia SDK is only initialized **once** per session, drastically reducing map load costs.
- **AI Rate Limiting (Token Conservation):** Strategic UI cooldowns (5s for chatbot, 15s for full-dashboard analysis) prevent API spamming and token exhaustion.
- **On-Demand Computation:** Heavy AI analysis is decoupled from page loads, requiring explicit user triggers to conserve compute resources.

### 8. Geospatial Intelligence

- MapMyIndia SDK integration for live event mapping
- 6 visual states: loading, missing key, no coordinates, ready, error, init failed
- Coordinate-aware markers with severity coloring
- Graceful fallback when coordinates are unavailable

---

## System Architecture

```txt
TRINETRA-P: Parking-Induced Congestion Intelligence Platform
│
├── frontend/
│   ├── Next.js App Router (16)
│   ├── TypeScript
│   ├── Tailwind CSS + shadcn/ui
│   ├── Framer Motion animations
│   ├── LiveSessionProvider (useRef-gated polling)
│   ├── Recharts visualizations
│   └── sessionStorage chat persistence
│
├── backend/
│   ├── FastAPI + Uvicorn
│   ├── PICQ analytics engine
│   ├── deque(maxlen=500) live session memory
│   ├── 11 REST endpoints for live ops
│   ├── CSV upload / validate / replay pipeline
│   ├── Pandas + NumPy data processing
│   └── Gemini AI integration
│
├── backend/research/
│   ├── TRINETRA_PICQ_Research_Model.ipynb
│   ├── PICQ methodology derivation
│   └── Q1–Q4 quadrant analysis
│
└── backend/reports/
    └── MVP audit verification report
```

---

## Enterprise SaaS Architecture (Beyond Serverless MVP)

The current MVP is designed for rapid deployment on Vercel Serverless Functions. However, Vercel Functions are stateless, meaning background tasks and large 100MB+ file processing cannot be handled efficiently without hitting read-only filesystem restrictions or memory timeouts.

For a true Enterprise SaaS production environment, TRINETRA-P shifts to a distributed Event-Driven Architecture:

1. **Object Storage (AWS S3 / GCP Cloud Storage):** Instead of uploading large CSVs to the backend server directly, the frontend uploads securely to S3 via pre-signed URLs. This bypasses Vercel's API payload limits entirely.
2. **Event-Driven Processing (Apache Kafka / AWS SQS):** Once the file hits S3, an event is triggered to a message queue. This completely decouples the upload process from the heavy data analysis.
3. **Asynchronous Worker Nodes (Celery + AWS ECS / EKS):** Dedicated, long-running Python worker containers pull tasks from the queue, download the CSV from S3, run the heavy PICQ Pandas/Scikit-learn pipeline, and update a progress state via WebSocket.
4. **Persistent Database (PostgreSQL / TimescaleDB):** Instead of caching results in `.json` or `.csv` files on disk, the analyzed segment scores, Hidden Impact Zones, and analytics are stored in a relational database optimized for geospatial and time-series queries.
5. **Live Stream Engine (True WebSockets):** For real-time operations, CCTV IoT devices or YOLO edge servers stream parking violations directly into a Kafka topic. The backend consumes this stream and pushes updates to the React dashboard via true WebSockets, completely replacing the 2-second HTTP polling mechanism.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, TypeScript |
| UI | Tailwind CSS, shadcn/ui, Lucide Icons, Framer Motion |
| State | React Context (LiveSessionProvider) |
| Backend | FastAPI, Uvicorn |
| Analytics Engine | Pandas, NumPy, scikit-learn |
| AI Layer | Google Gemini API |
| Geospatial | MapMyIndia SDK |
| Storage | File-based (CSV/JSON), in-memory deque |
| Visualization | Recharts |
| Caching | sessionStorage, sessionCache utility |

---

## Project Structure

```txt
TRINETRA-AI-Urban-Traffic-Intelligence/
│
├── frontend/
│   ├── src/
│   │   ├── app/              # Routes (/, /setup, /dashboard/live, /dashboard/static, /audit, /features, /methodology)
│   │   ├── components/       # UI components + dashboard tabs
│   │   │   ├── dashboard/    # LiveCommandCenter, LiveMapView, AskTrinetra, Overview, Ranking, Audit, etc.
│   │   │   ├── setup/        # LiveConfigModal, HistoricalConfigModal
│   │   │   └── ui/           # shadcn primitives (Button, Card, Tabs, Badge, etc.)
│   │   └── lib/              # LiveSessionProvider, api.ts, cache.ts, utils.ts
│   ├── next.config.ts
│   ├── package.json
│   └── .env.local.example
│
├── backend/
│   ├── main.py               # FastAPI entry point
│   ├── app/
│   │   ├── api/
│   │   │   ├── endpoints.py       # Static/analytics endpoints
│   │   │   ├── live_endpoints.py  # 11 live REST endpoints
│   │   │   ├── live_state.py      # deque-based session state
│   │   │   └── websockets.py      # WebSocket router
│   │   └── services/
│   │       ├── picq_engine.py     # PICQ computation
│   │       ├── live_stream.py     # Live stream service
│   │       └── data_ingestion.py  # CSV upload/validation
│   ├── research/             # PICQ methodology notebooks
│   ├── scripts/              # Utility scripts
│   ├── reports/              # Audit reports
│   ├── uploads/live/         # Uploaded CSV files (gitignored)
│   ├── processed/            # Cached analytics output (gitignored)
│   └── requirements.txt
│
├── .env.example
├── .gitignore
└── README.md
```

---

## Getting Started

### Prerequisites

```txt
Node.js 18+
Python 3.10+
Git
Google Gemini API key (for Ask TRINETRA)
MapMyIndia SDK key (for Live Map)
```

---

## Environment Variables

Create `frontend/.env.local` using `.env.example` as reference:

### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8001
NEXT_PUBLIC_MAPMYINDIA_MAP_SDK_KEY=your_mapmyindia_sdk_key
NEXT_PUBLIC_ENABLE_MAPMYINDIA=true
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Backend (`backend/.env`)

```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
DATABASE_URL=your_database_url
Gemini_API=your_primary_gemini_api_key
GEMINI_API_KEY_1=your_backup_gemini_api_key_1
GEMINI_API_KEY_2=your_backup_gemini_api_key_2
GEMINI_API_KEY_3=your_backup_gemini_api_key_3
MAPMYINDIA_REST_API_KEY=your_mapmyindia_rest_key
MAPMYINDIA_CLIENT_ID=your_mapmyindia_client_id
MAPMYINDIA_CLIENT_SECRET=your_mapmyindia_client_secret
```

---

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend runs at:

```txt
http://localhost:3000
```

---

## Backend Setup

```bash
cd backend
python -m venv venv
```

### Windows

```bash
.\venv\Scripts\Activate
```

### macOS / Linux

```bash
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Run the FastAPI server:

```bash
uvicorn main:app --reload --port 8001
```

The backend runs at:

```txt
http://localhost:8001
```

---

## Production Deployment

### 1. Backend (Railway)
The backend is designed to be deployed on **Railway** (or Render/Heroku) rather than Vercel due to the need for persistent memory (for the live data streaming queue) and websocket/polling support.
1. Connect your GitHub repository to a new Railway project.
2. In the Service Settings, set the **Root Directory** to `/backend`.
3. Railway will automatically detect the `Procfile` and use `uvicorn main:app --host 0.0.0.0 --port $PORT`.
4. Go to the **Variables** tab for your backend service in Railway and paste all the Backend environment variables. Click **Deploy Changes**.

### 2. Frontend (Vercel)
1. Import your GitHub repository to Vercel.
2. Set the **Framework Preset** to Next.js.
3. Set the **Root Directory** to `frontend`.
4. Add the Frontend environment variables. **Crucially**, ensure `NEXT_PUBLIC_API_BASE_URL` is set to the full HTTPS URL of your Railway backend (e.g. `https://your-app.up.railway.app`).
5. Deploy.

---

## Demo Flow

```txt
Landing Page
  → Click "Launch Intelligence Platform"
    → Choose Historical Intelligence or Real-Time Operations

Historical Mode:
  → Upload CSV or load Flipkart dataset
    → PICQ Engine processes data (pipeline animation)
      → Dashboard opens with real metrics
        → Explore Hidden Impact Zones, Enforcement Ranking, Audit Verification

Live Mode:
  → Upload CSV for replay
    → Validate column mapping (auto-detected)
      → Start CSV Replay (2s polling)
        → Live Command Center streams events
          → Watch dispatch recommendations update in real time
```

---

## Core Modules

### PICQ Analytics Engine

Computes 5 core metrics per road segment using weighted combinations of violation pressure, road sensitivity, temporal recurrence, and congestion proxies.

### Live Command Center

4-tab operations dashboard with real-time event stream, metrics cards (events/sec, critical alerts, PICQ delta), scan-line overlay, and Kafka-style animations.

### CSV Replay Engine

Upload → Validate → Replay pipeline. Reads CSV rows in batches (3 per tick, 2s interval), normalizes to unified schema, appends to `deque(maxlen=500)`, computes live analytics on full buffer.

### Audit Verification

Mathematical cross-validation of 12 dashboard metrics computed independently from source data. Every value displayed has a corresponding audit check with formula, computed value, and PASS/FAIL status.

### Ask TRINETRA (AI Assistant)

Gemini-powered chat that answers queries using live stream context — dispatch recommendations, zone summaries, severity analysis, and PICQ methodology explanations.

### Quadrant Intelligence

Q1–Q4 classification revealing **Hidden Impact Zones (Q2)** — segments with low violation counts but disproportionately high congestion impact, missed by standard heatmaps.

---

## Example Use Cases

- Traffic police command center prioritization
- Tow-truck dispatch optimization
- Parking enforcement strategy planning
- Urban mobility congestion analysis
- Post-enforcement road recovery assessment
- Hackathon / smart city proposal demonstrations

---

## Why This Project Matters

TRINETRA-P demonstrates how urban mobility data can be transformed from simple violation counts into actionable enforcement intelligence.

The project brings together:

- **Research novelty** through the PICQ methodology and Hidden Impact Zone discovery
- **Product thinking** through dual-mode architecture and command center UX
- **Full-stack engineering** through Next.js, FastAPI, Pandas, and deque-based live streaming
- **AI integration** through Gemini-powered conversational analytics
- **Mathematical integrity** through transparent audit verification with zero hardcoded values
- **Real-world feasibility** through working CSV replay, live polling, and dispatch recommendations

**Standard heatmaps show where violations are frequent. TRINETRA-P shows where violations damage traffic the most.**

---

## Key Findings (Flipkart Dataset)

| Metric | Value |
|--------|-------|
| Total Raw Records | 298,450 |
| Total Analyzed Segments | 7,814 |
| Average Violations / Segment | 38.2 |
| Average PICQ | 10.05 |
| Peak PICQ | 100.0 |
| Q1 Immediate Dispatch | 2,263 |
| **Q2 Hidden Impact Zones** | **864** |
| Q3 Suppressed Heatmap Zones | 896 |
| Q4 Routine Monitor | 3,791 |
| RRE ≥ 60 Critical Zones | 5 |
| Top 10% Recovery Priority | 782 |

---

## Current Status

Working product prototype built for hackathon evaluation and architecture validation.

**Implemented:**
- Full PICQ methodology with 5 computed metrics
- Dual-mode architecture (historical + live)
- Live CSV replay with 2s HTTP polling
- 4-tab live command center with streaming animations
- Static analytics dashboard (Overview, Ranking, Audit, Hidden Impact Zones)
- Mathematical audit verification (12 checks with PASS/FAIL)
- Gemini AI chat (Ask TRINETRA)
- MapMyIndia geospatial integration
- SaaS-style landing page with dark/light theme
- Column auto-detection for CSV upload
- sessionStorage-persistent chat history

---

## Author

**Sparsh Taparia**

- GitHub: [@Sparshtaparia](https://github.com/Sparshtaparia)
- Email: [sparshtaparia2005@gmail.com](mailto:sparshtaparia2005@gmail.com)

---

## License

This project is maintained as a hackathon / academic prototype.

---

## Acknowledgement

Built as a parking-induced congestion intelligence platform for urban mobility enforcement, inspired by real-world traffic management challenges and smart city initiatives.

**TRINETRA-P: Quantify Parking-Induced Congestion Before It Gridlocks the City.**
