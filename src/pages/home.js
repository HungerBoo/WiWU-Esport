import { renderLayout } from '../components/layout.js';
import { paulanergartenNews, site, teamShowcase } from '../content/site-data.js';

const oldLogoImage = '/images/Geschichte-alt.png';
const newLogoImage = '/images/Geschichte-neu.png';

export function renderHome() {
  renderLayout(`
    <section class="home-hero">
      <div class="home-hero-media" aria-hidden="true"><img src="/images/Geschichte-neu.png" alt=""></div>
      <div class="home-hero-content">
        <p class="home-hero-kicker">Esport Verein aus Siegen</p>
        <h1>Wieländer<br>Wühlmäuse</h1>
        <p class="home-hero-copy">Wir sind ein Konglomerat der Speerspitze des E-Sports des Siegerlandes. Wir kennen Keine Hämmung, egal in welchem Spiel spontanen Durchfall zu bekommen und so geschmeidig wie ein Buttergolem ins lower Bracket zu droppen. </p>
        <div class="home-game-links">
          <a href="league-of-legends.html">League of Legends <span>↗</span></a>
          <a href="super-smash-bros.html">Super Smash Bros. <span>↗</span></a>
        </div>
      </div>
      <a class="home-hero-social" href="${siteInstagramUrl()}" target="_blank" rel="noreferrer">Instagram <span>@wiwu.esport ↗</span></a>
    </section>
    ${renderPaulanergarten(paulanergartenNews)}
    ${renderMeetTheTeam(teamShowcase)}
    <section class="history-grid">
      <div class="history-images">
        <img src="${oldLogoImage}" alt="Altes Branding der Wieländer Wühlmäuse" loading="lazy">
        <img src="${newLogoImage}" alt="Neues Logo der Wieländer Wühlmäuse" loading="lazy">
      </div>
      <div>
    <p class="eyebrow">03 / TEAMPROFIL</p>

    <h2>Wieländer<br><em>Wühlmäuse.</em></h2>

    <div class="story-copy">
        <p>
            Die Wieländer Wühlmäuse sind nicht nur irgendeine Orga, nein, sie sind eine Institution des deutschen elektronischen Sportes.
            Ihre humble beginnings bestritten die Künstler der Kluft Anfang 2024 in der Prime League.
            Nach vielen terminlichen Problemen aufgrund von falk'schen Ungereimtheiten musste die Saison jedoch frühzeitig beendet werden.
        </p>

        <p>
            Erneut haben die Buben 2025/26 durchgestartet, mit Neuzugängen aus der Uniliga für das League-Team und dem Einstieg in die kompetitive SSBU-Szene in Madrid.
            Unsere Helden starten ein neues Kapitel, in dem auch die Social-Media-Präsenz und das Trikot-Design nichts zu wünschen übrig lassen.
            Mit Hilfe eines neuen, in der Wüste der arabischen Halbinsel erstellten Logos wurde ein erneutes Aufblühen des regionalen Sport-Titanen untermauert.
        </p>

        <p>
            Heute wachsen die Wühlmäuse stetig – sowohl in Sachen Fans, Skills als auch Erfahrung.
        </p>
      </div>
    </div>
    </section>
    <section class="instagram-section" aria-labelledby="instagram-heading">
      <div class="section-heading"><p class="eyebrow">04 / SOCIAL</p><h2 id="instagram-heading">Instagram</h2></div>
      <div class="instagram-embed">
        <blockquote class="instagram-media" data-instgrm-permalink="${siteInstagramUrl()}" data-instgrm-version="14"></blockquote>
      </div>
      <a class="text-link" href="${siteInstagramUrl()}" target="_blank" rel="noreferrer">@wiwu.esport auf Instagram <span>↗</span></a>
    </section>
  `, 'home');

  setupTeamPhotoCarousel(teamShowcase.photos);
  loadInstagramEmbed();
}

function renderPaulanergarten(newsItems) {
  return `
    <section class="paulaner-section" aria-labelledby="paulaner-heading">
      <div class="section-heading">
        <div>
          <div class="paulaner-eyebrow-row">
            <p class="eyebrow">01 / LATEST NEWS & FEEDS</p>
            <span class="paulaner-wip-badge">WIP • nur Bullshit for now</span>
          </div>
          <h2 id="paulaner-heading">Neues ausm<br><em>Paulanergarten.</em></h2>
        </div>
        <p class="paulaner-lead">Frische Updates von der Kluft bis zum Smash-Bracket – Live-Feeds, Rank-Ups und Spieltags-Berichte. <small class="paulaner-wip-note">(Hier entsteht die automatische Riot-, Prime League- & Start.gg-Anbindung)</small></p>
      </div>

      <div class="paulaner-grid">
        ${newsItems.map((item) => `
          <article class="paulaner-card" data-category="${item.category}">
            <div class="paulaner-card-header">
              <span class="paulaner-badge">${item.badge}</span>
              <time class="paulaner-date">${item.date}</time>
            </div>
            <div class="paulaner-card-body">
              <span class="paulaner-tag">${item.tag}</span>
              <h3>${item.title}</h3>
              <p>${item.description}</p>
            </div>
            <div class="paulaner-card-footer">
              <span class="paulaner-meta">${item.meta}</span>
              <span class="paulaner-icon">↗</span>
            </div>
          </article>
        `).join('')}
      </div>
    </section>
  `;
}

