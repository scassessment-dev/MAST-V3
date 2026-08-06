import json
import os
import sqlite3
import sys
import bcrypt

# 40 Second Test Statements from packages/core/src/second-test.ts
SECOND_TEST_STATEMENTS = {
    "M": [
        "હું કોઈપણ નવા કામ કે પ્રોજેક્ટ વિશે સાંભળું ત્યારે મારામાં એકદમ ઝડપથી ઉત્સાહ જાગી જાય છે.",
        "મને લોકો વચ્ચે રહેવું, નવી ઓળખાણ બનાવવી અને વાતચીત કરવી કુદરતી રીતે જ ગમે છે.",
        "મુશ્કેલ કે તણાવવાળા વાતાવરણમાં પણ હું વાતોથી માહોલને હળવો બનાવવાનો પ્રયત્ન કરું છું.",
        "હું કામ કરતી વખતે ફક્ત નિયમો જોવાની જગ્યાએ વ્યક્તિ સાથેના લાગણીના સંબંધને વધુ મહત્વ આપું છું.",
        "લાંબો સમય એકલા બેસીને એકનું એક કામ કર્યા કરવું મને ખૂબ જ કંટાળાજનક લાગે છે.",
        "આસપાસના લોકો નિરાશ થયા હોય ત્યારે તેમનામાં નવો જુસ્સો અને હકારાત્મકતા લાવવી મને ગમે છે.",
        "જ્યારે કોઈ મારા સારા કામની કે સ્વભાવની નોંધ લઈ વખાણ કરે ત્યારે મને કામ કરવાનો વધુ ઉત્સાહ આવે છે.",
        "મારા મનમાં જે પણ વિચાર કે લાગણી આવે તે હું કોઈપણ ખચકાટ વગર સરળતાથી રજૂ કરી દઉં છું.",
        "નવી જગ્યાએ કે અજાણ્યા લોકો વચ્ચે પણ હું બહુ ઓછા સમયમાં સેટ થઈને મિત્રતા કરી લઉં છું.",
        "હું જ્યાં પણ હોઉં ત્યાં મારી હાજરી અને વાતચીતથી આસપાસનું વાતાવરણ જીવંત બની જાય છે."
    ],
    "A": [
        "મારી નજર હંમેશા કામ કેટલા સમયમાં પૂરું થાય છે અને તેનું શું અંતિમ પરિણામ આવે છે તેના પર જ હોય છે.",
        "કોઈપણ મુંઝવણવાળી પરિસ્થિતિમાં વધુ સમય બગાડ્યા વિના ઝડપી અને મક્કમ નિર્ણય લેવો એ મારો સ્વભાવ છે.",
        "જ્યારે કોઈ અઘરું કે પડકારજનક કામ સામે આવે ત્યારે પાછા પડવાને બદલે મને તે હાથમાં લેવાનો જોમ આવે છે.",
        "મને મારા કામમાં કોઈ વારંવાર દખલગીરી કરે કે નાની-નાની બાબતોમાં ટોક્યા કરે તે પસંદ નથી.",
        "હું ગોળ-ગોળ વાતો કરવાને બદલે જે હોય તે સીધી, સ્પષ્ટ અને મુદ્દાની વાત કરવાનું જ પસંદ કરું છું.",
        "કામમાં થતો બિનજરૂરી વિલંબ કે લોકોની ધીમી કામ કરવાની રીત મને ઝડપથી અકળાવી મૂકે છે.",
        "જ્યારે ટીમમાં કોઈ રસ્તો ન દેખાતો હોય ત્યારે આગળ આવીને નેતૃત્વ (Leadership) લેવાનું મને સહજ લાગે છે.",
        "એકવાર કોઈ કામ કરવાનું નક્કી કરું પછી તેમાં ગમે તેટલી અડચણો આવે તો પણ તેને પૂરું કરીને જ જંપું છું.",
        "મુશ્કેલીના સમયે ફરિયાદ કે ચર્ચા કર્યા કરવાને બદલે હું સીધો જ તેના વ્યવહારુ ઉકેલ પર કામ શરૂ કરું છું.",
        "કામની દોરી અને મહત્વના નિર્ણયો મારા પોતાના હાથમાં રહે તે મને કુદરતી રીતે જ વધુ યોગ્ય લાગે છે."
    ],
    "S": [
        "આસપાસ ગમે તેટલી દોડધામ કે તણાવ હોય તો પણ હું મોટાભાગે શાંત અને સમતોલ રહેવાનો પ્રયત્ન કરું છું.",
        "હું બીજા લોકોની વાત, તેમના વિચારો કે મુશ્કેલીઓ ખૂબ જ ધીરજપૂર્વક અને પૂરા ધ્યાનથી સાંભળું છું.",
        "મને કોઈપણ પ્રકારના વાદ-વિવાદ કે ઝઘડાથી દૂર રહીને બધાની સાથે હળીમળીને કામ કરવું ગમે છે.",
        "હું જે ટીમ, સંસ્થા કે વ્યક્તિ સાથે જોડાઈ જાઉં તેની સાથે લાંબા સમય સુધી વફાદાર અને સમર્પિત રહું છું.",
        "મને રોજિંદી અને સ્થિર કાર્યશૈલી ગમે છે; કામના નિયમો કે પદ્ધતિમાં અચાનક થતા ફેરફારો મને થોડા અસ્વસ્થ કરે છે.",
        "પ્રશંસા કે ક્રેડિટ મેળવવાની દોડધામ વગર, પડદા પાછળ રહીને નિષ્ઠાપૂર્વક કામ કરવું મને વધુ ગમે છે.",
        "કોઈને કામમાં મુશ્કેલી પડતી જોઈને મારી અંદર સહજપણે જ તેમને મદદ અને સહકાર આપવાની ઈચ્છા જાગે છે.",
        "એક જ પ્રકારનું કામ લાંબા સમય સુધી કોઈપણ પ્રકારના કંટાળા કે ઉતાવળ વગર હું ધીરજથી કરી શકું છું.",
        "મારા માટે કામ ઝડપથી પૂરું કરવા જેટલું જ મહત્વ સાથે કામ કરતા લોકો સાથેના સારા સંબંધો જાળવવાનું હોય છે.",
        "કોઈપણ કામમાં ઉતાવળથી દોડી જવાને બદલે હું સમજી-વિચારીને શાંતિથી અને સલામત રીતે આગળ વધવામાં માનું છું."
    ],
    "T": [
        "કામ ઝડપથી પૂરું કરવા કરતાં તે એકદમ ચોક્કસ, વ્યવસ્થિત અને કોઈપણ ભૂલ વગરનું થાય તે મારો મુખ્ય આગ્રહ હોય છે.",
        "હું કોઈપણ વાતને માત્ર લાગણી કે કોઈના કહેવાથી સ્વીકારવાને બદલે હકીકતો અને તર્ક (Logic) તપાસીને જ માનું છું.",
        "કોઈપણ નવું કામ શરૂ કરતા પહેલા તેનું યોગ્ય આયોજન (Planning) અને પદ્ધતિ નક્કી કરવી એ મારી કામ કરવાની રીત છે.",
        "સંસ્થા કે ટીમે નક્કી કરેલા નિયમો, સિદ્ધાંતો અને સિસ્ટમનું ચુસ્તપણે પાલન કરવું મને કુદરતી રીતે જ યોગ્ય લાગે છે.",
        "કોઈપણ મહત્વનો નિર્ણય લેતા પહેલા હું તેના તમામ પાસાઓ અને ફાયદા-નુકસાનનું ઊંડું વિશ્લેષણ કરું છું.",
        "કામમાં નાની-નાની બાબતો અને ઝીણવટો (Details) પર મારું ધ્યાન સહજ રીતે જ પહોંચી જાય છે, જે બીજાથી છૂટી જતું હોય છે.",
        "કામના સ્થળે કે મહત્વના નિર્ણયો લેતી વખતે હું મારી અંગત લાગણીઓને બાજુ પર રાખીને તટસ્થ રહેવાનું પસંદ કરું છું.",
        "પૂરતી માહિતી, અભ્યાસ કે તૈયારી વગર કોઈપણ અજાણ્યા કામમાં સીધું જ ઝંપલાવી દેવું મને ક્યારેય પસંદ નથી હોતું.",
        "મારી આસપાસની વસ્તુઓ, ફાઈલો અને કામ કરવાનું વાતાવરણ એકદમ ગોઠવાયેલું અને સુવ્યવસ્થિત હોય તે મને ગમે છે.",
        "હું મારા પોતાના કામ માટે અને બીજાના કામ માટે પણ ગુણવત્તા (Quality) ના ખૂબ જ ઊંચા માપદંડો રાખું છું."
    ]
}

