let isGeneratingResponse = false; // Flag to track if response is being generated
let isSpeaking = false; // Flag to track if speech is currently playing
let utterance = null; // Holds the current speech synthesis utterance
let wordIndex = 0; // Track which word is currently being spoken

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

// Function to display the bot's message smoothly
function displayMessage(message) {
  const chatBox = document.getElementById("chat-box");

  // Check if the last bot message is identical to prevent duplicates
  const botMessages = chatBox.getElementsByClassName("bot-message");
  if (
    botMessages.length > 0 &&
    botMessages[botMessages.length - 1].textContent === message
  ) {
    return; // Exit if the message is a duplicate
  }

  // Create bot message container and append to chat box
  const botMessage = document.createElement("div");
  botMessage.classList.add("message", "bot-message");
  chatBox.appendChild(botMessage);

  let index = 0;
  const typingSpeed = 30; // Increased typing speed (milliseconds)

  function typeMessage() {
    if (index < message.length) {
      botMessage.textContent += message[index]; // Append one character at a time
      index++;
      setTimeout(typeMessage, typingSpeed); // Delay for typing effect
    }
  }

  typeMessage(); // Start typing effect
}

// Function to send a message
function sendMessage() {
  const userInput = document.getElementById("user-input").value.trim();
  const sendBtn = document.getElementById("send-btn"); // Get the button reference
  if (userInput && !isGeneratingResponse) {
    const chatBox = document.getElementById("chat-box");

    // Create and display the user message
    const userMessage = document.createElement("div");
    userMessage.classList.add("message", "user-message");
    userMessage.textContent = userInput;
    chatBox.appendChild(userMessage);

    document.getElementById("user-input").value = ""; // Clear input field

    // Change button text to "Stop" and disable the send button while generating response
    sendBtn.textContent = "Stop";
    sendBtn.disabled = true;
    isGeneratingResponse = true;

    // Fetch the bot response from the server
    fetch("http://localhost:5001/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: "unique_user_id", // Replace with actual user ID logic if needed
        message: userInput,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        let botResponse = data.response;

        // Remove all `*` symbols from the response
        botResponse = botResponse.replace(/\*/g, "");

        // Display the bot's message smoothly
        displayMessage(botResponse); // Call the function for typing effect

        // Create the icon container only if needed
        const iconContainer = document.createElement("div");
        iconContainer.classList.add("icon-container");

        // Mic Icon
        const micIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        micIcon.setAttribute("class", "icon");
        micIcon.setAttribute("viewBox", "0 0 24 24");
        micIcon.innerHTML = `<path d="M3 10v4h4l5 5V5L7 10H3zm13-4a8 8 0 0 1 0 12v-2a6 6 0 0 0 0-8v-2z" />`;
        micIcon.onclick = () => toggleSpeech(botResponse, micIcon);

        // Copy Icon
        const copyIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        copyIcon.setAttribute("class", "icon");
        copyIcon.setAttribute("viewBox", "0 0 24 24");
        copyIcon.innerHTML = `<path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 18H8V7h11v16z" />`;
        copyIcon.onclick = () => copyTextToClipboard(botResponse, copyIcon);

        // Append icons only if they have valid content
        if (micIcon && copyIcon) {
          iconContainer.appendChild(micIcon);
          iconContainer.appendChild(copyIcon);
          chatBox.appendChild(iconContainer); // Append the icon container
        }

<<<<<<< HEAD
        // Scroll to the bottom after adding new message
        chatBox.scrollTop = chatBox.scrollHeight;

        // Re-enable the button after response generation
        isGeneratingResponse = false;

        // Change the button text back to "Start" after response is complete
        sendBtn.textContent = "Start";
        sendBtn.disabled = false;
=======
        // Display the image if it's available
        if (data.image_url) {
          const image = document.createElement("img");
          image.src = data.image_url;
          image.alt = "Related to your query";
          image.style.maxWidth = "100%";
          chatBox.appendChild(image);
        }

        chatBox.scrollTop = chatBox.scrollHeight; // Scroll to bottom
>>>>>>> 665b6b71d56e06675fb18de07e4eb6c71a101d06
      })
      .catch((error) => {
        console.error("Error:", error);

        // Re-enable the send button if an error occurs
        sendBtn.textContent = "Start";
        sendBtn.disabled = false;
        isGeneratingResponse = false;
      });
  } else if (isGeneratingResponse) {
    // If generating response is in progress, stop it
    isGeneratingResponse = false;
    sendBtn.textContent = "Start";
    sendBtn.disabled = false;
    // Stop the speech if it's playing
    if (isSpeaking) {
      speechSynthesis.cancel();
      isSpeaking = false;
    }
  }
}

// Function to toggle speech and highlight words
function toggleSpeech(text, micIcon) {
  if ("speechSynthesis" in window) {
    const words = text.split(" "); // Split the text into words
    wordIndex = 0; // Reset word index for new speech

    if (isSpeaking) {
      // Stop the speech
      speechSynthesis.cancel();
      isSpeaking = false;

      // Update mic icon to indicate that speaking has stopped
      micIcon.classList.remove("speaking"); // Re-enable the mic icon after speech ends
    } else {
      function speakAndHighlight() {
        if (wordIndex < words.length) {
          const word = words[wordIndex];
          const highlightedText = text.replace(words[wordIndex], `<b>${word}</b>`);

          // Dynamically select the last bot message in the chat box
          const chatBox = document.getElementById("chat-box");
          const botMessages = chatBox.getElementsByClassName("bot-message");
          const lastBotMessage = botMessages[botMessages.length - 1]; // Select the last one

          // Update the last bot message to highlight the current word
          lastBotMessage.innerHTML = highlightedText; // Update message to highlight the current word

          // Create a new utterance for the current word
          utterance = new SpeechSynthesisUtterance(word);
          speechSynthesis.speak(utterance);

          // Proceed to the next word after the current one is spoken
          utterance.onend = () => {
            wordIndex++;
            speakAndHighlight(); // Call function recursively for the next word
          };
        } else {
          isSpeaking = false;
          micIcon.classList.remove("speaking"); // Re-enable the mic icon after speech ends

          // Change button text back to "Start" after speaking is done
          document.getElementById("send-btn").textContent = "Start";
          document.getElementById("send-btn").disabled = false;
        }
      }

      // Start speaking and highlighting
      speakAndHighlight();
      isSpeaking = true;

      // Update mic icon to indicate that speech is ongoing
      micIcon.classList.add("speaking"); // Indicate that speech is happening
    }
  }
}

// Add event listeners for input and send button
document.getElementById("send-btn").addEventListener("click", sendMessage);

document.getElementById("user-input").addEventListener("keydown", (event) => {
  if (event.key === "Enter") sendMessage();
});

// Prevent unwanted blue outline by focusing on specific input elements
document.getElementById("user-input").addEventListener("focus", (event) => {
  event.target.style.outline = "none";
});