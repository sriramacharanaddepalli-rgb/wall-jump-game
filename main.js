const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow () {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 620, // Match the game container width (600px + some padding)
    height: 480, // Match the game container height (400px + header/footer)
    resizable: false, // Prevent resizing to keep the game aspect ratio
    fullscreenable: false, // Optional: prevents full screen
    autoHideMenuBar: true, // Hide the File/Edit menu bar
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // Preload script is often empty for simple games
      nodeIntegration: false, // Keep security tight
      contextIsolation: true // Keep security tight
    }
  });

  // Load the index.html of the app.
  // This is the line that launches your game!
  mainWindow.loadFile('index.html');

  // Optional: Open the DevTools.
  // mainWindow.webContents.openDevTools();
}

// When Electron is ready, create the window
app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    // On macOS, recreate window if app is clicked in dock
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});