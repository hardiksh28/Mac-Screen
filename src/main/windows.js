/*
 * Watches other apps' window positions (macOS) by running the bundled `window-watcher` helper.
 * If the helper isn't there (e.g. a dev build without it), this quietly does nothing and the
 * snow only piles up on the Dock.
 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { app } = require('electron');

function helperPath() {
  const candidates = [
    path.join(process.resourcesPath || '', 'bin', 'window-watcher'),
    path.join(app.getAppPath(), 'build', 'bin', 'window-watcher')
  ];
  return candidates.find((p) => {
    try {
      fs.accessSync(p, fs.constants.X_OK);
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
    return process.platform === 'darwin' && !!helperPath();
  },
  start(onWindows) {
    listener = onWindows;
    if (child || process.platform !== 'darwin') return;
    const bin = helperPath();
    if (!bin) return;
    try {
      child = spawn(bin, [String(process.pid)], { stdio: ['ignore', 'pipe', 'ignore'] });
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
          const list = JSON.parse(line);
          if (listener) listener(list);
        } catch {}
      }
    });
    child.on('exit', () => {
      child = null;
    });
  },
  stop() {
    if (child) child.kill();
    child = null;
    buf = '';
  }
};
