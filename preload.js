const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    loadData: () => ipcRenderer.invoke('load-data'),
    saveData: (payload) => ipcRenderer.invoke('save-data', payload),
    getDataPath: () => ipcRenderer.invoke('get-data-path'),
    menuCommand: (command) => ipcRenderer.invoke('menu-command', command)
});
