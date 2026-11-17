/*
 * Watches other apps' window positions, the app in front and the Dock's icon area (macOS)
 * by running the bundled `window-watcher` helper. If the helper isn't there (e.g. a dev build
 * without it), this quietly does nothing and the snow only piles up along the bottom.
 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { app } = require('electron');

const isWin = process.platform === 'win32';
const SUPPORTED = process.platform === 'darwin' || isWin;
function helperPath() {
  const name = isWin ? 'win-helper.exe' : 'window-watcher';
  const candidates = [path.join(process.resourcesPath || '', 'bin', name), path.join(app.getAppPath(), 'build', 'bin', name)];
  return candidates.find((p) => {
    try {
      fs.accessSync(p, isWin ? fs.constants.R_OK : fs.constants.X_OK);
      return true;
    } catch {
      return false;
    }
  });
}

let child = null;
let buf = '';
let listener = null;

module.exports = {
  available() {
    return SUPPORTED && !!helperPath();
  },
  start(onWindows) {
    listener = onWindows;
    if (child || !SUPPORTED) return;
    const bin = helperPath();
    if (!bin) return;
    try {
      child = spawn(bin, [String(process.pid)], { stdio: ['ignore', 'pipe', 'ignore'], windowsHide: true });
    } catch {
      child = null;
      return;
    }
    child.stdout.on('data', (d) => {
      buf += d.toString();
      let i;
      while ((i = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, i);
        buf = buf.slice(i + 1);
        try {
          const msg = JSON.parse(line);
          // older helpers sent a bare array of windows
          const info = Array.isArray(msg) ? { w: msg, front: '', pid: -1, dock: undefined } : msg;
          if (listener) listener(info);
        } catch {}
      }
    });
    child.on('exit', () => {
      child = null;
    });
  },
  /* Windows: put a wallpaper window behind the desktop icons. rect is in physical pixels. */
  attachWallpaper(hwnd, rect) {
    return new Promise((resolve) => {
      const bin = isWin && helperPath();
      if (!bin) return resolve(false);
      let out = '';
      try {
        const p = spawn(bin, ['attach', String(hwnd), String(Math.round(rect.x)), String(Math.round(rect.y)), String(Math.round(rect.width)), String(Math.round(rect.height))], { windowsHide: true });
        p.stdout.on('data', (d) => (out += d));
        p.on('exit', (code) => resolve(code === 0 && out.includes('"ok":true')));
        p.on('error', () => resolve(false));
        setTimeout(() => resolve(false), 8000);
      } catch {
        resolve(false);
      }
    });
  },
  stop() {
    if (child) child.kill();
    child = null;
    buf = '';
  }
};
