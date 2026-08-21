import { renderPlayerCard } from '../components/cards.js';
import { renderLayout } from '../components/layout.js';
import { games } from '../content/site-data.js';

export async function renderGame(gameKey) {
  const game = games[gameKey];

  renderLayout(`
    <section class="game-hero">
      <div class="game-hero-heading">
        <h1>${game.heading.replace(' ', '<br>')}</h1>
        <img class="game-logo" src="${game.logo}" alt="${game.title} Logo">
      </div>
      <div class="game-hero-copy">
        <p class="game-hero-description">${game.description}</p>
      </div>
      ${renderStatementsCarousel(game.statements)}
    </section>
    <section class="roster-section" aria-labelledby="roster-heading">
      <div class="section-heading"><div><h2 id="roster-heading">Kader</h2><p class="roster-hint">Karte anklicken für Stats und Profile</p></div></div>
      <p class="roster-status">Kader wird geladen ...</p>
    </section>
    ${game.teamImage ? `<img class="team-image" src="${game.teamImage}" alt="Kader von ${game.title}" loading="lazy">` : ''}
  `, gameKey);

  setupStatementsCarousel();

  try {
    const response = await fetch('/data/players.json');
    if (!response.ok) {
      throw new Error(`Spielerdaten konnten nicht geladen werden (${response.status}).`);
    }

    const playerData = await response.json();
    const players = playerData[gameKey] || [];
    const roster = document.querySelector('.roster-section');
    const profileLabel = gameKey === 'smash' ? 'Supermajor' : 'Prime League';
    roster.querySelector('.roster-status').outerHTML = players.length
      ? `<div class="roster-grid">${players.map((player) => renderPlayerCard({ ...player, profileLabel })).join('')}</div>`
      : '<p class="roster-status">Keine Spieler eingetragen.</p>';

    document.querySelectorAll('.player-card img').forEach((image) => {
      image.addEventListener('error', () => {
        image.src = '/images/Wiwu_Logo.jpg';
        image.alt = 'WiWU Logo als Platzhalter';
      }, { once: true });
    });

    document.querySelectorAll('.player-card').forEach((card) => {
      const front = card.querySelector('.player-card-front');
      const back = card.querySelector('.player-card-back');

      const setFlipped = (flipped) => {
        card.classList.toggle('is-flipped', flipped);
        front.setAttribute('aria-hidden', String(flipped));
        back.setAttribute('aria-hidden', String(!flipped));
      };

      card.addEventListener('click', (event) => {
        if (event.target.closest('a')) return;
        setFlipped(!card.classList.contains('is-flipped'));
      });
      card.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') setFlipped(false);
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          setFlipped(!card.classList.contains('is-flipped'));
        }
      });
    });
  } catch (error) {
    document.querySelector('.roster-status').textContent = 'Die Kaderdaten konnten nicht geladen werden.';
    console.error(error);
  }
}

function renderStatementsCarousel(statements) {
  if (!statements?.length) {
    return '';
  }

  return `
    <div class="intro-carousel">
      <div class="intro-carousel-track">
        ${statements.map(({ name, text }) => `
          <blockquote class="intro-carousel-slide">
            <p>${text}</p>
            <cite>${name}</cite>
          </blockquote>
        `).join('')}
      </div>
      ${statements.length > 1 ? `
        <div class="intro-carousel-dots">
          ${statements.map((statement, index) => `<button class="intro-carousel-dot" type="button" data-index="${index}" aria-label="${statement.name} anzeigen"></button>`).join('')}
        </div>
      ` : ''}
    </div>
  `;
}

function setupStatementsCarousel() {
  const carousel = document.querySelector('.intro-carousel');
  if (!carousel) return;

  const track = carousel.querySelector('.intro-carousel-track');
  const slides = [...carousel.querySelectorAll('.intro-carousel-slide')];
  const dots = [...carousel.querySelectorAll('.intro-carousel-dot')];

  if (slides.length <= 1) return;

  let index = 0;
  let timer = null;
  let dragStartX = null;
  let dragDeltaX = 0;
  let isDragging = false;
  let dragged = false;

  const goTo = (nextIndex) => {
    index = (nextIndex + slides.length) % slides.length;
    track.style.transform = `translateX(-${index * 100}%)`;
    dots.forEach((dot, dotIndex) => dot.classList.toggle('is-active', dotIndex === index));
  };

  const finishDrag = () => {
    if (!isDragging) return;
    const threshold = Math.max(40, carousel.clientWidth * 0.12);
    if (Math.abs(dragDeltaX) >= threshold) {
      goTo(index + (dragDeltaX < 0 ? 1 : -1));
    } else {
      goTo(index);
    }
    dragStartX = null;
    dragDeltaX = 0;
    isDragging = false;
    carousel.classList.remove('is-dragging');
    window.setTimeout(() => { dragged = false; }, 0);
  };

  const stopAutoplay = () => {
    if (timer) window.clearInterval(timer);
    timer = null;
  };

  const startAutoplay = () => {
    stopAutoplay();
    timer = window.setInterval(() => goTo(index + 1), 15000);
  };

  dots.forEach((dot, dotIndex) => dot.addEventListener('click', () => { goTo(dotIndex); startAutoplay(); }));

  carousel.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    if (event.target.closest('.intro-carousel-dot')) return;
    dragStartX = event.clientX;
    dragDeltaX = 0;
    isDragging = true;
    dragged = false;
    carousel.setPointerCapture?.(event.pointerId);
    carousel.classList.add('is-dragging');
    stopAutoplay();
  });

  carousel.addEventListener('pointermove', (event) => {
    if (!isDragging || dragStartX === null) return;
    dragDeltaX = event.clientX - dragStartX;
    if (Math.abs(dragDeltaX) > 6) dragged = true;
    track.style.transform = `translateX(calc(-${index * 100}% + ${dragDeltaX}px))`;
  });

  carousel.addEventListener('pointerup', (event) => {
    finishDrag();
    carousel.releasePointerCapture?.(event.pointerId);
    startAutoplay();
  });
  carousel.addEventListener('pointercancel', () => {
    finishDrag();
    startAutoplay();
  });
  carousel.addEventListener('click', (event) => {
    if (dragged) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);

  carousel.addEventListener('mouseenter', stopAutoplay);
  carousel.addEventListener('mouseleave', startAutoplay);
  carousel.addEventListener('focusin', stopAutoplay);
  carousel.addEventListener('focusout', startAutoplay);

  goTo(0);
  startAutoplay();
}
