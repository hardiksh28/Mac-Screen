/*
 * Gift keys: license keys you can hand out yourself (friends, reviewers, giveaways) without a
 * purchase. Each key is signed with a private key that never leaves your computer; the app
 * only contains the matching PUBLIC key, so nobody can make new keys from the source code.
 *
 *   key  = "DDGIFT-" + base32( payload(7 bytes) + ed25519 signature(64 bytes) )
 *   payload = version(1) · serial(uint32) · issued day since 2024-01-01(uint16)
 *
 * Make keys with:  node scripts/make-gift-key.js 5
 */
const crypto = require('crypto');

const PREFIX = 'DDGIFT';
const CONTEXT = Buffer.from('desk-diorama-gift-v1:');
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'; // Crockford base32 (no I, L, O, U)
const SPKI_ED25519 = Buffer.from('302a300506032b6570032100', 'hex');

function b32encode(buf) {
  let bits = 0,
    value = 0,
    out = '';
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += ALPHABET[(value << (5 - bits)) & 31];
  return out;
}
function b32decode(str) {
  const clean = str.toUpperCase().replace(/O/g, '0').replace(/[IL]/g, '1');
  let bits = 0,
    value = 0;
  const out = [];
  for (const ch of clean) {
    const v = ALPHABET.indexOf(ch);
    if (v < 0) continue;
    value = (value << 5) | v;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}
const group = (s) => s.match(/.{1,6}/g).join('-');

function looksLikeGift(key) {
  return /^\s*DDGIFT/i.test(String(key || ''));
}

/** Returns { serial, issued } when the key is genuine, otherwise null. */
function verify(key, publicKeyB64) {
  try {
    const body = String(key).trim().replace(/^DDGIFT[-\s]*/i, '').replace(/[^0-9A-Za-z]/g, '');
    const bytes = b32decode(body);
    if (bytes.length < 71) return null;
    const payload = bytes.subarray(0, 7);
    const sig = bytes.subarray(7, 71);
    if (payload[0] !== 1) return null;
    const pub = crypto.createPublicKey({ key: Buffer.concat([SPKI_ED25519, Buffer.from(publicKeyB64, 'base64')]), format: 'der', type: 'spki' });
    if (!crypto.verify(null, Buffer.concat([CONTEXT, payload]), pub, sig)) return null;
    return { serial: payload.readUInt32BE(1), issued: payload.readUInt16BE(5) };
  } catch {
    return null;
  }
}

/** Used by scripts/make-gift-key.js (needs the private key). */
function sign(serial, privateKeyPem) {
  const payload = Buffer.alloc(7);
  payload[0] = 1;
  payload.writeUInt32BE(serial >>> 0, 1);
  payload.writeUInt16BE(Math.floor((Date.now() - Date.UTC(2024, 0, 1)) / 864e5) & 0xffff, 5);
  const sig = crypto.sign(null, Buffer.concat([CONTEXT, payload]), crypto.createPrivateKey(privateKeyPem));
  return `${PREFIX}-${group(b32encode(Buffer.concat([payload, sig])))}`;
}

module.exports = { verify, sign, looksLikeGift };
