window.electron.startVoiceRecognition();

window.addEventListener('DOMContentLoaded', () => {
  const textBox = document.getElementById('text-box');

  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.interimResults = true;

  recognition.onresult = (event) => {
    const transcript = Array.from(event.results)
      .map(result => result[0])
      .map(result => result.transcript)
      .join('');

    textBox.value = transcript;
  };

  recognition.start();
});
