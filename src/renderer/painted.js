/*
 * Painted wallpapers: a full-screen illustration with live animation layered on top.
 *
 * Drop artwork into assets/wallpapers/ (see docs/ART_PROMPTS.md). The image is analysed once:
 *   - warm, bright pixels (lit windows, lanterns, street lamps) get a soft flickering glow
 *   - dark blue sky pixels get twinkling stars
 * and each theme adds its own ambient motion (snowfall, sparkles, bubbles, neon flicker…).
 */
(function () {
  const DD = window.DD;
  const U = DD.util;
  const TAU = Math.PI * 2;

  function loadImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  }

  /* Use the main-process analysis when given; otherwise read pixels here (works over http/data URLs). */
  function fromPrecomputed(a) {
    const lights = (a.lights || []).map((l) => Object.assign({ p: Math.random() * TAU, f: 0.4 + Math.random() * 1.2 }, l));
    const sk = a.sky;
    const isSky = (nx, ny) => {
      if (!sk) return ny < 0.4;
      const x = Math.floor(nx * sk.w),
        y = Math.floor(ny * sk.h);
      if (x < 0 || y < 0 || x >= sk.w || y >= sk.h) return false;
      return sk.bits[y * sk.w + x] === '1';
    };
    return { lights, night: !!a.night, isSky };
  }

  function analyse(img) {
    const w = 360;
    const h = Math.round((w * img.naturalHeight) / img.naturalWidth);
    const c = U.canvas(w, h);
    const g = c.getContext('2d', { willReadFrequently: true });
    g.drawImage(img, 0, 0, w, h);
    const d = g.getImageData(0, 0, w, h).data;
    const px = (x, y) => {
      const i = (y * w + x) * 4;
      return [d[i], d[i + 1], d[i + 2]];
    };
    const L = (x, y) => {
      const [r, gg, b] = px(x, y);
      return (0.299 * r + 0.587 * gg + 0.114 * b) / 255;
    };
    const isSpot = (x, y, l) => {
      let sum = 0,
        k = 0;
      for (const [dx, dy] of [[-5, 0], [5, 0], [0, -5], [0, 5], [-4, -4], [4, 4], [-4, 4], [4, -4]]) {
        const xx = x + dx,
          yy = y + dy;
        if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
        sum += L(xx, yy);
        k++;
      }
      return k && sum / k < l - 0.28;
    };
    // lights: cluster warm bright pixels into cells
    const cells = new Map();
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const [r, gg, b] = px(x, y);
        const lum = (0.299 * r + 0.587 * gg + 0.114 * b) / 255;
        if (lum > 0.62 && r > 190 && gg > 120 && r - b > 70 && isSpot(x, y, lum)) {
          const key = (x >> 2) + ',' + (y >> 2);
          const cell = cells.get(key) || { x: 0, y: 0, n: 0, lum: 0 };
          cell.x += x;
          cell.y += y;
          cell.n++;
          cell.lum += lum;
          cells.set(key, cell);
        }
      }
    const lights = [...cells.values()]
      .filter((c) => c.n >= 2)
      .map((c) => ({ x: c.x / c.n / w, y: c.y / c.n / h, s: Math.min(1, c.n / 10), lum: c.lum / c.n, p: Math.random() * TAU, f: 0.4 + Math.random() * 1.2 }))
      .sort((a, b) => b.s - a.s)
      .slice(0, 160);
    // sky brightness (top 30%)
    let top = 0,
      nTop = 0;
    for (let y = 0; y < h * 0.3; y += 2)
      for (let x = 0; x < w; x += 2) {
        const [r, gg, b] = px(x, y);
        top += (0.299 * r + 0.587 * gg + 0.114 * b) / 255;
        nTop++;
      }
    const night = top / nTop < 0.33;
    // star mask sampler
    const isSky = (nx, ny) => {
      const x = Math.min(w - 1, Math.max(0, Math.floor(nx * w)));
      const y = Math.min(h - 1, Math.max(0, Math.floor(ny * h)));
      const [r, gg, b] = px(x, y);
      const lum = (0.299 * r + 0.587 * gg + 0.114 * b) / 255;
      return lum < 0.3 && b >= r - 4;
    };
    return { lights, night, isSky };
  }

  /* Theme-specific ambient layers drawn above the painting. */
  const AMBIENT = {
    winter(ctx) {
      const flakes = [];
      const img = U.dot('rgba(255,255,255,1)', 16);
      return {
        resize(W, H) {
          flakes.length = 0;
          const n = Math.min(800, (W * H) / 3200);
          for (let i = 0; i < n; i++) {
            const z = Math.random();
            flakes.push({ x: Math.random() * W, y: Math.random() * H, z, r: 0.8 + z * 3, sp: 18 + z * 70, ph: Math.random() * TAU });
          }
        },
        frame(g, dt, t, W, H, env) {
          const ws = env.state.settings.weather || {};
          const wt = window.DD_CATALOG.resolveWeather(ws.type || 'auto', env.state.theme);
          const share = wt !== 'snow' || ws.paused ? 0.15 : { light: 0.35, medium: 0.6, heavy: 0.9, blizzard: 1 }[ws.amount] || 0.6;
          const wind = Math.sin(t * 0.2) * 16;
          const n = Math.floor(flakes.length * share);
          for (let i = 0; i < n; i++) {
            const f = flakes[i];
            f.y += f.sp * dt;
            f.x += (wind * f.z + Math.sin(t + f.ph) * 9 * f.z) * dt;
            if (f.y > H + 8) {
              f.y = -8;
              f.x = Math.random() * W;
            }
            if (f.x > W + 8) f.x = -8;
            if (f.x < -8) f.x = W + 8;
            g.globalAlpha = 0.35 + f.z * 0.6;
            const s = f.r * 2.4;
            g.drawImage(img, f.x - s / 2, f.y - s / 2, s, s);
          }
          g.globalAlpha = 1;
        }
      };
    },
    wizard() {
      const motes = [];
      const img = U.dot('rgba(255,226,150,1)', 16);
      return {
        resize(W, H) {
          motes.length = 0;
          for (let i = 0; i < 90; i++) motes.push({ x: Math.random() * W, y: Math.random() * H, p: Math.random() * TAU, s: 0.4 + Math.random() });
        },
        frame(g, dt, t, W, H) {
          for (const m of motes) {
            m.x += Math.sin(t * 0.4 + m.p) * 10 * dt;
            m.y -= (4 + m.s * 6) * dt;
            if (m.y < -10) m.y = H + 10;
            g.globalAlpha = 0.2 + 0.6 * (0.5 + 0.5 * Math.sin(t * 2 + m.p));
            const s = 6 * m.s;
            g.drawImage(img, m.x - s / 2, m.y - s / 2, s, s);
          }
          g.globalAlpha = 1;
        }
      };
    },
    drive() {
      const drops = [];
      return {
        resize(W, H) {
          drops.length = 0;
          for (let i = 0; i < 160; i++) drops.push({ x: Math.random() * W, y: Math.random() * H, v: 600 + Math.random() * 400 });
        },
        frame(g, dt, t, W, H, env) {
          const ws = env.state.settings.weather || {};
          if (window.DD_CATALOG.resolveWeather(ws.type || 'auto', 'drive') !== 'rain') return;
          g.strokeStyle = 'rgba(200,220,255,0.25)';
          g.lineWidth = 1;
          g.beginPath();
          for (const d of drops) {
            d.y += d.v * dt;
            d.x -= d.v * 0.12 * dt;
            if (d.y > H) {
              d.y = -20;
              d.x = Math.random() * (W + 100);
            }
            g.moveTo(d.x, d.y);
            g.lineTo(d.x + 2.4, d.y - 20);
          }
          g.stroke();
        }
      };
    },
    ocean() {
      const bubbles = [];
      return {
        resize(W, H) {
          bubbles.length = 0;
          for (let i = 0; i < 50; i++) bubbles.push({ x: Math.random() * W, y: Math.random() * H, r: 1 + Math.random() * 4, v: 20 + Math.random() * 50, p: Math.random() * TAU });
        },
        frame(g, dt, t, W, H) {
          g.save();
          g.globalCompositeOperation = 'lighter';
          for (let i = 0; i < 6; i++) {
            const x = W * (0.08 + i * 0.17) + Math.sin(t * 0.2 + i) * 50;
            const grd = g.createLinearGradient(0, 0, 0, H * 0.8);
            grd.addColorStop(0, `rgba(190,250,255,${0.06 + 0.04 * Math.sin(t * 0.5 + i * 2)})`);
            grd.addColorStop(1, 'rgba(190,250,255,0)');
            g.fillStyle = grd;
            g.beginPath();
            g.moveTo(x - 20, 0);
            g.lineTo(x + 30, 0);
            g.lineTo(x + 170, H * 0.8);
            g.lineTo(x + 40, H * 0.8);
            g.fill();
          }
          g.restore();
          g.strokeStyle = 'rgba(220,250,255,0.55)';
          g.lineWidth = 1;
          for (const b of bubbles) {
            b.y -= b.v * dt;
            b.x += Math.sin(t * 2 + b.p) * 10 * dt;
            if (b.y < -10) {
              b.y = H + 10;
              b.x = Math.random() * W;
            }
            g.beginPath();
            g.arc(b.x, b.y, b.r, 0, TAU);
            g.stroke();
          }
        }
      };
    }
  };

  /*
   * Returns a background object ({frame, action}) or null if the image can't be loaded.
   */
  DD.paintedBackground = async function (env, url, themeId, precomputed) {
    let img;
    try {
      img = await loadImage(url);
    } catch {
      return null;
    }
    const st = env.stage;
    let info;
    try {
      info = precomputed ? fromPrecomputed(precomputed) : analyse(img);
    } catch {
      info = fromPrecomputed({ night: true }); // tainted canvas: stars in the top of the sky, no glows
    }
    const amb = (AMBIENT[themeId] || AMBIENT.winter)(env);
    const glowImg = U.dot('rgba(255,190,100,1)', 32);
    let map = null; // image→screen transform
    let stars = [];
    let shooting = null,
      nextShoot = U.rand(10, 25);

    function layout() {
      const W = st.w,
        H = st.h;
      const s = Math.max(W / img.naturalWidth, H / img.naturalHeight);
      const dw = img.naturalWidth * s,
        dh = img.naturalHeight * s;
      map = { s, dx: (W - dw) / 2, dy: (H - dh) / 2, dw, dh };
      stars = [];
      if (info.night) {
        for (let i = 0; i < (W * H) / 2600 && stars.length < 700; i++) {
          const x = Math.random() * W,
            y = Math.random() * H * 0.6;
          const nx = (x - map.dx) / dw,
            ny = (y - map.dy) / dh;
          if (info.isSky(nx, ny)) stars.push({ x, y, r: 0.4 + Math.random() * 1.2, p: Math.random() * TAU, s: 0.6 + Math.random() * 2.4 });
        }
      }
      amb.resize(W, H);
    }
    st.onResize.push(layout);
    layout();
    const toScreen = (nx, ny) => [map.dx + nx * map.dw, map.dy + ny * map.dh];

    return {
      painted: true,
      action() {},
      frame(dt, t) {
        const g = st.ctx,
          W = st.w,
          H = st.h;
        g.drawImage(img, map.dx, map.dy, map.dw, map.dh);
        // twinkling stars (only where the painting has dark sky)
        g.fillStyle = '#fff';
        for (const s of stars) {
          const a = 0.5 + 0.5 * Math.sin(t * s.s + s.p);
          if (a < 0.55) continue;
          g.globalAlpha = (a - 0.55) * 1.6;
          g.fillRect(s.x, s.y, s.r, s.r);
        }
        g.globalAlpha = 1;
        if (info.night) {
          nextShoot -= dt;
          if (nextShoot < 0 && !shooting) {
            shooting = { x: U.rand(W * 0.1, W * 0.7), y: U.rand(H * 0.03, H * 0.2), age: 0 };
            nextShoot = U.rand(15, 40);
          }
          if (shooting) {
            shooting.age += dt;
            const k = shooting.age / 0.9;
            const x = shooting.x + k * 280,
              y = shooting.y + k * 90;
            const grd = g.createLinearGradient(x - 100, y - 32, x, y);
            grd.addColorStop(0, 'rgba(255,255,255,0)');
            grd.addColorStop(1, `rgba(255,255,255,${0.85 * (1 - k)})`);
            g.strokeStyle = grd;
            g.lineWidth = 1.5;
            g.beginPath();
            g.moveTo(x - 100, y - 32);
            g.lineTo(x, y);
            g.stroke();
            if (k >= 1) shooting = null;
          }
        }
        // flickering window / lamp glows
        g.save();
        g.globalCompositeOperation = 'lighter';
        const base = Math.max(8, map.s * 26);
        for (const L of info.lights) {
          const f = 0.55 + 0.3 * Math.sin(t * L.f * 2 + L.p) + 0.15 * Math.sin(t * 7.3 * L.f + L.p * 3);
          const [x, y] = toScreen(L.x, L.y);
          const r = base * (0.6 + L.s * 0.9);
          g.globalAlpha = 0.22 * f * (info.night ? 1 : 0.6);
          g.drawImage(glowImg, x - r, y - r, r * 2, r * 2);
        }
        g.restore();
        amb.frame(g, dt, t, W, H, env);
      }
    };
  };
})();
