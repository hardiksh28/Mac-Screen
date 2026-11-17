const {
  app,
  BrowserWindow,
  Tray,
  Menu,
  ipcMain,
  screen,
  shell,
  nativeImage,
  powerMonitor,
  globalShortcut,
  dialog
} = require('electron');
const { pathToFileURL } = require('url');
const fs = require('fs');
const path = require('path');
const catalog = require('../shared/catalog');
const license = require('./license');
const config = require('./config');
const windowWatcher = require('./windows');
const art = require('./art');

const isMac = process.platform === 'darwin';
const DEV = process.argv.includes('--dev');
const RENDERER = path.join(__dirname, '..', 'renderer');
const BAND_HEIGHT = 440; // height of the toy layer that sits on top of the Dock
const PREVIEW_SECONDS = 90;

/* ------------------------------------------------------------------ settings */
const DEFAULTS = {
  theme: 'winter',
  wallpaper: true,
  toys: true,
  sound: true,
  fps: 30,
  cursorEffects: true,
  overApps: false, // false: toys and snow step aside while you're working in an app
  pauseOnBattery: true,
  launchAtLogin: false,
  onboarded: false,
  themeState: {},
  weather: { ...catalog.defaultWeather },
  decorations: [],
  scenes: {},
  customWallpaper: null
};
const WALLPAPER_DIR = path.join(__dirname, '..', '..', 'assets', 'wallpapers');
const IMG_EXT = ['jpg', 'jpeg', 'png', 'webp'];
/* Painted scenes that actually have artwork in assets/wallpapers/<theme>-<scene>.<ext> */
function sceneFile(themeId, sceneId) {
  for (const ext of IMG_EXT) {
    const f = path.join(WALLPAPER_DIR, `${themeId}-${sceneId}.${ext}`);
    if (fs.existsSync(f)) return f;
  }
  return null;
}
function availableScenes(themeId) {
  return (catalog.get(themeId).scenes || []).filter((sc) => sceneFile(themeId, sc.id)).map((sc) => sc.id);
}
function customFile() {
  return settings.customWallpaper && fs.existsSync(settings.customWallpaper) ? settings.customWallpaper : null;
}
function resolveScene(themeId) {
  const want = (settings.scenes || {})[themeId];
  const avail = availableScenes(themeId);
  const withArt = (id, file, bust) => {
    let analysis = null;
    try {
      analysis = art.analyse(file);
    } catch {}
    return { id, url: pathToFileURL(file).href + (bust ? '?v=' + Math.round(fs.statSync(file).mtimeMs) : ''), analysis };
  };
  if (want === 'custom' && pro && customFile()) return withArt('custom', customFile(), true);
  if (want === 'drawn') return { id: 'drawn', url: null };
  const id = avail.includes(want) ? want : avail[0];
  return id ? withArt(id, sceneFile(themeId, id)) : { id: 'drawn', url: null };
}
const settingsFile = () => path.join(app.getPath('userData'), 'settings.json');
let settings = { ...DEFAULTS };
function loadSettings() {
  try {
    settings = { ...DEFAULTS, ...JSON.parse(fs.readFileSync(settingsFile(), 'utf8')) };
    settings.weather = { ...catalog.defaultWeather, ...(settings.weather || {}) };
    if (!Array.isArray(settings.decorations)) settings.decorations = [];
  } catch {
    settings = { ...DEFAULTS };
  }
}
let saveTimer = null;
function saveSettings() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      fs.mkdirSync(path.dirname(settingsFile()), { recursive: true });
      fs.writeFileSync(settingsFile(), JSON.stringify(settings, null, 2));
    } catch (e) {
      console.error('Could not save settings', e);
    }
  }, 400);
}

/* ------------------------------------------------------------------ state */
let pro = false;
let previewTheme = null;
let previewTimer = null;
let previewEndsAt = 0;
let paused = false;
let decorating = false;
let userPaused = false;
let tray = null;
let appWin = null;
let overlayWin = null;
const wallpaperWins = new Map(); // displayId -> BrowserWindow

