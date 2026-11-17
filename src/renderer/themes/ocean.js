/* Coral Reef – sunlit reef wallpaper + a fish tank on the Dock. */
(function () {
  const DD = window.DD;
  const U = DD.util;
  const TAU = Math.PI * 2;

  const FISH = {
    clown: { label: 'Clownfish', body: '#ff7a1a', stripe: '#ffffff', fin: '#ff9a4a', len: 30 },
    tang: { label: 'Blue tang', body: '#2f6bff', stripe: '#0f1e5a', fin: '#ffd23f', len: 32 },
    gold: { label: 'Goldfish', body: '#ffb347', stripe: null, fin: '#ffd08a', len: 26, fancy: true },
    puffer: { label: 'Puffer', body: '#e8d27a', stripe: '#8a7a3a', fin: '#f2e3a0', len: 28, puffer: true },
    angel: { label: 'Angelfish', body: '#f2f2ff', stripe: '#2a2a4a', fin: '#f2f2ff', len: 28, tall: true },
    neon: { label: 'Neon tetra', body: '#38f0ff', stripe: '#ff2d6a', fin: '#9ff7ff', len: 20 },
    jelly: { label: 'Jellyfish', body: '#ff9ee8', len: 26, jelly: true },
    turtle: { label: 'Sea turtle', body: '#6ab04c', len: 46, turtle: true }
  };
  const DECOR = {
    chest: { label: 'Treasure' },
    castle: { label: 'Castle' },
    helmet: { label: 'Diver helmet' },
    coral: { label: 'Coral' },
    anchor: { label: 'Anchor' },
    shell: { label: 'Clam' },
    arch: { label: 'Rock arch' },
    kelp: { label: 'Kelp' }
  };

  function drawFish(g, kind, a) {
    const f = FISH[kind] || FISH.clown;
    const L = f.len * (a.scale || 1);
    const wag = Math.sin(a.t * (a.fast ? 22 : 10)) * 0.35;
    if (f.jelly) {
      const pulse = 1 + Math.sin(a.t * 3) * 0.12;
      U.glow(g, 0, -4, L * 1.2, 'rgba(255,158,232,0.35)');
      g.fillStyle = 'rgba(255,170,235,0.8)';
      g.beginPath();
      g.ellipse(0, 0, (L / 2) * pulse, (L / 2.6) / pulse, 0, Math.PI, 0);
      g.fill();
      g.strokeStyle = 'rgba(255,190,240,0.7)';
      g.lineWidth = 1.4;
      for (let i = -2; i <= 2; i++) {
        g.beginPath();
        g.moveTo(i * L * 0.15, 0);
        for (let k = 1; k < 6; k++) g.lineTo(i * L * 0.15 + Math.sin(a.t * 3 + k + i) * 3, k * L * 0.18);
        g.stroke();
      }
      return;
    }
    if (f.turtle) {
      const fl = Math.sin(a.t * 3) * 0.5;
      g.fillStyle = '#8fd16a';
      for (const [x, y, s] of [
        [L * 0.25, L * 0.15, 1],
        [-L * 0.25, L * 0.15, -1]
      ]) {
        g.save();
        g.translate(x, y);
        g.rotate(s * fl + 0.4 * s);
        g.beginPath();
        g.ellipse(0, L * 0.1, L * 0.09, L * 0.22, 0, 0, TAU);
        g.fill();
        g.restore();
      }
      g.beginPath();
      g.ellipse(L * 0.48, -L * 0.02, L * 0.13, L * 0.1, 0, 0, TAU);
      g.fill();
      g.fillStyle = '#111';
      g.beginPath();
      g.arc(L * 0.53, -L * 0.05, 1.6, 0, TAU);
      g.fill();
      const sg = g.createRadialGradient(-L * 0.1, -L * 0.15, 2, 0, 0, L * 0.4);
      sg.addColorStop(0, '#9b7a3a');
      sg.addColorStop(1, '#4e3a17');
      g.fillStyle = sg;
      g.beginPath();
      g.ellipse(0, 0, L * 0.38, L * 0.24, 0, 0, TAU);
      g.fill();
      g.strokeStyle = 'rgba(255,230,160,0.35)';
      g.lineWidth = 1.2;
      for (let i = -1; i <= 1; i++) {
        g.beginPath();
        g.arc(i * L * 0.2, 0, L * 0.09, 0, TAU);
        g.stroke();
      }
      return;
    }
    const puff = a.puff || 0;
    if (f.puffer && puff > 0.05) {
      const R = L * (0.35 + puff * 0.25);
      g.fillStyle = f.body;
      g.beginPath();
      for (let i = 0; i < 24; i++) {
        const ang = (i / 24) * TAU;
        const rr = i % 2 ? R : R * (1 + 0.18 * puff);
        g.lineTo(Math.cos(ang) * rr, Math.sin(ang) * rr);
      }
      g.fill();
      g.fillStyle = '#fff6d0';
      g.beginPath();
      g.ellipse(0, R * 0.3, R * 0.7, R * 0.45, 0, 0, Math.PI);
      g.fill();
      g.fillStyle = '#111';
      g.beginPath();
      g.arc(R * 0.45, -R * 0.2, 2.6, 0, TAU);
      g.fill();
      return;
    }
    const H = L * (f.tall ? 0.7 : f.puffer ? 0.5 : 0.42);
    // tail
    g.save();
    g.translate(-L * 0.42, 0);
    g.rotate(wag);
    g.fillStyle = f.fin;
    g.beginPath();
    g.moveTo(0, 0);
    if (f.fancy) {
      g.bezierCurveTo(-L * 0.4, -H * 0.9, -L * 0.6, -H * 0.2, -L * 0.45, 0);
      g.bezierCurveTo(-L * 0.6, H * 0.2, -L * 0.4, H * 0.9, 0, 0);
    } else {
      g.lineTo(-L * 0.3, -H * 0.55);
      g.lineTo(-L * 0.22, 0);
      g.lineTo(-L * 0.3, H * 0.55);
    }
    g.closePath();
    g.fill();
    g.restore();
    // fins
    g.fillStyle = f.fin;
    g.beginPath();
    g.moveTo(-L * 0.1, -H * 0.42);
    g.quadraticCurveTo(0, -H * (f.tall ? 1.3 : 0.9), L * 0.15, -H * 0.4);
    g.fill();
    if (f.tall) {
      g.beginPath();
      g.moveTo(-L * 0.1, H * 0.42);
      g.quadraticCurveTo(0, H * 1.3, L * 0.15, H * 0.4);
      g.fill();
    }
    // body
    const bg = g.createLinearGradient(0, -H / 2, 0, H / 2);
    bg.addColorStop(0, U.shade(f.body, 0.2));
    bg.addColorStop(1, U.shade(f.body, -0.2));
    g.fillStyle = bg;
    g.beginPath();
    g.ellipse(0, 0, L / 2, H / 2, 0, 0, TAU);
    g.fill();
    if (f.stripe) {
      g.save();
      g.beginPath();
      g.ellipse(0, 0, L / 2, H / 2, 0, 0, TAU);
      g.clip();
      g.fillStyle = f.stripe;
      if (kind === 'clown') {
        [-0.18, 0.12].forEach((x) => g.fillRect(x * L, -H, L * 0.09, H * 2));
        g.fillRect(-L * 0.5, -H, L * 0.05, H * 2);
      } else if (kind === 'neon') g.fillRect(-L / 2, -H * 0.05, L, H * 0.25);
      else if (kind === 'angel') [-0.2, 0.05].forEach((x) => g.fillRect(x * L, -H, L * 0.08, H * 2));
      else if (kind === 'tang') {
        g.beginPath();
        g.ellipse(-L * 0.05, -H * 0.1, L * 0.3, H * 0.18, -0.1, 0, TAU);
        g.fill();
      } else
        for (let i = 0; i < 6; i++) {
          g.beginPath();
          g.arc(-L * 0.3 + i * L * 0.1, -H * 0.1 + (i % 2) * H * 0.2, 1.4, 0, TAU);
          g.fill();
        }
      g.restore();
    }
    // eye
    g.fillStyle = '#fff';
    g.beginPath();
    g.arc(L * 0.28, -H * 0.1, Math.max(2, L * 0.07), 0, TAU);
    g.fill();
    g.fillStyle = '#111';
    g.beginPath();
    g.arc(L * 0.3, -H * 0.1, Math.max(1.2, L * 0.04), 0, TAU);
    g.fill();
  }

  function drawDecor(g, kind, t, open = 0) {
    switch (kind) {
      case 'chest': {
        g.fillStyle = '#7a4a22';
        U.rrect(g, -22, -22, 44, 22, 3);
        g.fill();
        g.fillStyle = '#d9a63a';
        g.fillRect(-22, -14, 44, 3);
        g.fillRect(-3, -20, 6, 9);
        g.save();
        g.translate(-22, -22);
        g.rotate(-open * 1.1);
        g.fillStyle = '#8f5a2a';
        g.beginPath();
        g.moveTo(0, 0);
        g.lineTo(44, 0);
        g.quadraticCurveTo(44, -14, 22, -14);
        g.quadraticCurveTo(0, -14, 0, 0);
        g.fill();
        g.fillStyle = '#d9a63a';
        g.fillRect(19, -12, 6, 12);
        g.restore();
        if (open > 0.2) U.glow(g, 0, -24, 30, `rgba(255,220,90,${open * 0.8})`);
        break;
      }
      case 'castle': {
        g.fillStyle = '#c9a77a';
        g.fillRect(-20, -34, 40, 34);
        g.fillRect(-26, -46, 12, 46);
        g.fillRect(14, -46, 12, 46);
        for (const x of [-26, -21, 14, 19]) g.fillRect(x, -50, 3, 4);
        g.fillStyle = '#3a2a1a';
        g.beginPath();
        g.arc(0, -10, 7, Math.PI, 0);
        g.fillRect(-7, -10, 14, 10);
        g.fill();
        g.fillStyle = '#ff6fa5';
        g.beginPath();
        g.moveTo(-26, -46);
        g.lineTo(-20, -60);
        g.lineTo(-14, -46);
        g.moveTo(14, -46);
        g.lineTo(20, -60);
        g.lineTo(26, -46);
        g.fill();
        break;
      }
      case 'helmet': {
        const gr = g.createRadialGradient(-6, -26, 3, 0, -20, 24);
        gr.addColorStop(0, '#ffd27a');
        gr.addColorStop(1, '#a8661c');
        g.fillStyle = gr;
        g.beginPath();
        g.arc(0, -20, 20, 0, TAU);
        g.fill();
        g.fillStyle = '#1a3a4a';
        g.beginPath();
        g.arc(2, -20, 9, 0, TAU);
        g.fill();
        g.strokeStyle = '#d9a63a';
        g.lineWidth = 2.5;
        g.stroke();
        g.fillStyle = '#7a4a1a';
        g.fillRect(-18, -4, 36, 4);
        break;
      }
      case 'coral': {
        const branch = (x, y, a, len, w, d) => {
          if (d === 0) return;
          const x2 = x + Math.cos(a) * len,
            y2 = y + Math.sin(a) * len;
          g.strokeStyle = '#ff6f7d';
          g.lineWidth = w;
          g.lineCap = 'round';
          g.beginPath();
          g.moveTo(x, y);
          g.lineTo(x2, y2);
          g.stroke();
          branch(x2, y2, a - 0.45 + Math.sin(t + d) * 0.03, len * 0.75, w * 0.75, d - 1);
          branch(x2, y2, a + 0.45, len * 0.75, w * 0.75, d - 1);
        };
        branch(0, 0, -Math.PI / 2, 16, 6, 4);
        break;
      }
      case 'anchor': {
        g.strokeStyle = '#5a6270';
        g.lineWidth = 5;
        g.lineCap = 'round';
        g.beginPath();
        g.moveTo(0, -44);
        g.lineTo(0, -6);
        g.moveTo(-12, -36);
        g.lineTo(12, -36);
        g.stroke();
        g.beginPath();
        g.arc(0, -16, 16, 0.2, Math.PI - 0.2);
        g.stroke();
        g.beginPath();
        g.arc(0, -48, 5, 0, TAU);
        g.stroke();
        break;
      }
      case 'shell': {
        const o = 0.25 + Math.max(0, Math.sin(t * 0.6)) * 0.4;
        g.fillStyle = '#e6b8d8';
        g.beginPath();
        g.ellipse(0, -5, 20, 7, 0, 0, Math.PI);
        g.fill();
        g.save();
        g.translate(-20, -5);
        g.rotate(-o);
        g.fillStyle = '#f2cfe6';
        g.beginPath();
        g.ellipse(20, 0, 20, 12, 0, Math.PI, 0);
        g.fill();
        g.restore();
        g.fillStyle = '#fffaf2';
        U.glow(g, 0, -9, 12, 'rgba(255,255,255,0.7)');
        g.beginPath();
        g.arc(0, -9, 4, 0, TAU);
        g.fill();
        break;
      }
      case 'arch': {
        g.fillStyle = '#5b6b7a';
        g.beginPath();
        g.moveTo(-34, 0);
        g.quadraticCurveTo(-36, -50, 0, -52);
        g.quadraticCurveTo(36, -50, 34, 0);
        g.lineTo(18, 0);
        g.quadraticCurveTo(18, -30, 0, -32);
        g.quadraticCurveTo(-18, -30, -18, 0);
        g.closePath();
        g.fill();
        g.fillStyle = 'rgba(255,255,255,0.12)';
        g.beginPath();
        g.ellipse(-20, -36, 8, 4, -0.6, 0, TAU);
        g.fill();
        break;
      }
      case 'kelp': {
        g.strokeStyle = '#2f9a4a';
        g.lineWidth = 5;
        g.lineCap = 'round';
        for (let s = -1; s <= 1; s++) {
          g.beginPath();
          g.moveTo(s * 6, 0);
          for (let k = 1; k <= 8; k++) g.lineTo(s * 6 + Math.sin(t * 1.4 + k * 0.6 + s) * k * 1.2, -k * 9);
          g.stroke();
        }
        break;
      }
    }
  }

  /* ================================================================== wallpaper */
  function background(env) {
    const st = env.stage;
    let L = null;
    let kelp = [],
      bubbles = [],
      school = [],
      snow = [];
    let whale = null,
      nextWhale = U.rand(30, 70);
    const dot = U.dot('rgba(220,250,255,1)', 16);

    function build() {
      const W = st.w,
        H = st.h,
        dpr = st.dpr;
      const rnd = U.rng(8080);
      const floor = H * 0.8;
      const base = U.layer(W, H, dpr, (g) => {
        const grd = g.createLinearGradient(0, 0, 0, H);
        grd.addColorStop(0, '#36d0e6');
        grd.addColorStop(0.25, '#0e8fb4');
        grd.addColorStop(0.6, '#064a78');
        grd.addColorStop(1, '#03203f');
        g.fillStyle = grd;
        g.fillRect(0, 0, W, H);
        // distant rocks
        const rock = (y, amp, col, n) => {
          const pts = DD.alps(rnd, W, y, amp, n);
          g.beginPath();
          g.moveTo(-20, H);
          pts.forEach((p) => g.lineTo(p[0], p[1]));
          g.lineTo(W + 20, H);
          g.fillStyle = col;
          g.fill();
        };
        rock(H * 0.72, H * 0.18, 'rgba(8,70,110,0.7)', 6);
        rock(H * 0.78, H * 0.12, 'rgba(6,55,92,0.85)', 9);
        // sand
        const sg = g.createLinearGradient(0, floor - 20, 0, H);
        sg.addColorStop(0, '#2f7b8f');
        sg.addColorStop(0.3, '#c9b48a');
        sg.addColorStop(1, '#8a7656');
        g.fillStyle = sg;
        g.beginPath();
        g.moveTo(0, H);
        for (let x = 0; x <= W; x += 20) g.lineTo(x, floor + Math.sin(x * 0.004) * 14 + Math.sin(x * 0.017) * 5);
        g.lineTo(W, H);
        g.fill();
        g.fillStyle = 'rgba(255,255,255,0.08)';
        for (let i = 0; i < 300; i++) g.fillRect(rnd() * W, floor + rnd() * (H - floor), 2, 1);
        // reef clusters
        const coralCols = ['#ff6f7d', '#ffb347', '#c38bff', '#ff8ad8', '#5fe0c4', '#ffd34d'];
        for (let i = 0; i < W / 70; i++) {
          const x = rnd() * W,
            y = floor + 6 + rnd() * 30;
          const col = U.pick(coralCols);
          const kind = rnd();
          g.save();
          g.translate(x, y);
          const s = 0.7 + rnd() * 1.3;
          g.scale(s, s);
          if (kind < 0.35) {
            // brain coral
            g.fillStyle = col;
            g.beginPath();
            g.ellipse(0, -10, 18, 12, 0, Math.PI, 0);
            g.fill();
            g.strokeStyle = 'rgba(0,0,0,0.2)';
            g.lineWidth = 1;
            for (let k = 0; k < 4; k++) {
              g.beginPath();
              g.arc(0, -4, 6 + k * 3, Math.PI * 1.1, Math.PI * 1.9);
              g.stroke();
            }
          } else if (kind < 0.7) {
            // branching coral
            const br = (bx, by, a, len, w, d) => {
              if (!d) return;
              const x2 = bx + Math.cos(a) * len,
                y2 = by + Math.sin(a) * len;
              g.strokeStyle = col;
              g.lineWidth = w;
              g.lineCap = 'round';
              g.beginPath();
              g.moveTo(bx, by);
              g.lineTo(x2, y2);
              g.stroke();
              br(x2, y2, a - 0.4 - rnd() * 0.3, len * 0.78, w * 0.75, d - 1);
              br(x2, y2, a + 0.4 + rnd() * 0.3, len * 0.78, w * 0.75, d - 1);
            };
            br(0, 0, -Math.PI / 2, 14, 5, 4);
          } else {
            // fan coral
            g.fillStyle = col;
            g.globalAlpha = 0.85;
            g.beginPath();
            g.moveTo(0, 0);
            g.arc(0, 0, 30, Math.PI * 1.15, Math.PI * 1.85);
            g.closePath();
            g.fill();
            g.globalAlpha = 1;
            g.strokeStyle = 'rgba(0,0,0,0.18)';
            for (let k = 0; k < 8; k++) {
              const a = Math.PI * (1.15 + k * 0.1);
              g.beginPath();
              g.moveTo(0, 0);
              g.lineTo(Math.cos(a) * 30, Math.sin(a) * 30);
              g.stroke();
            }
          }
          g.restore();
        }
        // depth haze over everything
        const haze = g.createLinearGradient(0, H * 0.4, 0, H);
        haze.addColorStop(0, 'rgba(6,74,120,0)');
        haze.addColorStop(1, 'rgba(3,32,63,0.25)');
        g.fillStyle = haze;
        g.fillRect(0, 0, W, H);
      });
      L = { base, floor };
      kelp = [];
      for (let i = 0; i < W / 55; i++) kelp.push({ x: rnd() * W, h: H * (0.15 + rnd() * 0.35), p: rnd() * TAU, w: 4 + rnd() * 5, c: rnd() < 0.5 ? '#1f7a4a' : '#2f9a5a' });
      bubbles = [];
      for (let i = 0; i < 40; i++) bubbles.push({ x: rnd() * W, y: rnd() * H, r: 1 + rnd() * 4, v: 20 + rnd() * 50, p: rnd() * TAU });
      school = [];
      for (let s = 0; s < 3; s++) {
        const grp = { x: rnd() * W, y: H * (0.25 + rnd() * 0.35), v: (rnd() < 0.5 ? -1 : 1) * (20 + rnd() * 30), fish: [], col: `rgba(10,60,100,${0.35 + s * 0.15})` };
        for (let i = 0; i < 26; i++) grp.fish.push({ dx: (rnd() - 0.5) * 160, dy: (rnd() - 0.5) * 60, p: rnd() * TAU, s: 0.6 + rnd() * 0.6 });
        school.push(grp);
      }
      snow = [];
      for (let i = 0; i < 120; i++) snow.push({ x: rnd() * W, y: rnd() * H, s: rnd() });
    }
    st.onResize.push(build);
    build();

    return {
      action(name) {
        if (name === 'surprise' && !whale) nextWhale = 0.01;
      },
      frame(dt, t) {
        const g = st.ctx,
          W = st.w,
          H = st.h;
        g.drawImage(L.base, 0, 0, W, H);
        // god rays
        g.save();
        g.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 7; i++) {
          const x = W * (0.1 + i * 0.14) + Math.sin(t * 0.2 + i) * 40;
          const grd = g.createLinearGradient(0, 0, 0, H * 0.85);
          grd.addColorStop(0, `rgba(190,250,255,${0.1 + 0.05 * Math.sin(t * 0.5 + i * 2)})`);
          grd.addColorStop(1, 'rgba(190,250,255,0)');
          g.fillStyle = grd;
          g.beginPath();
          g.moveTo(x - 20, 0);
          g.lineTo(x + 30, 0);
          g.lineTo(x + 160 + i * 10, H * 0.85);
          g.lineTo(x + 40, H * 0.85);
          g.fill();
        }
        // surface caustics
        g.strokeStyle = 'rgba(220,255,255,0.12)';
        g.lineWidth = 2;
        for (let k = 0; k < 5; k++) {
          g.beginPath();
          for (let x = 0; x <= W; x += 16) g.lineTo(x, 8 + k * 14 + Math.sin(x * 0.02 + t * 1.5 + k) * 5 + Math.sin(x * 0.05 - t + k * 2) * 3);
          g.stroke();
        }
        g.restore();
        // whale silhouette
        nextWhale -= dt;
        if (nextWhale < 0 && !whale) {
          const dir = Math.random() < 0.5 ? 1 : -1;
          whale = { x: dir > 0 ? -500 : W + 500, y: H * U.rand(0.18, 0.35), dir };
          nextWhale = U.rand(80, 160);
        }
        if (whale) {
          whale.x += whale.dir * 40 * dt;
          g.save();
          g.translate(whale.x, whale.y + Math.sin(t * 0.5) * 10);
          g.scale(whale.dir, 1);
          g.fillStyle = 'rgba(4,50,85,0.55)';
          g.beginPath();
          g.ellipse(0, 0, 220, 55, 0, 0, TAU);
          g.fill();
          g.save();
          g.translate(-210, -5);
          g.rotate(Math.sin(t * 1.2) * 0.2);
          g.beginPath();
          g.moveTo(0, 0);
          g.lineTo(-80, -45);
          g.lineTo(-60, 0);
          g.lineTo(-80, 45);
          g.fill();
          g.restore();
          g.beginPath();
          g.ellipse(30, 45, 70, 14, 0.4, 0, TAU);
          g.fill();
          g.restore();
          if (whale.x < -600 || whale.x > W + 600) whale = null;
        }
        // fish schools
        for (const s of school) {
          s.x += s.v * dt;
          if (s.v > 0 && s.x > W + 200) s.x = -200;
          if (s.v < 0 && s.x < -200) s.x = W + 200;
          g.fillStyle = s.col;
          for (const f of s.fish) {
            const x = s.x + f.dx + Math.sin(t + f.p) * 10,
              y = s.y + f.dy + Math.sin(t * 1.3 + f.p) * 6;
            g.save();
            g.translate(x, y);
            g.scale(Math.sign(s.v) * f.s, f.s);
            g.beginPath();
            g.ellipse(0, 0, 8, 3, 0, 0, TAU);
            g.moveTo(-6, 0);
            g.lineTo(-12, -4);
            g.lineTo(-12, 4);
            g.fill();
            g.restore();
          }
        }
        // kelp
        for (const k of kelp) {
          g.strokeStyle = k.c;
          g.lineWidth = k.w;
          g.lineCap = 'round';
          g.beginPath();
          const segs = 10;
          let x = k.x,
            y = L.floor + 20;
          g.moveTo(x, y);
          for (let i = 1; i <= segs; i++) {
            const kk = i / segs;
            x = k.x + Math.sin(t * 0.9 + k.p + i * 0.45) * 14 * kk;
            y = L.floor + 20 - k.h * kk;
            g.lineTo(x, y);
          }
          g.stroke();
          g.fillStyle = k.c;
          for (let i = 2; i <= segs; i += 2) {
            const kk = i / segs;
            const lx = k.x + Math.sin(t * 0.9 + k.p + i * 0.45) * 14 * kk;
            const ly = L.floor + 20 - k.h * kk;
            g.beginPath();
            g.ellipse(lx + 6, ly, 7, 2.5, 0.5 + Math.sin(t + i) * 0.2, 0, TAU);
            g.fill();
          }
        }
        // bubbles
        g.strokeStyle = 'rgba(220,250,255,0.6)';
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
        // marine snow
        for (const s of snow) {
          s.y += (4 + s.s * 6) * dt;
          s.x += Math.sin(t * 0.3 + s.s * 9) * 3 * dt;
          if (s.y > H) s.y = 0;
          g.globalAlpha = 0.2 + s.s * 0.3;
          g.drawImage(dot, s.x, s.y, 3 + s.s * 2, 3 + s.s * 2);
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
    let dirty = false;
    const fishes = [];
    const flakes = [];
    const bubbleCol = 'rgba(210,250,255,0.85)';
    const BAND = 230;

    function Fish(kind, x, y) {
      const f = { kind, x: x ?? U.rand(W() * 0.3, W() * 0.7), y: y ?? ground() - U.rand(40, BAND - 20), vx: U.rand(-40, 40), vy: 0, dir: 1, t: U.rand(9), tx: 0, ty: 0, retarget: 0, puff: 0, scale: 1.35, flip: 0 };
      f.pick = (px, py) => U.dist(px, py, f.x, f.y) < FISH[kind].len * 0.6 * f.scale + 6;
      f.bubbleAnchor = () => ({ x: f.x, y: f.y - 24 });
      // click: a flip · double-click: turbo dash (the puffer pops!) · right-click: tank
      f.onClick = DD.clicks(
        () => {
          DD.sound.play('bubble');
          if (FISH[kind].puffer) f.puff = 1;
          else f.flip = 1;
          f.vx += f.dir * 200;
          P.burst(f.x, f.y, 6, () => ({ vx: U.rand(-20, 20), vy: U.rand(-90, -40), life: 1.2, draw: bubbleDraw(U.rand(2, 4)) }));
        },
        () => {
          if (FISH[kind].puffer) {
            // POP: a cloud of bubbles and a deflating spin
            f.puff = 0;
            f.flip = 1;
            f.vx = U.rand(-500, 500);
            f.vy = -260;
            DD.sound.play('pop');
            setTimeout(() => DD.sound.play('splash'), 80);
            P.burst(f.x, f.y, 40, () => ({ vx: U.rand(-260, 260), vy: U.rand(-260, 60), drag: 1.5, life: U.rand(1, 2), draw: bubbleDraw(U.rand(2, 6)) }));
            env.stage.shake && env.stage.shake(4);
            DD.bubbles.say(f, U.pick(['Pfffft!', 'I deflate.', 'Whoops!']), 1.6);
          } else {
            // turbo: zoom off with a bubble trail
            f.turbo = 1.2;
            f.dir = Math.random() < 0.5 ? -1 : 1;
            f.vx = f.dir * 900;
            DD.sound.play('whoosh');
            DD.bubbles.say(f, U.pick(['Zoom!', 'Turbo fins!', 'Can’t catch me!']), 1.2);
          }
        }
      );
      f.onDblClick = () => {};
      f.onContext = () => openTank(f.x, f.y);
      f.onGrab = () => (f.held = true);
      f.onDrag = (px, py) => {
        f.x = px;
        f.y = U.clamp(py, ground() - BAND - 40, ground() - 10);
      };
      f.onRelease = (vx, vy) => {
        f.held = false;
        f.vx = vx * 0.3;
        f.vy = vy * 0.3;
        dirty = true;
      };
      f.update = (dt) => {
        f.t += dt;
        if (f.turbo > 0) {
          f.turbo -= dt;
          f.x += f.vx * dt;
          if (Math.random() < 0.8) P.add({ x: f.x - f.dir * 20, y: f.y + U.rand(-4, 4), vx: -f.dir * 40, vy: U.rand(-60, -20), life: 1, draw: bubbleDraw(U.rand(1.5, 3)) });
          // wrap around the screen
          if (f.x > W() + 40) f.x = -40;
          if (f.x < -40) f.x = W() + 40;
          if (f.turbo <= 0) f.vx = f.dir * 60;
          return;
        }
        f.puff = Math.max(0, f.puff - dt * 0.35);
        f.flip = Math.max(0, f.flip - dt * 1.5);
        if (f.held) return;
        const G = ground();
        const def = FISH[kind];
        // target: nearest food or wander
        let target = null;
        let best = 1e9;
        for (const fl of flakes) {
          const d = U.dist(f.x, f.y, fl.x, fl.y);
          if (d < best && d < 500) {
            best = d;
            target = fl;
          }
        }
        f.retarget -= dt;
        if (!target && f.retarget < 0) {
          f.retarget = U.rand(2, 6);
          f.tx = U.clamp(f.x + U.rand(-300, 300), 40, W() - 40);
          f.ty = G - U.rand(30, BAND);
        }
        const tx = target ? target.x : f.tx,
          ty = target ? target.y : f.ty;
        const maxV = def.jelly ? 30 : def.turtle ? 50 : target ? 220 : 80;
        const ax = U.clamp(tx - f.x, -1, 1) * (target ? 500 : 120);
        const ay = U.clamp(ty - f.y, -1, 1) * (target ? 500 : 80);
        f.vx += ax * dt;
        f.vy += ay * dt;
        if (def.jelly) f.vy += Math.sin(f.t * 3) * 30 * dt;
        // flee fast cursor
        const p = env.pointer;
        if (p.inside) {
          const d = U.dist(p.x, p.y, f.x, f.y);
          const sp = Math.hypot(p.vx, p.vy);
          if (d < 120 && sp > 500) {
            f.vx += ((f.x - p.x) / d) * 1600 * dt;
            f.vy += ((f.y - p.y) / d) * 1600 * dt;
            f.fast = 1;
          } else if (d < 90 && !target) {
            // curious: drift toward a slow cursor
            f.vx += ((p.x - f.x) / d) * 60 * dt;
            f.vy += ((p.y - f.y) / d) * 60 * dt;
          }
        }
        f.fast = Math.max(0, (f.fast || 0) - dt);
        const sp = Math.hypot(f.vx, f.vy);
        const lim = f.fast ? 380 : maxV;
        if (sp > lim) {
          f.vx *= lim / sp;
          f.vy *= lim / sp;
        }
        f.vx *= 0.995;
        f.vy *= 0.97;
        f.x += f.vx * dt;
        f.y += f.vy * dt;
        f.y = U.clamp(f.y, G - BAND - 30, G - 12);
        if (f.x < 20 || f.x > W() - 20) {
          f.vx *= -1;
          f.x = U.clamp(f.x, 20, W() - 20);
        }
        if (Math.abs(f.vx) > 8) f.dir = Math.sign(f.vx);
        // eat
        if (target && best < 14) {
          flakes.splice(flakes.indexOf(target), 1);
          f.scale = Math.min(1.9, f.scale + 0.02);
          DD.sound.play('bubble');
          dirty = true;
        }
        if (Math.random() < dt * 0.3) P.add({ x: f.x + f.dir * 10, y: f.y - 4, vy: -40, vx: U.rand(-5, 5), life: 2, draw: bubbleDraw(U.rand(1.5, 3)) });
      };
      f.draw = (g) => {
        g.save();
        g.translate(f.x, f.y);
        g.scale(f.dir, 1);
        if (f.flip) g.rotate(f.flip * TAU);
        if (!FISH[kind].jelly && !FISH[kind].turtle) g.rotate(U.clamp(f.vy * 0.003, -0.4, 0.4));
        drawFish(g, kind, { t: f.t, scale: f.scale, puff: f.puff, fast: f.fast > 0 });
        g.restore();
      };
      return f;
    }
    const bubbleDraw = (r) => (g) => {
      g.strokeStyle = bubbleCol;
      g.lineWidth = 1;
      g.beginPath();
      g.arc(0, 0, r, 0, TAU);
      g.stroke();
      g.fillStyle = 'rgba(255,255,255,0.6)';
      g.beginPath();
      g.arc(-r * 0.3, -r * 0.3, r * 0.25, 0, TAU);
      g.fill();
    };

    /* ---------------- shaker + decor ---------------- */
    const shaker = DD.prop({
      x: saved.shaker ?? W() / 2 + 180,
      w: 24,
      h: 40,
      groundFn: ground,
      widthFn: W,
      kind: 'shaker',
      draw: (g) => {
        g.fillStyle = '#ff5f7e';
        U.rrect(g, -11, -32, 22, 32, 5);
        g.fill();
        g.fillStyle = '#fff';
        g.fillRect(-11, -22, 22, 10);
        g.fillStyle = '#ff5f7e';
        g.font = 'bold 6px sans-serif';
        g.textAlign = 'center';
        g.fillText('FOOD', 0, -15);
        g.fillStyle = '#e8e8f0';
        U.rrect(g, -9, -40, 18, 9, 3);
        g.fill();
      },
      // click: a pinch of food · double-click: feeding frenzy
      onClick: DD.clicks(() => feed(), () => frenzy()),
      onRelease: () => (dirty = true),
      onLand: () => DD.sound.play('thud')
    });
    function frenzy() {
      shaker.vy = -500;
      shaker.tilt = 0.6;
      DD.sound.play('splash');
      for (let i = 0; i < 60; i++) flakes.push({ x: U.rand(40, W() - 40), y: ground() - BAND - U.rand(0, 120), vy: U.rand(18, 40), p: U.rand(TAU), c: U.pick(['#ffb347', '#ff7a5a', '#ffe08a', '#a6ff8a']) });
      for (const f of fishes) DD.bubbles.say(f, U.pick(['FOOD!', 'Mine!', 'Nom nom!', '!!!']), 1.4);
    }
    function feed() {
      shaker.squash = 0.2;
      DD.sound.play('splash');
      const n = Math.min(14, 3 + fishes.length * 2);
      for (let i = 0; i < n; i++) flakes.push({ x: U.rand(shaker.x - 260, shaker.x + 260), y: ground() - BAND - U.rand(0, 40), vy: U.rand(18, 30), p: U.rand(TAU), c: U.pick(['#ffb347', '#ff7a5a', '#ffe08a']) });
    }

    const decorState = Object.assign({ chest: true, coral: true, kelp: true }, saved.decor || {});
    const decorPos = saved.decorPos || {};
    const decor = {};
    function makeDecor(kind, i) {
      const d = DD.prop({
        x: decorPos[kind] ?? U.clamp(W() / 2 - 260 + i * 90, 40, W() - 40),
        w: kind === 'arch' ? 70 : 48,
        h: kind === 'anchor' ? 54 : kind === 'castle' ? 60 : 44,
        groundFn: ground,
        widthFn: W,
        kind: 'decor',
        open: 0,
        draw: (g, p) => drawDecor(g, kind, st.time, p.open),
        onDblClick: () => {},
        onContext: () => openTank(d.x, d.y - 40),
        onRelease: () => {
          decorPos[kind] = Math.round(d.x);
          dirty = true;
        },
        onLand: () => DD.sound.play('thud')
      });
      // click: open / bubble · double-click: bubble geyser that sends the fish flying
      d.onClick = DD.clicks(
        () => {
          if (kind === 'chest') openChest(d);
          else {
            d.squash = 0.15;
            DD.sound.play('bubble');
            P.burst(d.x, d.y - d.h, 10, () => ({ vx: U.rand(-30, 30), vy: U.rand(-120, -50), life: 1.6, draw: bubbleDraw(U.rand(2, 5)) }));
          }
        },
        () => geyser(d)
      );
      return d;
    }
    Object.keys(DECOR).forEach((k, i) => (decor[k] = makeDecor(k, i)));

    function geyser(d) {
      d.squash = 0.25;
      DD.sound.play('splash');
      let n = 0;
      const iv = setInterval(() => {
        for (let i = 0; i < 8; i++) P.add({ x: d.x + U.rand(-14, 14), y: d.y - d.h, vx: U.rand(-40, 40), vy: U.rand(-520, -300), drag: 0.4, life: U.rand(1, 1.8), draw: bubbleDraw(U.rand(2, 7)) });
        if (n % 3 === 0) DD.sound.play('bubble');
        if (++n > 18) clearInterval(iv);
      }, 60);
      for (const f of fishes)
        if (Math.abs(f.x - d.x) < 160) {
          f.vy = -U.rand(300, 480);
          f.vx += Math.sign(f.x - d.x || 1) * 160;
          f.flip = 1;
        }
    }
    function openChest(d) {
      if (d.open > 0) return;
      d.open = 1;
      DD.sound.play('coin');
      P.burst(d.x, d.y - 24, 20, () => ({ vx: U.rand(-80, 80), vy: U.rand(-220, -80), g: 300, life: 1.4, draw: DD.paint.circle('#ffd34d', U.rand(2, 3.5)) }));
      P.burst(d.x, d.y - 20, 14, () => ({ vx: U.rand(-40, 40), vy: U.rand(-160, -60), life: 2, draw: bubbleDraw(U.rand(2, 5)) }));
      if (fishes.length < 14) {
        const kinds = Object.keys(FISH);
        const k = U.pick(kinds);
        const f = Fish(k, d.x, d.y - 30);
        f.vy = -160;
        fishes.push(f);
        DD.bubbles.say(f, `A ${FISH[k].label.toLowerCase()}!`, 2);
        dirty = true;
      }
      setTimeout(() => (d.open = 0), 2500);
    }

    /* ---------------- tank panel ---------------- */
    function openTank(x, y) {
      DD.panel.open({
        title: 'Your aquarium.',
        x,
        y,
        tabs: [
          {
            id: 'fish',
            label: 'Add fish',
            items: Object.entries(FISH).map(([id, f]) => ({
              id,
              label: f.label,
              draw: (g, s) => {
                g.translate(s / 2, s / 2 + (f.jelly ? -2 : 0));
                const k = 30 / f.len;
                g.scale(k, k);
                drawFish(g, id, { t: 0.3 });
              }
            }))
          },
          {
            id: 'decor',
            label: 'Decor',
            items: Object.entries(DECOR).map(([id, d]) => ({
              id,
              label: d.label,
              draw: (g, s) => {
                g.translate(s / 2, s - 4);
                g.scale(0.55, 0.55);
                drawDecor(g, id, 0.5);
              }
            }))
          }
        ],
        getSelected: (tab) => null,
        isLocked: () => false,
        onSelect: (tab, id) => {
          if (tab === 'fish') {
            if (fishes.length >= 16) return DD.toast('The tank is full. Remove a few fish first.');
            const f = Fish(id, x + U.rand(-40, 40), ground() - BAND * 0.6);
            fishes.push(f);
            DD.sound.play('splash');
          } else {
            decorState[id] = !decorState[id];
            if (decorState[id]) decor[id].y = ground() - 120;
          }
          dirty = true;
        },
        footer: () => `<span style="flex:1">${fishes.length} fish · click again to toggle decor</span><button class="dd-btn" data-act="feed">Feed</button><button class="dd-btn" data-act="clear">Empty tank</button>`,
        onFooter: (act) => {
          if (act === 'feed') feed();
          if (act === 'clear') {
            fishes.length = 0;
            dirty = true;
            DD.panel.refresh();
          }
        }
      });
    }

    /* ---------------- persistence ---------------- */
    const initial = saved.fish || ['clown', 'tang', 'gold', 'puffer', 'jelly'];
    initial.forEach((k) => FISH[k] && fishes.push(Fish(k)));

    let saveT = 0;
    let feedT = U.rand(90, 150);
    return {
      pick(x, y) {
        for (let i = fishes.length - 1; i >= 0; i--) if (fishes[i].pick(x, y)) return fishes[i];
        if (shaker.pick(x, y)) return shaker;
        for (const k of Object.keys(decor)) if (decorState[k] && decor[k].pick(x, y)) return decor[k];
        return null;
      },
      action(name) {
        if (name === 'surprise') feed();
      },
      frame(dt) {
        const g = st.ctx;
        const G = ground();
        feedT -= dt;
        if (feedT < 0) {
          feedT = U.rand(120, 240);
          DD.bubbles.say(fishes[0] || shaker, 'Hungry! 🐟', 2.4);
        }
        // food
        for (let i = flakes.length - 1; i >= 0; i--) {
          const f = flakes[i];
          f.y += f.vy * dt;
          f.x += Math.sin(st.time * 2 + f.p) * 8 * dt;
          if (f.y > G - 4) flakes.splice(i, 1);
          else {
            g.fillStyle = f.c;
            g.fillRect(f.x - 2, f.y - 1.5, 4, 3);
          }
        }
        for (const k of Object.keys(decor)) {
          if (!decorState[k]) continue;
          decor[k].update(dt);
          decor[k].render(g);
          if (Math.random() < dt * 0.4) P.add({ x: decor[k].x + U.rand(-8, 8), y: decor[k].y - decor[k].h, vy: -50, vx: U.rand(-6, 6), life: 3, draw: bubbleDraw(U.rand(1.5, 3)) });
        }
        shaker.update(dt);
        shaker.render(g);
        for (const f of fishes) f.update(dt);
        for (const f of fishes) f.draw(g);
        saveT += dt;
        if (dirty && saveT > 2) {
          dirty = false;
          saveT = 0;
          env.save({ fish: fishes.map((f) => f.kind), decor: decorState, decorPos, shaker: Math.round(shaker.x) });
        }
      }
    };
  }

  DD.themes.ocean = { background, toys };
})();
