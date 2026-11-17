/*
 * License handling with Dodo Payments' public license-key endpoints.
 * These endpoints need no API key, so nothing secret is shipped inside the app.
 *   POST {API_BASE}/licenses/activate   { license_key, name }                      -> instance { id, ... }
 *   POST {API_BASE}/licenses/validate   { license_key, license_key_instance_id }   -> { valid }
 *   POST {API_BASE}/licenses/deactivate { license_key, license_key_instance_id }
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { app, safeStorage } = require('electron');
const config = require('./config');
const giftkey = require('./giftkey');

const file = () => path.join(app.getPath('userData'), 'license.dat');
const REVALIDATE_MS = 1000 * 60 * 60 * 24 * 3; // every 3 days

function read() {
  try {
    const raw = fs.readFileSync(file());
    const text =
      safeStorage.isEncryptionAvailable() && raw[0] !== 0x7b /* "{" */
        ? safeStorage.decryptString(raw)
        : raw.toString('utf8');
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function write(data) {
  const text = JSON.stringify(data);
  const out = safeStorage.isEncryptionAvailable() ? safeStorage.encryptString(text) : Buffer.from(text);
  fs.mkdirSync(path.dirname(file()), { recursive: true });
  fs.writeFileSync(file(), out);
}

function clear() {
  try {
    fs.unlinkSync(file());
  } catch {}
}

async function post(endpoint, body, base) {
  const res = await fetch(`${base || config.API_BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000)
  });
  let json = null;
  try {
    json = await res.json();
  } catch {}
  return { ok: res.ok, status: res.status, json };
}

function friendlyError(status, json) {
  const msg = (json && (json.message || json.error || json.code)) || '';
  if (status === 404) return 'That license key was not found. Check it for typos.';
  if (status === 403 || status === 422 || /limit/i.test(msg))
    return msg || 'This key cannot be activated on another device. Contact support.';
  return msg || `Activation failed (error ${status}). Please try again.`;
}

module.exports = {
  isPro() {
    const l = read();
    return !!(l && l.key && l.valid !== false);
  },

  info() {
    const l = read();
    if (!l) return null;
    return { key: l.key.slice(0, 4) + '••••' + l.key.slice(-4), activatedAt: l.activatedAt };
  },

  async activate(rawKey) {
    const key = String(rawKey || '').trim();
    if (key.length < 8) return { ok: false, error: 'Paste the license key from your purchase email.' };
    // gift keys are checked right here, offline
    if (giftkey.looksLikeGift(key)) {
      const g = giftkey.verify(key, config.GIFT_PUBLIC_KEY);
      if (!g) return { ok: false, error: 'That gift key isn’t valid. Check that you copied all of it.' };
      write({ key: key.replace(/\s+/g, ''), gift: true, serial: g.serial, activatedAt: Date.now(), checkedAt: Date.now(), valid: true });
      return { ok: true };
    }
    try {
      const name = `${os.hostname()} (${process.platform})`.slice(0, 120);
      // try the configured environment first, then the other one (a test key won't exist in live and vice versa)
      let r = null;
      let used = null;
      for (const base of config.API_BASES) {
        r = await post('/licenses/activate', { license_key: key, name }, base);
        used = base;
        if (r.ok || r.status !== 404) break;
      }
      if (!r.ok) return { ok: false, error: friendlyError(r.status, r.json) };
      const instanceId = r.json && (r.json.id || r.json.license_key_instance_id);
      write({ key, instanceId, base: used, activatedAt: Date.now(), checkedAt: Date.now(), valid: true });
      return { ok: true };
    } catch (e) {
      return { ok: false, error: 'Could not reach the license server. Check your internet connection.' };
    }
  },

  async deactivate() {
    const l = read();
    if (l && l.instanceId) {
      try {
        await post('/licenses/deactivate', { license_key: l.key, license_key_instance_id: l.instanceId }, l.base);
      } catch {}
    }
    clear();
    return { ok: true };
  },

  /* Re-check occasionally. Network errors never lock out a paying user. */
  async revalidate(force = false) {
    const l = read();
    if (!l || !l.key) return false;
    if (l.gift) return !!giftkey.verify(l.key, config.GIFT_PUBLIC_KEY);
    if (!force && Date.now() - (l.checkedAt || 0) < REVALIDATE_MS) return true;
    try {
      const body = { license_key: l.key };
      if (l.instanceId) body.license_key_instance_id = l.instanceId;
      const r = await post('/licenses/validate', body, l.base);
      if (r.ok && r.json && r.json.valid === false) {
        write({ ...l, valid: false, checkedAt: Date.now() });
        return false;
      }
      if (r.ok) write({ ...l, valid: true, checkedAt: Date.now() });
      if (r.status === 404) {
        write({ ...l, valid: false, checkedAt: Date.now() });
        return false;
      }
    } catch {}
    return true;
  }
};
