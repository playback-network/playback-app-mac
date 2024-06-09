const { ipcRenderer } = require('electron');

// Display the playback status in the tray menu
ipcRenderer.on('toggle-playback-mode', (event, isPlaying) => {
    const status = document.getElementById('playback-status');
    status.textContent = `Playback is ${isPlaying ? 'ON' : 'OFF'}`;
    document.body.classList.toggle('playback-mode', isPlaying);  // Toggle playback mode class
});

// Exit playback mode and hide the window when pressing Escape
ipcRenderer.on('exit-playback-mode', () => {
    ipcRenderer.send('toggle-playback-mode', false);
});

// Edit the keyboard shortcut
ipcRenderer.on('edit-shortcut', (event, currentShortcut) => {
    const shortcutInput = document.getElementById('shortcut');
    shortcutInput.value = currentShortcut;
    shortcutInput.focus();
});

// Handle shortcut feedback
ipcRenderer.on('shortcut-feedback', (event, message) => {
    const feedback = document.getElementById('shortcut-feedback');
    feedback.textContent = message;
});

// Update transcription text
ipcRenderer.on('transcription-update', (event, transcript) => {
    const transcriptionText = document.getElementById('transcription-text');
    transcriptionText.textContent += ` ${transcript}`;
});

document.getElementById('set-shortcut').addEventListener('click', () => {
    const newShortcut = document.getElementById('shortcut').value;
    if (newShortcut) {
        ipcRenderer.send('update-shortcut', newShortcut);
    }
});

ipcRenderer.on('add-mouse-pointer-effect', () => {
    document.body.classList.add('playback-mode');
});

ipcRenderer.on('remove-mouse-pointer-effect', () => {
    document.body.classList.remove('playback-mode');
});
