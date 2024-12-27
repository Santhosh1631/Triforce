function copyTextToClipboard(text, copyIcon) {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      const originalIcon = copyIcon.innerHTML; // Save the original icon
      copyIcon.innerHTML = `
        <path d="M9 16.17l-4.17-4.17-1.41 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />`; // Tick icon
      setTimeout(() => {
        copyIcon.innerHTML = originalIcon; // Restore the original icon after 5 seconds
      }, 5000);
    })
    .catch((err) => console.error("Error copying text:", err));
}

document.getElementById("send-btn").addEventListener("click", sendMessage);

document.getElementById("user-input").addEventListener("keydown", function(event) {
  if (event.key === "Enter") {
    sendMessage();
  }
});

function sendMessage() {
  const userInput = document.getElementById("user-input").value.trim();
  if (userInput) {
    const chatBox = document.getElementById("chat-box");

    // User message
    const userMessage = document.createElement("div");
    userMessage.classList.add("message", "user-message");
    userMessage.textContent = userInput;
    chatBox.appendChild(userMessage);

    document.getElementById("user-input").value = "";

    // Fetch bot response
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

        const botMessage = document.createElement("div");
        botMessage.classList.add("message", "bot-message");

        // Split the response into sections
        const sections = botResponse.split("\n\n");
        sections.forEach((section) => {
          if (section.trim()) {
            // Separate subheading and its content
            const [subheading, ...content] = section.split(":");

            // Add subheading in bold
            const subheadingDiv = document.createElement("div");
            subheadingDiv.style.fontWeight = "bold";
            subheadingDiv.style.marginBottom = "5px";
            subheadingDiv.textContent = subheading.trim();
            botMessage.appendChild(subheadingDiv);

            // Process content to bold any inline headings
            const contentDiv = document.createElement("div");
            const paragraphs = content.join(":").split("\n");
            paragraphs.forEach((paragraph) => {
              const boldHeadingRegex = /^(.*?):(.*)$/; // Matches headings like `Heading: Content`
              const match = boldHeadingRegex.exec(paragraph.trim());
              if (match) {
                const heading = document.createElement("span");
                heading.style.fontWeight = "bold";
                heading.textContent = `${match[1].trim()}: `;

                const bodyText = document.createElement("span");
                bodyText.textContent = match[2].trim();

                const paragraphDiv = document.createElement("div");
                paragraphDiv.appendChild(heading);
                paragraphDiv.appendChild(bodyText);
                contentDiv.appendChild(paragraphDiv);
              } else {
                const paragraphDiv = document.createElement("div");
                paragraphDiv.textContent = paragraph.trim();
                contentDiv.appendChild(paragraphDiv);
              }
            });

            botMessage.appendChild(contentDiv);
          }
        });

        chatBox.appendChild(botMessage);

        // Add icons (Mic and Copy) for each response
        const iconContainer = document.createElement("div");
        iconContainer.classList.add("icon-container");

        // Mic Icon
        const micIcon = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "svg"
        );
        micIcon.setAttribute("class", "icon");
        micIcon.setAttribute("viewBox", "0 0 24 24");
        micIcon.innerHTML = `
          <path d="M3 10v4h4l5 5V5L7 10H3zm13-4a8 8 0 0 1 0 12v-2a6 6 0 0 0 0-8v-2z" />`;
        micIcon.onclick = () => toggleSpeech(botResponse, micIcon);

        // Copy Icon
        const copyIcon = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "svg"
        );
        copyIcon.setAttribute("class", "icon");
        copyIcon.setAttribute("viewBox", "0 0 24 24");
        copyIcon.innerHTML = `
          <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 18H8V7h11v16z" />`;
        copyIcon.onclick = () => copyTextToClipboard(botResponse, copyIcon);

        iconContainer.appendChild(micIcon);
        iconContainer.appendChild(copyIcon);

        chatBox.appendChild(iconContainer);
        chatBox.scrollTop = chatBox.scrollHeight;
      })
      .catch((error) => console.error("Error:", error));
  }
}
function startSpeechRecognition() {
  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = "en-US";  // You can change the language
  recognition.start();
  recognition.onresult = function (event) {
    const query = event.results[0][0].transcript;
    document.getElementById("user-input").value = query;  // Put the recognized text in the input box
    console.log("Recognized: " + query);
  };
  recognition.onerror = function (event) {
    console.error("Speech recognition error", event.error);
  };
}
// Button to start speech recognition
document.getElementById("mic-btn").addEventListener("click", startSpeechRecognition);
// Handle sending user messages and generating bot responses
document.getElementById("send-btn").addEventListener("click", sendMessage);

let isSpeaking = false;  // Flag to track if speech is currently playing
let isPaused = false;    // Flag to track if speech is paused
let utterance = null;    // Holds the current speech synthesis utterance
function toggleSpeech(text, icon) {
  if ("speechSynthesis" in window) {
    // Resume if paused
    if (isPaused) {
      speechSynthesis.resume();
      icon.innerHTML = `
        <path d="M3 10v4h4l5 5V5L7 10H3zm13-4a8 8 0 0 1 0 12v-2a6 6 0 0 0 0-8v-2z" />`; // Active speaker icon
      isPaused = false;
    }
    // Pause if currently speaking
    else if (isSpeaking) {
      speechSynthesis.pause();
      icon.innerHTML = `
        <path d="M3 10v4h4l5 5V5L7 10H3zm16.59 3.41L19 14l-4-4 1.41-1.41L19 12.59l2.59-2.59L23 10l-4 4z" />`; // Muted speaker icon
      isPaused = true;
    }
    // Start speaking
    else {
      utterance = new SpeechSynthesisUtterance(text);

      // Get speech speed from slider, default to 1 if not found
      const speechSpeedSlider = document.getElementById("speed-slider");
      const speechSpeed = speechSpeedSlider ? speechSpeedSlider.value : 1;
      utterance.rate = speechSpeed;

      try {
        speechSynthesis.speak(utterance);
        isSpeaking = true;
        isPaused = false;

        icon.innerHTML = `
          <path d="M3 10v4h4l5 5V5L7 10H3zm13-4a8 8 0 0 1 0 12v-2a6 6 0 0 0 0-8v-2z" />`; // Active speaker icon

        utterance.onend = () => {
          isSpeaking = false;
          isPaused = false;
          icon.innerHTML = `
            <path d="M3 10v4h4l5 5V5L7 10H3zm13-4a8 8 0 0 1 0 12v-2a6 6 0 0 0 0-8v-2z" />`; // Reset to default icon
        };
      } catch (error) {
        console.error("Error with speech synthesis:", error);
      }
    }
  } else {
    console.error("Speech synthesis is not supported in this browser.");
  }
}
