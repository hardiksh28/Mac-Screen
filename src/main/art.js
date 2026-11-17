/*
 * Analyses a painted wallpaper once (in the main process, where file pixels are readable):
 *  - lights: warm bright spots (windows, lamps) → animated glows
 *  - night: is the sky dark (→ stars, shooting stars)
 *  - sky: coarse grid of "dark sky" cells → where stars may twinkle
 */
const { nativeImage } = require('electron');
const fs = require('fs');

const cache = new Map();

function analyse(file) {
  const key = file + ':' + fs.statSync(file).mtimeMs;
  if (cache.has(key)) return cache.get(key);
  let img = nativeImage.createFromPath(file);
  if (img.isEmpty()) return null;
  const size = img.getSize();
  const w = 360;
  const h = Math.max(1, Math.round((w * size.height) / size.width));
  img = img.resize({ width: w, height: h, quality: 'good' });
  const bmp = img.toBitmap(); // BGRA
  const px = (x, y) => {
    const i = (y * w + x) * 4;
    return [bmp[i + 2], bmp[i + 1], bmp[i]];
  };
  const lum = ([r, g, b]) => (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // a light is a small bright spot on a darker surrounding (not a sunlit slope)
  const isSpot = (x, y, l) => {
    let sum = 0,
      k = 0;
    for (const [dx, dy] of [[-5, 0], [5, 0], [0, -5], [0, 5], [-4, -4], [4, 4], [-4, 4], [4, -4]]) {
      const xx = x + dx,
        yy = y + dy;
      if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
      sum += lum(px(xx, yy));
      k++;
    }
    return k && sum / k < l - 0.28;
  };
  const cells = new Map();
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const c = px(x, y);
      const l = lum(c);
      if (l > 0.62 && c[0] > 190 && c[1] > 120 && c[0] - c[2] > 70 && isSpot(x, y, l)) {
        const k = (x >> 2) + ',' + (y >> 2);
        const cell = cells.get(k) || { x: 0, y: 0, n: 0 };
        cell.x += x;
        cell.y += y;
        cell.n++;
        cells.set(k, cell);
      }
    }
  const lights = [...cells.values()]
    .filter((c) => c.n >= 2)
    .sort((a, b) => b.n - a.n)
    .slice(0, 160)
    .map((c) => ({ x: +(c.x / c.n / w).toFixed(4), y: +(c.y / c.n / h).toFixed(4), s: Math.min(1, c.n / 10) }));

  let top = 0,
    n = 0;
  for (let y = 0; y < h * 0.3; y += 2)
    for (let x = 0; x < w; x += 2) {
      top += lum(px(x, y));
      n++;
    }
  const night = top / n < 0.33;

  const GW = 90,
    GH = Math.max(1, Math.round((GW * h) / w));
  let sky = '';
  for (let gy = 0; gy < GH; gy++)
    for (let gx = 0; gx < GW; gx++) {
      const c = px(Math.min(w - 1, Math.floor(((gx + 0.5) * w) / GW)), Math.min(h - 1, Math.floor(((gy + 0.5) * h) / GH)));
      sky += lum(c) < 0.3 && c[2] >= c[0] - 4 ? '1' : '0';
    }
  const out = { lights, night, sky: { w: GW, h: GH, bits: sky } };
  cache.set(key, out);
  return out;
}

module.exports = { analyse };
