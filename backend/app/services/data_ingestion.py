import pandas as pd
import io
import os
import sys

# Ensure we can import the research model
RESEARCH_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../research"))
if RESEARCH_DIR not in sys.path:
    sys.path.append(RESEARCH_DIR)

# Module-level constants — safe to define at import time (no heavy imports)
if os.getenv("VERCEL") == "1" or os.getenv("VERCEL_ENV") is not None or os.getenv("AWS_REGION") is not None:
    PROCESSED_DIR = "/tmp/processed"
else:
    PROCESSED_DIR = os.path.join(os.path.dirname(__file__), "../../processed")

DATA_DIR = os.path.join(os.path.dirname(__file__), "../../../data")
os.makedirs(PROCESSED_DIR, exist_ok=True)


def _run_full_pipeline(df: pd.DataFrame) -> dict:
    # Import deferred so Vercel startup never triggers sklearn/matplotlib
    import TRINETRA_PICQ_Research_Model
    # Clear the global pipeline verification array to prevent duplicate appending
    TRINETRA_PICQ_Research_Model.pipeline_verification.clear()

    raw_count = len(df)

    # 1. Run sophisticated cleaning and EDA
    df_clean, summary, verif = TRINETRA_PICQ_Research_Model.run_cleaning_pipeline(df)

    # 2. Run the PICQ engine, metrics generation, quadrant classification, and export all JSON artifacts
    seg, rank, audit, sim = TRINETRA_PICQ_Research_Model.run_trinetra_model_pipeline(df_clean, raw_records=raw_count)

    return {
        "status": "success",
        "message": "Dataset processed successfully",
        "rows_analyzed": len(seg)
    }


def process_flipkart_dataset() -> dict:
    try:
        file_path = os.path.join(DATA_DIR, "jan to may police violation_anonymized791b166 (Theme 1 parking lot data).csv")
        if not os.path.exists(file_path):
            return {"status": "failed", "error": "Flipkart dataset file not found in data directory."}

        df = pd.read_csv(file_path, low_memory=False)
        return _run_full_pipeline(df)

    except Exception as e:
        return {"status": "failed", "error": str(e)}


def process_uploaded_file(contents: bytes, filename: str) -> dict:
    try:
        if filename.endswith(".parquet"):
            df = pd.read_parquet(io.BytesIO(contents), engine='pyarrow')
        elif filename.endswith(".csv.gz"):
            df = pd.read_csv(io.BytesIO(contents), compression='gzip', low_memory=False)
        elif filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(contents), low_memory=False)
        elif filename.endswith(".xlsx") or filename.endswith(".xls"):
            df = pd.read_excel(io.BytesIO(contents))
        else:
            return {"status": "failed", "error": "Unsupported file type"}

        return _run_full_pipeline(df)

    except Exception as e:
        return {"status": "failed", "error": str(e)}


def load_processed_data() -> pd.DataFrame:
    output_path = os.path.join(PROCESSED_DIR, "trinetra_segment_scores.csv")
    if os.path.exists(output_path):
        return pd.read_csv(output_path)
    return pd.DataFrame()
