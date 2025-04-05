let isSpeaking = false; // Flag to track if speech is currently playing
let utterance = null; // Holds the current speech synthesis utterance
let currentHighlight = null; // Tracks the currently highlighted word

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
      body: JSON.stringify({
        user_id: localStorage.getItem('userEmail'), // Replace with actual user ID logic if needed
        message: userInput,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        let botResponse = data.response;

        // Remove all `*` symbols from the response
        botResponse = botResponse.replace(/\*/g, "");

        // Check for code block
        const codeMatch = botResponse.match(/```([\s\S]*?)```/);
        if (codeMatch) {
          const codeContent = codeMatch[1]; // Extract the code block

          // Display code in a styled container
          const codeContainer = document.createElement("div");
          codeContainer.classList.add("code-container");

          // Add a preformatted block for the code
          const codeBlock = document.createElement("pre");
          codeBlock.textContent = codeContent;

          // Add a copy icon
          const copyIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
          copyIcon.setAttribute("class", "icon");
          copyIcon.setAttribute("viewBox", "0 0 24 24");
          copyIcon.innerHTML = `<path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 18H8V7h11v16z" />`;
          copyIcon.classList.add("copy-icon");
          copyIcon.onclick = () => copyTextToClipboard(codeContent, copyIcon);

          codeContainer.appendChild(codeBlock);
          codeContainer.appendChild(copyIcon);
          chatBox.appendChild(codeContainer);
        } else {
          const botMessage = document.createElement("div");
          botMessage.classList.add("message", "bot-message");

          // Split response into sections and display
          const sections = botResponse.split("\n\n");
          sections.forEach((section) => {
            if (section.trim()) {
              const [subheading, ...content] = section.split(":");

              // Add subheading in bold
              const subheadingDiv = document.createElement("div");
              subheadingDiv.style.fontWeight = "bold";
              subheadingDiv.textContent = subheading.trim();
              botMessage.appendChild(subheadingDiv);

              // Add content with headings highlighted
              const contentDiv = document.createElement("div");
              content.join(":").split("\n").forEach((paragraph) => {
                const match = /^(.*?):(.*)$/.exec(paragraph.trim());
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
          if (data.url) {
            const imageContainer = document.createElement("div");
            imageContainer.style.marginTop = "10px";
            imageContainer.style.textAlign = "center";

            const imageElement = document.createElement("img");
            imageElement.src = data.url;
            imageElement.alt = "Related Visual";
            imageElement.style.maxWidth = "80%";
            imageElement.style.borderRadius = "12px";
            imageElement.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.2)";
            imageContainer.appendChild(imageElement);

            chatBox.appendChild(imageContainer);
          }

          // Add mic and copy icons
          const iconContainer = document.createElement("div");
          iconContainer.classList.add("icon-container");

          // Mic Icon
          const micIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
          micIcon.setAttribute("class", "icon");
          micIcon.setAttribute("viewBox", "0 0 24 24");
          micIcon.innerHTML = `<path d="M3 10v4h4l5 5V5L7 10H3zm13-4a8 8 0 0 1 0 12v-2a6 6 0 0 0 0-8v-2z" />`;
          micIcon.onclick = () => toggleSpeech(botResponse, botMessage);

          // Copy Icon
          const copyIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
          copyIcon.setAttribute("class", "icon");
          copyIcon.setAttribute("viewBox", "0 0 24 24");
          copyIcon.innerHTML = `<path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 18H8V7h11v16z" />`;
          copyIcon.onclick = () => copyTextToClipboard(botResponse, copyIcon);

          iconContainer.appendChild(micIcon);
          iconContainer.appendChild(copyIcon);
          chatBox.appendChild(iconContainer);
        }
        chatBox.scrollTop = chatBox.scrollHeight; // Scroll to bottom
      })
      .catch((error) => console.error("Error:", error));
  }
}

// Function to toggle speech with word highlighting
function toggleSpeech(text, messageElement) {
  if ("speechSynthesis" in window) {
    if (isSpeaking) {
      speechSynthesis.cancel();
      isSpeaking = false;
      removeHighlight();
    } else {
      removeHighlight();
      
      // Create a new utterance
      utterance = new SpeechSynthesisUtterance(text);
      
      utterance.onboundary = function(event) {
        if (event.name === 'word') {
          removeHighlight();
          
          const charIndex = event.charIndex;
          const wordLength = event.charLength;
          let currentWord = text.substr(charIndex, wordLength).trim();
          
          if (!currentWord) return;
          
          // Clean the word by removing any punctuation at the end
          currentWord = currentWord.replace(/[.,;!?]$/, '');
          if (!currentWord) return;
          
          // Find and highlight the word in the message element
          highlightWord(messageElement, currentWord);
        }
      };
      
      utterance.onend = function() {
        isSpeaking = false;
        removeHighlight();
      };
      
      speechSynthesis.speak(utterance);
      isSpeaking = true;
    }
  }
}

// Helper function to highlight a word in an element
function highlightWord(element, word) {
  // First remove any existing highlights
  removeHighlight();
  
  // Create a regex to match the word (case insensitive)
  const regex = new RegExp(`\\b${word}\\b`, 'gi');
  
  // Walk through all text nodes in the element
  const treeWalker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );
  
  let node;
  while (node = treeWalker.nextNode()) {
    const nodeText = node.nodeValue;
    const match = regex.exec(nodeText);
    
    if (match) {
      // Split the text node into parts
      const before = nodeText.substring(0, match.index);
      const highlighted = nodeText.substring(match.index, match.index + match[0].length);
      const after = nodeText.substring(match.index + match[0].length);
      
      // Create new nodes
      const beforeNode = document.createTextNode(before);
      const highlightNode = document.createElement('span');
      highlightNode.className = 'speech-highlight';
      highlightNode.textContent = highlighted;
      const afterNode = document.createTextNode(after);
      
      // Replace the original node with new nodes
      const parent = node.parentNode;
      parent.insertBefore(beforeNode, node);
      parent.insertBefore(highlightNode, node);
      parent.insertBefore(afterNode, node);
      parent.removeChild(node);
      
      // Store reference to current highlight
      currentHighlight = highlightNode;
      
      // Scroll to the highlighted word
      highlightNode.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
      
      break;
    }
  }
}

// Helper function to remove highlight
function removeHighlight() {
  if (currentHighlight) {
    const parent = currentHighlight.parentNode;
    const text = currentHighlight.textContent;
    const textNode = document.createTextNode(text);
    parent.replaceChild(textNode, currentHighlight);
    currentHighlight = null;
  }
}

// Add the highlight style
const style = document.createElement('style');
style.textContent = `
  .speech-highlight {
    background-color: rgba(255, 255, 0, 0.5);
    border-radius: 3px;
    transition: background-color 0.3s;
  }
`;
document.head.appendChild(style);

// Add event listeners for input and send button
document.getElementById("send-btn").addEventListener("click", sendMessage);

document.getElementById("user-input").addEventListener("keydown", (event) => {
  if (event.key === "Enter") sendMessage();
});