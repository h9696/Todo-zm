const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function getDataPath() {
    return path.join(app.getPath('userData'), 'tasks.json');
}

function ensureDataFile() {
    const currentDataPath = getDataPath();
    const dir = path.dirname(currentDataPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    const legacyPath = path.join(__dirname, 'storage', 'tasks.json');
    if (!fs.existsSync(currentDataPath) && fs.existsSync(legacyPath)) {
        fs.copyFileSync(legacyPath, currentDataPath);
        return;
    }

    if (!fs.existsSync(currentDataPath)) {
        fs.writeFileSync(currentDataPath, JSON.stringify({ tasks: [], categories: [] }, null, 2), 'utf8');
    }
}

function loadData() {
    try {
        ensureDataFile();
        const raw = fs.readFileSync(getDataPath(), 'utf8');
        const parsed = JSON.parse(raw || '{}');

        if (Array.isArray(parsed)) {
            return { tasks: parsed, categories: [] };
        }

        return {
            tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
            categories: Array.isArray(parsed.categories) ? parsed.categories : []
        };
    } catch (error) {
        console.error('加载任务失败:', error);
        return { tasks: [], categories: [] };
    }
}

function saveData(payload) {
    try {
        ensureDataFile();
        const normalized = {
            tasks: Array.isArray(payload?.tasks) ? payload.tasks : [],
            categories: Array.isArray(payload?.categories) ? payload.categories : []
        };
        fs.writeFileSync(getDataPath(), JSON.stringify(normalized, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('保存任务失败:', error);
        return false;
    }
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1100,
        height: 760,
        minWidth: 880,
        minHeight: 560,
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
        title: '待办清单'
    });

    mainWindow.setMenuBarVisibility(false);
    mainWindow.loadFile('index.html');
}

ipcMain.handle('load-data', () => loadData());
ipcMain.handle('save-data', (_, payload) => saveData(payload));
ipcMain.handle('get-data-path', () => getDataPath());

ipcMain.handle('menu-command', (_, command) => {
    if (!mainWindow) return;

    switch (command) {
        case 'quit-app':
            app.quit();
            break;
        case 'minimize':
            mainWindow.minimize();
            break;
        case 'close-window':
            mainWindow.close();
            break;
        case 'reload':
            mainWindow.reload();
            break;
        case 'toggle-devtools':
            mainWindow.webContents.toggleDevTools();
            break;
        case 'undo':
            mainWindow.webContents.undo();
            break;
        case 'redo':
            mainWindow.webContents.redo();
            break;
        case 'cut':
            mainWindow.webContents.cut();
            break;
        case 'copy':
            mainWindow.webContents.copy();
            break;
        case 'paste':
            mainWindow.webContents.paste();
            break;
        case 'select-all':
            mainWindow.webContents.selectAll();
            break;
        default:
            break;
    }
});

app.whenReady().then(() => {
    ensureDataFile();
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