const canUse = (id) => pro || catalog.get(id).free;
const activeTheme = () => previewTheme || (canUse(settings.theme) ? settings.theme : 'winter');
const weatherType = () => catalog.resolveWeather(settings.weather.type, activeTheme());
const weatherOn = () => weatherType() !== 'off';
const weatherAllowed = (type) => pro || !!(catalog.weatherTypes.find((t) => t.id === type) || {}).free;

function publicState(role, win) {
  const primary = screen.getPrimaryDisplay();
  const b = primary.bounds;
  const wa = primary.workArea;
  const bottomInset = Math.max(0, b.y + b.height - (wa.y + wa.height));
  return {
    role,
    settings,
    pro,
    theme: activeTheme(),
    previewing: !!previewTheme,
    previewEndsAt,
    paused,
    decorating,
    isPrimary: !win || win.__primary !== false,
    windowSnow: windowWatcher.available(),
    scene: resolveScene(activeTheme()),
    sceneOptions: Object.fromEntries(catalog.themes.map((t) => [t.id, availableScenes(t.id)])),
    hasCustomWallpaper: !!customFile(),
    groundInset: bottomInset > 0 ? bottomInset : 6,
    platform: process.platform,
    version: app.getVersion(),
    priceLabel: config.PRICE_LABEL,
    storeConfigured: config.isConfigured(),
    storeMode: config.MODE,
    supportEmail: config.SUPPORT_EMAIL,
    licenseInfo: license.info(),
    loginItemSupported: isMac || process.platform === 'win32',
    wallpaperSupported: isMac || process.platform === 'linux'
  };
}

function broadcast() {
  for (const w of BrowserWindow.getAllWindows()) {
    if (!w.isDestroyed()) w.webContents.send('state', publicState(w.__role, w));
  }
  rebuildTray();
}

/* ------------------------------------------------------------------ windows */
const commonPrefs = () => ({
  preload: path.join(__dirname, '..', 'preload.js'),
  contextIsolation: true,
  nodeIntegration: false,
  sandbox: true,
  backgroundThrottling: false,
  autoplayPolicy: 'no-user-gesture-required',
  spellcheck: false
});

function createWallpaper(display) {
  const { x, y, width, height } = display.bounds;
  const win = new BrowserWindow({
    x,
    y,
    width,
    height,
    type: isMac || process.platform === 'linux' ? 'desktop' : undefined,
    frame: false,
    show: false,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    focusable: false,
    skipTaskbar: true,
    hasShadow: false,
    enableLargerThanScreen: true,
    roundedCorners: false,
    backgroundColor: '#000000',
    webPreferences: commonPrefs()
  });
  win.__role = 'wallpaper';
  win.__primary = display.id === screen.getPrimaryDisplay().id;
  win.setIgnoreMouseEvents(true);
  if (isMac) win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: false });
  win.loadFile(path.join(RENDERER, 'wallpaper.html'));
  win.once('ready-to-show', () => win.showInactive());
  return win;
}

function overlayBounds() {
  const d = screen.getPrimaryDisplay();
  const b = d.bounds;
  const full = weatherOn() || decorating || (catalog.get(activeTheme()).overlayFull && settings.cursorEffects);
  const h = full ? b.height : Math.min(BAND_HEIGHT, b.height);
  return { x: b.x, y: b.y + b.height - h, width: b.width, height: h };
}

function createOverlay() {
  const win = new BrowserWindow({
    ...overlayBounds(),
    transparent: true,
    backgroundColor: '#00000000',
    frame: false,
    show: false,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    focusable: false,
    skipTaskbar: true,
    hasShadow: false,
    acceptFirstMouse: true,
    enableLargerThanScreen: true,
    roundedCorners: false,
    alwaysOnTop: true,
    webPreferences: commonPrefs()
  });
  win.__role = 'overlay';
  // 'status' sits above the Dock so toys can stand on it.
  win.setAlwaysOnTop(true, isMac ? 'status' : 'screen-saver');
  if (isMac) win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: false });
  win.setIgnoreMouseEvents(true, { forward: true });
  win.loadFile(path.join(RENDERER, 'overlay.html'));
  win.once('ready-to-show', () => win.showInactive());
  // A reloading page forgets that it was catching the mouse, so always go back to
  // click-through; otherwise the invisible layer would block every click on screen.
  win.webContents.on('did-start-loading', () => {
    if (!win.isDestroyed()) win.setIgnoreMouseEvents(true, { forward: true });
  });
  // a fresh page needs the latest windows / Dock / away info
  win.webContents.on('did-finish-load', () => setTimeout(resendWindows, 300));
  return win;
}

