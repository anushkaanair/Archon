import glob
import os

path = 'c:\\Users\\admin\\.gemini\\antigravity\\playground\\giant-crater\\archon\\app\\db\\models\\*.py'

for file in glob.glob(path):
    with open(file, 'r') as f:
        content = f.read()

    new_content = content.replace(
        'from sqlalchemy.dialects.postgresql import JSONB, UUID',
        'from sqlalchemy import JSON as JSONB, Uuid as UUID'
    ).replace(
        'from sqlalchemy.dialects.postgresql import UUID',
        'from sqlalchemy import Uuid as UUID'
    ).replace(
        'from sqlalchemy.dialects.postgresql import JSONB',
        'from sqlalchemy import JSON as JSONB'
    )

    if new_content != content:
        with open(file, 'w') as f:
            f.write(new_content)
        print(f"Fixed {os.path.basename(file)}")
