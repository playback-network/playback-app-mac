const { app, BrowserWindow, Tray, Menu, globalShortcut, ipcMain, nativeImage, shell } = require('electron');
const path = require('path');
const Store = require('electron-store');

const store = new Store();
let mainWindow;
let tray;
let isPlaying = false;
let playbackShortcut = store.get('playbackShortcut', 'Escape');  // Load the saved shortcut or default to 'Escape'
let micPermissionGranted = false;

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
        autoHideMenuBar: true
    });

    mainWindow.loadFile('index.html');

    mainWindow.on('closed', function () {
        mainWindow = null;
    });

    mainWindow.on('show', () => {
        updateWindowIcon();
    });

    mainWindow.on('hide', () => {
        updateWindowIcon();
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
    registerGlobalShortcut();
    mainWindow.webContents.once('did-finish-load', () => {
        mainWindow.webContents.send('check-microphone-permissions');
        mainWindow.webContents.send('edit-shortcut', playbackShortcut); // Send the saved shortcut to the renderer
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
    tray = new Tray(path.join(__dirname, 'icon.png'));
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
                if (mainWindow && mainWindow.webContents) {
                    mainWindow.webContents.send('edit-shortcut', playbackShortcut);
                }
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
            icon: nativeImage.createFromPath(path.join(__dirname, micPermissionGranted ? 'green-circle.png' : 'red-circle.png'))
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
        mainWindow.hide();
        mainWindow.webContents.send('start-transcription');
        mainWindow.webContents.send('add-mouse-pointer-effect');
    } else {
        mainWindow.show();
        mainWindow.webContents.send('stop-transcription');
        mainWindow.webContents.send('remove-mouse-pointer-effect');
    }
}

function updateTrayIcon() {
    let iconPath = isPlaying ? 'icon-green.png' : 'icon.png';
    tray.setImage(path.join(__dirname, iconPath));
    tray.setToolTip(`Playback is ${isPlaying ? 'ON' : 'OFF'}`);
}

function updateWindowIcon() {
    if (!mainWindow) return;

    const icon = nativeImage.createFromPath(path.join(__dirname, isPlaying ? 'icon-green.png' : 'icon.png'));
    mainWindow.setIcon(icon);
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
        event.reply('shortcut-feedback', 'Shortcut updated successfully!');
    } else {
        event.reply('shortcut-feedback', 'Invalid shortcut key combination.');
    }
});

ipcMain.on('mic-permission-status', (event, status) => {
    micPermissionGranted = status;
    updateTrayMenu();
});

function validateShortcut(shortcut) {
    // Add validation logic for the shortcut
    return true; // Placeholder for actual validation logic
}
