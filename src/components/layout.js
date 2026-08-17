import { site } from '../content/site-data.js';

const logoUrl = '/images/Wiwu_Logo.jpg';

const navigation = [
  ['League of Legends', 'league-of-legends.html', 'league'],
  ['Super Smash Bros.', 'super-smash-bros.html', 'smash']
];

export function renderLayout(content, page = '') {
  const nav = navigation.map(([label, href, key]) => `
    <a href="${href}" class="${page === key ? 'active' : ''}">${label}</a>
  `).join('');

  document.querySelector('#app').innerHTML = `
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
}
