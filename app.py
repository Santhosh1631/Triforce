from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
app = Flask(__name__)
CORS(app)
GOOGLE_API_KEY = "AIzaSyDGAZHwvEA-mSeKyJB7iOuj9bUWKe-oPcQ"  
genai.configure(api_key=GOOGLE_API_KEY)
model = genai.GenerativeModel('gemini-pro')
def prompt(user_input):
    response = model.generate_content(
        contents=[{"parts": [{"text": user_input}]}]
    )
    return response
@app.route("/chat", methods=["POST"])
def chat():
    data = request.json
    user_message = data.get("message", "")
    if user_message:
        response = prompt(user_message)
        bot_message = response.parts[0].text
    else:
        bot_message = "I didn't understand that."

    return jsonify({"response": bot_message})
if __name__ == "__main__":
    app.run(debug=True, port=5001)
#test