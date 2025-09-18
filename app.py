from flask import Flask, request, jsonify,render_template# type: ignore
from flask_cors import CORS# type: ignore
from flask_mysqldb import MySQL # type: ignore
import bcrypt# type: ignore
import google.generativeai as genai # type: ignore
import os
import fitz  # type: ignore
import re
from datetime import datetime
import mysql.connector
from werkzeug.utils import secure_filename
import requests

db_config = {
    'host': '161.97.70.226',
    'user': 'triforce',
    'password': 'hSPEm1fpQPMGWzNbVl1e',
    'database': 'triforcedb'
}

API_KEY = "AIzaSyBOa-AAdB07HYRcZBABvPsibQijEqliJMw"
CX = "503fed9c8bcde4171"

conn = mysql.connector.connect(**db_config)
cursor = conn.cursor()

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

UPLOAD_FOLDER = 'uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

mysql = MySQL(app)
# Configure the Google Generative AI API
GOOGLE_API_KEY = "AIzaSyBS7cWquirQFYafLtbtSAg-wFY-WLlEO78"
genai.configure(api_key=GOOGLE_API_KEY)
model = genai.GenerativeModel('gemini-2.0-flash')
user_context={}
def validate_email(email):
    """Validate email format."""
    return re.match(r"[^@]+@[^@]+\.[^@]+", email)

def validate_phone(phone):
    """Validate phone number format."""
    return re.match(r"^[0-9]{10,15}$", phone)

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Handle Upload PDF files
def extract_values_from_pdf(pdf_path):
    try:
        with fitz.open(pdf_path) as doc:
            text = "".join(page.get_text() for page in doc)

        # Define regex patterns for different scores
        patterns = {
            'Verbal Comprehension': r'(Verbal\s*Comprehension)\D*(\d+)',
            'Perceptual Reasoning': r'(Perceptual\s*Reasoning)\D*(\d+)',
            'Working Memory': r'(Working\s*Memory)\D*(\d+)',
            'Processing Speed': r'(Processing\s*Speed)\D*(\d+)'
        }

        scores = {}
        for key, pattern in patterns.items():
            match = re.search(pattern, text, re.IGNORECASE)
            scores[key] = int(match.group(2)) if match else 0

        # Finding the highest score
        highest_strength = max(scores, key=scores.get)

        # print("Extracted Scores:", scores)
        # print("Highest Strength:", highest_strength)
        return {
            "scores": scores,
            "highest_strength": highest_strength
        }
    
    except FileNotFoundError:
        print(f"File not found: {pdf_path}")    

    except Exception as e:
        print(f"Error processing PDF: {str(e)}")

@app.route("/register", methods=["POST"])
def register():
    """Handle user registration."""
    try:
        if 'pdf' not in request.files:
            return jsonify({"error": "PDF file is required"}), 400

        pdf = request.files['pdf']
        name = request.form.get('name')
        email = request.form.get('email')
        password = request.form.get('password')

        if not email or not password:
            return jsonify({"error": "Email and password are required"}), 400

        if not validate_email(email):
            return jsonify({"error": "Invalid email format"}), 400

        if not all([name, email, password]):
            return jsonify({"error": "Missing required fields"}), 400

        filename = secure_filename(pdf.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        pdf.save(file_path)

        values = extract_values_from_pdf(file_path)

        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

        cur = mysql.connection.cursor()
        cur.execute("""
            INSERT INTO users (email, password, created_at, verbal_comprehension, perceptual_reasoning, working_memory, processing_speed, highest_strength) 
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (email, hashed_password, datetime.utcnow(), values["scores"]["Verbal Comprehension"], values["scores"]["Perceptual Reasoning"], values["scores"]["Working Memory"], values["scores"]["Processing Speed"], values["highest_strength"],))
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

def get_image_urls(search_term, api_key, cx, num=5):
    url = "https://www.googleapis.com/customsearch/v1"
    params = {
        "q": search_term,
        "cx": cx,
        "key": api_key,
        "searchType": "image",
        "num": num
    }

    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        results = response.json()

        image_urls = [item["link"] for item in results.get("items", [])]
        return image_urls

    except Exception as e:
        print(f"Error fetching images: {e}")
        return []
    
@app.route("/chat", methods=["POST"])
def chat():
    """Handle chatbot interactions."""
    try:
        data = request.get_json()
        user_message = data.get("message", "").strip()
        user_id = data.get("user_id", "default")
        
        cur = mysql.connection.cursor()
        cur.execute("SELECT highest_strength FROM users WHERE email = %s", (user_id,))
        result = cur.fetchone()
        cur.close()

        if not user_message:
            return jsonify({"response": "Please provide a message"}), 400

        # Initialize context if needed
        if user_id not in user_context:
            user_context[user_id] = []

        # Maintain conversation history
        user_context[user_id].append(f"User: {user_message}")
        conversation_history = "\n".join(user_context[user_id])

        # Generate response with safety settings and error handling
        try:
            generation_config = {
                "temperature": 0.7,
                "top_p": 0.95,
                "top_k": 40,
            }
            safety_settings = [
                {
                    "category": "HARM_CATEGORY_HARASSMENT",
                    "threshold": "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    "category": "HARM_CATEGORY_HATE_SPEECH",
                    "threshold": "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                    "threshold": "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
                    "threshold": "BLOCK_MEDIUM_AND_ABOVE"
                }
            ]
            
            response = model.generate_content(
                contents=[{"parts": [{"text": conversation_history}]}],
                generation_config=generation_config,
                safety_settings=safety_settings
            )
            
            # Check if response was blocked
            if hasattr(response, 'prompt_feedback') and response.prompt_feedback:
                bot_response = "I'm sorry, but I can't respond to that kind of content. Please try a different question."
            else:
                bot_response = response.parts[0].text
                
            user_context[user_id].append(f"Bot: {bot_response}")
            imageurl = None
        except Exception as e:
            bot_response = f"I'm having trouble generating a response right now. Please try again or ask a different question. Error details: {str(e)}"
            imageurl = None

        if(result["highest_strength"] == 'Perceptual Reasoning'): 
            images = get_image_urls(user_message, API_KEY, CX)
            imageurl = images[1]
 

        return jsonify({"response": bot_response, "url" : imageurl})

    except Exception as e:
        print(f"Chat error: {str(e)}")
        return jsonify({"response": "I'm sorry, I encountered an error processing your request. Please try again later."}), 500

# Health check endpoint
@app.route("/bot")
def bot():
    return render_template("bot.html")

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({"status": "healthy"}), 200

@app.route("/models/<path:filename>")
def serve_model(filename):
    return app.send_static_file(f"models/{filename}")

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)

