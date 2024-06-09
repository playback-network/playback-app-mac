const { app, BrowserWindow, Tray, Menu, ipcMain } = require('electron');
const path = require('path');

let tray = null;
let window = null;

app.on('ready', () => {
  tray = new Tray(path.join(__dirname, 'icon.png'));
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Quit', click: () => app.quit() }
  ]);
  tray.setToolTip('Voice to Text App');
  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    if (window) {
      window.isVisible() ? window.hide() : window.show();
    }
  });

  createWindow();
});

function createWindow() {
  window = new BrowserWindow({
    width: 300,
    height: 200,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    },
    show: false,
    frame: false,
    resizable: false,
    transparent: true,
    alwaysOnTop: true
  });

  window.loadFile('index.html');
  
  window.on('blur', () => {
    window.hide();
  });
}
