import sqlite3

conn = sqlite3.connect('output/firebase_dump.sqlite')
cursor = conn.cursor()

cursor.execute('SELECT valid, COUNT(*) FROM test_responses GROUP BY valid')
rows = cursor.fetchall()
print('Valid breakdown:')
for row in rows:
    print(f'  valid={row[0]!r}: {row[1]} rows')

conn.close()
