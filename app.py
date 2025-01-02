from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai

# Initialize Flask app and enable CORS
app = Flask(__name__)
CORS(app)

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
            bot_message = prompt(user_id, user_message)
        else:
            # Fallback message if input is empty
            bot_message = "I didn't understand that. Could you please clarify?"

        # Return the bot's response as JSON
        return jsonify({"response": bot_message})
    except Exception as e:
        # Handle any unexpected errors
        return jsonify({"response": f"An error occurred: {str(e)}"})

# Main entry point for running the app
if __name__ == "__main__":
    app.run(debug=True, port=5001)
