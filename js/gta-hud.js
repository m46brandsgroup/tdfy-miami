// GTA style iteration only: game-HUD touches. Loaded by the ?v=gta switch in index.html; does nothing on v1.
// 1. Money counter: the hero payout badges tick up from $0 to their amount as each badge arrives, then
//    flash once (.is-counted). The final text is the same amount the HTML ships with. Skipped entirely
//    under reduced motion, so the amounts simply show.
(() => {
  if (document.documentElement.dataset.theme !== 'gta') return;

  const ARRIVE_MS = [450, 600]; // matches the badges' entrance delays in css/hero.css
  const COUNT_MS = 1100;

  function countBadges() {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    document.querySelectorAll('.payout-badge').forEach((badge, i) => {
      const figure = badge.querySelector('.payout-badge__text strong');
      if (!figure) return;
      const finalText = figure.textContent;
      const target = parseInt(finalText.replace(/[^0-9]/g, ''), 10);
      if (!target) return;

      figure.textContent = '$0';
      setTimeout(() => {
        const start = performance.now();
        const step = (now) => {
          const p = Math.min(1, (now - start) / COUNT_MS);
          const eased = 1 - Math.pow(1 - p, 3);
          figure.textContent = p < 1 ? '$' + Math.round(target * eased).toLocaleString('en-US') : finalText;
          if (p < 1) requestAnimationFrame(step);
          else badge.classList.add('is-counted');
        };
        requestAnimationFrame(step);
      }, ARRIVE_MS[i] ?? 500);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', countBadges);
  else countBadges();
})();

// 2. PASSED stamp: when the "Pass in One Day" chart (React island) finishes counting its profit up, a
//    condensed PASSED stamp slams onto the chart card once. The word is taken from the chart's own
//    "Passed" label. The stamp is decorative (aria-hidden); the label stays the accessible text.
(() => {
  if (document.documentElement.dataset.theme !== 'gta') return;

  function stamp(card, word) {
    if (card.querySelector('.gta-stamp')) return;
    const el = document.createElement('span');
    el.className = 'gta-stamp';
    el.setAttribute('aria-hidden', 'true');
    el.textContent = word;
    card.append(el);
    requestAnimationFrame(() => el.classList.add('is-in'));
  }

  function watch() {
    const card = document.querySelector('.eval-chart');
    const value = card?.querySelector('[data-slot="sales-target-chart-value"]');
    const label = card?.querySelector('.eval-chart__passed');
    if (!card || !value || !label) return false;
    const word = label.textContent.trim() || 'Passed';

    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { stamp(card, word); return true; }

    let settle;
    const check = () => {
      clearTimeout(settle);
      settle = setTimeout(() => {
        if (/[1-9]/.test(value.textContent)) { stamp(card, word); observer.disconnect(); }
      }, 450);
    };
    const observer = new MutationObserver(check);
    observer.observe(value, { childList: true, characterData: true, subtree: true });
    check();
    return true;
  }

  // The chart mounts after this script may run: retry briefly until the island is in the DOM
  const start = () => {
    let tries = 0;
    const t = setInterval(() => { if (watch() || ++tries > 40) clearInterval(t); }, 250);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();

// 3. Minimap navigator (desktop): a small round map fixed bottom-left. A route runs through one waypoint
//    per section (labels taken from the header nav: Pricing, Benefits, How it works, FAQ); an arrow
//    travels along it with the scroll and the route behind it lights up. Waypoints are real links to the
//    sections. Shown once past the hero; hidden on phones by CSS. Purely an extra way to navigate.
(() => {
  if (document.documentElement.dataset.theme !== 'gta') return;

  const SVG = 'http://www.w3.org/2000/svg';
  // Map coordinates (160 x 160): start (the hero) then one point per section
  const POINTS = [[82, 140], [40, 112], [56, 66], [108, 44], [122, 104]];
  const IDS = ['plans', 'benefits', 'how', 'faq'];

  function build() {
    const navLinks = [...document.querySelectorAll('.pp-nav-links a[href^="#"]')];
    const sections = IDS.map((id) => {
      const el = document.getElementById(id);
      const link = navLinks.find((a) => a.getAttribute('href') === '#' + id);
      return el && link ? { id, el, label: link.textContent.trim() } : null;
    });
    if (sections.some((s) => !s)) return;

    const nav = document.createElement('nav');
    nav.className = 'gta-minimap';
    nav.setAttribute('aria-label', 'Page map');

    const svg = document.createElementNS(SVG, 'svg');
    svg.setAttribute('viewBox', '0 0 160 160');
    svg.setAttribute('aria-hidden', 'true');
    svg.innerHTML = `
      <defs><clipPath id="gta-mm-clip"><circle cx="80" cy="80" r="74"/></clipPath></defs>
      <circle cx="80" cy="80" r="78" class="gta-minimap__rim"/>
      <g clip-path="url(#gta-mm-clip)">
        <rect width="160" height="160" class="gta-minimap__ground"/>
        <path d="M118 0 C96 50 132 92 160 102 V0Z" class="gta-minimap__water"/>
        <path d="M0 52H160M0 92H160M0 128H160M34 0V160M74 0V160M114 0V160" class="gta-minimap__streets"/>
        <path class="gta-minimap__route" d="M${POINTS.map((p) => p.join(' ')).join(' L')}"/>
        <path class="gta-minimap__done" d="M${POINTS.map((p) => p.join(' ')).join(' L')}"/>
      </g>
      <g class="gta-minimap__player"><path d="M0 -9 L7 7 L0 3 L-7 7 Z"/></g>`;
    nav.append(svg);

    const pins = sections.map((s, i) => {
      const a = document.createElement('a');
      a.className = 'gta-minimap__wp';
      a.href = '#' + s.id;
      a.dataset.label = s.label;
      a.setAttribute('aria-label', s.label);
      a.style.left = (POINTS[i + 1][0] / 160) * 100 + '%';
      a.style.top = (POINTS[i + 1][1] / 160) * 100 + '%';
      nav.append(a);
      return a;
    });
    document.body.append(nav);

    const done = svg.querySelector('.gta-minimap__done');
    const route = svg.querySelector('.gta-minimap__route');
    const player = svg.querySelector('.gta-minimap__player');
    const total = route.getTotalLength();
    const seg = POINTS.slice(1).map((p, i) => Math.hypot(p[0] - POINTS[i][0], p[1] - POINTS[i][1]));
    const cum = seg.reduce((acc, l) => (acc.push(acc.at(-1) + l), acc), [0]);
    done.style.strokeDasharray = `${total} ${total}`;

    const hero = document.querySelector('.hero');
    let ticking = false;
    function update() {
      ticking = false;
      const y = scrollY + innerHeight * 0.35;
      const tops = [0, ...sections.map((s) => s.el.getBoundingClientRect().top + scrollY)];
      let d = total;
      let active = sections.length - 1;
      for (let i = 0; i < tops.length - 1; i++) {
        if (y < tops[i + 1]) {
          const frac = Math.max(0, Math.min(1, (y - tops[i]) / (tops[i + 1] - tops[i])));
          d = cum[i] + frac * seg[i];
          active = i - 1;
          break;
        }
      }
      done.style.strokeDashoffset = String(total - d);
      const p = route.getPointAtLength(d);
      const a = route.getPointAtLength(Math.max(0, d - 1));
      const b = route.getPointAtLength(Math.min(total, d + 1));
      const angle = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI + 90;
      player.setAttribute('transform', `translate(${p.x} ${p.y}) rotate(${angle})`);
      pins.forEach((pin, i) => {
        pin.classList.toggle('is-passed', i <= active);
        if (i === active) pin.setAttribute('aria-current', 'location');
        else pin.removeAttribute('aria-current');
      });
      nav.classList.toggle('is-visible', scrollY > (hero?.offsetHeight ?? 600) * 0.6);
    }
    const queue = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    addEventListener('scroll', queue, { passive: true });
    addEventListener('resize', queue);
    update();

    // Line the map's right edge up with the right edge of the header's "Get funded now" button
    function align() {
      const btn = [...document.querySelectorAll('.pp-nav-actions .pp-nav-cta')].find((b) => b.offsetWidth > 0);
      if (!btn) { nav.style.removeProperty('right'); return; } // phones: no header CTA, CSS places it
      if (!nav.offsetWidth) return;
      const r = btn.getBoundingClientRect();
      nav.style.right = Math.round(document.documentElement.clientWidth - r.right) + 'px';
    }
    addEventListener('resize', align);
    document.fonts?.ready.then(align);
    align();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();

// 4. How it works, step 2: the split bar is hidden in GTA (css/theme-gta.css) and the split is written
//    into the description instead. The numbers and words come from the bar's own legend, so the
//    percentages stay whatever the HTML ships with. v1 keeps the bar.
(() => {
  if (document.documentElement.dataset.theme !== 'gta') return;

  function inline() {
    const split = document.querySelector('.live-step .split');
    const desc = split?.closest('.live-step')?.querySelector('.live-step__desc');
    if (!split || !desc || desc.querySelector('.gta-split')) return;
    const parts = [...split.querySelectorAll('.legend li')].map((li) => {
      const pct = li.querySelector('strong')?.textContent.trim();
      const label = li.textContent.replace(pct, '').trim();
      return pct && label ? { pct, label: label === 'live fund' ? 'your live fund' : label } : null;
    });
    if (!parts.length || parts.some((p) => !p)) return;

    // "Each payout is split when you request it." -> "...request it: 75% to you, 10% to ..., 15% to Tradeify."
    const [first, ...rest] = desc.textContent.trim().split(/(?<=\.)\s+/);
    const span = document.createElement('span');
    span.className = 'gta-split';
    parts.forEach((p, i) => {
      const b = document.createElement('strong');
      b.textContent = p.pct;
      span.append(i ? (i === parts.length - 1 ? ' and ' : ', ') : '', b, ` ${p.label === 'you' || p.label === 'Tradeify' || p.label.startsWith('your') ? 'to ' : ''}${p.label}`);
    });
    desc.textContent = first.replace(/\.$/, ': ');
    desc.append(span, '. ' + rest.join(' '));
    split.classList.add('gta-split-src');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', inline);
  else inline();
})();

// 5. How it works, live panel labels (GTA only). Clarifies what the slider and the card show, using the
//    page's own numbers (window.MiamiPlan from js/plans.js):
//    - under the fund label: "10% of each sim payout"
//    - under the bar: "Sim payouts $X" (follows the slider) and "Goes live at $12,000" (replaces "$12K")
//    - on the card: "+ $300 Tradeify top-up" under the $1,200, and "Live profit split" for the 90/10 row
//    js/payouts.js still drives the value, the lock and the card; this only adds text beside it.
(() => {
  if (document.documentElement.dataset.theme !== 'gta') return;

  function label() {
    const plan = window.MiamiPlan;
    const root = document.querySelector('[data-fund]');
    const card = document.querySelector('[data-live-card]');
    const range = root?.querySelector('[data-fund-range]');
    if (!plan || !root || !card || !range || root.querySelector('.gta-fund-meta')) return;
    const { SPLIT, LIVE_TRIGGER, money } = plan;
    const pct = Math.round(SPLIT.fund * 100) + '%';

    const head = root.querySelector('.fund-slider__label');
    const note = document.createElement('span');
    note.className = 'gta-fund-note';
    note.textContent = `${pct} of each sim payout`;
    head?.after(note);

    const meta = document.createElement('div');
    meta.className = 'gta-fund-meta tabular';
    meta.setAttribute('aria-hidden', 'true'); // the range's own aria-valuetext already says all of this
    const paid = document.createElement('span');
    const goal = document.createElement('span');
    goal.className = 'gta-fund-meta__goal';
    goal.textContent = `Goes live at ${money(LIVE_TRIGGER)}`;
    meta.append(paid, goal);
    root.append(meta);
    const sync = () => { paid.innerHTML = `Sim payouts <strong>${money(Number(range.value))}</strong>`; };
    range.addEventListener('input', sync);
    sync();

    // Card: show how $1,200 becomes the $1,500 balance, and name the live split
    const fund = card.querySelector('.live-card__fund');
    const total = parseInt(card.querySelector('.live-card__amount')?.textContent.replace(/\D/g, ''), 10);
    const fromFund = parseInt(fund?.textContent.replace(/\D/g, ''), 10);
    if (fund && total > fromFund) {
      const top = document.createElement('p');
      top.className = 'gta-card-topup tabular';
      top.textContent = `+ ${money(total - fromFund)} Tradeify top-up`;
      fund.after(top);
    }
    const splitLabel = card.querySelector('.live-card__foot span:first-child');
    if (splitLabel) splitLabel.textContent = 'Live profit split';
  }

  // plans.js (deferred) defines window.MiamiPlan; this file can run before it, so wait for the page load
  if (document.readyState === 'complete') label();
  else addEventListener('load', label);
})();

// 6. How it works: the timeline's last line sits level with the bottom of the Live card (user). The spare
//    height goes above the timeline, opening the space under the header (user); the steps keep their own
//    spacing. Re-measured whenever either side changes size. Only
//    when the two columns sit side by side; stacked (tablet/phone) the gaps stay as they are.
(() => {
  if (document.documentElement.dataset.theme !== 'gta') return;

  function start() {
    const steps = document.querySelector('#how .live-steps');
    const card = document.querySelector('[data-live-card]');
    if (!steps || !card) return;
    const fit = () => {
      steps.style.removeProperty('--gta-steps-push');
      // Layout positions (offsets), not on-screen boxes: the card tilts on hover, which would skew them
      const pos = (el) => { let x = 0, y = 0; for (let e = el; e; e = e.offsetParent) { x += e.offsetLeft; y += e.offsetTop; } return { x, y, r: x + el.offsetWidth, b: y + el.offsetHeight }; };
      const s = pos(steps);
      const c = pos(card);
      const sideBySide = c.x >= s.r;
      const spare = c.b - s.b;
      if (sideBySide && spare > 0) steps.style.setProperty('--gta-steps-push', spare.toFixed(1) + 'px');
    };
    const ro = new ResizeObserver(() => requestAnimationFrame(fit));
    ro.observe(card);
    ro.observe(steps.parentElement);
    document.fonts?.ready.then(fit);
    fit();
  }

  if (document.readyState === 'complete') start();
  else addEventListener('load', start);
})();

// 7. Scroll reveals (GTA only, skipped under reduced motion). CSS in theme-gta.css "Scroll interactions".
//    a. Section headlines wipe in from the bottom, line by line (lines = the heading's own <br> breaks),
//       once, as they come on screen.
//    b. How it works: the dashed route draws down from marker to marker and each marker lights up as the
//       route reaches it, once.
//    Only elements still below the fold at load are prepared, so nothing already on screen is hidden, and
//    without this script everything simply shows.
(() => {
  if (document.documentElement.dataset.theme !== 'gta') return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;

  const below = (el) => el.getBoundingClientRect().top > innerHeight * 0.9;

  function splitLines(h) {
    if (h.querySelector('.gta-line')) return;
    const groups = [[]];
    [...h.childNodes].forEach((n) => (n.nodeName === 'BR' ? groups.push(n, []) : groups.at(-1).push(n)));
    let i = 0;
    groups.forEach((g) => {
      if (!Array.isArray(g) || !g.length) return;
      const line = document.createElement('span');
      line.className = 'gta-line';
      line.style.setProperty('--line', i++);
      g[0].before(line);
      line.append(...g);
    });
  }

  function start() {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-revealed');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -12% 0px' });

    document.querySelectorAll('.pricing__title, #perks-title, #payouts-title, #faq-title, #cta-title').forEach((h) => {
      if (!below(h)) return;
      splitLines(h);
      h.classList.add('gta-reveal');
      io.observe(h);
    });

    const steps = document.querySelector('#how .live-steps');
    if (steps && below(steps)) {
      [...steps.children].forEach((li, i) => li.style.setProperty('--s', i));
      steps.classList.add('gta-route', 'gta-reveal');
      io.observe(steps);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
