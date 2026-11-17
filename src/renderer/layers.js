/* Wires a theme into the wallpaper layer (behind desktop icons) or the toy layer (on top of the Dock). */
(function () {
  const DD = window.DD;

  function getApi() {
    return window.diorama || (DD._mock = DD._mock || DD.mockApi());
  }

  function watchState(api, state, stage, onReload, onChange) {
    if (!api.onState) return;
    api.onState((next) => {
      if (next.theme !== state.theme || next.pro !== state.pro || !!next.decorating !== !!state.decorating) return onReload();
      if (stage.role === 'wallpaper' && next.scene && state.scene && next.scene.url !== state.scene.url) return onReload();
      DD.sound.enabled = next.settings.sound;
      stage.paused = !!next.paused;
      if (next.settings.fps && stage.role === 'wallpaper') stage.fps = next.settings.fps;
      Object.assign(state, next);
      onChange && onChange(next);
    });
  }

  /* ------------------------------------------------------------------ wallpaper */
  DD.startWallpaper = async function (canvas, opts = {}) {
    const api = opts.api || getApi();
    const state = await api.getState();
    const themeId = opts.theme || state.theme;
    const theme = DD.themes[themeId] || DD.themes.winter;
    const stage = DD.createStage(canvas, { fps: opts.fps || state.settings.fps || 30, maxDpr: 2 });
    stage.role = 'wallpaper';
    stage.paused = !!state.paused;
    const env = { stage, state, util: DD.util };
    // painted artwork if available (assets/wallpapers or the user's own picture), else drawn in code
    const sceneUrl = opts.sceneUrl !== undefined ? opts.sceneUrl : state.scene && state.scene.url;
    const analysis = opts.sceneUrl !== undefined ? null : state.scene && state.scene.analysis;
    const bg = (sceneUrl && (await DD.paintedBackground(env, sceneUrl, themeId, analysis))) || theme.background(env);
    stage.onFrame = (dt, t) => {
      bg.frame(dt, t);
      if (state.isPrimary !== false && !state.decorating && DD.decor) DD.decor.drawAll(stage.ctx, state.settings.decorations, t);
    };
    if (api.onAction) api.onAction((name) => bg.action && bg.action(name));
    watchState(api, state, stage, () => location.reload());
    return { stage, bg };
  };

  /* ------------------------------------------------------------------ toys */
  DD.startOverlay = async function (canvas, opts = {}) {
    const api = opts.api || getApi();
    const state = await api.getState();
    const themeId = opts.theme || state.theme;
    const theme = DD.themes[themeId] || DD.themes.winter;
    DD.sound.enabled = !!state.settings.sound;
    const stage = DD.createStage(canvas, { fps: 60, maxDpr: 2 });
    stage.role = 'overlay';
    stage.paused = !!state.paused;

    let saveTimer = null;
    const pointer = { x: -1e4, y: -1e4, vx: 0, vy: 0, t: performance.now(), inside: false };
    const env = {
      stage,
      api,
      state,
      util: DD.util,
      pointer,
      particles: new DD.Particles(1400),
      get ground() {
        return stage.h - (state.groundInset || 6);
      },
      get pro() {
        return !!state.pro;
      },
      get cursorEffects() {
        return state.settings.cursorEffects !== false;
      },
      load() {
        return (state.settings.themeState && state.settings.themeState[themeId]) || null;
      },
      save(data) {
        clearTimeout(saveTimer);
        saveTimer = setTimeout(() => api.saveThemeState(themeId, data), 1200);
      },
      upsell(what) {
        const price = state.priceLabel || '$1';
        const t = DD.toast(`🔒 ${what} is part of Pro · <a data-up>Unlock everything for ${price}</a>`, 4500);
        const a = t.querySelector('[data-up]');
        if (a) a.onclick = () => api.openApp && api.openApp('pro');
      }
    };

    env.weather = DD.createWeather(env);
    window.__weather = env.weather;
    const noToys = { pick: () => null, frame: () => {} };
    const toys = state.decorating ? DD.decor.editor(env) : state.settings.toys !== false ? theme.toys(env) : noToys;
    if (toys.debug) window.__dbg = toys.debug;
    if (api.onWindows) api.onWindows((list) => env.weather.setWindows(list));

    /* -------- pointer routing: click-through everywhere except over toys and panels -------- */
    let interactive = false;
    let down = null; // { ent, x, y, dragging }
    function setInteractive(v) {
      if (v === interactive) return;
      interactive = v;
      api.setInteractive && api.setInteractive(v);
    }
    const overUI = (x, y) => {
      const el = document.elementFromPoint(x, y);
      return !!(el && el.closest && el.closest('.dd-ui'));
    };
    const pick = (x, y) => (toys.pick ? toys.pick(x, y) : null);

    function updateHover(x, y) {
      if (down) return;
      const ent = pick(x, y);
      const ui = overUI(x, y);
      setInteractive(!!ent || ui);
      document.body.classList.toggle('hovering', !!ent && !ui);
    }

    window.addEventListener('mousemove', (e) => {
      const now = performance.now();
      const dtm = Math.max(1, now - pointer.t);
      const nvx = ((e.clientX - pointer.x) / dtm) * 1000;
      const nvy = ((e.clientY - pointer.y) / dtm) * 1000;
      if (pointer.inside) {
        pointer.vx = pointer.vx * 0.5 + nvx * 0.5;
        pointer.vy = pointer.vy * 0.5 + nvy * 0.5;
      }
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.t = now;
      pointer.inside = true;
      if (toys.pointermove) toys.pointermove(pointer.x, pointer.y);
      if (down) {
        if (!down.dragging && DD.util.dist(down.x, down.y, pointer.x, pointer.y) > 5) {
          down.dragging = true;
          document.body.classList.add('grabbing');
          down.ent.onGrab && down.ent.onGrab(pointer.x, pointer.y);
        }
        if (down.dragging) down.ent.onDrag && down.ent.onDrag(pointer.x, pointer.y);
      } else updateHover(pointer.x, pointer.y);
    });
    document.addEventListener('mouseleave', () => {
      pointer.inside = false;
      pointer.x = pointer.y = -1e4;
      if (!down) setInteractive(false);
    });

    canvas.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      const ent = pick(e.clientX, e.clientY);
      if (!ent) return;
      down = { ent, x: e.clientX, y: e.clientY, dragging: false };
      pointer.vx = pointer.vy = 0;
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch {}
      ent.onPress && ent.onPress(e.clientX, e.clientY);
    });
    const up = (e) => {
      if (!down) return;
      const d = down;
      down = null;
      document.body.classList.remove('grabbing');
      if (d.dragging) {
        const v = DD.util.clamp;
        d.ent.onRelease && d.ent.onRelease(v(pointer.vx, -2600, 2600), v(pointer.vy, -2600, 2600));
      } else if (d.ent.onClick) d.ent.onClick(e.clientX, e.clientY);
      updateHover(e.clientX, e.clientY);
    };
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    canvas.addEventListener('dblclick', (e) => {
      const ent = pick(e.clientX, e.clientY);
      if (ent && ent.onDblClick) ent.onDblClick(e.clientX, e.clientY);
    });

    /* -------- frame -------- */
    stage.onFrame = (dt, t) => {
      const g = stage.ctx;
      g.clearRect(0, 0, stage.w, stage.h);
      toys.frame(dt, t);
      env.particles.update(dt);
      env.particles.draw(g);
      if (toys.frameTop) toys.frameTop(dt, t);
      env.weather.frame(dt, t);
      DD.bubbles.draw(g, dt);
    };

    if (api.onAction)
      api.onAction((name) => {
        if (name === 'clear-snow') return env.weather.clear();
        if (name === 'blizzard') return env.weather.burst(300);
        toys.action && toys.action(name);
      });
    watchState(api, state, stage, () => location.reload(), (next) => env.weather.setConfig(next.settings.weather));
    return { stage, toys, env };
  };

  /* auto-start inside the desktop app windows */
  if (!window.__DD_PREVIEW) {
    const canvas = document.getElementById('stage');
    if (canvas && document.body.classList.contains('wallpaper')) DD.startWallpaper(canvas);
    else if (canvas && document.body.classList.contains('overlay')) DD.startOverlay(canvas);
  }
})();
