// Vanilla stand-ins for the reference site's React islands (hero SideRays + chart mounts).
// GTA theme hides .hero__rays in CSS; static eval/floor markup in the HTML is the fallback.
(function () {
  const rays = document.querySelector('[data-hero-rays]');
  if (rays && !rays.querySelector('canvas') && document.documentElement.dataset.theme !== 'gta') {
    rays.innerHTML =
      '<div class="hero-rays-fallback" aria-hidden="true"></div>';
  }

  // Nav toggle (design-system header expects system.js; reinforce mobile menu)
  const toggle = document.querySelector('.pp-nav-toggle');
  const menu = document.getElementById('pp-nav-menu');
  const header = document.querySelector('.pp-nav');
  if (toggle && menu && header) {
    const setOpen = (open) => {
      header.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      document.documentElement.classList.toggle('pp-nav-open', open);
    };
    toggle.addEventListener('click', () => setOpen(!header.classList.contains('is-open')));
    document.querySelector('.tf-menu-close')?.addEventListener('click', () => setOpen(false));
    menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setOpen(false)));
  }

  // Reveal-on-scroll for .reveal elements
  const reveals = document.querySelectorAll('.reveal');
  if (reveals.length && 'IntersectionObserver' in window) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      reveals.forEach((el) => el.classList.add('is-in'));
    } else {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-in');
            io.unobserve(entry.target);
          });
        },
        { threshold: 0.15 }
      );
      reveals.forEach((el) => io.observe(el));
    }
  }
})();
