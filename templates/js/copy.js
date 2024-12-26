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