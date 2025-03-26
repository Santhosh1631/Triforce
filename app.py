from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_mysqldb import MySQL
import bcrypt
import google.generativeai as genai
import requests
import os

# Initialize Flask app and enable CORS
app = Flask(__name__)
CORS(app)

# MySQL Configuration
app.config['MYSQL_HOST'] = '161.97.70.226'  # Updated Host
app.config['MYSQL_USER'] = 'triforce'  # Updated User
app.config['MYSQL_PASSWORD'] = 'hSPEm1fpQPMGWzNbVl1e'  # Updated Password
app.config['MYSQL_DB'] = 'triforcedb'  # Updated Database Name
app.config['MYSQL_PORT'] = 3306  # Default MySQL Port

# Initialize MySQL
mysql = MySQL(app)
# Configure the Google Generative AI API
GOOGLE_API_KEY = "AIzaSyDrcKRDLBYVhuI813-ryCqCx4Jeazyjx44"
genai.configure(api_key=GOOGLE_API_KEY)
model = genai.GenerativeModel('gemini-1.5-pro')  # or any listed model


# Store conversation context per user
user_context = {}
# Helper function to get a response from the Generative AI model
def prompt(user_id, user_input):
    try:
        # Initialize context if the user is interacting for the first time
        if user_id not in user_context:
            user_context[user_id] = []
        
        # Add the user's input to the context
        user_context[user_id].append(f"User: {user_input}")
        
        # Construct the conversation history
        conversation_history = "\n".join(user_context[user_id])
        
        # Generate response based on the context
        response = model.generate_content(contents=[{"parts": [{"text": conversation_history}]}])
        
        # Extract the generated response and add it to the context
        bot_response = response.parts[0].text
        user_context[user_id].append(f"Bot: {bot_response}")
        
        return bot_response
    except Exception as e:
        return f"Error generating response: {str(e)}"

# Route for user registration
@app.route("/register", methods=["POST"])
def register():
    try:
        data = request.json
        email = data.get("email", "").strip()
        password = data.get("password", "").strip()
        
        if not email or not password:
            return jsonify({"error": "Email and password are required"}), 400
        
        # Hash the password
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        
        # Insert into the database
        cur = mysql.connection.cursor()
        cur.execute("INSERT INTO users (email, password) VALUES (%s, %s)", (email, hashed_password))
        mysql.connection.commit()
        cur.close()
        
        return jsonify({"message": "User registered successfully!"}), 200
    except Exception as e:
        if "Duplicate entry" in str(e):
            return jsonify({"error": "Email already registered"}), 400
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500

# Route for user login
@app.route("/login", methods=["POST"])
def login():
    try:
        data = request.json
        email = data.get("email", "").strip()
        password = data.get("password", "").strip()
        
        if not email or not password:
            return jsonify({"error": "Email and password are required"}), 400
        
        # Check email in the database
        cur = mysql.connection.cursor()
        cur.execute("SELECT password FROM users WHERE email = %s", (email,))
        result = cur.fetchone()
        cur.close()
        
        if result:
            hashed_password = result[0]
            
            # Verify the password
            if bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8')):
                return jsonify({"message": "Login successful!"}), 200
            else:
                return jsonify({"error": "Invalid password"}), 401
        else:
            return jsonify({"error": "User not found"}), 404
    except Exception as e:
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500

# Define the chatbot endpoint
@app.route("/chat", methods=["POST"])
def chat():
    try:
        data = request.json  # Get the JSON data from the POST request
        user_message = data.get("message", "").strip()  # Extract user message
        user_id = data.get("user_id", "default")  # Use a unique identifier for the user
        
        if user_message:
            # Get the bot's response from the AI model
            bot_message = prompt(user_id, user_message)
        else:
            bot_message = "I didn't understand that. Could you please clarify?"
        
        return jsonify({"response": bot_message})
    except Exception as e:
        # Handle any unexpected errors
        return jsonify({"response": f"An error occurred: {str(e)}"})

# Main entry point for running the app
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
