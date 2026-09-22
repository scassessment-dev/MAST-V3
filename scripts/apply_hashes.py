import json
import sqlite3
import os

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
hashes_path = os.path.join(base_dir, "tmp", "hashed_passwords.json")

with open(hashes_path, "r", encoding="utf-8") as f:
    hashes = json.load(f)

db_paths = [
    os.path.join(base_dir, "data", "mast.sqlite"),
    os.path.join(base_dir, "output", "firebase_dump.sqlite"),
    os.path.abspath(os.path.join(base_dir, "..", "MAST Test V2", "output", "firebase_dump.sqlite"))
]

for db_path in db_paths:
    if not os.path.exists(db_path):
        print(f"Skipping non-existent DB: {db_path}")
        continue

    print(f"Updating password hashes in: {db_path}")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    updated = 0
    for email, pw_hash in hashes.items():
        cursor.execute("UPDATE admin_users SET password_hash = ? WHERE LOWER(email) = ?", (pw_hash, email.lower()))
        updated += cursor.rowcount

    conn.commit()
    conn.close()
    print(f"Updated {updated} admin password hashes in {os.path.basename(db_path)}.")

print("All SQLite database password updates complete!")