function rebuildLayers() {
  // wallpapers: one per display
  const displays = screen.getAllDisplays();
  const wantIds = new Set(settings.wallpaper ? displays.map((d) => d.id) : []);
  for (const [id, w] of wallpaperWins) {
    if (!wantIds.has(id) || w.isDestroyed()) {
      if (!w.isDestroyed()) w.destroy();
      wallpaperWins.delete(id);
    }
  }
  for (const d of displays) {
    if (!wantIds.has(d.id)) continue;
    const existing = wallpaperWins.get(d.id);
    if (existing) existing.setBounds(d.bounds);
    else wallpaperWins.set(d.id, createWallpaper(d));
  }
  // toy overlay on the primary display
  if (settings.toys || weatherOn() || decorating) {
    if (!overlayWin || overlayWin.isDestroyed()) overlayWin = createOverlay();
    else overlayWin.setBounds(overlayBounds());
  } else if (overlayWin && !overlayWin.isDestroyed()) {
    overlayWin.destroy();
    overlayWin = null;
  }
  updateWindowWatcher();
}

function updateWindowWatcher() {
  // runs whenever the toy layer is up: it reports windows (for snow), the app in front
  // (so toys can step aside) and the Dock's icon area (so snow only sits on the icons)
  if (overlayWin && !overlayWin.isDestroyed()) windowWatcher.start(sendWindows);
  else windowWatcher.stop();
}
let lastWindows = '';
let lastInfo = null;
let away = false;
const FINDER = 'com.apple.finder';
function computeAway(info) {
  if (settings.overApps || decorating || !info || !info.front) return false;
  if (info.pid === process.pid || info.front.toLowerCase() === FINDER) return false;
  const b = screen.getPrimaryDisplay().bounds;
  // only when the app in front actually has a window on this screen
  return (info.w || []).some((w) => w.f && w.x < b.x + b.width && w.x + w.w > b.x && w.y < b.y + b.height && w.y + w.h > b.y);
}
function sendWindows(info) {
  lastInfo = info;
  if (!overlayWin || overlayWin.isDestroyed()) return;
  const ob = overlayWin.getBounds();
  const snowOnWindows = weatherOn() && settings.weather.onWindows !== false;
  const msg = {
    windows: snowOnWindows
      ? (info.w || [])
          .filter((w) => w.x < ob.x + ob.width && w.x + w.w > ob.x && w.y < ob.y + ob.height && w.y + w.h > ob.y)
          .map((w) => ({ id: w.id, x: w.x - ob.x, y: w.y - ob.y, w: w.w, h: w.h }))
      : [],
    away: computeAway(info)
  };
  if (info.dock !== undefined) msg.dock = info.dock ? { x: info.dock.x - ob.x, y: info.dock.y - ob.y, w: info.dock.w, h: info.dock.h, how: info.dock.how } : null;
  away = msg.away;
  const json = JSON.stringify(msg);
  if (json === lastWindows) return;
  lastWindows = json;
  overlayWin.webContents.send('windows', msg);
}
function resendWindows() {
  lastWindows = '';
  if (lastInfo) sendWindows(lastInfo);
}

function reloadLayers() {
  rebuildLayers();
  updateWindowWatcher();
  lastWindows = '';
  for (const w of wallpaperWins.values()) if (!w.isDestroyed()) w.reload();
  if (overlayWin && !overlayWin.isDestroyed()) overlayWin.reload();
  broadcast();
}

