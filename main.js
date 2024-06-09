
const { app, BrowserWindow, Tray, Menu, ipcMain, globalShortcut } = require('electron');
const path = require('path');

let tray = null;
let window = null;
let commandMode = false;

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
  registerShortcuts();
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

function registerShortcuts() {
  let commandKeyPressedTimes = 0;
  globalShortcut.register('Command', () => {
    commandKeyPressedTimes++;
    if (commandKeyPressedTimes === 2) {
      toggleCommandMode();
      commandKeyPressedTimes = 0;
    }
    setTimeout(() => {
      commandKeyPressedTimes = 0;
    }, 300); // reset count after 300ms
  });
}

function toggleCommandMode() {
  commandMode = !commandMode;
  tray.setImage(commandMode ? path.join(__dirname, 'icon-green.png') : path.join(__dirname, 'icon.png'));
  window.webContents.send('command-mode', commandMode);
}
