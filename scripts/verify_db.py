import sqlite3

def verify():
    conn = sqlite3.connect('output/firebase_dump.sqlite')
    cursor = conn.cursor()

    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = [t[0] for t in cursor.fetchall()]
    print('Tables in DB:', tables)

    cursor.execute('PRAGMA foreign_keys = ON;')
    cursor.execute('PRAGMA foreign_key_check;')
    fk_errs = cursor.fetchall()
    print('Foreign key errors:', fk_errs)

    cursor.execute('SELECT gender_scope, role, COUNT(*) FROM admin_users GROUP BY gender_scope, role;')
    print('\nAdmin users count by gender scope & role:')
    for r in cursor.fetchall():
        print(' ', r)

    cursor.execute("SELECT name, email, gender_scope, role FROM admin_users WHERE email LIKE 'f.%' LIMIT 5;")
    print('\nSample Female Admins (f. prefix):')
    for r in cursor.fetchall():
        print(' ', r)

    cursor.execute("SELECT name, email, gender_scope, role FROM admin_users WHERE email LIKE '%main.master%';")
    print('\nMain Master Admin:')
    for r in cursor.fetchall():
        print(' ', r)

    cursor.execute('SELECT id, participant_name, gender, second_test_yes_count, second_test_primary_type, second_test_is_valid FROM test_responses LIMIT 3;')
    print('\nSample Test Responses (with Second Test columns):')
    for r in cursor.fetchall():
        print(' ', r)

    conn.close()

if __name__ == '__main__':
    verify()
