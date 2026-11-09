// Live card interaction: the card tilts toward the pointer on springs, a glare follows
// the pointer and a reflection band slides with the tilt. On first view it settles in
// from a tilted, lifted pose. Plain DOM: only CSS custom properties are written.
// Adapted from a WebGL reflective-card component; the foil is the texture, not a shader.
(function () {
  const card = document.querySelector('[data-live-card]');
  if (!card) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const TILT = reduced ? 0 : 10;   // degrees at the card edge
  const INTRO_MS = 1400;           // slow, soft springs while the intro settles
  const PRESENCE_MS = 650;         // fade and lift in

  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const x = { p: 0, v: 0, target: 0 };
  const y = { p: 0, v: 0, target: 0 };
  const light = { p: 0, target: 0 };
  const pointer = { x: 50, y: 50 };   // glare position, % of the card
  let presence = 1;
  let presenceStart = 0;
  let slowUntil = 0;
  let touchId = null;
  let raf = 0;
  let last = 0;

  function write() {
    const s = card.style;
    s.setProperty('--lc-rotate-x', `${(y.p * TILT).toFixed(3)}deg`);
    s.setProperty('--lc-rotate-y', `${(-x.p * TILT).toFixed(3)}deg`);
    s.setProperty('--lc-x', x.p.toFixed(4));
    s.setProperty('--lc-y', y.p.toFixed(4));
    s.setProperty('--lc-gx', `${pointer.x.toFixed(2)}%`);
    s.setProperty('--lc-gy', `${pointer.y.toFixed(2)}%`);
    s.setProperty('--lc-light', light.p.toFixed(4));
    const eased = 1 - Math.pow(1 - presence, 3);
    s.setProperty('--lc-presence', eased.toFixed(4));
    s.setProperty('--lc-lift', `${((1 - eased) * 14).toFixed(2)}px`);
  }

  function frame(now) {
    raf = 0;
    const dt = Math.min(0.05, (now - last) / 1000 || 0);
    last = now;
    const slow = now < slowUntil;
    const stiffness = slow ? 24 : 120;
    const damping = slow ? 9 : 16;
    // Fixed 120 Hz substeps keep the springs stable on slow frames
    const steps = Math.max(1, Math.ceil(dt / (1 / 120)));
    const h = dt / steps;
    for (let i = 0; i < steps; i++) {
      for (const axis of [x, y]) {
        axis.v += (stiffness * (axis.target - axis.p) - damping * axis.v) * h;
        axis.p += axis.v * h;
      }
    }
    // Light comes up fast and fades slower
    const tau = light.target > light.p ? 0.18 : slow ? 0.9 : 0.45;
    light.p += (light.target - light.p) * (1 - Math.exp(-dt / tau));
    if (presence < 1) presence = clamp((now - presenceStart) / PRESENCE_MS, 0, 1);

    const moving =
      Math.abs(x.target - x.p) > 0.0005 || Math.abs(y.target - y.p) > 0.0005 ||
      Math.abs(x.v) > 0.0005 || Math.abs(y.v) > 0.0005 ||
      Math.abs(light.target - light.p) > 0.002 || presence < 1;
    if (!moving) {
      x.p = x.target; y.p = y.target; x.v = 0; y.v = 0; light.p = light.target;
    }
    write();
    if (moving) raf = requestAnimationFrame(frame);
  }

  function wake() {
    if (raf) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }

  function aim(nx, ny, on) {
    x.target = clamp(nx, -1, 1);
    y.target = clamp(ny, -1, 1);
    light.target = on ? 1 : 0;
    slowUntil = 0;
    wake();
  }

  function aimAt(event) {
    const rect = card.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const nx = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = ((event.clientY - rect.top) / rect.height) * 2 - 1;
    pointer.x = (nx + 1) * 50;
    pointer.y = (ny + 1) * 50;
    aim(nx, ny, true);
  }

  const release = () => aim(0, 0, false);

  card.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') aimAt(e); });
  card.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse' || e.pointerId === touchId) aimAt(e); });
  card.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') release(); });
  // Touch and pen: the card follows the finger while it's down, then springs back
  card.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse') return;
    touchId = e.pointerId;
    aimAt(e);
  });
  const lift = (e) => {
    if (e.pointerId !== touchId) return;
    touchId = null;
    release();
  };
  card.addEventListener('pointerup', lift);
  card.addEventListener('pointercancel', lift);

  // Intro the first time the card scrolls into view: it fades and lifts in from a
  // tilted pose with the light on, then settles on soft springs
  if (!reduced && 'IntersectionObserver' in window) {
    presence = 0;
    write();
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      io.disconnect();
      const now = performance.now();
      x.p = 0.62; y.p = -0.55; light.p = 1;
      pointer.x = (0.62 + 1) * 50;
      pointer.y = (-0.55 + 1) * 50;
      presenceStart = now;
      slowUntil = now + INTRO_MS;
      wake();
    }, { threshold: 0.35 });
    io.observe(card);
  } else {
    write();
  }
})();
