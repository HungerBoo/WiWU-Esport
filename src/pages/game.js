import { renderPlayerCard } from '../components/cards.js';
import { renderLayout } from '../components/layout.js';
import { games } from '../content/site-data.js';

export function renderGame(gameKey) {
  const game = games[gameKey];
  renderLayout(`
    <section class="game-hero">
      <img class="game-logo" src="${game.logo}" alt="${game.title} Logo">
      <h1>${game.heading}</h1>
      <p>${game.description}</p>
    </section>
    <section class="roster-section" aria-labelledby="roster-heading">
      <div class="section-heading"><h2 id="roster-heading">Kader</h2></div>
      <div class="roster-grid">${game.players.map(renderPlayerCard).join('')}</div>
    </section>
    ${game.teamImage ? `<img class="team-image" src="${game.teamImage}" alt="Kader von ${game.title}" loading="lazy">` : ''}
  `, gameKey);

  document.querySelectorAll('.player-card img').forEach((image) => {
    image.addEventListener('error', () => {
      image.src = '/images/Wiwu_Logo.jpg';
      image.alt = 'WiWU Logo als Platzhalter';
    }, { once: true });
  });
}
