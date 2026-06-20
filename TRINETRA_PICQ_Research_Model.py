import os
import json
import time
import re
from pathlib import Path

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns


OUTPUT_DIR = Path("backend/processed")
FIGURE_DIR = OUTPUT_DIR / "figures"

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
FIGURE_DIR.mkdir(parents=True, exist_ok=True)

pipeline_verification = []


def show_separator(title):
    print("\n" + "=" * 80)
    print(title)
    print("=" * 80)


def record_step(step, status, input_rows, output_rows, notes="", extra=None, start_time=None):
    elapsed = round(time.time() - start_time, 3) if start_time else None

    record = {
        "step": step,
        "status": status,
        "input_rows": int(input_rows) if input_rows is not None else None,
        "output_rows": int(output_rows) if output_rows is not None else None,
        "rows_removed": int(input_rows - output_rows) if input_rows is not None and output_rows is not None else None,
        "time_seconds": elapsed,
        "notes": notes
    }

    if extra:
        record.update(extra)

    pipeline_verification.append(record)

    print(f"{step}: {status}")
    print(f"Input rows : {input_rows}")
    print(f"Output rows: {output_rows}")
    if notes:
        print(f"Notes      : {notes}")


def standardize_column_names(df):
    start = time.time()
    input_rows = len(df)

    original_columns = list(df.columns)

    def clean_col(col):
        col = str(col).strip().lower()
        col = re.sub(r"[^a-z0-9]+", "_", col)
        col = re.sub(r"_+", "_", col).strip("_")
        return col

    df = df.copy()
    df.columns = [clean_col(c) for c in df.columns]

    column_map = dict(zip(original_columns, df.columns))

    record_step(
        "Column Standardization",
        "PASS",
        input_rows,
        len(df),
        notes="Column names normalized to lowercase snake_case.",
        extra={"column_map": column_map},
        start_time=start
    )

    return df, column_map


def create_schema_audit(df):
    show_separator("SCHEMA AUDIT")

    audit_rows = []

    for col in df.columns:
        samples = df[col].dropna().astype(str).head(5).tolist()

        audit_rows.append({
            "column_name": col,
            "dtype": str(df[col].dtype),
            "missing_count": int(df[col].isna().sum()),
            "missing_rate": round(float(df[col].isna().mean()), 4),
            "unique_count": int(df[col].nunique(dropna=True)),
            "sample_values": " | ".join(samples)
        })

    schema_audit = pd.DataFrame(audit_rows)
    schema_audit.to_csv(OUTPUT_DIR / "schema_audit.csv", index=False)

    try:
        display(schema_audit)
    except NameError:
        print(schema_audit)

    return schema_audit


COLUMN_SYNONYMS = {
    "timestamp": [
        "timestamp", "date", "datetime", "time", "violation_time",
        "offence_time", "offense_time", "challan_time", "created_at"
    ],
    "latitude": [
        "latitude", "lat", "y", "gps_lat"
    ],
    "longitude": [
        "longitude", "lon", "lng", "long", "x", "gps_lng", "gps_long"
    ],
    "violation_type": [
        "violation_type", "offence_type", "offense_type", "violation",
        "offence", "offense", "violation_name", "challan_type"
    ],
    "zone": [
        "zone", "area", "police_station", "station", "locality",
        "beat", "ward", "district"
    ],
    "vehicle_type": [
        "vehicle_type", "vehicle", "class", "vehicle_class"
    ],
    "road_segment_id": [
        "road_segment_id", "segment_id", "road_id", "link_id",
        "segment", "road_segment"
    ]
}


def detect_schema_mapping(df):
    show_separator("INTELLIGENT COLUMN DETECTION")

    start = time.time()
    mapping = {}

    available_cols = list(df.columns)

    for target, synonyms in COLUMN_SYNONYMS.items():
        detected = None
        reason = ""
        confidence = "Missing"

        for col in available_cols:
            if col == target or col in synonyms:
                detected = col
                confidence = "High"
                reason = "Exact synonym match"
                break

        if detected is None:
            for col in available_cols:
                for syn in synonyms:
                    # Skip short column names (e.g. 'id') to avoid false matches
                    if len(col) <= 3 and len(syn) > 4:
                        continue
                    if syn in col or col in syn:
                        detected = col
                        confidence = "Medium"
                        reason = f"Partial match with synonym '{syn}'"
                        break
                if detected:
                    break

        mapping[target] = {
            "detected_column": detected,
            "confidence": confidence,
            "reason": reason if detected else "No matching column found",
            "manual_override_needed": confidence in ["Low", "Missing"]
        }

    mapping_df = pd.DataFrame([
        {"target_field": k, **v}
        for k, v in mapping.items()
    ])

    try:
        display(mapping_df)
    except NameError:
        print(mapping_df)

    mapping_df.to_csv(OUTPUT_DIR / "schema_mapping.csv", index=False)

    record_step(
        "Schema Detection",
        "PASS",
        len(df),
        len(df),
        notes="Automatic schema detection completed.",
        extra={"detected_mapping": mapping},
        start_time=start
    )

    return mapping, mapping_df


def rename_detected_columns(df, mapping):
    df = df.copy()

    rename_map = {}

    for target, info in mapping.items():
        detected = info["detected_column"]
        if detected and detected in df.columns:
            rename_map[detected] = target

    df = df.rename(columns=rename_map)

    return df, rename_map


def parse_timestamp(df):
    show_separator("TIMESTAMP PARSING")

    start = time.time()
    input_rows = len(df)

    if "timestamp" not in df.columns:
        df["timestamp"] = pd.NaT

        record_step(
            "Timestamp Parsing",
            "WARN",
            input_rows,
            len(df),
            notes="No timestamp column found. Temporal features will use fallback defaults.",
            start_time=start
        )

        return df

    df = df.copy()
    df["timestamp_raw"] = df["timestamp"]

    df["timestamp"] = pd.to_datetime(
        df["timestamp"],
        errors="coerce",
        dayfirst=True
    )

    invalid_timestamps = int(df["timestamp"].isna().sum())
    invalid_rate = invalid_timestamps / max(len(df), 1)

    status = "PASS" if invalid_rate < 0.30 else "WARN"

    record_step(
        "Timestamp Parsing",
        status,
        input_rows,
        len(df),
        notes=f"Invalid timestamp rows: {invalid_timestamps} ({invalid_rate:.2%}).",
        extra={
            "invalid_timestamps": invalid_timestamps,
            "invalid_timestamp_rate": round(invalid_rate, 4)
        },
        start_time=start
    )

    return df


