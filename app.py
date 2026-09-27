from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from werkzeug.security import generate_password_hash, check_password_hash
import mysql.connector
from mysql.connector import Error
import re
import os

app = Flask(__name__)
app.secret_key = os.environ.get("FLASK_SECRET_KEY", "CHANGE_THIS_TO_A_LONG_RANDOM_SECRET")

DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "1234",
    "database": "order_management"
}

def get_db():
    return mysql.connector.connect(**DB_CONFIG)

def valid_phone(phone):
    return bool(re.fullmatch(r"\d{10}", phone or ""))

def logged_in():
    return "user_id" in session

def is_owner():
    return session.get("role") == "owner"

def require_login():
    if not logged_in():
        return jsonify({"success": False, "message": "Login required."}), 401
    return None

@app.route("/")
def index():
    if not logged_in():
        return redirect(url_for("login"))
    return render_template("index.html", role=session["role"], username=session["username"])

@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "GET":
        if logged_in():
            return redirect(url_for("index"))
        return render_template("login.html")

    data = request.get_json(silent=True) or request.form
    username = str(data.get("username", "")).strip()
    password = str(data.get("password", ""))

    if not username or not password:
        return jsonify({"success": False, "message": "Username and password are required."}), 400

    conn = get_db()
    cur = conn.cursor(dictionary=True)
    try:
        cur.execute(
            "SELECT user_id, username, password_hash, role FROM users WHERE username=%s",
            (username,)
        )
        user = cur.fetchone()

        if not user or not check_password_hash(user["password_hash"], password):
            return jsonify({"success": False, "message": "Invalid username or password."}), 401

        session.clear()
        session["user_id"] = user["user_id"]
        session["username"] = user["username"]
        session["role"] = user["role"]

        return jsonify({
            "success": True,
            "role": user["role"],
            "redirect": url_for("index")
        })
    finally:
        cur.close()
        conn.close()

