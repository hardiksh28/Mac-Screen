const { contextBridge, ipcRenderer } = require('electron');

const listeners = (channel) => (cb) => {
  const fn = (_e, ...args) => cb(...args);
  ipcRenderer.on(channel, fn);
  return () => ipcRenderer.removeListener(channel, fn);
};

contextBridge.exposeInMainWorld('diorama', {
  getState: () => ipcRenderer.invoke('state:get'),
  setSetting: (key, value) => ipcRenderer.invoke('settings:set', key, value),
  setInteractive: (on) => ipcRenderer.send('overlay:interactive', !!on),
  saveThemeState: (id, data) => ipcRenderer.send('theme:state', id, data),
  tryTheme: (id) => ipcRenderer.invoke('theme:try', id),
  saveDecorations: (list) => ipcRenderer.send('decor:save', list),
  setDecorating: (on) => ipcRenderer.invoke('decor:edit', !!on),
  openCheckout: () => ipcRenderer.invoke('checkout:open'),
  activateLicense: (key) => ipcRenderer.invoke('license:activate', key),
  deactivateLicense: () => ipcRenderer.invoke('license:deactivate'),
  openApp: (section) => ipcRenderer.invoke('app:open', section),
  openExternal: (url) => ipcRenderer.invoke('external:open', url),
  triggerAction: (name) => ipcRenderer.invoke('action:trigger', name),
  quit: () => ipcRenderer.invoke('app:quit'),
  onState: listeners('state'),
  onAction: listeners('action'),
  onWindows: listeners('windows'),
  onNavigate: listeners('navigate')
});
