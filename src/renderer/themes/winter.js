/* Snowy Village – moonlit village wallpaper + snowballs and snowmen on the Dock, plus Santa's sleigh. */
(function () {
  const DD = window.DD;
  const U = DD.util;
  const TAU = Math.PI * 2;

  /* ================================================================== snowman art */
  const ITEMS = {
    hat: [
      { id: 'none', label: 'None' },
      { id: 'top', label: 'Top hat' },
      { id: 'beanie', label: 'Beanie' },
      { id: 'earmuffs', label: 'Earmuffs' },
      { id: 'santa', label: 'Santa', pro: true },
      { id: 'crown', label: 'Crown', pro: true },
      { id: 'party', label: 'Party', pro: true },
      { id: 'antlers', label: 'Antlers', pro: true }
    ],
    face: [
      { id: 'classic', label: 'Classic' },
      { id: 'happy', label: 'Happy' },
      { id: 'wink', label: 'Wink' },
      { id: 'surprised', label: 'Surprised' },
      { id: 'cool', label: 'Cool', pro: true },
      { id: 'sleepy', label: 'Sleepy', pro: true },
      { id: 'grumpy', label: 'Grumpy', pro: true },
      { id: 'love', label: 'In love', pro: true }
    ],
    body: [
      { id: 'sticks', label: 'Sticks' },
      { id: 'waving', label: 'Waving' },
      { id: 'mittens', label: 'Mittens' },
      { id: 'broom', label: 'Broom' },
      { id: 'candy', label: 'Candy cane', pro: true },
      { id: 'cocoa', label: 'Cocoa', pro: true },
      { id: 'gift', label: 'Gift', pro: true },
      { id: 'flowers', label: 'Flowers', pro: true }
    ],
    clothes: [
      { id: 'scarf', label: 'Scarf' },
      { id: 'striped', label: 'Striped scarf' },
      { id: 'bowtie', label: 'Bow tie' },
      { id: 'tie', label: 'Tie' },
      { id: 'sweater', label: 'Sweater', pro: true },
      { id: 'puffer', label: 'Puffer', pro: true },
      { id: 'tuxedo', label: 'Tuxedo', pro: true },
      { id: 'chain', label: 'Gold chain', pro: true }
    ]
  };
  const DEFAULT_OUTFIT = { hat: 'top', face: 'classic', body: 'sticks', clothes: 'scarf' };

  function geom(s = 1) {
    const rB = 24 * s,
      rM = 17 * s,
      rH = 13 * s;
    const cyB = -rB;
    const cyM = cyB - rB - rM * 0.6;
    const cyH = cyM - rM - rH * 0.62;
    return { rB, rM, rH, cyB, cyM, cyH, top: cyH - rH };
  }

  function snowBall(g, x, y, r, rot = 0, speck = false) {
    const grd = g.createRadialGradient(x - r * 0.38, y - r * 0.42, r * 0.1, x, y, r * 1.02);
    grd.addColorStop(0, '#ffffff');
    grd.addColorStop(0.55, '#eef1ff');
    grd.addColorStop(1, '#a9b2e6');
    g.fillStyle = grd;
    g.beginPath();
    g.arc(x, y, r, 0, TAU);
    g.fill();
    g.strokeStyle = 'rgba(110,120,190,0.25)';
    g.lineWidth = 1;
    g.stroke();
    if (speck) {
      g.fillStyle = 'rgba(140,150,210,0.35)';
      for (let i = 0; i < 6; i++) {
        const a = rot + i * 1.9;
        const d = r * (0.3 + ((i * 37) % 10) / 16);
        const px = x + Math.cos(a) * d,
          py = y + Math.sin(a) * d;
        g.beginPath();
        g.arc(px, py, r * 0.07, 0, TAU);
        g.fill();
      }
    }
  }

  function coal(g, x, y, r) {
    g.fillStyle = '#1b1c2a';
    g.beginPath();
    g.arc(x, y, r, 0, TAU);
    g.fill();
    g.fillStyle = 'rgba(255,255,255,0.35)';
    g.beginPath();
    g.arc(x - r * 0.35, y - r * 0.35, r * 0.3, 0, TAU);
    g.fill();
  }

  function branch(g, x0, y0, x1, y1, w) {
    g.strokeStyle = '#5a3a22';
    g.lineCap = 'round';
    g.lineWidth = w;
    g.beginPath();
    g.moveTo(x0, y0);
    g.lineTo(x1, y1);
    const mx = x0 + (x1 - x0) * 0.62,
      my = y0 + (y1 - y0) * 0.62;
    const ang = Math.atan2(y1 - y0, x1 - x0);
    const side = x1 > x0 ? -1 : 1;
    g.moveTo(mx, my);
    g.lineTo(mx + Math.cos(ang + side * 0.8) * w * 4, my + Math.sin(ang + side * 0.8) * w * 4);
    g.stroke();
  }

  /* outfit: {hat, face, body, clothes}; a: {t, blink, look:{x,y}, wave} */
  function drawSnowman(g, x, y, s, o, a = {}) {
    const G = geom(s);
    const { rB, rM, rH, cyB, cyM, cyH } = G;
    const t = a.t || 0;
    g.save();
    g.translate(x, y);
    if (a.squash) g.scale(1 + a.squash, 1 - a.squash);
    if (a.tilt) g.rotate(a.tilt);

    // shadow
    if (!a.noShadow) {
      g.fillStyle = 'rgba(20,20,60,0.25)';
      g.beginPath();
      g.ellipse(0, 0, rB * 1.1, rB * 0.22, 0, 0, TAU);
      g.fill();
    }

    // arms (behind body)
    const lw = Math.max(1.5, 2.6 * s);
    const L0 = [-rM * 0.8, cyM - rM * 0.1];
    const R0 = [rM * 0.8, cyM - rM * 0.1];
    let Lh = [-rM * 2.05, cyM - rM * 0.75];
    let Rh = [rM * 2.05, cyM - rM * 0.75];
    if (o.body === 'waving') {
      const ang = -1.25 + Math.sin(t * 9) * 0.38;
      Rh = [R0[0] + Math.cos(ang) * rM * 1.5, R0[1] + Math.sin(ang) * rM * 1.5];
    }
    if (o.body === 'gift' || o.body === 'flowers' || o.body === 'cocoa') {
      Lh = [-rM * 1.55, cyM + rM * 0.15];
      Rh = [rM * 1.55, cyM + rM * 0.1];
    }
    if (o.body === 'broom') Rh = [rM * 1.9, cyM - rM * 0.2];
    if (o.body === 'broom') drawBroom(g, Rh[0], Rh[1], s);
    branch(g, L0[0], L0[1], Lh[0], Lh[1], lw);
    branch(g, R0[0], R0[1], Rh[0], Rh[1], lw);

    // body
    snowBall(g, 0, cyB, rB);
    snowBall(g, 0, cyM, rM);
    drawClothesBody(g, o.clothes, G, s);
    if (!['sweater', 'puffer', 'tuxedo'].includes(o.clothes)) {
      coal(g, 0, cyM - rM * 0.35, 1.9 * s);
      coal(g, 0, cyM + rM * 0.15, 1.9 * s);
      coal(g, 0, cyB - rB * 0.45, 2.1 * s);
    }

    // head
    snowBall(g, 0, cyH, rH);
    drawFace(g, o.face, G, s, a);
    drawNeck(g, o.clothes, G, s, t);
    drawHat(g, o.hat, G, s, t);

    // hand items (in front)
    drawHandItem(g, o.body, Lh, Rh, G, s, t);
    if (o.body === 'mittens') {
      [Lh, Rh].forEach((h) => {
        g.fillStyle = '#d94a4a';
        g.beginPath();
        g.ellipse(h[0], h[1], 4.6 * s, 5.4 * s, 0, 0, TAU);
        g.fill();
        g.fillStyle = '#fff';
        g.fillRect(h[0] - 4.6 * s, h[1] + 3 * s, 9.2 * s, 2.4 * s);
      });
    }
    g.restore();
  }

  function drawBroom(g, hx, hy, s) {
    g.strokeStyle = '#8a5a2b';
    g.lineWidth = 2.4 * s;
    g.beginPath();
    g.moveTo(hx, hy + 36 * s);
    g.lineTo(hx + 2 * s, hy - 26 * s);
    g.stroke();
    g.fillStyle = '#d8b25a';
    g.beginPath();
    g.moveTo(hx - 1 * s, hy - 24 * s);
    g.lineTo(hx - 8 * s, hy - 44 * s);
    g.lineTo(hx + 12 * s, hy - 44 * s);
    g.lineTo(hx + 5 * s, hy - 24 * s);
    g.closePath();
    g.fill();
    g.strokeStyle = 'rgba(120,80,20,0.6)';
    g.lineWidth = 0.8 * s;
    for (let i = -6; i <= 10; i += 3) {
      g.beginPath();
      g.moveTo(hx + 2 * s, hy - 25 * s);
      g.lineTo(hx + i * s, hy - 43 * s);
      g.stroke();
    }
    g.fillStyle = '#b5332e';
    g.fillRect(hx - 2.5 * s, hy - 27 * s, 8 * s, 3 * s);
  }

  function drawFace(g, face, G, s, a) {
    const { rH, cyH } = G;
    const ex = rH * 0.38,
      ey = cyH - rH * 0.15,
      er = Math.max(1.3, rH * 0.12);
    const look = a.look || { x: 0, y: 0 };
    const lx = look.x * er * 0.6,
      ly = look.y * er * 0.5;
    const blink = a.blink;
    g.lineCap = 'round';
    const line = (x0, y0, x1, y1, w = 1.6 * s) => {
      g.strokeStyle = '#1b1c2a';
      g.lineWidth = w;
      g.beginPath();
      g.moveTo(x0, y0);
      g.lineTo(x1, y1);
      g.stroke();
    };
    const arcEye = (x, up = true) => {
      g.strokeStyle = '#1b1c2a';
      g.lineWidth = 1.7 * s;
      g.beginPath();
      if (up) g.arc(x, ey + er * 0.6, er * 1.2, Math.PI * 1.15, Math.PI * 1.85);
      else g.arc(x, ey - er * 0.8, er * 1.2, Math.PI * 0.15, Math.PI * 0.85);
      g.stroke();
    };
    const dotEye = (x) => (blink ? line(x - er, ey, x + er, ey) : coal(g, x + lx, ey + ly, er));
    const smileDots = (n = 5, curve = 1, w = 0.55) => {
      for (let i = 0; i < n; i++) {
        const u = i / (n - 1) - 0.5;
        coal(g, u * rH * w * 2, cyH + rH * 0.42 + curve * (0.25 - u * u) * rH * 0.55 - rH * 0.1, Math.max(0.9, rH * 0.07));
      }
    };

    switch (face) {
      case 'happy':
        arcEye(-ex);
        arcEye(ex);
        g.fillStyle = '#2a1a1a';
        g.beginPath();
        g.arc(0, cyH + rH * 0.3, rH * 0.32, 0.1, Math.PI - 0.1);
        g.closePath();
        g.fill();
        g.fillStyle = '#e46b7a';
        g.beginPath();
        g.arc(0, cyH + rH * 0.48, rH * 0.14, Math.PI, 0);
        g.fill();
        break;
      case 'wink':
        dotEye(-ex);
        arcEye(ex);
        smileDots(5, 1.2);
        break;
      case 'cool':
        g.fillStyle = '#111';
        U.rrect(g, -ex - er * 2.2, ey - er * 1.6, er * 4, er * 3, er);
        g.fill();
        U.rrect(g, ex - er * 1.8, ey - er * 1.6, er * 4, er * 3, er);
        g.fill();
        g.fillRect(-ex + er * 1.6, ey - er * 0.9, ex * 2 - er * 3.2, er * 0.7);
        g.fillStyle = 'rgba(255,255,255,0.45)';
        g.fillRect(-ex - er * 1.3, ey - er * 1, er * 1.2, er * 0.6);
        g.fillRect(ex - er * 0.9, ey - er * 1, er * 1.2, er * 0.6);
        g.strokeStyle = '#1b1c2a';
        g.lineWidth = 1.6 * s;
        g.beginPath();
        g.moveTo(-rH * 0.25, cyH + rH * 0.45);
        g.quadraticCurveTo(rH * 0.1, cyH + rH * 0.6, rH * 0.38, cyH + rH * 0.36);
        g.stroke();
        break;
      case 'surprised':
        g.fillStyle = '#fff';
        [-ex, ex].forEach((x) => {
          g.beginPath();
          g.arc(x, ey, er * 1.7, 0, TAU);
          g.fill();
          g.strokeStyle = '#1b1c2a';
          g.lineWidth = 0.8 * s;
          g.stroke();
          coal(g, x + lx * 0.8, ey + ly * 0.8, er * 0.95);
        });
        g.fillStyle = '#2a1a1a';
        g.beginPath();
        g.ellipse(0, cyH + rH * 0.5, rH * 0.16, rH * 0.2, 0, 0, TAU);
        g.fill();
        break;
      case 'sleepy':
        arcEye(-ex, false);
        arcEye(ex, false);
        g.strokeStyle = '#1b1c2a';
        g.lineWidth = 1.4 * s;
        g.beginPath();
        g.arc(0, cyH + rH * 0.42, rH * 0.12, 0, Math.PI);
        g.stroke();
        break;
      case 'grumpy':
        dotEye(-ex);
        dotEye(ex);
        line(-ex - er * 1.6, ey - er * 2.4, -ex + er * 1.4, ey - er * 1.3, 1.8 * s);
        line(ex + er * 1.6, ey - er * 2.4, ex - er * 1.4, ey - er * 1.3, 1.8 * s);
        smileDots(5, -1.1);
        break;
      case 'love':
        [-ex, ex].forEach((x) => heart(g, x, ey, er * 1.9, '#e8384f'));
        smileDots(5, 1.2);
        g.fillStyle = 'rgba(255,120,150,0.4)';
        g.beginPath();
        g.ellipse(-rH * 0.62, cyH + rH * 0.22, rH * 0.18, rH * 0.11, 0, 0, TAU);
        g.ellipse(rH * 0.62, cyH + rH * 0.22, rH * 0.18, rH * 0.11, 0, 0, TAU);
        g.fill();
        break;
      default:
        dotEye(-ex);
        dotEye(ex);
        smileDots(5, 1);
    }
    // carrot nose
    const nx = 0,
      ny = cyH + rH * 0.06;
    const grd = g.createLinearGradient(nx, ny - 2, nx, ny + 3);
    grd.addColorStop(0, '#ffa64d');
    grd.addColorStop(1, '#e0661c');
    g.fillStyle = grd;
    g.beginPath();
    g.moveTo(nx - rH * 0.05, ny - rH * 0.11);
    g.lineTo(nx + rH * 0.95, ny + rH * 0.06);
    g.lineTo(nx - rH * 0.05, ny + rH * 0.12);
    g.closePath();
    g.fill();
  }

  function heart(g, x, y, r, color) {
    g.fillStyle = color;
    g.beginPath();
    g.moveTo(x, y + r * 0.7);
    g.bezierCurveTo(x - r * 1.2, y - r * 0.1, x - r * 0.6, y - r * 1.0, x, y - r * 0.35);
    g.bezierCurveTo(x + r * 0.6, y - r * 1.0, x + r * 1.2, y - r * 0.1, x, y + r * 0.7);
    g.fill();
  }

  function clipBall(g, x, y, r, fn) {
    g.save();
    g.beginPath();
    g.arc(x, y, r, 0, TAU);
    g.clip();
    fn();
    // re-apply shading so clothes look round
    const grd = g.createRadialGradient(x - r * 0.38, y - r * 0.42, r * 0.1, x, y, r * 1.05);
    grd.addColorStop(0, 'rgba(255,255,255,0.18)');
    grd.addColorStop(0.6, 'rgba(0,0,0,0)');
    grd.addColorStop(1, 'rgba(0,0,30,0.35)');
    g.fillStyle = grd;
    g.fillRect(x - r, y - r, r * 2, r * 2);
    g.restore();
  }

  function drawClothesBody(g, c, G, s) {
    const { rM, cyM } = G;
    if (c === 'sweater') {
      clipBall(g, 0, cyM, rM, () => {
        g.fillStyle = '#c73a3a';
        g.fillRect(-rM, cyM - rM, rM * 2, rM * 2);
        g.fillStyle = '#f7efe3';
        const yb = cyM - rM * 0.1;
        g.fillRect(-rM, yb - rM * 0.18, rM * 2, rM * 0.36);
        g.fillStyle = '#2f7a4a';
        for (let i = -6; i <= 6; i++) {
          g.beginPath();
          g.moveTo(i * rM * 0.2, yb - rM * 0.12);
          g.lineTo(i * rM * 0.2 + rM * 0.1, yb + rM * 0.1);
          g.lineTo(i * rM * 0.2 + rM * 0.2, yb - rM * 0.12);
          g.fill();
        }
        g.fillStyle = 'rgba(255,255,255,0.25)';
        for (let i = 0; i < 14; i++) g.fillRect(-rM + ((i * 7) % 30) * s * 1.2, cyM + rM * 0.35 + (i % 3) * 3 * s, 2 * s, 2 * s);
      });
    } else if (c === 'puffer') {
      clipBall(g, 0, cyM, rM * 1.02, () => {
        g.fillStyle = '#3b6fd8';
        g.fillRect(-rM * 1.1, cyM - rM * 1.1, rM * 2.2, rM * 2.2);
        g.strokeStyle = 'rgba(10,30,90,0.45)';
        g.lineWidth = 1.2 * s;
        for (let i = -2; i <= 2; i++) {
          g.beginPath();
          g.moveTo(-rM, cyM + i * rM * 0.42);
          g.quadraticCurveTo(0, cyM + i * rM * 0.42 + 3 * s, rM, cyM + i * rM * 0.42);
          g.stroke();
        }
        g.strokeStyle = '#d9e2ff';
        g.lineWidth = 1.4 * s;
        g.beginPath();
        g.moveTo(0, cyM - rM);
        g.lineTo(0, cyM + rM);
        g.stroke();
      });
    } else if (c === 'tuxedo') {
      clipBall(g, 0, cyM, rM, () => {
        g.fillStyle = '#16161f';
        g.fillRect(-rM, cyM - rM, rM * 2, rM * 2);
        g.fillStyle = '#f6f6fb';
        g.beginPath();
        g.moveTo(-rM * 0.45, cyM - rM);
        g.lineTo(0, cyM + rM * 0.5);
        g.lineTo(rM * 0.45, cyM - rM);
        g.fill();
        coal(g, 0, cyM - rM * 0.2, 1.3 * s);
        coal(g, 0, cyM + rM * 0.15, 1.3 * s);
      });
    }
  }

  function drawNeck(g, c, G, s, t) {
    const { rH, rM, cyH, cyM } = G;
    const ny = cyH + rH * 0.86;
    if (c === 'scarf' || c === 'striped') {
      const base = c === 'scarf' ? '#d63c3c' : '#2f8f5b';
      const stripe = (x, y, w, h) => {
        if (c !== 'striped') return;
        g.fillStyle = '#f5f1e6';
        for (let i = 0; i < 4; i++) g.fillRect(x + (w / 4) * i + w / 8, y, w / 14, h);
      };
      // tail
      g.fillStyle = base;
      const sway = Math.sin(t * 2) * 1.5 * s;
      g.beginPath();
      g.moveTo(rM * 0.15, ny);
      g.lineTo(rM * 0.62 + sway, ny + rM * 1.15);
      g.lineTo(rM * 0.18 + sway, ny + rM * 1.25);
      g.lineTo(-rM * 0.1, ny + rH * 0.2);
      g.closePath();
      g.fill();
      if (c === 'striped') {
        g.fillStyle = '#f5f1e6';
        g.fillRect(rM * 0.12 + sway, ny + rM * 0.6, rM * 0.42, 2.2 * s);
        g.fillRect(rM * 0.2 + sway, ny + rM * 0.9, rM * 0.42, 2.2 * s);
      }
      g.strokeStyle = base;
      g.lineWidth = 1.2 * s;
      for (let i = 0; i < 4; i++) {
        g.beginPath();
        g.moveTo(rM * 0.2 + sway + i * 1.5 * s, ny + rM * 1.22);
        g.lineTo(rM * 0.2 + sway + i * 1.5 * s, ny + rM * 1.42);
        g.stroke();
      }
      // wrap
      g.fillStyle = base;
      U.rrect(g, -rH * 0.95, ny - rH * 0.22, rH * 1.9, rH * 0.48, rH * 0.22);
      g.fill();
      stripe(-rH * 0.95, ny - rH * 0.22, rH * 1.9, rH * 0.48);
      g.fillStyle = 'rgba(0,0,0,0.12)';
      g.fillRect(-rH * 0.95, ny + rH * 0.12, rH * 1.9, rH * 0.12);
    } else if (c === 'bowtie' || c === 'tuxedo') {
      const col = c === 'tuxedo' ? '#111' : '#d33a5a';
      g.fillStyle = col;
      g.beginPath();
      g.moveTo(0, ny);
      g.lineTo(-rH * 0.55, ny - rH * 0.3);
      g.lineTo(-rH * 0.55, ny + rH * 0.3);
      g.closePath();
      g.moveTo(0, ny);
      g.lineTo(rH * 0.55, ny - rH * 0.3);
      g.lineTo(rH * 0.55, ny + rH * 0.3);
      g.closePath();
      g.fill();
      g.beginPath();
      g.arc(0, ny, rH * 0.13, 0, TAU);
      g.fill();
      if (c === 'bowtie') {
        g.fillStyle = 'rgba(255,255,255,0.7)';
        for (const sx of [-1, 1]) {
          g.beginPath();
          g.arc(sx * rH * 0.32, ny - rH * 0.06, 0.9 * s, 0, TAU);
          g.arc(sx * rH * 0.4, ny + rH * 0.12, 0.9 * s, 0, TAU);
          g.fill();
        }
      }
    } else if (c === 'tie') {
      g.fillStyle = '#2a59c9';
      g.beginPath();
      g.moveTo(-rH * 0.18, ny - rH * 0.1);
      g.lineTo(rH * 0.18, ny - rH * 0.1);
      g.lineTo(rH * 0.12, ny + rH * 0.15);
      g.lineTo(rH * 0.3, cyM + rM * 0.55);
      g.lineTo(0, cyM + rM * 0.8);
      g.lineTo(-rH * 0.3, cyM + rM * 0.55);
      g.lineTo(-rH * 0.12, ny + rH * 0.15);
      g.closePath();
      g.fill();
      g.strokeStyle = 'rgba(255,255,255,0.35)';
      g.lineWidth = 1.2 * s;
      for (let i = 0; i < 3; i++) {
        g.beginPath();
        g.moveTo(-rH * 0.2, cyM - rM * 0.2 + i * rM * 0.35);
        g.lineTo(rH * 0.2, cyM - rM * 0.4 + i * rM * 0.35);
        g.stroke();
      }
    } else if (c === 'chain') {
      g.strokeStyle = '#f2c14e';
      g.lineWidth = 1.8 * s;
      g.setLineDash([2.2 * s, 1.2 * s]);
      g.beginPath();
      g.arc(0, ny - rM * 0.3, rM * 0.75, 0.35, Math.PI - 0.35);
      g.stroke();
      g.setLineDash([]);
      const py = ny - rM * 0.3 + rM * 0.75;
      const grd = g.createRadialGradient(-1, py - 1, 0, 0, py, rM * 0.3);
      grd.addColorStop(0, '#fff3b0');
      grd.addColorStop(1, '#d99a1e');
      g.fillStyle = grd;
      g.beginPath();
      g.arc(0, py, rM * 0.26, 0, TAU);
      g.fill();
      g.fillStyle = '#9a6a0a';
      g.font = `bold ${Math.round(8 * s)}px sans-serif`;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText('$', 0, py + 0.5);
    }
  }

  function drawHat(g, h, G, s, t) {
    const { rH, cyH } = G;
    const hy = cyH - rH * 0.72;
    g.save();
    g.translate(0, hy);
    g.rotate(-0.12);
    switch (h) {
      case 'top': {
        g.fillStyle = '#1c1c28';
        g.beginPath();
        g.ellipse(0, 0, rH * 1.15, rH * 0.26, 0, 0, TAU);
        g.fill();
        g.fillRect(-rH * 0.72, -rH * 1.45, rH * 1.44, rH * 1.45);
        g.beginPath();
        g.ellipse(0, -rH * 1.45, rH * 0.72, rH * 0.16, 0, 0, TAU);
        g.fill();
        g.fillStyle = '#c63a3a';
        g.fillRect(-rH * 0.72, -rH * 0.42, rH * 1.44, rH * 0.3);
        g.fillStyle = 'rgba(255,255,255,0.12)';
        g.fillRect(-rH * 0.6, -rH * 1.38, rH * 0.2, rH * 1.0);
        break;
      }
      case 'beanie': {
        g.fillStyle = '#e0524a';
        g.beginPath();
        g.arc(0, rH * 0.05, rH * 1.0, Math.PI, 0);
        g.fill();
        g.strokeStyle = 'rgba(0,0,0,0.12)';
        g.lineWidth = 1 * s;
        for (let i = -3; i <= 3; i++) {
          g.beginPath();
          g.moveTo(i * rH * 0.25, 0);
          g.lineTo(i * rH * 0.18, -rH * 0.85);
          g.stroke();
        }
        g.fillStyle = '#f4ead8';
        U.rrect(g, -rH * 1.08, -rH * 0.12, rH * 2.16, rH * 0.42, rH * 0.18);
        g.fill();
        g.fillStyle = '#f4ead8';
        g.beginPath();
        g.arc(0, -rH * 1.05, rH * 0.32, 0, TAU);
        g.fill();
        break;
      }
      case 'earmuffs': {
        g.strokeStyle = '#7a6cd8';
        g.lineWidth = 2.4 * s;
        g.beginPath();
        g.arc(0, rH * 0.75, rH * 1.08, Math.PI * 1.08, Math.PI * 1.92);
        g.stroke();
        for (const sx of [-1, 1]) {
          g.fillStyle = '#ff9ec2';
          g.beginPath();
          g.arc(sx * rH * 1.0, rH * 0.75, rH * 0.38, 0, TAU);
          g.fill();
          g.fillStyle = 'rgba(255,255,255,0.4)';
          g.beginPath();
          g.arc(sx * rH * 1.0 - rH * 0.1, rH * 0.65, rH * 0.14, 0, TAU);
          g.fill();
        }
        break;
      }
      case 'santa': {
        const flop = Math.sin(t * 2.2) * 0.08;
        g.fillStyle = '#d42f2f';
        g.beginPath();
        g.moveTo(-rH * 0.95, 0);
        g.quadraticCurveTo(-rH * 0.2, -rH * 2.0, rH * 1.25 + flop * 10, -rH * 0.9);
        g.quadraticCurveTo(rH * 0.4, -rH * 0.9, rH * 0.95, 0);
        g.closePath();
        g.fill();
        g.fillStyle = '#fff';
        U.rrect(g, -rH * 1.08, -rH * 0.15, rH * 2.16, rH * 0.42, rH * 0.2);
        g.fill();
        g.beginPath();
        g.arc(rH * 1.28 + flop * 10, -rH * 0.82, rH * 0.28, 0, TAU);
        g.fill();
        break;
      }
      case 'crown': {
        const grd = g.createLinearGradient(0, -rH, 0, 0);
        grd.addColorStop(0, '#ffe680');
        grd.addColorStop(1, '#e0a020');
        g.fillStyle = grd;
        g.beginPath();
        g.moveTo(-rH * 0.85, 0);
        g.lineTo(-rH * 0.95, -rH * 0.95);
        g.lineTo(-rH * 0.45, -rH * 0.45);
        g.lineTo(0, -rH * 1.15);
        g.lineTo(rH * 0.45, -rH * 0.45);
        g.lineTo(rH * 0.95, -rH * 0.95);
        g.lineTo(rH * 0.85, 0);
        g.closePath();
        g.fill();
        [
          [-0.5, -0.2, '#e8384f'],
          [0, -0.25, '#3fa7ff'],
          [0.5, -0.2, '#3fd98a']
        ].forEach(([x, y, c]) => {
          g.fillStyle = c;
          g.beginPath();
          g.arc(x * rH, y * rH, rH * 0.12, 0, TAU);
          g.fill();
        });
        break;
      }
      case 'party': {
        g.save();
        g.rotate(0.2);
        g.beginPath();
        g.moveTo(-rH * 0.6, 0);
        g.lineTo(0, -rH * 1.9);
        g.lineTo(rH * 0.6, 0);
        g.closePath();
        g.save();
        g.clip();
        const cols = ['#ff5fa2', '#ffd34d', '#4dd2ff'];
        for (let i = 0; i < 8; i++) {
          g.fillStyle = cols[i % 3];
          g.fillRect(-rH, -rH * 2 + i * rH * 0.28, rH * 2, rH * 0.28);
        }
        g.restore();
        g.fillStyle = '#fff';
        g.beginPath();
        g.arc(0, -rH * 1.95, rH * 0.22, 0, TAU);
        g.fill();
        g.restore();
        break;
      }
      case 'antlers': {
        g.strokeStyle = '#8b5a2b';
        g.lineCap = 'round';
        g.lineWidth = 2.2 * s;
        for (const sx of [-1, 1]) {
          g.beginPath();
          g.moveTo(sx * rH * 0.5, rH * 0.1);
          g.quadraticCurveTo(sx * rH * 0.9, -rH * 0.9, sx * rH * 0.7, -rH * 1.6);
          g.moveTo(sx * rH * 0.78, -rH * 0.6);
          g.lineTo(sx * rH * 1.3, -rH * 1.0);
          g.moveTo(sx * rH * 0.8, -rH * 1.1);
          g.lineTo(sx * rH * 0.3, -rH * 1.45);
          g.stroke();
        }
        g.strokeStyle = '#5b3a8a';
        g.lineWidth = 2 * s;
        g.beginPath();
        g.arc(0, rH * 0.75, rH * 1.0, Math.PI * 1.15, Math.PI * 1.85);
        g.stroke();
        break;
      }
    }
    g.restore();
  }

  function drawHandItem(g, body, Lh, Rh, G, s, t) {
    if (body === 'candy') {
      g.save();
      g.translate(Rh[0], Rh[1]);
      g.lineCap = 'round';
      g.lineWidth = 3.4 * s;
      g.strokeStyle = '#fff';
      g.beginPath();
      g.moveTo(0, 18 * s);
      g.lineTo(0, -8 * s);
      g.arc(-5 * s, -8 * s, 5 * s, 0, Math.PI, true);
      g.stroke();
      g.strokeStyle = '#e03a3a';
      g.setLineDash([2.4 * s, 2.4 * s]);
      g.stroke();
      g.setLineDash([]);
      g.restore();
    } else if (body === 'cocoa') {
      g.save();
      g.translate(Lh[0], Lh[1]);
      g.fillStyle = '#e9e3f5';
      U.rrect(g, -5 * s, -6 * s, 10 * s, 12 * s, 2 * s);
      g.fill();
      g.strokeStyle = '#e9e3f5';
      g.lineWidth = 1.6 * s;
      g.beginPath();
      g.arc(-6 * s, 0, 3 * s, Math.PI * 0.5, Math.PI * 1.5);
      g.stroke();
      g.fillStyle = '#c94040';
      g.fillRect(-5 * s, -1 * s, 10 * s, 3 * s);
      g.fillStyle = '#6b3d22';
      g.beginPath();
      g.ellipse(0, -6 * s, 4.6 * s, 1.4 * s, 0, 0, TAU);
      g.fill();
      g.strokeStyle = 'rgba(255,255,255,0.55)';
      g.lineWidth = 1.1 * s;
      for (let i = 0; i < 2; i++) {
        const ph = t * 2 + i * 2;
        g.beginPath();
        g.moveTo(-1.5 * s + i * 3 * s, -8 * s);
        g.bezierCurveTo(-4 * s + i * 3 * s + Math.sin(ph) * 2, -12 * s, 1 * s + i * 3 * s, -14 * s, -1.5 * s + i * 3 * s + Math.sin(ph) * 2, -19 * s);
        g.stroke();
      }
      g.restore();
    } else if (body === 'gift') {
      const x = (Lh[0] + Rh[0]) / 2,
        y = (Lh[1] + Rh[1]) / 2 + 2 * s;
      drawGiftBox(g, x, y, 15 * s, '#3fa86b', '#ffd54d');
    } else if (body === 'flowers') {
      g.save();
      g.translate(Rh[0] - 2 * s, Rh[1]);
      g.strokeStyle = '#3d8a4a';
      g.lineWidth = 1.4 * s;
      const heads = [
        [-5, -14, '#ff6fa5'],
        [0, -17, '#ffd34d'],
        [5, -13, '#9b7bff'],
        [-1, -10, '#ff8a4d']
      ];
      heads.forEach(([x, y]) => {
        g.beginPath();
        g.moveTo(0, 6 * s);
        g.lineTo(x * s, y * s);
        g.stroke();
      });
      heads.forEach(([x, y, c]) => {
        g.fillStyle = c;
        for (let k = 0; k < 5; k++) {
          const a = (k / 5) * TAU;
          g.beginPath();
          g.arc(x * s + Math.cos(a) * 2.2 * s, y * s + Math.sin(a) * 2.2 * s, 1.8 * s, 0, TAU);
          g.fill();
        }
        g.fillStyle = '#fff6c2';
        g.beginPath();
        g.arc(x * s, y * s, 1.4 * s, 0, TAU);
        g.fill();
      });
      g.fillStyle = '#f2e7ff';
      g.beginPath();
      g.moveTo(-5 * s, -4 * s);
      g.lineTo(5 * s, -4 * s);
      g.lineTo(1.5 * s, 7 * s);
      g.lineTo(-1.5 * s, 7 * s);
      g.closePath();
      g.fill();
      g.restore();
    }
  }

  function drawGiftBox(g, x, y, size, color, ribbon) {
    const h = size * 0.85;
    g.save();
    g.translate(x, y);
    g.fillStyle = color;
    U.rrect(g, -size / 2, -h / 2, size, h, size * 0.08);
    g.fill();
    g.fillStyle = 'rgba(0,0,0,0.15)';
    g.fillRect(-size / 2, h * 0.1, size, h * 0.4);
    g.fillStyle = color;
    U.rrect(g, -size * 0.56, -h / 2 - size * 0.18, size * 1.12, size * 0.26, size * 0.06);
    g.fill();
    g.fillStyle = ribbon;
    g.fillRect(-size * 0.09, -h / 2 - size * 0.18, size * 0.18, h + size * 0.18);
    g.fillRect(-size * 0.56, -h / 2 - size * 0.09, size * 1.12, size * 0.1);
    g.beginPath();
    g.ellipse(-size * 0.17, -h / 2 - size * 0.28, size * 0.17, size * 0.11, -0.5, 0, TAU);
    g.ellipse(size * 0.17, -h / 2 - size * 0.28, size * 0.17, size * 0.11, 0.5, 0, TAU);
    g.fill();
    g.restore();
  }

  /* panel icons: zoom in on the part that changes */
  function iconFor(tab, id) {
    return (g, s) => {
      const o = Object.assign({}, DEFAULT_OUTFIT, { hat: 'none', body: 'none', clothes: 'none' });
      o[tab] = id;
      if (tab !== 'face') o.face = 'classic';
      const G = geom(1);
      g.save();
      if (tab === 'hat' || tab === 'face') {
        const k = tab === 'hat' ? 1.05 : 1.45;
        g.translate(s / 2 - 2, s / 2 + (tab === 'hat' ? 10 : 2));
        g.scale(k, k);
        g.translate(0, -G.cyH);
      } else {
        const k = 0.52;
        g.translate(s / 2, s / 2 + 6);
        g.scale(k, k);
        g.translate(0, -G.cyM);
      }
      drawSnowman(g, 0, 0, 1, o, { t: 0.6, noShadow: true });
      g.restore();
    };
  }

  /* ================================================================== wallpaper */
  function background(env) {
    const st = env.stage;
    let L = null; // pre-rendered layers
    let stars = [],
      windows = [],
      chimneys = [],
      flakes = [],
      shimmer = [];
    let lamp = null;
    const flakeImg = U.dot('rgba(255,255,255,1)', 16);
    const smoke = new DD.Particles(300);
    let sleigh = null;
    let nextSleigh = U.rand(40, 90);
    let shooting = null;
    let nextShoot = U.rand(8, 20);

    function build() {
      const W = st.w,
        H = st.h,
        dpr = st.dpr;
      const rnd = U.rng(20261125);
      const horizon = H * 0.62;
      stars = [];
      for (let i = 0; i < (W * H) / 4200; i++)
        stars.push({ x: rnd() * W, y: rnd() * H * 0.5, r: rnd() * 1.2 + 0.3, p: rnd() * TAU, s: 0.5 + rnd() * 2 });
      windows = [];
      chimneys = [];
      shimmer = [];

      const sky = U.layer(W, H, dpr, (g) => {
        const grd = g.createLinearGradient(0, 0, 0, H);
        grd.addColorStop(0, '#070a26');
        grd.addColorStop(0.35, '#1b1d5c');
        grd.addColorStop(0.58, '#3d3486');
        grd.addColorStop(0.75, '#6a4f9e');
        grd.addColorStop(1, '#8a6bb0');
        g.fillStyle = grd;
        g.fillRect(0, 0, W, H);
        // moon
        const mx = W * 0.8,
          my = H * 0.11,
          mr = Math.max(14, H * 0.024);
        U.glow(g, mx, my, mr * 7, 'rgba(255,236,190,0.22)');
        const mc = U.canvas(mr * 4 * dpr, mr * 4 * dpr);
        const m = mc.getContext('2d');
        m.scale(dpr, dpr);
        m.fillStyle = '#fff2c9';
        m.beginPath();
        m.arc(mr * 2, mr * 2, mr, 0, TAU);
        m.fill();
        m.globalCompositeOperation = 'destination-out';
        m.beginPath();
        m.arc(mr * 2 + mr * 0.55, mr * 2 - mr * 0.3, mr * 0.95, 0, TAU);
        m.fill();
        g.drawImage(mc, mx - mr * 2, my - mr * 2, mr * 4, mr * 4);
      });

      const land = U.layer(W, H, dpr, (g) => {
        // far mountains
        const mount = (baseY, amp, count, top, mid, bot, shadeA) => {
          const pts = DD.alps(rnd, W, baseY, amp, count);
          g.save();
          g.beginPath();
          g.moveTo(-20, H);
          pts.forEach((p) => g.lineTo(p[0], p[1]));
          g.lineTo(W + 20, H);
          g.closePath();
          const grd = g.createLinearGradient(0, baseY - amp, 0, baseY);
          grd.addColorStop(0, top);
          grd.addColorStop(0.5, mid);
          grd.addColorStop(1, bot);
          g.fillStyle = grd;
          g.fill();
          g.clip();
          DD.shadeAlps(g, pts, baseY, `rgba(28,22,92,${shadeA})`, rnd);
          // mist at the base
          const mist = g.createLinearGradient(0, baseY - amp * 0.35, 0, baseY);
          mist.addColorStop(0, 'rgba(120,100,200,0)');
          mist.addColorStop(1, 'rgba(120,100,200,0.55)');
          g.fillStyle = mist;
          g.fillRect(0, baseY - amp * 0.35, W, amp * 0.35 + 4);
          g.restore();
          return pts;
        };
        mount(horizon - H * 0.07, H * 0.36, 7, '#f1efff', '#a7a4ee', '#4a4598', 0.42);
        const ridge2 = mount(horizon - H * 0.01, H * 0.17, 11, '#d4d1fb', '#7c78cf', '#2f2c78', 0.45);

        // forest hills
        const hillPts = U.ridge(rnd, -20, W + 20, horizon + H * 0.01, H * 0.06, 0.45, 7);
        g.beginPath();
        g.moveTo(-20, H);
        hillPts.forEach((p) => g.lineTo(p[0], p[1]));
        g.lineTo(W + 20, H);
        g.fillStyle = '#26285e';
        g.fill();
        const hillY = (x) => {
          const i = U.clamp(Math.round(((x + 20) / (W + 40)) * (hillPts.length - 1)), 0, hillPts.length - 1);
          return hillPts[i][1];
        };
        // trees on hills
        const tree = (x, y, h, col, snow) => {
          const w = h * 0.42;
          for (let k = 0; k < 3; k++) {
            const ty = y - h * (k * 0.28);
            const tw = w * (1 - k * 0.22);
            g.fillStyle = col;
            g.beginPath();
            g.moveTo(x - tw, ty);
            g.lineTo(x, ty - h * 0.5);
            g.lineTo(x + tw, ty);
            g.fill();
            g.fillStyle = snow;
            g.beginPath();
            g.moveTo(x - tw * 0.5, ty - h * 0.24);
            g.lineTo(x, ty - h * 0.5);
            g.lineTo(x + tw * 0.4, ty - h * 0.28);
            g.fill();
          }
        };
        for (let i = 0; i < W / 5; i++) {
          const x = rnd() * W;
          tree(x, hillY(x) + 6 + rnd() * 18, 14 + rnd() * 20, '#151a45', 'rgba(200,200,255,0.45)');
        }

        // village
        const vy = horizon + H * 0.035;
        const houses = [];
        const clusters = [0.12, 0.3, 0.52, 0.7, 0.88];
        clusters.forEach((cx) => {
          const n = 4 + Math.floor(rnd() * 5);
          for (let i = 0; i < n; i++)
            houses.push({ x: (cx + (rnd() - 0.5) * 0.14) * W, y: vy + (rnd() - 0.3) * H * 0.025, s: 0.8 + rnd() * 0.6 });
        });
        houses.sort((a, b) => a.y - b.y);
        const church = { x: W * 0.52, y: vy - H * 0.004 };
        houses.forEach((h) => {
          const hw = 22 * h.s,
            hh = 14 * h.s;
          const x = h.x,
            y = h.y;
          g.fillStyle = '#4a3a68';
          g.fillRect(x - hw / 2, y - hh, hw, hh);
          g.fillStyle = '#382b55';
          g.fillRect(x + hw * 0.1, y - hh, hw * 0.4, hh);
          // roof w/ snow
          g.fillStyle = '#eceaff';
          g.beginPath();
          g.moveTo(x - hw * 0.62, y - hh + 1);
          g.lineTo(x, y - hh - hw * 0.45);
          g.lineTo(x + hw * 0.62, y - hh + 1);
          g.closePath();
          g.fill();
          g.fillStyle = 'rgba(120,110,200,0.5)';
          g.beginPath();
          g.moveTo(x, y - hh - hw * 0.45);
          g.lineTo(x + hw * 0.62, y - hh + 1);
          g.lineTo(x + hw * 0.2, y - hh + 1);
          g.closePath();
          g.fill();
          // chimney
          if (rnd() < 0.6) {
            const cx = x + hw * 0.25;
            g.fillStyle = '#3a2c4f';
            g.fillRect(cx, y - hh - hw * 0.35, 3 * h.s, hw * 0.25);
            chimneys.push({ x: cx + 1.5 * h.s, y: y - hh - hw * 0.36, t: rnd() * 3 });
          }
          // windows
          const nw = 2 + Math.floor(rnd() * 2);
          for (let k = 0; k < nw; k++) {
            if (rnd() < 0.2) continue;
            const wx = x - hw / 2 + (hw / (nw + 1)) * (k + 1) - 2 * h.s;
            const wy = y - hh * 0.65;
            windows.push({ x: wx, y: wy, w: 4 * h.s, h: 5 * h.s, p: rnd() * TAU, f: 0.5 + rnd() });
            g.fillStyle = '#ffcb72';
            g.fillRect(wx, wy, 4 * h.s, 5 * h.s);
          }
          // snow on ground around
          g.fillStyle = 'rgba(230,228,255,0.85)';
          g.beginPath();
          g.ellipse(x, y + 1, hw * 0.8, 2.5 * h.s, 0, 0, TAU);
          g.fill();
        });
        // church
        {
          const x = church.x,
            y = church.y;
          g.fillStyle = '#4a3a68';
          g.fillRect(x - 7, y - 46, 14, 46);
          g.fillStyle = '#eceaff';
          g.beginPath();
          g.moveTo(x - 9, y - 45);
          g.lineTo(x, y - 74);
          g.lineTo(x + 9, y - 45);
          g.fill();
          g.fillStyle = '#ffcb72';
          g.fillRect(x - 2.5, y - 38, 5, 8);
          windows.push({ x: x - 2.5, y: y - 38, w: 5, h: 8, p: 1, f: 0.3 });
          g.fillStyle = '#ffd98a';
          g.beginPath();
          g.arc(x, y - 52, 2.6, 0, TAU);
          g.fill();
        }

        // lake
        const ly0 = vy + H * 0.02,
          ly1 = H * 0.76;
        const lg = g.createLinearGradient(0, ly0, 0, ly1);
        lg.addColorStop(0, '#2a2a6a');
        lg.addColorStop(1, '#171a48');
        g.fillStyle = lg;
        g.fillRect(0, ly0, W, ly1 - ly0);
        // mirrored ridge
        g.save();
        g.beginPath();
        g.rect(0, ly0, W, ly1 - ly0);
        g.clip();
        g.globalAlpha = 0.18;
        g.beginPath();
        g.moveTo(-20, ly0);
        ridge2.forEach((p) => g.lineTo(p[0], ly0 + (horizon - H * 0.01 - p[1]) * 0.5));
        g.lineTo(W + 20, ly0);
        g.fillStyle = '#b9b6ff';
        g.fill();
        g.restore();
        g.fillStyle = 'rgba(235,232,255,0.9)';
        g.fillRect(0, ly0 - 1.5, W, 3);
        windows.forEach((w) => {
          if (w.y > ly0 - 40) shimmer.push({ x: w.x + w.w / 2, y0: ly0 + 2, len: 8 + (ly1 - ly0) * 0.25 * Math.random(), p: Math.random() * TAU });
        });

        // foreground snow
        const fy = ly1;
        const fg = g.createLinearGradient(0, fy - 20, 0, H);
        fg.addColorStop(0, '#d9d4ff');
        fg.addColorStop(0.35, '#a9a0ea');
        fg.addColorStop(1, '#5b54a6');
        g.beginPath();
        g.moveTo(0, H);
        g.lineTo(0, fy + 10);
        for (let x = 0; x <= W; x += 20) g.lineTo(x, fy + Math.sin(x * 0.006) * 10 + Math.sin(x * 0.021) * 4);
        g.lineTo(W, H);
        g.closePath();
        g.fillStyle = fg;
        g.fill();
        // drifts
        for (let i = 0; i < 7; i++) {
          // soft drift ridges: light top edge, shadow underneath
          const x = rnd() * W,
            y = fy + 50 + rnd() * (H - fy - 60);
          const w = 140 + rnd() * 220;
          g.fillStyle = 'rgba(80,70,160,0.18)';
          g.beginPath();
          g.ellipse(x + 10, y + 6, w, 14, 0, 0, TAU);
          g.fill();
          g.fillStyle = 'rgba(235,232,255,0.55)';
          g.beginPath();
          g.ellipse(x, y, w, 12, 0, Math.PI, 0);
          g.fill();
        }
        // lamp light pool
        lamp = { x: W * 0.07, y: fy + 18 };
        const pool = g.createRadialGradient(lamp.x, lamp.y + 40, 10, lamp.x, lamp.y + 40, 260);
        pool.addColorStop(0, 'rgba(255,190,120,0.55)');
        pool.addColorStop(1, 'rgba(255,190,120,0)');
        g.fillStyle = pool;
        g.fillRect(0, fy - 60, W * 0.4, H - fy + 60);

        // fence
        const fenceY = fy + 34;
        g.fillStyle = '#3a2830';
        for (let x = W * 0.02; x < W * 0.75; x += 46) {
          const yy = fenceY + Math.sin(x * 0.006) * 10;
          g.fillRect(x, yy - 34, 6, 40);
          g.fillStyle = '#f2f0ff';
          U.rrect(g, x - 2, yy - 38, 10, 6, 3);
          g.fill();
          g.fillStyle = '#3a2830';
        }
        g.strokeStyle = '#3a2830';
        g.lineWidth = 4;
        for (const off of [-26, -12]) {
          g.beginPath();
          for (let x = W * 0.02; x < W * 0.75; x += 10) g.lineTo(x, fenceY + off + Math.sin(x * 0.006) * 10);
          g.stroke();
        }
        g.strokeStyle = 'rgba(245,243,255,0.9)';
        g.lineWidth = 2;
        g.beginPath();
        for (let x = W * 0.02; x < W * 0.75; x += 10) g.lineTo(x, fenceY - 28 + Math.sin(x * 0.006) * 10);
        g.stroke();

        // lamp post
        g.fillStyle = '#2a2030';
        g.fillRect(lamp.x - 3, lamp.y - 120, 6, 130);
        g.fillRect(lamp.x - 12, lamp.y - 126, 24, 6);
        U.rrect(g, lamp.x - 10, lamp.y - 150, 20, 26, 4);
        g.fill();
        g.fillStyle = '#ffd99a';
        g.fillRect(lamp.x - 7, lamp.y - 146, 14, 18);
        g.fillStyle = '#f2f0ff';
        U.rrect(g, lamp.x - 13, lamp.y - 156, 26, 8, 4);
        g.fill();
        lamp.ly = lamp.y - 137;

        // big snowy pines on the sides
        const bigTree = (x, base, h) => {
          const layers = 7;
          for (let k = 0; k < layers; k++) {
            const t0 = k / layers;
            const ty = base - h * t0 * 0.92;
            const tw = h * 0.36 * (1 - t0 * 0.85);
            g.fillStyle = '#16203f';
            g.beginPath();
            g.moveTo(x - tw, ty);
            g.quadraticCurveTo(x - tw * 0.3, ty - h * 0.08, x, ty - h * 0.2);
            g.quadraticCurveTo(x + tw * 0.3, ty - h * 0.08, x + tw, ty);
            g.closePath();
            g.fill();
            g.fillStyle = '#eef0ff';
            g.beginPath();
            g.moveTo(x - tw * 0.95, ty - 2);
            g.quadraticCurveTo(x - tw * 0.3, ty - h * 0.1, x, ty - h * 0.2);
            g.quadraticCurveTo(x + tw * 0.2, ty - h * 0.12, x + tw * 0.7, ty - h * 0.05);
            g.quadraticCurveTo(x, ty - h * 0.06, x - tw * 0.95, ty - 2);
            g.fill();
          }
        };
        bigTree(W * 0.97, fy + 60, H * 0.62);
        bigTree(W * 0.9, fy + 40, H * 0.34);
        bigTree(-W * 0.01, fy + 70, H * 0.42);
      });

      L = { sky, land };
      // snow
      flakes = [];
      const n = Math.min(900, (W * H) / 3000);
      for (let i = 0; i < n; i++) {
        const z = Math.random();
        flakes.push({ x: Math.random() * W, y: Math.random() * H, z, r: 1 + z * 3.2, sp: 20 + z * 70, ph: Math.random() * TAU });
      }
    }
    st.onResize.push(build);
    build();

    function drawSleigh(g, x, y, s, dir) {
      g.save();
      g.translate(x, y);
      g.scale(dir * s, s);
      g.fillStyle = 'rgba(20,16,40,0.85)';
      // reindeer
      for (let i = 0; i < 2; i++) {
        const rx = 40 + i * 26,
          ry = -2 + Math.sin(st.time * 10 + i) * 1.5;
        g.beginPath();
        g.ellipse(rx, ry, 9, 4, 0, 0, TAU);
        g.fill();
        g.fillRect(rx + 6, ry - 8, 3, 7);
        g.beginPath();
        g.arc(rx + 9, ry - 9, 3, 0, TAU);
        g.fill();
        g.strokeStyle = 'rgba(20,16,40,0.85)';
        g.lineWidth = 1.2;
        g.beginPath();
        g.moveTo(rx + 8, ry - 12);
        g.lineTo(rx + 6, ry - 17);
        g.moveTo(rx + 10, ry - 12);
        g.lineTo(rx + 13, ry - 17);
        const leg = Math.sin(st.time * 14 + i) * 3;
        g.moveTo(rx - 5, ry + 2);
        g.lineTo(rx - 7 - leg, ry + 8);
        g.moveTo(rx + 5, ry + 2);
        g.lineTo(rx + 7 + leg, ry + 8);
        g.stroke();
      }
      g.beginPath();
      g.moveTo(-14, 6);
      g.quadraticCurveTo(-18, -8, -6, -6);
      g.lineTo(16, -4);
      g.quadraticCurveTo(22, 6, 12, 7);
      g.closePath();
      g.fill();
      g.beginPath();
      g.arc(0, -10, 5, 0, TAU);
      g.fill();
      g.restore();
    }

    return {
      action(name) {
        if (name === 'surprise' && !sleigh) nextSleigh = 0.01;
      },
      frame(dt, t) {
        const g = st.ctx,
          W = st.w,
          H = st.h;
        g.drawImage(L.sky, 0, 0, W, H);
        // stars
        g.fillStyle = '#fff';
        for (const s of stars) {
          g.globalAlpha = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * s.s + s.p));
          g.fillRect(s.x, s.y, s.r, s.r);
        }
        g.globalAlpha = 1;
        // shooting star
        nextShoot -= dt;
        if (nextShoot < 0 && !shooting) {
          shooting = { x: U.rand(W * 0.1, W * 0.7), y: U.rand(H * 0.04, H * 0.25), age: 0 };
          nextShoot = U.rand(14, 40);
        }
        if (shooting) {
          shooting.age += dt;
          const k = shooting.age / 0.9;
          const x = shooting.x + k * 260,
            y = shooting.y + k * 90;
          const grd = g.createLinearGradient(x - 90, y - 31, x, y);
          grd.addColorStop(0, 'rgba(255,255,255,0)');
          grd.addColorStop(1, `rgba(255,255,255,${0.9 * (1 - k)})`);
          g.strokeStyle = grd;
          g.lineWidth = 1.6;
          g.beginPath();
          g.moveTo(x - 90, y - 31);
          g.lineTo(x, y);
          g.stroke();
          if (k >= 1) shooting = null;
        }
        // background sleigh across the sky
        nextSleigh -= dt;
        if (nextSleigh <= 0 && !sleigh) {
          const dir = Math.random() < 0.5 ? 1 : -1;
          sleigh = { x: dir > 0 ? -120 : W + 120, y: H * U.rand(0.08, 0.22), dir, trail: new DD.Particles(200) };
          nextSleigh = U.rand(90, 180);
        }
        if (sleigh) {
          sleigh.x += sleigh.dir * W * 0.06 * dt;
          const y = sleigh.y + Math.sin(t * 1.5) * 8;
          if (Math.random() < 0.8)
            sleigh.trail.add({
              x: sleigh.x - sleigh.dir * 16,
              y: y + 2,
              vx: U.rand(-6, 6),
              vy: U.rand(4, 14),
              life: 1.6,
              shrink: true,
              draw: DD.paint.star('#ffe7a0', 2.2)
            });
          sleigh.trail.update(dt);
          sleigh.trail.draw(g);
          drawSleigh(g, sleigh.x, y, 0.9, sleigh.dir);
          if (sleigh.x < -200 || sleigh.x > W + 200) sleigh = null;
        }
        g.drawImage(L.land, 0, 0, W, H);
        // windows flicker glow
        for (const w of windows) {
          const f = 0.75 + 0.25 * Math.sin(t * w.f * 2 + w.p) + (Math.random() < 0.003 ? -0.4 : 0);
          g.globalAlpha = 0.35 * f;
          U.glow(g, w.x + w.w / 2, w.y + w.h / 2, 10, '#ffb84d');
        }
        g.globalAlpha = 1;
        // lake shimmer
        g.fillStyle = '#ffcf80';
        for (const s of shimmer) {
          const a = 0.18 + 0.15 * Math.sin(t * 2 + s.p);
          g.globalAlpha = a;
          for (let k = 0; k < s.len; k += 3) {
            const off = Math.sin(t * 3 + k * 0.4 + s.p) * 2;
            g.fillRect(s.x - 1.5 + off, s.y0 + k, 3, 1.4);
          }
        }
        g.globalAlpha = 1;
        // chimney smoke
        for (const c of chimneys) {
          c.t -= dt;
          if (c.t < 0) {
            c.t = U.rand(0.3, 0.7);
            smoke.add({ x: c.x, y: c.y, vx: U.rand(2, 8), vy: U.rand(-10, -6), life: 4, alpha: 0.25, draw: DD.paint.sprite(flakeImg, 7), update: (p, d) => (p.vx += d * 1.5) });
          }
        }
        smoke.update(dt);
        smoke.draw(g);
        // lamp glow
        if (lamp) U.glow(g, lamp.x, lamp.ly, 70 + Math.sin(t * 7) * 2, 'rgba(255,200,120,0.55)');
        // snowfall
        const wind = Math.sin(t * 0.2) * 18;
        const ws = env.state.settings.weather || {};
        const wt = window.DD_CATALOG.resolveWeather(ws.type || 'auto', 'winter');
        const share = wt !== 'snow' || ws.paused ? 0.12 : { light: 0.35, medium: 0.65, heavy: 1, blizzard: 1 }[ws.amount] || 0.65;
        const nDraw = Math.floor(flakes.length * share);
        for (let fi = 0; fi < nDraw; fi++) {
          const f = flakes[fi];
          f.y += f.sp * dt;
          f.x += (wind * f.z + Math.sin(t + f.ph) * 10 * f.z) * dt;
          if (f.y > H + 10) {
            f.y = -10;
            f.x = Math.random() * W;
          }
          if (f.x > W + 10) f.x = -10;
          if (f.x < -10) f.x = W + 10;
          g.globalAlpha = 0.4 + f.z * 0.6;
          const s = f.r * 2.4;
          g.drawImage(flakeImg, f.x - s / 2, f.y - s / 2, s, s);
        }
        g.globalAlpha = 1;
      }
    };
  }

  /* ================================================================== toys */
  function toys(env) {
    const st = env.stage;
    const P = env.particles;
    const GRAV = 2200;
    const ents = [];
    let idle = 0;
    let spawnT = 2;
    let santaT = U.rand(35, 60);
    let dirty = false;
    let editing = null;
    const allowed = (tab, id) => {
      const it = ITEMS[tab].find((i) => i.id === id);
      return it && (!it.pro || env.pro);
    };
    const ground = () => env.ground;
    const W = () => st.w;

    const flake = U.dot('rgba(255,255,255,1)', 12);
    const poof = (x, y, n = 18, color) =>
      P.burst(x, y, n, () => ({
        vx: U.rand(-160, 160),
        vy: U.rand(-220, -40),
        g: 500,
        drag: 2,
        life: U.rand(0.5, 0.9),
        shrink: true,
        draw: color ? DD.paint.circle(color, U.rand(2, 4)) : DD.paint.sprite(flake, U.rand(6, 12))
      }));
    const sparkle = (x, y, n = 14) =>
      P.burst(x, y, n, () => ({
        vx: U.rand(-120, 120),
        vy: U.rand(-160, 20),
        drag: 3,
        life: U.rand(0.6, 1.1),
        shrink: true,
        draw: DD.paint.star(U.pick(['#fff6c2', '#ffd56b', '#bfe0ff']), U.rand(3, 6))
      }));

    /* ---------------- physics body helpers ---------------- */
    function landSound(vy) {
      if (vy > 500) DD.sound.play('thud');
    }

    /* ---------------- Snowball ---------------- */
    function Ball(x, y, r) {
      const b = { kind: 'ball', x, y, r, vx: 0, vy: 0, rot: 0, held: false, onGround: false };
      b.pick = (px, py) => U.dist(px, py, b.x, b.y) < b.r + 6;
      b.onGrab = () => {
        b.held = true;
        idle = 0;
      };
      b.onDrag = (px, py) => {
        b.x = px;
        b.y = Math.min(py, ground() - b.r);
      };
      b.onRelease = (vx, vy) => {
        b.held = false;
        b.vx = vx * 0.9;
        b.vy = vy * 0.9;
        const target = findStackTarget(b, true);
        if (target) merge(b, target);
        dirty = true;
      };
      b.onClick = () => {
        b.vy = -420;
        b.vx = U.rand(-120, 120);
        DD.sound.play('crunch');
        idle = 0;
      };
      b.top = () => b.y - b.r;
      b.update = (dt) => {
        if (b.held) return;
        b.vy += GRAV * dt;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        const G = ground();
        b.onGround = false;
        if (b.y + b.r >= G) {
          landSound(b.vy);
          b.y = G - b.r;
          b.vy = Math.abs(b.vy) > 160 ? -b.vy * 0.3 : 0;
          b.onGround = true;
          b.vx *= Math.max(0, 1 - 1.4 * dt);
          if (Math.abs(b.vx) > 50 && b.r < 30) b.r += Math.abs(b.vx) * dt * 0.0035;
          if (Math.abs(b.vx) > 120 && Math.random() < 0.3)
            P.add({ x: b.x, y: G - 2, vx: -b.vx * 0.1, vy: U.rand(-80, -20), g: 400, life: 0.5, shrink: true, draw: DD.paint.sprite(flake, 6) });
        }
        if (b.x < b.r) {
          b.x = b.r;
          b.vx = Math.abs(b.vx) * 0.5;
        }
        if (b.x > W() - b.r) {
          b.x = W() - b.r;
          b.vx = -Math.abs(b.vx) * 0.5;
        }
        b.rot += (b.vx / b.r) * dt;
        // landing on another ball/stack → stack up
        if (b.vy > 0) {
          const t = findStackTarget(b, false);
          if (t) merge(b, t);
        }
      };
      b.draw = (g) => {
        g.fillStyle = 'rgba(20,20,60,0.22)';
        const G = ground();
        const h = U.clamp(1 - (G - b.y - b.r) / 200, 0.2, 1);
        g.beginPath();
        g.ellipse(b.x, G, b.r * h, b.r * 0.2 * h, 0, 0, TAU);
        g.fill();
        snowBall(g, b.x, b.y, b.r, b.rot, true);
      };
      return b;
    }

    /* ---------------- Stack of two ---------------- */
    function Stack(x, radii) {
      const s = { kind: 'stack', x, y: ground(), radii: radii.slice().sort((a, b) => b - a), vy: 0, vx: 0, held: false, wob: 0 };
      const h = () => s.radii[0] * 2 + s.radii[1] * 1.6;
      s.top = () => s.y - h();
      s.r = s.radii[0];
      s.pick = (px, py) => Math.abs(px - s.x) < s.radii[0] + 4 && py > s.y - h() - 4 && py < s.y + 4;
      s.onGrab = () => (s.held = true);
      s.onDrag = (px, py) => {
        s.x = px;
        s.y = Math.min(ground(), py + h() / 2);
      };
      s.onRelease = (vx, vy) => {
        s.held = false;
        s.vx = vx * 0.5;
        s.vy = vy * 0.5;
        dirty = true;
      };
      s.onClick = () => {
        s.wob = 1;
        DD.sound.play('crunch');
        DD.bubbles.say(s, 'One more ball!', 2);
      };
      s.bubbleAnchor = () => ({ x: s.x, y: s.top() - 4 });
      s.update = (dt) => {
        s.wob *= Math.max(0, 1 - 4 * dt);
        if (s.held) return;
        s.vy += GRAV * dt;
        s.y += s.vy * dt;
        s.x += s.vx * dt;
        s.vx *= Math.max(0, 1 - 4 * dt);
        if (s.y >= ground()) {
          landSound(s.vy);
          s.y = ground();
          s.vy = 0;
        }
        s.x = U.clamp(s.x, s.radii[0], W() - s.radii[0]);
      };
      s.draw = (g) => {
        g.save();
        g.translate(s.x, s.y);
        g.rotate(Math.sin(st.time * 18) * 0.06 * s.wob);
        g.fillStyle = 'rgba(20,20,60,0.22)';
        g.beginPath();
        g.ellipse(0, 0, s.radii[0] * 1.05, s.radii[0] * 0.2, 0, 0, TAU);
        g.fill();
        snowBall(g, 0, -s.radii[0], s.radii[0], 0, true);
        snowBall(g, 0, -s.radii[0] * 2 - s.radii[1] * 0.6, s.radii[1], 1, true);
        g.restore();
      };
      return s;
    }

    /* ---------------- Snowman ---------------- */
    function Snowman(x, scale, outfit) {
      const m = {
        kind: 'snowman',
        x,
        y: ground(),
        vx: 0,
        vy: 0,
        s: scale,
        outfit: Object.assign({}, DEFAULT_OUTFIT, outfit || {}),
        held: false,
        blinkT: U.rand(2, 5),
        blink: 0,
        squash: 0,
        tilt: 0,
        zT: 0
      };
      const G = () => geom(m.s);
      m.top = () => m.y + G().top - 10 * m.s;
      m.r = 24 * scale;
      m.pick = (px, py) => {
        const g = G();
        return Math.abs(px - m.x) < g.rB + 6 && py > m.y + g.top - 14 * m.s && py < m.y + 4;
      };
      m.bubbleAnchor = () => ({ x: m.x, y: m.y + G().top - 18 * m.s });
      m.onGrab = () => {
        m.held = true;
        DD.panel.close();
        DD.sound.play('giggle');
      };
      m.onDrag = (px, py) => {
        const nx = px;
        m.tilt = U.clamp((nx - m.x) * 0.02, -0.4, 0.4);
        m.x = nx;
        m.y = Math.min(ground(), py - G().cyM);
      };
      m.onRelease = (vx, vy) => {
        m.held = false;
        m.vx = vx * 0.4;
        m.vy = vy * 0.4;
        dirty = true;
      };
      m.onClick = () => {
        m.squash = 0.18;
        m.vy = -320;
        DD.sound.play('giggle');
        idle = 0;
        DD.bubbles.say(m, U.pick(LINES), 2.6);
      };
      m.onDblClick = () => openOutfitPanel(m);
      m.update = (dt) => {
        m.blinkT -= dt;
        if (m.blinkT < 0) {
          m.blink = 0.14;
          m.blinkT = U.rand(2.5, 6);
        }
        m.blink = Math.max(0, m.blink - dt);
        m.squash *= Math.max(0, 1 - 7 * dt);
        if (!m.held) m.tilt *= Math.max(0, 1 - 6 * dt);
        if (m.outfit.face === 'sleepy') {
          m.zT -= dt;
          if (m.zT < 0) {
            m.zT = 1.4;
            const g = G();
            P.add({
              x: m.x + g.rH,
              y: m.y + g.cyH - g.rH,
              vx: 14,
              vy: -22,
              life: 2,
              draw: (gg, p, t) => {
                gg.fillStyle = '#fff';
                gg.font = `bold ${10 + t * 6}px sans-serif`;
                gg.fillText('z', 0, 0);
              }
            });
          }
        }
        if (m.held) return;
        m.vy += GRAV * dt;
        m.y += m.vy * dt;
        m.x += m.vx * dt;
        m.vx *= Math.max(0, 1 - 5 * dt);
        if (m.y >= ground()) {
          if (m.vy > 400) {
            m.squash = 0.15;
            poof(m.x, ground(), 10);
            DD.sound.play('thud');
          }
          m.y = ground();
          m.vy = 0;
        }
        m.x = U.clamp(m.x, 30, W() - 30);
      };
      m.draw = (g) => {
        let look = { x: 0, y: 0 };
        if (env.pointer.inside) {
          const g0 = G();
          const dx = env.pointer.x - m.x,
            dy = env.pointer.y - (m.y + g0.cyH);
          const d = Math.hypot(dx, dy) || 1;
          look = { x: dx / d, y: dy / d };
        }
        const bob = Math.sin(st.time * 2 + m.x) * 0.012;
        drawSnowman(g, m.x, m.y, m.s, m.outfit, {
          t: st.time,
          blink: m.blink > 0,
          look,
          squash: m.squash + bob,
          tilt: m.tilt
        });
        if (editing === m) {
          g.strokeStyle = 'rgba(190,210,255,0.6)';
          g.setLineDash([4, 4]);
          g.lineWidth = 1.5;
          g.beginPath();
          g.ellipse(m.x, m.y, geom(m.s).rB * 1.4, geom(m.s).rB * 0.35, 0, 0, TAU);
          g.stroke();
          g.setLineDash([]);
        }
      };
      return m;
    }

    /* ---------------- Gift ---------------- */
    const GIFT_COLORS = [
      ['#e2434b', '#ffd54d'],
      ['#3fa86b', '#ffffff'],
      ['#4a7be0', '#ffd54d'],
      ['#a35be0', '#ffe9f5'],
      ['#f08a24', '#ffffff']
    ];
    function Gift(x, y, vx) {
      const c = U.pick(GIFT_COLORS);
      const gft = { kind: 'gift', x, y, vx, vy: 0, size: U.rand(16, 22), col: c, age: 0, held: false, rot: U.rand(-0.3, 0.3) };
      gft.pick = (px, py) => Math.abs(px - gft.x) < gft.size * 0.7 && Math.abs(py - (gft.y - gft.size * 0.45)) < gft.size * 0.8;
      gft.onGrab = () => (gft.held = true);
      gft.onDrag = (px, py) => {
        gft.x = px;
        gft.y = Math.min(ground(), py + gft.size * 0.4);
      };
      gft.onRelease = (vx, vy) => {
        gft.held = false;
        gft.vx = vx * 0.6;
        gft.vy = vy * 0.6;
      };
      gft.onClick = () => openGift(gft);
      gft.update = (dt) => {
        gft.age += dt;
        if (gft.held) return;
        gft.vy += GRAV * 0.5 * dt;
        gft.x += gft.vx * dt;
        gft.y += gft.vy * dt;
        if (gft.y >= ground()) {
          gft.y = ground();
          gft.vy = Math.abs(gft.vy) > 200 ? -gft.vy * 0.35 : 0;
          gft.vx *= 0.8;
          gft.rot *= 0.6;
        }
        gft.x = U.clamp(gft.x, 15, W() - 15);
        if (gft.age > 300) remove(gft);
      };
      gft.draw = (g) => {
        g.save();
        g.translate(gft.x, gft.y);
        g.rotate(gft.rot + Math.sin(st.time * 3 + gft.x) * 0.03);
        g.fillStyle = 'rgba(20,20,60,0.2)';
        g.beginPath();
        g.ellipse(0, 0, gft.size * 0.6, gft.size * 0.15, 0, 0, TAU);
        g.fill();
        drawGiftBox(g, 0, -gft.size * 0.43, gft.size, gft.col[0], gft.col[1]);
        g.restore();
        if (Math.random() < 0.04) sparkle(gft.x + U.rand(-10, 10), gft.y - gft.size, 1);
      };
      return gft;
    }

    function openGift(gft) {
      remove(gft);
      DD.sound.play('chime');
      P.burst(gft.x, gft.y - 12, 46, () => ({
        vx: U.rand(-260, 260),
        vy: U.rand(-520, -160),
        g: 900,
        drag: 1.2,
        life: U.rand(1, 1.8),
        vr: U.rand(-10, 10),
        draw: DD.paint.confetti(U.pick(['#ff5f7e', '#ffd34d', '#5fd3ff', '#7dff9b', '#c38bff']))
      }));
      const men = ents.filter((e) => e.kind === 'snowman');
      if (men.length) {
        const m = men.reduce((a, b) => (Math.abs(a.x - gft.x) < Math.abs(b.x - gft.x) ? a : b));
        m.outfit = randomOutfit();
        m.squash = 0.2;
        sparkle(m.x, m.y - 60, 24);
        DD.bubbles.say(m, U.pick(['A new look!', 'Fancy!', 'Is this me?!', 'Runway ready.']), 2.4);
        dirty = true;
      } else {
        for (let i = 0; i < 3; i++) spawnBall(gft.x + (i - 1) * 50, ground() - 160 - i * 40);
        DD.toast('🎁 Three snowballs! Stack them into a snowman.');
      }
    }

    /* ---------------- Santa ---------------- */
    let santa = null;
    function launchSanta() {
      if (santa) return;
      const dir = Math.random() < 0.5 ? 1 : -1;
      santa = {
        kind: 'santa',
        dir,
        x: dir > 0 ? -160 : W() + 160,
        baseY: Math.max(60, ground() - U.rand(170, 230)),
        drops: [U.rand(0.25, 0.45), U.rand(0.55, 0.8)],
        extra: 1,
        trail: 0
      };
      santa.y = santa.baseY;
      santa.pick = (px, py) => Math.abs(px - santa.x) < 70 && Math.abs(py - santa.y) < 30;
      santa.onClick = () => {
        DD.sound.play('ho');
        DD.bubbles.say(santa, 'Ho ho ho!', 2);
        if (santa.extra-- > 0) dropGift();
      };
      santa.bubbleAnchor = () => ({ x: santa.x, y: santa.y - 28 });
      DD.sound.play('jingle');
      ents.push(santa);
    }
    function dropGift() {
      if (ents.filter((e) => e.kind === 'gift').length >= 5) return;
      ents.push(Gift(santa.x - santa.dir * 20, santa.y + 8, santa.dir * 120));
    }
    function updateSanta(dt) {
      if (!santa) return;
      santa.x += santa.dir * 230 * dt;
      santa.y = santa.baseY + Math.sin(st.time * 2.4) * 10;
      const prog = santa.dir > 0 ? santa.x / W() : 1 - santa.x / W();
      if (santa.drops.length && prog > santa.drops[0]) {
        santa.drops.shift();
        dropGift();
        DD.sound.play('jingle');
      }
      if (Math.random() < 0.9)
        P.add({ x: santa.x - santa.dir * 30, y: santa.y + 10, vx: -santa.dir * 30, vy: U.rand(-10, 30), life: 1.2, shrink: true, draw: DD.paint.star(U.pick(['#fff3b0', '#ffd56b', '#ffffff']), U.rand(2, 4)) });
      if (santa.x < -220 || santa.x > W() + 220) {
        remove(santa);
        santa = null;
      }
    }
    function drawSanta(g) {
      if (!santa) return;
      const t = st.time;
      g.save();
      g.translate(santa.x, santa.y);
      g.scale(santa.dir, 1);
      // reins
      g.strokeStyle = '#7a4a2a';
      g.lineWidth = 1.2;
      g.beginPath();
      g.moveTo(10, -6);
      g.quadraticCurveTo(40, 4, 70, -2);
      g.lineTo(108, -2);
      g.stroke();
      // reindeer
      for (let i = 0; i < 2; i++) {
        const rx = 64 + i * 40,
          ry = -4 + Math.sin(t * 9 + i * 1.3) * 3;
        const leg = Math.sin(t * 14 + i) * 5;
        g.strokeStyle = '#6b4226';
        g.lineWidth = 2.4;
        g.lineCap = 'round';
        g.beginPath();
        g.moveTo(rx - 8, ry + 4);
        g.lineTo(rx - 12 - leg, ry + 14);
        g.moveTo(rx - 4, ry + 4);
        g.lineTo(rx - 2 + leg, ry + 14);
        g.moveTo(rx + 8, ry + 4);
        g.lineTo(rx + 12 + leg, ry + 13);
        g.moveTo(rx + 4, ry + 4);
        g.lineTo(rx + 2 - leg, ry + 14);
        g.stroke();
        g.fillStyle = '#9a6234';
        g.beginPath();
        g.ellipse(rx, ry, 14, 7, 0, 0, TAU);
        g.fill();
        g.fillStyle = '#f2e3c8';
        g.beginPath();
        g.ellipse(rx + 2, ry + 3, 8, 3, 0, 0, TAU);
        g.fill();
        g.fillStyle = '#9a6234';
        g.save();
        g.translate(rx + 12, ry - 6);
        g.rotate(-0.5);
        g.fillRect(-3, -8, 6, 12);
        g.restore();
        g.beginPath();
        g.ellipse(rx + 18, ry - 13, 6, 4.5, 0.2, 0, TAU);
        g.fill();
        g.fillStyle = '#1b1c2a';
        g.beginPath();
        g.arc(rx + 20, ry - 14.5, 1.1, 0, TAU);
        g.fill();
        g.fillStyle = i === 1 ? '#ff4a4a' : '#3a2214';
        g.beginPath();
        g.arc(rx + 24, ry - 12, i === 1 ? 2.2 : 1.6, 0, TAU);
        g.fill();
        if (i === 1) U.glow(g, rx + 24, ry - 12, 9, 'rgba(255,80,80,0.6)');
        g.strokeStyle = '#d9b07a';
        g.lineWidth = 1.6;
        g.beginPath();
        g.moveTo(rx + 16, ry - 17);
        g.lineTo(rx + 12, ry - 26);
        g.lineTo(rx + 8, ry - 28);
        g.moveTo(rx + 13, ry - 23);
        g.lineTo(rx + 17, ry - 28);
        g.moveTo(rx + 19, ry - 17);
        g.lineTo(rx + 22, ry - 26);
        g.stroke();
      }
      // sack
      g.fillStyle = '#8b5e34';
      g.beginPath();
      g.ellipse(-20, -14, 13, 14, -0.3, 0, TAU);
      g.fill();
      drawGiftBox(g, -24, -30, 10, '#3fa86b', '#ffd54d');
      drawGiftBox(g, -12, -28, 9, '#4a7be0', '#fff');
      // santa
      g.fillStyle = '#d42f2f';
      g.beginPath();
      g.ellipse(2, -14, 11, 12, 0, 0, TAU);
      g.fill();
      g.fillStyle = '#f3d2b5';
      g.beginPath();
      g.arc(6, -30, 7, 0, TAU);
      g.fill();
      g.fillStyle = '#fff';
      g.beginPath();
      g.ellipse(7, -24, 7, 6, 0, 0, Math.PI);
      g.fill();
      g.fillStyle = '#d42f2f';
      g.beginPath();
      g.moveTo(-1, -33);
      g.quadraticCurveTo(4, -48, 16, -40);
      g.lineTo(13, -33);
      g.closePath();
      g.fill();
      g.fillStyle = '#fff';
      g.fillRect(-2, -35, 15, 4);
      g.beginPath();
      g.arc(16, -40, 2.6, 0, TAU);
      g.fill();
      g.fillStyle = '#1b1c2a';
      g.beginPath();
      g.arc(9, -31, 1, 0, TAU);
      g.fill();
      // sleigh body
      const grd = g.createLinearGradient(0, -14, 0, 8);
      grd.addColorStop(0, '#e2433f');
      grd.addColorStop(1, '#9e1f22');
      g.fillStyle = grd;
      g.beginPath();
      g.moveTo(-36, -16);
      g.quadraticCurveTo(-40, 4, -22, 6);
      g.lineTo(18, 6);
      g.quadraticCurveTo(30, 4, 32, -8);
      g.lineTo(22, -8);
      g.quadraticCurveTo(14, -2, -6, -6);
      g.lineTo(-30, -8);
      g.closePath();
      g.fill();
      g.strokeStyle = '#f2c14e';
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(-40, 12);
      g.lineTo(28, 12);
      g.quadraticCurveTo(40, 12, 38, 2);
      g.moveTo(-24, 6);
      g.lineTo(-24, 12);
      g.moveTo(14, 6);
      g.lineTo(14, 12);
      g.stroke();
      g.restore();
    }

    /* ---------------- visitors: snowplough & yeti ---------------- */
    let visitor = null;
    function sendVisitor(kind) {
      if (visitor) return;
      const dir = Math.random() < 0.5 ? 1 : -1;
      visitor = { kind, dir, x: dir > 0 ? -90 : W() + 90, t: 0, stopT: kind === 'yeti' ? 2.6 : 0, stopped: false, hop: 0, vy: 0 };
      visitor.pick = (px, py) => Math.abs(px - visitor.x) < 45 && py > ground() - (kind === 'yeti' ? 80 : 46) && py < ground() + 4;
      visitor.bubbleAnchor = () => ({ x: visitor.x, y: ground() - (kind === 'yeti' ? 88 : 54) });
      visitor.onClick = () => {
        if (kind === 'yeti') {
          DD.sound.play('boom');
          visitor.vy = -420;
          DD.bubbles.say(visitor, U.pick(['RAWR! (hi)', 'Hug?', 'Boo!']), 1.8);
          if (env.weather) env.weather.burst(120);
        } else {
          DD.sound.play('honk');
          DD.bubbles.say(visitor, 'Clearing the way!', 1.6);
        }
      };
      visitor.kindTag = 'visitor';
      if (kind === 'plough') DD.sound.play('rev');
      else DD.sound.play('hoot');
    }
    function updateVisitor(dt) {
      if (!visitor) return;
      const v = visitor;
      v.t += dt;
      v.vy += GRAV * dt;
      v.hop = Math.min(0, v.hop + v.vy * dt);
      if (v.hop === 0) v.vy = 0;
      const speed = v.kind === 'plough' ? 170 : 70;
      const mid = Math.abs(v.x - W() / 2) < 6;
      if (v.kind === 'yeti' && mid && !v.stopped) {
        v.stopped = true;
        v.stopUntil = v.t + v.stopT;
        DD.bubbles.say(v, 'Rawr! 👋', 2.2);
        DD.sound.play('ho');
      }
      const waiting = v.stopUntil && v.t < v.stopUntil;
      if (!waiting) v.x += v.dir * speed * dt;
      const blade = v.x + v.dir * 42;
      if (v.kind === 'plough') {
        if (env.weather) env.weather.clearGround(blade - 14, blade + 14);
        for (const e of ents) {
          if (e.held || e.kind === 'santa') continue;
          const ahead = (e.x - blade) * v.dir;
          if (ahead > -8 && ahead < (e.r || 12)) {
            if (e.kind === 'ball') {
              e.x = blade + v.dir * (e.r + 2);
              e.vx = v.dir * speed;
            } else if (e.vy !== undefined && e.y >= ground() - 1) {
              e.vy = -520;
              e.vx = v.dir * 60;
            }
          }
        }
        if (Math.random() < 0.5) P.add({ x: v.x - v.dir * 30, y: ground() - 34, vx: -v.dir * 20, vy: -30, life: 1, alpha: 0.4, draw: DD.paint.sprite(flake, 9) });
      } else if (!waiting && Math.random() < dt * 3) {
        // heavy footsteps shake snow loose
        if (env.weather) env.weather.clearGround(v.x - 10, v.x + 10, false);
      }
      if (v.x < -140 || v.x > W() + 140) visitor = null;
    }
    function drawVisitor(g) {
      if (!visitor) return;
      const v = visitor;
      const t = st.time;
      g.save();
      g.translate(v.x, ground() + v.hop);
      g.scale(v.dir, 1);
      g.fillStyle = 'rgba(20,20,60,0.25)';
      g.beginPath();
      g.ellipse(0, 0, 40, 5, 0, 0, TAU);
      g.fill();
      if (v.kind === 'plough') {
        // blade
        g.fillStyle = '#f2b51f';
        g.beginPath();
        g.moveTo(34, 0);
        g.quadraticCurveTo(48, -12, 40, -26);
        g.lineTo(46, -26);
        g.quadraticCurveTo(56, -12, 44, 0);
        g.closePath();
        g.fill();
        g.fillStyle = '#fff';
        g.beginPath();
        g.ellipse(50, -4, 10, 6, 0, 0, TAU);
        g.fill();
        // truck
        g.fillStyle = '#ff7a1a';
        U.rrect(g, -36, -26, 70, 18, 4);
        g.fill();
        U.rrect(g, -4, -44, 30, 20, 4);
        g.fill();
        g.fillStyle = '#9fd8ff';
        U.rrect(g, 2, -40, 20, 11, 2);
        g.fill();
        g.fillStyle = '#333';
        g.fillRect(-30, -32, 4, 8);
        const on = Math.sin(t * 14) > 0;
        g.fillStyle = on ? '#ffd23f' : '#a87a10';
        U.rrect(g, 6, -50, 10, 6, 2);
        g.fill();
        if (on) U.glow(g, 11, -47, 22, 'rgba(255,200,40,0.7)');
        for (const wx of [-22, 20]) {
          g.fillStyle = '#1a1a22';
          g.beginPath();
          g.arc(wx, -8, 9, 0, TAU);
          g.fill();
          g.fillStyle = '#9aa0ad';
          g.beginPath();
          g.arc(wx, -8, 3.5, 0, TAU);
          g.fill();
        }
      } else {
        // yeti
        const walk = visitor.stopUntil && t < 0 ? 0 : Math.sin(v.t * 6);
        const waving = v.stopUntil && v.t < v.stopUntil;
        g.fillStyle = '#eef2ff';
        for (const [lx, ph] of [
          [-10, 0],
          [10, Math.PI]
        ]) {
          g.beginPath();
          g.ellipse(lx, -10 + (waving ? 0 : Math.sin(v.t * 6 + ph) * 2), 9, 12, 0, 0, TAU);
          g.fill();
        }
        g.beginPath();
        g.ellipse(0, -40, 26, 30, 0, 0, TAU);
        g.fill();
        // fur tufts
        g.fillStyle = '#d9e0f7';
        for (let i = 0; i < 9; i++) {
          const a = (i / 9) * Math.PI + Math.PI;
          g.beginPath();
          g.arc(Math.cos(a) * 24, -40 + Math.sin(a) * 28, 5, 0, TAU);
          g.fill();
        }
        // arms
        g.fillStyle = '#eef2ff';
        g.save();
        g.translate(22, -48);
        g.rotate(waving ? -2.3 + Math.sin(t * 10) * 0.4 : 0.3 + walk * 0.3);
        g.beginPath();
        g.ellipse(0, 14, 7, 16, 0, 0, TAU);
        g.fill();
        g.restore();
        g.save();
        g.translate(-22, -48);
        g.rotate(-0.3 - walk * 0.3);
        g.beginPath();
        g.ellipse(0, 14, 7, 16, 0, 0, TAU);
        g.fill();
        g.restore();
        // face
        g.fillStyle = '#7e8fc8';
        g.beginPath();
        g.ellipse(4, -52, 15, 12, 0, 0, TAU);
        g.fill();
        g.fillStyle = '#fff';
        for (const ex of [-2, 10]) {
          g.beginPath();
          g.arc(ex, -55, 3.4, 0, TAU);
          g.fill();
        }
        g.fillStyle = '#1b1c2a';
        for (const ex of [-1, 11]) {
          g.beginPath();
          g.arc(ex, -55, 1.7, 0, TAU);
          g.fill();
        }
        g.fillStyle = '#3a2440';
        g.beginPath();
        g.arc(5, -47, 6, 0.1, Math.PI - 0.1);
        g.fill();
        g.fillStyle = '#fff';
        g.fillRect(1, -47, 3, 3);
        g.fillRect(6, -47, 3, 3);
      }
      g.restore();
    }

    function dropSnowmen() {
      const men = ents.filter((e) => e.kind === 'snowman').length;
      const n = Math.max(1, Math.min(2, 4 - men));
      for (let i = 0; i < n; i++) {
        const m = Snowman(U.rand(W() * 0.25, W() * 0.75), U.rand(0.95, 1.2), randomStartOutfit());
        m.y = ground() - 360 - i * 80;
        m.vy = 0;
        ents.push(m);
      }
      DD.sound.play('jingle');
      dirty = true;
    }

    /* ---------------- stacking ---------------- */
    function findStackTarget(b, loose) {
      for (const e of ents) {
        if (e === b || (e.kind !== 'ball' && e.kind !== 'stack') || e.held) continue;
        if (e.kind === 'ball' && !e.onGround) continue;
        const topY = e.top();
        const dx = Math.abs(b.x - e.x);
        const reach = Math.max(e.r, b.r) * 0.95;
        if (loose) {
          if (dx < reach + b.r * 0.4 && b.y + b.r > topY - 30 && b.y < e.y + 4) return e;
        } else if (dx < reach && b.y + b.r >= topY - 2 && b.y < topY) return e;
      }
      return null;
    }
    function merge(b, target) {
      remove(b);
      if (target.kind === 'ball') {
        remove(target);
        const s = Stack(target.x, [target.r, b.r]);
        ents.push(s);
        s.y = ground();
        poof(s.x, s.top(), 12);
        DD.sound.play('crunch');
      } else {
        remove(target);
        const radii = target.radii.concat(b.r).sort((a, c) => c - a);
        const scale = U.clamp(radii[0] / 19, 0.95, 1.35);
        const m = Snowman(target.x, scale, randomStartOutfit());
        ents.push(m);
        poof(m.x, m.y - 50, 26);
        sparkle(m.x, m.y - 60, 20);
        DD.sound.play('jingle');
        DD.bubbles.say(m, U.pick(['Ta-da!', 'I’m alive!', 'Hello there!', 'Brrr, hi!']), 2.4);
        if (!localFlag('tipOutfit')) {
          setTimeout(() => DD.toast('✨ Double-click your snowman to dress it up'), 1600);
          setFlag('tipOutfit');
        }
      }
      idle = 0;
      dirty = true;
    }
    const flags = {};
    const localFlag = (k) => flags[k] || (saved && saved.flags && saved.flags[k]);
    const setFlag = (k) => (flags[k] = true);

    function remove(e) {
      const i = ents.indexOf(e);
      if (i >= 0) ents.splice(i, 1);
    }

    function spawnBall(x, y, r) {
      const b = Ball(x ?? U.rand(W() * 0.3, W() * 0.7), y ?? -20, r ?? U.rand(11, 17));
      b.vx = U.rand(-90, 90);
      ents.push(b);
      return b;
    }

    function randomOutfit() {
      const o = {};
      for (const tab of Object.keys(ITEMS)) {
        const opts = ITEMS[tab].filter((i) => (!i.pro || env.pro) && i.id !== 'none');
        o[tab] = U.pick(opts).id;
      }
      return o;
    }
    function randomStartOutfit() {
      return Object.assign({}, DEFAULT_OUTFIT, { hat: U.pick(['top', 'beanie', 'earmuffs']), clothes: U.pick(['scarf', 'striped']) });
    }

    /* ---------------- auto-build: balls hop onto each other when you leave them alone ---------------- */
    function autoBuild() {
      const balls = ents.filter((e) => e.kind === 'ball' && e.onGround && !e.held);
      const stacks = ents.filter((e) => e.kind === 'stack');
      const men = ents.filter((e) => e.kind === 'snowman').length;
      if (men >= 3) return;
      let base = stacks[0];
      let mover = null;
      if (base && balls.length) mover = balls.reduce((a, b) => (Math.abs(a.x - base.x) < Math.abs(b.x - base.x) ? a : b));
      else if (balls.length >= 2) {
        balls.sort((a, b) => b.r - a.r);
        base = balls[0];
        mover = balls[balls.length - 1];
      }
      if (!base || !mover) return;
      if (mover.r > base.r) mover.r = base.r * 0.85;
      const T = 0.65;
      const targetY = base.top() - mover.r;
      mover.vx = (base.x - mover.x) / T;
      mover.vy = (targetY - mover.y - 0.5 * GRAV * T * T) / T;
      DD.sound.play('pop');
    }

    /* ---------------- outfit panel ---------------- */
    function openOutfitPanel(m) {
      editing = m;
      const tabs = Object.keys(ITEMS).map((tab) => ({
        id: tab,
        label: tab[0].toUpperCase() + tab.slice(1),
        items: ITEMS[tab].map((it) => Object.assign({}, it, { draw: iconFor(tab, it.id) }))
      }));
      DD.panel.open({
        title: 'Fashion week, but colder.',
        tabs,
        x: m.x,
        y: m.y - 8,
        getSelected: (tab) => m.outfit[tab],
        isLocked: (item) => item.pro && !env.pro,
        onLocked: (item) => env.upsell(`The ${item.label.toLowerCase()}`),
        onSelect: (tab, id) => {
          m.outfit[tab] = id;
          m.squash = 0.12;
          sparkle(m.x, m.y + geom(m.s).cyM, 6);
          dirty = true;
        },
        onReset: () => {
          m.outfit = randomOutfit();
          m.squash = 0.15;
          dirty = true;
        },
        onClose: () => (editing = null),
        footer: env.pro ? null : () => `<span style="flex:1">Unlock every outfit and theme</span><button class="dd-btn gold" data-act="pro">${env.state.priceLabel || '$1'} lifetime</button>`,
        onFooter: () => env.api.openApp && env.api.openApp('pro')
      });
    }

    /* ---------------- persistence ---------------- */
    const saved = env.load();
    if (saved && Array.isArray(saved.ents)) {
      for (const e of saved.ents) {
        const x = U.clamp(e.x, 30, W() - 30);
        if (e.k === 'm') {
          const o = Object.assign({}, DEFAULT_OUTFIT, e.o);
          for (const tab of Object.keys(o)) if (!allowed(tab, o[tab])) o[tab] = DEFAULT_OUTFIT[tab];
          ents.push(Snowman(x, e.s || 1, o));
        } else if (e.k === 's') ents.push(Stack(x, e.r));
        else if (e.k === 'b') {
          const b = Ball(x, ground() - e.r, e.r);
          ents.push(b);
        }
      }
      spawnT = 12;
    } else {
      // first launch: a few balls tumble in right away
      setTimeout(() => spawnBall(st.w * 0.42, -20, 18), 600);
      setTimeout(() => spawnBall(st.w * 0.5, -20, 14), 1500);
      setTimeout(() => spawnBall(st.w * 0.58, -20, 11), 2400);
      spawnT = 25;
    }
    function persist() {
      const out = [];
      for (const e of ents) {
        if (e.kind === 'snowman') out.push({ k: 'm', x: Math.round(e.x), s: e.s, o: e.outfit });
        else if (e.kind === 'stack') out.push({ k: 's', x: Math.round(e.x), r: e.radii });
        else if (e.kind === 'ball') out.push({ k: 'b', x: Math.round(e.x), r: Math.round(e.r * 10) / 10 });
      }
      env.save({ ents: out, flags: Object.assign({}, saved && saved.flags, flags) });
    }

    const LINES = [
      'Brrr!',
      'Cold hands, warm heart.',
      'Hi! ☃️',
      'Got any carrots?',
      'I melt for you.',
      'Snow problem!',
      'Chill vibes only.',
      'Let it snow!',
      'Hehe, that tickles!',
      'Ice to meet you.'
    ];

    /* ---------------- public ---------------- */
    let saveT = 0;
    return {
      debug: () =>
        ents.map((e) => ({ kind: e.kind, x: Math.round(e.x), y: Math.round(e.y), r: e.r, top: e.top ? Math.round(e.top()) : 0 })),
      pick(x, y) {
        // panel takes priority (handled by DOM), then top-most entity
        if (visitor && visitor.pick(x, y)) return visitor;
        for (let i = ents.length - 1; i >= 0; i--) if (ents[i].pick && ents[i].pick(x, y)) return ents[i];
        return null;
      },
      action(name) {
        if (name === 'surprise' || name === 'santa') launchSanta();
        else if (name === 'snowmen') dropSnowmen();
        else if (name === 'plough' || name === 'yeti') {
          if (!env.pro) return env.upsell(name === 'yeti' ? 'The yeti' : 'The snowplough');
          sendVisitor(name);
        }
      },
      frame(dt) {
        const g = st.ctx;
        idle += dt;
        spawnT -= dt;
        santaT -= dt;
        const looseBalls = ents.filter((e) => e.kind === 'ball').length;
        if (spawnT <= 0) {
          spawnT = U.rand(18, 32);
          if (looseBalls < 6) spawnBall();
        }
        if (santaT <= 0) {
          santaT = U.rand(150, 260);
          launchSanta();
        }
        if (idle > 14 && Math.random() < dt * 0.25) {
          autoBuild();
          idle = 6;
        }
        // simple side collisions between resting balls
        for (let i = 0; i < ents.length; i++) {
          const a = ents[i];
          if (a.kind !== 'ball' || a.held) continue;
          for (let j = i + 1; j < ents.length; j++) {
            const b = ents[j];
            if (b.kind !== 'ball' || b.held) continue;
            const dx = b.x - a.x,
              dy = b.y - a.y;
            const d = Math.hypot(dx, dy) || 1;
            const overlap = a.r + b.r - d;
            if (overlap > 0 && Math.abs(dy) < Math.min(a.r, b.r)) {
              const nx = dx / d;
              a.x -= nx * overlap * 0.5;
              b.x += nx * overlap * 0.5;
              const rel = (b.vx - a.vx) * nx;
              if (rel < 0) {
                a.vx += rel * nx * 0.8;
                b.vx -= rel * nx * 0.8;
              }
            }
          }
        }
        for (const e of ents.slice()) if (e.update) e.update(dt);
        updateSanta(dt);
        updateVisitor(dt);
        // draw: ground things sorted by size so small ones are in front
        const sorted = ents.filter((e) => e.kind !== 'santa').sort((a, b) => (b.r || 0) - (a.r || 0));
        for (const e of sorted) e.draw(g);
        drawSanta(g);
        drawVisitor(g);
        saveT += dt;
        if (dirty && saveT > 3) {
          dirty = false;
          saveT = 0;
          persist();
        }
      }
    };
  }

  DD.themes.winter = { background, toys, ITEMS, drawSnowman };
})();
