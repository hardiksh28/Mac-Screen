/* Desk Diorama – shared renderer engine: math helpers, canvas stage, particles, sound, UI panel. */
(function () {
  const DD = (window.DD = window.DD || {});
  DD.themes = DD.themes || {};

  /* ----------------------------------------------------------- utils */
  const U = (DD.util = {
    rand: (a = 1, b) => (b === undefined ? Math.random() * a : a + Math.random() * (b - a)),
    irand: (a, b) => Math.floor(a + Math.random() * (b - a + 1)),
    pick: (arr) => arr[Math.floor(Math.random() * arr.length)],
    clamp: (v, a, b) => (v < a ? a : v > b ? b : v),
    lerp: (a, b, t) => a + (b - a) * t,
    ease: (t) => t * t * (3 - 2 * t),
    dist: (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by),
    rng(seed) {
      let a = seed >>> 0;
      return function () {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    },
    canvas(w, h) {
      const c = document.createElement('canvas');
      c.width = Math.max(1, Math.ceil(w));
      c.height = Math.max(1, Math.ceil(h));
      return c;
    },
    /* Offscreen layer in CSS pixels, drawn at device resolution. */
    layer(w, h, dpr, draw) {
      const c = U.canvas(w * dpr, h * dpr);
      const g = c.getContext('2d');
      g.scale(dpr, dpr);
      draw(g, w, h);
      return c;
    },
    /* Midpoint-displacement ridge line. Returns [[x,y],...] */
    ridge(rnd, x0, x1, baseY, amp, rough = 0.55, depth = 8) {
      let pts = [
        [x0, baseY - rnd() * amp],
        [x1, baseY - rnd() * amp]
      ];
      let disp = amp;
      for (let d = 0; d < depth; d++) {
        const next = [pts[0]];
        for (let i = 0; i < pts.length - 1; i++) {
          const a = pts[i],
            b = pts[i + 1];
          const mx = (a[0] + b[0]) / 2;
          let my = (a[1] + b[1]) / 2 + (rnd() - 0.5) * disp;
          my = Math.min(baseY, Math.max(baseY - amp * 1.25, my));
          next.push([mx, my], b);
        }
        pts = next;
        disp *= rough;
      }
      return pts;
    },
    glow(g, x, y, r, color, alpha = 1) {
      const grd = g.createRadialGradient(x, y, 0, x, y, r);
      grd.addColorStop(0, color);
      grd.addColorStop(1, 'rgba(0,0,0,0)');
      g.save();
      g.globalAlpha = alpha;
      g.fillStyle = grd;
      g.beginPath();
      g.arc(x, y, r, 0, Math.PI * 2);
      g.fill();
      g.restore();
    },
    rrect(g, x, y, w, h, r) {
      r = Math.min(r, w / 2, h / 2);
      g.beginPath();
      g.moveTo(x + r, y);
      g.arcTo(x + w, y, x + w, y + h, r);
      g.arcTo(x + w, y + h, x, y + h, r);
      g.arcTo(x, y + h, x, y, r);
      g.arcTo(x, y, x + w, y, r);
      g.closePath();
    },
    /* Soft round sprite for snow / dust / bokeh. */
    dot(color, r = 16) {
      const c = U.canvas(r * 2, r * 2);
      const g = c.getContext('2d');
      const grd = g.createRadialGradient(r, r, 0, r, r, r);
      grd.addColorStop(0, color);
      grd.addColorStop(0.45, color);
      grd.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = grd;
      g.fillRect(0, 0, r * 2, r * 2);
      return c;
    },
    hsl: (h, s, l, a = 1) => `hsla(${h},${s}%,${l}%,${a})`,
    shade(hex, amt) {
      // amt -1..1 darken/lighten
      let c = hex.replace('#', '');
      if (c.length === 3) c = c.split('').map((x) => x + x).join('');
      const n = parseInt(c, 16);
      let r = (n >> 16) & 255,
        g = (n >> 8) & 255,
        b = n & 255;
      const t = amt < 0 ? 0 : 255;
      const p = Math.abs(amt);
      r = Math.round((t - r) * p + r);
      g = Math.round((t - g) * p + g);
      b = Math.round((t - b) * p + b);
      return `rgb(${r},${g},${b})`;
    }
  });

  /* ----------------------------------------------------------- alpine mountains */
  // Height field built from distinct peaks + small jaggedness. Returns [[x,y],...] every 2px.
  DD.alps = function (rnd, W, baseY, amp, count) {
    const peaks = [];
    for (let i = 0; i < count; i++) {
      peaks.push({
        x: ((i + 0.2 + rnd() * 0.6) / count) * (W + 200) - 100,
        h: amp * (0.45 + rnd() * 0.55),
        sl: (0.8 + rnd() * 2.2) * (amp / 300),
        sr: (0.8 + rnd() * 2.2) * (amp / 300)
      });
    }
    const ph = [rnd() * 9, rnd() * 9, rnd() * 9, rnd() * 9];
    const k = amp / 140;
    const pts = [];
    for (let x = -20; x <= W + 20; x += 2) {
      let h = 0;
      for (const p of peaks) {
        const d = x - p.x;
        const v = p.h - (d < 0 ? -d * p.sl : d * p.sr);
        if (v > h) h = v;
      }
      h += (Math.sin(x * 0.045 + ph[0]) * 4 + Math.sin(x * 0.11 + ph[1]) * 2.2 + Math.sin(x * 0.27 + ph[2]) * 1.1 + Math.sin(x * 0.6 + ph[3]) * 0.6) * k;
      pts.push([x, baseY - Math.max(0, h)]);
    }
    return pts;
  };
  // Shade slopes that face away from the light (light from the upper right), plus couloir streaks.
  DD.shadeAlps = function (g, pts, baseY, color, rnd) {
    g.fillStyle = color;
    g.beginPath();
    let open = false;
    for (let i = 1; i < pts.length; i++) {
      const [x, y] = pts[i];
      const rising = y < pts[i - 1][1] - 0.15; // height increases to the right → faces left → shade
      if (rising) {
        if (!open) {
          g.moveTo(pts[i - 1][0], baseY + 2);
          g.lineTo(pts[i - 1][0], pts[i - 1][1]);
          open = true;
        }
        g.lineTo(x, y);
      } else if (open) {
        g.lineTo(pts[i - 1][0], baseY + 2);
        g.closePath();
        open = false;
      }
    }
    if (open) {
      g.lineTo(pts[pts.length - 1][0], baseY + 2);
      g.closePath();
    }
    g.fill();
    // couloirs
    g.lineCap = 'round';
    for (let i = 3; i < pts.length - 3; i++) {
      const [x, y] = pts[i];
      const peak = y < pts[i - 3][1] && y < pts[i + 3][1];
      if (!peak) continue;
      for (let k = 0; k < 4; k++) {
        let cx = x,
          cy = y + 2;
        const dir = rnd() < 0.5 ? -1 : 1;
        const len = 6 + rnd() * 10;
        g.beginPath();
        g.moveTo(cx, cy);
        for (let j = 0; j < len; j++) {
          cx += dir * (1 + rnd() * 2.5);
          cy += 2 + rnd() * 3;
          g.lineTo(cx, cy);
        }
        g.strokeStyle = dir < 0 ? 'rgba(255,255,255,0.22)' : 'rgba(30,24,90,0.25)';
        g.lineWidth = 0.8 + rnd() * 1.4;
        g.stroke();
      }
    }
  };

  /* ----------------------------------------------------------- stage */
  DD.createStage = function (canvas, opts = {}) {
    const ctx = canvas.getContext('2d');
    const st = {
      canvas,
      ctx,
      w: 0,
      h: 0,
      dpr: 1,
      fps: opts.fps || 60,
      paused: false,
      time: 0,
      onResize: [],
      onFrame: null
    };
    function resize() {
      st.dpr = Math.min(window.devicePixelRatio || 1, opts.maxDpr || 2);
      st.w = window.innerWidth;
      st.h = window.innerHeight;
      canvas.width = Math.round(st.w * st.dpr);
      canvas.height = Math.round(st.h * st.dpr);
      canvas.style.width = st.w + 'px';
      canvas.style.height = st.h + 'px';
      ctx.setTransform(st.dpr, 0, 0, st.dpr, 0, 0);
      st.onResize.forEach((f) => f(st));
    }
    let last = performance.now();
    let acc = 0;
    function loop(now) {
      requestAnimationFrame(loop);
      const elapsed = now - last;
      last = now;
      if (st.paused) return;
      acc += elapsed;
      const minStep = 1000 / st.fps - 2;
      if (acc < minStep) return;
      const dt = Math.min(acc / 1000, 0.05);
      acc = 0;
      st.time += dt;
      if (st.onFrame) {
        ctx.setTransform(st.dpr, 0, 0, st.dpr, 0, 0);
        st.onFrame(dt, st.time);
      }
    }
    let rt = null;
    window.addEventListener('resize', () => {
      clearTimeout(rt);
      rt = setTimeout(resize, 120);
    });
    resize();
    requestAnimationFrame(loop);
    st.resize = resize;
    return st;
  };

  /* ----------------------------------------------------------- particles */
  DD.Particles = class {
    constructor(max = 600) {
      this.list = [];
      this.max = max;
    }
    add(p) {
      if (this.list.length >= this.max) this.list.shift();
      p.life = p.life ?? 1;
      p.age = 0;
      p.vx = p.vx || 0;
      p.vy = p.vy || 0;
      p.g = p.g || 0;
      p.drag = p.drag ?? 0;
      p.rot = p.rot || 0;
      p.vr = p.vr || 0;
      this.list.push(p);
      return p;
    }
    burst(x, y, n, make) {
      for (let i = 0; i < n; i++) this.add(Object.assign({ x, y }, make(i)));
    }
    update(dt) {
      const L = this.list;
      for (let i = L.length - 1; i >= 0; i--) {
        const p = L[i];
        p.age += dt;
        if (p.age >= p.life) {
          L.splice(i, 1);
          continue;
        }
        p.vy += p.g * dt;
        if (p.drag) {
          const k = Math.max(0, 1 - p.drag * dt);
          p.vx *= k;
          p.vy *= k;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += p.vr * dt;
        if (p.update) p.update(p, dt);
      }
    }
    draw(g) {
      for (const p of this.list) {
        const t = p.age / p.life;
        const a = p.fade === false ? 1 : 1 - t * t;
        g.save();
        g.globalAlpha = a * (p.alpha ?? 1);
        if (p.blend) g.globalCompositeOperation = p.blend;
        g.translate(p.x, p.y);
        if (p.rot) g.rotate(p.rot);
        p.draw(g, p, t);
        g.restore();
      }
    }
    get count() {
      return this.list.length;
    }
  };

  // Common particle painters
  DD.paint = {
    circle: (color, r) => (g, p, t) => {
      g.fillStyle = color;
      g.beginPath();
      g.arc(0, 0, r * (p.shrink ? 1 - t : 1), 0, Math.PI * 2);
      g.fill();
    },
    sprite: (img, size) => (g, p, t) => {
      const s = size * (p.shrink ? 1 - t * 0.8 : 1);
      g.drawImage(img, -s / 2, -s / 2, s, s);
    },
    confetti: (color) => (g, p) => {
      g.fillStyle = color;
      g.scale(1, Math.cos(p.age * 9 + p.x));
      g.fillRect(-4, -2.5, 8, 5);
    },
    star: (color, r) => (g, p, t) => {
      const s = r * (1 - t * 0.6);
      g.fillStyle = color;
      g.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const rr = i % 2 ? s * 0.35 : s;
        g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
      }
      g.closePath();
      g.fill();
    }
  };

  /* ----------------------------------------------------------- draggable ground prop */
  // A thing that stands on the Dock: can be picked up, thrown, and falls back down.
  // spec: { x, w, h, draw(g, prop), groundFn, widthFn, onClick, onDblClick, onLand, bounce }
  DD.prop = function (spec) {
    const p = Object.assign(
      { y: spec.groundFn(), vx: 0, vy: 0, held: false, tilt: 0, squash: 0, lift: 0, kind: 'prop' },
      spec
    );
    p.pick = (px, py) => Math.abs(px - p.x) < p.w / 2 + 4 && py > p.y - p.lift - p.h - 4 && py < p.y - p.lift + 6;
    p.bubbleAnchor = () => ({ x: p.x, y: p.y - p.lift - p.h - 6 });
    p.onGrab = () => {
      p.held = true;
      spec.onGrab && spec.onGrab(p);
    };
    p.onDrag = (px, py) => {
      p.tilt = U.clamp((px - p.x) * 0.03, -0.5, 0.5);
      p.x = px;
      p.y = Math.min(spec.groundFn(), py + p.h / 2);
    };
    p.onRelease = (vx, vy) => {
      p.held = false;
      p.vx = vx * 0.5;
      p.vy = vy * 0.5;
      spec.onRelease && spec.onRelease(p);
    };
    p.update = (dt) => {
      p.squash *= Math.max(0, 1 - 8 * dt);
      if (!p.held) p.tilt *= Math.max(0, 1 - 6 * dt);
      if (p.held) return;
      const G = spec.groundFn();
      p.vy += 2000 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= Math.max(0, 1 - 3 * dt);
      if (p.y >= G) {
        if (p.vy > 450) {
          p.squash = 0.18;
          spec.onLand && spec.onLand(p, p.vy);
        }
        p.y = G;
        p.vy = Math.abs(p.vy) > 300 && p.bounce ? -p.vy * p.bounce : 0;
      }
      const W = spec.widthFn();
      if (p.x < p.w / 2) {
        p.x = p.w / 2;
        p.vx = Math.abs(p.vx) * 0.4;
      }
      if (p.x > W - p.w / 2) {
        p.x = W - p.w / 2;
        p.vx = -Math.abs(p.vx) * 0.4;
      }
    };
    p.render = (g) => {
      g.save();
      g.translate(p.x, p.y - p.lift);
      g.rotate(p.tilt);
      g.scale(1 + p.squash, 1 - p.squash);
      p.draw(g, p);
      g.restore();
    };
    return p;
  };

  /* ----------------------------------------------------------- sound (tiny synth, no audio files) */
  DD.sound = (function () {
    let ac = null;
    let enabled = true;
    const ctx = () => {
      if (!ac) {
        try {
          ac = new (window.AudioContext || window.webkitAudioContext)();
        } catch {
          return null;
        }
      }
      if (ac.state === 'suspended') ac.resume();
      return ac;
    };
    function tone(freq, dur, { type = 'sine', vol = 0.15, slide = 0, delay = 0, attack = 0.005 } = {}) {
      const a = ctx();
      if (!a) return;
      const t0 = a.currentTime + delay;
      const o = a.createOscillator();
      const g = a.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, t0);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t0 + dur);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol, t0 + attack);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g).connect(a.destination);
      o.start(t0);
      o.stop(t0 + dur + 0.05);
    }
    function noise(dur, { vol = 0.12, freq = 1200, q = 0.8, delay = 0, type = 'bandpass' } = {}) {
      const a = ctx();
      if (!a) return;
      const t0 = a.currentTime + delay;
      const len = Math.floor(a.sampleRate * dur);
      const buf = a.createBuffer(1, len, a.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = a.createBufferSource();
      src.buffer = buf;
      const f = a.createBiquadFilter();
      f.type = type;
      f.frequency.value = freq;
      f.Q.value = q;
      const g = a.createGain();
      g.gain.value = vol;
      src.connect(f).connect(g).connect(a.destination);
      src.start(t0);
    }
    const lib = {
      pop: () => tone(520, 0.09, { type: 'triangle', slide: 300, vol: 0.12 }),
      thud: () => noise(0.12, { freq: 300, vol: 0.18, type: 'lowpass' }),
      crunch: () => noise(0.16, { freq: 2500, vol: 0.09, q: 0.4 }),
      jingle: () => {
        [1568, 1976, 2349, 1976, 2637].forEach((f, i) => {
          tone(f, 0.35, { type: 'triangle', vol: 0.05, delay: i * 0.07 });
          tone(f * 2.01, 0.2, { type: 'sine', vol: 0.02, delay: i * 0.07 });
        });
      },
      magic: () => {
        [880, 1175, 1397, 1760, 2349].forEach((f, i) => tone(f, 0.5, { type: 'sine', vol: 0.05, delay: i * 0.05 }));
      },
      chime: () => {
        tone(1318, 0.6, { vol: 0.07 });
        tone(1976, 0.6, { vol: 0.04, delay: 0.08 });
      },
      giggle: () => {
        [660, 740, 620, 780].forEach((f, i) => tone(f, 0.08, { type: 'square', vol: 0.025, delay: i * 0.08, slide: 60 }));
      },
      hoot: () => {
        tone(420, 0.25, { vol: 0.12, slide: -60 });
        tone(400, 0.45, { vol: 0.12, slide: -90, delay: 0.32 });
      },
      honk: () => {
        tone(330, 0.22, { type: 'sawtooth', vol: 0.06 });
        tone(415, 0.22, { type: 'sawtooth', vol: 0.05 });
      },
      rev: () => {
        tone(70, 0.9, { type: 'sawtooth', vol: 0.06, slide: 160, attack: 0.05 });
        noise(0.8, { freq: 200, vol: 0.06, type: 'lowpass' });
      },
      screech: () => noise(0.45, { freq: 3200, vol: 0.05, q: 6 }),
      bubble: () => tone(U.rand(500, 900), 0.12, { type: 'sine', vol: 0.08, slide: 600 }),
      splash: () => noise(0.3, { freq: 900, vol: 0.08 }),
      whoosh: () => noise(0.6, { freq: 600, vol: 0.06, q: 0.5 }),
      boom: () => {
        noise(0.7, { freq: 160, vol: 0.2, type: 'lowpass' });
        tone(90, 0.5, { vol: 0.1, slide: -50 });
      },
      sparkle: () => tone(U.rand(1800, 2600), 0.15, { vol: 0.02 }),
      paper: () => noise(0.25, { freq: 4000, vol: 0.05, q: 0.3 }),
      coin: () => {
        tone(988, 0.08, { type: 'square', vol: 0.03 });
        tone(1319, 0.3, { type: 'square', vol: 0.03, delay: 0.08 });
      },
      ho: () => {
        [0, 0.28, 0.56].forEach((d) => tone(150, 0.22, { type: 'sawtooth', vol: 0.04, delay: d, slide: -25 }));
      }
    };
    return {
      set enabled(v) {
        enabled = !!v;
      },
      get enabled() {
        return enabled;
      },
      play(name) {
        if (!enabled || !lib[name]) return;
        try {
          lib[name]();
        } catch {}
      }
    };
  })();

  /* ----------------------------------------------------------- speech bubbles (canvas) */
  DD.bubbles = {
    list: [],
    say(target, text, dur = 2.6) {
      this.list = this.list.filter((b) => b.target !== target);
      this.list.push({ target, text, age: 0, dur });
    },
    draw(g, dt) {
      for (let i = this.list.length - 1; i >= 0; i--) {
        const b = this.list[i];
        b.age += dt;
        if (b.age > b.dur) {
          this.list.splice(i, 1);
          continue;
        }
        const anchor = b.target.bubbleAnchor ? b.target.bubbleAnchor() : { x: b.target.x, y: b.target.y - 60 };
        const pop = Math.min(1, b.age * 6);
        const fade = Math.min(1, (b.dur - b.age) * 4);
        g.save();
        g.globalAlpha = fade;
        g.font = '600 13px -apple-system, BlinkMacSystemFont, "SF Pro Rounded", "Segoe UI", sans-serif';
        const tw = g.measureText(b.text).width;
        const w = tw + 22,
          h = 28;
        let x = anchor.x - w / 2;
        x = Math.max(6, Math.min(g.canvas.width / (window.devicePixelRatio || 1) - w - 6, x));
        const y = anchor.y - h - 10;
        g.translate(anchor.x, anchor.y);
        g.scale(0.6 + 0.4 * pop, 0.6 + 0.4 * pop);
        g.translate(-anchor.x, -anchor.y);
        g.shadowColor = 'rgba(0,0,0,0.25)';
        g.shadowBlur = 10;
        g.shadowOffsetY = 3;
        g.fillStyle = 'rgba(255,255,255,0.96)';
        U.rrect(g, x, y, w, h, 14);
        g.fill();
        g.beginPath();
        g.moveTo(anchor.x - 6, y + h - 1);
        g.lineTo(anchor.x, y + h + 8);
        g.lineTo(anchor.x + 6, y + h - 1);
        g.fill();
        g.shadowColor = 'transparent';
        g.fillStyle = '#1d1f33';
        g.textBaseline = 'middle';
        g.fillText(b.text, x + 11, y + h / 2 + 1);
        g.restore();
      }
    }
  };

  /* ----------------------------------------------------------- glass panel (DOM) */
  DD.panel = (function () {
    let el = null;
    let current = null;
    function close() {
      if (!el) return;
      const node = el;
      node.classList.add('closing');
      setTimeout(() => node.remove(), 160);
      el = null;
      const c = current;
      current = null;
      if (c && c.onClose) c.onClose();
    }
    function render() {
      const o = current;
      const tab = o.tabs.find((t) => t.id === o.activeTab) || o.tabs[0];
      el.querySelector('.dd-tabs').innerHTML = o.tabs
        .map((t) => `<button class="dd-tab ${t.id === tab.id ? 'on' : ''}" data-tab="${t.id}">${t.label}</button>`)
        .join('');
      const grid = el.querySelector('.dd-grid');
      grid.innerHTML = '';
      const sel = o.getSelected ? o.getSelected(tab.id) : null;
      tab.items.forEach((item) => {
        const b = document.createElement('button');
        const locked = o.isLocked ? o.isLocked(item, tab) : false;
        b.className = 'dd-item' + (sel === item.id ? ' on' : '') + (locked ? ' locked' : '');
        b.title = item.label + (locked ? ' — Pro' : '');
        const c = document.createElement('canvas');
        const s = 44;
        const dpr = window.devicePixelRatio || 1;
        c.width = s * dpr;
        c.height = s * dpr;
        c.style.width = s + 'px';
        c.style.height = s + 'px';
        const g = c.getContext('2d');
        g.scale(dpr, dpr);
        try {
          item.draw && item.draw(g, s);
        } catch (e) {
          console.warn(e);
        }
        b.appendChild(c);
        const l = document.createElement('span');
        l.textContent = item.label;
        b.appendChild(l);
        if (locked) {
          const k = document.createElement('i');
          k.className = 'dd-lock';
          k.innerHTML =
            '<svg viewBox="0 0 16 16" width="10" height="10"><path fill="currentColor" d="M4.5 7V5a3.5 3.5 0 1 1 7 0v2h.5a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h.5Zm1.5 0h4V5a2 2 0 1 0-4 0v2Z"/></svg>';
          b.appendChild(k);
        }
        b.addEventListener('click', () => {
          if (locked) {
            o.onLocked && o.onLocked(item, tab);
            return;
          }
          DD.sound.play('pop');
          o.onSelect(tab.id, item.id, item);
          render();
        });
        grid.appendChild(b);
      });
      const foot = el.querySelector('.dd-foot');
      foot.innerHTML = o.footer ? o.footer() : '';
      foot.style.display = o.footer ? '' : 'none';
      foot.querySelectorAll('[data-act]').forEach((n) =>
        n.addEventListener('click', () => o.onFooter && o.onFooter(n.dataset.act))
      );
    }
    function open(o) {
      if (el) {
        el.remove();
        el = null;
      }
      current = Object.assign({ activeTab: o.tabs[0].id }, o);
      el = document.createElement('div');
      el.className = 'dd-panel dd-ui';
      el.innerHTML = `
        <div class="dd-head"><div class="dd-title"></div>
          <div class="dd-actions">
            ${o.onReset ? '<button class="dd-icon" data-a="reset" title="Shuffle"><svg viewBox="0 0 16 16" width="12" height="12"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M13 8a5 5 0 1 1-1.5-3.6M13 2.5V5h-2.5"/></svg></button>' : ''}
            <button class="dd-icon" data-a="close" title="Close"><svg viewBox="0 0 16 16" width="11" height="11"><path stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M4 4l8 8M12 4l-8 8"/></svg></button>
          </div></div>
        <div class="dd-tabs"></div><div class="dd-grid"></div><div class="dd-foot"></div>`;
      el.querySelector('.dd-title').textContent = o.title;
      el.querySelector('[data-a=close]').onclick = close;
      const r = el.querySelector('[data-a=reset]');
      if (r)
        r.onclick = () => {
          o.onReset();
          DD.sound.play('pop');
          render();
        };
      el.querySelector('.dd-tabs').addEventListener('click', (e) => {
        const t = e.target.closest('[data-tab]');
        if (!t) return;
        current.activeTab = t.dataset.tab;
        render();
      });
      document.body.appendChild(el);
      render();
      // position beside the anchor, kept on screen
      const pw = el.offsetWidth,
        ph = el.offsetHeight;
      const W = window.innerWidth,
        H = window.innerHeight;
      let x = o.x + 40;
      if (x + pw > W - 12) x = o.x - pw - 40;
      x = U.clamp(x, 12, W - pw - 12);
      const y = U.clamp(o.y - ph, 12, H - ph - 12);
      el.style.left = x + 'px';
      el.style.top = y + 'px';
    }
    return {
      open,
      close,
      refresh: () => el && render(),
      get isOpen() {
        return !!el;
      }
    };
  })();

  /* ----------------------------------------------------------- toast + card (DOM) */
  DD.toast = function (html, ms = 3200) {
    const t = document.createElement('div');
    t.className = 'dd-toast dd-ui';
    t.innerHTML = html;
    document.body.appendChild(t);
    requestAnimationFrame(() => t.classList.add('in'));
    setTimeout(() => {
      t.classList.remove('in');
      setTimeout(() => t.remove(), 300);
    }, ms);
    return t;
  };

  DD.card = function ({ x, y, html, onClose }) {
    const c = document.createElement('div');
    c.className = 'dd-card dd-ui';
    c.innerHTML = html + '<button class="dd-card-close">Close</button>';
    document.body.appendChild(c);
    const W = window.innerWidth,
      H = window.innerHeight;
    c.style.left = U.clamp(x - c.offsetWidth / 2, 12, W - c.offsetWidth - 12) + 'px';
    c.style.top = U.clamp(y - c.offsetHeight, 12, H - c.offsetHeight - 12) + 'px';
    requestAnimationFrame(() => c.classList.add('in'));
    const close = () => {
      c.classList.remove('in');
      setTimeout(() => c.remove(), 250);
      onClose && onClose();
    };
    c.querySelector('.dd-card-close').onclick = close;
    return { close, el: c };
  };

  /* ----------------------------------------------------------- browser mock (preview page / development) */
  DD.mockApi = function () {
    const KEY = 'dd-mock-settings';
    const base = {
      theme: 'winter',
      wallpaper: true,
      toys: true,
      sound: true,
      fps: 60,
      cursorEffects: true,
      pauseOnBattery: true,
      launchAtLogin: false,
      themeState: {},
      weather: { type: 'auto', amount: 'medium', wind: 'calm', paused: false, onWindows: true },
      decorations: []
    };
    let s;
    try {
      s = Object.assign({}, base, JSON.parse(localStorage.getItem(KEY) || '{}'));
    } catch {
      s = base;
    }
    const opts = window.__DD_PREVIEW || {};
    if (opts.theme) s.theme = opts.theme;
    let decorating = false;
    try {
      decorating = sessionStorage.getItem('dd-decorating') === '1';
    } catch {}
    const save = () => {
      try {
        localStorage.setItem(KEY, JSON.stringify(s));
      } catch {}
    };
    const subs = { state: [], action: [], windows: [] };
    const state = () => ({
      role: opts.role || 'overlay',
      settings: s,
      pro: opts.pro ?? true,
      theme: s.theme,
      paused: false,
      decorating,
      isPrimary: true,
      groundInset: opts.groundInset ?? 74,
      platform: 'darwin',
      priceLabel: '$1',
      storeConfigured: false,
      previewing: false
    });
    const fire = () => {
      const st = state();
      subs.state.forEach((f) => f(JSON.parse(JSON.stringify(st))));
    };
    return {
      mock: true,
      getState: async () => JSON.parse(JSON.stringify(state())),
      setSetting: async (k, v) => {
        s[k] = v;
        save();
        fire();
      },
      setInteractive: (on) => {
        // preview page: emulate Electron's click-through window
        const c = document.getElementById('toys');
        if (c) c.style.pointerEvents = on ? 'auto' : 'none';
      },
      saveThemeState: (id, d) => {
        s.themeState[id] = d;
        save();
      },
      saveDecorations: (list) => {
        s.decorations = JSON.parse(JSON.stringify(list));
        save();
      },
      setDecorating: (on) => {
        try {
          sessionStorage.setItem('dd-decorating', on ? '1' : '0');
        } catch {}
        decorating = !!on;
        fire();
      },
      openApp: () => DD.toast('In the app this opens the <b>Unlock Pro</b> screen.'),
      onState: (cb) => subs.state.push(cb),
      onAction: (cb) => subs.action.push(cb),
      onWindows: (cb) => subs.windows.push(cb),
      _fireAction: (n) => subs.action.forEach((f) => f(n)),
      _fireWindows: (list) => subs.windows.forEach((f) => f(list))
    };
  };
})();
