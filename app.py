from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_mysqldb import MySQL
import bcrypt
import google.generativeai as genai
import requests

# Initialize Flask app and enable CORS
app = Flask(__name__)
CORS(app)

# MySQL Configuration
app.config['MYSQL_HOST'] = 'sql12.freesqldatabase.com'
app.config['MYSQL_USER'] = 'sql12757205'
app.config['MYSQL_PASSWORD'] = 'i9uXQwuI6Z'
app.config['MYSQL_DB'] = 'sql12757205'
app.config['MYSQL_PORT'] = 3306

# Initialize MySQL
mysql = MySQL(app)

# Configure the Google Generative AI API
GOOGLE_API_KEY = "AIzaSyDGAZHwvEA-mSeKyJB7iOuj9bUWKe-oPcQ"
genai.configure(api_key=GOOGLE_API_KEY)
model = genai.GenerativeModel('gemini-pro')

# Store conversation context per user
user_context = {}

def generate_image(prompt):
    try:
        # Generate image using the Google Generative AI model
        response = model.Image.create(
            prompt=prompt,
            n=1,
            size="1024x1024"
        )
        
        # Log the response for debugging purposes
        print(f"Response from image generation: {response}")

        if 'data' in response and len(response['data']) > 0:
            image_url = response['data'][0].get('url')
            return image_url
        else:
            print("No image data returned")
            return None
    except Exception as e:
        # Handle any exceptions that occur during image generation
        print(f"Error generating image: {e}")
        return None

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
        response = model.generate_content(
            contents=[{"parts": [{"text": conversation_history}]}]
        )

        # Extract the generated response and add it to the context
        bot_response = response.parts[0].text
        user_context[user_id].append(f"Bot: {bot_response}")

        return bot_response
    except Exception as e:
        # Handle any errors during the response generation
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
            image_url = generate_image(user_message)
            bot_message = prompt(user_id, user_message)
        else:
            bot_message = "I didn't understand that. Could you please clarify?"
            image_url = None
        
        # Return the bot response along with the generated image URL
        return jsonify({"response": bot_message, "image_url": image_url})
    except Exception as e:

        return jsonify({"response": f"An error occurred: {str(e)}", "image_url": None})
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