function renderMeetTheTeam(showcase) {
  const photos = showcase.photos || [];
  const initialPlayer = photos[0] || { name: '', role: '', team: '', quote: '' };

  return `
    <section class="meet-the-team-section" aria-labelledby="meet-the-team-heading">
      <div class="meet-the-team-grid">
        <div class="meet-the-team-carousel-col">
          <div class="team-carousel-wrapper" aria-label="Spieler-Fotos der Wieländer Wühlmäuse" tabindex="0">
            <div class="team-photo-frame">
              <div class="team-carousel-viewport">
                ${photos.map((photo, index) => `
                  <figure class="team-carousel-slide${index === 0 ? ' is-active' : ''}" data-slide-index="${index}">
                    <img src="${photo.src}" alt="${photo.alt}" loading="lazy">
                  </figure>
                `).join('')}
              </div>
              <div class="team-photo-frame-caption">
                <div class="team-photo-meta">
                  <a href="spielerprofil.html?player=${initialPlayer.slug || 'falafl'}" class="carousel-player-link" data-carousel-caption-link>
                    <strong data-carousel-caption-title>${initialPlayer.name}${initialPlayer.alias ? ` (${initialPlayer.alias})` : ''}</strong>
                  </a>
                  <span data-carousel-caption-tag>${initialPlayer.role}</span>
                </div>
                <div class="team-carousel-counter" data-carousel-counter>
                  <span class="current">01</span> / <span class="total">${String(photos.length).padStart(2, '0')}</span>
                </div>
              </div>
            </div>

            <div class="team-carousel-controls">
              <button type="button" class="team-carousel-btn prev" data-carousel-prev aria-label="Vorheriger Spieler">
                <span>←</span> Zurück
              </button>
              <div class="team-carousel-dots" role="tablist" aria-label="Spielerauswahl">
                ${photos.map((photo, index) => `
                  <button type="button" class="team-carousel-dot${index === 0 ? ' is-active' : ''}" role="tab" aria-selected="${index === 0}" aria-label="${photo.name}${photo.alias ? ` (${photo.alias})` : ''} anzeigen" data-slide-target="${index}"></button>
                `).join('')}
              </div>
              <button type="button" class="team-carousel-btn next" data-carousel-next aria-label="Nächster Spieler">
                Weiter <span>→</span>
              </button>
            </div>
          </div>
        </div>

        <div class="meet-the-team-content-col">
          <p class="eyebrow">${showcase.eyebrow}</p>
          <h2 id="meet-the-team-heading">${showcase.title}<br><em>${showcase.subtitle}</em></h2>

          <div class="story-copy">
            <p>${showcase.description}</p>
          </div>

          <div class="active-player-spotlight" aria-live="polite">
            <div class="spotlight-header">
              <h3 class="spotlight-name" data-spotlight-name>${initialPlayer.name}${initialPlayer.alias ? ` <span class="spotlight-alias">(${initialPlayer.alias})</span>` : ''}</h3>
              <span class="spotlight-badge" data-spotlight-team>${initialPlayer.team}</span>
            </div>
            <p class="spotlight-role" data-spotlight-role>${initialPlayer.role}</p>
            <p class="spotlight-quote" data-spotlight-quote>„${initialPlayer.quote}“</p>
            <a href="spielerprofil.html?player=${initialPlayer.slug || 'falafl'}" class="spotlight-profile-link" data-spotlight-profile-link>
              Steckbrief & Spielerprofil <span>↗</span>
            </a>
          </div>

          <div class="team-quick-facts">
            ${showcase.quickFacts.map((fact) => `
              <div class="team-fact-item">
                <span class="team-fact-label">${fact.label}</span>
                <strong class="team-fact-value">${fact.value}</strong>
              </div>
            `).join('')}
          </div>

          <div class="team-roster-cards">
            ${showcase.divisions.map((div) => `
              <a href="${div.href}" class="team-division-card">
                <div>
                  <h4>${div.name}</h4>
                  <p>${div.subtitle}</p>
                </div>
                <span class="arrow">↗</span>
              </a>
            `).join('')}
          </div>
        </div>
      </div>
    </section>
  `;
}

