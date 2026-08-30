import { site } from '../content/site-data.js';
import { initLavaLamp } from './lava-lamp.js';

const logoUrl = '/images/Wiwu_Logo.jpg';

const navigation = [
  ['League of Legends', 'league-of-legends.html', 'league'],
  ['Super Smash Bros.', 'super-smash-bros.html', 'smash']
];

export function renderLayout(content, page = '', { introSplash = false } = {}) {
  const nav = navigation.map(([label, href, key]) => `
    <a href="${href}" class="${page === key ? 'active' : ''}">${label}</a>
  `).join('');

  document.querySelector('#app').innerHTML = `
    <canvas class="ambient-lava-canvas" aria-hidden="true"></canvas>
    <header class="site-header${introSplash ? ' site-header--intro' : ''}${page ? ` site-header--${page}` : ''}">
      <div class="header-inner">
        <a href="/" class="brand-mark${introSplash ? ' is-morph-target' : ''}" id="header-logo-slot" aria-label="Zur Startseite">
          <img src="${logoUrl}" alt="${site.name} Logo">
        </a>
        <a href="/" class="site-title${introSplash ? ' is-morph-target' : ''}" id="site-title">${site.name}</a>
        <nav aria-label="Hauptnavigation">${nav}</nav>
      </div>
    </header>
    ${introSplash ? `
      <div class="morph-logo" id="morph-logo" aria-hidden="true">
        <img src="${logoUrl}" alt="">
      </div>
    ` : ''}
    <main${introSplash ? '' : ' class="has-fixed-header"'}>${content}</main>
    <footer class="site-footer">
      <a href="impressum.html">Impressum</a>
      <div class="social-links">
        <a href="${site.social.instagram}" target="_blank" rel="noreferrer">Instagram</a>
        <a href="${site.social.primeLeague}" target="_blank" rel="noreferrer">Prime League</a>
      </div>
    </footer>
  `;

  initLavaLamp();
}
