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
      <div class="section-heading"><h2 id="roster-heading">Kader</h2></div>
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
    roster.querySelector('.roster-status').outerHTML = players.length
      ? `<div class="roster-grid">${players.map(renderPlayerCard).join('')}</div>`
      : '<p class="roster-status">Keine Spieler eingetragen.</p>';

    document.querySelectorAll('.player-card img').forEach((image) => {
      image.addEventListener('error', () => {
        image.src = '/images/Wiwu_Logo.jpg';
        image.alt = 'WiWU Logo als Platzhalter';
      }, { once: true });
    });
  } catch (error) {
    document.querySelector('.roster-status').textContent = 'Die Kaderdaten konnten nicht geladen werden.';
    console.error(error);
  }
}
