import { renderPlayerCard } from '../components/cards.js';
import { renderLayout } from '../components/layout.js';
import { games } from '../content/site-data.js';

export async function renderGame(gameKey) {
  const game = games[gameKey];

  renderLayout(`
    <section class="game-hero">
      <img class="game-logo" src="${game.logo}" alt="${game.title} Logo">
      <h1>${game.heading}</h1>
      <p>${game.description}</p>
    </section>
    <section class="roster-section" aria-labelledby="roster-heading">
      <div class="section-heading"><div><h2 id="roster-heading">Kader</h2><p class="roster-hint">Karte anklicken für Stats und Profile</p></div></div>
      <p class="roster-status">Kader wird geladen ...</p>
    </section>
    ${game.teamImage ? `<img class="team-image" src="${game.teamImage}" alt="Kader von ${game.title}" loading="lazy">` : ''}
  `, gameKey);

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
