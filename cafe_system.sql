CREATE DATABASE cafe_system;
USE cafe_system;

CREATE TABLE contract_type (
    contract_type_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100),
    duration_days INT
);

CREATE TABLE meal_plan (
    mealplanid INT PRIMARY KEY AUTO_INCREMENT,
    planname VARCHAR(100),
    include_breakfast BOOLEAN,
    include_lunch BOOLEAN,
    include_dinner BOOLEAN,
    meals_per_day INT
);

CREATE TABLE meal_type (
    mealtype_id INT PRIMARY KEY AUTO_INCREMENT,
    meal_name VARCHAR(100)
);

CREATE TABLE manager (
    managerid INT PRIMARY KEY AUTO_INCREMENT,
    full_name VARCHAR(100),
    username VARCHAR(50),
    email VARCHAR(100),
    phone VARCHAR(20),
    password VARCHAR(255),
    security_question VARCHAR(255),
    security_answer VARCHAR(255)
) AUTO_INCREMENT = 500;

CREATE TABLE student (
    student_id INT PRIMARY KEY AUTO_INCREMENT,
    full_name VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(20),
    registration_date DATE,
    status VARCHAR(50),
    password VARCHAR(255),
    security_question VARCHAR(255),
    security_answer VARCHAR(255)
) AUTO_INCREMENT = 1000;

CREATE TABLE contract (
    contract_id INT PRIMARY KEY AUTO_INCREMENT,
    start_date DATE,
    end_date DATE,
    total_cost DECIMAL(10,2),
    status VARCHAR(50),
    signed_date DATE,
    student_id INT,
    contract_type_id INT,
    mealplanid INT,
    FOREIGN KEY (student_id) REFERENCES student(student_id),
    FOREIGN KEY (contract_type_id) REFERENCES contract_type(contract_type_id),
    FOREIGN KEY (mealplanid) REFERENCES meal_plan(mealplanid)
);

CREATE TABLE payment (
    payment_id INT PRIMARY KEY AUTO_INCREMENT,
    payment_method VARCHAR(50),
    payment_date DATE,
    amount DECIMAL(10,2),
    contract_id INT,
    student_id INT,
    managerid INT,
    FOREIGN KEY (contract_id) REFERENCES contract(contract_id),
    FOREIGN KEY (student_id) REFERENCES student(student_id),
    FOREIGN KEY (managerid) REFERENCES manager(managerid)
);

CREATE TABLE contract_audit (
    audit_id INT PRIMARY KEY AUTO_INCREMENT,
    reason VARCHAR(255),
    meal_name VARCHAR(100),
    oldvalue TEXT,
    newvalue TEXT,
    changed_field VARCHAR(100),
    changed_date DATE,
    contract_id INT,
    managerid INT,
    who VARCHAR(100),
    FOREIGN KEY (contract_id) REFERENCES contract(contract_id),
    FOREIGN KEY (managerid) REFERENCES manager(managerid)
);

CREATE TABLE daily_summary (
    summary_id INT PRIMARY KEY AUTO_INCREMENT,
    summary_date DATE,
    totalmeal_served INT,
    managerid INT,
    FOREIGN KEY (managerid) REFERENCES manager(managerid)
);

CREATE TABLE orders (
    order_id INT PRIMARY KEY AUTO_INCREMENT,
    mealdate DATE,
    order_time TIME,
    status VARCHAR(50),
    contract_id INT,
    student_id INT,
    managerid INT,
    mealtype_id INT,
    summary_id INT,
    FOREIGN KEY (contract_id) REFERENCES contract(contract_id),
    FOREIGN KEY (student_id) REFERENCES student(student_id),
    FOREIGN KEY (managerid) REFERENCES manager(managerid),
    FOREIGN KEY (mealtype_id) REFERENCES meal_type(mealtype_id),
    FOREIGN KEY (summary_id) REFERENCES daily_summary(summary_id)
);

CREATE TABLE order_detail (
    order_detail_id INT PRIMARY KEY AUTO_INCREMENT,
    item_name VARCHAR(100),
    quantity INT,
    special_request VARCHAR(255),
    order_id INT,
    FOREIGN KEY (order_id) REFERENCES orders(order_id)
);

CREATE TABLE student_balance (
    balance_id INT PRIMARY KEY AUTO_INCREMENT,
    total_days INT,
    total_meals INT,
    days_left INT,
    meals_left INT,
    last_update DATE,
    meals_per_day INT,
    contract_id INT,
    student_id INT,
    FOREIGN KEY (contract_id) REFERENCES contract(contract_id),
    FOREIGN KEY (student_id) REFERENCES student(student_id)
);

CREATE TABLE admin_log (
    log_id INT PRIMARY KEY AUTO_INCREMENT,
    manager_id INT,
    login_time DATETIME,
    success BOOLEAN,
    FOREIGN KEY (manager_id) REFERENCES manager(managerid)
);
