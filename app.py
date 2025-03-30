from flask import Flask, request, jsonify# type: ignore
from flask_cors import CORS# type: ignore
from flask_mysqldb import MySQL # type: ignore
import bcrypt# type: ignore
import google.generativeai as genai # type: ignore
import os
import fitz  # type: ignore
import re
from datetime import datetime


app = Flask(__name__)

CORS(app, resources={
    r"/*": {
        "origins": ["*"],
        "methods": ["GET", "POST", "PUT", "DELETE"],
        "allow_headers": ["Content-Type"]
    }
})
app.config['MYSQL_HOST'] = '161.97.70.226'
app.config['MYSQL_USER'] = 'triforce'
app.config['MYSQL_PASSWORD'] = 'hSPEm1fpQPMGWzNbVl1e'
app.config['MYSQL_DB'] = 'triforcedb'
app.config['MYSQL_PORT'] = 3306
app.config['MYSQL_CURSORCLASS'] = 'DictCursor'  

mysql = MySQL(app)
# Configure the Google Generative AI API
GOOGLE_API_KEY = "AIzaSyANpHL0jNHjyGuSUlZiUxcsxGCPvyq7Ock"
genai.configure(api_key=GOOGLE_API_KEY)
model = genai.GenerativeModel('gemini-1.5-pro')
user_context={}
def validate_email(email):
    """Validate email format."""
    return re.match(r"[^@]+@[^@]+\.[^@]+", email)

def validate_phone(phone):
    """Validate phone number format."""
    return re.match(r"^[0-9]{10,15}$", phone)

@app.route("/register", methods=["POST"])
def register():
    """Handle user registration."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        email = data.get("email", "").strip()
        password = data.get("password", "").strip()

        if not email or not password:
            return jsonify({"error": "Email and password are required"}), 400

        if not validate_email(email):
            return jsonify({"error": "Invalid email format"}), 400

        # Hash password
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

        # Store in database
        cur = mysql.connection.cursor()
        cur.execute("""
            INSERT INTO users (email, password, created_at) 
            VALUES (%s, %s, %s)
        """, (email, hashed_password, datetime.utcnow()))
        mysql.connection.commit()
        cur.close()

        return jsonify({"message": "Registration successful"}), 201

    except Exception as e:
        mysql.connection.rollback()
        if "Duplicate entry" in str(e):
            return jsonify({"error": "Email already registered"}), 409
        return jsonify({"error": f"Registration failed: {str(e)}"}), 500

@app.route("/login", methods=["POST"])
def login():
    """Handle user login."""
    try:
        data = request.get_json()
        email = data.get("email", "").strip()
        password = data.get("password", "").strip()

        if not email or not password:
            return jsonify({"error": "Email and password are required"}), 400

        cur = mysql.connection.cursor()
        cur.execute("""
            SELECT email, password FROM users 
            WHERE email = %s
        """, (email,))
        user = cur.fetchone()
        cur.close()

        if not user:
            return jsonify({"error": "User not found"}), 404

        if bcrypt.checkpw(password.encode('utf-8'), user["password"].encode('utf-8')):
            return jsonify({
                "message": "Login successful",
                "email": user["email"]
            }), 200
        else:
            return jsonify({"error": "Invalid credentials"}), 401

    except Exception as e:
        return jsonify({"error": f"Login failed: {str(e)}"}), 500

@app.route("/submit_contact", methods=["POST"])
def submit_contact():
    """Handle contact form submissions."""
    try:
        data = request.get_json()
        name = data.get("name", "").strip()
        email = data.get("email", "").strip()
        phone = data.get("phone", "").strip()

        # Validation
        if not all([name, email, phone]):
            return jsonify({"success": False, "message": "All fields are required"}), 400

        if not validate_email(email):
            return jsonify({"success": False, "message": "Invalid email format"}), 400

        if not validate_phone(phone):
            return jsonify({"success": False, "message": "Invalid phone number"}), 400

        # Store in database
        cur = mysql.connection.cursor()
        cur.execute("""
            INSERT INTO contacts (name, email, phone, timestamp)
            VALUES (%s, %s, %s, %s)
        """, (name, email, phone, datetime.utcnow()))
        mysql.connection.commit()
        cur.close()

        return jsonify({
            "success": True,
            "message": "Contact submitted successfully"
        }), 201

    except Exception as e:
        mysql.connection.rollback()
        return jsonify({
            "success": False,
            "message": f"Failed to submit contact: {str(e)}"
        }), 500

@app.route("/chat", methods=["POST"])
def chat():
    """Handle chatbot interactions."""
    try:
        data = request.get_json()
        user_message = data.get("message", "").strip()
        user_id = data.get("user_id", "default")

        if not user_message:
            return jsonify({"response": "Please provide a message"}), 400

        # Initialize context if needed
        if user_id not in user_context:
            user_context[user_id] = []

        # Maintain conversation history
        user_context[user_id].append(f"User: {user_message}")
        conversation_history = "\n".join(user_context[user_id])

        # Generate response
        response = model.generate_content(contents=[{"parts": [{"text": conversation_history}]}])
        bot_response = response.parts[0].text
        user_context[user_id].append(f"Bot: {bot_response}")

        return jsonify({"response": bot_response})

    except Exception as e:
        return jsonify({"response": f"Error: {str(e)}"}), 500

# Health check endpoint
@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({"status": "healthy"}), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)