def validate_coordinates(df):
    show_separator("COORDINATE VALIDATION")

    start = time.time()
    input_rows = len(df)

    df = df.copy()

    if "latitude" not in df.columns or "longitude" not in df.columns:
        df["has_valid_coordinates"] = False

        record_step(
            "Coordinate Validation",
            "WARN",
            input_rows,
            len(df),
            notes="Latitude/longitude columns missing. Map intelligence will use fallback.",
            extra={"valid_coordinate_rows": 0},
            start_time=start
        )

        return df

    df["latitude"] = pd.to_numeric(df["latitude"], errors="coerce")
    df["longitude"] = pd.to_numeric(df["longitude"], errors="coerce")

    valid_mask = (
        df["latitude"].between(-90, 90)
        & df["longitude"].between(-180, 180)
    )

    bengaluru_like = (
        df["latitude"].between(12.0, 14.0)
        & df["longitude"].between(76.0, 78.5)
    )

    df["has_valid_coordinates"] = valid_mask
    df["is_bengaluru_like_coordinate"] = bengaluru_like

    valid_count = int(valid_mask.sum())
    valid_rate = valid_count / max(len(df), 1)

    status = "PASS" if valid_rate > 0.50 else "WARN"

    record_step(
        "Coordinate Validation",
        status,
        input_rows,
        len(df),
        notes=f"Valid coordinate rows: {valid_count} ({valid_rate:.2%}).",
        extra={
            "valid_coordinate_rows": valid_count,
            "valid_coordinate_rate": round(valid_rate, 4)
        },
        start_time=start
    )

    return df


def clean_violation_text(df):
    show_separator("VIOLATION TEXT CLEANING")

    start = time.time()
    input_rows = len(df)

    df = df.copy()

    if "violation_type" not in df.columns:
        df["violation_type"] = "parking_violation_unspecified"

        record_step(
            "Violation Text Cleaning",
            "WARN",
            input_rows,
            len(df),
            notes="Violation type column missing. Assuming parking dataset based on project theme.",
            start_time=start
        )

        return df

    df["violation_type"] = (
        df["violation_type"]
        .astype(str)
        .str.lower()
        .str.strip()
        .str.replace(r"\s+", " ", regex=True)
    )

    record_step(
        "Violation Text Cleaning",
        "PASS",
        input_rows,
        len(df),
        notes="Violation type text normalized.",
        start_time=start
    )

    return df


def filter_parking_records(df):
    show_separator("PARKING RECORD FILTERING")

    start = time.time()
    input_rows = len(df)

    parking_keywords = [
        "parking", "no parking", "wrong parking", "obstruction",
        "towing", "parked", "unauthorised parking", "unauthorized parking",
        "illegal parking"
    ]

    if "violation_type" not in df.columns:
        df["is_parking_related"] = True
        status = "WARN"
        notes = "No violation type available. Treating all records as parking-related."
    else:
        pattern = "|".join(parking_keywords)
        df["is_parking_related"] = df["violation_type"].str.contains(
            pattern,
            case=False,
            na=False,
            regex=True
        )

        match_rate = df["is_parking_related"].mean()

        if match_rate < 0.05:
            df["is_parking_related"] = True
            status = "WARN"
            notes = "Keyword match rate was very low. Retaining all rows as parking dataset based on dataset theme."
        else:
            status = "PASS"
            notes = f"Parking-related rows retained using keyword filter. Match rate: {match_rate:.2%}."

    parking_df = df[df["is_parking_related"]].copy()

    record_step(
        "Parking Record Filtering",
        status,
        input_rows,
        len(parking_df),
        notes=notes,
        start_time=start
    )

    return parking_df


def remove_duplicate_records(df):
    show_separator("DUPLICATE REMOVAL")

    start = time.time()
    input_rows = len(df)

    df = df.copy()
    df_clean = df.drop_duplicates()

    duplicate_count = input_rows - len(df_clean)

    record_step(
        "Duplicate Removal",
        "PASS",
        input_rows,
        len(df_clean),
        notes=f"Removed {duplicate_count} duplicate rows.",
        extra={"duplicate_rows_removed": int(duplicate_count)},
        start_time=start
    )

    return df_clean


