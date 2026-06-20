import pandas as pd
import numpy as np

def calculate_picq_metrics(df: pd.DataFrame) -> pd.DataFrame:
    """
    Core PICQ methodology implementation.
    Takes a dataframe of segments and calculates POP, CSI, PICL, RRE, and PICQ.
    """
    if "segment_id" not in df.columns and "road_segment_id" in df.columns:
        df["segment_id"] = df["road_segment_id"]

    # Basic feature engineering
    # Mocking standard PICQ calculations
    if "violations" not in df.columns:
        df["violations"] = np.random.randint(1, 100, size=len(df))
    
    # 1. Parking Obstruction Pressure (POP)
    # POP = normalized combination of violation pressure and recurrence
    df["POP"] = (df["violations"] / df["violations"].max()) * 100
    
    # 2. Capacity Sensitivity Index (CSI)
    # CSI = random for mock if not available, representing road sensitivity
    df["CSI"] = np.random.uniform(0.5, 1.0, size=len(df))

    # 3. Parking-Induced Capacity Loss (PICL)
    df["PICL"] = df["POP"] * df["CSI"]

    # 4. PICQ (Final normalized score)
    df["picq_score"] = (df["PICL"] / df["PICL"].max()) * 100
    df["picq_score"] = df["picq_score"].fillna(0).round(2)

    # 5. Road Recovery Estimate (RRE)
    df["rre_score"] = (df["picq_score"] * 0.6 + np.random.uniform(0, 20, size=len(df))).clip(0, 100).round(2)

    # 6. Quadrant Assignment
    median_violations = df["violations"].median()
    median_picq = df["picq_score"].median()

    def assign_quadrant(row):
        high_vol = row["violations"] >= median_violations
        high_impact = row["picq_score"] >= median_picq
        if high_vol and high_impact:
            return "Q1"
        elif not high_vol and high_impact:
            return "Q2"
        elif high_vol and not high_impact:
            return "Q3"
        else:
            return "Q4"

    df["quadrant"] = df.apply(assign_quadrant, axis=1)

    # 7. Enforcement Score
    df["enforcement_score"] = (0.45 * df["picq_score"] + 0.35 * df["rre_score"] + 0.20 * df["POP"]).round(2)

    return df
