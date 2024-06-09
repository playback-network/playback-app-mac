const { ipcRenderer } = require('electron');

window.addEventListener('DOMContentLoaded', () => {
    const banner = document.getElementById('transcription-banner');
    const transcriptionText = document.getElementById('transcription-text');
    const feedbackElement = document.getElementById('shortcut-feedback');
    const shortcutInput = document.getElementById('shortcut');
    let shortcutKeys = [];

    ipcRenderer.on('toggle-playback-mode', (event, isPlaying) => {
        if (isPlaying) {
            banner.style.display = 'block';
        } else {
            banner.style.display = 'none';
        }
    });

    ipcRenderer.on('edit-shortcut', (event, currentShortcut) => {
        shortcutInput.value = currentShortcut;
        shortcutInput.focus();
    });

    ipcRenderer.on('shortcut-feedback', (event, message) => {
        feedbackElement.textContent = message;
    });

    ipcRenderer.on('transcription-update', (event, transcript) => {
        transcriptionText.textContent += ` ${transcript}`;
    });

    shortcutInput.addEventListener('keydown', (event) => {
        event.preventDefault();
        const key = event.key;
        if (!shortcutKeys.includes(key)) {
            shortcutKeys.push(key);
            shortcutInput.value = shortcutKeys.join('+');
        }
    });

    shortcutInput.addEventListener('keyup', () => {
        shortcutKeys = [];
    });

    shortcutInput.addEventListener('blur', () => {
        shortcutKeys = [];
        shortcutInput.value = '';
    });

    document.getElementById('set-shortcut').addEventListener('click', () => {
        const newShortcut = shortcutInput.value;
        if (newShortcut) {
            ipcRenderer.send('update-shortcut', newShortcut);
            shortcutKeys = []; // Clear the shortcut keys array
        }
    });

    ipcRenderer.on('start-transcription', () => {
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                const mediaRecorder = new MediaRecorder(stream);
                mediaRecorder.ondataavailable = event => {
                    const reader = new FileReader();
                    reader.onload = () => {
                        const transcript = reader.result;
                        ipcRenderer.send('transcription-update', transcript);
                    };
                    reader.readAsText(event.data);
                };
                mediaRecorder.start();
            })
            .catch(err => {
                console.error('Error accessing microphone:', err);
            });
    });

    ipcRenderer.on('stop-transcription', () => {
        // Stop transcription logic here
    });

    ipcRenderer.on('check-microphone-permissions', () => {
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(() => {
                ipcRenderer.send('mic-permission-status', true);
            })
            .catch(() => {
                ipcRenderer.send('mic-permission-status', false);
            });
    });
});
