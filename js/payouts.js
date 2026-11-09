// Live fund slider: drag through cumulative sim payouts. Each is split 75/10/15 as in
// the sim funded step; the 10% builds the live fund. Below the $12K trigger the card is locked.
(function () {
  const { SPLIT, LIVE_TRIGGER, money } = window.MiamiPlan;
  const root = document.querySelector('[data-fund]');
  const card = document.querySelector('[data-live-card]');
  if (!root || !card) return;

  const range = root.querySelector('[data-fund-range]');
  const value = root.querySelector('[data-fund-value]');
  const ring = card.querySelector('[data-lock-ring]');
  const togo = card.querySelector('[data-lock-togo]');

  // Rolling digits: each digit is a 0–9 strip moved to its value. The strip is
  // rebuilt only when the number's shape changes (e.g. $990 → $1,000).
  function roll(el, text) {
    if (el.dataset.text === text) return;
    const shape = text.replace(/\d/g, '0');
    if (el.dataset.shape !== shape) {
      el.textContent = '';
      const sr = document.createElement('span');
      sr.className = 'sr-only';
      const vis = document.createElement('span');
      vis.className = 'odo';
      vis.setAttribute('aria-hidden', 'true');
      for (const ch of text) {
        if (/\d/.test(ch)) {
          const col = document.createElement('span');
          col.className = 'odo__col';
          col.innerHTML = '<span class="odo__sizer"></span><span class="odo__strip">' + '0123456789'.split('').map((d) => `<span>${d}</span>`).join('') + '</span>';
          vis.append(col);
        } else {
          const c = document.createElement('span');
          c.textContent = ch;
          vis.append(c);
        }
      }
      el.append(sr, vis);
      el.dataset.shape = shape;
    }
    el.querySelector('.sr-only').textContent = text;
    const digits = text.replace(/\D/g, '');
    // The hidden sizer holds the current digit so each column is that digit's width
    el.querySelectorAll('.odo__col').forEach((col, i) => {
      col.firstChild.textContent = digits[i];
      col.lastChild.style.setProperty('--d', digits[i]);
    });
    el.dataset.text = text;
  }

  function render() {
    const payouts = Number(range.value);
    // The sim funded split (plans.js), applied to the payouts so far
    const split = {
      trader: Math.round(payouts * SPLIT.trader),
      fund: Math.round(payouts * SPLIT.fund),
      tradeify: Math.round(payouts * SPLIT.tradeify),
    };
    const fund = split.fund;
    const remaining = LIVE_TRIGGER - payouts;
    const locked = remaining > 0;

    range.style.setProperty('--p', `${(payouts / LIVE_TRIGGER) * 100}%`);
    range.setAttribute('aria-valuetext', `${money(payouts)} in sim payouts: ${money(split.trader)} to you, ${money(fund)} live fund, ${money(split.tradeify)} to Tradeify` +
      (locked ? `, ${money(remaining)} to go until the live account` : ', live account unlocked'));
    roll(value, money(fund));

    card.classList.toggle('is-locked', locked);
    ring.style.setProperty('--progress', `${(payouts / LIVE_TRIGGER) * 100}%`);
    togo.textContent = `${money(remaining)} to go`;
  }

  range.addEventListener('input', render);

  // Bigger keyboard steps: Page Up/Down and Shift+arrows move $1,000 (arrows alone move $100)
  const BIG_STEP = 1000;
  range.addEventListener('keydown', (e) => {
    const up = e.key === 'PageUp' || (e.shiftKey && (e.key === 'ArrowRight' || e.key === 'ArrowUp'));
    const down = e.key === 'PageDown' || (e.shiftKey && (e.key === 'ArrowLeft' || e.key === 'ArrowDown'));
    if (!up && !down) return;
    e.preventDefault();
    const next = Math.min(Number(range.max), Math.max(Number(range.min), Number(range.value) + (up ? BIG_STEP : -BIG_STEP)));
    range.value = String(next);
    render();
  });

  // While dragging, the value tracks the pointer 1:1: the digit roll is switched off
  // until release, so the number never trails the thumb
  const endDrag = () => value.classList.remove('is-tracking');
  range.addEventListener('pointerdown', () => value.classList.add('is-tracking'));
  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', endDrag);
  render();
})();
