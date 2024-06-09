const { ipcRenderer } = require('electron');

// Display the playback status in the tray menu
ipcRenderer.on('toggle-playback-mode', (event, isPlaying) => {
    const status = document.getElementById('playback-status');
    const soundwaveContainer = document.getElementById('soundwave-container');
    status.style.display = isPlaying ? 'none' : 'block';
    soundwaveContainer.style.display = isPlaying ? 'block' : 'none';
    document.body.classList.toggle('playback-mode', isPlaying);  // Toggle playback mode class
    document.getElementById('transcription-banner').style.display = isPlaying ? 'block' : 'none';
});

// Update transcription text
ipcRenderer.on('transcription-update', (event, transcript) => {
    const transcriptionText = document.getElementById('transcription-text');
    transcriptionText.textContent += ` ${transcript}`;
});
