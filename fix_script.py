import re

with open('TRINETRA_PICQ_Research_Model.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the broken lines
content = re.sub(r"\\'Unknown\\'", "'Unknown'", content)
content = re.sub(r"\\'Unknown'", "'Unknown'", content)
content = re.sub(r"'Unknown\\'", "'Unknown'", content)

with open('TRINETRA_PICQ_Research_Model.py', 'w', encoding='utf-8') as f:
    f.write(content)
