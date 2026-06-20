import pandas as pd
import io
import os
from .picq_engine import calculate_picq_metrics

PROCESSED_DIR = os.path.join(os.path.dirname(__file__), "../../processed")
DATA_DIR = os.path.join(os.path.dirname(__file__), "../../../data")
os.makedirs(PROCESSED_DIR, exist_ok=True)

def run_eda_cleaning(df: pd.DataFrame) -> pd.DataFrame:
    """EDA Agent logic to clean and standardize the dataset"""
    # Standardize column names
    col_map = {}
    for col in df.columns:
        lcol = str(col).lower().strip()
        if lcol in ["road_segment_id", "segment_id", "road_id", "link_id", "id"]:
            col_map[col] = "segment_id"
        elif lcol in ["latitude", "lat", "y", "gps_lat"]:
            col_map[col] = "latitude"
        elif lcol in ["longitude", "lon", "lng", "long", "x", "gps_lng"]:
            col_map[col] = "longitude"
        elif lcol in ["violation_type", "offence_type", "offense_type", "violation"]:
            col_map[col] = "violation_type"
    
    df.rename(columns=col_map, inplace=True)
    
    # Drop rows without location if latitude/longitude are expected
    if "latitude" in df.columns and "longitude" in df.columns:
        # Convert to numeric, dropping invalid coordinates
        df["latitude"] = pd.to_numeric(df["latitude"], errors="coerce")
        df["longitude"] = pd.to_numeric(df["longitude"], errors="coerce")
        df.dropna(subset=["latitude", "longitude"], inplace=True)
        
        # Ensure we have a segment_id based on coordinates if missing
        if "segment_id" not in df.columns:
            df["segment_id"] = "SEG-" + df["latitude"].round(3).astype(str) + "-" + df["longitude"].round(3).astype(str)
    else:
        # If no coordinates, just generate a dummy segment_id
        if "segment_id" not in df.columns:
            df["segment_id"] = ["SEG-" + str(i) for i in range(len(df))]

    # Ensure there are no empty segment_ids
    df.dropna(subset=["segment_id"], inplace=True)

    # Save cleaned sample to PROCESSED_DIR
    df.to_csv(os.path.join(PROCESSED_DIR, "cleaned_parking_data.csv"), index=False)
    
    return df

def aggregate_and_score(df: pd.DataFrame) -> pd.DataFrame:
    """Aggregates cleaned data into segments and runs PICQ"""
    agg_df = df.groupby("segment_id").agg({
        "segment_id": "first",
        "latitude": "mean" if "latitude" in df.columns else lambda x: None,
        "longitude": "mean" if "longitude" in df.columns else lambda x: None,
    }).rename(columns={"segment_id": "seg_id_drop"}).reset_index()
    
    agg_df["violations"] = df.groupby("segment_id").size().values
    
    # Calculate PICQ metrics
    final_df = calculate_picq_metrics(agg_df)
    
    output_path = os.path.join(PROCESSED_DIR, "segment_rre_scores.csv")
    final_df.to_csv(output_path, index=False)
    return final_df

def process_flipkart_dataset() -> dict:
    try:
        file_path = os.path.join(DATA_DIR, "jan to may police violation_anonymized791b166 (Theme 1 parking lot data).csv")
        if not os.path.exists(file_path):
            return {"status": "failed", "error": "Flipkart dataset file not found in data directory."}
        
        # Load heavy dataset in chunks if necessary, but for 100MB Pandas can read it directly
        df = pd.read_csv(file_path, low_memory=False)
        
        cleaned_df = run_eda_cleaning(df)
        final_df = aggregate_and_score(cleaned_df)
        
        return {"status": "success", "message": "Flipkart dataset processed successfully", "rows_analyzed": len(final_df)}
    except Exception as e:
        return {"status": "failed", "error": str(e)}

def process_uploaded_file(contents: bytes, filename: str) -> dict:
    try:
        if filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(contents), low_memory=False)
        elif filename.endswith(".xlsx") or filename.endswith(".xls"):
            df = pd.read_excel(io.BytesIO(contents))
        else:
            return {"status": "failed", "error": "Unsupported file type"}
        
        cleaned_df = run_eda_cleaning(df)
        final_df = aggregate_and_score(cleaned_df)
        
        return {"status": "success", "message": "Dataset processed successfully", "rows_analyzed": len(final_df)}
        
    except Exception as e:
        return {"status": "failed", "error": str(e)}

def load_processed_data() -> pd.DataFrame:
    output_path = os.path.join(PROCESSED_DIR, "segment_rre_scores.csv")
    if os.path.exists(output_path):
        return pd.read_csv(output_path)
    return pd.DataFrame()