function openApp(section) {
  if (appWin && !appWin.isDestroyed()) {
    if (section) appWin.webContents.send('navigate', section);
    appWin.show();
    appWin.focus();
    return;
  }
  appWin = new BrowserWindow({
    width: 1120,
    height: 780,
    minWidth: 920,
    minHeight: 640,
    title: 'Desk Diorama',
    titleBarStyle: isMac ? 'hiddenInset' : 'default',
    trafficLightPosition: { x: 18, y: 18 },
    // translucent sidebar on macOS
    ...(isMac ? { vibrancy: 'sidebar', visualEffectState: 'active', backgroundColor: '#00000000' } : { backgroundColor: '#0c0e1b' }),
    show: false,
    webPreferences: commonPrefs()
  });
  appWin.__role = 'app';
  appWin.loadFile(path.join(RENDERER, 'app.html'), section ? { hash: section } : undefined);
  appWin.once('ready-to-show', () => appWin.show());
  if (isMac) app.dock.show();
  appWin.on('closed', () => {
    appWin = null;
    if (isMac) app.dock.hide();
  });
}

/* ------------------------------------------------------------------ theme preview */
function startPreview(id) {
  if (canUse(id)) {
    setSetting('theme', id);
    return;
  }
  clearTimeout(previewTimer);
  previewTheme = id;
  previewEndsAt = Date.now() + PREVIEW_SECONDS * 1000;
  previewTimer = setTimeout(endPreview, PREVIEW_SECONDS * 1000);
  reloadLayers();
}
function endPreview() {
  if (!previewTheme) return;
  clearTimeout(previewTimer);
  previewTheme = null;
  previewEndsAt = 0;
  reloadLayers();
  if (!pro) openApp('pro');
}

function setDecorating(on) {
  if (decorating === on) return;
  decorating = on;
  rebuildLayers();
  resendWindows();
  if (overlayWin && !overlayWin.isDestroyed()) overlayWin.reload();
  broadcast();
}

/* ------------------------------------------------------------------ settings side effects */
function setSetting(key, value) {
  if (!(key in DEFAULTS) || ['themeState', 'decorations', 'scenes', 'customWallpaper'].includes(key)) return;
  const prev = settings[key];
  if (key === 'weather') {
    const next = { ...settings.weather, ...(value || {}) };
    if (!catalog.weatherTypes.some((t) => t.id === next.type)) next.type = 'auto';
    if (!weatherAllowed(next.type)) {
      openApp('pro');
      broadcast();
      return;
    }
    const wasOn = weatherOn();
    const wasType = weatherType();
    settings.weather = next;
    saveSettings();
    if (wasOn !== weatherOn()) {
      // the toy layer grows to full screen when weather is on
      reloadLayers();
      return;
    }
    updateWindowWatcher();
    resendWindows();
    broadcast();
    return;
  }
  settings[key] = value;
  saveSettings();
  switch (key) {
    case 'theme':
      if (!canUse(value)) {
        settings.theme = prev;
        startPreview(value);
        return;
      }
      if (previewTheme) {
        clearTimeout(previewTimer);
        previewTheme = null;
        previewEndsAt = 0;
      }
      reloadLayers();
      return;
    case 'wallpaper':
    case 'toys':
      rebuildLayers();
      break;
    case 'cursorEffects':
      if (overlayWin && !overlayWin.isDestroyed()) {
        overlayWin.setBounds(overlayBounds());
        overlayWin.reload();
      }
      break;
    case 'launchAtLogin':
      try {
        app.setLoginItemSettings({ openAtLogin: !!value, openAsHidden: true });
      } catch {}
      break;
    case 'pauseOnBattery':
      updatePause();
      break;
    case 'overApps':
      resendWindows();
      break;
  }
  broadcast();
}

function updatePause() {
  let onBattery = false;
  try {
    onBattery = powerMonitor.isOnBatteryPower();
  } catch {}
  const next = userPaused || (settings.pauseOnBattery && onBattery);
  if (next !== paused) {
    paused = next;
    broadcast();
  }
}

