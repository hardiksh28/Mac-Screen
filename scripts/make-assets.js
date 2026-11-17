/*
 * Regenerates icons and theme thumbnails using the real renderer code.
 * Needs Playwright with Chromium: `npx playwright install chromium` (one time), then `node scripts/make-assets.js`.
 */
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const PREVIEW = 'file://' + path.join(ROOT, 'src/renderer/preview.html');
const out = (p) => path.join(ROOT, p);

(async () => {
  fs.mkdirSync(out('assets/thumbs'), { recursive: true });
  const browser = await chromium.launch();

  // ---- theme thumbnails
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const catalog = require('../src/shared/catalog.js');
  const artFor = (theme) => {
    for (const sc of catalog.get(theme).scenes || []) {
      const f = out(`assets/wallpapers/${theme}-${sc.id}.jpg`);
      if (fs.existsSync(f)) return '&art=' + encodeURIComponent('file://' + f);
    }
    return '';
  };
  for (const theme of ['winter', 'wizard', 'drive', 'ocean']) {
    const art = artFor(theme);
    await page.goto(`${PREVIEW}?theme=${theme}&fresh=1&clean=1${art}`);
    await page.evaluate(() => sessionStorage.clear());
    await page.goto(`${PREVIEW}?theme=${theme}&fresh=1&clean=1${art}`);
    await page.waitForTimeout(theme === 'winter' ? 9000 : 4500);
    if (theme === 'winter') {
      // build a snowman for the thumbnail
      await page.evaluate(() => DD._mock._fireAction('snowmen'));
      await page.waitForTimeout(2500);
    }
    if (theme === 'drive') await page.evaluate(() => DD._mock._fireAction('surprise'));
    if (theme === 'ocean') await page.evaluate(() => DD._mock._fireAction('surprise'));
    await page.waitForTimeout(1500);
    await page.screenshot({ path: out(`assets/thumbs/${theme}.jpg`), type: 'jpeg', quality: 82, clip: { x: 0, y: 0, width: 1440, height: 900 } });
  }
  // decorate thumbnail
  await page.goto(`${PREVIEW}?theme=winter&clean=1`);
  await page.evaluate(() => {
    const W = innerWidth, H = innerHeight;
    const d = [
      { id: 1, k: 'lights', x: W * 0.12, y: H * 0.18, x2: W * 0.88, y2: H * 0.18 },
      { id: 2, k: 'tree', x: W * 0.78, y: H - 78, s: 1.6 },
      { id: 3, k: 'redBauble', x: W * 0.3, y: H * 0.34, s: 1.4 },
      { id: 4, k: 'goldBauble', x: W * 0.4, y: H * 0.3, s: 1.4 },
      { id: 5, k: 'wreath', x: W * 0.55, y: H * 0.5, s: 1.6 },
      { id: 6, k: 'stocking', x: W * 0.2, y: H * 0.6, s: 1.5 },
      { id: 7, k: 'globe', x: W * 0.35, y: H - 80, s: 1.4 },
      { id: 8, k: 'gift', x: W * 0.68, y: H - 78, s: 1.4 }
    ];
    const s = JSON.parse(localStorage.getItem('dd-mock-settings') || '{}');
    s.decorations = d;
    localStorage.setItem('dd-mock-settings', JSON.stringify(s));
  });
  await page.goto(`${PREVIEW}?theme=winter&clean=1${artFor('winter')}`);
  await page.waitForTimeout(3000);
  await page.screenshot({ path: out('assets/thumbs/decorate.jpg'), type: 'jpeg', quality: 82 });

  // ---- app icon + tray icon, drawn with the snowman artwork
  const ip = await browser.newPage({ viewport: { width: 1024, height: 1024 }, deviceScaleFactor: 1 });
  await ip.goto(PREVIEW + '?theme=winter&clean=1');
  await ip.waitForTimeout(500);
  const icon = await ip.evaluate(() => {
    const c = document.createElement('canvas');
    c.width = c.height = 1024;
    const g = c.getContext('2d');
    const r = 228;
    DD.util.rrect(g, 50, 50, 924, 924, r);
    g.save();
    g.clip();
    const grd = g.createLinearGradient(0, 50, 0, 974);
    grd.addColorStop(0, '#141a52');
    grd.addColorStop(0.6, '#4a3a96');
    grd.addColorStop(1, '#8f6fc4');
    g.fillStyle = grd;
    g.fillRect(0, 0, 1024, 1024);
    // moon
    const mc = document.createElement('canvas');
    mc.width = mc.height = 200;
    const m = mc.getContext('2d');
    m.fillStyle = '#fff2c9';
    m.beginPath();
    m.arc(100, 100, 80, 0, Math.PI * 2);
    m.fill();
    m.globalCompositeOperation = 'destination-out';
    m.beginPath();
    m.arc(140, 75, 74, 0, Math.PI * 2);
    m.fill();
    g.drawImage(mc, 660, 150);
    // hills
    g.fillStyle = '#dcd8ff';
    g.beginPath();
    g.moveTo(0, 1024);
    g.lineTo(0, 800);
    g.quadraticCurveTo(300, 700, 560, 790);
    g.quadraticCurveTo(820, 870, 1024, 760);
    g.lineTo(1024, 1024);
    g.fill();
    // flakes
    g.fillStyle = '#fff';
    const rnd = DD.util.rng(5);
    for (let i = 0; i < 40; i++) {
      g.globalAlpha = 0.5 + rnd() * 0.5;
      g.beginPath();
      g.arc(80 + rnd() * 860, 80 + rnd() * 640, 4 + rnd() * 9, 0, Math.PI * 2);
      g.fill();
    }
    g.globalAlpha = 1;
    DD.themes.winter.drawSnowman(g, 470, 860, 5.2, { hat: 'santa', face: 'happy', body: 'waving', clothes: 'scarf' }, { t: 0.15, noShadow: true });
    g.restore();
    return c.toDataURL('image/png');
  });
  const tray = await ip.evaluate(() => {
    const make = (s) => {
      const c = document.createElement('canvas');
      c.width = c.height = s;
      const g = c.getContext('2d');
      const k = s / 18;
      g.fillStyle = '#000';
      g.beginPath();
      g.arc(9 * k, 13 * k, 4.6 * k, 0, Math.PI * 2);
      g.arc(9 * k, 6.6 * k, 3.4 * k, 0, Math.PI * 2);
      g.fill();
      g.fillRect(5.2 * k, 1.6 * k, 7.6 * k, 1.4 * k);
      g.fillRect(6.6 * k, 0, 4.8 * k, 2.2 * k);
      g.globalCompositeOperation = 'destination-out';
      g.beginPath();
      g.arc(7.8 * k, 6.2 * k, 0.7 * k, 0, Math.PI * 2);
      g.arc(10.2 * k, 6.2 * k, 0.7 * k, 0, Math.PI * 2);
      g.arc(9 * k, 12 * k, 0.75 * k, 0, Math.PI * 2);
      g.arc(9 * k, 14.6 * k, 0.75 * k, 0, Math.PI * 2);
      g.fill();
      return c.toDataURL('image/png');
    };
    return { x1: make(18), x2: make(36) };
  });
  const save = (file, dataUrl) => fs.writeFileSync(out(file), Buffer.from(dataUrl.split(',')[1], 'base64'));
  save('build/icon.png', icon);
  save('assets/trayTemplate.png', tray.x1);
  save('assets/trayTemplate@2x.png', tray.x2);
  save('assets/tray.png', tray.x2);
  // small icon for the app window
  const small = await ip.evaluate((src) => new Promise((res) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = c.height = 128;
      c.getContext('2d').drawImage(img, 0, 0, 128, 128);
      res(c.toDataURL('image/png'));
    };
    img.src = src;
  }), icon);
  save('assets/icon-64.png', small);
  await browser.close();
  console.log('assets written');
})();