def create_segment_id(df):
    show_separator("SEGMENT ID CREATION")

    start = time.time()
    input_rows = len(df)

    df = df.copy()
    method = "unknown"
    status = "WARN"
    unique_segments = 0
    avg_records = 0.0
    pct_single_record = 0.0

    # Helper function to compute metrics
    def evaluate_segmentation(temp_df):
        nonlocal unique_segments, avg_records, pct_single_record
        unique_segments = temp_df["segment_id"].nunique()
        records_per_segment = temp_df.groupby("segment_id").size()
        avg_records = float(records_per_segment.mean())
        pct_single_record = float((records_per_segment == 1).mean())
        return avg_records >= 3 and pct_single_record <= 0.50

    # 1. Existing road_segment_id
    if "road_segment_id" in df.columns and df["road_segment_id"].notna().sum() > 0:
        nunique_road = df["road_segment_id"].nunique()
        cardinality_ratio = nunique_road / max(len(df), 1)
        if cardinality_ratio <= 0.5:
            df["segment_id"] = "RSEG-" + df["road_segment_id"].astype(str)
            if evaluate_segmentation(df):
                method = "existing_road_segment_id"
                status = "PASS"

    # 2. Dynamic Grid Fallback Loop
    if "segment_id" not in df.columns and "latitude" in df.columns and "longitude" in df.columns and df["has_valid_coordinates"].sum() > 0:
        for precision in [3, 2, 1]:
            multiplier = 10 ** precision
            grid_lat = (df["latitude"] * multiplier).round().astype(int)
            grid_lon = (df["longitude"] * multiplier).round().astype(int)
            
            df["segment_id"] = "GRID-" + grid_lat.astype(str) + "-" + grid_lon.astype(str)
            
            if evaluate_segmentation(df):
                method = f"grid_cell_precision_{precision}"
                status = "PASS"
                break

    # 3. Zone Fallback
    if ("segment_id" not in df.columns or status != "PASS") and "zone" in df.columns and df["zone"].notna().sum() > 0:
        df["segment_id"] = "ZONE-" + df["zone"].astype(str).str.lower().str.replace(r"[^a-z0-9]+", "_", regex=True)
        evaluate_segmentation(df)
        method = "zone_based_segment"
        status = "WARN"

    # 4. Ultimate Row Group Fallback
    if "segment_id" not in df.columns:
        df["segment_id"] = "SEG-" + (np.arange(len(df)) // 50).astype(str)
        evaluate_segmentation(df)
        method = "row_group_fallback"
        status = "WARN"

    if pct_single_record > 0.5:
        notes = (
            f"Segment creation method: {method}. Unique segments: {unique_segments}. "
            f"WARNING: {pct_single_record:.1%} of segments have exactly 1 record. "
            f"Avg records/segment: {avg_records:.1f}. Consider reducing grid precision."
        )
        status = "WARN"
    else:
        notes = (
            f"Segment creation method: {method}. Unique segments: {unique_segments}. "
            f"Avg records/segment: {avg_records:.1f}. "
            f"Segments with single record: {pct_single_record:.1%}."
        )

    record_step(
        "Segment ID Creation",
        status,
        input_rows,
        len(df),
        notes=notes,
        extra={
            "segment_creation_method": method,
            "unique_segments": unique_segments,
            "avg_records_per_segment": round(avg_records, 2),
            "pct_single_record_segments": round(pct_single_record, 4)
        },
        start_time=start
    )

    return df, method


def add_temporal_features(df):
    show_separator("TEMPORAL FEATURE CREATION")

    start = time.time()
    input_rows = len(df)

    df = df.copy()

    if "timestamp" in df.columns and df["timestamp"].notna().sum() > 0:
        df["date"] = df["timestamp"].dt.date
        df["hour"] = df["timestamp"].dt.hour
        df["day_of_week"] = df["timestamp"].dt.day_name()
        df["month"] = df["timestamp"].dt.month
        df["is_weekend"] = df["timestamp"].dt.dayofweek >= 5
        df["is_peak_hour"] = df["hour"].isin([8, 9, 10, 17, 18, 19, 20])
        df["is_night"] = df["hour"].isin([21, 22, 23, 0, 1, 2, 3, 4, 5])
        status = "PASS"
        notes = "Temporal features created from timestamp."
    else:
        df["date"] = None
        df["hour"] = -1
        df["day_of_week"] = "unknown"
        df["month"] = -1
        df["is_weekend"] = False
        df["is_peak_hour"] = False
        df["is_night"] = False
        status = "WARN"
        notes = "Timestamp unavailable. Temporal features set to fallback defaults."

    record_step(
        "Temporal Feature Creation",
        status,
        input_rows,
        len(df),
        notes=notes,
        start_time=start
    )

    return df


def compute_data_quality_score(df):
    show_separator("DATA QUALITY SCORING")

    start = time.time()
    input_rows = len(df)

    df = df.copy()

    has_timestamp = df["timestamp"].notna() if "timestamp" in df.columns else False
    has_coordinates = df["has_valid_coordinates"] if "has_valid_coordinates" in df.columns else False
    has_segment = df["segment_id"].notna() if "segment_id" in df.columns else False
    has_violation = df["violation_type"].notna() if "violation_type" in df.columns else False

    df["record_quality_score"] = (
        25 * pd.Series(has_segment).astype(int)
        + 25 * pd.Series(has_timestamp).astype(int)
        + 25 * pd.Series(has_coordinates).astype(int)
        + 25 * pd.Series(has_violation).astype(int)
    )

    avg_quality = round(float(df["record_quality_score"].mean()), 2)

    record_step(
        "Data Quality Scoring",
        "PASS",
        input_rows,
        len(df),
        notes=f"Average record quality score: {avg_quality}/100.",
        extra={"average_record_quality_score": avg_quality},
        start_time=start
    )

    return df


def create_cleaning_summary(raw_df, clean_df, segment_method):
    summary = {
        "raw_rows": int(len(raw_df)),
        "cleaned_rows": int(len(clean_df)),
        "rows_removed_total": int(len(raw_df) - len(clean_df)),
        "duplicate_rows_removed": int(next(
            (x.get("duplicate_rows_removed", 0) for x in pipeline_verification if x["step"] == "Duplicate Removal"),
            0
        )),
        "unique_segments": int(clean_df["segment_id"].nunique()) if "segment_id" in clean_df.columns else 0,
        "segment_creation_method": segment_method,
        "valid_coordinate_rows": int(clean_df["has_valid_coordinates"].sum()) if "has_valid_coordinates" in clean_df.columns else 0,
        "valid_coordinate_rate": round(float(clean_df["has_valid_coordinates"].mean()), 4) if "has_valid_coordinates" in clean_df.columns else 0.0,
        "missing_timestamp_rate": round(float(clean_df["timestamp"].isna().mean()), 4) if "timestamp" in clean_df.columns else 1.0,
        "average_record_quality_score": round(float(clean_df["record_quality_score"].mean()), 2) if "record_quality_score" in clean_df.columns else None
    }

    with open(OUTPUT_DIR / "cleaning_summary.json", "w") as f:
        json.dump(summary, f, indent=2)

    print(json.dumps(summary, indent=2))

    return summary


def plot_missing_value_report(df):
    missing = df.isna().sum().sort_values(ascending=False)
    missing = missing[missing > 0]

    if len(missing) == 0:
        print("No missing values found.")
        return

    plt.figure(figsize=(10, max(4, len(missing) * 0.35)))
    sns.barplot(x=missing.values, y=missing.index)
    plt.title("Missing Value Report")
    plt.xlabel("Missing Count")
    plt.ylabel("Column")
    plt.tight_layout()
    plt.savefig(FIGURE_DIR / "missing_value_report.png", dpi=200)
    plt.close()


def plot_row_retention_funnel(raw_rows, cleaned_rows):
    plt.figure(figsize=(8, 4))
    sns.barplot(
        x=["Raw Data", "Cleaned Data"],
        y=[raw_rows, cleaned_rows]
    )
    plt.title("Row Retention Funnel")
    plt.ylabel("Row Count")
    plt.tight_layout()
    plt.savefig(FIGURE_DIR / "row_retention_funnel.png", dpi=200)
    plt.close()


def run_cleaning_pipeline(df):
    show_separator("TRINETRA-P DATA CLEANING PIPELINE")

    raw_df = df.copy()

    df, column_map = standardize_column_names(df)
    schema_audit = create_schema_audit(df)
    mapping, mapping_df = detect_schema_mapping(df)
    df, rename_map = rename_detected_columns(df, mapping)
    df = parse_timestamp(df)
    df = validate_coordinates(df)
    df = clean_violation_text(df)
    df = filter_parking_records(df)
    df = remove_duplicate_records(df)
    df, segment_method = create_segment_id(df)
    df = add_temporal_features(df)
    df = compute_data_quality_score(df)

    cleaning_summary = create_cleaning_summary(raw_df, df, segment_method)

    df.to_csv(OUTPUT_DIR / "cleaned_parking_records.csv", index=False)

    with open(OUTPUT_DIR / "pipeline_verification.json", "w") as f:
        json.dump(pipeline_verification, f, indent=2, default=str)

    plot_missing_value_report(df)
    plot_row_retention_funnel(len(raw_df), len(df))

    show_separator("CLEANING PIPELINE COMPLETED")
    return df, cleaning_summary, pipeline_verification

# ============================================================
# TRINETRA-P Model Engineering Layer
# ============================================================

def safe_minmax(series, default=0.0):
    series = pd.to_numeric(series, errors='coerce')
    series = series.replace([np.inf, -np.inf], np.nan).fillna(0)
    s_min = series.min()
    s_max = series.max()
    if s_max == s_min:
        return pd.Series(default, index=series.index)
    return ((series - s_min) / (s_max - s_min)) * 100.0

def clip_score(series):
    return series.clip(0, 100)

def normalize_series(series):
    return safe_minmax(series)

def build_segment_features(df_clean):
    show_separator("BUILDING SEGMENT FEATURES")
    start = time.time()

    raw_rows = len(df_clean)

    aggs = {
        'total_violations': ('segment_id', 'count')
    }

    if 'is_peak_hour' in df_clean.columns:
        aggs['peak_hour_violations'] = ('is_peak_hour', 'sum')
    if 'is_night' in df_clean.columns:
        aggs['night_violations'] = ('is_night', 'sum')
    if 'is_weekend' in df_clean.columns:
        aggs['weekend_violations'] = ('is_weekend', 'sum')
    if 'record_quality_score' in df_clean.columns:
        aggs['record_quality_avg'] = ('record_quality_score', 'mean')

    segment_df = df_clean.groupby('segment_id').agg(**aggs).reset_index()

    # Verify aggregation integrity
    assert segment_df["total_violations"].sum() == raw_rows, \
        f"Segment aggregation mismatch: {segment_df['total_violations'].sum()} != {raw_rows}"

    if 'zone' in df_clean.columns:
        zone_mode = df_clean.groupby('segment_id')['zone'].agg(lambda x: (lambda m: m.iloc[0] if len(m) > 0 else 'Unknown')(pd.Series(x).mode(dropna=True))).reset_index()
        segment_df = pd.merge(segment_df, zone_mode, on='segment_id', how='left')
    else:
        segment_df['zone'] = 'Unknown'

    if 'date' in df_clean.columns and df_clean['date'].notna().any():
        unique_days = df_clean.groupby('segment_id')['date'].nunique().reset_index(name='unique_days')
        segment_df = pd.merge(segment_df, unique_days, on='segment_id', how='left')
    else:
        segment_df['unique_days'] = 1

    if 'hour' in df_clean.columns and (df_clean['hour'] != -1).any():
        active_hours = df_clean.groupby('segment_id')['hour'].nunique().reset_index(name='active_hours')
        peak_hour_val = df_clean.groupby('segment_id')['hour'].agg(lambda x: (lambda m: m.iloc[0] if len(m) > 0 else -1)(pd.Series(x).mode(dropna=True))).reset_index(name='peak_hour')
        segment_df = pd.merge(segment_df, active_hours, on='segment_id', how='left')
        segment_df = pd.merge(segment_df, peak_hour_val, on='segment_id', how='left')
    else:
        segment_df['active_hours'] = 1
        segment_df['peak_hour'] = -1

    for col in ['peak_hour_violations', 'night_violations', 'weekend_violations']:
        if col not in segment_df.columns:
            segment_df[col] = 0

    segment_df['peak_hour_ratio'] = segment_df['peak_hour_violations'] / segment_df['total_violations'].clip(lower=1)
    segment_df['night_ratio'] = segment_df['night_violations'] / segment_df['total_violations'].clip(lower=1)
    segment_df['weekend_ratio'] = segment_df['weekend_violations'] / segment_df['total_violations'].clip(lower=1)
    segment_df['temporal_persistence'] = safe_minmax(segment_df['unique_days'] * segment_df['active_hours'])
    segment_df['recurrence_score'] = safe_minmax(segment_df['unique_days'])

    if 'latitude' in df_clean.columns and 'longitude' in df_clean.columns:
        coords = df_clean.groupby('segment_id')[['latitude', 'longitude']].mean().reset_index()
        coords.rename(columns={'latitude': 'avg_latitude', 'longitude': 'avg_longitude'}, inplace=True)
        segment_df = pd.merge(segment_df, coords, on='segment_id', how='left')
        segment_df['has_coordinates'] = segment_df['avg_latitude'].notna()
    else:
        segment_df['avg_latitude'] = np.nan
        segment_df['avg_longitude'] = np.nan
        segment_df['has_coordinates'] = False

    if 'violation_type' in df_clean.columns:
        vtype = df_clean.groupby('segment_id')['violation_type'].agg(lambda x: (lambda m: m.iloc[0] if len(m) > 0 else 'Unknown')(pd.Series(x).mode(dropna=True))).reset_index(name='violation_type_mode')
        segment_df = pd.merge(segment_df, vtype, on='segment_id', how='left')
    else:
        segment_df['violation_type_mode'] = 'Unknown'

    if 'vehicle_type' in df_clean.columns:
        vehtype = df_clean.groupby('segment_id')['vehicle_type'].agg(lambda x: (lambda m: m.iloc[0] if len(m) > 0 else 'Unknown')(pd.Series(x).mode(dropna=True))).reset_index(name='vehicle_type_mode')
        segment_df = pd.merge(segment_df, vehtype, on='segment_id', how='left')
    else:
        segment_df['vehicle_type_mode'] = 'Unknown'

    segment_df['data_completeness'] = 100.0
    if 'record_quality_avg' not in segment_df.columns:
        segment_df['record_quality_avg'] = 50.0

    # Granularity audit
    records_per_seg = segment_df['total_violations']
    avg_records = float(records_per_seg.mean())
    single_record_pct = float((records_per_seg == 1).mean())

    print(f"  Raw records: {raw_rows}")
    print(f"  Segment rows: {len(segment_df)}")
    print(f"  Avg records/segment: {avg_records:.2f}")
    print(f"  Single-record segments: {single_record_pct:.1%}")
    if single_record_pct > 0.5:
        print("  WARNING: Over 50% of segments have only 1 record. Aggregation too granular.")

    plt.figure(figsize=(8,4))
    sns.histplot(segment_df['total_violations'], bins=50)
    plt.title("Segment Violation Distribution")
    plt.savefig(FIGURE_DIR / "01_segment_violation_distribution.png", dpi=200)
    plt.close()

    plt.figure(figsize=(10,5))
    top20 = segment_df.sort_values('total_violations', ascending=False).head(20)
    sns.barplot(data=top20, x='total_violations', y='segment_id')
    plt.title("Top 20 Segments by Total Violations")
    plt.savefig(FIGURE_DIR / "02_top_segments_by_violations.png", dpi=200)
    plt.close()

    record_step("Build Segment Features", "PASS", len(df_clean), len(segment_df),
                notes=f"Segment aggregation: {len(segment_df)} segments from {raw_rows} records. Avg {avg_records:.1f} records/segment.",
                start_time=start)
    return segment_df

def compute_violation_pressure(segment_df):
    score = (
        0.50 * safe_minmax(segment_df['total_violations']) +
        0.25 * safe_minmax(segment_df['unique_days']) +
        0.15 * safe_minmax(segment_df['active_hours']) +
        0.10 * safe_minmax(segment_df['peak_hour_violations'])
    )
    segment_df['violation_pressure_score'] = clip_score(score)
    return segment_df

def compute_recurrence_score(segment_df):
    if segment_df['unique_days'].max() <= 1:
        score = safe_minmax(segment_df['total_violations']) * 0.5
    else:
        score = (
            0.45 * safe_minmax(segment_df['unique_days']) +
            0.35 * safe_minmax(segment_df['active_hours']) +
            0.20 * safe_minmax(segment_df['total_violations'])
        )
    segment_df['recurrence_score'] = clip_score(score)
    
    plt.figure(figsize=(8,4))
    sns.histplot(segment_df['recurrence_score'], bins=50)
    plt.title("Recurrence Score Distribution")
    plt.savefig(FIGURE_DIR / "03_recurrence_score_distribution.png", dpi=200)
    plt.close()
    return segment_df

def compute_peak_hour_pressure(segment_df):
    score = (
        0.70 * (segment_df['peak_hour_ratio'] * 100) +
        0.30 * safe_minmax(segment_df['peak_hour_violations'])
    )
    segment_df['peak_hour_pressure'] = clip_score(score)
    
    plt.figure(figsize=(8,4))
    sns.histplot(segment_df['peak_hour_pressure'], bins=50)
    plt.title("Peak Hour Pressure Distribution")
    plt.savefig(FIGURE_DIR / "04_peak_hour_pressure_distribution.png", dpi=200)
    plt.close()
    return segment_df

def compute_severity_proxy(segment_df):
    score = (
        0.40 * segment_df['peak_hour_pressure'] +
        0.30 * segment_df['recurrence_score'] +
        0.30 * segment_df['violation_pressure_score']
    )
    segment_df['severity_proxy'] = clip_score(score)
    return segment_df

def compute_road_sensitivity_proxy(segment_df):
    zone_counts = segment_df['zone'].value_counts()
    segment_df['zone_density'] = segment_df['zone'].map(zone_counts)
    
    score = (
        0.30 * segment_df['peak_hour_pressure'] +
        0.25 * safe_minmax(segment_df['zone_density']) +
        0.25 * segment_df['recurrence_score'] +
        0.20 * segment_df['violation_pressure_score']
    )
    segment_df['road_sensitivity_proxy'] = clip_score(score)
    return segment_df

def compute_pop_score(segment_df):
    score = (
        0.40 * segment_df['violation_pressure_score'] +
        0.25 * segment_df['recurrence_score'] +
        0.20 * segment_df['peak_hour_pressure'] +
        0.15 * segment_df['severity_proxy']
    )
    segment_df['pop_score'] = clip_score(score)
    
    plt.figure(figsize=(8,4))
    sns.histplot(segment_df['pop_score'], bins=50)
    plt.title("POP Distribution")
    plt.savefig(FIGURE_DIR / "05_pop_distribution.png", dpi=200)
    plt.close()
    return segment_df

def compute_csi_score(segment_df):
    score = (
        0.40 * segment_df['road_sensitivity_proxy'] +
        0.25 * segment_df['peak_hour_pressure'] +
        0.20 * segment_df['recurrence_score'] +
        0.15 * safe_minmax(segment_df['zone_density'])
    )
    segment_df['csi_score'] = clip_score(score)
    
    plt.figure(figsize=(8,4))
    sns.histplot(segment_df['csi_score'], bins=50)
    plt.title("CSI Distribution")
    plt.savefig(FIGURE_DIR / "06_csi_distribution.png", dpi=200)
    plt.close()
    return segment_df

def compute_picl_score(segment_df):
    score = safe_minmax((segment_df['pop_score'] / 100) * (segment_df['csi_score'] / 100))
    segment_df['picl_score'] = clip_score(score)
    
    plt.figure(figsize=(8,4))
    sns.histplot(segment_df['picl_score'], bins=50)
    plt.title("PICL Distribution")
    plt.savefig(FIGURE_DIR / "07_picl_distribution.png", dpi=200)
    plt.close()
    return segment_df

def compute_picq_score(segment_df):
    score = (
        0.30 * segment_df['pop_score'] +
        0.25 * segment_df['csi_score'] +
        0.25 * segment_df['picl_score'] +
        0.10 * segment_df['recurrence_score'] +
        0.10 * segment_df['peak_hour_pressure']
    )
    segment_df['picq_score'] = safe_minmax(score)
    
    plt.figure(figsize=(8,4))
    sns.histplot(segment_df['picq_score'], bins=50)
    plt.title("PICQ Distribution")
    plt.savefig(FIGURE_DIR / "08_picq_distribution.png", dpi=200)
    plt.close()
    
    plt.figure(figsize=(8,5))
    sns.scatterplot(data=segment_df, x='total_violations', y='picq_score')
    plt.title("Violation Count vs PICQ Score")
    plt.savefig(FIGURE_DIR / "10_violation_count_vs_picq.png", dpi=200)
    plt.close()
    return segment_df

def compute_rre_score(segment_df):
    score = (
        0.45 * segment_df['picl_score'] +
        0.35 * segment_df['picq_score'] +
        0.20 * segment_df['pop_score']
    )
    segment_df['rre_score'] = safe_minmax(score)
    
    zero_rate = (segment_df['rre_score'] == 0).mean()
    if zero_rate > 0.5:
        print("WARNING: RRE Score has high zero rate, applying safe normalization.")
        segment_df['rre_score'] = safe_minmax(segment_df['rre_score'], default=10.0)
        
    plt.figure(figsize=(8,4))
    sns.histplot(segment_df['rre_score'], bins=50)
    plt.title("RRE Distribution")
    plt.savefig(FIGURE_DIR / "09_rre_distribution.png", dpi=200)
    plt.close()
    
    plt.figure(figsize=(8,5))
    sns.scatterplot(data=segment_df, x='picq_score', y='rre_score')
    plt.title("PICQ vs RRE Score")
    plt.savefig(FIGURE_DIR / "11_picq_vs_rre.png", dpi=200)
    plt.close()
    return segment_df

def classify_quadrants(segment_df):
    df = segment_df.copy()

    df["high_violation"] = False
    df["high_impact"] = False

    n_unique_viol = df["total_violations"].nunique()
    if n_unique_viol <= 2:
        violation_threshold = float(df["total_violations"].median())
    else:
        violation_threshold = max(2.0, float(df["total_violations"].quantile(0.60)))

    impact_threshold = float(df["picq_score"].quantile(0.60))

    if pd.isna(violation_threshold) or violation_threshold == 0:
        violation_threshold = 1.0
    if pd.isna(impact_threshold) or impact_threshold == 0:
        impact_threshold = float(df["picq_score"].median())

    df["high_violation"] = df["total_violations"] >= violation_threshold
    df["high_impact"] = df["picq_score"] >= impact_threshold

    conditions = [
        df["high_violation"] & df["high_impact"],
        (~df["high_violation"]) & df["high_impact"],
        df["high_violation"] & (~df["high_impact"]),
        (~df["high_violation"]) & (~df["high_impact"])
    ]

    choices = ["Q1", "Q2", "Q3", "Q4"]
    df["quadrant"] = np.select(conditions, choices, default="Q4")

    label_map = {
        "Q1": "Immediate Dispatch",
        "Q2": "Hidden Impact Zone",
        "Q3": "Suppressed Heatmap Zone",
        "Q4": "Routine Monitor"
    }
    df["quadrant_label"] = df["quadrant"].map(label_map)

    # Audit print
    q_counts = df["quadrant"].value_counts()
    print(f"\n  Violation threshold: {violation_threshold:.2f}")
    print(f"  Impact threshold:    {impact_threshold:.2f}")
    print(f"  High violation segments: {df['high_violation'].sum()}")
    print(f"  High impact segments:    {df['high_impact'].sum()}")
    for q in ['Q1', 'Q2', 'Q3', 'Q4']:
        print(f"  {q}: {q_counts.get(q, 0)}")

    # Quadrant integrity checks
    hv_count = int(df["high_violation"].sum())
    hi_count = int(df["high_impact"].sum())
    q1 = q_counts.get("Q1", 0)
    q3 = q_counts.get("Q3", 0)
    q2 = q_counts.get("Q2", 0)
    q4 = q_counts.get("Q4", 0)

    assert q1 + q2 + q3 + q4 == len(df), f"Quadrant counts ({q1+q2+q3+q4}) do not sum to total segments ({len(df)})."

    if hv_count > 0:
        assert q1 + q3 == hv_count, f"Q1({q1}) + Q3({q3}) = {q1+q3} != high_violation count ({hv_count})"
    if hi_count > 0:
        assert q1 + q2 == hi_count, f"Q1({q1}) + Q2({q2}) = {q1+q2} != high_impact count ({hi_count})"

    if (q1 == 0 and q3 == 0) and hv_count > 0:
        print("  WARNING: Quadrant imbalance detected. Check segment granularity and violation threshold.")

    plt.figure(figsize=(8,4))
    sns.countplot(data=df, x='quadrant', order=['Q1','Q2','Q3','Q4'])
    plt.title("Quadrant Distribution")
    plt.savefig(FIGURE_DIR / "12_quadrant_distribution.png", dpi=200)
    plt.close()

    plt.figure(figsize=(8,5))
    sns.scatterplot(data=df, x='total_violations', y='picq_score', hue='quadrant')
    plt.axvline(violation_threshold, color='k', linestyle='--')
    plt.axhline(impact_threshold, color='k', linestyle='--')
    plt.title("Quadrant Scatter")
    plt.savefig(FIGURE_DIR / "13_quadrant_scatter.png", dpi=200)
    plt.close()

    return df

def detect_hidden_impact_zones(segment_df):
    segment_df['is_hidden_impact_zone'] = segment_df['quadrant'] == 'Q2'
    q2_df = segment_df[segment_df['is_hidden_impact_zone']].sort_values('picq_score', ascending=False)
    
    plt.figure(figsize=(10,5))
    if len(q2_df) > 0:
        sns.barplot(data=q2_df.head(20), x='picq_score', y='segment_id')
        plt.title("Top 20 Hidden Impact Zones")
    else:
        plt.text(0.5, 0.5, 'No Q2 zones detected', ha='center', va='center')
    plt.savefig(FIGURE_DIR / "14_top_hidden_impact_zones.png", dpi=200)
    plt.close()
    return segment_df

def detect_suppressed_heatmap_zones(segment_df):
    segment_df['is_suppressed_heatmap_zone'] = segment_df['quadrant'] == 'Q3'
    
    heatmap_prioritized = segment_df[segment_df['quadrant'].isin(['Q1', 'Q3'])]
    picq_prioritized = segment_df[segment_df['quadrant'].isin(['Q1', 'Q2'])]
    
    plt.figure(figsize=(8,5))
    sns.barplot(x=['Heatmap Approach', 'PICQ Approach'], y=[len(heatmap_prioritized), len(picq_prioritized)])
    plt.title("Heatmap vs PICQ High-Priority Zones")
    plt.savefig(FIGURE_DIR / "20_heatmap_vs_picq_priority_comparison.png", dpi=200)
    plt.close()
    
    return segment_df

def compute_data_confidence(segment_df):
    coord_conf = segment_df['has_coordinates'].astype(int) * 100
    time_conf = (segment_df['active_hours'] > 1).astype(int) * 100
    
    score = (
        0.25 * coord_conf +
        0.25 * time_conf +
        0.20 * segment_df['record_quality_avg'] +
        0.15 * segment_df['recurrence_score'] +
        0.15 * segment_df['data_completeness']
    )
    segment_df['data_confidence'] = clip_score(score)
    
    plt.figure(figsize=(8,4))
    sns.histplot(segment_df['data_confidence'], bins=20)
    plt.title("Data Confidence Score Distribution")
    plt.savefig(FIGURE_DIR / "16_data_confidence_distribution.png", dpi=200)
    plt.close()
    
    return segment_df

def compute_enforcement_score(segment_df):
    score = (
        0.45 * segment_df['picq_score'] +
        0.35 * segment_df['rre_score'] +
        0.20 * segment_df['violation_pressure_score']
    )
    # Adjustment factor
    score = score * (0.7 + 0.3 * segment_df['data_confidence'] / 100)
    segment_df['enforcement_score'] = clip_score(score)
    
    segment_df.sort_values('enforcement_score', ascending=False, inplace=True)
    
    plt.figure(figsize=(10,5))
    sns.barplot(data=segment_df.head(20), x='enforcement_score', y='segment_id')
    plt.title("Top 20 Enforcement Segments")
    plt.savefig(FIGURE_DIR / "15_top_enforcement_segments.png", dpi=200)
    plt.close()
    
    return segment_df

def assign_recommended_action(row):
    q = row['quadrant']
    action = ""
    if q == 'Q1':
        action = "Immediate tow dispatch + repeat patrol"
    elif q == 'Q2':
        action = "Targeted hidden-impact enforcement + field verification"
    elif q == 'Q3':
        action = "Monitor; deprioritize unless public complaint or recurrence increases"
    else:
        action = "Routine monitoring"
        
    if row['rre_score'] > 60:
        action += " | High road recovery potential"
        
    return action

def run_hotspot_clustering(segment_df):
    from sklearn.cluster import DBSCAN
    
    if segment_df['has_coordinates'].sum() < 10:
        print("Hotspot clustering skipped because valid coordinates are unavailable.")
        return pd.DataFrame()
        
    # To prevent MemoryError on 300k segments, only cluster the top 20000 by severity
    target_idx = segment_df[segment_df['has_coordinates']].sort_values('picq_score', ascending=False).head(20000).index
    coords = segment_df.loc[target_idx, ['avg_latitude', 'avg_longitude']].values
    
    if len(coords) == 0:
        return pd.DataFrame()
        
    db = DBSCAN(eps=0.01, min_samples=3).fit(coords)
    segment_df['hotspot_cluster'] = -1
    segment_df.loc[target_idx, 'hotspot_cluster'] = db.labels_
    
    cluster_df = segment_df[segment_df['hotspot_cluster'] >= 0].groupby('hotspot_cluster').agg(
        cluster_size=('segment_id', 'count'),
        cluster_center_lat=('avg_latitude', 'mean'),
        cluster_center_lon=('avg_longitude', 'mean'),
        avg_picq=('picq_score', 'mean'),
        avg_rre=('rre_score', 'mean')
    ).reset_index()
    
    return cluster_df

def run_anomaly_detection(segment_df):
    try:
        from sklearn.ensemble import IsolationForest
        features = segment_df[['total_violations', 'recurrence_score', 'peak_hour_pressure', 'pop_score', 'csi_score', 'picq_score', 'rre_score']].fillna(0)
        clf = IsolationForest(contamination=0.05, random_state=42)
        segment_df['is_anomaly'] = clf.fit_predict(features) == -1
        segment_df['anomaly_score'] = -clf.score_samples(features)
    except ImportError:
        print("sklearn not available, using percentile-based fallback anomaly score.")
        segment_df['anomaly_score'] = safe_minmax(segment_df['picq_score'] * segment_df['total_violations'])
        segment_df['is_anomaly'] = segment_df['anomaly_score'] > 90
        
    plt.figure(figsize=(8,4))
    sns.histplot(segment_df['anomaly_score'], bins=50)
    plt.title("Anomaly Score Distribution")
    plt.savefig(FIGURE_DIR / "17_anomaly_score_distribution.png", dpi=200)
    plt.close()
    
    return segment_df

def simulate_enforcement_recovery(ranking_df, top_n=20):
    sim_df = ranking_df.head(top_n).copy()
    
    effs = [0.5, 0.7, 0.9]
    for e in effs:
        sim_df[f'recovered_cap_{int(e*100)}'] = sim_df['rre_score'] * e
        sim_df[f'post_picq_{int(e*100)}'] = sim_df['picq_score'] * (1 - 0.6 * e)
        
    plt.figure(figsize=(8,5))
    for e in effs:
        plt.plot(range(1, len(sim_df)+1), sim_df[f'recovered_cap_{int(e*100)}'].cumsum(), label=f"{int(e*100)}% Effectiveness")
    plt.title("Cumulative Recovery Curve")
    plt.legend()
    plt.savefig(FIGURE_DIR / "18_what_if_recovery_curve.png", dpi=200)
    plt.close()
    
    plt.figure(figsize=(8,5))
    plt.plot(sim_df['segment_id'].head(10), sim_df['picq_score'].head(10), label="Before", marker='o')
    plt.plot(sim_df['segment_id'].head(10), sim_df['post_picq_70'].head(10), label="After 70%", marker='x')
    plt.title("Before vs After PICQ Simulation (Top 10)")
    plt.legend()
    plt.xticks(rotation=45)
    plt.savefig(FIGURE_DIR / "19_before_after_picq_simulation.png", dpi=200)
    plt.close()
    
    return sim_df

def generate_model_audit(segment_df, ranking_df, raw_rows=None):
    audit = []

    def check(name, form, val, status, notes=""):
        audit.append({"metric_name": name, "formula": form, "computed_value": val, "status": status, "notes": notes})

    total = len(segment_df)
    rre_zero = (segment_df['rre_score'] == 0).mean()
    sorted_ok = ranking_df['enforcement_score'].is_monotonic_decreasing

    q_counts = segment_df["quadrant"].value_counts()
    q1 = q_counts.get("Q1", 0)
    q2 = q_counts.get("Q2", 0)
    q3 = q_counts.get("Q3", 0)
    q4 = q_counts.get("Q4", 0)
    hv_count = int(segment_df["high_violation"].sum()) if "high_violation" in segment_df.columns else 0
    hi_count = int(segment_df["high_impact"].sum()) if "high_impact" in segment_df.columns else 0

    avg_records_per_seg = round(segment_df["total_violations"].mean(), 2) if "total_violations" in segment_df.columns else 0
    min_rre = round(float(segment_df["rre_score"].min()), 2)
    median_rre = round(float(segment_df["rre_score"].median()), 2)
    mean_rre = round(float(segment_df["rre_score"].mean()), 2)
    max_rre = round(float(segment_df["rre_score"].max()), 2)
    critical_rre = int((segment_df["rre_score"] >= 60).sum())
    top_10_rre_threshold = float(segment_df["rre_score"].quantile(0.90))
    top_10_zones = int((segment_df["rre_score"] >= top_10_rre_threshold).sum())

    q_sum = q1 + q2 + q3 + q4
    q_sum_ok = "PASS" if q_sum == total else "FAIL"
    hv_ok = "PASS" if hv_count > 0 else "FAIL"
    hi_ok = "PASS" if hi_count > 0 else "FAIL"
    q1q3_sum = q1 + q3
    q1q3_ok = "PASS" if hv_count == 0 or q1q3_sum == hv_count else "FAIL"
    q1q2_sum = q1 + q2
    q1q2_ok = "PASS" if hi_count == 0 or q1q2_sum == hi_count else "FAIL"

    if raw_rows:
        check("Raw Parking Records", "raw_rows", raw_rows, "PASS")
        check("Analyzed Segments", "len(segment_df)", total, "PASS" if total < raw_rows else "WARN",
              "Segment count should be less than raw records for proper aggregation")
        check("Avg Records / Segment", "total_violations.mean()", avg_records_per_seg,
              "PASS" if avg_records_per_seg > 1 else "WARN",
              "Low value means segment aggregation is too granular")

    check("Segment Row Count", "len(segment_df)", total, "PASS" if total > 0 else "FAIL")
    check("Q Count Sum = Total Segments", "Q1+Q2+Q3+Q4", f"{q_sum} == {total}",
          q_sum_ok, f"Q1:{q1} Q2:{q2} Q3:{q3} Q4:{q4}")
    check("High Violation Count > 0", "sum(high_violation)", hv_count, hv_ok)
    check("High Impact Count > 0", "sum(high_impact)", hi_count, hi_ok)
    check("Q1 + Q3 = High Violation Count", f"{q1}+{q3} == {hv_count}", f"{q1q3_sum} == {hv_count}",
          q1q3_ok, f"Q1:{q1} Q3:{q3} high_violation:{hv_count}")
    check("Q1 + Q2 = High Impact Count", f"{q1}+{q2} == {hi_count}", f"{q1q2_sum} == {hi_count}",
          q1q2_ok, f"Q1:{q1} Q2:{q2} high_impact:{hi_count}")
    check("Q1 Count", "count(quadrant=='Q1')", q1, "PASS" if q1 > 0 else "WARN",
          "Zero Q1 means no high-violation-high-impact zones")
    check("Q2 Count", "count(quadrant=='Q2')", q2, "PASS")
    check("Q3 Count", "count(quadrant=='Q3')", q3, "PASS" if q3 > 0 else "WARN",
          "Zero Q3 means no high-violation-low-impact zones")
    check("Q4 Count", "count(quadrant=='Q4')", q4, "PASS")
    check("Average PICQ", "mean(picq)", round(segment_df['picq_score'].mean(), 2), "PASS")
    check("Peak PICQ", "max(picq)", round(segment_df['picq_score'].max(), 2), "PASS")
    check("Average RRE", "mean(rre)", mean_rre, "PASS")
    check("Peak RRE", "max(rre)", max_rre, "PASS")
    check("Min RRE", "min(rre)", min_rre, "PASS")
    check("Median RRE", "median(rre)", median_rre, "PASS")
    check("Critical RRE Zones (>=60)", "count(rre>=60)", critical_rre, "PASS")
    check("Top 10% Recovery Priority Zones", "count(rre>=quantile(0.90))", top_10_zones, 
          "PASS" if abs(top_10_zones / total - 0.1) < 0.05 else "WARN", 
          "Should be approximately 10% of total analyzed segments")
    check("RRE Zero Rate", "count(rre==0)/total", f"{rre_zero:.2%}", "PASS" if rre_zero < 0.5 else "WARN")
    check("Ranking Sorted Correctly", "is_monotonic(enforcement_score)", str(sorted_ok),
          "PASS" if sorted_ok else "FAIL")
    check("Average Data Confidence", "mean(data_confidence)", round(segment_df['data_confidence'].mean(), 2), "PASS")

    if q1 == 0 or q3 == 0:
        check("Quadrant Balance", "Q1>0 and Q3>0",
              f"Q1={q1}, Q3={q3}", "WARN",
              "Quadrant imbalance. Check segment granularity and violation threshold.")

    audit_df = pd.DataFrame(audit)
    return audit_df

def export_model_outputs(segment_df, ranking_df, audit_df, hidden_df, simulation_df, raw_records=None):
    segment_df.to_csv(OUTPUT_DIR / "trinetra_segment_scores.csv", index=False)
    segment_df.to_json(OUTPUT_DIR / "trinetra_segment_scores.json", orient='records')

    ranking_df.to_csv(OUTPUT_DIR / "enforcement_ranking.csv", index=False)
    ranking_df.to_json(OUTPUT_DIR / "enforcement_ranking.json", orient='records')

    hidden_df.to_csv(OUTPUT_DIR / "hidden_impact_zones.csv", index=False)
    hidden_df.to_json(OUTPUT_DIR / "hidden_impact_zones.json", orient='records')

    quad = segment_df['quadrant'].value_counts().reset_index()
    quad.columns = ['quadrant', 'count']
    quad.to_csv(OUTPUT_DIR / "quadrant_summary.csv", index=False)
    quad.to_json(OUTPUT_DIR / "quadrant_summary.json", orient='records')

    audit_df.to_csv(OUTPUT_DIR / "audit_verification.csv", index=False)
    audit_df.to_json(OUTPUT_DIR / "audit_verification.json", orient='records')

    simulation_df.to_csv(OUTPUT_DIR / "what_if_simulation.csv", index=False)
    simulation_df.to_json(OUTPUT_DIR / "what_if_simulation.json", orient='records')

    q_counts = segment_df['quadrant'].value_counts()
    avg_records_per_seg = round(float(segment_df["total_violations"].mean()), 2)

    dashboard_summary = {
        "raw_parking_records": raw_records if raw_records else len(segment_df),
        "analyzed_segments": len(segment_df),
        "avg_records_per_segment": avg_records_per_seg,
        "average_picq": float(segment_df['picq_score'].mean()),
        "median_picq": float(segment_df['picq_score'].median()),
        "peak_picq": float(segment_df['picq_score'].max()),
        "average_rre": float(segment_df['rre_score'].mean()),
        "median_rre": float(segment_df['rre_score'].median()),
        "peak_rre": float(segment_df['rre_score'].max()),
        "critical_rre_zones": int((segment_df['rre_score'] >= 60).sum()),
        "critical_rre_threshold": 60,
        "top_10_rre_threshold": float(segment_df['rre_score'].quantile(0.90)),
        "top_10_recovery_priority_zones": int((segment_df['rre_score'] >= segment_df['rre_score'].quantile(0.90)).sum()),
        "hidden_impact_zones": int(q_counts.get('Q2', 0)),
        "suppressed_heatmap_zones": int(q_counts.get('Q3', 0)),
        "q1_count": int(q_counts.get('Q1', 0)),
        "q2_count": int(q_counts.get('Q2', 0)),
        "q3_count": int(q_counts.get('Q3', 0)),
        "q4_count": int(q_counts.get('Q4', 0)),
        "high_violation_count": int(segment_df["high_violation"].sum()) if "high_violation" in segment_df.columns else 0,
        "high_impact_count": int(segment_df["high_impact"].sum()) if "high_impact" in segment_df.columns else 0,
        "violation_threshold": float(segment_df["total_violations"].quantile(0.60)) if "total_violations" in segment_df.columns else 0,
        "impact_threshold": float(segment_df["picq_score"].quantile(0.60)) if "picq_score" in segment_df.columns else 0,
        "average_data_confidence": float(segment_df['data_confidence'].mean()),
        "top_enforcement_segment": str(ranking_df.iloc[0]['segment_id']) if len(ranking_df) > 0 else ""
    }

    with open(OUTPUT_DIR / "dashboard_summary.json", "w") as f:
        json.dump(dashboard_summary, f, indent=2)

def run_trinetra_model_pipeline(df_clean, raw_records=None):
    show_separator("TRINETRA-P MODEL PIPELINE")

    if raw_records is None:
        raw_records = len(df_clean)

    segment_df = build_segment_features(df_clean)

    segment_df = compute_violation_pressure(segment_df)
    segment_df = compute_recurrence_score(segment_df)
    segment_df = compute_peak_hour_pressure(segment_df)
    segment_df = compute_severity_proxy(segment_df)
    segment_df = compute_road_sensitivity_proxy(segment_df)
    segment_df = compute_pop_score(segment_df)
    segment_df = compute_csi_score(segment_df)
    segment_df = compute_picl_score(segment_df)
    segment_df = compute_picq_score(segment_df)
    segment_df = compute_rre_score(segment_df)
    segment_df = compute_data_confidence(segment_df)
    segment_df = classify_quadrants(segment_df)
    segment_df = detect_hidden_impact_zones(segment_df)
    segment_df = detect_suppressed_heatmap_zones(segment_df)
    segment_df = compute_enforcement_score(segment_df)
    segment_df["recommended_action"] = segment_df.apply(assign_recommended_action, axis=1)

    ranking_df = segment_df.sort_values("enforcement_score", ascending=False).reset_index(drop=True)
    ranking_df["rank"] = ranking_df.index + 1

    hotspot_df = run_hotspot_clustering(segment_df)
    segment_df = run_anomaly_detection(segment_df)
    simulation_df = simulate_enforcement_recovery(ranking_df, top_n=20)

    audit_df = generate_model_audit(segment_df, ranking_df, raw_rows=raw_records)
    export_model_outputs(segment_df, ranking_df, audit_df, segment_df[segment_df["quadrant"] == "Q2"], simulation_df, raw_records=raw_records)

    show_separator("MODEL PIPELINE COMPLETED")
    return segment_df, ranking_df, audit_df, simulation_df

USE_SYNTHETIC_DEMO = False

if __name__ == "__main__":
    import warnings
    warnings.filterwarnings('ignore')
    
    data_path = Path("data/jan to may police violation_anonymized791b166 (Theme 1 parking lot data).csv")
    if not data_path.exists():
        if USE_SYNTHETIC_DEMO:
            print(f"Generating synthetic dataset for testing... (could not find {data_path})")
            np.random.seed(42)
            syn_size = 15000
            df_raw = pd.DataFrame({
                'timestamp': pd.date_range(start='2024-01-01', periods=syn_size, freq='h'),
                'lat': np.random.normal(12.9716, 0.05, syn_size),
                'lng': np.random.normal(77.5946, 0.05, syn_size),
                'violation_type': np.random.choice(['no parking', 'wrong parking', 'speeding', 'helmet'], syn_size, p=[0.4, 0.3, 0.2, 0.1]),
                'zone': np.random.choice(['Indiranagar', 'Koramangala', 'Whitefield', 'Jayanagar', 'Malleswaram'], syn_size),
                'vehicle_type': np.random.choice(['2W', '4W', 'HMV'], syn_size, p=[0.6, 0.35, 0.05]),
                'road_segment_id': np.random.randint(1000, 2000, syn_size)
            })
        else:
            raise FileNotFoundError(f"Real dataset missing at {data_path}. Set USE_SYNTHETIC_DEMO=True to fallback to synthetic demo.")
    else:
        df_raw = pd.read_csv(data_path, low_memory=False)
        
    raw_row_count = len(df_raw)
    df_clean, summary, verif = run_cleaning_pipeline(df_raw)
    seg, rank, audit, sim = run_trinetra_model_pipeline(df_clean, raw_records=raw_row_count)
    print("Execution Finished Successfully!")
