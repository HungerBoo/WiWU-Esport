export function renderPlayerCard({ slug, name, role, birthDate, image, profile, profileLabel = 'Prime League', opgg, stats, rank }) {
  const age = calculateAge(birthDate);
  const playerSlug = slug || name.toLowerCase().replace(/[^a-z0-9]/g, '');

  return `
    <article class="player-card" tabindex="0" aria-label="${name}: Karte umdrehen für Details">
      <div class="player-card-inner">
        <button class="player-card-front" type="button" aria-label="Details zu ${name} anzeigen">
          <div class="player-card-img-wrap">
            <img src="${image}" alt="${name}" loading="lazy">
          </div>
          <span class="player-card-overlay">
            <span class="player-card-role-tag">${role}</span>
            <strong class="player-card-name">${name}</strong>
            <span class="player-card-hint">Karte wenden <span>⟲</span></span>
          </span>
        </button>
        <div class="player-card-back" aria-hidden="true">
          <div class="player-info">
            <div class="player-back-header">
              <h3>${name}</h3>
              <span class="player-back-role">${role}</span>
            </div>
            <p class="player-back-age">${age}</p>
            ${renderPlayerStats({ stats, rank, profileLabel })}
            <div class="player-links">
              <a class="player-profile player-profile--internal" href="spielerprofil.html?player=${playerSlug}">Steckbrief & Profil ↗</a>
              ${profile ? `<a class="player-profile" href="${profile}" target="_blank" rel="noreferrer">${profileLabel} ↗</a>` : ''}
              ${opgg ? `<a class="player-profile" href="${opgg}" target="_blank" rel="noreferrer">OP.GG ↗</a>` : ''}
            </div>
          </div>
        </div>
      </div>
    </article>
  `;
}

function renderPlayerStats(data) {
  if (!data) {
    return '';
  }

  const { stats, rank, profileLabel } = (typeof data === 'object' && ('stats' in data || 'rank' in data))
    ? data
    : { stats: data, rank: null, profileLabel: '' };

  if (stats) {
    const caption = profileLabel === 'Supermajor' ? 'Supermajor Statistik' : 'Statistik';
    return `
      <table class="player-stats">
        <caption>${caption}</caption>
        <tbody>
          ${Object.entries(stats).map(([label, value]) => `
            <tr><th scope="row">${label}</th><td>${value}</td></tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  if (rank) {
    const totalGames = (rank.wins ?? 0) + (rank.losses ?? 0);
    const rows = [
      ['Rang', `${rank.tierDisplay || 'Unranked'} (${rank.lpDisplay || '0 LP'})`],
      ['Winrate', `${rank.winrate ?? 0}%`],
      ['Bilanz', `${rank.wins ?? 0}W / ${rank.losses ?? 0}L`],
      ['Spiele', `${totalGames} Gesamt`]
    ];

    return `
      <table class="player-stats">
        <caption>SoloQ Statistik</caption>
        <tbody>
          ${rows.map(([label, value]) => `
            <tr><th scope="row">${label}</th><td>${value}</td></tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  return '';
}

function calculateAge(birthDate) {
  if (!birthDate) {
    return 'Alter nicht hinterlegt';
  }

  const [year, month, day] = birthDate.split('-').map(Number);
  const today = new Date();
  let age = today.getFullYear() - year;
  const birthdayHasPassed = today.getMonth() + 1 > month
    || (today.getMonth() + 1 === month && today.getDate() >= day);

  if (!birthdayHasPassed) {
    age -= 1;
  }

  return `${age} Jahre`;
}

export function renderNewsCard([title, summary, date, href], index) {
  return `
    <a href="${href}" class="news-card">
      <span class="news-number">0${index + 1}</span>
      <div>
        <h3>${title}</h3>
        <p>${summary}</p>
        <time>${date}</time>
      </div>
    </a>
  `;
}
