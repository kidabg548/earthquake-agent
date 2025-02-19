import google.generativeai as genai
from flask import Flask, request, jsonify
import os  # For environment variables

app = Flask(__name__)

# Get API key from environment variable (recommended)
GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY")
if not GOOGLE_API_KEY:
    raise ValueError("GOOGLE_API_KEY environment variable not set.")

genai.configure(api_key=GOOGLE_API_KEY)


# Load the model
model = genai.GenerativeModel("gemini-pro")

@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json()
    user_message = data.get("message", "")

    if not user_message:
        return jsonify({"error": "Message is required"}), 400

    # Input Validation (Example - rudimentary length check)
    if len(user_message) > 1000:  # Adjust max length as needed
        return jsonify({"error": "Message is too long"}), 400

    # Sanitize the message (Example - basic removal of HTML tags)
    # NOTE: This is a very basic example.  Proper sanitization depends on your requirements.
    # sanitized_message = re.sub("<[^>]*>", "", user_message)  # Remove HTML tags (requires 'import re')

    try:
        # Get response from Gemini
        response = model.generate_content(user_message)
        return jsonify({"response": response.text})
    except Exception as e:
        print(f"Error during Gemini API call: {e}")  # Log the error
        return jsonify({"error": "An error occurred while processing your request."}), 500


if __name__ == "__main__":
    app.run(debug=True)