#!/usr/bin/env node
/*
 * Makes Desk Diorama gift keys (free Pro unlocks you can give away).
 *
 *   node scripts/make-gift-key.js [how-many] [first-serial]
 *
 * Needs your private signing key, from DD_GIFT_KEY (the PEM text), DD_GIFT_KEY_FILE (a path),
 * or .local/gift-private.pem. Keep that file secret and never commit it: anyone who has it
 * can make unlimited keys.
 */
const fs = require('fs');
const path = require('path');
const gift = require('../src/main/giftkey');
const config = require('../src/main/config');

const pem =
  process.env.DD_GIFT_KEY ||
  (process.env.DD_GIFT_KEY_FILE && fs.readFileSync(process.env.DD_GIFT_KEY_FILE, 'utf8')) ||
  (fs.existsSync(path.join(__dirname, '..', '.local', 'gift-private.pem')) && fs.readFileSync(path.join(__dirname, '..', '.local', 'gift-private.pem'), 'utf8'));
if (!pem) {
  console.error('No private key. Set DD_GIFT_KEY_FILE=/path/to/gift-private.pem');
  process.exit(1);
}
const n = Math.max(1, Math.min(500, parseInt(process.argv[2] || '1', 10)));
const first = parseInt(process.argv[3] || String(Math.floor(Date.now() / 1000) % 1e9), 10);
for (let i = 0; i < n; i++) {
  const key = gift.sign(first + i, pem);
  if (!gift.verify(key, config.GIFT_PUBLIC_KEY)) {
    console.error('This private key does not match GIFT_PUBLIC_KEY in src/main/config.js');
    process.exit(1);
  }
  console.log(key);
}
