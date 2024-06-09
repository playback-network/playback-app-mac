const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  startVoiceRecognition: () => ipcRenderer.send('start-voice-recognition')
});
