# TRINETRA-P Research Summary

## Objective
To convert standard parking violation data into an actionable intelligence system mapping congestion impact (PICQ) and road capacity recovery (RRE) metrics.

## Approach
- **Data Pipeline:** Ingested violations and processed them into segment-level metrics.
- **Metrics Computed:** POP (Obstruction Pressure), CSI (Sensitivity Index), PICL (Capacity Loss), PICQ, and RRE.
- **Quadrant Analysis:** Discovered Hidden Impact Zones (Q2) vs Suppressed Heatmap Zones (Q3).

## Deliverables Generated
1. `TRINETRA_PICQ_Research_Model.ipynb`: The exhaustive analytical Jupyter Notebook.
2. `TRINETRA_PICQ_Research_Model.py`: Source script replica.
3. `backend/processed/*`: Multiple JSON and CSV datasets ready for TRINETRA-P software ingestion, including `enforcement_ranking.json` and `hidden_impact_zones.json`.

*TRINETRA-P: From heatmaps to intelligence.*
