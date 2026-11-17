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
  function bauble(g, color, t, s) {
    g.strokeStyle = 'rgba(220,220,230,0.8)';
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(0, -40 * s);
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

  const ITEMS = {
    tree: {
      label: 'Christmas tree',
      w: 90,
      h: 130,
      draw(g, t, s) {
        g.fillStyle = '#5a3a22';
        g.fillRect(-7 * s, -14 * s, 14 * s, 14 * s);
        const tiers = 4;
        for (let k = 0; k < tiers; k++) {
          const y = -14 * s - k * 26 * s;
          const w = (44 - k * 9) * s;
          g.fillStyle = k % 2 ? '#1f7a44' : '#228c4c';
          g.beginPath();
          g.moveTo(-w, y);
          g.lineTo(0, y - 44 * s);
          g.lineTo(w, y);
          g.closePath();
          g.fill();
          g.fillStyle = 'rgba(255,255,255,0.85)';
          g.beginPath();
          g.moveTo(-w * 0.55, y - 20 * s);
          g.lineTo(0, y - 44 * s);
          g.lineTo(w * 0.4, y - 24 * s);
          g.quadraticCurveTo(0, y - 28 * s, -w * 0.55, y - 20 * s);
          g.fill();
        }
        for (let i = 0; i < 16; i++) {
          const k = (i * 37) % 100 / 100;
          const y = -18 * s - k * 100 * s;
          const half = (44 - k * 36) * s * 0.8;
          const x = (((i * 53) % 100) / 50 - 1) * half;
          const on = Math.sin(t * 3 + i * 1.7) > -0.2;
          const c = BULBS[i % BULBS.length];
          if (on) U.glow(g, x, y, 8 * s, c + '99');
          g.fillStyle = on ? c : U.shade(c, -0.5);
          g.beginPath();
          g.arc(x, y, 2.6 * s, 0, TAU);
          g.fill();
        }
        g.save();
        g.translate(0, -130 * s);
        U.glow(g, 0, 0, 22 * s, 'rgba(255,220,100,0.7)');
        g.fillStyle = '#ffd34d';
        star5(g, 10 * s);
        g.fill();
        g.restore();
        // snow mound
        g.fillStyle = 'rgba(255,255,255,0.95)';
        g.beginPath();
        g.ellipse(0, 0, 40 * s, 7 * s, 0, Math.PI, 0);
        g.fill();
      }
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
    redBauble: { label: 'Red bauble', w: 30, h: 60, hang: true, draw: (g, t, s) => bauble(g, '#e2293f', t, s) },
    goldBauble: { label: 'Gold bauble', w: 30, h: 60, hang: true, draw: (g, t, s) => bauble(g, '#f2b73a', t, s) },
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
  const FREE = ['tree', 'lights', 'redBauble', 'star', 'wreath', 'candle'];

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
    it.draw(g, t, d.s || 1);
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
          save();
          DD.sound.play('pop');
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
          if (d.k !== 'lights') {
            d.s = (d.s || 1) >= 1.6 ? 0.8 : (d.s || 1) + 0.2;
            save();
          }
        };
        return h;
      }

      function add(kind) {
        const W = st.w,
          G = env.ground;
        const n = list.length;
        let d;
        if (kind === 'lights') {
          const y = st.h * 0.3 + (n % 4) * 40;
          d = { id: Date.now(), k: 'lights', x: W * 0.32, y, x2: W * 0.68, y2: y };
        } else if (kind === 'tree') {
          d = { id: Date.now(), k: 'tree', x: W * (0.2 + Math.random() * 0.6), y: G - 4, s: 1.2 };
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
          footer: () => `<span style="flex:1">Drag · pull light ends · double-click to resize</span><button class="dd-btn" data-act="clear">Remove all</button><button class="dd-btn gold" data-act="done">Done</button>`,
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
