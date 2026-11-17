/*
 * Weather layer (runs in the toy overlay, on top of everything, fully click-through).
 *  - Snow / rain / blossoms / leaves / hearts / confetti
 *  - Flakes pile up on the Dock's icons and on top of app windows
 *  - Close or minimise a window and its snow tumbles down onto whatever is below
 *  - Your cursor blows the flakes around and brushes snow off ledges; brushed snow
 *    rolls into snowballs (Snowy Village) so building a snowman is quick
 *  - Shake the cursor quickly to start a blizzard
 */
(function () {
  const DD = window.DD;
  const U = DD.util;
  const TAU = Math.PI * 2;
  const CAT = window.DD_CATALOG;

  const AMOUNT = { light: 0.35, medium: 0.8, heavy: 1.6, blizzard: 2.8 };
  const BIN = 3; // px per pile column

  const TYPES = {
    snow: { vy: [28, 95], size: [1.2, 3.6], sway: 22, piles: true, pileColor: ['#ffffff', '#dde4ff'] },
    rain: { vy: [720, 1050], size: [0.8, 1.4], sway: 0, piles: false },
    blossom: { vy: [26, 60], size: [3, 5.5], sway: 40, piles: true, pileColor: ['#ffd1e3', '#f7a8c8'], colors: ['#ffc0d9', '#ffd6e6', '#ff9ec4', '#fff0f6'] },
    leaves: { vy: [40, 85], size: [4, 7], sway: 50, piles: true, pileColor: ['#e9a03b', '#b8561f'], colors: ['#e8742a', '#f2a33a', '#c9461f', '#e0b03a', '#9c3b16'] },
    hearts: { vy: [-40, -18], size: [4, 7], sway: 26, piles: false, colors: ['#ff5f8f', '#ff8fb1', '#ff3d6e', '#ffc2d4'] },
    confetti: { vy: [60, 120], size: [3, 5], sway: 30, piles: true, pileColor: ['#ffe36b', '#ff7ab6'], colors: ['#ff5f7e', '#ffd34d', '#5fd3ff', '#7dff9b', '#c38bff', '#ff9a4d'] }
  };

  DD.createWeather = function (env) {
    const st = env.stage;
    let cfg = Object.assign({}, CAT.defaultWeather, env.state.settings.weather || {});
    let type = CAT.resolveWeather(cfg.type, env.state.theme);
    const flakes = [];
    const fx = new DD.Particles(500); // splashes, puffs, falling clumps
    const dotImg = U.dot('rgba(255,255,255,1)', 16);
    let blizzardT = 0;
    let gust = 0;

    /* ---------------- surfaces & piles ---------------- */
    // surface: { id, x0, x1, y, segs:[[a,b],...] (visible ranges), h: Float32Array, max }
    const piles = new Map();
    function pileFor(id, x0, x1, y, max) {
      let p = piles.get(id);
      const n = Math.max(1, Math.ceil((x1 - x0) / BIN));
      if (!p || p.n !== n || Math.abs(p.x0 - x0) > 1 || Math.abs(p.y - y) > 1) {
        if (p) dropPile(p);
        p = { id, x0, x1, y, n, h: new Float32Array(n), max, segs: [[x0, x1]] };
        piles.set(id, p);
      }
      return p;
    }
    // The Dock: undefined = not known (pile along the whole bottom), null = no Dock at the
    // bottom (it's on the side), else { x, w } of the icon area in this window's coordinates.
    let dock;
    function groundRange() {
      if (dock === null) return null;
      if (dock && dock.w > 40) return [Math.max(0, dock.x + 3), Math.min(st.w, dock.x + dock.w - 3)];
      return [0, st.w];
    }
    function groundPile() {
      const r = groundRange();
      if (!r) {
        const old = piles.get('ground');
        if (old) {
          dropPile(old);
          piles.delete('ground');
        }
        return null;
      }
      return pileFor('ground', r[0], r[1], env.ground, 22);
    }
    function setDock(d) {
      const old = piles.get('ground');
      dock = d ? { x: d.x, w: d.w } : d;
      const r = groundRange();
      if (!old || !r) return groundPile();
      if (Math.abs(old.x0 - r[0]) <= 1 && Math.abs(old.x1 - r[1]) <= 1) return;
      // the Dock grew or shrank (an app opened/quit): keep the snow, re-laid over the new icons
      piles.delete('ground');
      const p = pileFor('ground', r[0], r[1], env.ground, 22);
      for (let i = 0; i < p.n; i++) {
        const x = p.x0 + i * BIN;
        const j = Math.floor((x - old.x0) / BIN);
        if (j >= 0 && j < old.n) p.h[i] = old.h[j];
      }
    }

    // snow that falls off a ledge (window closed, minimised or moved) as clumps that
    // land on whatever is underneath: another window or the Dock
    const clumps = [];
    function dropPile(p, gentle) {
      const col = (TYPES[type] || TYPES.snow).pileColor || ['#fff', '#fff'];
      for (let i = 0; i < p.n; i += 2) {
        const h = Math.max(p.h[i], p.h[i + 1] || 0);
        if (h < 0.8 || clumps.length > 900) continue;
        if (gentle && Math.random() < 0.5) continue;
        clumps.push({
          x: p.x0 + i * BIN + U.rand(-1, 1),
          y: p.y - h * U.rand(0.2, 0.9),
          vx: U.rand(-28, 28),
          vy: U.rand(-60, 15),
          r: Math.min(4.6, 1.1 + h * 0.26),
          amt: h * 2 * 0.85,
          col: Math.random() < 0.5 ? col[0] : col[1],
          piles: !!(TYPES[type] && TYPES[type].piles)
        });
      }
      p.h.fill(0);
    }
    function updateClumps(dt, g) {
      if (!clumps.length) return;
      g.save();
      for (let i = clumps.length - 1; i >= 0; i--) {
        const c = clumps[i];
        const yPrev = c.y;
        c.vy += 1150 * dt;
        c.vx *= Math.max(0, 1 - dt * 0.6);
        c.x += c.vx * dt;
        c.y += c.vy * dt;
        if (c.vy > 0 && c.piles) {
          const hit = surfaceHit(c.x, yPrev, c.y);
          if (hit) {
            addToPile(hit, c.x, c.amt);
            if (Math.random() < 0.3) fx.add({ x: c.x, y: c.y - 2, vx: U.rand(-50, 50), vy: U.rand(-90, -30), g: 600, life: 0.35, shrink: true, draw: DD.paint.circle(c.col, 1.3) });
            clumps.splice(i, 1);
            continue;
          }
        }
        if (c.y > st.h + 20) {
          clumps.splice(i, 1);
          continue;
        }
        g.globalAlpha = 0.95;
        g.fillStyle = c.col;
        g.beginPath();
        g.arc(c.x, c.y, c.r, 0, TAU);
        g.fill();
      }
      g.restore();
    }

    let windows = [];
    function setWindows(list) {
      windows = Array.isArray(list) ? list.filter((w) => w.w > 120 && w.h > 60) : [];
      const live = new Set(['ground']);
      // visible top edges: subtract windows in front (list is front-to-back)
      windows.forEach((w, i) => {
        const id = 'w' + w.id;
        live.add(id);
        const y = Math.round(w.y);
        if (y < 30) return; // menu-bar height / fullscreen windows have no ledge
        const p = pileFor(id, w.x, w.x + w.w, y, 16);
        let segs = [[w.x, w.x + w.w]];
        for (let j = 0; j < i; j++) {
          const f = windows[j];
          if (f.y <= y && f.y + f.h >= y - 18) {
            const next = [];
            for (const [a, b] of segs) {
              if (f.x + f.w <= a || f.x >= b) next.push([a, b]);
              else {
                if (f.x > a) next.push([a, f.x]);
                if (f.x + f.w < b) next.push([f.x + f.w, b]);
              }
            }
            segs = next;
          }
        }
        p.segs = segs;
      });
      for (const [id, p] of piles)
        if (!live.has(id)) {
          dropPile(p);
          piles.delete(id);
        }
    }

    function visibleAt(p, x) {
      for (const [a, b] of p.segs) if (x >= a && x < b) return true;
      return false;
    }

    function addToPile(p, x, amt) {
      const c = Math.floor((x - p.x0) / BIN);
      const w = [0.12, 0.22, 0.32, 0.22, 0.12];
      for (let k = -2; k <= 2; k++) {
        const i = c + k;
        if (i < 0 || i >= p.n) continue;
        p.h[i] = Math.min(p.max, p.h[i] + amt * w[k + 2]);
      }
    }
    function relax(p) {
      const h = p.h;
      for (let k = 0; k < 2; k++)
        for (let i = 1; i < p.n; i++) {
          const d = h[i] - h[i - 1];
          if (Math.abs(d) > 1.2) {
            const m = d * 0.25;
            h[i] -= m;
            h[i - 1] += m;
          }
        }
      // taper at the edges so it doesn't look like a block
      const edge = Math.min(6, p.n >> 1);
      for (let i = 0; i < edge; i++) {
        const cap = (i + 1) * 2.2;
        if (h[i] > cap) h[i] = cap;
        if (h[p.n - 1 - i] > cap) h[p.n - 1 - i] = cap;
      }
    }
    function surfaceHit(x, yPrev, y) {
      for (const p of piles.values()) {
        if (x < p.x0 || x >= p.x1) continue;
        const i = Math.floor((x - p.x0) / BIN);
        const top = p.y - (p.h[i] || 0);
        if (yPrev <= top && y >= top && visibleAt(p, x)) return p;
      }
      return null;
    }

    /* ---------------- flakes ---------------- */
    function target() {
      if (type === 'off') return 0;
      const area = (st.w * st.h) / (1440 * 900);
      const base = type === 'rain' ? 220 : type === 'leaves' ? 60 : type === 'hearts' ? 40 : 260;
      return Math.round(base * area * (AMOUNT[cfg.amount] || 1) * (blizzardT > 0 ? 2.2 : 1));
    }
    function spawn(initial) {
      const T = TYPES[type];
      const z = Math.random();
      const up = T.vy[0] < 0;
      flakes.push({
        x: Math.random() * (st.w + 200) - 100,
        y: initial ? Math.random() * st.h : up ? st.h + 10 : -10,
        vx: 0,
        vy: U.lerp(T.vy[0], T.vy[1], z),
        bvy: U.lerp(T.vy[0], T.vy[1], z),
        r: U.lerp(T.size[0], T.size[1], z),
        z,
        ph: Math.random() * TAU,
        rot: Math.random() * TAU,
        vr: U.rand(-3, 3),
        col: T.colors ? U.pick(T.colors) : null,
        pushX: 0,
        pushY: 0
      });
    }
    function windNow(t) {
      const base = { calm: 0, left: -70, right: 70, gusty: Math.sin(t * 0.35) * 120 + Math.sin(t * 1.3) * 40 }[cfg.wind] || 0;
      return base + gust;
    }

    /* ---------------- cursor: push flakes, brush piles, shake for a blizzard ---------------- */
    const shake = { lastDir: 0, flips: [] };
    const brush = { acc: 0, lastBall: -10, touched: -10, x: 0, y: 0 };
    function pointerUpdate(dt, t) {
      const p = env.pointer;
      if (!p.inside) return;
      const sp = Math.hypot(p.vx, p.vy);
      // shake detection: quick left-right reversals
      const dir = Math.sign(p.vx);
      const brushing = t - brush.touched < 0.8; // sweeping snow back and forth isn't a "shake"
      if (Math.abs(p.vx) > 900 && dir !== 0 && dir !== shake.lastDir && !brushing) {
        shake.flips.push(t);
        shake.lastDir = dir;
      }
      shake.flips = shake.flips.filter((ft) => t - ft < 1.1);
      if (shake.flips.length >= 6 && type !== 'off' && blizzardT <= 0) {
        blizzardT = 7;
        shake.flips = [];
        gust = (Math.random() < 0.5 ? -1 : 1) * 160;
        DD.sound.play('whoosh');
        DD.toast(type === 'snow' ? '❄️ Blizzard!' : '🌪️ Whoosh!', 2000);
      }
      // brush piles under a fast-moving cursor
      if (sp > 180) {
        for (const pile of piles.values()) {
          if (p.x < pile.x0 || p.x >= pile.x1) continue;
          const i = Math.floor((p.x - pile.x0) / BIN);
          const top = pile.y - pile.h[i];
          if (p.y > top - 12 && p.y < pile.y + 6 && pile.h[i] > 0.5) {
            const col = (TYPES[type] || TYPES.snow).pileColor || ['#fff'];
            for (let k = -4; k <= 4; k++) {
              const j = i + k;
              if (j < 0 || j >= pile.n || pile.h[j] < 0.3) continue;
              const take = pile.h[j] * 0.6;
              pile.h[j] -= take;
              brush.acc += take;
              brush.touched = t;
              brush.x = p.x;
              brush.y = pile.y;
              if (Math.random() < 0.5)
                fx.add({ x: pile.x0 + j * BIN, y: pile.y - pile.h[j] - 2, vx: p.vx * 0.25 + U.rand(-40, 40), vy: U.rand(-160, -40), g: 700, drag: 1.5, life: 1.1, shrink: true, draw: DD.paint.circle(col[0], U.rand(1.2, 2.6)) });
            }
          }
        }
        // enough snow gathered → it rolls into a snowball (themes that have them)
        brush.acc = Math.min(brush.acc, 260);
        if (type === 'snow' && brush.acc > 70 && t - brush.lastBall > 0.45 && env.onBrushSnow) {
          const r = U.clamp(8 + brush.acc * 0.035, 9, 15);
          if (env.onBrushSnow(brush.x, brush.y - r - 2, r, U.clamp(p.vx * 0.25, -300, 300))) {
            brush.acc = 0;
            brush.lastBall = t;
          }
        }
      }
      brush.acc *= Math.max(0, 1 - dt * 0.15); // gathered snow slowly crumbles away
    }

    /* ---------------- drawing ---------------- */
    function drawFlake(g, f, t) {
      if (type === 'snow') {
        const s = f.r * 2.6;
        g.globalAlpha = 0.45 + f.z * 0.55;
        g.drawImage(dotImg, f.x - s / 2, f.y - s / 2, s, s);
      } else if (type === 'rain') {
        g.globalAlpha = 0.25 + f.z * 0.35;
        g.strokeStyle = '#cfe3ff';
        g.lineWidth = f.r;
        g.beginPath();
        g.moveTo(f.x, f.y);
        g.lineTo(f.x - (f.vx / f.vy) * 18, f.y - 18);
        g.stroke();
      } else {
        g.save();
        g.globalAlpha = 0.6 + f.z * 0.4;
        g.translate(f.x, f.y);
        g.rotate(f.rot);
        g.fillStyle = f.col;
        const r = f.r;
        if (type === 'blossom') {
          g.scale(1, 0.6 + 0.4 * Math.abs(Math.sin(t * 2 + f.ph)));
          g.beginPath();
          g.moveTo(0, -r);
          g.quadraticCurveTo(r, -r * 0.2, 0, r);
          g.quadraticCurveTo(-r, -r * 0.2, 0, -r);
          g.fill();
        } else if (type === 'leaves') {
          g.scale(1, Math.cos(t * 2 + f.ph));
          g.beginPath();
          g.moveTo(-r, 0);
          g.quadraticCurveTo(0, -r * 0.8, r, 0);
          g.quadraticCurveTo(0, r * 0.8, -r, 0);
          g.fill();
          g.strokeStyle = 'rgba(80,30,10,0.4)';
          g.lineWidth = 0.7;
          g.beginPath();
          g.moveTo(-r, 0);
          g.lineTo(r, 0);
          g.stroke();
        } else if (type === 'hearts') {
          g.beginPath();
          g.moveTo(0, r * 0.7);
          g.bezierCurveTo(-r * 1.2, -r * 0.1, -r * 0.6, -r, 0, -r * 0.35);
          g.bezierCurveTo(r * 0.6, -r, r * 1.2, -r * 0.1, 0, r * 0.7);
          g.fill();
        } else {
          g.scale(1, Math.cos(t * 6 + f.ph));
          g.fillRect(-r, -r * 0.5, r * 2, r);
        }
        g.restore();
      }
    }

    function drawPiles(g, t) {
      const T = TYPES[type] || TYPES.snow;
      const col = T.pileColor || ['#ffffff', '#dde4ff'];
      for (const p of piles.values()) {
        let any = false;
        for (let i = 0; i < p.n; i++)
          if (p.h[i] > 0.4) {
            any = true;
            break;
          }
        if (!any) continue;
        g.save();
        // clip to visible parts of the ledge
        g.beginPath();
        for (const [a, b] of p.segs) g.rect(a, p.y - p.max - 6, b - a, p.max + 8);
        g.clip();
        const grd = g.createLinearGradient(0, p.y - p.max, 0, p.y);
        grd.addColorStop(0, col[0]);
        grd.addColorStop(1, col[1]);
        g.fillStyle = grd;
        g.shadowColor = 'rgba(10,20,60,0.25)';
        g.shadowBlur = 4;
        g.shadowOffsetY = 1;
        g.beginPath();
        g.moveTo(p.x0, p.y + 1);
        for (let i = 0; i < p.n; i++) g.lineTo(p.x0 + i * BIN + BIN / 2, p.y - p.h[i]);
        g.lineTo(p.x1, p.y + 1);
        g.closePath();
        g.fill();
        g.shadowColor = 'transparent';
        // sparkles on snow
        if (type === 'snow') {
          g.fillStyle = 'rgba(255,255,255,0.9)';
          for (let i = 3; i < p.n; i += 11) {
            const tw = Math.sin(t * 3 + i * 1.7);
            if (tw > 0.85 && p.h[i] > 3) g.fillRect(p.x0 + i * BIN, p.y - p.h[i] + 1.5, 1.5, 1.5);
          }
        }
        g.restore();
      }
    }

    /* ---------------- public ---------------- */
    let spawnAcc = 0;
    const api = {
      get type() {
        return type;
      },
      setConfig(next) {
        const prev = type;
        cfg = Object.assign({}, CAT.defaultWeather, next || {});
        type = CAT.resolveWeather(cfg.type, env.state.theme);
        if (prev !== type) {
          flakes.length = 0;
          if (!TYPES[type] || !TYPES[type].piles) for (const p of piles.values()) dropPile(p, true);
        }
      },
      setWindows,
      setDock,
      _debug: () => [...piles.values()].map((p) => ({ id: p.id, y: p.y, max: Math.max(...p.h), avg: p.h.reduce((a, b) => a + b, 0) / p.n })),
      clear() {
        for (const p of piles.values()) dropPile(p);
        DD.sound.play('whoosh');
      },
      // used by the snowplough / yeti
      clearGround(x0, x1, spray = true) {
        const p = groundPile();
        if (!p) return;
        for (let i = Math.max(0, Math.floor((x0 - p.x0) / BIN)); i < Math.min(p.n, Math.ceil((x1 - p.x0) / BIN)); i++) {
          if (spray && p.h[i] > 1 && Math.random() < 0.5)
            fx.add({ x: p.x0 + i * BIN, y: p.y - p.h[i], vx: U.rand(-60, 160), vy: U.rand(-260, -100), g: 900, life: 0.9, shrink: true, draw: DD.paint.circle('#fff', U.rand(1.5, 3)) });
          p.h[i] = 0;
        }
      },
      groundHeight(x) {
        const p = piles.get('ground');
        if (!p || x < p.x0 || x >= p.x1) return 0;
        return p.h[Math.floor((x - p.x0) / BIN)] || 0;
      },
      burst(n = 60) {
        if (type === 'off') return;
        for (let i = 0; i < n; i++) spawn(false);
      },
      frame(dt, t) {
        const g = st.ctx;
        if (type === 'off' && !piles.size && !fx.count && !clumps.length) return;
        groundPile();
        blizzardT = Math.max(0, blizzardT - dt);
        gust *= blizzardT > 0 ? 0.999 : Math.max(0, 1 - dt * 0.8);
        pointerUpdate(dt, t);
        const T = TYPES[type];
        // spawn toward the target count
        if (T && !cfg.paused) {
          const want = target();
          if (flakes.length < want) {
            if (!flakes.length) for (let i = 0; i < want * 0.6; i++) spawn(true);
            spawnAcc += dt * want * 0.6;
            while (spawnAcc > 1 && flakes.length < want) {
              spawn(false);
              spawnAcc -= 1;
            }
          }
        }
        const wind = windNow(t);
        const p = env.pointer;
        const pushOn = p.inside && Math.hypot(p.vx, p.vy) > 60;
        g.save();
        for (let i = flakes.length - 1; i >= 0; i--) {
          const f = flakes[i];
          const yPrev = f.y;
          // cursor wind: flakes near the cursor get blown along with it
          if (pushOn) {
            const dx = f.x - p.x,
              dy = f.y - p.y;
            const d2 = dx * dx + dy * dy;
            if (d2 < 120 * 120) {
              const k = 1 - Math.sqrt(d2) / 120;
              f.pushX += (p.vx * 0.9 * k - f.pushX) * Math.min(1, dt * 10);
              f.pushY += (p.vy * 0.6 * k - f.pushY) * Math.min(1, dt * 10);
            }
          }
          f.pushX *= Math.max(0, 1 - dt * 1.6);
          f.pushY *= Math.max(0, 1 - dt * 1.6);
          f.vx = wind * (0.4 + f.z * 0.8) + Math.sin(t * 0.9 + f.ph) * (T ? T.sway : 0) * (0.5 + f.z * 0.5);
          f.x += (f.vx + f.pushX) * dt;
          f.y += (f.bvy + f.pushY) * dt;
          f.rot += f.vr * dt;
          // land on ledges
          const hit = f.bvy > 0 && T && T.piles && (cfg.onWindows !== false || true) ? surfaceHit(f.x, yPrev, f.y) : null;
          if (hit && (hit.id === 'ground' || cfg.onWindows !== false)) {
            addToPile(hit, f.x, type === 'snow' ? f.r * 5 : f.r * 2.5);
            flakes.splice(i, 1);
            continue;
          }
          if (type === 'rain' && f.y > env.ground - 2 && yPrev <= env.ground - 2) {
            if (Math.random() < 0.25) fx.burst(f.x, env.ground - 2, 2, () => ({ vx: U.rand(-60, 60), vy: U.rand(-140, -60), g: 900, life: 0.3, draw: DD.paint.circle('rgba(200,225,255,0.7)', 1) }));
            flakes.splice(i, 1);
            continue;
          }
          if (f.y > st.h + 20 || f.y < -30 || f.x < -150 || f.x > st.w + 150 || !T) {
            flakes.splice(i, 1);
            continue;
          }
          drawFlake(g, f, t);
        }
        g.restore();
        updateClumps(dt, g);
        for (const pile of piles.values()) relax(pile);
        drawPiles(g, t);
        fx.update(dt);
        fx.draw(g);
      }
    };
    return api;
  };
})();
