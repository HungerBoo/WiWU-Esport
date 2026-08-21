export function setupIntroMorph() {
  const wrapper = document.querySelector('.intro-splash-wrapper');
  const splash = document.querySelector('.intro-splash');
  const heroSlot = document.querySelector('.intro-logo-slot');
  const header = document.querySelector('.site-header');
  const headerSlot = document.getElementById('header-logo-slot');
  const morphLogo = document.getElementById('morph-logo');
  const siteTitle = document.getElementById('site-title');
  const scrollIndicator = document.querySelector('.intro-scroll-indicator');
  const tiles = Array.from(document.querySelectorAll('.tile-grid .tile:not(.tile--brand)'));

  // Guard: only run on pages that actually render the intro splash markup.
  if (!wrapper || !splash || !heroSlot || !headerSlot || !morphLogo) {
    return;
  }

  // Header stays hidden until the logo has (almost) landed in its slot.
  const HEADER_REVEAL_THRESHOLD = 0.85;
  const LOGO_SCROLL_SHARE = 0.48;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduceMotion) {
    placeLogoStatically();
    header?.classList.add('is-visible');
    return;
  }

  let heroRect;
  let headerRect;
  let wrapperTop;
  let pinDistance;
  let logoTravelDistance;
  let ticking = false;

  function measure() {
    // Both the hero logo slot (inside the sticky .intro-splash) and the header logo slot
    // (inside the sticky header) stay at a constant viewport position while pinned,
    // so we only need their viewport-relative rects — no scroll-offset math required.
    heroRect = heroSlot.getBoundingClientRect();
    headerRect = headerSlot.getBoundingClientRect();

    const wrapRect = wrapper.getBoundingClientRect();
    wrapperTop = wrapRect.top + window.scrollY;
    pinDistance = wrapper.offsetHeight - window.innerHeight;
    logoTravelDistance = Math.max(1, pinDistance * LOGO_SCROLL_SHARE);
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function clamp01(value) {
    return Math.min(1, Math.max(0, value));
  }

  function update() {
    ticking = false;
    const scrollY = window.scrollY || window.pageYOffset;
    const splashProgress = clamp01(pinDistance > 0 ? (scrollY - wrapperTop) / pinDistance : 1);
    // The logo should travel its real viewport distance, rather than the full splash height.
    const logoProgress = clamp01((scrollY - wrapperTop) / logoTravelDistance);

    const currentTop = lerp(heroRect.top, headerRect.top, logoProgress);
    const currentLeft = lerp(heroRect.left, headerRect.left, logoProgress);
    const currentSize = lerp(heroRect.width, headerRect.width, logoProgress);
    morphLogo.style.transform = `translate(${currentLeft}px, ${currentTop}px)`;
    morphLogo.style.width = `${currentSize}px`;
    morphLogo.style.height = `${currentSize}px`;
    siteTitle?.classList.toggle('is-visible', logoProgress > 0.85);
    header?.classList.toggle('is-visible', logoProgress > HEADER_REVEAL_THRESHOLD);

    tiles.forEach((tile, index) => {
      const tileProgress = splashProgress;
      const direction = index % 2 === 0 ? -1 : 1;
      tile.style.opacity = String(1 - tileProgress);
      // Skip the rotate/scale transform on the roster tile: it fights with its 3D cube rotation and glitches while scrolling.
      if (tile.classList.contains('tile--roster')) {
        tile.style.transform = `translateY(${-tileProgress * 30}px)`;
      } else {
        tile.style.transform = `translateY(${-tileProgress * 30}px) rotate(${direction * tileProgress * 3}deg) scale(${1 - tileProgress * 0.06})`;
      }
    });

    if (scrollIndicator) {
      scrollIndicator.style.opacity = splashProgress > 0.04 ? '0' : '1';
    }

    splash.style.pointerEvents = splashProgress >= 1 ? 'none' : 'auto';
  }

  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }

  function onResize() {
    measure();
    update();
  }

  measure();
  update();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize);
  // Fonts/logo images/grid reflow can shift layout after first paint; re-measure once everything has settled.
  window.addEventListener('load', onResize);
  document.fonts?.ready.then(onResize);
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(onResize).observe(wrapper);
  }

  function placeLogoStatically() {
    const rect = heroSlot.getBoundingClientRect();
    morphLogo.style.transform = `translate(${rect.left}px, ${rect.top}px)`;
    morphLogo.style.width = `${rect.width}px`;
    morphLogo.style.height = `${rect.height}px`;
    siteTitle?.classList.add('is-visible');
  }
}
