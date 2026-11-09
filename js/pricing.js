// Account selection: DLL tabs price every size card, each card flips between evaluation
// and sim funded rules, and each card has its own checkout. Plan carousels use Swiper
// (js/swiper-plans.js) instead of the reference site's hand-rolled scroll sync.
(function () {
  const { PLANS, DLL_LABELS, CHECKOUT_URLS, money } = window.MiamiPlan;
  const form = document.querySelector('[data-pricing-form]');
  if (!form) return;

  const $$ = (sel, root = document) => root.querySelectorAll(sel);
  const cards = [...$$('[data-plan]', form)];
  const status = document.querySelector('[data-checkout-status]');
  const announce = document.querySelector('[data-announce]');
  let size = '25K';

  const dll = () => form.elements.dll.value;

  const flash = (el) => {
    el.classList.remove('is-updated');
    void el.offsetWidth;
    el.classList.add('is-updated');
  };

  const setText = (el, value, animate) => {
    if (el.textContent === value) return;
    el.textContent = value;
    if (animate) flash(el);
  };

  function renderBar() {
    const option = dll();
    $$('[data-bar-plan]').forEach((slide) => {
      const plan = PLANS[slide.dataset.barPlan];
      const dllLabel = slide.querySelector('[data-label="dll"]');
      const price = slide.querySelector('[data-price]');
      if (dllLabel) dllLabel.textContent = DLL_LABELS[option];
      if (price) price.textContent = money(plan.price[option]);
      slide.inert = slide.dataset.barPlan !== size;
    });
    $$('[data-bar-dot]').forEach((dot) => {
      const current = dot.dataset.barDot === size;
      dot.classList.toggle('is-current', current);
      if (current) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    });
  }

  function render(animate) {
    const option = dll();
    cards.forEach((card) => {
      const plan = PLANS[card.dataset.plan];
      $$('[data-card-price]', card).forEach((el) => setText(el, money(plan.price[option]), animate));
      $$('[data-card-dll]', card).forEach((el) => {
        setText(el, option === 'soft' ? money(plan.dll) : 'None', animate);
        el.classList.toggle('is-none', option === 'none');
      });
    });
    renderBar();
    if (status) status.textContent = '';
  }

  function choose(next, source) {
    if (!next || next === size) {
      window.MiamiSwipers?.show(next || size, source);
      return;
    }
    size = next;
    renderBar();
    window.MiamiSwipers?.show(size, source);
  }

  window.addEventListener('miami:plan', (e) => {
    const { plan, source } = e.detail || {};
    if (!plan) return;
    if (plan === size) return;
    size = plan;
    renderBar();
    window.MiamiSwipers?.show(size, source);
  });

  form.addEventListener('change', () => {
    render(true);
    if (announce) {
      const option = dll();
      announce.textContent =
        `${DLL_LABELS[option]}: ` +
        cards.map((c) => `${c.dataset.plan} ${money(PLANS[c.dataset.plan].price[option])}`).join(', ');
    }
  });

  cards.forEach((card) => {
    $$('[data-flip]', card).forEach((btn) =>
      btn.addEventListener('click', () => {
        const flipped = card.classList.toggle('is-flipped');
        const front = card.querySelector('[data-face="eval"]');
        const back = card.querySelector('[data-face="funded"]');
        front.inert = flipped;
        back.inert = !flipped;
        (flipped ? back : front).querySelector('[data-flip]').focus({ preventScroll: true });
      })
    );
  });

  $$('[data-checkout]').forEach((btn) =>
    btn.addEventListener('click', () => {
      if (btn.dataset.size) size = btn.dataset.size;
      const option = dll();
      const url = CHECKOUT_URLS[size][option];
      if (url) {
        window.location.href = url;
        return;
      }
      if (status) {
        status.textContent = `Checkout isn't connected yet. Your selection: ${size}, ${DLL_LABELS[option]}, ${money(PLANS[size].price[option])}.`;
      }
      renderBar();
      window.MiamiSwipers?.show(size, null);
      if (btn.closest('[data-buy-bar]')) {
        form.querySelector(`[data-plan="${size}"]`)?.scrollIntoView({ block: 'center', inline: 'center' });
      }
    })
  );

  const bar = document.querySelector('[data-buy-bar]');
  const section = document.getElementById('plans');
  const finalCta = document.getElementById('get-started');
  if (bar && section && 'IntersectionObserver' in window) {
    const visibleCtas = new Set();
    let sectionReached = false;
    let finalVisible = false;

    const update = () => {
      const show = sectionReached && visibleCtas.size === 0 && !finalVisible;
      bar.dataset.visible = String(show);
      bar.inert = !show;
    };

    const ctaObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) visibleCtas.add(entry.target);
        else visibleCtas.delete(entry.target);
      });
      update();
    });
    $$('.plan-card__cta').forEach((btn) => ctaObserver.observe(btn));

    new IntersectionObserver(([entry]) => {
      sectionReached = entry.isIntersecting || entry.boundingClientRect.top < 0;
      update();
    }).observe(section);

    if (finalCta) {
      new IntersectionObserver(([entry]) => {
        finalVisible = entry.isIntersecting;
        update();
      }).observe(finalCta);
    }
  }

  render(false);
  // Start on 25K after Swiper mounts
  requestAnimationFrame(() => {
    choose('25K', null);
  });

  const glow = document.querySelector('[data-pricing-glow]');
  if (glow && window.Grainient) {
    let instance = null;
    const start = () => {
      instance = window.Grainient.create(glow, {
        colors: ['#0d0d10', '#24091a', '#5c1238', '#b8327a', '#ee5fa8', '#ffd0e4'],
        type: 'radial',
        flow: 0.7,
        scale: 1,
        speed: 0.6,
        silk: 0.35,
        grainAmount: 0.08,
        grainSize: 1.2,
        clickSwirl: false,
        onContextLost: () => section.classList.remove('has-glow'),
        onContextRestored: () => {
          instance?.destroy();
          start();
        },
      });
      section.classList.toggle('has-glow', Boolean(instance));
    };
    start();
  }
})();
