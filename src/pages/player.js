import { renderLayout } from '../components/layout.js';
import { getProfile, allProfiles } from '../playersites/index.js';

export function renderPlayerPage(playerSlug) {
  const player = getProfile(playerSlug);
  const age = calculateAge(player.birthDate);

  renderLayout(`
    <div class="player-profile-page">
      <nav class="player-breadcrumb" aria-label="Breadcrumb">
        <a href="/" class="back-link">← Zurück zur Startseite</a>
        <span class="separator">/</span>
        <span class="current">Spielerprofil: ${player.gamertag}</span>
      </nav>

      <section class="player-profile-hero">
        <div class="player-profile-media">
          <div class="player-hero-photo-frame">
            <img src="${player.image}" alt="${player.name}" loading="eager">
            <div class="player-photo-caption">
              <strong>${player.gamertag}</strong>
              <span>${player.role}</span>
            </div>
          </div>
        </div>

        <div class="player-profile-intro">
          <p class="eyebrow">SPIELERPROFIL // ${player.team.toUpperCase()}</p>
          <h1>${player.name}</h1>
          ${player.alias ? `<p class="player-profile-alias">auch bekannt als: <strong>${player.alias}</strong></p>` : ''}
          <p class="player-profile-role-badge">${player.role}</p>
          <p class="player-profile-quote">„${player.details?.quote || player.steckbrief.notes}“</p>

          <div class="player-profile-links">
            ${player.links.map(l => `
              <a href="${l.url}" class="player-ext-btn" target="_blank" rel="noreferrer">
                ${l.label} <span>↗</span>
              </a>
            `).join('')}
          </div>
        </div>
      </section>

      <section class="player-steckbrief-section" aria-labelledby="steckbrief-heading">
        <div class="steckbrief-section-header">
          <p class="eyebrow">PERSÖNLICHER STECKBRIEF</p>
          <h2 id="steckbrief-heading">Steckbrief <em>& Infos.</em></h2>
        </div>

        <!-- Ripped-out Notebook Page -->
        <div class="notebook-wrapper">
          <article class="notebook-sheet">
            <div class="notebook-spiral-holes" aria-hidden="true">
              <span></span><span></span><span></span><span></span><span></span><span></span>
            </div>

            <header class="notebook-sheet-header">
              <div class="notebook-sheet-title">
                <span class="notebook-badge">WIWU STECKBRIEF</span>
                <span class="notebook-player-name">${player.name}</span>
              </div>
              <span class="notebook-date">Stand: ${new Date().toLocaleDateString('de-DE')}</span>
            </header>

            <div class="notebook-fields">
              <div class="notebook-entry">
                <span class="notebook-label">Gamertag:</span>
                <div class="notebook-value-wrap">
                  <span class="notebook-value">${player.steckbrief.gamertag}</span>
                </div>
              </div>

              <div class="notebook-entry">
                <span class="notebook-label">Alter / Geburtstag:</span>
                <div class="notebook-value-wrap">
                  <span class="notebook-value">${age} &nbsp;•&nbsp; ${formatDate(player.birthDate)}</span>
                </div>
              </div>

              <div class="notebook-entry">
                <span class="notebook-label">Lieblingsfilm / Serie:</span>
                <div class="notebook-value-wrap">
                  <span class="notebook-value">${player.steckbrief.favMovieSeries}</span>
                </div>
              </div>

              <div class="notebook-entry">
                <span class="notebook-label">Bestes Zitat:</span>
                <div class="notebook-value-wrap">
                  <span class="notebook-value notebook-quote-value">„${player.steckbrief.bestQuote || player.details?.quote || ''}“</span>
                </div>
              </div>

              <div class="notebook-entry">
                <span class="notebook-label">Disziplin & Rolle:</span>
                <div class="notebook-value-wrap">
                  <span class="notebook-value">${player.team} &nbsp;—&nbsp; ${player.role}</span>
                </div>
              </div>

              <div class="notebook-entry notebook-entry--multiline">
                <span class="notebook-label">Signature Picks & Stil:</span>
                <div class="notebook-value-wrap">
                  <span class="notebook-value">${player.details?.signaturePicks?.join(', ') || '-'}</span>
                  <span class="notebook-subvalue">${player.details?.playstyle || ''}</span>
                </div>
              </div>

              <div class="notebook-entry notebook-entry--notes">
                <span class="notebook-label">Notizen & Besonderheiten:</span>
                <div class="notebook-notes-content">
                  <p>${player.steckbrief.notes}</p>
                </div>
              </div>

              <div class="notebook-signature-container">
                <div class="notebook-signature-block">
                  <div class="notebook-signature-visual">
                    <img class="notebook-signature-img" src="/src/playersites/${player.slug}/signature.png" alt="Unterschrift von ${player.gamertag}" onerror="this.style.display='none'; this.nextElementSibling.classList.add('is-active');">
                    <span class="notebook-signature-handwritten">${player.gamertag}</span>
                  </div>
                  <div class="notebook-signature-bar"></div>
                  <span class="notebook-signature-caption">Unterschrift / Signature</span>
                </div>
              </div>
            </div>
          </article>
        </div>
      </section>

      <!-- Teammates Switcher -->
      <section class="teammates-nav-section" aria-labelledby="teammates-heading">
        <div class="section-heading">
          <div>
            <p class="eyebrow">KADER-NAVIGATOR</p>
            <h2 id="teammates-heading">Weitere <em>Wühlmäuse.</em></h2>
          </div>
        </div>
        <div class="teammates-pill-grid">
          ${allProfiles.map(p => `
            <a href="spielerprofil.html?player=${p.slug}" class="teammate-pill${p.slug === player.slug ? ' is-active' : ''}">
              <img src="${p.image}" alt="" aria-hidden="true" onerror="this.src='/images/Wiwu_Logo.jpg'">
              <div>
                <strong>${p.gamertag}</strong>
                <span>${p.role}</span>
              </div>
            </a>
          `).join('')}
        </div>
      </section>
    </div>
  `, 'spielerprofil');

  document.querySelectorAll('.player-hero-photo-frame img, .teammate-pill img').forEach((img) => {
    img.addEventListener('error', () => {
      img.src = '/images/Wiwu_Logo.jpg';
    }, { once: true });
  });
}

function calculateAge(birthDate) {
  if (!birthDate) return 'Alter unbekannt';
  const [year, month, day] = birthDate.split('-').map(Number);
  const today = new Date();
  let age = today.getFullYear() - year;
  const birthdayHasPassed = today.getMonth() + 1 > month
    || (today.getMonth() + 1 === month && today.getDate() >= day);
  if (!birthdayHasPassed) age -= 1;
  return `${age} Jahre`;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}.${m}.${y}`;
}
