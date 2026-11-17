/* Desk Diorama – main app window (themes, weather, decorate, settings, unlock Pro). */
(function () {
  const api = window.diorama;
  const CAT = window.DD_CATALOG;
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  let state = null;

  /* ---------------- navigation ---------------- */
  function go(section) {
    const [name, query] = String(section || 'welcome').replace(/^#/, '').split('?');
    const page = $(`[data-page="${name}"]`) ? name : 'welcome';
    $$('section').forEach((s) => s.classList.toggle('on', s.dataset.page === page));
    $$('nav a').forEach((a) => a.classList.toggle('on', a.dataset.nav === page));
    if (page === 'pro') $('#thanks').hidden = !(query || '').includes('thanks');
    $('main').scrollTop = 0;
  }
  $$('nav a').forEach((a) => (a.onclick = () => go(a.dataset.nav)));
  $$('[data-goto]').forEach((b) => (b.onclick = () => go(b.dataset.goto)));
  api.onNavigate && api.onNavigate(go);

  /* ---------------- rendering ---------------- */
  function render() {
    const s = state.settings;
    $('#planLabel').textContent = state.pro ? 'Pro · lifetime' : 'Free';
    $('.pro-link').textContent = state.pro ? '⭐ Pro unlocked' : `⭐ Unlock Pro · ${state.priceLabel}`;
    $('#price').textContent = state.priceLabel;
    $('#price2').textContent = state.priceLabel;
    $('#sideFoot').textContent = state.previewing ? `Previewing a Pro theme · ${Math.max(0, Math.round((state.previewEndsAt - Date.now()) / 1000))}s left` : '';

    // themes
    const grid = $('#themeGrid');
    grid.innerHTML = '';
    CAT.themes.forEach((t) => {
      const usable = state.pro || t.free;
      const active = state.theme === t.id;
      const el = document.createElement('div');
      el.className = 'theme' + (active ? ' active' : '');
      el.innerHTML = `
        ${active ? '<span class="using">● In use</span>' : ''}
        <img src="../../assets/thumbs/${t.id}.jpg" alt="" />
        <div class="body">
          <h3>${t.name} ${t.free ? '<span class="pill free">Free</span>' : usable ? '<span class="pill">Pro</span>' : '<span class="pill lock">🔒 Pro</span>'}</h3>
          <p>${t.tagline}</p>
          <div class="row" style="margin-top:0"></div>
        </div>`;
      const row = el.querySelector('.row');
      const b = document.createElement('button');
      b.className = 'btn' + (active ? '' : ' primary');
      b.textContent = active ? 'In use' : usable ? 'Use this theme' : 'Try it for 90 seconds';
      b.disabled = active;
      b.onclick = async () => {
        if (usable) await api.setSetting('theme', t.id);
        else await api.tryTheme(t.id);
      };
      row.appendChild(b);
      if (!usable) {
        const u = document.createElement('button');
        u.className = 'btn';
        u.textContent = `Unlock · ${state.priceLabel}`;
        u.onclick = () => go('pro');
        row.appendChild(u);
      }
      grid.appendChild(el);
    });

    // weather
    const w = Object.assign({}, CAT.defaultWeather, s.weather);
    const wt = $('#weatherTypes');
    wt.innerHTML = '';
    CAT.weatherTypes.forEach((t) => {
      const c = document.createElement('button');
      const locked = !state.pro && !t.free;
      c.className = 'chip' + (w.type === t.id ? ' on' : '');
      c.innerHTML = `${icon(t.id)} ${t.label}${locked ? '<span class="lk">🔒</span>' : ''}`;
      c.onclick = () => (locked ? go('pro') : setWeather({ type: t.id }));
      wt.appendChild(c);
    });
    seg('#weatherAmount', CAT.weatherAmounts, w.amount, (id) => setWeather({ amount: id }));
    seg('#weatherWind', CAT.winds, w.wind, (id) => setWeather({ wind: id }));
    $('#wOnWindows').checked = w.onWindows !== false;
    $('#wPaused').checked = !!w.paused;
    $('#winNote').textContent = state.platform === 'darwin' && !state.windowSnow ? 'Needs the window helper. Snow will pile on the Dock only.' : '';

    // decorate
    const n = (s.decorations || []).length;
    $('#decoCount').textContent = n ? `${n} decoration${n === 1 ? '' : 's'} on your desktop.` : '';

    // settings
    $$('[data-set]').forEach((i) => (i.checked = !!s[i.dataset.set]));
    $('#loginRow').style.display = state.loginItemSupported ? '' : 'none';
    seg('#fpsSeg', [{ id: 30, label: 'Battery saver (30 fps)' }, { id: 60, label: 'Silky (60 fps)' }], s.fps, (id) => api.setSetting('fps', id));
    $('#versionLine').textContent = `Version ${state.version || ''} · ${state.pro ? 'Pro' : 'Free'}`;

    // pro
    $('#licForm').hidden = state.pro;
    $('#licDone').hidden = !state.pro;
    $('#licInfo').textContent = state.licenseInfo ? `Key ${state.licenseInfo.key}` : '';
    $('#buyBtn').disabled = state.pro;
    $('#buyBtn').innerHTML = state.pro ? 'You have Pro 🎉' : `Unlock for ${state.priceLabel}`;
    $('#devnote').hidden = state.storeConfigured;
    $('#supportLine').innerHTML = state.supportEmail ? `Need help? <a href="#" id="mailLink" style="color:#8f9bff">${state.supportEmail}</a>` : '';
    const ml = $('#mailLink');
    if (ml) ml.onclick = (e) => (e.preventDefault(), api.openExternal('mailto:' + state.supportEmail));
  }

  function icon(id) {
    return { auto: '🎨', season: '📅', snow: '❄️', rain: '🌧️', blossom: '🌸', leaves: '🍂', hearts: '💗', confetti: '🎉', off: '⛔' }[id] || '';
  }
  function seg(sel, list, value, onPick) {
    const el = $(sel);
    el.innerHTML = '';
    list.forEach((o) => {
      const b = document.createElement('button');
      b.textContent = o.label;
      b.className = String(o.id) === String(value) ? 'on' : '';
      b.onclick = () => onPick(o.id);
      el.appendChild(b);
    });
  }
  function setWeather(patch) {
    const w = Object.assign({}, CAT.defaultWeather, state.settings.weather, patch);
    api.setSetting('weather', w);
  }

  /* ---------------- controls ---------------- */
  $$('[data-set]').forEach((i) => (i.onchange = () => api.setSetting(i.dataset.set, i.checked)));
  $('#wOnWindows').onchange = (e) => setWeather({ onWindows: e.target.checked });
  $('#wPaused').onchange = (e) => setWeather({ paused: e.target.checked });
  $('#clearSnow').onclick = () => api.triggerAction('clear-snow');
  $('#blizzard').onclick = () => api.triggerAction('blizzard');
  $('#startDecorating').onclick = () => api.setDecorating(true);
  $('#quitBtn').onclick = () => api.quit();
  $('#buyBtn').onclick = () => api.openCheckout();
  $('#activateBtn').onclick = async () => {
    const msg = $('#licMsg');
    const btn = $('#activateBtn');
    msg.className = 'msg';
    msg.textContent = 'Activating…';
    btn.disabled = true;
    const r = await api.activateLicense($('#licKey').value);
    btn.disabled = false;
    if (r.ok) {
      msg.className = 'msg ok';
      msg.textContent = 'Unlocked! Enjoy everything ✨';
    } else {
      msg.className = 'msg err';
      msg.textContent = r.error;
    }
  };
  $('#licKey').addEventListener('keydown', (e) => e.key === 'Enter' && $('#activateBtn').click());
  $('#deactivateBtn').onclick = async () => {
    if (!confirm('Remove the license from this Mac? You can activate it again on another one.')) return;
    await api.deactivateLicense();
  };

  /* ---------------- boot ---------------- */
  api.getState().then((s) => {
    state = s;
    render();
    go(location.hash || 'welcome');
  });
  api.onState((s) => {
    state = s;
    render();
  });
  setInterval(() => state && state.previewing && render(), 1000);
})();
