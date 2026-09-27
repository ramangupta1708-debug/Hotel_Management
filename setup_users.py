from werkzeug.security import generate_password_hash
import mysql.connector

DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "1234",
    "database": "order_management"
}

owner_username = input("Owner username [owner]: ").strip() or "owner"
owner_password = input("Owner password: ").strip()
staff_username = input("Staff username [staff]: ").strip() or "staff"
staff_password = input("Staff password: ").strip()

if not owner_password or not staff_password:
    raise SystemExit("Both passwords are required.")

conn = mysql.connector.connect(**DB_CONFIG)
cur = conn.cursor()

cur.execute("SELECT COUNT(*) FROM users")
if cur.fetchone()[0] > 0:
    raise SystemExit("Users already exist. Do not run setup again.")

cur.execute(
    "INSERT INTO users (username,password_hash,role) VALUES (%s,%s,'owner')",
    (owner_username, generate_password_hash(owner_password))
)
cur.execute(
    "INSERT INTO users (username,password_hash,role) VALUES (%s,%s,'staff')",
    (staff_username, generate_password_hash(staff_password))
)

conn.commit()
cur.close()
conn.close()

print("Owner and staff accounts created successfully.")