def main():
    json_path = os.path.join("output", "firebase_dump_data.json")
    credentials_path = os.path.join("output", "admin-credentials.json")
    sqlite_path = os.path.join("output", "firebase_dump.sqlite")

    if not os.path.exists(json_path):
        print(f"Error: {json_path} does not exist. Run dump_firebase_to_sqlite.ts first.")
        sys.exit(1)

    if os.path.exists(sqlite_path):
        try:
            os.remove(sqlite_path)
        except PermissionError:
            print(f"Notice: {sqlite_path} is open in another process, overwriting tables...")
            conn = sqlite3.connect(sqlite_path)
            cursor = conn.cursor()
            cursor.execute("PRAGMA foreign_keys = OFF;")
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';")
            tables = cursor.fetchall()
            for t in tables:
                cursor.execute(f"DROP TABLE IF EXISTS `{t[0]}`;")
            conn.commit()
            conn.close()

    print(f"Loading {json_path}...")
    with open(json_path, "r", encoding="utf-8") as f:
        dump_data = json.load(f)

    admin_credentials = None
    if os.path.exists(credentials_path):
        with open(credentials_path, "r", encoding="utf-8") as f:
            admin_credentials = json.load(f)

    conn = sqlite3.connect(sqlite_path)
    cursor = conn.cursor()

    # Enable foreign keys in SQLite
    cursor.execute("PRAGMA foreign_keys = ON;")

    # 1. Zones Table
    cursor.execute("""
    CREATE TABLE zones (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        display_order INTEGER NOT NULL DEFAULT 0
    );
    """)

    # 2. Centers Table
    cursor.execute("""
    CREATE TABLE centers (
        id TEXT PRIMARY KEY,
        no INTEGER NOT NULL,
        name TEXT NOT NULL,
        zone_id TEXT NOT NULL,
        FOREIGN KEY (zone_id) REFERENCES zones(id) ON DELETE RESTRICT
    );
    """)

    # 3. Admin Users Table
    cursor.execute("""
    CREATE TABLE admin_users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('MASTER_ADMIN', 'ZONE_ADMIN', 'CENTER_ADMIN')),
        gender_scope TEXT NOT NULL DEFAULT 'All' CHECK (gender_scope IN ('Male', 'Female', 'All')),
        zone_id TEXT,
        center_id TEXT,
        is_active INTEGER NOT NULL CHECK (is_active IN (0, 1)),
        last_login_at TEXT,
        created_at TEXT,
        FOREIGN KEY (zone_id) REFERENCES zones(id) ON DELETE SET NULL,
        FOREIGN KEY (center_id) REFERENCES centers(id) ON DELETE SET NULL
    );
    """)

    # 4. Test Responses Table
    cursor.execute("""
    CREATE TABLE test_responses (
        id TEXT PRIMARY KEY,
        participant_name TEXT NOT NULL,
        age INTEGER NOT NULL,
        gender TEXT NOT NULL CHECK (gender IN ('Male', 'Female')),
        zone_id TEXT NOT NULL,
        center_id TEXT NOT NULL,
        score_m INTEGER NOT NULL,
        score_a INTEGER NOT NULL,
        score_s INTEGER NOT NULL,
        score_t INTEGER NOT NULL,
        primary_type TEXT NOT NULL CHECK (primary_type IN ('M', 'A', 'S', 'T')),
        secondary_type TEXT NOT NULL CHECK (secondary_type IN ('M', 'A', 'S', 'T')),
        sequence TEXT NOT NULL,
        submitted_at TEXT NOT NULL,
        valid TEXT,
        second_test_yes_count INTEGER,
        second_test_primary_type TEXT,
        second_test_is_valid INTEGER CHECK (second_test_is_valid IN (0, 1)),
        FOREIGN KEY (zone_id) REFERENCES zones(id) ON DELETE RESTRICT,
        FOREIGN KEY (center_id) REFERENCES centers(id) ON DELETE RESTRICT
    );
    """)

    # 5. Test Response Answers Table
    cursor.execute("""
    CREATE TABLE test_response_answers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        test_response_id TEXT NOT NULL,
        block_number INTEGER NOT NULL CHECK (block_number BETWEEN 1 AND 10),
        most TEXT NOT NULL CHECK (most IN ('A', 'B', 'C', 'D')),
        least TEXT NOT NULL CHECK (least IN ('A', 'B', 'C', 'D')),
        FOREIGN KEY (test_response_id) REFERENCES test_responses(id) ON DELETE CASCADE
    );
    """)

    # 6. Test Response Second Answers Table
    cursor.execute("""
    CREATE TABLE test_response_second_answers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        test_response_id TEXT NOT NULL,
        question_index INTEGER NOT NULL CHECK (question_index BETWEEN 0 AND 9),
        answer_value INTEGER NOT NULL CHECK (answer_value IN (0, 1)),
        FOREIGN KEY (test_response_id) REFERENCES test_responses(id) ON DELETE CASCADE
    );
    """)

    # 7. Second Test Statements Reference Table
    cursor.execute("""
    CREATE TABLE second_test_statements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mast_type TEXT NOT NULL CHECK (mast_type IN ('M', 'A', 'S', 'T')),
        question_index INTEGER NOT NULL CHECK (question_index BETWEEN 0 AND 9),
        statement_text TEXT NOT NULL,
        UNIQUE (mast_type, question_index)
    );
    """)

    # 8. Metadata Table
    cursor.execute("""
    CREATE TABLE metadata (
        exported_at TEXT,
        total_zones INTEGER,
        total_centers INTEGER,
        total_admin_users INTEGER,
        total_test_responses INTEGER,
        total_answers INTEGER,
        total_second_answers INTEGER
    );
    """)

    # Seed Second Test Statements
    for m_type, statements in SECOND_TEST_STATEMENTS.items():
        for q_idx, stmt in enumerate(statements):
            cursor.execute("""
            INSERT INTO second_test_statements (mast_type, question_index, statement_text)
            VALUES (?, ?, ?);
            """, (m_type, q_idx, stmt))

    documents = dump_data.get("documents", [])
    
    zones_list = []
    centers_list = []
    admin_users_list = []
    test_responses_list = []
    test_answers_list = []
    test_second_answers_list = []

    # Map zones & centers
    zone_order = 1
    for doc in documents:
        col = doc["collection"]
        doc_id = doc["id"]
        data = doc.get("data") or {}

        if col == "zones":
            zones_list.append((doc_id, data.get("name", ""), zone_order))
            zone_order += 1

        elif col == "centers":
            centers_list.append((
                doc_id,
                int(data.get("no", 0)),
                data.get("name", ""),
                data.get("zoneId", "")
            ))

        elif col == "testResponses":
            second_answers = data.get("secondTestAnswers")
            yes_count = None
            second_is_valid = None
            second_primary_type = data.get("primaryType")

            if isinstance(second_answers, list):
                yes_count = sum(1 for val in second_answers if val)
                second_is_valid = 1 if yes_count >= 6 else 0

            test_responses_list.append((
                doc_id,
                data.get("participantName", ""),
                int(data.get("age", 0)),
                data.get("gender", "Male"),
                data.get("zoneId", ""),
                data.get("centerId", ""),
                int(data.get("scoreM", 0)),
                int(data.get("scoreA", 0)),
                int(data.get("scoreS", 0)),
                int(data.get("scoreT", 0)),
                data.get("primaryType", ""),
                data.get("secondaryType", ""),
                data.get("sequence", ""),
                data.get("submittedAt", ""),
                data.get("valid") or None,
                yes_count,
                second_primary_type,
                second_is_valid
            ))

            # Process block answers array
            answers = data.get("answers") or []
            for ans in answers:
                if isinstance(ans, dict):
                    test_answers_list.append((
                        doc_id,
                        int(ans.get("blockNumber", 0)),
                        str(ans.get("most", "")),
                        str(ans.get("least", ""))
                    ))

            # Process second test answers boolean array
            if isinstance(second_answers, list):
                for idx, val in enumerate(second_answers):
                    test_second_answers_list.append((
                        doc_id,
                        idx,
                        1 if val else 0
                    ))

    # Process Admin Users from generated credentials file (includes Male & Female split + Main Master)
    if admin_credentials:
        all_creds = []
        if "mainMasterAdmin" in admin_credentials:
            all_creds.append(admin_credentials["mainMasterAdmin"])
        if "maleMasterAdmin" in admin_credentials:
            all_creds.append(admin_credentials["maleMasterAdmin"])
        if "femaleMasterAdmin" in admin_credentials:
            all_creds.append(admin_credentials["femaleMasterAdmin"])

        all_creds.extend(admin_credentials.get("zoneAdmins", []))
        all_creds.extend(admin_credentials.get("centerAdmins", []))

        print(f"Hashing passwords for {len(all_creds)} admin users...")
        # Use cost 4 for fast seeding
        salt = bcrypt.gensalt(4)
        hash_cache = {}

        for item in all_creds:
            pw = item.get("password", "")
            if pw not in hash_cache:
                hash_cache[pw] = bcrypt.hashpw(pw.encode('utf-8'), salt).decode('utf-8')
            pw_hash = hash_cache[pw]

            admin_users_list.append((
                item["email"].lower(),
                item["name"],
                item["email"].lower(),
                pw_hash,
                item["role"],
                item.get("genderScope", "All"),
                item.get("zoneId") or None,
                item.get("centerId") or None,
                1, # is_active
                None, # last_login_at
                dump_data.get("exportedAt") # created_at
            ))

    # Insert into Zones
    cursor.executemany("INSERT INTO zones (id, name, display_order) VALUES (?, ?, ?);", zones_list)

    # Insert into Centers
    cursor.executemany("""
    INSERT INTO centers (id, no, name, zone_id)
    VALUES (?, ?, ?, ?);
    """, centers_list)

    # Insert into Admin Users
    cursor.executemany("""
    INSERT INTO admin_users (id, name, email, password_hash, role, gender_scope, zone_id, center_id, is_active, last_login_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, admin_users_list)

    # Insert into Test Responses
    cursor.executemany("""
    INSERT INTO test_responses (id, participant_name, age, gender, zone_id, center_id, score_m, score_a, score_s, score_t, primary_type, secondary_type, sequence, submitted_at, valid, second_test_yes_count, second_test_primary_type, second_test_is_valid)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, test_responses_list)

    # Insert into Test Response Answers
    cursor.executemany("""
    INSERT INTO test_response_answers (test_response_id, block_number, most, least)
    VALUES (?, ?, ?, ?);
    """, test_answers_list)

    # Insert into Test Response Second Answers
    cursor.executemany("""
    INSERT INTO test_response_second_answers (test_response_id, question_index, answer_value)
    VALUES (?, ?, ?);
    """, test_second_answers_list)

    # Insert metadata
    cursor.execute("""
    INSERT INTO metadata VALUES (?, ?, ?, ?, ?, ?, ?);
    """, (
        dump_data.get("exportedAt"),
        len(zones_list),
        len(centers_list),
        len(admin_users_list),
        len(test_responses_list),
        len(test_answers_list),
        len(test_second_answers_list)
    ))

    # Create Relational Indexes for high query performance
    cursor.execute("CREATE INDEX idx_centers_zone ON centers(zone_id);")
    cursor.execute("CREATE INDEX idx_admin_zone ON admin_users(zone_id);")
    cursor.execute("CREATE INDEX idx_admin_center ON admin_users(center_id);")
    cursor.execute("CREATE INDEX idx_admin_gender ON admin_users(gender_scope);")
    cursor.execute("CREATE INDEX idx_test_zone ON test_responses(zone_id);")
    cursor.execute("CREATE INDEX idx_test_center ON test_responses(center_id);")
    cursor.execute("CREATE INDEX idx_test_gender ON test_responses(gender);")
    cursor.execute("CREATE INDEX idx_test_answers_response ON test_response_answers(test_response_id);")
    cursor.execute("CREATE INDEX idx_test_second_answers_response ON test_response_second_answers(test_response_id);")

    conn.commit()
    conn.close()

    print(f"Successfully generated clean, relational SQLite database: {sqlite_path}")
    print(f"File size: {os.path.getsize(sqlite_path)} bytes.")
    print("Summary:")
    print(f"  - zones: {len(zones_list)} rows")
    print(f"  - centers: {len(centers_list)} rows")
    print(f"  - admin_users: {len(admin_users_list)} rows (with Male/Female/Main Master scope split)")
    print(f"  - test_responses: {len(test_responses_list)} rows")
    print(f"  - test_response_answers: {len(test_answers_list)} rows")
    print(f"  - test_response_second_answers: {len(test_second_answers_list)} rows")
    print("  - second_test_statements: 40 rows")

if __name__ == "__main__":
    main()
