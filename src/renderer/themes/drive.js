/* Night Drive – synthwave city that scrolls past + a customizable car, ramp and cones on the Dock. */
(function () {
  const DD = window.DD;
  const U = DD.util;
  const TAU = Math.PI * 2;

  /* ================================================================== car art */
  const BODIES = {
    coupe: { label: 'Coupe' },
    muscle: { label: 'Muscle' },
    hatch: { label: 'Hatchback' },
    pickup: { label: 'Pickup' },
    van: { label: 'Camper van' },
    roadster: { label: 'Roadster' },
    rally: { label: 'Rally' },
    taxi: { label: 'Taxi' }
  };
  const PAINTS = {
    red: { label: 'Cherry', c: '#e3263b' },
    blue: { label: 'Ocean', c: '#2f6bff' },
    yellow: { label: 'Sunny', c: '#ffc928' },
    green: { label: 'Mint', c: '#2fd39a' },
    pink: { label: 'Bubblegum', c: '#ff6fb5' },
    white: { label: 'Pearl', c: '#eef0f6' },
    black: { label: 'Midnight', c: '#22232e' },
    chrome: { label: 'Chrome', c: '#b9c0cc', chrome: true }
  };
  const WHEELS = {
    classic: { label: 'Classic' },
    sport: { label: 'Sport' },
    neon: { label: 'Neon' },
    whitewall: { label: 'Whitewall' },
    gold: { label: 'Gold' },
    offroad: { label: 'Off-road' }
  };
  const EXTRAS = {
    none: { label: 'None' },
    spoiler: { label: 'Spoiler' },
    underglow: { label: 'Underglow' },
    beacon: { label: 'Beacon' },
    surf: { label: 'Surfboard' },
    flames: { label: 'Flames' },
    stripes: { label: 'Stripes' },
    tree: { label: 'Xmas tree' }
  };
  const DEFAULT_CAR = { body: 'coupe', paint: 'red', wheels: 'sport', extra: 'underglow' };

  // body outline points (x right, y up negative), origin = between wheels on the ground
  function bodyPath(g, type) {
    const P = {
      coupe: [[-46, -10], [-46, -20], [-30, -24], [-14, -38], [12, -38], [26, -26], [46, -22], [48, -12], [46, -10]],
      muscle: [[-48, -10], [-48, -24], [-26, -26], [-14, -38], [10, -38], [22, -27], [48, -25], [49, -12], [48, -10]],
      hatch: [[-38, -10], [-38, -34], [-30, -44], [8, -44], [22, -28], [40, -24], [41, -12], [40, -10]],
      pickup: [[-50, -10], [-50, -28], [-8, -28], [-8, -44], [14, -44], [24, -30], [46, -27], [47, -12], [46, -10]],
      van: [[-44, -10], [-44, -54], [-36, -60], [26, -60], [34, -44], [44, -32], [45, -12], [44, -10]],
      roadster: [[-44, -10], [-44, -22], [-12, -24], [0, -34], [4, -24], [44, -21], [46, -12], [44, -10]],
      rally: [[-40, -12], [-40, -34], [-30, -44], [10, -44], [24, -30], [42, -26], [43, -14], [40, -12]],
      taxi: [[-48, -10], [-48, -24], [-28, -26], [-16, -40], [14, -40], [26, -27], [48, -24], [49, -12], [48, -10]]
    }[type];
    g.beginPath();
    P.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    g.closePath();
  }
  function windowPath(g, type) {
    const P = {
      coupe: [[-26, -25], [-13, -35], [10, -35], [22, -26]],
      muscle: [[-23, -27], [-12, -35], [8, -35], [18, -28]],
      hatch: [[-32, -32], [-27, -41], [6, -41], [18, -29]],
      pickup: [[-5, -30], [-5, -41], [12, -41], [20, -30]],
      van: [[-38, -44], [-38, -55], [24, -55], [30, -44]],
      roadster: [[-2, -25], [1, -31], [3, -25]],
      rally: [[-34, -32], [-28, -41], [8, -41], [20, -30]],
      taxi: [[-25, -27], [-14, -37], [12, -37], [22, -28]]
    }[type];
    g.beginPath();
    P.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    g.closePath();
  }

  function drawWheel(g, x, kind, rot, glow) {
    const big = kind === 'offroad';
    const r = big ? 14 : 11;
    g.save();
    g.translate(x, -r);
    g.fillStyle = '#121218';
    g.beginPath();
    g.arc(0, 0, r, 0, TAU);
    g.fill();
    if (big) {
      g.fillStyle = '#26262f';
      for (let i = 0; i < 12; i++) {
        const a = rot + (i / 12) * TAU;
        g.fillRect(Math.cos(a) * r - 2, Math.sin(a) * r - 2, 4, 4);
      }
    }
    if (kind === 'whitewall') {
      g.strokeStyle = '#f2f2f2';
      g.lineWidth = 2.6;
      g.beginPath();
      g.arc(0, 0, r * 0.68, 0, TAU);
      g.stroke();
    }
    const hub = { classic: '#c9ced8', sport: '#2a2a33', neon: '#0d0d16', whitewall: '#d9dde6', gold: '#f2c14e', offroad: '#8a8f99' }[kind];
    g.fillStyle = hub;
    g.beginPath();
    g.arc(0, 0, r * 0.52, 0, TAU);
    g.fill();
    g.strokeStyle = kind === 'sport' ? '#e8304a' : kind === 'neon' ? '#38f0ff' : 'rgba(0,0,0,0.35)';
    g.lineWidth = kind === 'neon' ? 2 : 1.6;
    for (let i = 0; i < 5; i++) {
      const a = rot + (i / 5) * TAU;
      g.beginPath();
      g.moveTo(0, 0);
      g.lineTo(Math.cos(a) * r * 0.5, Math.sin(a) * r * 0.5);
      g.stroke();
    }
    if (kind === 'neon') {
      g.strokeStyle = '#38f0ff';
      g.shadowColor = '#38f0ff';
      g.shadowBlur = glow ? 10 : 6;
      g.beginPath();
      g.arc(0, 0, r * 0.62, 0, TAU);
      g.stroke();
      g.shadowBlur = 0;
    }
    g.restore();
  }

  function drawCar(g, car, a = {}) {
    const t = a.t || 0;
    const paint = PAINTS[car.paint] || PAINTS.red;
    const lift = car.wheels === 'offroad' ? 6 : 0;
    const rot = a.wheelRot || 0;
    g.save();
    if (car.extra === 'underglow') {
      const grd = g.createRadialGradient(0, -2, 4, 0, -2, 60);
      grd.addColorStop(0, 'rgba(255,60,220,0.75)');
      grd.addColorStop(1, 'rgba(255,60,220,0)');
      g.fillStyle = grd;
      g.beginPath();
      g.ellipse(0, -2, 62, 10, 0, 0, TAU);
      g.fill();
    } else if (!a.noShadow) {
      g.fillStyle = 'rgba(0,0,0,0.35)';
      g.beginPath();
      g.ellipse(0, 0, 48, 5, 0, 0, TAU);
      g.fill();
    }
    g.translate(0, -lift - (a.bounce || 0));
    // surfboard behind
    if (car.extra === 'surf') {
      g.save();
      g.translate(-4, car.body === 'van' ? -63 : -46);
      g.rotate(-0.04);
      g.fillStyle = '#ffb347';
      g.beginPath();
      g.ellipse(0, 0, 44, 4.5, 0, 0, TAU);
      g.fill();
      g.fillStyle = '#2fd3c4';
      g.fillRect(-44, -1, 88, 2);
      g.restore();
    }
    // body
    bodyPath(g, car.body);
    if (paint.chrome) {
      const grd = g.createLinearGradient(0, -44, 0, -8);
      grd.addColorStop(0, '#f4f6fa');
      grd.addColorStop(0.45, '#8f97a6');
      grd.addColorStop(0.55, '#dfe3ea');
      grd.addColorStop(1, '#6d7480');
      g.fillStyle = grd;
    } else {
      const grd = g.createLinearGradient(0, -50, 0, -8);
      grd.addColorStop(0, U.shade(paint.c, 0.35));
      grd.addColorStop(0.5, paint.c);
      grd.addColorStop(1, U.shade(paint.c, -0.35));
      g.fillStyle = car.body === 'taxi' && car.paint === 'red' ? '#ffc928' : grd;
    }
    g.fill();
    // decals (clipped to body)
    g.save();
    bodyPath(g, car.body);
    g.clip();
    if (car.extra === 'stripes') {
      g.fillStyle = 'rgba(255,255,255,0.9)';
      g.fillRect(-60, -21, 120, 3);
      g.fillRect(-60, -16, 120, 2);
    }
    if (car.extra === 'flames') {
      const fg = g.createLinearGradient(-10, 0, 46, 0);
      fg.addColorStop(0, '#ffe14d');
      fg.addColorStop(1, '#ff3d1f');
      g.fillStyle = fg;
      g.beginPath();
      g.moveTo(48, -12);
      for (let i = 0; i <= 6; i++) {
        const x = 46 - i * 9;
        g.lineTo(x - 4, -24 + Math.sin(i * 1.3 + t * 6) * 2);
        g.lineTo(x - 9, -15);
      }
      g.lineTo(-10, -12);
      g.closePath();
      g.fill();
    }
    if (car.body === 'taxi') {
      g.fillStyle = '#111';
      for (let i = 0; i < 10; i++) g.fillRect(-48 + i * 10, -18, 5, 3);
    }
    // body line + highlight
    g.fillStyle = 'rgba(255,255,255,0.18)';
    g.fillRect(-60, -24, 120, 1.5);
    g.fillStyle = 'rgba(0,0,0,0.18)';
    g.fillRect(-60, -13, 120, 3);
    g.restore();
    // windows
    windowPath(g, car.body);
    const wg = g.createLinearGradient(0, -44, 0, -24);
    wg.addColorStop(0, '#9fd8ff');
    wg.addColorStop(1, '#263b66');
    g.fillStyle = wg;
    g.fill();
    if (car.body !== 'roadster' && car.body !== 'van') {
      g.fillStyle = paint.chrome ? '#8f97a6' : U.shade(paint.c, -0.3);
      g.fillRect(-2, -40, 2.5, 16);
    }
    if (car.body === 'roadster') {
      g.fillStyle = '#2a1a1a';
      g.beginPath();
      g.arc(-14, -28, 5, 0, TAU);
      g.fill();
      g.fillStyle = '#f3c9a5';
      g.beginPath();
      g.arc(-12, -34, 4.5, 0, TAU);
      g.fill();
    }
    if (car.body === 'pickup') {
      g.fillStyle = 'rgba(0,0,0,0.25)';
      g.fillRect(-48, -28, 38, 3);
    }
    if (car.body === 'van') {
      g.fillStyle = '#fff';
      g.fillRect(-44, -32, 88, 6);
    }
    // lights
    const flash = a.flash || 0;
    g.fillStyle = '#fff6c9';
    g.beginPath();
    g.ellipse(44, -19, 2.4, 3.4, 0, 0, TAU);
    g.fill();
    const hb = g.createLinearGradient(46, 0, 46 + 120, 0);
    hb.addColorStop(0, `rgba(255,248,200,${0.25 + flash * 0.6})`);
    hb.addColorStop(1, 'rgba(255,248,200,0)');
    g.fillStyle = hb;
    g.beginPath();
    g.moveTo(46, -21);
    g.lineTo(46 + 120, -32 - flash * 10);
    g.lineTo(46 + 120, 0 + flash * 6);
    g.lineTo(46, -16);
    g.fill();
    g.fillStyle = a.braking ? '#ff2a3a' : '#c4142a';
    g.fillRect(car.body === 'pickup' ? -51 : -47, -22, 3.5, 6);
    if (a.braking) U.glow(g, -48, -19, 14, 'rgba(255,40,60,0.6)');
    // roof extras
    const roofY = { coupe: -38, muscle: -38, hatch: -44, pickup: -44, van: -60, roadster: -24, rally: -44, taxi: -40 }[car.body];
    if (car.body === 'taxi') {
      g.fillStyle = '#ffe14d';
      U.rrect(g, -8, roofY - 7, 16, 7, 2);
      g.fill();
      g.fillStyle = '#111';
      g.font = 'bold 5px sans-serif';
      g.textAlign = 'center';
      g.fillText('TAXI', 0, roofY - 1.8);
    }
    if (car.body === 'rally') {
      g.fillStyle = '#222';
      g.fillRect(-26, roofY - 4, 34, 3);
      for (let i = 0; i < 4; i++) {
        g.fillStyle = '#fff8c0';
        g.beginPath();
        g.arc(-22 + i * 9, roofY - 7, 3, 0, TAU);
        g.fill();
      }
    }
    if (car.extra === 'spoiler') {
      g.fillStyle = paint.chrome ? '#555' : U.shade(paint.c, -0.4);
      g.fillRect(-46, -30, 3, 8);
      g.fillRect(-52, -33, 18, 4);
    }
    if (car.extra === 'beacon') {
      const on = Math.sin(t * 12) > 0;
      g.fillStyle = on ? '#ffb020' : '#a5650a';
      U.rrect(g, -5, roofY - 7, 10, 7, 3);
      g.fill();
      if (on) U.glow(g, 0, roofY - 4, 26, 'rgba(255,176,32,0.7)');
    }
    if (car.extra === 'tree') {
      g.save();
      g.translate(-6, roofY - 2);
      g.fillStyle = '#5a3a22';
      g.fillRect(-2, -3, 4, 3);
      g.fillStyle = '#1f8a4c';
      for (let k = 0; k < 3; k++) {
        g.beginPath();
        g.moveTo(-10 + k * 2.5, -3 - k * 6);
        g.lineTo(0, -14 - k * 6);
        g.lineTo(10 - k * 2.5, -3 - k * 6);
        g.fill();
      }
      g.strokeStyle = '#c4142a';
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(-4, -2);
      g.lineTo(-30, 8);
      g.stroke();
      ['#ffd34d', '#ff5f7e', '#5fd3ff'].forEach((c, i) => {
        g.fillStyle = Math.sin(t * 5 + i * 2) > 0 ? c : 'rgba(255,255,255,0.3)';
        g.beginPath();
        g.arc(-4 + i * 4, -8 - i * 5, 1.4, 0, TAU);
        g.fill();
      });
      g.fillStyle = '#ffd34d';
      g.beginPath();
      g.arc(0, -27, 2, 0, TAU);
      g.fill();
      g.restore();
    }
    // wheel arches + wheels
    g.fillStyle = 'rgba(0,0,0,0.55)';
    const wb = car.body === 'van' || car.body === 'pickup' ? 31 : 29;
    for (const sx of [-wb, wb]) {
      g.beginPath();
      g.arc(sx, -10 + lift * 0, 14, Math.PI, 0);
      g.fill();
    }
    g.restore();
    g.save();
    for (const sx of [-wb, wb]) drawWheel(g, sx, car.wheels, rot, flash > 0);
    g.restore();
  }

  /* ================================================================== wallpaper */
  function background(env) {
    const st = env.stage;
    let L = null;
    let stars = [];
    let TW = 1800;
    let roadY = 0;
    const traffic = [];
    let lampOff = 0,
      dashOff = 0,
      farOff = 0,
      nearOff = 0;
    const blinkers = [];

    function cityStrip(seed, h, colA, colB, winCols, neon, tall, winP = 0.42) {
      const rnd = U.rng(seed);
      return U.layer(TW, h, st.dpr, (g) => {
        let x = 0;
        while (x < TW) {
          const w = 30 + rnd() * 70;
          const bh = h * (0.25 + rnd() * (tall ? 0.75 : 0.55));
          const grd = g.createLinearGradient(0, h - bh, 0, h);
          grd.addColorStop(0, colA);
          grd.addColorStop(1, colB);
          g.fillStyle = grd;
          g.fillRect(x, h - bh, w - 2, bh);
          // roof bits
          if (rnd() < 0.3) g.fillRect(x + w * 0.4, h - bh - 14, 2, 14);
          if (rnd() < 0.25) {
            g.fillRect(x + 6, h - bh - 6, w * 0.4, 6);
          }
          // windows
          const cw = 4,
            ch = 3;
          for (let yy = h - bh + 8; yy < h - 6; yy += 8)
            for (let xx = x + 5; xx < x + w - 8; xx += 7) {
              if (rnd() < winP) {
                g.fillStyle = U.pick(winCols);
                g.globalAlpha = 0.4 + rnd() * 0.6;
                g.fillRect(xx, yy, cw, ch);
                g.globalAlpha = 1;
              }
            }
          // neon signs
          if (neon && rnd() < 0.22 && bh > h * 0.35) {
            const c = U.pick(['#ff3fd0', '#38f0ff', '#ffe14d', '#7c5cff']);
            g.save();
            g.shadowColor = c;
            g.shadowBlur = 14;
            g.strokeStyle = c;
            g.lineWidth = 2.5;
            const sy = h - bh + 16 + rnd() * 30;
            if (rnd() < 0.5) {
              U.rrect(g, x + 6, sy, w - 16, 14, 4);
              g.stroke();
              g.fillStyle = c;
              for (let k = 0; k < (w - 24) / 6; k++) g.fillRect(x + 10 + k * 6, sy + 5, 3, 4);
            } else {
              g.beginPath();
              g.moveTo(x + w - 10, sy);
              g.lineTo(x + w - 10, sy + 44);
              g.stroke();
            }
            g.restore();
          }
          x += w;
        }
      });
    }

    function build() {
      const W = st.w,
        H = st.h,
        dpr = st.dpr;
      TW = Math.max(1800, Math.ceil(W / 2));
      const rnd = U.rng(31337);
      const horizon = H * 0.6;
      roadY = H * 0.78;
      stars = [];
      for (let i = 0; i < (W * H) / 5000; i++) stars.push({ x: rnd() * W, y: rnd() * H * 0.45, r: rnd() * 1.3 + 0.2, p: rnd() * TAU });
      const sky = U.layer(W, H, dpr, (g) => {
        const grd = g.createLinearGradient(0, 0, 0, horizon);
        grd.addColorStop(0, '#07021a');
        grd.addColorStop(0.45, '#2b0b52');
        grd.addColorStop(0.75, '#7a1f7a');
        grd.addColorStop(1, '#ff6f7d');
        g.fillStyle = grd;
        g.fillRect(0, 0, W, H);
        // sun
        const sx = W * 0.5,
          sy = horizon - H * 0.05,
          sr = H * 0.2;
        U.glow(g, sx, sy, sr * 2.2, 'rgba(255,90,160,0.35)');
        g.save();
        g.beginPath();
        g.arc(sx, sy, sr, 0, TAU);
        g.clip();
        const sg = g.createLinearGradient(0, sy - sr, 0, sy + sr);
        sg.addColorStop(0, '#ffe36b');
        sg.addColorStop(0.55, '#ff7a59');
        sg.addColorStop(1, '#ff2d95');
        g.fillStyle = sg;
        g.fillRect(sx - sr, sy - sr, sr * 2, sr * 2);
        for (let i = 0; i < 8; i++) {
          const y = sy + i * sr * 0.12 + sr * 0.05;
          g.clearRect(sx - sr, y, sr * 2, 2 + i * 1.6);
        }
        g.restore();
        // mountains
        const pts = DD.alps(rnd, W, horizon, H * 0.16, 8);
        g.beginPath();
        g.moveTo(-20, H);
        pts.forEach((p) => g.lineTo(p[0], p[1]));
        g.lineTo(W + 20, H);
        const mg = g.createLinearGradient(0, horizon - H * 0.16, 0, horizon);
        mg.addColorStop(0, '#5a1a7a');
        mg.addColorStop(1, '#1a0630');
        g.fillStyle = mg;
        g.fill();
        g.strokeStyle = 'rgba(255,90,200,0.55)';
        g.lineWidth = 1.5;
        g.beginPath();
        pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])));
        g.stroke();
      });
      const farCity = cityStrip(7, H * 0.24, '#33125c', '#1a0836', ['#ff8ad8', '#8ae8ff', '#ffe28a'], false, false, 0.18);
      const nearCity = cityStrip(11, H * 0.3, '#140629', '#08020f', ['#ffd27a', '#7fe7ff', '#ff7ad1', '#ffffff'], true, false, 0.28);
      const ground = U.layer(W, H, dpr, (g) => {
        // water under the highway
        const wg = g.createLinearGradient(0, roadY, 0, H);
        wg.addColorStop(0, '#12052a');
        wg.addColorStop(1, '#05010e');
        g.fillStyle = wg;
        g.fillRect(0, roadY, W, H - roadY);
      });
      L = { sky, farCity, nearCity, ground, horizon };
      traffic.length = 0;
      for (let i = 0; i < 12; i++) traffic.push(newCar(rnd() * W * 1.5, i % 2));
      blinkers.length = 0;
      for (let i = 0; i < 14; i++) blinkers.push({ x: rnd() * TW, y: H * 0.6 - H * 0.4 * (0.4 + rnd() * 0.5), p: rnd() * TAU });
    }
    function newCar(x, lane) {
      return {
        x,
        lane,
        v: lane ? U.rand(-60, 40) : U.rand(-700, -500),
        col: U.pick(['#ff3fd0', '#38f0ff', '#ffe14d', '#ffffff', '#ff6b6b', '#7c5cff']),
        len: U.rand(46, 70),
        h: U.rand(14, 20)
      };
    }
    st.onResize.push(build);
    build();

    return {
      action() {},
      frame(dt, t) {
        const g = st.ctx,
          W = st.w,
          H = st.h;
        const speed = 260; // camera speed px/s
        g.drawImage(L.sky, 0, 0, W, H);
        g.fillStyle = '#fff';
        for (const s of stars) {
          g.globalAlpha = 0.3 + 0.6 * (0.5 + 0.5 * Math.sin(t * 2 + s.p));
          g.fillRect(s.x, s.y, s.r, s.r);
        }
        g.globalAlpha = 1;
        // parallax skylines
        farOff = (farOff + speed * 0.08 * dt) % TW;
        nearOff = (nearOff + speed * 0.25 * dt) % TW;
        const farH = H * 0.24,
          nearH = H * 0.3;
        for (let k = -1; k < Math.ceil(W / TW) + 1; k++) {
          g.drawImage(L.farCity, k * TW - farOff, L.horizon - farH + 6, TW, farH);
        }
        for (let k = -1; k < Math.ceil(W / TW) + 1; k++) {
          g.drawImage(L.nearCity, k * TW - nearOff, roadY - nearH + 4, TW, nearH);
        }
        // aircraft-warning blinkers
        for (const b of blinkers) {
          const x = (((b.x - nearOff) % TW) + TW) % TW;
          if (Math.sin(t * 3 + b.p) > 0.7) U.glow(g, x, b.y, 8, 'rgba(255,40,60,0.9)');
        }
        // highway deck
        g.drawImage(L.ground, 0, 0, W, H);
        g.fillStyle = '#0e0620';
        g.fillRect(0, roadY - 30, W, 40);
        g.fillStyle = '#1d0d3a';
        g.fillRect(0, roadY - 32, W, 4);
        g.fillStyle = '#2a1150';
        g.fillRect(0, roadY + 6, W, 6);
        // lane dashes
        dashOff = (dashOff + speed * dt) % 80;
        g.fillStyle = 'rgba(255,220,120,0.6)';
        for (let x = -dashOff; x < W; x += 80) g.fillRect(x, roadY - 13, 36, 2);
        // street lamps passing
        lampOff = (lampOff + speed * dt) % 300;
        for (let x = -lampOff; x < W + 300; x += 300) {
          g.fillStyle = '#1a0b33';
          g.fillRect(x, roadY - 120, 4, 92);
          g.fillRect(x, roadY - 120, 26, 3);
          U.glow(g, x + 24, roadY - 116, 40, 'rgba(255,200,120,0.4)');
          const cone = g.createLinearGradient(0, roadY - 116, 0, roadY - 30);
          cone.addColorStop(0, 'rgba(255,200,120,0.18)');
          cone.addColorStop(1, 'rgba(255,200,120,0)');
          g.fillStyle = cone;
          g.beginPath();
          g.moveTo(x + 20, roadY - 116);
          g.lineTo(x - 10, roadY - 30);
          g.lineTo(x + 60, roadY - 30);
          g.lineTo(x + 28, roadY - 116);
          g.fill();
        }
        // traffic
        for (const c of traffic) {
          c.x += (c.v - (c.lane ? 0 : 0)) * dt;
          if (c.x < -200 || c.x > W + 300) Object.assign(c, newCar(c.v < 0 ? W + U.rand(50, 600) : -U.rand(50, 400), c.lane));
          const y = roadY - (c.lane ? 4 : 18);
          const dir = c.lane ? 1 : -1;
          g.fillStyle = '#05020c';
          U.rrect(g, c.x, y - c.h, c.len, c.h, 6);
          g.fill();
          g.fillStyle = c.col;
          g.globalAlpha = 0.7;
          g.fillRect(c.x + 4, y - c.h + 2, c.len - 8, 1.5);
          g.globalAlpha = 1;
          // head/tail lights
          const front = dir > 0 ? c.x + c.len : c.x;
          const back = dir > 0 ? c.x : c.x + c.len;
          U.glow(g, front, y - 6, 16, 'rgba(255,250,220,0.9)');
          U.glow(g, back, y - 6, 10, 'rgba(255,40,60,0.9)');
          if (!c.lane) {
            const tr = g.createLinearGradient(back, 0, back + 160, 0);
            tr.addColorStop(0, 'rgba(255,40,60,0.35)');
            tr.addColorStop(1, 'rgba(255,40,60,0)');
            g.fillStyle = tr;
            g.fillRect(back, y - 8, 160, 3);
          }
        }
        // barrier in front
        g.fillStyle = '#160a2c';
        g.fillRect(0, roadY + 1, W, 6);
        // reflections in the water
        g.globalAlpha = 0.3;
        for (let y = roadY + 20; y < H; y += 6) {
          const k = (y - roadY) / (H - roadY);
          for (let i = 0; i < 6; i++) {
            const x = (((i * 337 + t * 30 * (i % 2 ? 1 : -1)) % W) + W) % W;
            g.fillStyle = ['#ff3fd0', '#38f0ff', '#ffe14d'][i % 3];
            g.fillRect(x + Math.sin(t * 1.5 + y * 0.05) * 4, y, 50 * (1 - k * 0.7), 1.2);
          }
        }
        g.globalAlpha = 1;
      }
    };
  }

  /* ================================================================== toys */
  function toys(env) {
    const st = env.stage;
    const P = env.particles;
    const ground = () => env.ground;
    const W = () => st.w;
    const saved = env.load() || {};
    const car = Object.assign({}, DEFAULT_CAR, saved.car || {});
    let dirty = false;
    const smokeImg = U.dot('rgba(230,230,240,1)', 16);

    const C = {
      x: saved.x ?? W() / 2 - 120,
      y: ground(),
      vx: 0,
      vy: 0,
      ang: 0,
      va: 0,
      dir: 1,
      wheelRot: 0,
      held: false,
      onGround: true,
      flash: 0,
      bounce: 0,
      mode: 'idle',
      modeT: U.rand(6, 12),
      target: 0,
      braking: false,
      kind: 'car'
    };
    const halfW = 50;
    C.pick = (px, py) => Math.abs(px - C.x) < halfW + 6 && py > C.y - 60 && py < C.y + 6;
    C.bubbleAnchor = () => ({ x: C.x, y: C.y - 64 });
    C.onGrab = () => {
      C.held = true;
      C.mode = 'idle';
      DD.sound.play('rev');
    };
    C.onDrag = (px, py) => {
      C.ang = U.clamp((px - C.x) * 0.02, -0.6, 0.6);
      C.x = px;
      C.y = Math.min(ground(), py + 28);
    };
    C.onRelease = (vx, vy) => {
      C.held = false;
      C.vx = vx * 0.7;
      C.vy = vy * 0.7;
      C.va = vx * 0.004;
      if (Math.abs(vx) > 30) C.dir = Math.sign(vx);
      dirty = true;
    };
    C.onClick = () => {
      DD.sound.play('honk');
      C.flash = 1;
      if (C.onGround) C.vy = -260;
      DD.bubbles.say(C, U.pick(['Beep beep!', 'Vroom!', 'Road trip?', 'Honk honk!']), 1.6);
    };
    C.onDblClick = () => openGarage();

    /* ---------------- ramp & cones ---------------- */
    const ramp = DD.prop({
      x: saved.ramp ?? W() / 2 + 120,
      w: 80,
      h: 26,
      groundFn: ground,
      widthFn: W,
      kind: 'ramp',
      dir: saved.rampDir || -1,
      draw: (g, p) => {
        g.scale(p.dir, 1);
        const grd = g.createLinearGradient(0, -26, 0, 0);
        grd.addColorStop(0, '#ffb020');
        grd.addColorStop(1, '#a25a00');
        g.fillStyle = grd;
        g.beginPath();
        g.moveTo(-40, 0);
        g.lineTo(40, 0);
        g.lineTo(40, -26);
        g.closePath();
        g.fill();
        g.fillStyle = '#1a1a1a';
        for (let i = 0; i < 4; i++) {
          g.save();
          g.beginPath();
          g.moveTo(-40, 0);
          g.lineTo(40, 0);
          g.lineTo(40, -26);
          g.closePath();
          g.clip();
          g.fillRect(-30 + i * 22, -30, 9, 34);
          g.restore();
        }
      },
      onClick: (p) => {
        ramp.dir *= -1;
        ramp.squash = 0.2;
        DD.sound.play('pop');
        dirty = true;
      },
      onRelease: () => (dirty = true),
      onLand: () => DD.sound.play('thud')
    });
    ramp.onClick = () => {
      ramp.dir *= -1;
      ramp.squash = 0.2;
      DD.sound.play('pop');
      dirty = true;
    };

    function Cone(x) {
      const c = { kind: 'cone', x, y: ground(), vx: 0, vy: 0, ang: 0, va: 0, held: false };
      c.pick = (px, py) => Math.abs(px - c.x) < 12 && py > c.y - 30 && py < c.y + 4;
      c.onGrab = () => (c.held = true);
      c.onDrag = (px, py) => {
        c.x = px;
        c.y = Math.min(ground(), py + 14);
        c.ang = 0;
      };
      c.onRelease = (vx, vy) => {
        c.held = false;
        c.vx = vx * 0.6;
        c.vy = vy * 0.6;
        c.va = vx * 0.01;
      };
      c.onClick = () => {
        c.vy = -380;
        c.va = U.rand(-12, 12);
        DD.sound.play('pop');
      };
      c.update = (dt) => {
        if (c.held) return;
        c.vy += 2000 * dt;
        c.x += c.vx * dt;
        c.y += c.vy * dt;
        c.ang += c.va * dt;
        if (c.y >= ground()) {
          c.y = ground();
          c.vy = Math.abs(c.vy) > 200 ? -c.vy * 0.35 : 0;
          c.vx *= 0.9;
          c.va *= 0.6;
          // settle upright or on its side
          const a = ((c.ang % TAU) + TAU) % TAU;
          const target = Math.abs(a - Math.PI / 2) < 0.8 ? Math.PI / 2 : Math.abs(a - Math.PI * 1.5) < 0.8 ? Math.PI * 1.5 : a > Math.PI ? TAU : 0;
          c.ang = a + (target - a) * Math.min(1, dt * 8);
        }
        if (c.x < 10 || c.x > W() - 10) {
          c.vx *= -0.5;
          c.x = U.clamp(c.x, 10, W() - 10);
        }
      };
      c.draw = (g) => {
        g.save();
        g.translate(c.x, c.y - 14);
        g.rotate(c.ang);
        g.translate(0, 14);
        g.fillStyle = 'rgba(0,0,0,0.3)';
        g.beginPath();
        g.ellipse(0, 0, 12, 2.5, 0, 0, TAU);
        g.fill();
        g.fillStyle = '#ff6a1a';
        g.beginPath();
        g.moveTo(-9, -2);
        g.lineTo(-3, -28);
        g.lineTo(3, -28);
        g.lineTo(9, -2);
        g.fill();
        g.fillStyle = '#fff';
        g.beginPath();
        g.moveTo(-6.5, -12);
        g.lineTo(-4.8, -19);
        g.lineTo(4.8, -19);
        g.lineTo(6.5, -12);
        g.fill();
        g.fillStyle = '#222';
        g.fillRect(-12, -3, 24, 3);
        g.restore();
      };
      return c;
    }
    const cones = (saved.cones || [W() / 2 + 230, W() / 2 + 260, W() / 2 + 290]).map((x) => Cone(U.clamp(x, 20, W() - 20)));

    /* ---------------- car physics ---------------- */
    function updateCar(dt) {
      C.flash = Math.max(0, C.flash - dt * 2.5);
      if (C.held) {
        C.wheelRot += dt * 20;
        return;
      }
      const G = ground();
      // autopilot
      C.modeT -= dt;
      C.braking = false;
      if (C.onGround && C.mode === 'idle' && C.modeT < 0) {
        C.mode = 'drive';
        C.target = U.rand(80, W() - 80);
        C.modeT = 8;
      }
      if (C.mode === 'drive' && C.onGround) {
        const dx = C.target - C.x;
        if (Math.abs(dx) < 20 || C.modeT < 0) {
          C.mode = 'idle';
          C.modeT = U.rand(8, 20);
          if (Math.abs(C.vx) > 100) DD.sound.play('screech');
        } else {
          C.dir = Math.sign(dx);
          const want = C.dir * Math.min(420, 120 + Math.abs(dx));
          C.vx += (want - C.vx) * Math.min(1, dt * 1.6);
          if (Math.random() < 0.3) P.add({ x: C.x - C.dir * 50, y: G - 8, vx: -C.dir * U.rand(20, 60), vy: U.rand(-30, -10), life: 0.8, alpha: 0.35, draw: DD.paint.sprite(smokeImg, 10), update: (p, d) => {} });
        }
      }
      if (C.mode === 'idle' && C.onGround) {
        if (Math.abs(C.vx) > 40) C.braking = true;
        C.vx *= Math.max(0, 1 - 2.5 * dt);
      }
      // integrate
      C.vy += 2000 * dt;
      C.x += C.vx * dt;
      C.y += C.vy * dt;
      if (!C.onGround) C.ang += C.va * dt;
      // ramp launch
      const rx0 = ramp.x - 40,
        rx1 = ramp.x + 40;
      if (C.onGround && C.x > rx0 && C.x < rx1 && Math.abs(C.vx) > 140 && Math.sign(C.vx) === ramp.dir && ramp.lift < 2) {
        const sp = Math.abs(C.vx);
        C.vy = -Math.min(1100, sp * 1.25);
        C.va = Math.sign(C.vx) * (sp > 330 ? (TAU / ((2 * C.vy) / -2000)) * 1.0 : 1.2);
        C.onGround = false;
        C.y = G - 27;
        DD.sound.play('whoosh');
        if (sp > 330) DD.bubbles.say(C, 'Wheee!', 1.4);
      }
      if (C.y >= G) {
        if (!C.onGround) {
          const impact = C.vy;
          const a = ((C.ang % TAU) + TAU) % TAU;
          const upright = a < 0.7 || a > TAU - 0.7;
          if (impact > 300) {
            DD.sound.play(upright ? 'thud' : 'crunch');
            C.bounce = Math.min(10, impact / 80);
            P.burst(C.x, G, 14, () => ({ vx: U.rand(-160, 160), vy: U.rand(-160, -40), g: 600, life: 0.6, shrink: true, draw: DD.paint.circle(U.pick(['#ffd34d', '#ff8a3d', '#fff']), 1.8) }));
            for (let i = 0; i < 6; i++) P.add({ x: C.x + U.rand(-40, 40), y: G - 6, vx: U.rand(-40, 40), vy: U.rand(-50, -10), life: 1, alpha: 0.4, draw: DD.paint.sprite(smokeImg, 18) });
            if (!upright) DD.bubbles.say(C, U.pick(['Oof!', 'Nailed it… ish.', 'I’m okay!']), 1.6);
          }
          C.vy = impact > 500 ? -impact * 0.25 : 0;
          C.onGround = C.vy === 0;
          if (C.onGround) C.va = 0;
        } else C.vy = 0;
        C.y = G;
        // self-right toward nearest upright angle
        const a = ((C.ang % TAU) + TAU) % TAU;
        const target = a > Math.PI ? TAU : 0;
        C.ang = a + (target - a) * Math.min(1, dt * 6);
        if (Math.abs(C.ang - target) < 0.01) C.ang = 0;
        C.vx *= Math.max(0, 1 - 0.6 * dt);
      }
      C.bounce *= Math.max(0, 1 - 8 * dt);
      if (C.x < halfW) {
        C.x = halfW;
        C.vx = Math.abs(C.vx) * 0.4;
        C.dir = 1;
      }
      if (C.x > W() - halfW) {
        C.x = W() - halfW;
        C.vx = -Math.abs(C.vx) * 0.4;
        C.dir = -1;
      }
      C.wheelRot += (C.vx / 11) * dt;
      // knock cones
      for (const c of cones) {
        if (c.held) continue;
        if (Math.abs(c.x - C.x) < halfW && Math.abs(c.y - C.y) < 30 && Math.abs(C.vx) > 60) {
          c.vx = C.vx * 1.3 + Math.sign(C.vx) * 60;
          c.vy = -U.rand(250, 450);
          c.va = Math.sign(C.vx) * U.rand(8, 16);
          c.x += Math.sign(C.vx) * 6;
          DD.sound.play('pop');
        }
      }
    }

    function drawCarEnt(g) {
      g.save();
      g.translate(C.x, C.y);
      g.translate(0, -18);
      g.rotate(C.ang * C.dir);
      g.translate(0, 18);
      g.scale(C.dir, 1);
      drawCar(g, car, { t: st.time, wheelRot: C.wheelRot * C.dir, flash: C.flash, bounce: C.bounce * 0.4 + (C.onGround && C.mode === 'idle' ? Math.abs(Math.sin(st.time * 30)) * 0.4 : 0), braking: C.braking, noShadow: !C.onGround });
      g.restore();
      if (!C.onGround || C.held) {
        g.fillStyle = 'rgba(0,0,0,0.25)';
        g.beginPath();
        g.ellipse(C.x, ground(), 40, 4, 0, 0, TAU);
        g.fill();
      }
    }

    /* ---------------- garage panel ---------------- */
    function openGarage() {
      const icon = (patch) => (g, s) => {
        g.translate(s / 2, s / 2 + 12);
        g.scale(0.4, 0.4);
        drawCar(g, Object.assign({}, car, patch), { t: 1 });
      };
      DD.panel.open({
        title: 'The garage.',
        x: C.x,
        y: C.y - 20,
        tabs: [
          { id: 'body', label: 'Body', items: Object.entries(BODIES).map(([id, b]) => ({ id, label: b.label, draw: icon({ body: id }) })) },
          { id: 'paint', label: 'Paint', items: Object.entries(PAINTS).map(([id, p]) => ({ id, label: p.label, draw: icon({ paint: id }) })) },
          {
            id: 'wheels',
            label: 'Wheels',
            items: Object.entries(WHEELS).map(([id, w]) => ({
              id,
              label: w.label,
              draw: (g, s) => {
                g.translate(s / 2, s / 2 + (id === 'offroad' ? 14 : 11));
                g.scale(1.25, 1.25);
                drawWheel(g, 0, id, 0.4, true);
              }
            }))
          },
          { id: 'extra', label: 'Extras', items: Object.entries(EXTRAS).map(([id, e]) => ({ id, label: e.label, draw: icon({ extra: id }) })) }
        ],
        getSelected: (tab) => car[tab],
        onSelect: (tab, id) => {
          car[tab] = id;
          C.bounce = 6;
          DD.sound.play(tab === 'paint' ? 'sparkle' : 'pop');
          dirty = true;
        },
        onReset: () => {
          car.body = U.pick(Object.keys(BODIES));
          car.paint = U.pick(Object.keys(PAINTS));
          car.wheels = U.pick(Object.keys(WHEELS));
          car.extra = U.pick(Object.keys(EXTRAS));
          C.bounce = 6;
          dirty = true;
        },
        footer: () => `<button class="dd-btn" data-act="cruise">🏁 Go for a spin</button><button class="dd-btn" data-act="jump">🚀 Hit the ramp</button>`,
        onFooter: (act) => {
          if (act === 'cruise') cruise();
          if (act === 'jump') jump();
        }
      });
    }

    function cruise() {
      C.mode = 'drive';
      C.target = C.x < W() / 2 ? W() - 100 : 100;
      C.modeT = 10;
      DD.sound.play('rev');
    }
    function jump() {
      // back up then floor it toward the ramp
      const from = ramp.x - ramp.dir * 260;
      C.x = U.clamp(from, halfW, W() - halfW);
      C.y = ground();
      C.mode = 'drive';
      C.target = ramp.x + ramp.dir * 400;
      C.vx = ramp.dir * 200;
      C.modeT = 6;
      DD.sound.play('rev');
    }

    /* ---------------- public ---------------- */
    let saveT = 0;
    return {
      pick(x, y) {
        if (C.pick(x, y)) return C;
        for (const c of cones) if (c.pick(x, y)) return c;
        if (ramp.pick(x, y)) return ramp;
        return null;
      },
      action(name) {
        if (name === 'surprise') Math.random() < 0.5 ? jump() : cruise();
      },
      frame(dt) {
        const g = st.ctx;
        ramp.update(dt);
        for (const c of cones) c.update(dt);
        updateCar(dt);
        g.fillStyle = 'rgba(0,0,0,0.3)';
        g.beginPath();
        g.ellipse(ramp.x, ground(), 44, 3, 0, 0, TAU);
        g.fill();
        ramp.render(g);
        for (const c of cones) c.draw(g);
        drawCarEnt(g);
        saveT += dt;
        if (dirty && saveT > 2) {
          dirty = false;
          saveT = 0;
          env.save({ car, x: Math.round(C.x), ramp: Math.round(ramp.x), rampDir: ramp.dir, cones: cones.map((c) => Math.round(c.x)) });
        }
      }
    };
  }

  DD.themes.drive = { background, toys };
})();
