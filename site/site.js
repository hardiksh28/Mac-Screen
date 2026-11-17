(function () {
  const S = window.SITE;
  document.querySelectorAll('[data-price]').forEach((el) => (el.textContent = S.price));
  document.querySelectorAll('[data-download]').forEach((el) => (el.href = S.downloadUrl));
  document.querySelectorAll('[data-buy]').forEach((el) => (el.href = S.buyUrl));
  document.querySelectorAll('[data-mail]').forEach((el) => (el.href = 'mailto:' + S.supportEmail));

  // live demo: the real renderer in an iframe
  const frame = document.getElementById('demoFrame');
  const art = { winter: 'winter-night', wizard: 'wizard-castle', drive: 'drive-city', ocean: '' };
  function load(theme) {
    const a = art[theme] ? '&art=' + encodeURIComponent('../../assets/wallpapers/' + art[theme] + '.jpg') : '';
    frame.src = `app/src/renderer/preview.html?theme=${theme}&demo=1${a}`;
    document.querySelectorAll('[data-demo]').forEach((b) => b.classList.toggle('on', b.dataset.demo === theme));
  }
  document.querySelectorAll('[data-demo]').forEach((b) => (b.onclick = () => load(b.dataset.demo)));
  const io = new IntersectionObserver((es) => {
    if (es.some((e) => e.isIntersecting)) {
      load('winter');
      io.disconnect();
    }
  });
  io.observe(frame);

  // gentle snow over the hero
  const c = document.getElementById('heroSnow');
  const g = c.getContext('2d');
  let W, H, flakes;
  function size() {
    const dpr = Math.min(2, devicePixelRatio || 1);
    W = c.clientWidth;
    H = c.clientHeight;
    c.width = W * dpr;
    c.height = H * dpr;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    flakes = Array.from({ length: Math.min(260, (W * H) / 5000) }, () => ({ x: Math.random() * W, y: Math.random() * H, z: Math.random(), p: Math.random() * 6.28 }));
  }
  size();
  addEventListener('resize', size);
  let mx = -1e4,
    my = -1e4,
    mvx = 0;
  addEventListener('mousemove', (e) => {
    mvx = e.clientX - mx;
    mx = e.clientX;
    my = e.clientY;
  });
  let last = performance.now();
  (function tick(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    g.clearRect(0, 0, W, H);
    g.fillStyle = '#fff';
    for (const f of flakes) {
      f.y += (20 + f.z * 60) * dt;
      f.x += Math.sin(now / 1000 + f.p) * 10 * f.z * dt;
      const dx = f.x - mx,
        dy = f.y - my;
      if (dx * dx + dy * dy < 9000) f.x += mvx * 0.15;
      if (f.y > H) {
        f.y = -5;
        f.x = Math.random() * W;
      }
      g.globalAlpha = 0.4 + f.z * 0.6;
      g.beginPath();
      g.arc(f.x, f.y, 0.8 + f.z * 2.2, 0, 6.28);
      g.fill();
    }
    mvx *= 0.9;
    requestAnimationFrame(tick);
  })(last);
})();