@app.route("/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"success": True, "redirect": url_for("login")})

@app.route("/api/me")
def me():
    if not logged_in():
        return jsonify({"success": False}), 401
    return jsonify({
        "success": True,
        "username": session["username"],
        "role": session["role"]
    })

@app.route("/api/customers/<phone>", methods=["GET"])
def get_customer(phone):
    auth = require_login()
    if auth:
        return auth

    if not is_owner():
        return jsonify({
            "success": False,
            "message": "Staff members cannot view customer phone numbers or addresses."
        }), 403

    if not valid_phone(phone):
        return jsonify({"success": False, "message": "Phone number must contain exactly 10 digits."}), 400

    conn = get_db()
    cur = conn.cursor(dictionary=True)
    try:
        cur.execute(
            "SELECT customer_id, name, phone, address, created_at, updated_at "
            "FROM customers WHERE phone=%s", (phone,)
        )
        customer = cur.fetchone()
        if not customer:
            return jsonify({"success": False, "message": "Customer not found."}), 404
        return jsonify({"success": True, "customer": customer})
    finally:
        cur.close()
        conn.close()

@app.route("/api/customers/<phone>", methods=["DELETE"])
def delete_customer(phone):
    auth = require_login()
    if auth:
        return auth

    if not is_owner():
        return jsonify({"success": False, "message": "Only the owner can delete customer records."}), 403

    if not valid_phone(phone):
        return jsonify({"success": False, "message": "Invalid phone number."}), 400

    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute("DELETE FROM customers WHERE phone=%s", (phone,))
        conn.commit()
        if cur.rowcount == 0:
            return jsonify({"success": False, "message": "Customer not found."}), 404
        return jsonify({"success": True, "message": "Customer deleted successfully."})
    finally:
        cur.close()
        conn.close()

@app.route("/api/customers/<phone>", methods=["PUT"])
def update_customer(phone):
    auth = require_login()
    if auth:
        return auth

    if not is_owner():
        return jsonify({"success": False, "message": "Only the owner can update customer details."}), 403

    data = request.get_json(silent=True) or {}
    name = str(data.get("name", "")).strip()
    address = str(data.get("address", "")).strip()

    if not valid_phone(phone):
        return jsonify({"success": False, "message": "Invalid phone number."}), 400
    if not name:
        return jsonify({"success": False, "message": "Name is required."}), 400

    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute(
            "UPDATE customers SET name=%s, address=%s WHERE phone=%s",
            (name, address, phone)
        )
        conn.commit()
        if cur.rowcount == 0:
            return jsonify({"success": False, "message": "Customer not found."}), 404
        return jsonify({"success": True, "message": "Customer updated successfully."})
    finally:
        cur.close()
        conn.close()
@app.route("/api/orders-by-date/<date>", methods=["GET"])
def orders_by_date(date):
    auth = require_login()
    if auth:
        return auth

    # Only owner can see customer phone/address
    if not is_owner():
        return jsonify({
            "success": False,
            "message": "Only the owner can view purchase history."
        }), 403

    # Check date format
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", date):
        return jsonify({
            "success": False,
            "message": "Invalid date format."
        }), 400

    conn = get_db()
    cur = conn.cursor(dictionary=True)

    try:
        # Get all orders for selected date
        cur.execute("""
            SELECT
                o.order_id,
                o.order_type,
                o.table_number,
                o.status,
                o.total_amount,
                o.created_at,
                c.customer_id,
                c.name,
                c.phone,
                c.address
            FROM orders o
            LEFT JOIN customers c
                ON o.customer_id = c.customer_id
            WHERE DATE(o.created_at) = %s
            ORDER BY o.created_at DESC
        """, (date,))

        orders = cur.fetchall()

        # Get items for every order
        for order in orders:
            cur.execute("""
                SELECT
                    item_name,
                    quantity,
                    price,
                    subtotal
                FROM order_items
                WHERE order_id = %s
                ORDER BY item_id
            """, (order["order_id"],))

            order["items"] = cur.fetchall()

        return jsonify({
            "success": True,
            "date": date,
            "orders": orders,
            "count": len(orders)
        })

    except Error as e:
        return jsonify({
            "success": False,
            "message": "Database error: " + str(e)
        }), 500

    finally:
        cur.close()
        conn.close()
@app.route("/api/orders", methods=["POST"])
def create_order():
    auth = require_login()
    if auth:
        return auth

    data = request.get_json(silent=True) or {}
    order_type = data.get("order_type")
    name = str(data.get("name", "")).strip()
    phone = str(data.get("phone", "")).strip()
    address = str(data.get("address", "")).strip()
    table_number = data.get("table_number")
    items = data.get("items", [])

    if order_type not in ("Dine-In", "Delivery", "Packing"):
        return jsonify({"success": False, "message": "Select a valid order type."}), 400
    if not name:
        return jsonify({"success": False, "message": "Customer name is required."}), 400
    if not valid_phone(phone):
        return jsonify({"success": False, "message": "Phone number must contain exactly 10 digits."}), 400
    if order_type == "Delivery" and not address:
        return jsonify({"success": False, "message": "Address is required for delivery."}), 400
    if order_type == "Dine-In":
        try:
            table_number = int(table_number)
            if table_number <= 0:
                raise ValueError
        except (TypeError, ValueError):
            return jsonify({"success": False, "message": "A valid table number is required for dine-in."}), 400
    else:
        table_number = None
    if not isinstance(items, list) or not items:
        return jsonify({"success": False, "message": "Add at least one item."}), 400

    cleaned_items, total = [], 0.0
    try:
        for item in items:
            item_name = str(item.get("item_name", "")).strip()
            quantity = int(item.get("quantity", 0))
            price = float(item.get("price", 0))
            if not item_name:
                raise ValueError("Item name is required.")
            if quantity <= 0:
                raise ValueError("Quantity must be greater than 0.")
            if price < 0:
                raise ValueError("Price cannot be negative.")
            subtotal = round(quantity * price, 2)
            total += subtotal
            cleaned_items.append((item_name, quantity, price, subtotal))
    except (ValueError, TypeError) as e:
        return jsonify({"success": False, "message": str(e)}), 400

    conn = get_db()
    cur = conn.cursor()
    try:
        conn.start_transaction()
        cur.execute("SELECT customer_id FROM customers WHERE phone=%s FOR UPDATE", (phone,))
        row = cur.fetchone()

        if row:
            customer_id = row[0]
            cur.execute(
                "UPDATE customers SET name=%s, address=%s WHERE customer_id=%s",
                (name, address, customer_id)
            )
        else:
            cur.execute(
                "INSERT INTO customers (name, phone, address) VALUES (%s,%s,%s)",
                (name, phone, address)
            )
            customer_id = cur.lastrowid

        cur.execute(
            "INSERT INTO orders (customer_id, order_type, table_number, status, total_amount) "
            "VALUES (%s,%s,%s,'Completed',%s)",
            (customer_id, order_type, table_number, round(total, 2))
        )
        order_id = cur.lastrowid

        for item_name, quantity, price, subtotal in cleaned_items:
            cur.execute(
                "INSERT INTO order_items (order_id,item_name,quantity,price,subtotal) "
                "VALUES (%s,%s,%s,%s,%s)",
                (order_id, item_name, quantity, price, subtotal)
            )

        conn.commit()
        return jsonify({
            "success": True,
            "message": "Order completed successfully.",
            "order_id": order_id,
            "total": round(total, 2)
        })
    except Error as e:
        conn.rollback()
        return jsonify({"success": False, "message": "Database error: " + str(e)}), 500
    finally:
        cur.close()
        conn.close()

@app.route("/api/setup-users", methods=["POST"])
def setup_users():
    # One-time setup endpoint. Remove/disable this route after creating the two accounts.
    data = request.get_json(silent=True) or {}
    setup_key = str(data.get("setup_key", ""))
    if setup_key != os.environ.get("USER_SETUP_KEY", "FIRST_SETUP_ONLY_CHANGE_ME"):
        return jsonify({"success": False, "message": "Invalid setup key."}), 403

    owner_username = str(data.get("owner_username", "owner")).strip()
    owner_password = str(data.get("owner_password", "")).strip()
    staff_username = str(data.get("staff_username", "staff")).strip()
    staff_password = str(data.get("staff_password", "")).strip()

    if not owner_password or not staff_password:
        return jsonify({"success": False, "message": "Both passwords are required."}), 400
    if owner_username == staff_username:
        return jsonify({"success": False, "message": "Owner and staff usernames must be different."}), 400

    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute("SELECT COUNT(*) FROM users")
        count = cur.fetchone()[0]
        if count > 0:
            return jsonify({"success": False, "message": "Users already exist. Setup is disabled."}), 409

        cur.execute(
            "INSERT INTO users (username,password_hash,role) VALUES (%s,%s,'owner')",
            (owner_username, generate_password_hash(owner_password))
        )
        cur.execute(
            "INSERT INTO users (username,password_hash,role) VALUES (%s,%s,'staff')",
            (staff_username, generate_password_hash(staff_password))
        )
        conn.commit()
        return jsonify({"success": True, "message": "Owner and staff accounts created."})
    except Error as e:
        conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    app.run(debug=True)
