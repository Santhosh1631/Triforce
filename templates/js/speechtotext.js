// Check if the browser supports speech recognition
if ("webkitSpeechRecognition" in window) {
  // Initialize the speech recognition object
  const recognition = new webkitSpeechRecognition();
  
  // Set language for recognition
  recognition.lang = "en-US"; // You can change this to another language if needed
  recognition.continuous = false; // Stop recognition after one phrase
  recognition.interimResults = false; // Don't show interim results

  // When the speech recognition result is available
  recognition.onresult = (event) => {
    // Get the recognized text (first result from the speech recognition)
    const userInput = event.results[0][0].transcript;

    // Set the text input to the recognized text
    document.getElementById("user-input").value = userInput;

    // Optionally, automatically send the message after recognition
    document.getElementById("send-btn").click();
  };

  // Handle any errors that occur during speech recognition
  recognition.onerror = (event) => {
    console.error("Speech recognition error", event.error);
  };

  // Start speech recognition when the microphone button is clicked
  document.getElementById("mike-btn").addEventListener("click", () => {
    recognition.start(); // Start the speech recognition
  });
} else {
  console.error("Speech recognition is not supported in this browser.");
}
