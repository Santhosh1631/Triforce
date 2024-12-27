// Initialize variables for speech synthesis
let isSpeaking = false;
let isPaused = false;
let utterance = null;

// Function to toggle speech synthesis (speak or pause/resume)
function toggleSpeech(text, icon) {
  if ("speechSynthesis" in window) {
    // Resume if paused
    if (isPaused) {
      speechSynthesis.resume();
      icon.innerHTML = `🎙️`; // Active speaker icon
      isPaused = false;
    }
    // Pause if currently speaking
    else if (isSpeaking) {
      speechSynthesis.pause();
      icon.innerHTML = `🔇`; // Muted speaker icon
      isPaused = true;
    }
    // Start speaking
    else {
      utterance = new SpeechSynthesisUtterance(text);

      // Set speech speed from slider, default to 1
      const speechSpeedSlider = document.getElementById("speed-slider");
      const speechSpeed = speechSpeedSlider ? speechSpeedSlider.value : 1;
      utterance.rate = speechSpeed;

      // Speak the text
      speechSynthesis.speak(utterance);
      isSpeaking = true; // Mark as speaking
      icon.innerHTML = `🎙️`; // Active speaker icon
    }

    utterance.onend = function () {
      isSpeaking = false; // Reset speaking state when speech ends
      icon.innerHTML = `🎙️`; // Reset icon to default
    };
  }
}

// Handling Speech Recognition (for Mic button)
const micBtn = document.getElementById("mic-btn");

let isRecognizing = false; // Track the recognition state

if ("webkitSpeechRecognition" in window) {
  const recognition = new webkitSpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;

  recognition.onstart = function () {
    micBtn.textContent = "🔴"; // Show red mic when recording
    isRecognizing = true;
  };

  recognition.onend = function () {
    micBtn.textContent = "🎙️"; // Show normal mic when stopped
    isRecognizing = false;
  };

  recognition.onresult = function (event) {
    let transcript = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript;
    }
    // Send the transcript to the input box
    document.getElementById("user-input").value = transcript;
  };

  micBtn.addEventListener("click", function () {
    // Toggle recognition state
    if (isRecognizing) {
      recognition.stop(); // Stop recognition
    } else {
      recognition.start(); // Start recognition
    }
  });
} else {
  console.log("Speech recognition is not supported in this browser.");
}