/* ------------------------------------------------------------------ tray */
function trayImage() {
  const file = path.join(__dirname, '..', '..', 'assets', isMac ? 'trayTemplate.png' : 'tray.png');
  let img = nativeImage.createFromPath(file);
  if (img.isEmpty()) img = nativeImage.createEmpty();
  if (isMac) img.setTemplateImage(true);
  return img;
}

function rebuildTray() {
  if (!tray) return;
  const themeItems = catalog.themes.map((t) => ({
    label: `${t.name}${canUse(t.id) ? '' : '  🔒'}`,
    type: 'radio',
    checked: activeTheme() === t.id,
    click: () => (canUse(t.id) ? setSetting('theme', t.id) : startPreview(t.id))
  }));
  const current = catalog.get(activeTheme());
  const W = settings.weather;
  const setW = (patch) => setSetting('weather', patch);
  const weatherMenu = [
    ...catalog.weatherTypes.map((t) => ({
      label: `${t.label}${weatherAllowed(t.id) ? '' : '  🔒'}`,
      type: 'radio',
      checked: W.type === t.id,
      click: () => setW({ type: t.id })
    })),
    { type: 'separator' },
    {
      label: 'Amount',
      submenu: catalog.weatherAmounts.map((a) => ({ label: a.label, type: 'radio', checked: W.amount === a.id, click: () => setW({ amount: a.id }) }))
    },
    {
      label: 'Wind',
      submenu: catalog.winds.map((a) => ({ label: a.label, type: 'radio', checked: W.wind === a.id, click: () => setW({ wind: a.id }) }))
    },
    { label: 'Pile Up on Windows', type: 'checkbox', checked: W.onWindows !== false, click: (i) => setW({ onWindows: i.checked }) },
    { label: 'Pause Weather', type: 'checkbox', checked: !!W.paused, click: (i) => setW({ paused: i.checked }) },
    { label: 'Clear Snow', enabled: weatherOn(), click: () => sendAction('clear-snow') },
    { label: 'Start a Blizzard', enabled: weatherOn(), click: () => sendAction('blizzard') }
  ];
  const sendMenu =
    activeTheme() === 'winter'
      ? [
          {
            label: 'Send',
            submenu: [
              { label: 'Santa’s Sleigh', click: () => sendAction('santa') },
              { label: 'Snowmen', click: () => sendAction('snowmen') },
              { label: `Snowplough${pro ? '' : '  🔒'}`, click: () => sendAction('plough') },
              { label: `Yeti${pro ? '' : '  🔒'}`, click: () => sendAction('yeti') }
            ]
          }
        ]
      : [];
  const menu = Menu.buildFromTemplate([
    { label: 'Desk Diorama', enabled: false },
    { type: 'separator' },
    ...themeItems,
    { type: 'separator' },
    {
      label: current.action,
      enabled: settings.toys,
      click: () => sendAction('surprise')
    },
    ...sendMenu,
    { label: `Weather: ${(catalog.weatherTypes.find((t) => t.id === W.type) || {}).label || 'Off'}`, submenu: weatherMenu },
    { label: 'Decorate Your Screen…', click: () => setDecorating(true) },
    { type: 'separator' },
    { label: 'Show Toys on Dock', type: 'checkbox', checked: settings.toys, accelerator: 'Alt+CommandOrControl+D', click: (i) => setSetting('toys', i.checked) },
    { label: 'Stay Visible Over Apps', type: 'checkbox', checked: !!settings.overApps, click: (i) => setSetting('overApps', i.checked) },
    { label: 'Live Wallpaper', type: 'checkbox', checked: settings.wallpaper, click: (i) => setSetting('wallpaper', i.checked) },
    { label: 'Sound Effects', type: 'checkbox', checked: settings.sound, click: (i) => setSetting('sound', i.checked) },
    {
      label: 'Pause Animation',
      type: 'checkbox',
      checked: userPaused,
      click: (i) => {
        userPaused = i.checked;
        updatePause();
      }
    },
    { type: 'separator' },
    pro
      ? { label: 'Pro unlocked ✓', enabled: false }
      : { label: `Unlock Everything – ${config.PRICE_LABEL} Lifetime…`, click: () => openApp('pro') },
    { label: 'Open Desk Diorama…', click: () => openApp() },
    { type: 'separator' },
    { label: 'Quit Desk Diorama', role: 'quit', accelerator: 'CommandOrControl+Q' }
  ]);
  tray.setContextMenu(menu);
  tray.setToolTip(`Desk Diorama — ${current.name}`);
}

