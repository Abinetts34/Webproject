from flask import Flask, request, jsonify, g
from flask_cors import CORS
import mysql.connector
from mysql.connector import Error
import datetime as dt

app = Flask(__name__)
CORS(app)

# =========================
# DATABASE CONNECTION (per request)
# =========================
def get_db():
    if 'db' not in g:
        g.db = mysql.connector.connect(
            host="localhost",
            user="root",
            password="Ab1172",
            database="cafe_system",
            ssl_disabled=True,
            use_pure=True,
            autocommit=False
        )
    return g.db

def get_cursor():
    return get_db().cursor(dictionary=True, buffered=True)

@app.teardown_appcontext
def close_db(error):
    db = g.pop('db', None)
    if db is not None:
        db.close()

def execute_query(sql, params=None, fetch_one=False, fetch_all=False, commit=False):
    cursor = get_cursor()
    try:
        if params:
            cursor.execute(sql, params)
        else:
            cursor.execute(sql)
        if commit:
            get_db().commit()
        if fetch_one:
            result = cursor.fetchone()
            cursor.close()
            return result
        if fetch_all:
            result = cursor.fetchall()
            cursor.close()
            return result
        cursor.close()
        return None
    except Exception as e:
        get_db().rollback()
        cursor.close()
        raise e

