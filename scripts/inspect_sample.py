import sqlite3

conn = sqlite3.connect('output/firebase_dump.sqlite')
conn.row_factory = sqlite3.Row
cursor = conn.cursor()

# Sample test_responses
cursor.execute('SELECT * FROM test_responses LIMIT 2')
rows = cursor.fetchall()
print('=== test_responses sample ===')
for r in rows:
    print(dict(r))
print()

# Check answers sample
cursor.execute('SELECT * FROM test_response_answers LIMIT 5')
rows = cursor.fetchall()
print('=== test_response_answers sample ===')
for r in rows:
    print(dict(r))
print()

# Check second answers sample
cursor.execute('SELECT * FROM test_response_second_answers LIMIT 5')
rows = cursor.fetchall()
print('=== test_response_second_answers sample ===')
for r in rows:
    print(dict(r))
print()

# Count how many test_responses have second answers
cursor.execute('SELECT COUNT(DISTINCT test_response_id) FROM test_response_second_answers')
print('Responses with second answers:', cursor.fetchone()[0])

# Count valid/invalid/null
cursor.execute('SELECT valid, COUNT(*) FROM test_responses GROUP BY valid')
print('Valid breakdown:', cursor.fetchall())

# Admin users sample
cursor.execute('SELECT id, name, email, role, is_active, zone_id, center_id FROM admin_users LIMIT 3')
rows = cursor.fetchall()
print()
print('=== admin_users sample ===')
for r in rows:
    print(dict(r))

# Zones sample
cursor.execute('SELECT * FROM zones LIMIT 5')
rows = cursor.fetchall()
print()
print('=== zones sample ===')
for r in rows:
    print(dict(r))

# Centers sample
cursor.execute('SELECT * FROM centers LIMIT 5')
rows = cursor.fetchall()
print()
print('=== centers sample ===')
for r in rows:
    print(dict(r))

conn.close()
