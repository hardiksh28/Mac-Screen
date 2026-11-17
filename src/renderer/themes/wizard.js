/* Wizard Academy – moonlit castle, floating candles, a mail owl, a cauldron and a spellbook. */
(function () {
  const DD = window.DD;
  const U = DD.util;
  const TAU = Math.PI * 2;

  /* ================================================================== shared art */
  const OWLS = {
    snowy: { label: 'Snowy', body: '#f1f2f8', wing: '#d8dbe8', face: '#ffffff', belly: '#ffffff', mark: '#8d93ab', eye: '#ffd23f' },
    barn: { label: 'Barn', body: '#d39b5f', wing: '#b97f45', face: '#fbf2e2', belly: '#f6e6cc', mark: '#8a5a2b', eye: '#1b1b1b', heart: true },
    tawny: { label: 'Tawny', body: '#8a5a35', wing: '#6d4426', face: '#c4976a', belly: '#c9a27a', mark: '#4f2f18', eye: '#1b1b1b' },
    horned: { label: 'Horned', body: '#7c6652', wing: '#5f4c3b', face: '#c3a27a', belly: '#d9c4a4', mark: '#3f3024', eye: '#ff9b1f', tufts: true },
    midnight: { label: 'Midnight', body: '#2b2f4c', wing: '#1f2238', face: '#454b78', belly: '#3b4170', mark: '#7f88d8', eye: '#7fe7ff', glow: true },
    ember: { label: 'Ember', body: '#d4512c', wing: '#a93a1d', face: '#ffb36b', belly: '#ff9a52', mark: '#7a1f0c', eye: '#ffe66b', glow: true, tufts: true },
    frost: { label: 'Frost', body: '#a9d8ff', wing: '#7fbcf0', face: '#e3f3ff', belly: '#d4ecff', mark: '#5a8fc8', eye: '#3fd0ff', glow: true },
    golden: { label: 'Golden', body: '#e5bd57', wing: '#c99a2e', face: '#fff1c2', belly: '#ffe9a8', mark: '#9a6b12', eye: '#3a2a10', tufts: true }
  };

  const WANDS = {
    gold: { label: 'Gold', colors: ['#fff3b0', '#ffd56b', '#ffb84d'] },
    emerald: { label: 'Emerald', colors: ['#b6ffd9', '#3fe08f', '#18b86a'] },
    ruby: { label: 'Ruby', colors: ['#ffc2cc', '#ff4d6d', '#c9184a'] },
    sapphire: { label: 'Sapphire', colors: ['#c8e6ff', '#58a8ff', '#2f6bff'] },
    rainbow: { label: 'Rainbow', colors: ['#ff6b6b', '#ffd93d', '#6bff95', '#4dd2ff', '#b388ff'] },
    ghost: { label: 'Ghost', colors: ['#ffffff', '#dfe7ff'], smoke: true },
    ember: { label: 'Ember', colors: ['#fff1a8', '#ff9b3d', '#ff4d1f'], fire: true },
    off: { label: 'Off', colors: [] }
  };

  const POTIONS = {
    violet: { label: 'Violet', c: '#a65bff' },
    emerald: { label: 'Emerald', c: '#33e08a' },
    rose: { label: 'Rose', c: '#ff5fa2' },
    azure: { label: 'Azure', c: '#3fb8ff' },
    amber: { label: 'Amber', c: '#ffb52e' },
    toxic: { label: 'Toxic', c: '#b6ff3b' },
    blood: { label: 'Crimson', c: '#e8263c' },
    night: { label: 'Starlit', c: '#3b3fd8' }
  };

  const SPELLS = [
    { id: 'sparkle', label: 'Sparkle' },
    { id: 'fireworks', label: 'Fireworks' },
    { id: 'butterflies', label: 'Butterflies' },
    { id: 'starfall', label: 'Starfall' },
    { id: 'levitate', label: 'Levitate' },
    { id: 'hearts', label: 'Hearts' },
    { id: 'lanterns', label: 'Lanterns' },
    { id: 'comet', label: 'Comet' }
  ];

  const FORTUNES = [
    'A small act of magic today will grow into something wonderful.',
    'The answer you seek is in the tab you closed yesterday.',
    'Your next idea will arrive with the first cup of tea.',
    'Someone is thinking of you kindly right now.',
    'Fortune favours the curious. Open the door.',
    'The stars suggest taking a break. The stars are rarely wrong.',
    'A long-lost file will be found in an unexpected folder.',
    'You will soon finish something you have been putting off.',
    'Bold moves made before lunch are blessed.',
    'Today the code compiles on the first try.',
    'An owl never delivers bad news on a Friday.',
    'Your inbox will be kinder than you fear.',
    'A pleasant surprise travels toward you on soft wings.',
    'Be patient, young wizard. Great spells take practice.',
    'The moon is on your side tonight.',
    'Trust the plan, but keep a spare wand.',
    'What you create this week will make someone smile.',
    'Luck sits quietly beside those who show up.'
  ];

  function drawOwl(g, kind, o) {
    const c = OWLS[kind] || OWLS.snowy;
    const flap = o.flying ? Math.sin(o.t * 22) : 0;
    g.save();
    if (c.glow) U.glow(g, 0, -24, 46, c.eye + '33');
    // wings when flying
    if (o.flying) {
      for (const sx of [-1, 1]) {
        g.save();
        g.translate(sx * 12, -30);
        g.rotate(sx * (0.3 + flap * 0.9));
        g.fillStyle = c.wing;
        g.beginPath();
        g.ellipse(sx * 18, 0, 20, 8, 0, 0, TAU);
        g.fill();
        g.fillStyle = c.mark;
        for (let i = 0; i < 4; i++) {
          g.beginPath();
          g.arc(sx * (8 + i * 7), 3, 2, 0, TAU);
          g.fill();
        }
        g.restore();
      }
    }
    // feet
    if (!o.flying) {
      g.fillStyle = '#f2a33a';
      for (const sx of [-6, 6]) {
        g.beginPath();
        g.ellipse(sx, -1.5, 4, 2, 0, 0, TAU);
        g.fill();
      }
    }
    // body
    g.fillStyle = c.body;
    g.beginPath();
    g.ellipse(0, -22, 17, 21, 0, 0, TAU);
    g.fill();
    g.fillStyle = c.belly;
    g.beginPath();
    g.ellipse(0, -16, 11, 13, 0, 0, TAU);
    g.fill();
    g.strokeStyle = c.mark;
    g.lineWidth = 1.2;
    for (let r = 0; r < 3; r++)
      for (let k = -1; k <= 1; k++) {
        const x = k * 5,
          y = -22 + r * 5;
        g.beginPath();
        g.moveTo(x - 2, y);
        g.lineTo(x, y + 2);
        g.lineTo(x + 2, y);
        g.stroke();
      }
    // folded wings
    if (!o.flying) {
      g.fillStyle = c.wing;
      for (const sx of [-1, 1]) {
        g.beginPath();
        g.ellipse(sx * 14, -20, 6, 14, sx * -0.15, 0, TAU);
        g.fill();
      }
    }
    // head
    const hy = -40 + (o.bob || 0);
    g.fillStyle = c.body;
    g.beginPath();
    g.ellipse(0, hy, 16, 13, 0, 0, TAU);
    g.fill();
    if (c.tufts) {
      g.beginPath();
      g.moveTo(-13, hy - 6);
      g.lineTo(-15, hy - 17);
      g.lineTo(-6, hy - 10);
      g.moveTo(13, hy - 6);
      g.lineTo(15, hy - 17);
      g.lineTo(6, hy - 10);
      g.fill();
    }
    // facial disc
    g.fillStyle = c.face;
    if (c.heart) {
      g.beginPath();
      g.moveTo(0, hy + 10);
      g.bezierCurveTo(-18, hy + 4, -16, hy - 12, 0, hy - 6);
      g.bezierCurveTo(16, hy - 12, 18, hy + 4, 0, hy + 10);
      g.fill();
    } else {
      g.beginPath();
      g.ellipse(-6.5, hy, 7.5, 7.5, 0, 0, TAU);
      g.ellipse(6.5, hy, 7.5, 7.5, 0, 0, TAU);
      g.fill();
    }
    // eyes
    const lx = (o.look ? o.look.x : 0) * 1.8,
      ly = (o.look ? o.look.y : 0) * 1.5;
    for (const sx of [-1, 1]) {
      const ex = sx * 6.5,
        ey = hy;
      if (o.blink) {
        g.strokeStyle = '#2a1a10';
        g.lineWidth = 1.6;
        g.beginPath();
        g.arc(ex, ey - 1, 4.5, 0.2, Math.PI - 0.2);
        g.stroke();
        continue;
      }
      g.fillStyle = c.eye;
      g.beginPath();
      g.arc(ex, ey, 5, 0, TAU);
      g.fill();
      g.fillStyle = '#111';
      g.beginPath();
      g.arc(ex + lx, ey + ly, 2.7, 0, TAU);
      g.fill();
      g.fillStyle = '#fff';
      g.beginPath();
      g.arc(ex + lx - 1, ey + ly - 1.2, 1, 0, TAU);
      g.fill();
    }
    // beak
    g.fillStyle = '#e8a33a';
    g.beginPath();
    g.moveTo(-2.5, hy + 3);
    g.lineTo(2.5, hy + 3);
    g.lineTo(0, hy + 8);
    g.closePath();
    g.fill();
    // carried letter
    if (o.letter) {
      g.save();
      g.translate(0, 2);
      drawEnvelope(g, 0.7);
      g.restore();
    }
    g.restore();
  }

  function drawEnvelope(g, s = 1) {
    g.save();
    g.scale(s, s);
    g.fillStyle = '#f4e6c4';
    U.rrect(g, -15, -11, 30, 20, 2);
    g.fill();
    g.strokeStyle = 'rgba(120,80,30,0.45)';
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(-15, -11);
    g.lineTo(0, 1);
    g.lineTo(15, -11);
    g.stroke();
    g.fillStyle = '#b3202a';
    g.beginPath();
    g.arc(0, 1, 4, 0, TAU);
    g.fill();
    g.fillStyle = 'rgba(255,255,255,0.3)';
    g.beginPath();
    g.arc(-1, 0, 1.5, 0, TAU);
    g.fill();
    g.restore();
  }

  function drawCauldron(g, color, t) {
    // fire
    for (let i = 0; i < 5; i++) {
      const x = -14 + i * 7;
      const h = 8 + Math.sin(t * 14 + i * 2) * 3;
      const grd = g.createLinearGradient(0, -h, 0, 0);
      grd.addColorStop(0, 'rgba(255,220,90,0)');
      grd.addColorStop(0.5, '#ffb03a');
      grd.addColorStop(1, '#ff5a1f');
      g.fillStyle = grd;
      g.beginPath();
      g.moveTo(x - 4, 0);
      g.quadraticCurveTo(x, -h * 1.6, x + 4, 0);
      g.fill();
    }
    U.glow(g, 0, -4, 30, 'rgba(255,140,40,0.5)');
    // legs
    g.fillStyle = '#16151d';
    g.fillRect(-18, -12, 4, 12);
    g.fillRect(14, -12, 4, 12);
    // pot
    const grd = g.createRadialGradient(-8, -30, 2, 0, -24, 30);
    grd.addColorStop(0, '#4a4a5a');
    grd.addColorStop(1, '#0d0d14');
    g.fillStyle = grd;
    g.beginPath();
    g.ellipse(0, -24, 25, 19, 0, 0, TAU);
    g.fill();
    // brew
    U.glow(g, 0, -40, 40, color + '66');
    g.fillStyle = color;
    g.beginPath();
    g.ellipse(0, -38, 20, 5, 0, 0, TAU);
    g.fill();
    g.fillStyle = 'rgba(255,255,255,0.35)';
    for (let i = 0; i < 3; i++) {
      const bx = Math.sin(t * 2 + i * 2.1) * 12;
      const r = 2 + ((t * 2 + i) % 1) * 2;
      g.beginPath();
      g.arc(bx, -38, r, 0, TAU);
      g.fill();
    }
    // rim
    g.strokeStyle = '#2b2b38';
    g.lineWidth = 4;
    g.beginPath();
    g.ellipse(0, -38, 22, 6, 0, 0, TAU);
    g.stroke();
  }

  function drawBook(g, t, glow = '#ffd56b') {
    // stand
    g.fillStyle = '#4a2c1a';
    g.beginPath();
    g.moveTo(-5, 0);
    g.lineTo(5, 0);
    g.lineTo(3, -14);
    g.lineTo(-3, -14);
    g.fill();
    g.fillRect(-14, -2, 28, 3);
    // cover
    g.save();
    g.translate(0, -18);
    g.rotate(-0.08);
    U.glow(g, 0, -6, 44, glow + '55');
    g.fillStyle = '#6b1f2a';
    g.beginPath();
    g.moveTo(-30, 2);
    g.lineTo(0, 6);
    g.lineTo(30, 2);
    g.lineTo(28, -16);
    g.lineTo(0, -12);
    g.lineTo(-28, -16);
    g.closePath();
    g.fill();
    // pages
    g.fillStyle = '#f6ecd2';
    g.beginPath();
    g.moveTo(-27, -1);
    g.quadraticCurveTo(-14, -5, 0, 2);
    g.quadraticCurveTo(14, -5, 27, -1);
    g.lineTo(26, -17);
    g.quadraticCurveTo(13, -21, 0, -13);
    g.quadraticCurveTo(-13, -21, -26, -17);
    g.closePath();
    g.fill();
    g.strokeStyle = 'rgba(120,80,40,0.5)';
    g.lineWidth = 0.8;
    g.beginPath();
    g.moveTo(0, -13);
    g.lineTo(0, 2);
    g.stroke();
    // glowing runes
    g.strokeStyle = glow;
    g.lineWidth = 1.1;
    g.globalAlpha = 0.6 + Math.sin(t * 3) * 0.3;
    for (let side = -1; side <= 1; side += 2)
      for (let l = 0; l < 4; l++) {
        g.beginPath();
        const y = -14 + l * 3.4;
        for (let k = 0; k < 6; k++) {
          const x = side * (4 + k * 3.4);
          g.lineTo(x, y + Math.sin(k * 2.3 + l + side) * 1.1);
        }
        g.stroke();
      }
    g.globalAlpha = 1;
    g.restore();
  }

  function drawButterfly(g, color, flap) {
    const k = Math.abs(Math.sin(flap));
    g.fillStyle = color;
    for (const sx of [-1, 1]) {
      g.beginPath();
      g.ellipse(sx * 5 * k, -3, 5 * k + 0.5, 6, sx * 0.4, 0, TAU);
      g.ellipse(sx * 4 * k, 4, 3.5 * k + 0.5, 4, sx * -0.3, 0, TAU);
      g.fill();
    }
    g.fillStyle = '#1a1a2a';
    g.fillRect(-0.8, -5, 1.6, 10);
  }

  function heartPath(g, r) {
    g.beginPath();
    g.moveTo(0, r * 0.7);
    g.bezierCurveTo(-r * 1.2, -r * 0.1, -r * 0.6, -r, 0, -r * 0.35);
    g.bezierCurveTo(r * 0.6, -r, r * 1.2, -r * 0.1, 0, r * 0.7);
  }

  /* ================================================================== wallpaper */
  function background(env) {
    const st = env.stage;
    let L = null;
    let stars = [],
      windows = [],
      candles = [],
      boats = [],
      clouds = [],
      motes = [];
    let moon = null,
      lakeTop = 0;
    const dot = U.dot('rgba(255,236,170,1)', 16);
    const cloudSprite = (() => {
      const c = U.canvas(420, 140);
      const g = c.getContext('2d');
      g.filter = 'blur(14px)';
      g.fillStyle = 'rgba(160,175,220,0.5)';
      for (let i = 0; i < 9; i++) {
        g.beginPath();
        g.ellipse(70 + i * 32, 70 + Math.sin(i * 1.7) * 14, 60, 22, 0, 0, TAU);
        g.fill();
      }
      return c;
    })();
    let rider = null,
      nextRider = U.rand(25, 60);
    const trail = new DD.Particles(300);

    function drawCastle(g, W, H, rnd, recordWindows) {
      const baseY = H * 0.52;
      const cx = W * 0.66,
        CW = Math.min(W * 0.42, H * 0.9);
      // cliff
      g.fillStyle = '#0a1024';
      g.beginPath();
      g.moveTo(cx - CW * 0.62, H * 0.66);
      let x = cx - CW * 0.62;
      const r2 = U.rng(77);
      while (x < cx + CW * 0.66) {
        const y = baseY + 6 + r2() * 14;
        g.lineTo(x, y);
        x += 10 + r2() * 18;
      }
      g.lineTo(cx + CW * 0.7, H * 0.66);
      g.closePath();
      g.fill();
      g.fillStyle = 'rgba(80,100,170,0.18)';
      for (let i = 0; i < 26; i++) {
        const xx = cx - CW * 0.6 + r2() * CW * 1.2;
        const yy = baseY + 16 + r2() * (H * 0.66 - baseY - 20);
        g.beginPath();
        g.moveTo(xx, yy);
        g.lineTo(xx - 6, yy + 18);
        g.lineTo(xx + 2, yy + 14);
        g.fill();
      }
      const towers = [
        [-0.47, 0.045, 0.16, 0.07],
        [-0.36, 0.07, 0.27, 0.1],
        [-0.22, 0.05, 0.19, 0.07],
        [-0.08, 0.06, 0.24, 0.09],
        [0.05, 0.095, 0.4, 0.15],
        [0.19, 0.055, 0.22, 0.08],
        [0.3, 0.075, 0.31, 0.11],
        [0.43, 0.05, 0.18, 0.07]
      ];
      const halls = [
        [-0.47, -0.08, 0.09],
        [-0.08, 0.3, 0.13],
        [0.3, 0.45, 0.08]
      ];
      const wall = '#18203e',
        lit = '#2b3866',
        roof = '#10162c',
        roofLit = '#26325c';
      const winds = [];
      const addWin = (x, y, w, h, arch) => {
        if (rnd() < 0.35) return;
        g.fillStyle = '#ffcf6e';
        g.beginPath();
        g.rect(x, y, w, h);
        if (arch) g.arc(x + w / 2, y, w / 2, Math.PI, 0);
        g.fill();
        winds.push({ x: x + w / 2, y: y + h / 2, p: rnd() * TAU, f: 0.4 + rnd() });
      };
      halls.forEach(([a, b, hh]) => {
        const x0 = cx + a * CW,
          x1 = cx + b * CW,
          top = baseY - hh * H * 0.5;
        g.fillStyle = wall;
        g.fillRect(x0, top, x1 - x0, baseY - top + 8);
        g.fillStyle = roof;
        g.beginPath();
        g.moveTo(x0 - 4, top);
        g.lineTo(x0 + 10, top - hh * H * 0.18);
        g.lineTo(x1 - 10, top - hh * H * 0.18);
        g.lineTo(x1 + 4, top);
        g.fill();
        for (let wx = x0 + 10; wx < x1 - 12; wx += 13) addWin(wx, top + 10, 5, Math.max(8, (baseY - top) * 0.35), true);
      });
      towers.forEach(([dx, w, h, rh]) => {
        const tw = w * CW,
          x0 = cx + dx * CW - tw / 2;
        const top = baseY - h * H * 0.6;
        g.fillStyle = wall;
        g.fillRect(x0, top, tw, baseY - top + 8);
        g.fillStyle = lit;
        g.fillRect(x0, top, tw * 0.28, baseY - top + 8);
        // battlement ring
        g.fillStyle = wall;
        g.fillRect(x0 - 3, top - 4, tw + 6, 6);
        for (let bx = x0 - 3; bx < x0 + tw + 3; bx += 6) g.fillRect(bx, top - 8, 3.5, 4);
        // cone roof
        const rH = rh * H * 0.6;
        g.fillStyle = roof;
        g.beginPath();
        g.moveTo(x0 - 5, top - 4);
        g.lineTo(x0 + tw / 2, top - 4 - rH);
        g.lineTo(x0 + tw + 5, top - 4);
        g.fill();
        g.fillStyle = roofLit;
        g.beginPath();
        g.moveTo(x0 - 5, top - 4);
        g.lineTo(x0 + tw / 2, top - 4 - rH);
        g.lineTo(x0 + tw * 0.32, top - 4);
        g.fill();
        // pennant
        const px = x0 + tw / 2,
          py = top - 4 - rH;
        g.strokeStyle = '#0c1022';
        g.lineWidth = 1.2;
        g.beginPath();
        g.moveTo(px, py);
        g.lineTo(px, py - 12);
        g.stroke();
        g.fillStyle = '#7a1f2a';
        g.beginPath();
        g.moveTo(px, py - 12);
        g.lineTo(px + 10, py - 9);
        g.lineTo(px, py - 6);
        g.fill();
        // windows
        const rows = Math.floor((baseY - top) / 22);
        for (let r = 0; r < rows; r++) addWin(x0 + tw / 2 - 2.5, top + 10 + r * 22, 5, 8, true);
      });
      // bridge to the left
      const by = baseY + H * 0.02;
      g.fillStyle = wall;
      const bx0 = cx - CW * 0.62,
        bx1 = cx - CW * 0.95;
      g.fillRect(bx1, by - 8, bx0 - bx1, 8);
      for (let ax = bx1; ax < bx0; ax += 26) {
        g.fillRect(ax, by - 8, 5, H * 0.66 - by + 8);
      }
      g.fillRect(bx1 - 20, by - 46, 22, H * 0.66 - by + 46);
      g.fillStyle = roof;
      g.beginPath();
      g.moveTo(bx1 - 24, by - 46);
      g.lineTo(bx1 - 9, by - 72);
      g.lineTo(bx1 + 6, by - 46);
      g.fill();
      addWin(bx1 - 11, by - 36, 4, 7, true);
      if (recordWindows) windows = winds;
    }

    function build() {
      const W = st.w,
        H = st.h,
        dpr = st.dpr;
      const rnd = U.rng(424242);
      lakeTop = H * 0.66;
      moon = { x: W * 0.24, y: H * 0.2, r: Math.max(26, H * 0.075) };
      stars = [];
      for (let i = 0; i < (W * H) / 3200; i++)
        stars.push({ x: rnd() * W, y: rnd() * H * 0.62, r: rnd() * 1.3 + 0.3, p: rnd() * TAU, s: 0.6 + rnd() * 2.5 });

      const sky = U.layer(W, H, dpr, (g) => {
        const grd = g.createLinearGradient(0, 0, 0, lakeTop);
        grd.addColorStop(0, '#040817');
        grd.addColorStop(0.5, '#0d1d3d');
        grd.addColorStop(1, '#253a6e');
        g.fillStyle = grd;
        g.fillRect(0, 0, W, H);
        // moon
        U.glow(g, moon.x, moon.y, moon.r * 5, 'rgba(200,215,255,0.28)');
        const mg = g.createRadialGradient(moon.x - moon.r * 0.3, moon.y - moon.r * 0.3, moon.r * 0.1, moon.x, moon.y, moon.r);
        mg.addColorStop(0, '#fffdf2');
        mg.addColorStop(1, '#dfe1ef');
        g.fillStyle = mg;
        g.beginPath();
        g.arc(moon.x, moon.y, moon.r, 0, TAU);
        g.fill();
        g.fillStyle = 'rgba(150,155,185,0.28)';
        [
          [-0.3, -0.2, 0.22],
          [0.25, 0.1, 0.16],
          [-0.05, 0.38, 0.12],
          [0.35, -0.35, 0.1],
          [-0.45, 0.25, 0.08]
        ].forEach(([dx, dy, r]) => {
          g.beginPath();
          g.arc(moon.x + dx * moon.r, moon.y + dy * moon.r, r * moon.r, 0, TAU);
          g.fill();
        });
      });

      const land = U.layer(W, H, dpr, (g) => {
        // distant mountains
        const pts = DD.alps(rnd, W, lakeTop, H * 0.2, 9);
        g.beginPath();
        g.moveTo(-20, H);
        pts.forEach((p) => g.lineTo(p[0], p[1]));
        g.lineTo(W + 20, H);
        const mg = g.createLinearGradient(0, lakeTop - H * 0.2, 0, lakeTop);
        mg.addColorStop(0, '#2a3a6a');
        mg.addColorStop(1, '#0e1834');
        g.fillStyle = mg;
        g.fill();
        g.save();
        g.clip();
        DD.shadeAlps(g, pts, lakeTop, 'rgba(5,10,30,0.35)', rnd);
        g.restore();
        // forest band at the lake edge
        g.fillStyle = '#081026';
        for (let x = -10; x < W + 10; x += 6) {
          const h = 10 + rnd() * 22;
          g.beginPath();
          g.moveTo(x - 6, lakeTop + 1);
          g.lineTo(x, lakeTop - h);
          g.lineTo(x + 6, lakeTop + 1);
          g.fill();
        }
        drawCastle(g, W, H, U.rng(99), true);
        // lake
        const lg = g.createLinearGradient(0, lakeTop, 0, H);
        lg.addColorStop(0, '#13244a');
        lg.addColorStop(1, '#040918');
        g.fillStyle = lg;
        g.fillRect(0, lakeTop, W, H - lakeTop);
        // castle reflection
        g.save();
        g.beginPath();
        g.rect(0, lakeTop, W, H - lakeTop);
        g.clip();
        g.globalAlpha = 0.28;
        g.translate(0, lakeTop * 2);
        g.scale(1, -1);
        drawCastle(g, W, H, U.rng(99), false);
        g.restore();
        g.fillStyle = 'rgba(5,10,30,0.35)';
        for (let y = lakeTop + 3; y < H; y += 3 + (y - lakeTop) * 0.02) g.fillRect(0, y, W, 1);
        // foreground shores with pines
        const shore = (x0, x1, dir) => {
          g.fillStyle = '#02050e';
          g.beginPath();
          g.moveTo(x0, H);
          for (let x = x0; dir > 0 ? x <= x1 : x >= x1; x += dir * 8) {
            const k = Math.abs(x - x0) / Math.abs(x1 - x0);
            g.lineTo(x, H - H * 0.14 * (1 - k * k) - rnd() * 4);
          }
          g.lineTo(x1, H);
          g.fill();
          for (let i = 0; i < 14; i++) {
            const k = rnd() * 0.8;
            const x = x0 + (x1 - x0) * k;
            const base = H - H * 0.12 * (1 - k * k);
            const h = H * (0.12 + rnd() * 0.22) * (1 - k * 0.7);
            for (let j = 0; j < 6; j++) {
              const ty = base - (h * j) / 6;
              const tw = (h * 0.28 * (6 - j)) / 6;
              g.beginPath();
              g.moveTo(x - tw, ty);
              g.lineTo(x, ty - h * 0.28);
              g.lineTo(x + tw, ty);
              g.fill();
            }
          }
        };
        shore(-20, W * 0.32, 1);
        shore(W + 20, W * 0.8, -1);
      });
      L = { sky, land };

      candles = [];
      const nc = Math.round(U.clamp(W / 50, 18, 40));
      for (let i = 0; i < nc; i++) {
        const z = rnd();
        candles.push({
          x: rnd() * W,
          y: H * (0.06 + rnd() * 0.42),
          s: 0.55 + z * 0.9,
          p: rnd() * TAU,
          h: 12 + rnd() * 10
        });
      }
      candles.sort((a, b) => a.s - b.s);
      boats = [];
      for (let i = 0; i < 3; i++) boats.push({ x: rnd() * W, y: lakeTop + (H - lakeTop) * (0.25 + rnd() * 0.45), v: (rnd() < 0.5 ? -1 : 1) * (4 + rnd() * 6), p: rnd() * 9 });
      clouds = [];
      for (let i = 0; i < 4; i++) clouds.push({ x: rnd() * W, y: H * (0.08 + rnd() * 0.25), s: 0.6 + rnd() * 0.9, v: 3 + rnd() * 5 });
      motes = [];
      for (let i = 0; i < 60; i++) motes.push({ x: rnd() * W, y: H * (0.55 + rnd() * 0.45), p: rnd() * TAU, s: 0.5 + rnd() });
    }
    st.onResize.push(build);
    build();

    function drawRider(g, x, y, dir) {
      g.save();
      g.translate(x, y);
      g.scale(dir, 1);
      g.fillStyle = '#060a18';
      g.strokeStyle = '#060a18';
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(-26, 4);
      g.lineTo(22, -2);
      g.stroke();
      g.beginPath();
      g.moveTo(-26, 4);
      g.lineTo(-38, 0);
      g.lineTo(-38, 10);
      g.closePath();
      g.fill();
      // cape + body
      const flap = Math.sin(st.time * 12) * 3;
      g.beginPath();
      g.moveTo(-2, -12);
      g.lineTo(-20, -4 + flap);
      g.lineTo(-4, 2);
      g.fill();
      g.beginPath();
      g.ellipse(0, -6, 5, 8, -0.3, 0, TAU);
      g.fill();
      g.beginPath();
      g.arc(3, -16, 4, 0, TAU);
      g.fill();
      g.beginPath();
      g.moveTo(-1, -18);
      g.lineTo(4, -32);
      g.lineTo(8, -18);
      g.fill();
      g.restore();
    }

    return {
      action(name) {
        if (name === 'surprise' && !rider) nextRider = 0.01;
      },
      frame(dt, t) {
        const g = st.ctx,
          W = st.w,
          H = st.h;
        g.drawImage(L.sky, 0, 0, W, H);
        // aurora
        g.save();
        g.globalCompositeOperation = 'lighter';
        for (let band = 0; band < 2; band++) {
          const yb = H * (0.16 + band * 0.08);
          const grd = g.createLinearGradient(0, yb - 60, 0, yb + 60);
          const col = band ? '120,80,255' : '60,255,180';
          grd.addColorStop(0, `rgba(${col},0)`);
          grd.addColorStop(0.5, `rgba(${col},0.07)`);
          grd.addColorStop(1, `rgba(${col},0)`);
          g.fillStyle = grd;
          g.beginPath();
          g.moveTo(0, yb + 70);
          for (let x = 0; x <= W; x += 30) g.lineTo(x, yb + Math.sin(x * 0.004 + t * 0.15 + band * 2) * 40 + Math.sin(x * 0.011 - t * 0.1) * 16);
          g.lineTo(W, yb + 70);
          g.fill();
        }
        g.restore();
        g.fillStyle = '#fff';
        for (const s of stars) {
          g.globalAlpha = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(t * s.s + s.p));
          g.fillRect(s.x, s.y, s.r, s.r);
        }
        g.globalAlpha = 1;
        // clouds drift over the moon
        for (const c of clouds) {
          c.x += c.v * dt;
          if (c.x > W + 300) c.x = -420 * c.s;
          g.globalAlpha = 0.55;
          g.drawImage(cloudSprite, c.x, c.y, 420 * c.s, 140 * c.s);
        }
        g.globalAlpha = 1;
        // broom rider
        nextRider -= dt;
        if (nextRider <= 0 && !rider) {
          const dir = Math.random() < 0.5 ? 1 : -1;
          rider = { x: dir > 0 ? -60 : W + 60, y: H * U.rand(0.1, 0.3), dir };
          nextRider = U.rand(60, 140);
        }
        if (rider) {
          rider.x += rider.dir * W * 0.09 * dt;
          const y = rider.y + Math.sin(t * 2) * 10;
          trail.add({ x: rider.x - rider.dir * 34, y: y + 5, vx: U.rand(-10, 10), vy: U.rand(-5, 10), life: 1.4, shrink: true, draw: DD.paint.star(U.pick(['#ffe9a0', '#fff', '#bfe0ff']), 2.4) });
          drawRider(g, rider.x, y, rider.dir);
          if (rider.x < -100 || rider.x > W + 100) rider = null;
        }
        trail.update(dt);
        trail.draw(g);
        g.drawImage(L.land, 0, 0, W, H);
        // window flicker
        for (const w of windows) {
          g.globalAlpha = 0.3 + 0.18 * Math.sin(t * w.f * 2 + w.p);
          U.glow(g, w.x, w.y, 9, '#ffb347');
        }
        g.globalAlpha = 1;
        // moon reflection
        g.fillStyle = '#e6ebff';
        for (let y = lakeTop + 4; y < H * 0.95; y += 4) {
          const k = (y - lakeTop) / (H - lakeTop);
          const w = moon.r * (0.6 + k * 1.6) * (0.6 + 0.4 * Math.sin(t * 1.5 + y * 0.09));
          g.globalAlpha = 0.22 * (1 - k);
          g.fillRect(moon.x - w / 2 + Math.sin(t * 2 + y * 0.2) * 4, y, w, 1.6);
        }
        g.globalAlpha = 1;
        // boats with lanterns
        for (const b of boats) {
          b.x += b.v * dt;
          if (b.x > W + 60) b.x = -60;
          if (b.x < -60) b.x = W + 60;
          const by = b.y + Math.sin(t * 1.2 + b.p) * 1.5;
          g.fillStyle = '#050913';
          g.beginPath();
          g.moveTo(b.x - 16, by);
          g.quadraticCurveTo(b.x, by + 7, b.x + 16, by);
          g.closePath();
          g.fill();
          g.fillRect(b.x + 6, by - 14, 1.5, 14);
          const ly = by - 15;
          U.glow(g, b.x + 7, ly, 20, 'rgba(255,190,90,0.6)');
          g.fillStyle = '#ffd27a';
          g.fillRect(b.x + 5, ly - 2, 4, 4);
          g.globalAlpha = 0.35;
          for (let k = 0; k < 8; k++) g.fillRect(b.x + 5 + Math.sin(t * 3 + k) * 2, by + 3 + k * 3, 4, 1.4);
          g.globalAlpha = 1;
        }
        // floating candles
        for (const c of candles) {
          const y = c.y + Math.sin(t * 0.8 + c.p) * 6 * c.s;
          const x = c.x + Math.sin(t * 0.3 + c.p) * 3;
          const s = c.s;
          U.glow(g, x, y - c.h * s - 3 * s, 22 * s, 'rgba(255,200,110,0.35)');
          const cg = g.createLinearGradient(x - 3 * s, 0, x + 3 * s, 0);
          cg.addColorStop(0, '#fff8e6');
          cg.addColorStop(1, '#cdbf9e');
          g.fillStyle = cg;
          g.fillRect(x - 2.6 * s, y - c.h * s, 5.2 * s, c.h * s);
          g.fillStyle = 'rgba(255,255,255,0.9)';
          g.beginPath();
          g.ellipse(x, y - c.h * s, 2.6 * s, 0.9 * s, 0, 0, TAU);
          g.fill();
          const fl = 1 + Math.sin(t * 13 + c.p * 5) * 0.12;
          g.fillStyle = '#ffd36b';
          g.beginPath();
          g.ellipse(x, y - c.h * s - 3.5 * s * fl, 1.6 * s, 3.4 * s * fl, 0, 0, TAU);
          g.fill();
          g.fillStyle = '#fffbe6';
          g.beginPath();
          g.ellipse(x, y - c.h * s - 2.8 * s, 0.7 * s, 1.6 * s, 0, 0, TAU);
          g.fill();
        }
        // magic motes near the shore
        for (const m of motes) {
          m.x += Math.sin(t * 0.5 + m.p) * 8 * dt;
          m.y += Math.cos(t * 0.4 + m.p) * 6 * dt;
          g.globalAlpha = 0.25 + 0.5 * (0.5 + 0.5 * Math.sin(t * 2 + m.p));
          const s = 7 * m.s;
          g.drawImage(dot, m.x - s / 2, m.y - s / 2, s, s);
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
    const cfg = Object.assign({ wand: 'gold', owl: 'snowy', potion: 'violet', spell: 'sparkle' }, saved.cfg || {});
    const pos = saved.pos || {};
    let dirty = false;
    const flyers = []; // butterflies, lanterns
    const rockets = [];
    let levitateT = 0;
    let comet = null;
    let lastEmit = 0;

    const starP = (color, r) => DD.paint.star(color, r);
    const wandColors = () => WANDS[cfg.wand].colors;

    /* ---------------- owl ---------------- */
    const owl = DD.prop({
      x: pos.owl ?? W() / 2 - 150,
      w: 38,
      h: 56,
      groundFn: ground,
      widthFn: W,
      kind: 'owl',
      state: 'perch',
      blinkT: 3,
      blink: 0,
      ft: 0,
      draw: (g, p) => {
        let look = null;
        if (env.pointer.inside) {
          const dx = env.pointer.x - p.x,
            dy = env.pointer.y - (p.y - 40);
          const d = Math.hypot(dx, dy) || 1;
          look = { x: dx / d, y: dy / d };
        }
        drawOwl(g, cfg.owl, { t: st.time, look, blink: p.blink > 0, bob: Math.sin(st.time * 2) * 0.6, flying: p.held || p.state !== 'perch', letter: p.state === 'return' });
      },
      // click: mail run · double-click: startle it · right-click: spellbook
      onClick: DD.clicks(() => sendOwl(), () => startleOwl()),
      onDblClick: () => {},
      onContext: () => openBook(),
      onGrab: () => DD.sound.play('hoot'),
      onRelease: () => (dirty = true),
      onLand: () => DD.sound.play('thud')
    });
    const baseOwlUpdate = owl.update;
    owl.update = (dt) => {
      owl.blinkT -= dt;
      if (owl.blinkT < 0) {
        owl.blink = 0.15;
        owl.blinkT = U.rand(2, 5);
      }
      owl.blink -= dt;
      if (owl.state === 'perch') return baseOwlUpdate(dt);
      owl.ft += dt;
      const G = ground();
      if (owl.state === 'out') {
        owl.x += owl.dir * 380 * dt;
        owl.y = G - 60 - Math.sin(Math.min(1, owl.ft / 1.2) * Math.PI * 0.5) * 220;
        if (owl.x < -80 || owl.x > W() + 80) {
          owl.state = 'away';
          owl.ft = 0;
        }
      } else if (owl.state === 'away') {
        if (owl.ft > 2.2) {
          owl.state = 'return';
          owl.ft = 0;
          owl.dir = -owl.dir;
          owl.x = owl.dir > 0 ? -60 : W() + 60;
        }
      } else if (owl.state === 'return') {
        const tx = owl.home;
        const dx = tx - owl.x;
        owl.x += U.clamp(dx, -340 * dt, 340 * dt);
        const k = U.clamp(Math.abs(dx) / 500, 0, 1);
        owl.y = G - k * 240 - (1 - k) * 10 * Math.abs(Math.sin(owl.ft * 4));
        if (Math.abs(dx) < 4) {
          owl.state = 'perch';
          owl.y = G;
          dropLetter(owl.x + 34);
        }
      }
      if (Math.random() < 0.5) P.add({ x: owl.x, y: owl.y - 20, vx: U.rand(-20, 20), vy: U.rand(-10, 20), life: 0.9, shrink: true, draw: starP('#fff3c4', 2) });
    };
    function startleOwl() {
      if (owl.state !== 'perch') return;
      DD.sound.play('hoot');
      setTimeout(() => DD.sound.play('hoot'), 160);
      // feathers everywhere
      P.burst(owl.x, owl.y - 30, 30, () => ({
        vx: U.rand(-260, 260),
        vy: U.rand(-380, -60),
        g: 140,
        drag: 2.4,
        life: U.rand(1.4, 2.4),
        draw: (gg, p, t) => {
          gg.rotate(Math.sin(t * 9 + p.x) * 0.9);
          gg.fillStyle = U.pick(['#f3ead8', '#c9a77a', '#8a6a46']);
          gg.beginPath();
          gg.ellipse(0, 0, 5, 1.8, 0, 0, TAU);
          gg.fill();
        }
      }));
      owl.vy = -760;
      owl.tilt = U.pick([-0.5, 0.5]);
      DD.bubbles.say(owl, U.pick(['HOO?!', 'Rude!', 'My feathers!', 'Who-who did that?!']), 1.8);
    }
    function sendOwl() {
      if (owl.state !== 'perch') return;
      DD.sound.play('hoot');
      DD.bubbles.say(owl, U.pick(['Hoo! Back soon.', 'Mail run!', 'Hoo-hoo!']), 1.6);
      owl.home = owl.x;
      owl.state = 'out';
      owl.ft = 0;
      owl.dir = owl.x > W() / 2 ? 1 : -1;
    }

    /* ---------------- letters ---------------- */
    const letters = [];
    function dropLetter(x) {
      const l = DD.prop({
        x: U.clamp(x, 30, W() - 30),
        w: 32,
        h: 22,
        groundFn: ground,
        widthFn: W,
        kind: 'letter',
        bounce: 0.3,
        draw: (g) => {
          g.translate(0, -11);
          g.rotate(Math.sin(st.time * 3) * 0.05);
          drawEnvelope(g, 1);
        },
        onClick: () => openLetter(l)
      });
      l.y = ground() - 80;
      letters.push(l);
      DD.sound.play('paper');
      if (!saved.letterTip) {
        DD.toast('💌 You’ve got mail. Click the letter.');
        saved.letterTip = true;
        dirty = true;
      }
    }
    function openLetter(l) {
      letters.splice(letters.indexOf(l), 1);
      DD.sound.play('paper');
      sparkleAt(l.x, l.y - 14, 18);
      DD.card({
        x: l.x,
        y: l.y - 30,
        html: `<h3>Owl Post · ${new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</h3><p>“${U.pick(FORTUNES)}”</p>`
      });
    }

    /* ---------------- cauldron & book ---------------- */
    const cauldron = DD.prop({
      x: pos.cauldron ?? W() / 2 + 150,
      w: 56,
      h: 50,
      groundFn: ground,
      widthFn: W,
      kind: 'cauldron',
      bubT: 0,
      draw: (g) => drawCauldron(g, POTIONS[cfg.potion].c, st.time),
      // click: brew · double-click: overload it · right-click: spellbook
      onClick: DD.clicks(() => brew(), () => blowCauldron()),
      onDblClick: () => {},
      onContext: () => openBook(),
      onRelease: () => (dirty = true),
      onLand: () => DD.sound.play('thud')
    });
    function blowCauldron() {
      const c = POTIONS[cfg.potion].c;
      const x = cauldron.x,
        y = cauldron.y - 34;
      DD.sound.play('boom');
      setTimeout(() => DD.sound.play('magic'), 150);
      // potion goo everywhere
      P.burst(x, y, 50, () => ({
        vx: U.rand(-420, 420),
        vy: U.rand(-760, -200),
        g: 1500,
        life: U.rand(0.8, 1.5),
        shrink: true,
        draw: DD.paint.circle(U.pick([c, c, '#ffffff', U.shade(c, -0.3)]), U.rand(2.5, 6))
      }));
      // magic smoke ring
      for (let i = 0; i < 24; i++) {
        const a = (i / 24) * TAU;
        P.add({ x, y, vx: Math.cos(a) * 220, vy: Math.sin(a) * 120 - 60, drag: 2.2, life: 1.2, shrink: true, draw: starP(U.pick(['#fff3c4', c, '#c9a6ff']), U.rand(3, 6)) });
      }
      // the cauldron gets blasted into the air
      cauldron.vy = -900;
      cauldron.vx = U.rand(-160, 160);
      cauldron.tilt = U.rand(-0.5, 0.5);
      env.stage.shake && env.stage.shake(9);
      DD.bubbles.say(cauldron, U.pick(['Too much eye of newt!', 'Oops… wrong spell.', 'KA-BLAM!', 'Ten points from me.']), 2);
      // and for a few seconds the sky rains the potion's colour as stars
      let n = 0;
      const rain = setInterval(() => {
        for (let i = 0; i < 6; i++) P.add({ x: U.rand(0, W()), y: -10, vx: U.rand(-20, 20), vy: U.rand(120, 260), life: 6, shrink: false, draw: starP(U.pick([c, '#fff3c4']), U.rand(2, 4)) });
        if (++n > 25) clearInterval(rain);
      }, 120);
      if (!saved.blowTip) {
        saved.blowTip = true;
        dirty = true;
        DD.toast('🧪 Kaboom! Single-click brews, double-click overloads it.', 3600);
      }
    }
    const book = DD.prop({
      x: pos.book ?? W() / 2,
      w: 64,
      h: 44,
      groundFn: ground,
      widthFn: W,
      kind: 'book',
      draw: (g) => drawBook(g, st.time, wandColors()[1] || '#ffd56b'),
      onClick: () => openBook(),
      onRelease: () => (dirty = true),
      onLand: () => DD.sound.play('thud')
    });
    const props = [book, cauldron, owl];

    function brew() {
      const keys = Object.keys(POTIONS).filter((k) => k !== cfg.potion);
      cfg.potion = U.pick(keys);
      cauldron.squash = 0.15;
      DD.sound.play('bubble');
      setTimeout(() => DD.sound.play('bubble'), 120);
      const col = POTIONS[cfg.potion].c;
      P.burst(cauldron.x, cauldron.y - 40, 24, () => ({ vx: U.rand(-70, 70), vy: U.rand(-260, -120), g: 300, life: U.rand(0.8, 1.4), shrink: true, draw: DD.paint.circle(col, U.rand(2, 5)) }));
      const spell = U.pick(SPELLS.filter((s) => s.id !== 'levitate' || Math.random() < 0.5));
      setTimeout(() => cast(spell.id, cauldron.x, cauldron.y - 50), 250);
      dirty = true;
    }

    /* ---------------- spells ---------------- */
    function sparkleAt(x, y, n) {
      const cols = wandColors().length ? wandColors() : WANDS.gold.colors;
      P.burst(x, y, n, () => {
        const a = U.rand(TAU),
          sp = U.rand(40, 260);
        return { vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, drag: 2.5, life: U.rand(0.6, 1.3), shrink: true, draw: starP(U.pick(cols), U.rand(2, 5)) };
      });
    }
    function cast(id, x, y) {
      cfg.spell = id;
      const G = ground();
      DD.sound.play('magic');
      switch (id) {
        case 'sparkle':
          for (let i = 0; i < 6; i++) setTimeout(() => sparkleAt(U.rand(W() * 0.2, W() * 0.8), G - U.rand(60, 260), 30), i * 120);
          break;
        case 'fireworks':
          for (let i = 0; i < 6; i++)
            setTimeout(() => {
              rockets.push({ x: U.rand(W() * 0.15, W() * 0.85), y: G, vy: -U.rand(520, 720), col: U.pick(['#ff5f7e', '#ffd34d', '#5fd3ff', '#7dff9b', '#c38bff', '#ffffff']) });
              DD.sound.play('whoosh');
            }, i * 380);
          break;
        case 'butterflies':
          for (let i = 0; i < 14; i++)
            flyers.push({ type: 'butterfly', x: x + U.rand(-30, 30), y: y + U.rand(-10, 10), vx: U.rand(-60, 60), vy: U.rand(-80, -20), p: U.rand(TAU), age: 0, life: U.rand(9, 14), col: U.pick(['#7fe0ff', '#ff9ee8', '#ffe27a', '#b9a3ff', '#8dffb8']) });
          break;
        case 'starfall':
          for (let i = 0; i < 50; i++)
            setTimeout(() => {
              const sx = U.rand(0, W());
              P.add({ x: sx, y: Math.max(0, G - 420), vx: U.rand(60, 140), vy: U.rand(200, 360), life: 2.2, draw: starP(U.pick(['#fff', '#fff3b0', '#cfe6ff']), U.rand(2, 4.5)), update: (p) => Math.random() < 0.5 && P.add({ x: p.x, y: p.y, life: 0.5, shrink: true, draw: DD.paint.circle('rgba(255,240,200,0.7)', 1.5) }) });
            }, i * 50);
          break;
        case 'levitate':
          levitateT = 8;
          DD.bubbles.say(owl, 'Whoa!', 1.8);
          break;
        case 'hearts':
          for (let i = 0; i < 26; i++)
            P.add({ x: x + U.rand(-40, 40), y: y, vx: U.rand(-50, 50), vy: U.rand(-160, -60), life: U.rand(2, 3.5), draw: (g, p, t) => { g.fillStyle = '#ff5f8f'; g.scale(1 + Math.sin(p.age * 6) * 0.1, 1); heartPath(g, 7 * (1 - t * 0.3)); g.fill(); }, update: (p, dt) => (p.vx += Math.sin(p.age * 3) * 40 * dt) });
          break;
        case 'lanterns':
          for (let i = 0; i < 10; i++)
            flyers.push({ type: 'lantern', x: U.rand(W() * 0.1, W() * 0.9), y: G + 20 + i * 14, vx: 0, vy: -U.rand(18, 34), p: U.rand(TAU), age: 0, life: U.rand(14, 20), s: U.rand(0.7, 1.2) });
          break;
        case 'comet': {
          const dir = Math.random() < 0.5 ? 1 : -1;
          comet = { x: dir > 0 ? -50 : W() + 50, y: G - U.rand(220, 320), dir, age: 0 };
          DD.sound.play('whoosh');
          break;
        }
      }
      dirty = true;
    }

    function updateSpells(dt) {
      const g = st.ctx;
      const G = ground();
      // rockets
      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];
        r.vy += 480 * dt;
        r.y += r.vy * dt;
        P.add({ x: r.x, y: r.y, vy: 40, life: 0.4, shrink: true, draw: DD.paint.circle('#ffe0a0', 2) });
        if (r.vy > -60) {
          rockets.splice(i, 1);
          DD.sound.play('boom');
          P.burst(r.x, r.y, 70, () => {
            const a = U.rand(TAU),
              sp = U.rand(80, 260);
            return { vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: 120, drag: 1.2, life: U.rand(1, 1.8), blend: 'lighter', draw: DD.paint.circle(r.col, U.rand(1.5, 3)) };
          });
        }
      }
      // butterflies + lanterns
      for (let i = flyers.length - 1; i >= 0; i--) {
        const f = flyers[i];
        f.age += dt;
        if (f.age > f.life) {
          flyers.splice(i, 1);
          continue;
        }
        const fade = Math.min(1, f.age * 2, (f.life - f.age) / 1.5);
        g.save();
        g.globalAlpha = fade;
        if (f.type === 'butterfly') {
          f.vx += Math.sin(f.age * 1.7 + f.p) * 120 * dt;
          f.vy += Math.cos(f.age * 2.3 + f.p) * 120 * dt - 4 * dt;
          f.vx *= 0.985;
          f.vy *= 0.985;
          f.x += f.vx * dt;
          f.y = U.clamp(f.y + f.vy * dt, Math.max(10, G - 380), G - 20);
          f.x = U.clamp(f.x, 10, W() - 10);
          g.translate(f.x, f.y);
          g.rotate(f.vx * 0.003);
          U.glow(g, 0, 0, 16, f.col + '55');
          drawButterfly(g, f.col, f.age * 18 + f.p);
        } else {
          f.y += f.vy * dt;
          f.x += Math.sin(f.age * 0.8 + f.p) * 10 * dt;
          const s = f.s;
          g.translate(f.x, f.y);
          U.glow(g, 0, 0, 30 * s, 'rgba(255,150,60,0.45)');
          const lg = g.createLinearGradient(0, -12 * s, 0, 12 * s);
          lg.addColorStop(0, '#ffcf7a');
          lg.addColorStop(1, '#ff7a3d');
          g.fillStyle = lg;
          U.rrect(g, -8 * s, -11 * s, 16 * s, 20 * s, 6 * s);
          g.fill();
          g.fillStyle = '#fff3c0';
          g.beginPath();
          g.ellipse(0, 4 * s, 3 * s, 4 * s, 0, 0, TAU);
          g.fill();
        }
        g.restore();
      }
      // comet
      if (comet) {
        comet.age += dt;
        comet.x += comet.dir * 700 * dt;
        comet.y += 40 * dt;
        for (let k = 0; k < 4; k++)
          P.add({ x: comet.x, y: comet.y, vx: -comet.dir * U.rand(40, 120), vy: U.rand(-30, 30), life: U.rand(0.5, 1.1), shrink: true, blend: 'lighter', draw: DD.paint.circle(U.pick(['#ffffff', '#bfe0ff', '#ffe9a0']), U.rand(2, 4)) });
        U.glow(st.ctx, comet.x, comet.y, 26, 'rgba(220,235,255,0.9)');
        if (comet.x < -80 || comet.x > W() + 80) comet = null;
      }
      // levitation
      levitateT = Math.max(0, levitateT - dt);
      props.forEach((p, i) => {
        const target = levitateT > 0 ? 70 + Math.sin(st.time * 2 + i * 2) * 14 : 0;
        p.lift += (target - p.lift) * Math.min(1, dt * 2.5);
        if (p.lift > 5 && Math.random() < 0.2) P.add({ x: p.x + U.rand(-15, 15), y: p.y - p.lift + 4, vy: 40, life: 0.6, shrink: true, draw: starP(U.pick(wandColors().length ? wandColors() : ['#fff']), 2) });
      });
    }

    /* ---------------- wand trail ---------------- */
    function emitTrail() {
      const w = WANDS[cfg.wand];
      if (!env.cursorEffects || !w.colors.length || !env.pointer.inside) return;
      const p = env.pointer;
      const speed = Math.hypot(p.vx, p.vy);
      const now = st.time;
      if (now - lastEmit < 0.016) return;
      lastEmit = now;
      const n = speed > 200 ? 3 : 1;
      for (let i = 0; i < n; i++) {
        if (w.smoke) P.add({ x: p.x, y: p.y, vx: U.rand(-15, 15), vy: U.rand(-30, -5), life: 1.1, alpha: 0.5, draw: (g, q, t) => { g.fillStyle = 'rgba(235,240,255,0.5)'; g.beginPath(); g.arc(0, 0, 3 + t * 9, 0, TAU); g.fill(); } });
        else if (w.fire) P.add({ x: p.x + U.rand(-3, 3), y: p.y, vx: U.rand(-20, 20), vy: U.rand(-90, -40), life: 0.7, shrink: true, blend: 'lighter', draw: DD.paint.circle(U.pick(w.colors), U.rand(2, 4)) });
        else P.add({ x: p.x + U.rand(-4, 4), y: p.y + U.rand(-4, 4), vx: U.rand(-30, 30), vy: U.rand(-10, 50), life: U.rand(0.5, 0.9), shrink: true, draw: starP(U.pick(w.colors), U.rand(1.6, 3.6)) });
      }
    }

    /* ---------------- spellbook panel ---------------- */
    function openBook() {
      const spellIcon = (id) => (g, s) => {
        g.translate(s / 2, s / 2);
        const map = {
          sparkle: () => [[0, 0, 9], [-11, -8, 4], [10, 9, 5]].forEach(([x, y, r]) => { g.save(); g.translate(x, y); DD.paint.star('#ffe27a', r)(g, { age: 0 }, 0); g.restore(); }),
          fireworks: () => { for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; g.strokeStyle = U.pick(['#ff5f7e', '#ffd34d', '#5fd3ff']); g.lineWidth = 2; g.beginPath(); g.moveTo(Math.cos(a) * 4, Math.sin(a) * 4); g.lineTo(Math.cos(a) * 15, Math.sin(a) * 15); g.stroke(); } },
          butterflies: () => { g.scale(1.8, 1.8); drawButterfly(g, '#7fe0ff', 1.2); },
          starfall: () => { for (let i = 0; i < 3; i++) { g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(-14 + i * 10, -14 + i * 4); g.lineTo(-4 + i * 10, -2 + i * 4); g.stroke(); g.save(); g.translate(-4 + i * 10, -2 + i * 4); DD.paint.star('#fff3b0', 4)(g, { age: 0 }, 0); g.restore(); } },
          levitate: () => { g.translate(0, 6); g.scale(0.5, 0.5); drawCauldron(g, '#a65bff', 1); g.restore(); g.save(); },
          hearts: () => { g.fillStyle = '#ff5f8f'; heartPath(g, 12); g.fill(); },
          lanterns: () => { U.glow(g, 0, 0, 20, 'rgba(255,150,60,0.5)'); g.fillStyle = '#ff9a4d'; U.rrect(g, -8, -11, 16, 20, 6); g.fill(); },
          comet: () => { const grd = g.createLinearGradient(-16, 10, 8, -6); grd.addColorStop(0, 'rgba(190,220,255,0)'); grd.addColorStop(1, '#fff'); g.strokeStyle = grd; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); g.moveTo(-16, 12); g.lineTo(8, -6); g.stroke(); U.glow(g, 8, -6, 10, '#ffffff'); }
        };
        g.save();
        map[id]();
        g.restore();
      };
      DD.panel.open({
        title: 'Your spellbook.',
        x: book.x,
        y: book.y - 30,
        tabs: [
          { id: 'spell', label: 'Spells', items: SPELLS.map((s) => ({ id: s.id, label: s.label, draw: spellIcon(s.id) })) },
          {
            id: 'wand',
            label: 'Wand',
            items: Object.entries(WANDS).map(([id, w]) => ({
              id,
              label: w.label,
              draw: (g, s) => {
                g.translate(s / 2, s / 2);
                g.rotate(-0.7);
                g.fillStyle = '#5a3520';
                U.rrect(g, -2, -4, 4, 22, 2);
                g.fill();
                g.fillStyle = '#3a2214';
                g.fillRect(-2.5, 8, 5, 8);
                if (!w.colors.length) {
                  g.strokeStyle = 'rgba(255,255,255,0.5)';
                  g.lineWidth = 2;
                  g.beginPath();
                  g.moveTo(-10, -14);
                  g.lineTo(10, 14);
                  g.stroke();
                  return;
                }
                w.colors.forEach((c, i) => {
                  g.save();
                  g.translate(Math.cos(i * 2.2) * 7, -12 + Math.sin(i * 2.2) * 6);
                  DD.paint.star(c, 4)(g, { age: 0 }, 0);
                  g.restore();
                });
              }
            }))
          },
          {
            id: 'owl',
            label: 'Owl',
            items: Object.entries(OWLS).map(([id, o]) => ({
              id,
              label: o.label,
              draw: (g, s) => {
                g.translate(s / 2, s - 2);
                g.scale(0.72, 0.72);
                drawOwl(g, id, { t: 0 });
              }
            }))
          },
          {
            id: 'potion',
            label: 'Potion',
            items: Object.entries(POTIONS).map(([id, p]) => ({
              id,
              label: p.label,
              draw: (g, s) => {
                g.translate(s / 2, s / 2 + 4);
                U.glow(g, 0, 2, 20, p.c + '66');
                g.fillStyle = 'rgba(255,255,255,0.25)';
                g.beginPath();
                g.arc(0, 4, 11, 0, TAU);
                g.fill();
                g.fillRect(-4, -14, 8, 10);
                g.fillStyle = p.c;
                g.beginPath();
                g.arc(0, 4, 9, 0, TAU);
                g.fill();
                g.fillStyle = '#8a5a2b';
                g.fillRect(-4.5, -17, 9, 4);
              }
            }))
          }
        ],
        getSelected: (tab) => cfg[tab],
        onSelect: (tab, id) => {
          if (tab === 'spell') cast(id, book.x, book.y - 50);
          else cfg[tab] = id;
          if (tab === 'owl') {
            owl.squash = 0.2;
            DD.sound.play('hoot');
          }
          if (tab === 'potion') cauldron.squash = 0.15;
          dirty = true;
        },
        onReset: () => {
          cfg.wand = U.pick(Object.keys(WANDS).filter((k) => k !== 'off'));
          cfg.owl = U.pick(Object.keys(OWLS));
          cfg.potion = U.pick(Object.keys(POTIONS));
          dirty = true;
        }
      });
    }

    /* ---------------- public ---------------- */
    let saveT = 0;
    let idleSpell = U.rand(60, 120);
    return {
      pick(x, y) {
        for (const l of letters) if (l.pick(x, y)) return l;
        for (let i = props.length - 1; i >= 0; i--) if (props[i].pick(x, y)) return props[i];
        return null;
      },
      pointermove() {
        emitTrail();
      },
      action(name) {
        if (name === 'surprise') sendOwl();
      },
      frame(dt) {
        const g = st.ctx;
        idleSpell -= dt;
        if (idleSpell < 0) {
          idleSpell = U.rand(90, 180);
          if (Math.random() < 0.5) sendOwl();
          else cast(U.pick(['butterflies', 'lanterns', 'sparkle']), book.x, book.y - 50);
        }
        if (Math.random() < dt * 1.5) P.add({ x: book.x + U.rand(-20, 20), y: book.y - book.lift - 34, vx: U.rand(-10, 10), vy: U.rand(-40, -15), life: 1.4, shrink: true, draw: starP(wandColors()[0] || '#fff3b0', 2) });
        if (Math.random() < dt * 4) P.add({ x: cauldron.x + U.rand(-12, 12), y: cauldron.y - cauldron.lift - 42, vx: U.rand(-6, 6), vy: U.rand(-40, -20), life: 1.2, alpha: 0.6, draw: DD.paint.circle(POTIONS[cfg.potion].c, U.rand(1.5, 3)) });
        for (const p of props) p.update(dt);
        for (const l of letters) l.update(dt);
        updateSpells(dt);
        for (const p of props) {
          g.fillStyle = 'rgba(0,0,20,0.28)';
          g.beginPath();
          g.ellipse(p.x, ground(), p.w * 0.5 * (1 - Math.min(0.6, p.lift / 150)), 4, 0, 0, TAU);
          g.fill();
        }
        for (const l of letters) l.render(g);
        book.render(g);
        cauldron.render(g);
        owl.render(g);
        saveT += dt;
        if (dirty && saveT > 2) {
          dirty = false;
          saveT = 0;
          env.save({ cfg, pos: { owl: Math.round(owl.state === 'perch' ? owl.x : owl.home || owl.x), book: Math.round(book.x), cauldron: Math.round(cauldron.x) }, letterTip: saved.letterTip });
        }
      }
    };
  }

  DD.themes.wizard = { background, toys };
})();
