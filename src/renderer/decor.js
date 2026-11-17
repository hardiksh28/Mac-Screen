/*
 * "Deck your screen" – decorations that live on the desktop, behind your windows.
 * They are drawn by the wallpaper layer. While decorating, the toy overlay shows them with
 * drag handles so they can be moved, stretched (lights) and removed.
 */
(function () {
  const DD = window.DD;
  const U = DD.util;
  const TAU = Math.PI * 2;

  /* ---------------- art ---------------- */
  function bauble(g, color, t, s, onTree) {
    g.strokeStyle = 'rgba(220,220,230,0.8)';
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(0, (onTree ? -20 : -40) * s);
    g.lineTo(0, -14 * s);
    g.stroke();
    g.fillStyle = '#d9b44a';
    g.fillRect(-3.5 * s, -16 * s, 7 * s, 5 * s);
    const gr = g.createRadialGradient(-4 * s, -4 * s, 1, 0, 0, 13 * s);
    gr.addColorStop(0, '#ffffff');
    gr.addColorStop(0.25, color);
    gr.addColorStop(1, U.shade(color, -0.45));
    g.fillStyle = gr;
    g.beginPath();
    g.arc(0, 0, 12 * s, 0, TAU);
    g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.35)';
    g.lineWidth = 1.2 * s;
    g.beginPath();
    g.arc(0, 0, 8 * s, Math.PI * 0.9, Math.PI * 1.3);
    g.stroke();
  }
  function star5(g, r, inner = 0.45) {
    g.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i / 10) * TAU;
      const rr = i % 2 ? r * inner : r;
      g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    g.closePath();
  }
  const BULBS = ['#ff4d6d', '#ffd34d', '#4dd2ff', '#7dff9b', '#c38bff', '#ff9a4d'];

  /* ---------------- the Christmas tree (big, and you can decorate it) ---------------- */
  // tree units (multiplied by the tree's scale): base at 0, top of the tip at TREE_TOP
  const TIERS = [
    [-18, 66],
    [-52, 56],
    [-84, 46],
    [-114, 35],
    [-140, 24]
  ];
  const TIER_H = 58;
  const TREE_TOP = TIERS[TIERS.length - 1][0] - TIER_H;
  function treeHalfWidth(v) {
    let w = -1;
    for (const [by, hw] of TIERS) {
      const ay = by - TIER_H;
      if (v <= by + 6 && v >= ay) w = Math.max(w, (hw * (v - ay)) / TIER_H);
    }
    return w;
  }
  // ornaments that can hang on the tree, and how they sit on it
  const ON_TREE = {
    redBauble: 'ball',
    goldBauble: 'ball',
    blueBauble: 'ball',
    silverBauble: 'ball',
    candy: 'thing',
    bells: 'thing',
    bow: 'thing',
    gingerbread: 'thing',
    holly: 'thing',
    candle: 'thing',
    star: 'top',
    treeLights: 'garland',
    tinsel: 'garland'
  };
  const ORN_SCALE = 0.62; // ornaments are drawn this size relative to the tree
  // a decorated look for trees saved before ornaments existed
  const LEGACY_ORN = [{ k: 'treeLights' }, { k: 'star' }];

  function garlandPath(i, kind) {
    // swags that wrap around the tree from one side to the other, tier by tier
    const pts = [];
    const levels = [-34, -66, -98, -126, -150].slice(0, kind === 'tinsel' ? 4 : 5);
    levels.forEach((v0, j) => {
      const v = v0 + i * 9 + (kind === 'tinsel' ? 12 : 0);
      const dir = (j + i) % 2 ? 1 : -1;
      const w1 = treeHalfWidth(v) * 0.92,
        w2 = treeHalfWidth(v + 16) * 0.92;
      pts.push([[-dir * w1, v], [dir * w2, v + 16]]);
    });
    return pts;
  }
  function drawGarland(g, i, kind, t) {
    for (const [[x1, y1], [x2, y2]] of garlandPath(i, kind)) drawSwag(g, x1, y1, x2, y2, kind, t, i);
  }
  function drawSwag(g, x1, y1, x2, y2, kind, t, i = 0) {
    {
      const sag = 9;
      const at = (u) => [U.lerp(x1, x2, u), U.lerp(y1, y2, u) + Math.sin(u * Math.PI) * sag];
      if (kind === 'tinsel') {
        g.lineWidth = 3.4;
        g.lineCap = 'round';
        for (let pass = 0; pass < 2; pass++) {
          g.strokeStyle = pass ? 'rgba(255,255,255,0.55)' : i % 2 ? '#d9dde8' : '#f2c14e';
          g.beginPath();
          for (let k = 0; k <= 24; k++) {
            const [x, y] = at(k / 24);
            const wob = Math.sin(k * 2.3 + t * 2) * (pass ? 0.8 : 1.5);
            k ? g.lineTo(x, y + wob) : g.moveTo(x, y + wob);
          }
          g.lineWidth = pass ? 1 : 3.4;
          g.stroke();
        }
        return;
      }
      g.strokeStyle = 'rgba(20,40,20,0.8)';
      g.lineWidth = 0.9;
      g.beginPath();
      for (let k = 0; k <= 16; k++) {
        const [x, y] = at(k / 16);
        k ? g.lineTo(x, y) : g.moveTo(x, y);
      }
      g.stroke();
      const n = Math.max(4, Math.round(Math.abs(x2 - x1) / 9));
      for (let k = 0; k <= n; k++) {
        const [x, y] = at(k / n);
        const c = BULBS[(k + i * 2) % BULBS.length];
        const on = Math.sin(t * 2.6 + k * 1.4 + i) > -0.35;
        if (on) U.glow(g, x, y + 2, 7, c + 'aa');
        g.fillStyle = on ? c : U.shade(c, -0.5);
        g.beginPath();
        g.ellipse(x, y + 2, 1.7, 2.4, 0, 0, TAU);
        g.fill();
      }
    }
  }
  function drawTree(g, t, s, d) {
    g.save();
    g.scale(s, s);
    // skirt + trunk
    g.fillStyle = '#5b3a24';
    g.fillRect(-7, -22, 14, 22);
    const sk = g.createLinearGradient(0, -8, 0, 4);
    sk.addColorStop(0, '#c62a3c');
    sk.addColorStop(1, '#7d1222');
    g.fillStyle = sk;
    g.beginPath();
    g.ellipse(0, 0, 46, 8, 0, 0, TAU);
    g.fill();
    g.fillStyle = 'rgba(255,255,255,0.92)';
    g.beginPath();
    g.ellipse(0, 3, 50, 5, 0, 0, Math.PI);
    g.fill();
    // tiers, back to front
    TIERS.forEach(([by, hw], k) => {
      const ay = by - TIER_H;
      const gr = g.createLinearGradient(-hw, 0, hw, 0);
      gr.addColorStop(0, '#0f4a2b');
      gr.addColorStop(0.45, '#1f7d47');
      gr.addColorStop(0.7, '#2a9655');
      gr.addColorStop(1, '#14613a');
      g.fillStyle = gr;
      g.beginPath();
      g.moveTo(0, ay);
      g.quadraticCurveTo(hw * 0.35, ay + TIER_H * 0.45, hw, by);
      // scalloped bottom edge
      const n = 5 + (TIERS.length - k);
      for (let i = n; i > 0; i--) {
        const x0 = -hw + ((i - 1) / n) * hw * 2;
        const x1 = -hw + (i / n) * hw * 2;
        g.quadraticCurveTo((x0 + x1) / 2, by + 7, x0, by);
      }
      g.quadraticCurveTo(-hw * 0.35, ay + TIER_H * 0.45, 0, ay);
      g.fill();
      // needle texture
      g.strokeStyle = 'rgba(8,40,22,0.35)';
      g.lineWidth = 1;
      for (let i = 0; i < 7; i++) {
        const u = (i + 0.5) / 7;
        const x = -hw * 0.85 + u * hw * 1.7;
        g.beginPath();
        g.moveTo(x * 0.3, ay + 14);
        g.lineTo(x, by - 2);
        g.stroke();
      }
      // snow on the tips
      g.fillStyle = 'rgba(255,255,255,0.9)';
      for (let i = 0; i < n; i++) {
        const x = -hw + ((i + 0.5) / n) * hw * 2;
        if ((i + k) % 2) continue;
        g.beginPath();
        g.ellipse(x, by + 3, 5.5, 2.4, 0, 0, TAU);
        g.fill();
      }
      g.beginPath();
      g.ellipse(-hw * 0.18, ay + 10, 5, 2.2, -0.5, 0, TAU);
      g.fill();
    });
    // ornaments
    const orn = (d && d.orn) || LEGACY_ORN;
    let gl = 0,
      tn = 0;
    for (const o of orn) {
      if (o.k === 'treeLights') drawGarland(g, gl++, 'treeLights', t);
      else if (o.k === 'tinsel') drawGarland(g, tn++, 'tinsel', t);
    }
    for (const o of orn) {
      if (ON_TREE[o.k] === 'garland' || o.k === 'star') continue;
      const it = ITEMS[o.k];
      if (!it) continue;
      g.save();
      const drop = o.drop ? Math.pow(o.drop, 2) * 60 : 0;
      g.translate(o.u, o.v - drop);
      g.scale(ORN_SCALE, ORN_SCALE);
      if (ON_TREE[o.k] === 'ball') g.rotate(Math.sin(t * 1.4 + o.u) * 0.08);
      it.draw(g, t, 1, null, true);
      g.restore();
    }
    if (orn.some((o) => o.k === 'star')) {
      g.save();
      g.translate(0, TREE_TOP + 4);
      const pulse = 1 + Math.sin(t * 2) * 0.05;
      U.glow(g, 0, 0, 34 * pulse, 'rgba(255,220,110,0.75)');
      const gr = g.createRadialGradient(-3, -4, 1, 0, 0, 15);
      gr.addColorStop(0, '#fff8d0');
      gr.addColorStop(1, '#f2a91f');
      g.fillStyle = gr;
      star5(g, 15 * pulse);
      g.fill();
      g.restore();
    }
    g.restore();
  }

  const ITEMS = {
    tree: {
      label: 'Christmas tree',
      w: 132,
      h: 204,
      draw: (g, t, s, d) => drawTree(g, t, s, d)
    },
    lights: { label: 'Lights', w: 0, h: 0, string: true },
    candle: {
      label: 'Candle',
      w: 24,
      h: 60,
      draw(g, t, s) {
        g.fillStyle = '#2f6b3a';
        g.beginPath();
        g.ellipse(0, 0, 16 * s, 4 * s, 0, 0, TAU);
        g.fill();
        const gr = g.createLinearGradient(-6 * s, 0, 6 * s, 0);
        gr.addColorStop(0, '#ff5a5a');
        gr.addColorStop(1, '#a3121e');
        g.fillStyle = gr;
        g.fillRect(-6 * s, -40 * s, 12 * s, 40 * s);
        const fl = 1 + Math.sin(t * 13) * 0.12;
        U.glow(g, 0, -48 * s, 26 * s, 'rgba(255,190,90,0.55)');
        g.fillStyle = '#ffcf4d';
        g.beginPath();
        g.ellipse(0, -47 * s * fl, 3.4 * s, 7 * s * fl, 0, 0, TAU);
        g.fill();
        g.fillStyle = '#fff6d0';
        g.beginPath();
        g.ellipse(0, -45 * s, 1.4 * s, 3 * s, 0, 0, TAU);
        g.fill();
      }
    },
    treeLights: { label: 'Tree lights', w: 40, h: 30, draw: (g, t, s) => drawSwag(g, -18 * s, -22 * s, 18 * s, -18 * s, 'treeLights', t) },
    tinsel: { label: 'Tinsel', w: 40, h: 30, draw: (g, t, s) => drawSwag(g, -18 * s, -22 * s, 18 * s, -18 * s, 'tinsel', t) },
    redBauble: { label: 'Red bauble', w: 30, h: 60, hang: true, draw: (g, t, s, d, onTree) => bauble(g, '#e2293f', t, s, onTree) },
    goldBauble: { label: 'Gold bauble', w: 30, h: 60, hang: true, draw: (g, t, s, d, onTree) => bauble(g, '#f2b73a', t, s, onTree) },
    blueBauble: { label: 'Blue bauble', w: 30, h: 60, hang: true, draw: (g, t, s, d, onTree) => bauble(g, '#2f7bf0', t, s, onTree) },
    silverBauble: { label: 'Silver bauble', w: 30, h: 60, hang: true, draw: (g, t, s, d, onTree) => bauble(g, '#c9d1e0', t, s, onTree) },
    bow: {
      label: 'Bow',
      w: 40,
      h: 34,
      draw(g, t, s) {
        g.translate(0, -12 * s);
        g.fillStyle = '#d42f3f';
        g.beginPath();
        g.ellipse(-9 * s, 0, 10 * s, 6 * s, -0.4, 0, TAU);
        g.ellipse(9 * s, 0, 10 * s, 6 * s, 0.4, 0, TAU);
        g.fill();
        g.beginPath();
        g.moveTo(-2 * s, 2 * s);
        g.lineTo(-9 * s, 15 * s);
        g.lineTo(-4 * s, 14 * s);
        g.lineTo(0, 4 * s);
        g.lineTo(4 * s, 14 * s);
        g.lineTo(9 * s, 15 * s);
        g.lineTo(2 * s, 2 * s);
        g.fill();
        g.fillStyle = '#9e1525';
        g.beginPath();
        g.arc(0, 0, 3.6 * s, 0, TAU);
        g.fill();
      }
    },
    star: {
      label: 'Star',
      w: 50,
      h: 50,
      draw(g, t, s) {
        g.translate(0, -24 * s);
        g.rotate(Math.sin(t) * 0.05);
        U.glow(g, 0, 0, 40 * s, 'rgba(255,220,100,0.5)');
        const gr = g.createRadialGradient(-5 * s, -6 * s, 1, 0, 0, 22 * s);
        gr.addColorStop(0, '#fff6c2');
        gr.addColorStop(1, '#f2a91f');
        g.fillStyle = gr;
        star5(g, 22 * s);
        g.fill();
      }
    },
    wreath: {
      label: 'Wreath',
      w: 70,
      h: 70,
      draw(g, t, s) {
        g.translate(0, -34 * s);
        for (let i = 0; i < 26; i++) {
          const a = (i / 26) * TAU;
          g.fillStyle = i % 2 ? '#1f7a44' : '#2f9a55';
          g.beginPath();
          g.ellipse(Math.cos(a) * 24 * s, Math.sin(a) * 24 * s, 9 * s, 5 * s, a + 0.6, 0, TAU);
          g.fill();
        }
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * TAU + 0.3;
          g.fillStyle = '#e2293f';
          g.beginPath();
          g.arc(Math.cos(a) * 25 * s, Math.sin(a) * 25 * s, 3 * s, 0, TAU);
          g.fill();
        }
        g.fillStyle = '#d42f3f';
        g.beginPath();
        g.moveTo(0, 24 * s);
        g.lineTo(-14 * s, 16 * s);
        g.lineTo(-14 * s, 32 * s);
        g.closePath();
        g.moveTo(0, 24 * s);
        g.lineTo(14 * s, 16 * s);
        g.lineTo(14 * s, 32 * s);
        g.closePath();
        g.fill();
        g.fillRect(-4 * s, 24 * s, 3 * s, 16 * s);
        g.fillRect(1 * s, 24 * s, 3 * s, 14 * s);
      }
    },
    stocking: {
      label: 'Stocking',
      w: 40,
      h: 60,
      draw(g, t, s) {
        g.rotate(Math.sin(t * 1.2) * 0.04);
        g.fillStyle = '#d42f3f';
        g.beginPath();
        g.moveTo(-10 * s, -50 * s);
        g.lineTo(8 * s, -50 * s);
        g.lineTo(8 * s, -16 * s);
        g.quadraticCurveTo(22 * s, -12 * s, 18 * s, -2 * s);
        g.quadraticCurveTo(10 * s, 4 * s, -6 * s, -2 * s);
        g.quadraticCurveTo(-12 * s, -6 * s, -10 * s, -16 * s);
        g.closePath();
        g.fill();
        g.fillStyle = '#fff';
        U.rrect(g, -13 * s, -58 * s, 24 * s, 10 * s, 4 * s);
        g.fill();
        g.fillStyle = '#2f9a55';
        for (let i = 0; i < 3; i++) g.fillRect(-8 * s, (-40 + i * 9) * s, 14 * s, 2.5 * s);
      }
    },
    candy: {
      label: 'Candy cane',
      w: 30,
      h: 60,
      draw(g, t, s) {
        g.lineCap = 'round';
        g.lineWidth = 7 * s;
        g.strokeStyle = '#fff';
        g.beginPath();
        g.moveTo(4 * s, 0);
        g.lineTo(4 * s, -40 * s);
        g.arc(-5 * s, -40 * s, 9 * s, 0, Math.PI, true);
        g.stroke();
        g.strokeStyle = '#e2293f';
        g.setLineDash([5 * s, 5 * s]);
        g.stroke();
        g.setLineDash([]);
      }
    },
    gift: {
      label: 'Gift',
      w: 56,
      h: 48,
      draw(g, t, s) {
        const box = (x, w, h, c, r) => {
          g.fillStyle = c;
          g.fillRect(x - w / 2, -h, w, h);
          g.fillStyle = 'rgba(0,0,0,0.15)';
          g.fillRect(x - w / 2, -h * 0.5, w, h * 0.5);
          g.fillStyle = r;
          g.fillRect(x - w * 0.08, -h, w * 0.16, h);
          g.beginPath();
          g.ellipse(x - w * 0.15, -h - 4 * s, w * 0.16, w * 0.1, -0.5, 0, TAU);
          g.ellipse(x + w * 0.15, -h - 4 * s, w * 0.16, w * 0.1, 0.5, 0, TAU);
          g.fill();
        };
        box(-8 * s, 34 * s, 32 * s, '#e2293f', '#ffd34d');
        box(16 * s, 24 * s, 20 * s, '#2f9a55', '#ffffff');
      }
    },
    bells: {
      label: 'Bells',
      w: 50,
      h: 50,
      draw(g, t, s) {
        g.translate(0, -18 * s);
        [-1, 1].forEach((d, i) => {
          g.save();
          g.translate(d * 9 * s, 0);
          g.rotate(d * 0.25 + Math.sin(t * 4 + i) * 0.12);
          const gr = g.createLinearGradient(-10 * s, 0, 10 * s, 0);
          gr.addColorStop(0, '#ffe58a');
          gr.addColorStop(1, '#c98a12');
          g.fillStyle = gr;
          g.beginPath();
          g.moveTo(-3 * s, -14 * s);
          g.quadraticCurveTo(-10 * s, -10 * s, -10 * s, 6 * s);
          g.lineTo(-13 * s, 10 * s);
          g.lineTo(13 * s, 10 * s);
          g.lineTo(10 * s, 6 * s);
          g.quadraticCurveTo(10 * s, -10 * s, 3 * s, -14 * s);
          g.fill();
          g.fillStyle = '#9a6a0a';
          g.beginPath();
          g.arc(0, 12 * s, 3 * s, 0, TAU);
          g.fill();
          g.restore();
        });
        g.fillStyle = '#d42f3f';
        g.beginPath();
        g.ellipse(-7 * s, -16 * s, 7 * s, 4 * s, -0.4, 0, TAU);
        g.ellipse(7 * s, -16 * s, 7 * s, 4 * s, 0.4, 0, TAU);
        g.fill();
      }
    },
    gingerbread: {
      label: 'Gingerbread',
      w: 44,
      h: 56,
      draw(g, t, s) {
        g.fillStyle = '#b8743a';
        g.beginPath();
        g.arc(0, -44 * s, 10 * s, 0, TAU);
        g.fill();
        U.rrect(g, -10 * s, -36 * s, 20 * s, 24 * s, 6 * s);
        g.fill();
        g.lineCap = 'round';
        g.strokeStyle = '#b8743a';
        g.lineWidth = 8 * s;
        g.beginPath();
        g.moveTo(-8 * s, -30 * s);
        g.lineTo(-18 * s, -22 * s + Math.sin(t * 3) * 3 * s);
        g.moveTo(8 * s, -30 * s);
        g.lineTo(18 * s, -22 * s);
        g.moveTo(-5 * s, -14 * s);
        g.lineTo(-9 * s, -2 * s);
        g.moveTo(5 * s, -14 * s);
        g.lineTo(9 * s, -2 * s);
        g.stroke();
        g.fillStyle = '#fff';
        [-3.5, 3.5].forEach((x) => {
          g.beginPath();
          g.arc(x * s, -46 * s, 1.6 * s, 0, TAU);
          g.fill();
        });
        g.strokeStyle = '#fff';
        g.lineWidth = 1.4 * s;
        g.beginPath();
        g.arc(0, -43 * s, 4 * s, 0.3, Math.PI - 0.3);
        g.stroke();
        ['#e2293f', '#2f9a55', '#e2293f'].forEach((c, i) => {
          g.fillStyle = c;
          g.beginPath();
          g.arc(0, (-31 + i * 6) * s, 2 * s, 0, TAU);
          g.fill();
        });
      }
    },
    holly: {
      label: 'Holly',
      w: 50,
      h: 34,
      draw(g, t, s) {
        g.translate(0, -14 * s);
        [-0.5, 0.5].forEach((a) => {
          g.save();
          g.rotate(a);
          g.fillStyle = '#1f7a44';
          g.beginPath();
          g.moveTo(0, 0);
          for (let i = 0; i <= 6; i++) g.lineTo(i * 4 * s * (a < 0 ? -1 : 1), (i % 2 ? -7 : -3) * s);
          for (let i = 6; i >= 0; i--) g.lineTo(i * 4 * s * (a < 0 ? -1 : 1), (i % 2 ? 4 : 1) * s);
          g.fill();
          g.restore();
        });
        [
          [-3, -2],
          [3, -2],
          [0, 3]
        ].forEach(([x, y]) => {
          g.fillStyle = '#e2293f';
          g.beginPath();
          g.arc(x * s, y * s, 3.6 * s, 0, TAU);
          g.fill();
          g.fillStyle = 'rgba(255,255,255,0.6)';
          g.beginPath();
          g.arc((x - 1) * s, (y - 1) * s, 1 * s, 0, TAU);
          g.fill();
        });
      }
    },
    santaHat: {
      label: 'Santa hat',
      w: 50,
      h: 44,
      draw(g, t, s) {
        g.fillStyle = '#d42f3f';
        g.beginPath();
        g.moveTo(-20 * s, -8 * s);
        g.quadraticCurveTo(-4 * s, -46 * s, 24 * s, -26 * s);
        g.quadraticCurveTo(6 * s, -26 * s, 20 * s, -8 * s);
        g.fill();
        g.fillStyle = '#fff';
        U.rrect(g, -24 * s, -12 * s, 48 * s, 12 * s, 6 * s);
        g.fill();
        g.beginPath();
        g.arc(25 * s, -25 * s, 6 * s, 0, TAU);
        g.fill();
      }
    },
    globe: {
      label: 'Snow globe',
      w: 50,
      h: 60,
      draw(g, t, s) {
        g.fillStyle = '#6b3d22';
        g.beginPath();
        g.moveTo(-20 * s, 0);
        g.lineTo(20 * s, 0);
        g.lineTo(16 * s, -12 * s);
        g.lineTo(-16 * s, -12 * s);
        g.fill();
        g.save();
        g.beginPath();
        g.arc(0, -32 * s, 21 * s, 0, TAU);
        g.clip();
        const gr = g.createLinearGradient(0, -54 * s, 0, -12 * s);
        gr.addColorStop(0, '#9fd2ff');
        gr.addColorStop(1, '#e8f4ff');
        g.fillStyle = gr;
        g.fillRect(-22 * s, -54 * s, 44 * s, 44 * s);
        g.fillStyle = '#fff';
        g.beginPath();
        g.ellipse(0, -14 * s, 22 * s, 8 * s, 0, 0, TAU);
        g.fill();
        g.fillStyle = '#228c4c';
        g.beginPath();
        g.moveTo(-8 * s, -18 * s);
        g.lineTo(0, -40 * s);
        g.lineTo(8 * s, -18 * s);
        g.fill();
        g.fillStyle = '#fff';
        for (let i = 0; i < 14; i++) {
          const x = Math.sin(i * 7.1 + t * 0.6) * 17 * s;
          const y = -52 * s + (((i * 13 + t * 9) % 38) * s);
          g.fillRect(x, y, 1.6 * s, 1.6 * s);
        }
        g.restore();
        g.strokeStyle = 'rgba(255,255,255,0.7)';
        g.lineWidth = 1.5 * s;
        g.beginPath();
        g.arc(0, -32 * s, 21 * s, 0, TAU);
        g.stroke();
        g.beginPath();
        g.arc(0, -32 * s, 15 * s, Math.PI * 1.1, Math.PI * 1.4);
        g.stroke();
      }
    },
    cocoa: {
      label: 'Cocoa',
      w: 40,
      h: 50,
      draw(g, t, s) {
        g.fillStyle = '#f2ecff';
        U.rrect(g, -13 * s, -28 * s, 26 * s, 28 * s, 5 * s);
        g.fill();
        g.strokeStyle = '#f2ecff';
        g.lineWidth = 4 * s;
        g.beginPath();
        g.arc(14 * s, -14 * s, 7 * s, -Math.PI / 2, Math.PI / 2);
        g.stroke();
        g.fillStyle = '#d42f3f';
        g.fillRect(-13 * s, -18 * s, 26 * s, 6 * s);
        g.fillStyle = '#6b3d22';
        g.beginPath();
        g.ellipse(0, -28 * s, 12 * s, 3 * s, 0, 0, TAU);
        g.fill();
        g.fillStyle = '#fff';
        [-4, 3].forEach((x) => {
          g.beginPath();
          g.arc(x * s, -29 * s, 3 * s, 0, TAU);
          g.fill();
        });
        g.strokeStyle = 'rgba(255,255,255,0.6)';
        g.lineWidth = 1.5 * s;
        for (let i = 0; i < 3; i++) {
          g.beginPath();
          g.moveTo((-5 + i * 5) * s, -34 * s);
          g.bezierCurveTo((-9 + i * 5 + Math.sin(t * 2 + i) * 3) * s, -40 * s, (-1 + i * 5) * s, -44 * s, (-5 + i * 5 + Math.sin(t * 2 + i) * 3) * s, -52 * s);
          g.stroke();
        }
      }
    },
    snowman: {
      label: 'Snowman',
      w: 50,
      h: 90,
      draw(g, t, s) {
        const W = DD.themes.winter;
        if (W && W.drawSnowman) W.drawSnowman(g, 0, 0, 0.9 * s, { hat: 'top', face: 'happy', body: 'waving', clothes: 'scarf' }, { t });
      }
    }
  };
  const FREE = ['tree', 'treeLights', 'redBauble', 'blueBauble', 'star', 'lights', 'wreath', 'candle'];

  function drawLights(g, d, t, editing) {
    const x1 = d.x,
      y1 = d.y,
      x2 = d.x2,
      y2 = d.y2;
    const len = Math.hypot(x2 - x1, y2 - y1);
    const sag = Math.min(70, len * 0.18);
    const pt = (u) => {
      const x = U.lerp(x1, x2, u);
      const y = U.lerp(y1, y2, u) + Math.sin(u * Math.PI) * sag;
      return [x, y];
    };
    g.strokeStyle = '#1d2a1f';
    g.lineWidth = 1.6;
    g.beginPath();
    for (let i = 0; i <= 30; i++) {
      const [x, y] = pt(i / 30);
      i ? g.lineTo(x, y) : g.moveTo(x, y);
    }
    g.stroke();
    const n = Math.max(3, Math.round(len / 26));
    for (let i = 0; i <= n; i++) {
      const u = i / n;
      const [x, y] = pt(u);
      const c = BULBS[i % BULBS.length];
      const on = Math.sin(t * 2.4 + i * 1.3) > -0.4;
      if (on) U.glow(g, x, y + 5, 14, c + 'aa');
      g.fillStyle = '#333';
      g.fillRect(x - 2, y - 1, 4, 3);
      g.fillStyle = on ? c : U.shade(c, -0.5);
      g.beginPath();
      g.ellipse(x, y + 5, 3.4, 5, 0, 0, TAU);
      g.fill();
    }
    if (editing) {
      for (const [x, y] of [
        [x1, y1],
        [x2, y2]
      ]) {
        g.fillStyle = '#fff';
        g.strokeStyle = 'rgba(0,0,0,0.4)';
        g.lineWidth = 1.5;
        g.beginPath();
        g.arc(x, y, 6, 0, TAU);
        g.fill();
        g.stroke();
      }
    }
  }

  function drawOne(g, d, t, editing) {
    if (d.k === 'lights') return drawLights(g, d, t, editing);
    const it = ITEMS[d.k];
    if (!it) return;
    g.save();
    g.translate(d.x, d.y);
    if (it.hang) g.rotate(Math.sin(t * 1.3 + d.x) * 0.06);
    it.draw(g, t, d.s || 1, d);
    g.restore();
  }

  DD.decor = {
    ITEMS,
    FREE,
    drawAll(g, list, t) {
      if (!Array.isArray(list)) return;
      for (const d of list) drawOne(g, d, t, false);
    },

    /* ---------------- editor (in the overlay) ---------------- */
    editor(env) {
      const st = env.stage;
      let list = (env.state.settings.decorations || []).map((d) => Object.assign({}, d));
      let hover = null;
      const save = () => env.api.saveDecorations && env.api.saveDecorations(list);
      const bounds = (d) => {
        const it = ITEMS[d.k];
        const s = d.s || 1;
        return { x0: d.x - (it.w / 2) * s, x1: d.x + (it.w / 2) * s, y0: d.y - it.h * s, y1: d.y + 4 };
      };
      /* ---- trees and their ornaments ---- */
      const trees = () => list.filter((d) => d.k === 'tree');
      const ensureOrn = (tr) => (tr.orn = tr.orn || LEGACY_ORN.map((o) => Object.assign({}, o)));
      // which tree (front-most) is under a point, in that tree's own units
      function treeAt(x, y, margin = 6) {
        const ts = trees();
        for (let i = ts.length - 1; i >= 0; i--) {
          const tr = ts[i];
          const s = tr.s || 1;
          const u = (x - tr.x) / s,
            v = (y - tr.y) / s;
          const hw = treeHalfWidth(v);
          if (v >= TREE_TOP - 10 && v <= -10 && hw > 0 && Math.abs(u) <= hw + margin) return { tr, u, v };
        }
        return null;
      }
      function freeSpot(tr) {
        // a spot on the branches that isn't crowded
        const orn = ensureOrn(tr).filter((o) => o.u !== undefined);
        let best = null,
          bestD = -1;
        for (let k = 0; k < 40; k++) {
          const v = U.rand(TREE_TOP + 40, -30);
          const hw = treeHalfWidth(v) * 0.82;
          if (hw <= 4) continue;
          const u = U.rand(-hw, hw);
          let dmin = 1e9;
          for (const o of orn) dmin = Math.min(dmin, Math.hypot(o.u - u, o.v - v));
          if (dmin > bestD) {
            bestD = dmin;
            best = { u, v };
          }
        }
        return best || { u: 0, v: -60 };
      }
      function sparkleAt(x, y) {
        if (!env.particles) return;
        env.particles.burst(x, y, 12, () => ({
          vx: U.rand(-110, 110),
          vy: U.rand(-140, 20),
          drag: 3,
          life: U.rand(0.5, 0.9),
          shrink: true,
          draw: DD.paint.star(U.pick(['#fff6c2', '#ffd56b', '#bfe0ff']), U.rand(2.5, 5))
        }));
      }
      // put an ornament on a tree; returns true if it went on
      function hangOn(tr, kind, u, v) {
        const how = ON_TREE[kind];
        if (!how) return false;
        const orn = ensureOrn(tr);
        const s = tr.s || 1;
        if (how === 'top') {
          if (!orn.some((o) => o.k === 'star')) orn.push({ k: 'star' });
          sparkleAt(tr.x, tr.y + TREE_TOP * s);
        } else if (how === 'garland') {
          if (orn.filter((o) => o.k === kind).length >= 3) {
            DD.toast('That tree is fully wrapped ✨', 1800);
            return true;
          }
          orn.push({ k: kind });
          sparkleAt(tr.x, tr.y - 90 * s);
        } else {
          if (orn.filter((o) => o.u !== undefined).length >= 40) {
            DD.toast('The tree is full!', 1800);
            return false;
          }
          if (u === undefined) ({ u, v } = freeSpot(tr));
          const hw = treeHalfWidth(v) * 0.9;
          orn.push({ k: kind, u: U.clamp(u, -hw, hw), v: U.clamp(v, TREE_TOP + 30, -26), drop: 1 });
          sparkleAt(tr.x + u * s, tr.y + v * s);
        }
        DD.sound.play('chime');
        return true;
      }
      // ornament handles on trees (drawn in tree units)
      function ornAt(x, y) {
        const ts = trees();
        for (let i = ts.length - 1; i >= 0; i--) {
          const tr = ts[i];
          const s = tr.s || 1;
          const orn = tr.orn || [];
          for (let j = orn.length - 1; j >= 0; j--) {
            const o = orn[j];
            let ox, oy;
            if (o.k === 'star') {
              ox = tr.x;
              oy = tr.y + (TREE_TOP + 4) * s;
            } else if (o.u !== undefined) {
              ox = tr.x + o.u * s;
              oy = tr.y + (o.v - 4) * s;
            } else continue;
            if (U.dist(x, y, ox, oy) < Math.max(10, 9 * s)) return { tr, o };
          }
        }
        return null;
      }

      const closeBtn = (d) => {
        if (d.k === 'lights') return { x: (d.x + d.x2) / 2, y: Math.min(d.y, d.y2) - 16 };
        const b = bounds(d);
        return { x: b.x1 + 4, y: b.y0 - 4 };
      };

      function makeHandle(d, which) {
        // which: 'body' | 'a' | 'b' | 'close'
        const h = { kind: 'decor', d, which };
        let ox = 0,
          oy = 0;
        h.onPress = (px, py) => {
          ox = px - (which === 'b' ? d.x2 : d.x);
          oy = py - (which === 'b' ? d.y2 : d.y);
        };
        h.onDrag = (px, py) => {
          if (which === 'body' && d.k === 'lights') {
            const dx = px - ox - d.x,
              dy = py - oy - d.y;
            d.x += dx;
            d.y += dy;
            d.x2 += dx;
            d.y2 += dy;
          } else if (which === 'b') {
            d.x2 = px - ox;
            d.y2 = py - oy;
          } else {
            d.x = px - ox;
            d.y = py - oy;
          }
        };
        h.onRelease = () => {
          if (which === 'body' && ON_TREE[d.k] && d.k !== 'tree') {
            const hit = treeAt(d.x, d.y - 4);
            if (hit && hangOn(hit.tr, d.k, hit.u, hit.v)) {
              list.splice(list.indexOf(d), 1);
              hover = null;
            } else DD.sound.play('pop');
          } else DD.sound.play('pop');
          save();
        };
        h.onClick = () => {
          if (which === 'close') {
            list.splice(list.indexOf(d), 1);
            save();
            DD.sound.play('pop');
            hover = null;
          } else if (which === 'body' && ITEMS[d.k].hang) DD.sound.play('chime');
        };
        h.onDblClick = () => {
          if (d.k === 'tree') {
            d.s = (d.s || 1) >= 3.1 ? 1.4 : Math.round(((d.s || 1) + 0.4) * 10) / 10;
            save();
          } else if (d.k !== 'lights') {
            d.s = (d.s || 1) >= 1.6 ? 0.8 : (d.s || 1) + 0.2;
            save();
          }
        };
        return h;
      }

      function ornOverFree(x, y) {
        for (const d of list) {
          if (d.k === 'tree' || d.k === 'lights') continue;
          const b = bounds(d);
          if (x > b.x0 && x < b.x1 && y > b.y0 && y < b.y1) return true;
        }
        return false;
      }
      function makeOrnHandle(tr, o) {
        const h = { kind: 'decor', d: tr, which: 'orn' };
        let free = null;
        h.onDrag = (px, py) => {
          if (!free) {
            // pull it off the tree
            const orn = tr.orn || [];
            orn.splice(orn.indexOf(o), 1);
            free = { id: Date.now(), k: o.k, x: px, y: py, s: 1 };
            list.push(free);
            DD.sound.play('pop');
          }
          free.x = px;
          free.y = py + 6;
        };
        h.onRelease = () => {
          if (!free) return;
          const hit = treeAt(free.x, free.y - 4);
          if (hit && hangOn(hit.tr, free.k, hit.u, hit.v)) list.splice(list.indexOf(free), 1);
          save();
        };
        h.onClick = () => {
          DD.sound.play('chime');
          sparkleAt(o.u !== undefined ? tr.x + o.u * (tr.s || 1) : tr.x, o.u !== undefined ? tr.y + o.v * (tr.s || 1) : tr.y + TREE_TOP * (tr.s || 1));
        };
        h.onDblClick = () => {
          const orn = tr.orn || [];
          orn.splice(orn.indexOf(o), 1);
          DD.sound.play('pop');
          save();
        };
        return h;
      }

      function add(kind) {
        const W = st.w,
          G = env.ground;
        const n = list.length;
        let d;
        const ts = trees();
        if (ON_TREE[kind] && kind !== 'candle' && (ts.length || ON_TREE[kind] === 'garland')) {
          // with a tree on the desktop, ornaments go straight onto it
          let tr = ts[ts.length - 1];
          if (!tr) {
            add('tree');
            tr = trees()[0];
          }
          if (hangOn(tr, kind)) {
            save();
            return;
          }
        }
        if (kind === 'lights') {
          const y = st.h * 0.3 + (n % 4) * 40;
          d = { id: Date.now(), k: 'lights', x: W * 0.32, y, x2: W * 0.68, y2: y };
        } else if (kind === 'tree') {
          // big, off to one side so it isn't hidden behind the Dock
          const side = trees().length % 2 ? 0.86 : 0.14;
          const ts = U.clamp((st.h * 0.5) / -TREE_TOP, 1.4, 3);
          d = { id: Date.now(), k: 'tree', x: U.clamp(W * (side + U.rand(-0.03, 0.03)), 74 * ts, W - 74 * ts), y: G - 4, s: ts, orn: [{ k: 'treeLights' }, { k: 'star' }] };
          const w = env.state.settings.weather || {};
          if (window.DD_CATALOG.resolveWeather(w.type, env.state.theme) === 'off' && env.api.setSetting)
            env.api.setSetting('weather', Object.assign({}, w, { type: 'snow' }));
        } else d = { id: Date.now(), k: kind, x: W * (0.3 + Math.random() * 0.4), y: st.h * (0.35 + Math.random() * 0.3), s: 1.2 };
        d.drop = 1;
        list.push(d);
        save();
        DD.sound.play('pop');
      }

      function openPanel() {
        DD.panel.open({
          title: 'Deck your screen.',
          x: st.w - 360,
          y: Math.min(st.h - 40, 120 + 420),
          tabs: [
            {
              id: 'all',
              label: 'Pick something and it lands on your desktop, behind your windows',
              items: Object.entries(ITEMS).map(([id, it]) => ({
                id,
                label: it.label,
                pro: !FREE.includes(id),
                draw: (g, s) => {
                  if (id === 'lights') {
                    drawLights(g, { x: 4, y: 14, x2: s - 4, y2: 14 }, 1, false);
                    return;
                  }
                  const k = Math.min(1, (s - 6) / Math.max(it.w, it.h));
                  g.translate(s / 2, s - 4 - (it.hang ? 10 : 0));
                  g.scale(k, k);
                  it.draw(g, 1, 1);
                }
              }))
            }
          ],
          getSelected: () => null,
          isLocked: (item) => item.pro && !env.pro,
          onLocked: (item) => env.upsell(`The ${item.label.toLowerCase()}`),
          onSelect: (_tab, id) => add(id),
          footer: () => `<span style="flex:1">Drop ornaments on the tree · drag them off · double-click to resize</span><button class="dd-btn" data-act="clear">Remove all</button><button class="dd-btn gold" data-act="done">Done</button>`,
          onFooter: (act) => {
            if (act === 'clear') {
              list = [];
              save();
            }
            if (act === 'done') finish();
          },
          onClose: () => finish()
        });
        const tabs = document.querySelector('.dd-panel .dd-tabs');
        if (tabs) tabs.classList.add('dd-subtitle');
        document.querySelector('.dd-panel').classList.add('dd-tall');
      }
      let done = false;
      function finish() {
        if (done) return;
        done = true;
        save();
        env.api.setDecorating && env.api.setDecorating(false);
      }
      setTimeout(openPanel, 50);

      return {
        pick(x, y) {
          const oh = ornAt(x, y);
          if (oh && !ornOverFree(x, y)) return makeOrnHandle(oh.tr, oh.o);
          for (let i = list.length - 1; i >= 0; i--) {
            const d = list[i];
            const c = closeBtn(d);
            if (hover === d && U.dist(x, y, c.x, c.y) < 10) return makeHandle(d, 'close');
            if (d.k === 'lights') {
              if (U.dist(x, y, d.x, d.y) < 10) return makeHandle(d, 'a');
              if (U.dist(x, y, d.x2, d.y2) < 10) return makeHandle(d, 'b');
              // near the string
              for (let k = 0; k <= 20; k++) {
                const u = k / 20;
                const len = Math.hypot(d.x2 - d.x, d.y2 - d.y);
                const px = U.lerp(d.x, d.x2, u),
                  py = U.lerp(d.y, d.y2, u) + Math.sin(u * Math.PI) * Math.min(70, len * 0.18);
                if (U.dist(x, y, px, py + 4) < 12) return makeHandle(d, 'body');
              }
            } else {
              const b = bounds(d);
              if (x > b.x0 && x < b.x1 && y > b.y0 && y < b.y1) return makeHandle(d, 'body');
            }
          }
          return null;
        },
        pointermove(x, y) {
          const h = this.pick(x, y);
          if (h) hover = h.d;
          else if (hover) {
            const c = closeBtn(hover);
            if (U.dist(x, y, c.x, c.y) > 16) hover = null;
          }
        },
        frame(dt, t) {
          const g = st.ctx;
          // dim backdrop so it is obvious you're in decorating mode
          g.fillStyle = 'rgba(10,10,30,0.08)';
          g.fillRect(0, 0, st.w, st.h);
          for (const d of list) {
            if (d.orn) for (const o of d.orn) if (o.drop) o.drop = Math.max(0, o.drop - dt * 3);
            if (d.drop) {
              d.drop = Math.max(0, d.drop - dt * 3);
              g.save();
              g.translate(0, -Math.pow(d.drop, 2) * 120);
              drawOne(g, d, t, true);
              g.restore();
            } else drawOne(g, d, t, true);
            if (d === hover) {
              const c = closeBtn(d);
              g.fillStyle = 'rgba(30,30,40,0.85)';
              g.beginPath();
              g.arc(c.x, c.y, 9, 0, TAU);
              g.fill();
              g.strokeStyle = '#fff';
              g.lineWidth = 1.8;
              g.beginPath();
              g.moveTo(c.x - 3.5, c.y - 3.5);
              g.lineTo(c.x + 3.5, c.y + 3.5);
              g.moveTo(c.x + 3.5, c.y - 3.5);
              g.lineTo(c.x - 3.5, c.y + 3.5);
              g.stroke();
            }
          }
        }
      };
    }
  };
})();
