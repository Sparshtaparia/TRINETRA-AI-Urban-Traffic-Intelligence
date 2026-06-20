import json

NOTEBOOK_PATH = "TRINETRA_PICQ_Research_Model.ipynb"

# Create a notebook with all the code in appropriate cells.
cells = []

def add_md(text):
    cells.append({
        "cell_type": "markdown",
        "metadata": {},
        "source": [line + "\n" for line in text.split("\n")]
    })

def add_code(text):
    cells.append({
        "cell_type": "code",
        "execution_count": None,
        "metadata": {},
        "outputs": [],
        "source": [line + "\n" for line in text.split("\n")]
    })

# Add title
add_md("""# TRINETRA-P: Parking-Induced Congestion Quantification Research Notebook

**Abstract:**
This notebook converts parking violation records into road-segment-level congestion impact intelligence using PICQ and RRE. It implements the entire algorithmic backend for the TRINETRA-P application, replacing basic violation heatmaps with a rigorous capacity-recovery prioritization model.
""")

add_md("## Core Configuration and Libraries")
# We will read the py file and inject it as a code cell.
with open("TRINETRA_PICQ_Research_Model.py", "r", encoding="utf-8") as f:
    full_code = f.read()

# I will split the code at "TRINETRA-P Model Engineering Layer"
parts = full_code.split("# ============================================================\n# TRINETRA-P Model Engineering Layer")

cleaning_code = parts[0]

model_code = ""
if len(parts) > 1:
    model_code = "# ============================================================\n# TRINETRA-P Model Engineering Layer" + parts[1]

add_code(cleaning_code)

add_md("""## TRINETRA-P Model Engineering Layer
The following cell contains the advanced analytical pipeline that transforms the cleaned segments into the mathematical outputs (POP, CSI, PICL, PICQ, RRE, Quadrants, Anomalies, and Simulations) requested in the project requirements.
""")

if model_code:
    # Separate the `if __name__ == '__main__':` block to run it
    model_parts = model_code.split('if __name__ == "__main__":')
    add_code(model_parts[0])
    add_md("## Pipeline Execution\nRun the complete data cleaning and modeling pipeline on the dataset.")
    add_code('if __name__ == "__main__":' + model_parts[1])

notebook = {
    "cells": cells,
    "metadata": {
        "language_info": {
            "name": "python"
        }
    },
    "nbformat": 4,
    "nbformat_minor": 2
}

with open(NOTEBOOK_PATH, 'w', encoding='utf-8') as f:
    json.dump(notebook, f, indent=1)
    
print("Notebook generated successfully!")
