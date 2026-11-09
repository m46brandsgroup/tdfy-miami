// Swiper-powered carousels for plan cards (mobile) and the sticky buy-bar.
// Replaces the hand-rolled scroll-snap sync from the reference pricing.js.
(function () {
  if (typeof Swiper === 'undefined') return;

  const PLAN_ORDER = ['10K', '25K', '50K'];

  function planIndex(key) {
    const i = PLAN_ORDER.indexOf(key);
    return i < 0 ? 1 : i;
  }

  // —— Plan cards: Swiper only below 761px (matches reference CSS break) ——
  const cardsRoot = document.querySelector('[data-plan-cards]');
  let cardsSwiper = null;
  if (cardsRoot) {
    cardsRoot.classList.add('swiper');
    const wrap = document.createElement('div');
    wrap.className = 'swiper-wrapper';
    [...cardsRoot.children].forEach((card) => {
      card.classList.add('swiper-slide');
      wrap.appendChild(card);
    });
    cardsRoot.appendChild(wrap);

    cardsSwiper = new Swiper(cardsRoot, {
      slidesPerView: 1.15,
      spaceBetween: 12,
      centeredSlides: true,
      grabCursor: true,
      breakpoints: {
        761: {
          enabled: false,
          slidesPerView: 3,
          spaceBetween: 12,
          centeredSlides: false,
        },
      },
      on: {
        slideChange(sw) {
          const plan = sw.slides[sw.activeIndex]?.dataset?.plan;
          if (plan) window.dispatchEvent(new CustomEvent('miami:plan', { detail: { plan, source: 'cards' } }));
        },
      },
    });
  }

  // —— Buy bar plan picker ——
  const barSlider = document.querySelector('.buy-bar__slider');
  const barTrack = document.querySelector('[data-bar-track]');
  let barSwiper = null;
  if (barSlider && barTrack) {
    // Dots must sit outside the Swiper root so they aren't treated as slides
    const dots = barSlider.querySelector('.buy-bar__dots');
    if (dots && dots.parentElement === barSlider) {
      barSlider.parentElement.insertBefore(dots, barSlider.nextSibling);
    }

    const swiperRoot = document.createElement('div');
    swiperRoot.className = 'buy-bar__swiper swiper';
    barTrack.classList.add('swiper-wrapper');
    [...barTrack.children].forEach((slide) => slide.classList.add('swiper-slide'));
    barSlider.insertBefore(swiperRoot, barTrack);
    swiperRoot.appendChild(barTrack);

    barSwiper = new Swiper(swiperRoot, {
      slidesPerView: 1,
      spaceBetween: 0,
      speed: 280,
      resistanceRatio: 0.65,
      on: {
        slideChange(sw) {
          const plan = sw.slides[sw.activeIndex]?.dataset?.barPlan;
          if (plan) {
            document.querySelectorAll('[data-bar-dot]').forEach((dot) => {
              const on = dot.dataset.barDot === plan;
              dot.classList.toggle('is-current', on);
              if (on) dot.setAttribute('aria-current', 'true');
              else dot.removeAttribute('aria-current');
            });
            window.dispatchEvent(new CustomEvent('miami:plan', { detail: { plan, source: 'bar' } }));
          }
        },
      },
    });

    document.querySelectorAll('[data-bar-dot]').forEach((dot) => {
      dot.addEventListener('click', () => {
        barSwiper.slideTo(planIndex(dot.dataset.barDot));
      });
    });
  }

  window.MiamiSwipers = {
    cards: cardsSwiper,
    bar: barSwiper,
    show(plan, source) {
      const idx = planIndex(plan);
      if (source !== 'cards' && cardsSwiper && !cardsSwiper.destroyed && cardsSwiper.enabled) {
        cardsSwiper.slideTo(idx);
      }
      if (source !== 'bar' && barSwiper && !barSwiper.destroyed) {
        barSwiper.slideTo(idx);
      }
    },
  };
})();
