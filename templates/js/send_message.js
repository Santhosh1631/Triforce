let isSpeaking = false;  // Flag to track if speech is currently playing
let utterance = null;    // Holds the current speech synthesis utterance

// Function to handle text copying to clipboard
function copyTextToClipboard(text, copyIcon) {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      const originalIcon = copyIcon.innerHTML; // Save the original icon
      copyIcon.innerHTML = `<path d="M9 16.17l-4.17-4.17-1.41 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />`; // Tick icon
      setTimeout(() => {
        copyIcon.innerHTML = originalIcon; // Restore the original icon after 5 seconds
      }, 5000); 
    })
    .catch((err) => console.error("Error copying text:", err));
}

// Function to send a message
function sendMessage() {
  const userInput = document.getElementById("user-input").value.trim();
  if (userInput) {
    const chatBox = document.getElementById("chat-box");

    // Create and display the user message
    const userMessage = document.createElement("div");
    userMessage.classList.add("message", "user-message");
    userMessage.textContent = userInput;
    chatBox.appendChild(userMessage);

    document.getElementById("user-input").value = ""; // Clear input field

    // Fetch the bot response from the server
    fetch("http://localhost:5001/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userInput }),
    })
      .then((response) => response.json())
      .then((data) => {
        let botResponse = data.response;

        // Remove all `*` symbols from the response
        botResponse = botResponse.replace(/\*/g, "");

        // Create and display the bot message
        const botMessage = document.createElement("div");
        botMessage.classList.add("message", "bot-message");

        // Process content to bold any inline headings
        const contentDiv = document.createElement("div");
        const paragraphs = botResponse.split("\n");
        paragraphs.forEach((paragraph) => {
          const paragraphDiv = document.createElement("div");
          paragraphDiv.textContent = paragraph.trim();
          contentDiv.appendChild(paragraphDiv);
        });

        botMessage.appendChild(contentDiv);
        chatBox.appendChild(botMessage);

        // Add icons (Mic and Copy) for each response
        const iconContainer = document.createElement("div");
        iconContainer.classList.add("icon-container");

        // Mic Icon for speech
        const micIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        micIcon.setAttribute("class", "icon");
        micIcon.setAttribute("viewBox", "0 0 24 24");
        micIcon.innerHTML = `<path d="M3 10v4h4l5 5V5L7 10H3zm13-4a8 8 0 0 1 0 12v-2a6 6 0 0 0 0-8v-2z" />`;
        micIcon.onclick = () => toggleSpeech(botResponse, botMessage);
        

        // Copy Icon for clipboard copy
        const copyIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        copyIcon.setAttribute("class", "icon");
        copyIcon.setAttribute("viewBox", "0 0 24 24");
        copyIcon.innerHTML = `<path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 18H8V7h11v16z" />`;
        copyIcon.onclick = () => copyTextToClipboard(botResponse, copyIcon);

        iconContainer.appendChild(micIcon);
        iconContainer.appendChild(copyIcon);

        chatBox.appendChild(iconContainer);
        chatBox.scrollTop = chatBox.scrollHeight; // Scroll to the bottom of the chat
      })
      .catch((error) => console.error("Error:", error));
  }
}

// Function to toggle speech and highlight the words
function toggleSpeech(text, messageElement) {
  if ("speechSynthesis" in window) {
    // Stop if currently speaking
    if (isSpeaking) {
      speechSynthesis.cancel();  // Stop the current speech
      isSpeaking = false;
    } else {
      const words = text.split(" ");
      let wordIndex = 0;

      // Function to speak and highlight words one by one
      function speakAndHighlight() {
        if (wordIndex < words.length) {
          const word = words[wordIndex];
          const highlightedText = text.replace(words[wordIndex], `<b>${word}</b>`);

          // Update the bot message to highlight the current word
          messageElement.innerHTML = highlightedText;

          // Create a speech utterance for the current word
          utterance = new SpeechSynthesisUtterance(word);
          speechSynthesis.speak(utterance);

          utterance.onend = function () {
            wordIndex++;
            speakAndHighlight();
          };
        } else {
          isSpeaking = false; // Reset speaking state when all words are spoken
        }
      }

      speakAndHighlight();
      isSpeaking = true; // Mark as speaking
    }
  }
}

// Add event listeners to handle input and send message
document.getElementById("send-btn").addEventListener("click", sendMessage);

document.getElementById("user-input").addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    sendMessage();
  }
});
