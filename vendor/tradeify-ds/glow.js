/* Extracted from approved V3 Lightning enhanceGlowButtons. Preserves 5ms pointer debounce and 1s rest; adds reduced-motion/disabled guards. */
function enhanceGlowButtons(root) {
  const DEBOUNCE_DELAY = 5, DEBOUNCE_TIME = 1000;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const state = new WeakMap();
  const get = (btn) => {
    let s = state.get(btn);
    if (!s) {
      s = {
        glow: btn.querySelector('.pp-glow-box'), face: btn.querySelector('.pp-btn-face, .pp-nav-cta-face, .pp-planswitch-face'),
        bl: btn.querySelector('.pp-glow-bd--l'), br: btn.querySelector('.pp-glow-bd--r'),
        ol: btn.querySelector('.pp-glow-ob--l'), or: btn.querySelector('.pp-glow-ob--r'),
        x: 0, reset: null, debounce: null,
      };
      state.set(btn, s);
    }
    return s;
  };
  const updateX = (btn, s) => {
    const st = getComputedStyle(s.face);
    s.x = (btn.clientWidth - (parseFloat(st.paddingLeft) + parseFloat(st.paddingRight))) / 2;
  };
  const rest = (s) => {
    s.glow.style.transform = `translateX(${s.x}px) translateZ(0px)`;
    s.bl.style.opacity = 0; s.br.style.opacity = 1; s.ol.style.opacity = 0; s.or.style.opacity = 1;
  };
  const follow = (btn, s, e) => {
    const rect = btn.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const progress = x / rect.width; // 0 → 1
    s.glow.style.transform = `translateX(${(progress - 0.5) * 2 * s.x}px) translateZ(0)`;
    s.bl.style.opacity = s.ol.style.opacity = Math.max(0, 1 - progress * 2);
    s.br.style.opacity = s.or.style.opacity = Math.max(0, (progress - 0.5) * 2);
  };
  const target = (e) => e.target instanceof Element && e.target.closest('.pp-glow');

  const onMove = (e) => {
    const btn = target(e);
    if (!btn || e.pointerType === 'touch' || reduced.matches || btn.matches(':disabled,[aria-disabled=true]')) return;
    const s = get(btn);
    updateX(btn, s);
    if (s.reset) { clearTimeout(s.reset); s.reset = null; }
    if (s.debounce) return;
    s.debounce = setTimeout(() => { follow(btn, s, e); s.debounce = null; }, DEBOUNCE_DELAY);
  };
  const onOut = (e) => {
    const btn = target(e);
    if (!btn || (e.relatedTarget instanceof Node && btn.contains(e.relatedTarget))) return;
    const s = get(btn);
    updateX(btn, s);
    if (s.debounce) { clearTimeout(s.debounce); s.debounce = null; }
    s.reset = setTimeout(() => rest(s), DEBOUNCE_TIME);
  };

  // Initial position from the real face padding (CSS already shows the same resting state before this runs).
  root.querySelectorAll('.pp-glow').forEach((btn) => { const s = get(btn); updateX(btn, s); rest(s); });
  const ready = setTimeout(() => document.documentElement.classList.add('pp-glow-ready'), DEBOUNCE_TIME * 1.8);

  root.addEventListener('pointermove', onMove);
  root.addEventListener('pointerout', onOut);
  return () => {
    clearTimeout(ready);
    root.removeEventListener('pointermove', onMove);
    root.removeEventListener('pointerout', onOut);
  };
}


enhanceGlowButtons(document);
