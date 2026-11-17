/* Desk Diorama – main app window (home, themes, weather, decorate, settings, unlock Pro). */
(function () {
  const api = window.diorama;
  const CAT = window.DD_CATALOG;
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const icon = (id) => `<svg><use href="#i-${id}" /></svg>`;
  let state = null;
  let page = 'welcome';

  /* ---------------- feedback ---------------- */
  let toastTimer = null;
  function toast(text) {
    const t = $('#appToast');
    t.textContent = text;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
  }
  // spinner on a button until `done` resolves (or the next state update says it's done)
  async function busy(btn, work) {
    btn.classList.add('busy');
    try {
      return await work();
    } finally {
      btn.classList.remove('busy');
    }
  }
  function flash(el) {
    el.classList.remove('fired');
    void el.offsetWidth;
    el.classList.add('fired');
  }

  /* ---------------- navigation ---------------- */
  function go(section) {
    const [name, query] = String(section || 'welcome').replace(/^#/, '').split('?');
    page = $(`[data-page="${name}"]`) ? name : 'welcome';
    $$('section').forEach((s) => s.classList.toggle('on', s.dataset.page === page));
    $$('nav a, .pro-link').forEach((a) => a.classList.toggle('on', a.dataset.nav === page));
    if (page === 'pro') $('#thanks').hidden = !(query || '').includes('thanks');
    $('main').scrollTop = 0;
    updateLive();
  }
  $$('[data-nav]').forEach((a) => (a.onclick = () => go(a.dataset.nav)));
  $$('[data-goto]').forEach((b) => (b.onclick = () => go(b.dataset.goto)));
  $('#nowCard').onclick = () => go('themes');
  api.onNavigate && api.onNavigate(go);

  /* ---------------- live preview on Home ---------------- */
  let liveKey = '';
  function updateLive() {
    const frame = $('#live');
    if (!state) return;
    if (page !== 'welcome' || document.hidden) {
      // nothing animates while you can't see it
      if (liveKey) {
        frame.removeAttribute('src');
        frame.classList.remove('ready');
        liveKey = '';
      }
      return;
    }
    const w = Object.assign({}, CAT.defaultWeather, state.settings.weather);
    const q = new URLSearchParams({ theme: state.theme, clean: '1', mute: '1', weather: w.type, amount: w.amount });
    if (state.scene && state.scene.url) q.set('art', state.scene.url);
    const key = q.toString();
    if (key === liveKey) return;
    liveKey = key;
    frame.classList.remove('ready');
    frame.onload = () => setTimeout(() => frame.classList.add('ready'), 250);
    frame.src = 'preview.html?' + key;
  }
  document.addEventListener('visibilitychange', updateLive);

  /* ---------------- quick actions ---------------- */
  function needToys() {
    if (state.settings.toys === false) {
      toast('Turn on “Toys on the Dock” first');
      return false;
    }
    return true;
  }
  $$('.action').forEach((b) => {
    b.onclick = async () => {
      flash(b);
      if (b.dataset.weather) {
        setWeather({ type: b.dataset.weather, amount: 'heavy', paused: false });
        toast('❄️ Let it snow!');
      } else if (b.hasAttribute('data-goto-deco')) {
        toast('🎄 Decorating: look at your desktop');
        await api.setDecorating(true);
      } else if (b.dataset.act === 'clear-snow') {
        await api.triggerAction('clear-snow');
        toast('🧹 All clear');
      } else if (b.dataset.act === 'surprise') {
        if (!needToys()) return;
        await api.triggerAction('surprise');
        toast(`✨ ${CAT.get(state.theme).action}: look at your Dock`);
      }
    };
  });

  /* ---------------- rendering ---------------- */
  const WICON = { auto: '🎨', season: '📅', snow: '❄️', rain: '🌧️', blossom: '🌸', leaves: '🍂', hearts: '💗', confetti: '🎉', off: '🚫' };

  function render() {
    const s = state.settings;
    const th = CAT.get(state.theme);
    const w = Object.assign({}, CAT.defaultWeather, s.weather);
    const wType = CAT.weatherTypes.find((t) => t.id === w.type) || CAT.weatherTypes[0];

    // sidebar
    $('#planLabel').textContent = state.pro ? 'Pro · lifetime' : 'Free version';
    $('.pro-link span').textContent = state.pro ? 'Pro unlocked' : `Unlock Pro · ${state.priceLabel}`;
    $('#nowImg').src = `../../assets/thumbs/${state.theme}.jpg`;
    $('#nowName').textContent = th.name;
    $('#nowWeather').textContent = `${WICON[w.type] || ''} ${wType.label}${w.paused ? ' · paused' : ''}`;
    $('#sideFoot').textContent = state.previewing ? `Previewing a Pro theme · ${Math.max(0, Math.round((state.previewEndsAt - Date.now()) / 1000))}s left` : '';

    // home
    $('#stageName').textContent = th.name;
    $('#stageTag').textContent = th.tagline;
    $('.stage').style.backgroundImage = `url(../../assets/thumbs/${state.theme}.jpg)`;
    const act = $('.action[data-act="surprise"]') || $$('.action')[1];
    act.dataset.act = 'surprise';
    act.querySelector('b').textContent = th.action;
    act.querySelector('span').textContent = { winter: 'He drops gifts', wizard: 'Letters & fortunes', drive: 'Watch it go', ocean: 'They come running' }[state.theme] || 'Something fun';
    $('#themeAction span').textContent = 'Weather';
    updateLive();

    // themes
    const grid = $('#themeGrid');
    grid.innerHTML = '';
    CAT.themes.forEach((t) => {
      const usable = state.pro || t.free;
      const active = state.theme === t.id;
      const el = document.createElement('div');
      el.className = 'theme' + (active ? ' active' : '');
      el.innerHTML = `
        <div class="pic">
          <img src="../../assets/thumbs/${t.id}.jpg" alt="" />
          ${active ? `<span class="using">${icon('check')}In use</span>` : ''}
          <h3>${t.name} ${t.free ? '<span class="pill free">Free</span>' : usable ? '<span class="pill">Pro</span>' : '<span class="pill lock">Pro</span>'}</h3>
        </div>
        <div class="body"><p>${t.tagline}</p><div class="row"></div></div>`;
      const row = el.querySelector('.row');
      const avail = (state.sceneOptions && state.sceneOptions[t.id]) || [];
      const current = active && state.scene ? state.scene.id : (s.scenes || {})[t.id] || avail[0] || 'drawn';
      const opts = (t.scenes || []).filter((sc) => avail.includes(sc.id)).map((sc) => ({ id: sc.id, label: sc.label }));
      opts.push({ id: 'drawn', label: 'Illustrated' });
      if (state.hasCustomWallpaper) opts.push({ id: 'custom', label: 'My picture' });
      if (opts.length > 1 && usable) {
        const chips = document.createElement('div');
        chips.className = 'scene-chips';
        opts.forEach((o) => {
          const c = document.createElement('button');
          c.className = 'chip' + (o.id === current ? ' on' : '');
          c.textContent = o.label;
          c.onclick = () => {
            chips.querySelectorAll('.chip').forEach((x) => x.classList.toggle('on', x === c));
            api.setScene(t.id, o.id);
          };
          chips.appendChild(c);
        });
        el.querySelector('.body').insertBefore(chips, row);
      }
      const b = document.createElement('button');
      if (active) {
        b.className = 'btn done';
        b.innerHTML = `${icon('check')}In use`;
        b.disabled = true;
      } else {
        b.className = 'btn primary';
        b.innerHTML = usable ? 'Use this theme' : `${icon('play')}Try it for 90 seconds`;
        b.onclick = () =>
          busy(b, async () => {
            if (usable) await api.setSetting('theme', t.id);
            else await api.tryTheme(t.id);
            toast(usable ? `${t.name} is on your desktop` : `Previewing ${t.name} for 90 seconds`);
          });
      }
      row.appendChild(b);
      if (!usable) {
        const u = document.createElement('button');
        u.className = 'btn';
        u.innerHTML = `${icon('lock')}Unlock · ${state.priceLabel}`;
        u.onclick = () => go('pro');
        row.appendChild(u);
      }
      grid.appendChild(el);
    });
    $('#pickWallpaper span').textContent = state.pro ? (state.hasCustomWallpaper ? 'Change my picture' : 'Use my own picture') : 'Use my own picture · Pro';

    // weather
    const wt = $('#weatherTypes');
    wt.innerHTML = '';
    CAT.weatherTypes.forEach((t) => {
      const c = document.createElement('button');
      const locked = !state.pro && !t.free;
      c.className = 'wtype' + (w.type === t.id ? ' on' : '');
      c.innerHTML = `<em>${WICON[t.id] || ''}</em><b>${t.label}</b>${locked ? `<span class="lk">${icon('lock')}</span>` : ''}`;
      c.onclick = () => {
        if (locked) return go('pro');
        wt.querySelectorAll('.wtype').forEach((x) => x.classList.toggle('on', x === c));
        setWeather({ type: t.id });
      };
      wt.appendChild(c);
    });
    seg('#weatherAmount', CAT.weatherAmounts, w.amount, (id) => setWeather({ amount: id }));
    seg('#weatherWind', CAT.winds, w.wind, (id) => setWeather({ wind: id }));
    $('#wOnWindows').checked = w.onWindows !== false;
    $('#wPaused').checked = !!w.paused;
    if (state.platform === 'darwin' && !state.windowSnow) $('#winNote').textContent = 'Needs the window helper. Snow will pile on the Dock only.';

    // decorate
    const n = (s.decorations || []).length;
    $('#decoCount').textContent = n ? `${n} decoration${n === 1 ? '' : 's'} on your desktop right now.` : '';

    // settings
    $$('[data-set]').forEach((i) => (i.checked = !!s[i.dataset.set]));
    $('#loginRow').style.display = state.loginItemSupported ? '' : 'none';
    seg('#fpsSeg', [{ id: 30, label: '30 fps' }, { id: 60, label: '60 fps' }], s.fps, (id) => api.setSetting('fps', id));
    $('#versionLine').textContent = `Desk Diorama ${state.version || ''} · ${state.pro ? 'Pro' : 'Free'}`;

    // pro
    $('#licForm').hidden = state.pro;
    $('#licDone').hidden = !state.pro;
    $('#licInfo').textContent = state.licenseInfo ? `Key ${state.licenseInfo.key}` : '';
    $('#price').textContent = state.priceLabel;
    $('#buyBtn').disabled = state.pro;
    $('#buyBtn').innerHTML = state.pro ? 'You have Pro 🎉' : `Unlock for ${state.priceLabel}`;
    $('#devnote').hidden = state.storeConfigured;
    $('#supportLine').innerHTML = state.supportEmail ? `Need help? <a href="#" id="mailLink" style="color:#a9abff">${state.supportEmail}</a>` : '';
    const ml = $('#mailLink');
    if (ml) ml.onclick = (e) => (e.preventDefault(), api.openExternal('mailto:' + state.supportEmail));
  }

  function seg(sel, list, value, onPick) {
    const el = $(sel);
    el.innerHTML = '';
    list.forEach((o) => {
      const b = document.createElement('button');
      b.textContent = o.label;
      b.className = String(o.id) === String(value) ? 'on' : '';
      b.onclick = () => {
        el.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b)); // instant feedback
        onPick(o.id);
      };
      el.appendChild(b);
    });
  }
  function setWeather(patch) {
    const w = Object.assign({}, CAT.defaultWeather, state.settings.weather, patch);
    state.settings.weather = w;
    return api.setSetting('weather', w);
  }

  /* ---------------- controls ---------------- */
  $$('[data-set]').forEach(
    (i) =>
      (i.onchange = () => {
        // keep both copies of a switch (Home + Settings) in sync straight away
        $$(`[data-set="${i.dataset.set}"]`).forEach((x) => (x.checked = i.checked));
        api.setSetting(i.dataset.set, i.checked);
      })
  );
  $('#themeAction').onclick = () => go('weather');
  $('#wOnWindows').onchange = (e) => setWeather({ onWindows: e.target.checked });
  $('#wPaused').onchange = (e) => setWeather({ paused: e.target.checked });
  $('#clearSnow').onclick = async () => {
    await api.triggerAction('clear-snow');
    toast('🧹 All clear');
  };
  $('#blizzard').onclick = async () => {
    await api.triggerAction('blizzard');
    toast('🌪️ Blizzard!');
  };
  $('#startDecorating').onclick = (e) => busy(e.currentTarget, () => api.setDecorating(true)).then(() => toast('🎄 Decorating: look at your desktop'));
  $('#pickWallpaper').onclick = () => (state.pro ? api.pickWallpaper() : go('pro'));
  $('#quitBtn').onclick = () => api.quit();
  $('#buyBtn').onclick = (e) => busy(e.currentTarget, () => api.openCheckout().then(() => new Promise((r) => setTimeout(r, 800)))).then(() => toast('Checkout opened in your browser'));
  $('#activateBtn').onclick = async () => {
    const msg = $('#licMsg');
    const btn = $('#activateBtn');
    if (!$('#licKey').value.trim()) {
      msg.className = 'msg err';
      msg.textContent = 'Paste the license key from your email first.';
      return;
    }
    msg.className = 'msg';
    msg.textContent = '';
    const r = await busy(btn, () => api.activateLicense($('#licKey').value));
    if (r.ok) {
      msg.className = 'msg ok';
      msg.textContent = 'Unlocked! Enjoy everything ✨';
      toast('⭐ Pro unlocked');
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
    if (s.platform === 'darwin') document.documentElement.classList.add('vibrant');
    render();
    go(location.hash || 'welcome');
  });
  api.onState((s) => {
    state = s;
    render();
  });
  setInterval(() => state && state.previewing && render(), 1000);
})();
