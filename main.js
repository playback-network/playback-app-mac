const { app, BrowserWindow, Tray, Menu, globalShortcut, ipcMain, nativeImage, shell, dialog } = require('electron');
const path = require('path');
const Store = require('electron-store');

const store = new Store();
let mainWindow;
let tray;
let isPlaying = false;
let playbackShortcut = store.get('playbackShortcut', 'Ctrl+Space');  // Default to 'Ctrl+Space'
let micPermissionGranted = false;
let popup;

function createWindow() {
    const { x, y } = tray.getBounds();
    const windowX = x - 250 + (tray.getBounds().width / 2);
    const windowY = y + tray.getBounds().height;

    mainWindow = new BrowserWindow({
        width: 600,
        height: 400,
        x: windowX,
        y: windowY,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        },
        title: "Playback",
        backgroundColor: "#333",
        autoHideMenuBar: true,
        show: false  // Start hidden
    });

    mainWindow.loadFile('index.html');

    mainWindow.on('closed', function () {
        mainWindow = null;
    });

    mainWindow.webContents.on('before-input-event', (event, input) => {
        if (input.key === playbackShortcut) {
            togglePlaybackMode();
        }
    });
}

app.on('ready', () => {
    createTray();
    createWindow();
    showLoadingPopup();
    registerGlobalShortcut();
    mainWindow.webContents.once('did-finish-load', () => {
        mainWindow.webContents.send('check-microphone-permissions');
    });
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', function () {
    if (mainWindow === null) {
        createWindow();
    }
});

app.on('will-quit', () => {
    globalShortcut.unregisterAll();
});

function createTray() {
    const trayIcon = nativeImage.createFromPath(path.join(__dirname, 'icon_menu.png')).resize({ width: 24, height: 24 });
    tray = new Tray(trayIcon);
    updateTrayMenu();
}

function updateTrayMenu() {
    const micStatus = micPermissionGranted ? 'Microphone Permissions: ON' : 'Microphone Permissions: OFF';
    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Toggle Playback Mode',
            click: () => {
                togglePlaybackMode();
            }
        },
        {
            label: `Set Shortcut (Current: ${playbackShortcut})`,
            click: () => {
                setShortcut();
            }
        },
        {
            label: 'Connect with us on X',
            click: () => {
                shell.openExternal('https://x.com/playbacknet');
            }
        },
        { type: 'separator' },
        {
            label: micStatus,
            icon: nativeImage.createFromPath(path.join(__dirname, micPermissionGranted ? 'green-circle.png' : 'red-circle.png')).resize({ width: 16, height: 16 })
        },
        { role: 'quit' }
    ]);

    tray.setToolTip('Electron App');
    tray.setContextMenu(contextMenu);
}

function togglePlaybackMode() {
    if (!mainWindow || !mainWindow.webContents) return;

    isPlaying = !isPlaying;
    mainWindow.webContents.send('toggle-playback-mode', isPlaying);
    updateTrayIcon();
    updateTrayMenu();
    if (isPlaying) {
        mainWindow.show();
    } else {
        mainWindow.hide();
    }
}

function updateTrayIcon() {
    let iconPath = isPlaying ? 'icon_menu_green.png' : 'icon_menu.png';
    const trayIcon = nativeImage.createFromPath(path.join(__dirname, iconPath)).resize({ width: 24, height: 24 });
    tray.setImage(trayIcon);
    tray.setToolTip(`Playback is ${isPlaying ? 'ON' : 'OFF'}`);
}

function setShortcut() {
    const input = dialog.showMessageBoxSync({
        type: 'question',
        buttons: ['OK', 'Cancel'],
        defaultId: 0,
        title: 'Set Shortcut',
        message: 'Enter new shortcut:',
        inputType: 'text'
    });

    if (input) {
        ipcMain.emit('update-shortcut', null, input);
    }
}

function registerGlobalShortcut() {
    globalShortcut.unregisterAll();
    globalShortcut.register(playbackShortcut, () => {
        togglePlaybackMode();
    });
}

ipcMain.on('update-shortcut', (event, newShortcut) => {
    if (validateShortcut(newShortcut)) {
        playbackShortcut = newShortcut;
        store.set('playbackShortcut', newShortcut);  // Save the shortcut
        registerGlobalShortcut();
        updateTrayMenu();
        if (mainWindow && mainWindow.webContents) {
            mainWindow.webContents.send('update-shortcut-display', newShortcut);  // Send the new shortcut to the renderer
        }
    } else {
        if (event) {
            event.reply('shortcut-feedback', 'Invalid shortcut key combination.');
        }
    }
});

ipcMain.on('mic-permission-status', (event, status) => {
    micPermissionGranted = status;
    updateTrayMenu();
    if (!micPermissionGranted) {
        requestMicPermissions();
    }
});

function requestMicPermissions() {
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(() => {
            micPermissionGranted = true;
            mainWindow.webContents.send('mic-permission-status', true);
        })
        .catch(() => {
            micPermissionGranted = false;
            mainWindow.webContents.send('mic-permission-status', false);
        });
}

function showLoadingPopup() {
    popup = new BrowserWindow({
        width: 300,
        height: 200,
        frame: false,
        alwaysOnTop: true,
        transparent: true,
        webPreferences: {
            nodeIntegration: true
        }
    });

    popup.loadFile('popup.html');

    setTimeout(() => {
        popup.close();
    }, 1000);
}

function validateShortcut(shortcut) {
    // Add validation logic for the shortcut
    return true; // Placeholder for actual validation logic
}
