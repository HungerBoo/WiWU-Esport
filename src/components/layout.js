import { site } from '../content/site-data.js';

const logoUrl = '/images/Wiwu_Logo.jpg';

const navigation = [
  ['League of Legends', 'league-of-legends.html', 'league'],
  ['Super Smash Bros.', 'super-smash-bros.html', 'smash']
];

const ambientSymbols = {
  league: ['?', '!', '⚔', '↗', '✚', '◌'],
  smash: ['✦', '◆', '◇', '★', '◈', '✧'],
  default: ['✦', '◇', '?', '✚']
};

export function renderLayout(content, page = '') {
  const nav = navigation.map(([label, href, key]) => `
    <a href="${href}" class="${page === key ? 'active' : ''}">${label}</a>
  `).join('');

  document.querySelector('#app').innerHTML = `
    <div class="ambient-symbols" aria-hidden="true"></div>
    <header class="site-header">
      <div class="header-inner">
        <a href="/" class="brand-mark" aria-label="Zur Startseite">
          <img src="${logoUrl}" alt="${site.name} Logo">
        </a>
        <a href="/" class="site-title">${site.name}</a>
        <nav aria-label="Hauptnavigation">${nav}</nav>
      </div>
    </header>
    <main>${content}</main>
    <footer class="site-footer">
      <a href="impressum.html">Impressum</a>
      <div class="social-links">
        <a href="${site.social.instagram}" target="_blank" rel="noreferrer">Instagram</a>
        <a href="${site.social.primeLeague}" target="_blank" rel="noreferrer">Prime League</a>
      </div>
    </footer>
  `;

  const symbols = ambientSymbols[page] || ambientSymbols.default;
  const layer = document.querySelector('.ambient-symbols');
  symbols.forEach((symbol) => {
    const element = document.createElement('span');
    element.className = 'ambient-symbol';
    element.textContent = symbol;
    element.style.left = `${8 + Math.random() * 84}%`;
    element.style.top = `${8 + Math.random() * 82}%`;
    element.style.fontSize = `${32 + Math.random() * 86}px`;
    element.style.transform = `rotate(${Math.round(Math.random() * 36 - 18)}deg)`;
    element.style.animationDelay = `${Math.round(Math.random() * -12)}s`;
    layer.appendChild(element);
  });
}