LOGIN VERSION

1. Run schema.sql in MySQL Workbench. It creates the users table too.
2. In app.py change YOUR_MYSQL_PASSWORD.
3. In setup_users.py change YOUR_MYSQL_PASSWORD.
4. Install:
   pip install -r requirements.txt
5. Create the two accounts ONCE:
   python setup_users.py
6. Start server:
   python app.py
7. Open:
   http://127.0.0.1:5000

Roles:
OWNER:
- Can use the order system.
- Can see phone numbers and addresses.
- Can search customer records.
- Can update customer records.
- Can delete customer records.

STAFF:
- Can use the order system.
- Cannot search customer database.
- Cannot see customer phone/address details.
- Backend also blocks owner-only customer API endpoints.

Security:
- Passwords are stored as hashes, not plain text.
- Role checks happen on the server, not only in the browser.
- Phone numbers are VARCHAR(10), with validation.
- Change app.secret_key before deploying publicly.