function sendAction(name) {
  if (overlayWin && !overlayWin.isDestroyed()) overlayWin.webContents.send('action', name);
  for (const w of wallpaperWins.values()) if (!w.isDestroyed()) w.webContents.send('action', name);
}

/* ------------------------------------------------------------------ IPC */
function senderRole(e) {
  const w = BrowserWindow.fromWebContents(e.sender);
  return (w && w.__role) || 'app';
}

ipcMain.handle('state:get', (e) => publicState(senderRole(e), BrowserWindow.fromWebContents(e.sender)));
ipcMain.handle('settings:set', (_e, key, value) => {
  setSetting(key, value);
  return publicState('app');
});
ipcMain.on('overlay:interactive', (e, on) => {
  const w = BrowserWindow.fromWebContents(e.sender);
  if (w && w === overlayWin) w.setIgnoreMouseEvents(!on, { forward: true });
});
ipcMain.on('theme:state', (_e, id, data) => {
  if (typeof id !== 'string' || !catalog.themes.some((t) => t.id === id)) return;
  settings.themeState = { ...settings.themeState, [id]: data };
  saveSettings();
});
ipcMain.handle('theme:try', (_e, id) => startPreview(id));
ipcMain.on('decor:save', (_e, list) => {
  if (!Array.isArray(list)) return;
  const known = new Set(['tree', 'lights', 'candle', 'redBauble', 'goldBauble', 'blueBauble', 'silverBauble', 'bow', 'treeLights', 'tinsel', 'star', 'wreath', 'stocking', 'candy', 'gift', 'bells', 'gingerbread', 'holly', 'santaHat', 'globe', 'cocoa', 'snowman']);
  const num = (v) => (Number.isFinite(+v) ? Math.round(+v * 10) / 10 : 0);
  settings.decorations = list
    .filter((d) => d && known.has(d.k))
    .slice(0, 120)
    .map((d) => {
      const maxS = d.k === 'tree' ? 3.4 : 2;
      const o = { id: num(d.id), k: d.k, x: num(d.x), y: num(d.y), s: Math.min(maxS, Math.max(0.5, num(d.s) || 1)) };
      if (d.k === 'lights') Object.assign(o, { x2: num(d.x2), y2: num(d.y2) });
      // ornaments hanging on a tree (positions are in the tree's own units)
      if (d.k === 'tree' && Array.isArray(d.orn))
        o.orn = d.orn
          .filter((x) => x && known.has(x.k) && x.k !== 'tree')
          .slice(0, 50)
          .map((x) => (x.u === undefined ? { k: x.k } : { k: x.k, u: num(x.u), v: num(x.v) }));
      return o;
    });
  saveSettings();
});
ipcMain.handle('decor:edit', (_e, on) => setDecorating(!!on));
ipcMain.handle('scene:set', (_e, themeId, sceneId) => {
  if (!catalog.themes.some((t) => t.id === themeId)) return;
  if (sceneId === 'custom' && !pro) return openApp('pro');
  settings.scenes = { ...settings.scenes, [themeId]: String(sceneId) };
  saveSettings();
  if (themeId !== activeTheme() && canUse(themeId)) settings.theme = themeId;
  reloadLayers();
});
ipcMain.handle('wallpaper:pick', async (e) => {
  if (!pro) return openApp('pro');
  const r = await dialog.showOpenDialog(BrowserWindow.fromWebContents(e.sender), {
    title: 'Choose a wallpaper picture',
    properties: ['openFile'],
    filters: [{ name: 'Images', extensions: IMG_EXT }]
  });
  if (r.canceled || !r.filePaths[0]) return;
  const ext = path.extname(r.filePaths[0]).toLowerCase() || '.jpg';
  const dest = path.join(app.getPath('userData'), 'custom-wallpaper' + ext);
  try {
    if (customFile() && customFile() !== dest) fs.unlinkSync(customFile());
  } catch {}
  fs.copyFileSync(r.filePaths[0], dest);
  settings.customWallpaper = dest;
  settings.scenes = { ...settings.scenes, [activeTheme()]: 'custom' };
  saveSettings();
  reloadLayers();
});
ipcMain.handle('checkout:open', () => {
  shell.openExternal(config.checkoutUrl());
  return { configured: config.isConfigured() };
});
ipcMain.handle('license:activate', async (_e, key) => {
  const r = await license.activate(key);
  if (r.ok) {
    pro = true;
    previewTheme = null;
    clearTimeout(previewTimer);
    reloadLayers();
  }
  return r;
});
ipcMain.handle('license:deactivate', async () => {
  await license.deactivate();
  pro = false;
  reloadLayers();
  return { ok: true };
});
ipcMain.handle('app:open', (_e, section) => openApp(section));
ipcMain.handle('external:open', (_e, url) => {
  if (/^(https:|mailto:)/.test(String(url))) shell.openExternal(url);
});
ipcMain.handle('action:trigger', (_e, name) => sendAction(name));
ipcMain.handle('app:quit', () => app.quit());