# =========================
# Helper
# =========================
def convert_time_to_str(obj):
    if isinstance(obj, dt.timedelta):
        total_seconds = int(obj.total_seconds())
        hours = total_seconds // 3600
        minutes = (total_seconds % 3600) // 60
        seconds = total_seconds % 60
        return f"{hours:02d}:{minutes:02d}:{seconds:02d}"
    elif isinstance(obj, dt.time):
        return obj.strftime("%H:%M:%S")
    elif isinstance(obj, dict):
        return {k: convert_time_to_str(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_time_to_str(item) for item in obj]
    else:
        return obj

# =========================
# STUDENT SIGNUP
# =========================
@app.route("/register", methods=["POST"])
def register():
    data = request.json
    required = ["name", "email", "phone", "password", "confirm_password", "security_question", "security_answer"]
    for field in required:
        if not data.get(field):
            return jsonify({"message": f"Please fill {field}"}), 400
    if data["password"] != data["confirm_password"]:
        return jsonify({"message": "Passwords do not match"}), 400

    existing = execute_query("SELECT phone FROM student WHERE phone=%s", (data["phone"],), fetch_one=True)
    if existing:
        return jsonify({"message": "Account with this phone number already found"}), 400

    sql = """
    INSERT INTO student(full_name, email, phone, password, registration_date, status, security_question, security_answer)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    """
    values = (
        data["name"],
        data["email"],
        data["phone"],
        data["password"],
        dt.date.today(),
        "inactive",
        data["security_question"],
        data["security_answer"]
    )
    execute_query(sql, values, commit=True)
    cursor = get_cursor()
    cursor.execute("SELECT LAST_INSERT_ID()")
    student_id = cursor.fetchone()["LAST_INSERT_ID()"]
    return jsonify({"message": "Account created successfully", "student_id": student_id})

# =========================
# STUDENT LOGIN
# =========================
@app.route("/login", methods=["POST"])
def login():
    data = request.json
    if not data.get("id") or not data.get("password"):
        return jsonify({"message": "Enter id and password"}), 400
    user = execute_query("SELECT * FROM student WHERE student_id=%s AND password=%s", 
                         (data["id"], data["password"]), fetch_one=True)
    if user:
        return jsonify({"message": "Login successful", "user": user})
    else:
        return jsonify({"message": "ID or password is wrong"}), 401

# =========================
# FORGOT PASSWORD (STUDENT)
# =========================
@app.route("/forgot_check_id", methods=["POST"])
def forgot_check_id():
    data = request.json
    student_id = data.get("id")
    if not student_id:
        return jsonify({"message": "Enter ID first"}), 400
    user = execute_query("SELECT security_question FROM student WHERE student_id=%s", (student_id,), fetch_one=True)
    if not user:
        return jsonify({"message": "ID not found"}), 404
    return jsonify({"question": user["security_question"]})

@app.route("/verify_security", methods=["POST"])
def verify_security():
    data = request.json
    student_id = data.get("id")
    answer = data.get("answer")
    user = execute_query("SELECT security_answer FROM student WHERE student_id=%s", (student_id,), fetch_one=True)
    if not user or user["security_answer"].lower() != answer.lower():
        return jsonify({"valid": False, "message": "Wrong answer try again or contact manager"}), 401
    return jsonify({"valid": True})

@app.route("/reset_password_with_question", methods=["POST"])
def reset_password_with_question():
    data = request.json
    student_id = data.get("id")
    new_password = data.get("new_password")
    execute_query("UPDATE student SET password=%s WHERE student_id=%s", (new_password, student_id), commit=True)
    return jsonify({"message": "Password updated successfully"})

# =========================
# MANAGER CREATE & LOGIN
# =========================
@app.route("/manager/create", methods=["POST"])
def create_manager():
    data = request.json
    required = ["full_name", "username", "password", "phone", "security_question", "security_answer", "admin_password"]
    for field in required:
        if not data.get(field):
            return jsonify({"message": f"Please fill {field}"}), 400
    if data["admin_password"] != "admin1234":
        return jsonify({"message": "Invalid administrator password"}), 403

    existing = execute_query("SELECT username FROM manager WHERE username=%s", (data["username"],), fetch_one=True)
    if existing:
        return jsonify({"message": "Username already taken"}), 400

    sql = """
    INSERT INTO manager(full_name, username, phone, password, security_question, security_answer)
    VALUES (%s, %s, %s, %s, %s, %s)
    """
    values = (
        data["full_name"],
        data["username"],
        data["password"],
        data["phone"],
        data["security_question"],
        data["security_answer"]
    )
    execute_query(sql, values, commit=True)
    return jsonify({"message": "Manager created successfully"})

@app.route("/manager/login", methods=["POST"])
def manager_login():
    data = request.json
    if not data.get("username") or not data.get("password"):
        return jsonify({"message": "Enter username and password"}), 400
    manager = execute_query("SELECT * FROM manager WHERE username=%s AND password=%s", 
                            (data["username"], data["password"]), fetch_one=True)
    if manager:
        return jsonify({"message": "Manager login success", "manager": manager})
    return jsonify({"message": "Invalid manager login"}), 401

@app.route("/manager/forgot_check_id", methods=["POST"])
def manager_forgot_check_id():
    data = request.json
    uid = data.get("id")
    if not uid:
        return jsonify({"message": "Enter username first"}), 400
    mgr = execute_query("SELECT security_question FROM manager WHERE username=%s", (uid,), fetch_one=True)
    if not mgr:
        return jsonify({"message": "Account not found"}), 404
    return jsonify({"question": mgr["security_question"]})

@app.route("/manager/verify_security", methods=["POST"])
def manager_verify_security():
    data = request.json
    username = data.get("username")
    answer = data.get("answer")
    mgr = execute_query("SELECT security_answer FROM manager WHERE username=%s", (username,), fetch_one=True)
    if not mgr or mgr["security_answer"].lower() != answer.lower():
        return jsonify({"valid": False, "message": "Wrong answer try again or contact administrator"}), 401
    return jsonify({"valid": True})

@app.route("/manager/reset_password", methods=["POST"])
def manager_reset_password():
    data = request.json
    username = data.get("username")
    new_password = data.get("new_password")
    execute_query("UPDATE manager SET password=%s WHERE username=%s", (new_password, username), commit=True)
    return jsonify({"message": "Password updated"})

# ========== STUDENT DASHBOARD ENDPOINTS ==========
@app.route("/student/info/<int:student_id>", methods=["GET"])
def student_info(student_id):
    student = execute_query("SELECT student_id, full_name, email, phone, registration_date, status FROM student WHERE student_id=%s", (student_id,), fetch_one=True)
    if not student:
        return jsonify({"error": "Student not found"}), 404
    contract = execute_query("SELECT status FROM contract WHERE student_id=%s ORDER BY contract_id DESC LIMIT 1", (student_id,), fetch_one=True)
    student["contract_status"] = contract["status"] if contract else "no contract"
    return jsonify(student)

@app.route("/student/balance/<int:student_id>", methods=["GET"])
def student_balance(student_id):
    bal = execute_query("""
        SELECT sb.meals_left, sb.days_left
        FROM student_balance sb
        JOIN contract c ON sb.contract_id = c.contract_id
        WHERE sb.student_id=%s AND c.status='active'
        ORDER BY sb.balance_id DESC LIMIT 1
    """, (student_id,), fetch_one=True)
    if bal:
        return jsonify({"meals_left": bal["meals_left"], "days_left": bal["days_left"]})
    return jsonify({"meals_left": 0, "days_left": 0})

@app.route("/student/active_contract/<int:student_id>", methods=["GET"])
def active_contract(student_id):
    contract = execute_query("SELECT contract_id FROM contract WHERE student_id=%s AND status='active'", (student_id,), fetch_one=True)
    return jsonify({"has_active": contract is not None, "contract_id": contract["contract_id"] if contract else None})

@app.route("/student/has_pending_request/<int:student_id>", methods=["GET"])
def has_pending_request(student_id):
    pending = execute_query("SELECT contract_id FROM contract WHERE student_id=%s AND status='pending'", (student_id,), fetch_one=True)
    return jsonify({"has_pending": pending is not None, "contract_id": pending["contract_id"] if pending else None})

@app.route("/student/order", methods=["POST"])
def place_order():
    data = request.json
    student_id = data["student_id"]
    contract_id = data["contract_id"]
    meal_type = data["meal_type"]
    order_detail = data["order_detail"]
    special_request = data.get("special_request", "")
    quantity = int(data["quantity"])

    plan = execute_query("""
        SELECT mp.include_breakfast, mp.include_lunch, mp.include_dinner, sb.meals_left
        FROM contract c
        JOIN meal_plan mp ON c.mealplanid = mp.mealplanid
        JOIN student_balance sb ON sb.contract_id = c.contract_id
        WHERE c.contract_id=%s AND c.student_id=%s AND c.status='active'
    """, (contract_id, student_id), fetch_one=True)
    if not plan:
        return jsonify({"error": "No active contract"}), 400
    meals_left = plan["meals_left"]
    if quantity > meals_left:
        return jsonify({"error": f"You have {meals_left} meals left"}), 400

    allowed = False
    if meal_type == "breakfast" and plan["include_breakfast"]:
        allowed = True
    elif meal_type == "lunch" and plan["include_lunch"]:
        allowed = True
    elif meal_type == "dinner" and plan["include_dinner"]:
        allowed = True
    if not allowed:
        return jsonify({"error": "Your meal plan does not include this meal type"}), 400

    mealtype = execute_query("SELECT mealtype_id FROM meal_type WHERE meal_name=%s", (meal_type,), fetch_one=True)
    if not mealtype:
        execute_query("INSERT INTO meal_type (meal_name) VALUES (%s)", (meal_type,), commit=True)
        cursor = get_cursor()
        cursor.execute("SELECT LAST_INSERT_ID()")
        mealtype_id = cursor.fetchone()["LAST_INSERT_ID()"]
    else:
        mealtype_id = mealtype["mealtype_id"]

    execute_query("""
        INSERT INTO orders (mealdate, order_time, status, contract_id, student_id, mealtype_id)
        VALUES (%s, %s, %s, %s, %s, %s)
    """, (dt.date.today(), dt.datetime.now().time(), 'pending', contract_id, student_id, mealtype_id), commit=True)
    cursor = get_cursor()
    cursor.execute("SELECT LAST_INSERT_ID()")
    order_id = cursor.fetchone()["LAST_INSERT_ID()"]

    execute_query("""
        INSERT INTO order_detail (item_name, quantity, special_request, order_id)
        VALUES (%s, %s, %s, %s)
    """, (order_detail, quantity, special_request, order_id), commit=True)
    return jsonify({"message": "Order submitted successfully", "order_id": order_id})

@app.route("/student/cancel_order/<int:order_id>", methods=["POST"])
def cancel_order(order_id):
    execute_query("UPDATE orders SET status='cancelled' WHERE order_id=%s AND status='pending'", (order_id,), commit=True)
    return jsonify({"message": "Order cancelled"})

@app.route("/student/orders/<int:student_id>", methods=["GET"])
def get_student_orders(student_id):
    orders = execute_query("""
        SELECT o.order_id, o.status, mt.meal_name, od.item_name, od.quantity, od.special_request
        FROM orders o
        JOIN meal_type mt ON o.mealtype_id = mt.mealtype_id
        JOIN order_detail od ON o.order_id = od.order_id
        WHERE o.student_id=%s ORDER BY o.order_id DESC
    """, (student_id,), fetch_all=True)
    return jsonify(orders)

@app.route("/student/buy_contract", methods=["POST"])
def buy_contract():
    data = request.json
    student_id = data["student_id"]
    contract_type_name = data["contract_type"]
    meal_plan_type = data["meal_plan"]
    payment_method = data["payment_method"]

    pending = execute_query("SELECT contract_id FROM contract WHERE student_id=%s AND status='pending'", (student_id,), fetch_one=True)
    if pending:
        return jsonify({"error": "You already have a pending contract request. Cancel it first."}), 400

    duration_map = {"2 weeks": 14, "monthly": 30, "semester": 120}
    duration = duration_map.get(contract_type_name, 30)
    ct = execute_query("SELECT contract_type_id FROM contract_type WHERE name=%s", (contract_type_name,), fetch_one=True)
    if not ct:
        execute_query("INSERT INTO contract_type (name, duration_days) VALUES (%s, %s)", (contract_type_name, duration), commit=True)
        cursor = get_cursor()
        cursor.execute("SELECT LAST_INSERT_ID()")
        contract_type_id = cursor.fetchone()["LAST_INSERT_ID()"]
    else:
        contract_type_id = ct["contract_type_id"]

    if meal_plan_type == "full contract":
        include_breakfast = True
        include_lunch = True
        include_dinner = True
        meals_per_day = 3
    else:
        include_breakfast = False
        include_lunch = True
        include_dinner = True
        meals_per_day = 2
    execute_query("""
        INSERT INTO meal_plan (planname, include_breakfast, include_lunch, include_dinner, meals_per_day)
        VALUES (%s, %s, %s, %s, %s)
    """, (meal_plan_type, include_breakfast, include_lunch, include_dinner, meals_per_day), commit=True)
    cursor = get_cursor()
    cursor.execute("SELECT LAST_INSERT_ID()")
    mealplanid = cursor.fetchone()["LAST_INSERT_ID()"]

    start_date = dt.date.today()
    end_date = start_date + dt.timedelta(days=duration)
    total_cost = duration * 10
    execute_query("""
        INSERT INTO contract (start_date, end_date, total_cost, status, signed_date, student_id, contract_type_id, mealplanid)
        VALUES (%s, %s, %s, 'pending', %s, %s, %s, %s)
    """, (start_date, end_date, total_cost, dt.date.today(), student_id, contract_type_id, mealplanid), commit=True)
    cursor = get_cursor()
    cursor.execute("SELECT LAST_INSERT_ID()")
    contract_id = cursor.fetchone()["LAST_INSERT_ID()"]

    execute_query("""
        INSERT INTO payment (payment_method, payment_date, amount, contract_id, student_id)
        VALUES (%s, %s, %s, %s, %s)
    """, (payment_method, dt.date.today(), total_cost, contract_id, student_id), commit=True)
    return jsonify({"message": "Contract request sent to manager", "contract_id": contract_id})

@app.route("/student/cancel_pending_contract/<int:contract_id>", methods=["DELETE"])
def cancel_pending_contract(contract_id):
    contract = execute_query("SELECT status FROM contract WHERE contract_id=%s", (contract_id,), fetch_one=True)
    if not contract or contract["status"] != "pending":
        return jsonify({"error": "No pending contract found"}), 400
    execute_query("DELETE FROM payment WHERE contract_id=%s", (contract_id,), commit=True)
    execute_query("DELETE FROM contract_audit WHERE contract_id=%s", (contract_id,), commit=True)
    execute_query("DELETE FROM contract WHERE contract_id=%s", (contract_id,), commit=True)
    return jsonify({"message": "Contract request cancelled"})

# ========== MANAGER DASHBOARD ENDPOINTS ==========
@app.route("/manager/contract_requests", methods=["GET"])
def contract_requests():
    sql = """
        SELECT c.contract_id, s.student_id, s.full_name, s.email, s.phone,
               ct.name as contract_type, mp.planname as meal_plan, p.payment_method
        FROM contract c
        JOIN student s ON c.student_id = s.student_id
        JOIN contract_type ct ON c.contract_type_id = ct.contract_type_id
        JOIN meal_plan mp ON c.mealplanid = mp.mealplanid
        JOIN payment p ON c.contract_id = p.contract_id
        WHERE c.status = 'pending'
    """
    requests = execute_query(sql, fetch_all=True)
    return jsonify(requests if requests else [])

@app.route("/manager/approve_contract/<int:contract_id>", methods=["POST"])
def approve_contract(contract_id):
    data = request.json
    manager_id = data.get("manager_id")
    manager = execute_query("SELECT username FROM manager WHERE managerid=%s", (manager_id,), fetch_one=True)
    manager_name = manager["username"] if manager else "unknown"

    contract = execute_query("SELECT * FROM contract WHERE contract_id=%s AND status='pending'", (contract_id,), fetch_one=True)
    if not contract:
        return jsonify({"error": "Contract not found or already processed"}), 404

    execute_query("UPDATE contract SET status='active' WHERE contract_id=%s", (contract_id,), commit=True)
    student_id = contract["student_id"]
    execute_query("UPDATE student SET status='active' WHERE student_id=%s", (student_id,), commit=True)
    plan = execute_query("""
        SELECT meals_per_day, end_date, start_date
        FROM contract c JOIN meal_plan mp ON c.mealplanid = mp.mealplanid
        WHERE c.contract_id=%s
    """, (contract_id,), fetch_one=True)
    total_days = (plan["end_date"] - plan["start_date"]).days
    total_meals = total_days * plan["meals_per_day"]
    execute_query("""
        INSERT INTO student_balance (total_days, total_meals, days_left, meals_left, last_update, meals_per_day, contract_id, student_id)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    """, (total_days, total_meals, total_days, total_meals, dt.date.today(), plan["meals_per_day"], contract_id, student_id), commit=True)

    execute_query("""
        INSERT INTO contract_audit (changed_date, changed_field, oldvalue, newvalue, reason, contract_id, managerid, who)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    """, (dt.date.today(), "contract_approved", "pending", "active",
          f"Approved by manager {manager_name}", contract_id, manager_id, manager_name), commit=True)

    return jsonify({"message": "Contract approved and saved"})

@app.route("/manager/decline_contract/<int:contract_id>", methods=["POST"])
def decline_contract(contract_id):
    data = request.json
    reason = data.get("reason", "")
    execute_query("DELETE FROM payment WHERE contract_id=%s", (contract_id,), commit=True)
    execute_query("DELETE FROM contract_audit WHERE contract_id=%s", (contract_id,), commit=True)
    execute_query("DELETE FROM student_balance WHERE contract_id=%s", (contract_id,), commit=True)
    execute_query("DELETE FROM orders WHERE contract_id=%s", (contract_id,), commit=True)
    execute_query("DELETE FROM contract WHERE contract_id=%s", (contract_id,), commit=True)
    return jsonify({"message": f"Contract declined and removed. Reason: {reason}"})

# MODIFIED: removed 'serving' status update
@app.route("/manager/orders", methods=["GET"])
def manager_orders():
    orders = execute_query("""
        SELECT o.order_id, o.mealdate, o.order_time, o.status, s.full_name, s.student_id, mt.meal_name, od.item_name, od.quantity, od.special_request
        FROM orders o
        JOIN student s ON o.student_id = s.student_id
        JOIN meal_type mt ON o.mealtype_id = mt.mealtype_id
        JOIN order_detail od ON o.order_id = od.order_id
        WHERE o.status IN ('pending', 'served', 'cant_serve')
        ORDER BY o.order_id DESC
    """, fetch_all=True)
    orders = convert_time_to_str(orders)
    return jsonify(orders if orders else [])

@app.route("/manager/update_order_status", methods=["POST"])
def update_order_status():
    data = request.json
    order_id = data["order_id"]
    new_status = data["status"]
    order = execute_query("SELECT status, student_id FROM orders WHERE order_id=%s", (order_id,), fetch_one=True)
    if not order:
        return jsonify({"error": "Order not found"}), 404
    if order["status"] in ['served', 'cant_serve']:
        return jsonify({"error": "Order already processed"}), 400

    if new_status == 'served':
        try:
            execute_query("START TRANSACTION")
            execute_query("UPDATE orders SET status='served' WHERE order_id=%s", (order_id,))
            det = execute_query("SELECT quantity, student_id FROM order_detail od JOIN orders o ON od.order_id=o.order_id WHERE o.order_id=%s", (order_id,), fetch_one=True)
            quantity = det["quantity"]
            student_id = det["student_id"]
            execute_query("""
                UPDATE student_balance 
                SET meals_left = meals_left - %s, last_update = %s 
                WHERE student_id=%s AND contract_id IN (SELECT contract_id FROM contract WHERE student_id=%s AND status='active')
                ORDER BY balance_id DESC LIMIT 1
            """, (quantity, dt.date.today(), student_id, student_id))
            execute_query("COMMIT")
            return jsonify({"message": "Order is served have a nice meal!"})
        except Exception as e:
            execute_query("ROLLBACK")
            return jsonify({"error": str(e)}), 500
    elif new_status == 'cant_serve':
        execute_query("UPDATE orders SET status='cant_serve' WHERE order_id=%s", (order_id,), commit=True)
        return jsonify({"message": "Sorry can't serve the meal"})
    else:
        return jsonify({"error": "Invalid status"}), 400

@app.route("/manager/info/<int:manager_id>", methods=["GET"])
def manager_info(manager_id):
    mgr = execute_query("SELECT managerid, full_name, username, phone FROM manager WHERE managerid=%s", (manager_id,), fetch_one=True)
    return jsonify(mgr) if mgr else jsonify({"error": "Not found"}), 404

@app.route("/manager/daily_summary", methods=["GET"])
def daily_summary():
    today = dt.date.today()
    hourly = execute_query("""
        SELECT COUNT(DISTINCT o.order_id) as meals_served,
               COUNT(DISTINCT o.student_id) as students_served,
               HOUR(o.order_time) as hour
        FROM orders o
        WHERE o.mealdate = %s AND o.status = 'served'
        GROUP BY hour
        ORDER BY hour
    """, (today,), fetch_all=True)
    total_meals = sum(h['meals_served'] for h in hourly) if hourly else 0
    total_students = len(set(h['students_served'] for h in hourly)) if hourly else 0
    return jsonify({
        "date": today.isoformat(),
        "total_meals": total_meals,
        "total_students": total_students,
        "hourly": hourly if hourly else []
    })

# ========== CONTRACT AUDIT (for admin) ==========
@app.route("/manager/contract_audit", methods=["GET"])
def contract_audit():
    audits = execute_query("""
        SELECT audit_id, changed_date, changed_field, oldvalue, newvalue, reason, managerid, contract_id, who
        FROM contract_audit
        ORDER BY changed_date DESC, audit_id DESC
    """, fetch_all=True)
    return jsonify(audits if audits else [])

# ========== ADMIN ENDPOINTS ==========
@app.route("/admin/login", methods=["POST"])
def admin_login():
    data = request.json
    username = data.get("username")
    password = data.get("password")
    manager_id = data.get("manager_id")
    if username == "admin" and password == "admin1234":
        execute_query("INSERT INTO admin_log (manager_id, login_time, success) VALUES (%s, %s, %s)", 
                     (manager_id, dt.datetime.now(), True), commit=True)
        return jsonify({"success": True})
    else:
        if manager_id:
            execute_query("INSERT INTO admin_log (manager_id, login_time, success) VALUES (%s, %s, %s)", 
                         (manager_id, dt.datetime.now(), False), commit=True)
        return jsonify({"success": False, "message": "Invalid admin credentials"}), 401

@app.route("/admin/recent_logins", methods=["GET"])
def recent_logins():
    logs = execute_query("""
        SELECT al.login_time, al.success, m.full_name, m.username
        FROM admin_log al
        JOIN manager m ON al.manager_id = m.managerid
        ORDER BY al.login_time DESC LIMIT 5
    """, fetch_all=True)
    return jsonify(logs if logs else [])

@app.route("/admin/all_managers", methods=["GET"])
def all_managers():
    mgrs = execute_query("SELECT managerid, full_name, username, phone, password FROM manager", fetch_all=True)
    return jsonify(mgrs if mgrs else [])

@app.route("/admin/fire_manager/<int:manager_id>", methods=["DELETE"])
def fire_manager(manager_id):
    execute_query("DELETE FROM manager WHERE managerid=%s", (manager_id,), commit=True)
    return jsonify({"message": "Manager fired"})

@app.route("/admin/update_manager/<int:manager_id>", methods=["PUT"])
def update_manager(manager_id):
    data = request.json
    required = ["full_name", "username", "phone", "password"]
    for field in required:
        if not data.get(field):
            return jsonify({"message": f"Missing {field}"}), 400
    existing = execute_query("SELECT managerid FROM manager WHERE username=%s AND managerid != %s", 
                             (data["username"], manager_id), fetch_one=True)
    if existing:
        return jsonify({"message": "Username already taken"}), 400
    execute_query("""
        UPDATE manager 
        SET full_name=%s, username=%s, phone=%s, password=%s
        WHERE managerid=%s
    """, (data["full_name"], data["username"], data["phone"], data["password"], manager_id), commit=True)
    return jsonify({"message": "Manager updated successfully"})

@app.route("/admin/contact", methods=["GET"])
def get_contact_info():
    admin = execute_query("SELECT full_name, phone FROM manager WHERE username='admin'", fetch_one=True)
    if admin:
        return jsonify({
            "email": "admin@deliciouscafe.com",
            "phone": admin["phone"],
            "name": admin["full_name"]
        })
    return jsonify({"email": "owner@cafesystem.com", "phone": "+251 9XX XXX XXX", "name": "Cafe Manager"})

@app.route("/admin/student_contracts", methods=["GET"])
def admin_student_contracts():
    contracts = execute_query("""
        SELECT s.student_id, s.full_name, s.email, s.phone, 
               c.contract_id, ct.name as contract_type, mp.planname as meal_plan, p.payment_method,
               c.start_date, c.end_date, c.status
        FROM student s
        JOIN contract c ON s.student_id = c.student_id
        JOIN contract_type ct ON c.contract_type_id = ct.contract_type_id
        JOIN meal_plan mp ON c.mealplanid = mp.mealplanid
        JOIN payment p ON c.contract_id = p.contract_id
        ORDER BY s.student_id
    """, fetch_all=True)
    return jsonify(contracts if contracts else [])

@app.route("/admin/update_student/<int:student_id>", methods=["PUT"])
def update_student(student_id):
    data = request.json
    new_name = data.get("full_name")
    new_phone = data.get("phone")
    manager_id = data.get("manager_id")
    
    if not new_name or not new_phone:
        return jsonify({"message": "Name and phone are required"}), 400
    
    old = execute_query("SELECT full_name, phone FROM student WHERE student_id=%s", (student_id,), fetch_one=True)
    if not old:
        return jsonify({"message": "Student not found"}), 404
    
    who = execute_query("SELECT username FROM manager WHERE managerid=%s", (manager_id,), fetch_one=True)
    who_name = who["username"] if who else "unknown"
    
    execute_query("UPDATE student SET full_name=%s, phone=%s WHERE student_id=%s", 
                  (new_name, new_phone, student_id), commit=True)
    
    if old["full_name"] != new_name:
        execute_query("""
            INSERT INTO contract_audit (changed_date, changed_field, oldvalue, newvalue, reason, contract_id, managerid, who)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (dt.date.today(), "student_name", old["full_name"], new_name, "Admin edited student", None, manager_id, who_name), commit=True)
    
    if old["phone"] != new_phone:
        execute_query("""
            INSERT INTO contract_audit (changed_date, changed_field, oldvalue, newvalue, reason, contract_id, managerid, who)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (dt.date.today(), "student_phone", old["phone"], new_phone, "Admin edited student", None, manager_id, who_name), commit=True)
    
    return jsonify({"message": "Student updated successfully"})

@app.route("/admin/update_contract/<int:contract_id>", methods=["PUT"])
def update_contract(contract_id):
    data = request.json
    old_contract = execute_query("SELECT * FROM contract WHERE contract_id=%s", (contract_id,), fetch_one=True)
    if not old_contract:
        return jsonify({"error": "Contract not found"}), 404

    new_contract_type = data.get("contract_type")
    new_meal_plan = data.get("meal_plan")
    new_payment_method = data.get("payment_method")
    reason = data.get("reason", "")
    manager_id = data.get("manager_id")
    who = execute_query("SELECT username FROM manager WHERE managerid=%s", (manager_id,), fetch_one=True)
    who_name = who["username"] if who else "unknown"
    student_id = old_contract["student_id"]

    old_mp = execute_query("SELECT planname, meals_per_day FROM meal_plan WHERE mealplanid=%s", (old_contract["mealplanid"],), fetch_one=True)
    old_ct = execute_query("SELECT name, duration_days FROM contract_type WHERE contract_type_id=%s", (old_contract["contract_type_id"],), fetch_one=True)

    ct = execute_query("SELECT contract_type_id, duration_days FROM contract_type WHERE name=%s", (new_contract_type,), fetch_one=True)
    if not ct:
        return jsonify({"error": "Invalid contract type"}), 400
    new_ct_id = ct["contract_type_id"]
    new_duration = ct["duration_days"]

    mp = execute_query("SELECT mealplanid, meals_per_day FROM meal_plan WHERE planname=%s", (new_meal_plan,), fetch_one=True)
    if mp:
        new_mp_id = mp["mealplanid"]
        new_meals_per_day = mp["meals_per_day"]
    else:
        if new_meal_plan == "full contract":
            inc_b = inc_l = inc_d = True
            meals_per_day = 3
        else:
            inc_b, inc_l, inc_d = False, True, True
            meals_per_day = 2
        execute_query("""
            INSERT INTO meal_plan (planname, include_breakfast, include_lunch, include_dinner, meals_per_day)
            VALUES (%s, %s, %s, %s, %s)
        """, (new_meal_plan, inc_b, inc_l, inc_d, meals_per_day), commit=True)
        cursor = get_cursor()
        cursor.execute("SELECT LAST_INSERT_ID()")
        new_mp_id = cursor.fetchone()["LAST_INSERT_ID()"]
        new_meals_per_day = meals_per_day

    execute_query("UPDATE payment SET payment_method=%s WHERE contract_id=%s", (new_payment_method, contract_id), commit=True)
    execute_query("""
        UPDATE contract SET contract_type_id=%s, mealplanid=%s WHERE contract_id=%s
    """, (new_ct_id, new_mp_id, contract_id), commit=True)

    balance = execute_query("""
        SELECT meals_left, total_meals, days_left, total_days, meals_per_day
        FROM student_balance
        WHERE contract_id=%s ORDER BY balance_id DESC LIMIT 1
    """, (contract_id,), fetch_one=True)
    
    if balance:
        old_total_meals = balance["total_meals"]
        old_meals_left = balance["meals_left"]
        consumed_meals = old_total_meals - old_meals_left
        start_date = old_contract["start_date"]
        end_date = start_date + dt.timedelta(days=new_duration)
        new_total_days = new_duration
        new_total_meals = new_total_days * new_meals_per_day
        new_meals_left = new_total_meals - consumed_meals
        if new_meals_left < 0:
            new_meals_left = 0
        execute_query("""
            UPDATE student_balance 
            SET total_days=%s, total_meals=%s, days_left=%s, meals_left=%s, meals_per_day=%s,
                last_update=%s
            WHERE contract_id=%s ORDER BY balance_id DESC LIMIT 1
        """, (new_total_days, new_total_meals, new_total_days, new_meals_left, new_meals_per_day, dt.date.today(), contract_id), commit=True)
        execute_query("UPDATE contract SET end_date=%s WHERE contract_id=%s", (end_date, contract_id), commit=True)
    else:
        new_total_days = new_duration
        new_total_meals = new_total_days * new_meals_per_day
        execute_query("""
            INSERT INTO student_balance (total_days, total_meals, days_left, meals_left, last_update, meals_per_day, contract_id, student_id)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (new_total_days, new_total_meals, new_total_days, new_total_meals, dt.date.today(), new_meals_per_day, contract_id, student_id), commit=True)

    changes = []
    if old_contract["contract_type_id"] != new_ct_id:
        changes.append(("contract_type", old_ct["name"] if old_ct else str(old_contract["contract_type_id"]), new_contract_type))
    if old_contract["mealplanid"] != new_mp_id:
        changes.append(("meal_plan", old_mp["planname"] if old_mp else str(old_contract["mealplanid"]), new_meal_plan))
    if old_contract["end_date"] != end_date:
        changes.append(("end_date", old_contract["end_date"].isoformat(), end_date.isoformat()))

    for changed_field, old_val, new_val in changes:
        execute_query("""
            INSERT INTO contract_audit (changed_field, oldvalue, newvalue, reason, changed_date, contract_id, managerid, who)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (changed_field, str(old_val), str(new_val), reason, dt.date.today(), contract_id, manager_id, who_name), commit=True)

    return jsonify({"message": "Contract updated successfully and balance recalculated"})

if __name__ == "__main__":
    app.run(debug=True)