const { ipcRenderer } = require('electron');

window.addEventListener('DOMContentLoaded', () => {
    const transcriptionText = document.getElementById('transcription-text');
    const soundwaveContainer = document.getElementById('soundwave-container');
    let mediaRecorder;
    let chunks = [];

    ipcRenderer.on('toggle-playback-mode', (event, isPlaying) => {
        if (isPlaying) {
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(stream => {
                    mediaRecorder = new MediaRecorder(stream);
                    mediaRecorder.ondataavailable = event => {
                        chunks.push(event.data);
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
        } else if (mediaRecorder) {
            mediaRecorder.stop();
            mediaRecorder = null;
            chunks = [];
        }
    });

    ipcRenderer.on('transcription-update', (event, transcript) => {
        transcriptionText.textContent += ` ${transcript}`;
    });

    ipcRenderer.on('mic-permission-status', (event, status) => {
        const micStatus = status ? 'Microphone Permissions: ON' : 'Microphone Permissions: OFF';
        document.getElementById('mic-status').textContent = micStatus;
    });
});