/* ------------------------------------------------------------------ lifecycle */
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', (_e, argv) => {
    const url = argv.find((a) => a.startsWith('deskdiorama://'));
    handleDeepLink(url);
    if (!url) openApp();
  });
}

function handleDeepLink(url) {
  if (!url) return;
  if (url.includes('purchased')) openApp('pro?thanks=1');
}
app.on('open-url', (e, url) => {
  e.preventDefault();
  if (app.isReady()) handleDeepLink(url);
  else app.once('ready', () => setTimeout(() => handleDeepLink(url), 800));
});

app.whenReady().then(async () => {
  if (isMac && !DEV) app.dock.hide();
  app.setAsDefaultProtocolClient('deskdiorama');
  loadSettings();
  pro = license.isPro();

  tray = new Tray(trayImage());
  if (!isMac) tray.on('click', () => openApp());

  rebuildLayers();
  rebuildTray();
  updatePause();
  updateWindowWatcher();

  if (!settings.onboarded || DEV) {
    settings.onboarded = true;
    saveSettings();
    openApp('welcome');
  }

  try {
    globalShortcut.register('Alt+CommandOrControl+D', () => setSetting('toys', !settings.toys));
  } catch {}

  screen.on('display-added', rebuildLayers);
  screen.on('display-removed', rebuildLayers);
  screen.on('display-metrics-changed', () => {
    rebuildLayers();
    broadcast();
  });
  powerMonitor.on('on-battery', updatePause);
  powerMonitor.on('on-ac', updatePause);
  powerMonitor.on('suspend', () => {
    paused = true;
    broadcast();
  });
  powerMonitor.on('lock-screen', () => {
    paused = true;
    broadcast();
  });
  const wake = () => {
    paused = false;
    updatePause();
    broadcast();
  };
  powerMonitor.on('resume', wake);
  powerMonitor.on('unlock-screen', wake);

  // dev: DD_SNAPSHOT=/some/dir captures every window after a few seconds, then quits
  if (process.env.DD_SNAPSHOT) {
    setTimeout(async () => {
      let i = 0;
      for (const w of BrowserWindow.getAllWindows()) {
        try {
          const img = await w.webContents.capturePage();
          fs.writeFileSync(path.join(process.env.DD_SNAPSHOT, `${w.__role || 'win'}-${i++}.png`), img.toPNG());
        } catch (e) {
          console.error('snapshot failed', e);
        }
      }
      app.quit();
    }, +(process.env.DD_SNAPSHOT_DELAY || 9000));
  }

  // background license check
  if (pro) {
    const still = await license.revalidate();
    if (!still) {
      pro = false;
      reloadLayers();
    }
  }
});

app.on('window-all-closed', (e) => e.preventDefault()); // live in the menu bar
app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  windowWatcher.stop();
});
