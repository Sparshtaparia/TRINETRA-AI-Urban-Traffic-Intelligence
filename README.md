# TRINETRA-P: Parking-Induced Congestion Intelligence Platform

**AI-Powered Parking Congestion Intelligence for Targeted Urban Enforcement**

TRINETRA-P converts parking violation records and live violation events into explainable, road-segment-level congestion impact intelligence, helping enforcement teams prioritize where towing and patrol action will recover the maximum road capacity.

## Core Problem
Illegal and spillover on-street parking near commercial areas reduces effective carriageway width, slows traffic, and creates enforcement pressure. TRINETRA-P answers: **Which parking violations are causing the highest congestion damage, and where should enforcement act first to recover the most road capacity?**

## Methodology: PICQ
The platform is based on the **PICQ: Parking-Induced Congestion Quantification** engine:
1. **POP**: Parking Obstruction Pressure
2. **CSI**: Capacity Sensitivity Index
3. **PICL**: Parking-Induced Capacity Loss
4. **RRE**: Road Recovery Estimate

## Dual-Mode Architecture
1. **Historical Intelligence Mode**: Batch processing for planning enforcement via uploaded CSV datasets.
2. **Live Operations Mode**: Real-time operations fed via WebSockets and Live APIs.

## How to Run
### Backend
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## How to Demo
1. Open the Landing Page (`http://localhost:3000`).
2. Click **Launch Intelligence Platform**.
3. Choose **Historical Intelligence**.
4. Upload any parking CSV (or use mock data) to trigger the PICQ Engine.
5. Watch the dashboard populate with Audit passing metrics and the Q2 Hidden Impact Zones.

## Key Findings
- **TRINETRA-P found 864 Hidden Impact Zones and 896 Suppressed Heatmap Zones across 7,814 analyzed segment intelligence units.**
- **Only 5 segments crossed the strict normalized RRE ≥ 60 threshold, while the top decile of recovery-priority segments provides a broader operational shortlist.**
