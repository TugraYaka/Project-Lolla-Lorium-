const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');

let mainWindow;
function getPlatformWindowOptions() {
  const base = {
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  };

  if (process.platform === 'darwin') {
    // macOS: sistem seviyesi blur
    return {
      ...base,
      titleBarStyle: 'hiddenInset',
      transparent: true,
      vibrancy: 'selection',
      visualEffectState: 'active',
    };
  } else if (process.platform === 'win32') {
    // Windows 10/11: Acrylic blur & Native controls
    return {
      ...base,
      titleBarStyle: 'hidden',
      titleBarOverlay: {
        color: 'rgba(26, 26, 26, 0.9)', 
        symbolColor: '#ffffff'
      },
      transparent: true,
      backgroundMaterial: 'acrylic',
    };
  } else {
    // Linux: saf siyah, standart çerçeve
    return {
      ...base,
      autoHideMenuBar: true,
      backgroundColor: '#000000',
    };
  }
}

function createWindow() {
  const win = new BrowserWindow(getPlatformWindowOptions());

  win.on('closed', () => {
    if (mainWindow === win) {
      mainWindow = null;
    }
  });

  win.loadFile(path.join(__dirname, 'Hub/index.html'));
  if (!mainWindow) mainWindow = win;
}

app.whenReady().then(() => {
  createWindow();

  const template = [
    ...(process.platform === 'darwin' ? [{
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    }] : []),
    {
      label: 'File',
      submenu: [
        {
          label: 'New Window',
          accelerator: 'CmdOrCtrl+N',
          click: () => { createWindow(); }
        },
        process.platform === 'darwin' ? { role: 'close' } : { role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  if (process.platform === 'darwin') {
    const dockMenu = Menu.buildFromTemplate([
      {
        label: 'New Window',
        click() {
          createWindow();
        }
      }
    ]);
    app.dock.setMenu(dockMenu);
  }

  ipcMain.on('open-package', (event, pkgPath, width, height) => {
    const pkgOptions = getPlatformWindowOptions();
    if (width) pkgOptions.width = width;
    if (height) pkgOptions.height = height;
    const pkgWindow = new BrowserWindow(pkgOptions);
    pkgWindow.loadFile(pkgPath);

    // Olayı tetikleyen eski pencereyi (Hub) kapatıyoruz
    const senderWindow = BrowserWindow.fromWebContents(event.sender);
    if (senderWindow && !senderWindow.isDestroyed()) {
      senderWindow.close();
    }
  });

  ipcMain.on('toggle-devtools', (event) => {
    const webContents = event.sender;
    if (webContents.isDevToolsOpened()) {
      webContents.closeDevTools();
    } else {
      webContents.openDevTools();
    }
  });

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});


app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
