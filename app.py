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
app.config['MYSQL_HOST'] = 'localhost'
app.config['MYSQL_USER'] = 'root'
app.config['MYSQL_PASSWORD'] = 'san16'
app.config['MYSQL_DB'] = 'userdb'

mysql = MySQL(app)

<<<<<<< HEAD
=======
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

>>>>>>> 665b6b71d56e06675fb18de07e4eb6c71a101d06
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

        return jsonify({"message": "User registered successfully!"}), 201
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

# Configure the Google Generative AI API
GOOGLE_API_KEY = "AIzaSyDGAZHwvEA-mSeKyJB7iOuj9bUWKe-oPcQ"
genai.configure(api_key=GOOGLE_API_KEY)
model = genai.GenerativeModel('gemini-pro')

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

        # Limit context to the last 5 exchanges for brevity
        max_context_length = 5
        if len(user_context[user_id]) > max_context_length * 2:
            user_context[user_id] = user_context[user_id][-max_context_length * 2:]

        # Construct the conversation history
        conversation_history = "\n".join(user_context[user_id])

        # Generate response based on the context
        response = model.generate_content(
            contents=[{"parts": [{"text": conversation_history}]}]
        )

        # Extract the generated response
        if response.parts and len(response.parts) > 0:
            bot_response = response.parts[0].text.strip()
        else:
            bot_response = "I'm sorry, I couldn't generate a response."

        # Remove unwanted prefixes like "Assistant:" if they exist
        if bot_response.startswith("Assistant: "):
            bot_response = bot_response[len("Assistant: "):]

        # Append the bot's response to the context
        user_context[user_id].append(f"Bot: {bot_response}")

        return bot_response
    except Exception as e:
        return f"Error generating response: {str(e)}"

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

<<<<<<< HEAD
        return jsonify({"response": f"An error occurred: {str(e)}", "image_url": None})
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
=======
# Main entry point for running the app
if __name__ == "__main__":
    app.run(debug=True, port=5001)
>>>>>>> 04a27701191c22488d368480b3d89d5d8bb26be2
