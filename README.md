markdown
# Delicious Cafe – Student & Manager Portal

A web‑based meal ordering and contract management system for a university cafe.  
Built with **Flask** (backend), **MySQL** (database), and **HTML/CSS/JS** (frontend).

---

## 📁 Project Structure
project-root/
│
├── backend/
│ ├── app.py # Flask backend (API routes)
│ └── requirements.txt # Python dependencies
│
├── frontend/
│ ├── index.html # Main HTML file
│ ├── style.css # All CSS styles
│ └── script.js # All JavaScript logic
│
├── database/
│ └── cafe_system.sql # SQL script to create database and tables
│
├── images/ # Background images for the slideshow
│ ├── a.jpg
│ ├── b.jpg
│ ├── c.jpg
│ ├── d.jpg
│ ├── e.jpg
│ └── f.jpg
│
└── README.md # This file

text

---

## 🛠️ Prerequisites

- **Python 3.8+** (with `pip`)
- **MySQL Server** (running locally)
- A **web browser** (Chrome, Firefox, Edge, etc.)

---

## 🚀 Setup Instructions

### 1. Clone or download the project

Place all files from the archive into a folder on your computer, preserving the directory structure shown above.

### 2. Create the database

Open a terminal (command prompt) and execute the SQL script:

```bash
mysql -u root -p < database/cafe_system.sql
You will be prompted for your MySQL root password.
This creates the cafe_system database and all necessary tables.

3. Adjust database credentials
Open backend/app.py with a text editor.
Find the lines where mysql.connector.connect() is called (there are two occurrences: one inside init_database() if you added it, otherwise inside each route).
Change the password parameter to match your MySQL root password.

Example:

python
mysql.connector.connect(
    host="localhost",
    user="root",
    password="YOUR_PASSWORD_HERE",   # <-- change this
    database="cafe_system",
    ...
)
If you are using a different MySQL user, also adjust the user field.

4. Install Python dependencies
Navigate to the backend folder and run:

bash
cd backend
pip install -r requirements.txt
This installs flask, flask-cors, and mysql-connector-python.

5. Start the Flask backend
Still inside the backend folder, run:

bash
python app.py
You should see output similar to:

text
Running on http://127.0.0.1:5000
Keep this terminal window open (the backend must stay running).

6. Open the frontend
Open the index.html file located in the frontend folder with any web browser.

Note: Because the frontend communicates with the backend using fetch, you must ensure CORS is allowed (already configured by flask-cors). If you open index.html directly from a file:// URL, everything will still work because Flask‑CORS accepts requests from any origin.

🧪 Using the Application
Student Portal
Sign up with your personal details (security question for password reset).

Login using your student ID and password.

Buy a contract (choose contract type, meal plan, payment method) – the request goes to the manager.

Once the manager approves the contract, you can place orders for meals (breakfast/lunch/dinner) as long as you have meals left.

Track your balance (meals & days left) and cancel pending orders.

Forgot password – answer your security question to reset it.

Manager Portal
Login with your manager username and password (the first manager must be created via sign‑up using the administrator password admin1234).

Approve or reject student contract requests.

View orders placed by students and mark them as “Served” or “Can’t Serve”.

Daily summary – see total meals and students served by hour.

Contract audit – view all changes made to contracts.

Administrator area – only available for the admin manager. From there you can edit student information, update contract details, and manage other managers.

🌄 Background Slideshow
The frontend includes a dynamic circular slideshow that rotates through six images (a.jpg – f.jpg). The images are split diagonally, creating a modern, eye‑catching effect. All background logic is inside script.js – no extra configuration needed.

⚠️ Troubleshooting
Problem	Solution
ModuleNotFoundError: No module named 'flask'	You forgot to run pip install -r requirements.txt.
Access denied for user 'root'@'localhost'	The password in app.py does not match your MySQL root password. Update it in the connection settings.
Unknown database 'cafe_system'	You did not run the SQL script. Execute mysql -u root -p < database/cafe_system.sql.
CORS error in browser	The Flask‑CORS extension is missing? Make sure it is installed (pip install flask-cors). Also verify that app.py contains CORS(app).
Background images not showing	Ensure the images/ folder contains the six .jpg files and that they are named exactly a.jpg, b.jpg, c.jpg, d.jpg, e.jpg, f.jpg.

📄 Additional Notes
The first manager account must be created via the manager sign‑up page using the administrator password admin1234.

After creation, any manager can log in. The manager admin (the one with username admin) has extra privileges to see the Administrator panel.

All database operations are handled through the Flask API – no direct database access from the frontend.

👨‍🎓 Submission Information
This project was developed as a Database and Web Programming assignment.
All code is original, written in Python (Flask), HTML/CSS, and vanilla JavaScript.
No external frontend frameworks were used.

For questions or issues, please contact the project author.

Enjoy using the Delicious Cafe system! 🍽️