function setupTeamPhotoCarousel(photos) {
  const carouselWrapper = document.querySelector('.team-carousel-wrapper');
  if (!carouselWrapper || !photos || photos.length <= 1) return;

  const slides = [...carouselWrapper.querySelectorAll('.team-carousel-slide')];
  const dots = [...carouselWrapper.querySelectorAll('.team-carousel-dot')];
  const prevBtn = carouselWrapper.querySelector('[data-carousel-prev]');
  const nextBtn = carouselWrapper.querySelector('[data-carousel-next]');
  const captionTitleEl = carouselWrapper.querySelector('[data-carousel-caption-title]');
  const captionTagEl = carouselWrapper.querySelector('[data-carousel-caption-tag]');
  const counterCurrent = carouselWrapper.querySelector('[data-carousel-counter] .current');

  const spotlightNameEl = document.querySelector('[data-spotlight-name]');
  const spotlightTeamEl = document.querySelector('[data-spotlight-team]');
  const spotlightRoleEl = document.querySelector('[data-spotlight-role]');
  const spotlightQuoteEl = document.querySelector('[data-spotlight-quote]');
  const spotlightLinkEl = document.querySelector('[data-spotlight-profile-link]');
  const captionLinkEl = carouselWrapper.querySelector('[data-carousel-caption-link]');

  let currentIndex = 0;
  let autoplayTimer = null;

  carouselWrapper.querySelectorAll('img').forEach((img) => {
    img.addEventListener('error', () => {
      img.src = '/images/Wiwu_Logo.jpg';
      img.alt = 'WiWU Logo als Platzhalter';
    }, { once: true });
  });

  function goToSlide(newIndex) {
    currentIndex = (newIndex + slides.length) % slides.length;
    const player = photos[currentIndex];

    slides.forEach((slide, idx) => {
      slide.classList.toggle('is-active', idx === currentIndex);
    });

    dots.forEach((dot, idx) => {
      const isActive = idx === currentIndex;
      dot.classList.toggle('is-active', isActive);
      dot.setAttribute('aria-selected', String(isActive));
    });

    if (player) {
      const playerUrl = `spielerprofil.html?player=${player.slug || 'falafl'}`;
      if (captionTitleEl) captionTitleEl.textContent = player.alias ? `${player.name} (${player.alias})` : player.name;
      if (captionTagEl) captionTagEl.textContent = player.role;
      if (captionLinkEl) captionLinkEl.href = playerUrl;
      if (spotlightNameEl) spotlightNameEl.innerHTML = player.alias ? `${player.name} <span class="spotlight-alias">(${player.alias})</span>` : player.name;
      if (spotlightTeamEl) spotlightTeamEl.textContent = player.team;
      if (spotlightRoleEl) spotlightRoleEl.textContent = player.role;
      if (spotlightQuoteEl) spotlightQuoteEl.textContent = `„${player.quote}“`;
      if (spotlightLinkEl) spotlightLinkEl.href = playerUrl;
    }

    if (counterCurrent) {
      counterCurrent.textContent = String(currentIndex + 1).padStart(2, '0');
    }
  }

  function startAutoplay() {
    stopAutoplay();
    autoplayTimer = window.setInterval(() => {
      goToSlide(currentIndex + 1);
    }, 7500);
  }

  function stopAutoplay() {
    if (autoplayTimer) {
      clearInterval(autoplayTimer);
      autoplayTimer = null;
    }
  }

  prevBtn?.addEventListener('click', () => {
    goToSlide(currentIndex - 1);
    startAutoplay();
  });

  nextBtn?.addEventListener('click', () => {
    goToSlide(currentIndex + 1);
    startAutoplay();
  });

  dots.forEach((dot, idx) => {
    dot.addEventListener('click', () => {
      goToSlide(idx);
      startAutoplay();
    });
  });

  carouselWrapper.addEventListener('mouseenter', stopAutoplay);
  carouselWrapper.addEventListener('mouseleave', startAutoplay);
  carouselWrapper.addEventListener('focusin', stopAutoplay);
  carouselWrapper.addEventListener('focusout', startAutoplay);

  carouselWrapper.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
      goToSlide(currentIndex - 1);
      startAutoplay();
    } else if (e.key === 'ArrowRight') {
      goToSlide(currentIndex + 1);
      startAutoplay();
    }
  });

  let touchStartX = 0;
  let touchEndX = 0;

  carouselWrapper.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
    stopAutoplay();
  }, { passive: true });

  carouselWrapper.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        goToSlide(currentIndex + 1);
      } else {
        goToSlide(currentIndex - 1);
      }
    }
    startAutoplay();
  }, { passive: true });

  startAutoplay();
}

function siteInstagramUrl() {
  return 'https://www.instagram.com/wiwu.esport/';
}

function renderStats(view) {
  const stats = primeLeague.stats[view];
  const container = document.querySelector('[data-stats-container]');
  if (!container) return;

  container.innerHTML = stats.values.map(([label, value]) => `
    <div><strong>${value}</strong><span>${label}</span></div>
  `).join('');

  document.querySelectorAll('[data-stats-view]').forEach((button) => {
    const isActive = button.dataset.statsView === view;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-selected', String(isActive));
  });
}

function loadInstagramEmbed() {
  if (document.querySelector('script[data-instgrm-script]')) {
    window.instgrm?.Embeds.process();
    return;
  }

  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.instagram.com/embed.js';
  script.dataset.instgrmScript = 'true';
  script.onload = () => window.instgrm?.Embeds.process();
  document.body.appendChild(script);
}
