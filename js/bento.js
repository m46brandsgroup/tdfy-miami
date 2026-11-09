// Benefits bento: each tile plays one small entrance once, as the grid scrolls into view
// (the target fills and Passed settles, Friday's payout lands, equity draws above the
// floor, the live figure rises). The finished state is the CSS default; the grid is only
// armed when the entrance can actually play.
(function () {
  const grid = document.querySelector('[data-bento]');
  if (!grid || !('IntersectionObserver' in window)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  // Already on screen at load: show the result rather than replaying under the reader
  if (grid.getBoundingClientRect().top < window.innerHeight * 0.85) return;

  grid.classList.add('is-armed');
  const seen = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;
    grid.classList.add('is-in');
    seen.disconnect();
  }, { threshold: 0.3 });
  seen.observe(grid);
})();
