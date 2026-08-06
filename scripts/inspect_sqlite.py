import sqlite3

def inspect():
    db_path = 'output/firebase_dump.sqlite'
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';")
    tables = [t[0] for t in cursor.fetchall()]
    print("Tables in SQLite database:", tables)

    cursor.execute("SELECT * FROM metadata;")
    meta = cursor.fetchone()
    print("\nMetadata:", meta)

    print("\nRow counts per relational SQL table:")
    for table in tables:
        if table == "metadata":
            continue
        cursor.execute(f"SELECT COUNT(*) FROM `{table}`;")
        count = cursor.fetchone()[0]
        print(f"  - {table}: {count} rows")

    print("\nSample foreign key connection counts:")
    cursor.execute("SELECT z.name, COUNT(c.id) FROM zones z LEFT JOIN centers c ON c.zone_id = z.id GROUP BY z.id;")
    centers_per_zone = cursor.fetchall()
    print("  - Centers per Zone sample:")
    for zone_name, count in centers_per_zone[:5]:
        print(f"    * {zone_name}: {count} centers")

    cursor.execute("SELECT role, COUNT(*) FROM admin_users GROUP BY role;")
    admin_roles = cursor.fetchall()
    print("  - Admin users by role:")
    for role, count in admin_roles:
        print(f"    * {role}: {count} users")

    conn.close()

if __name__ == '__main__':
    inspect()

