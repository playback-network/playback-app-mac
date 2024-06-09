
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  startVoiceRecognition: () => ipcRenderer.send('start-voice-recognition'),
  onCommandMode: (callback) => ipcRenderer.on('command-mode', callback)
});
