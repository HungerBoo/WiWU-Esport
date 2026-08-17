import { renderNewsCard } from '../components/cards.js';
import { renderLayout } from '../components/layout.js';
import { news } from '../content/site-data.js';

const historyImage = '/images/Geschichte.png';

export function renderHome() {
  renderLayout(`
    <section class="hero">
      <h1>Aktuelle News</h1>
    </section>
    <section class="news-section" aria-labelledby="news-heading">
      <div class="news-grid">${news.map(renderNewsCard).join('')}</div>
    </section>
    <section class="story-grid">
      <div><h2>Unser Verein</h2></div>
      <div class="story-copy"><p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p></div>
    </section>
    <section class="history-grid">
      <img src="${historyImage}" alt="Geschichte der Wieländer Wühlmäuse" loading="lazy">
      <div><h2>Geschichte</h2><p class="story-copy">Die Wieländer Wühlmäuse wurde </p></div>
    </section>
  `);
}
