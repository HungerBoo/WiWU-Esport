import { renderLayout } from '../components/layout.js';
import { setupIntroMorph } from '../components/intro-morph.js';
import { games, primeLeague, site } from '../content/site-data.js';

const oldLogoImage = '/images/Geschichte-alt.png';
const newLogoImage = '/images/Geschichte-neu.png';
const carouselStepSeconds = 5;
const smashCumulativeStats = {
  record: '374-312',
  winrate: '55%'
};

// All available league + smash players for the live rotating roster tile.
const rotatorPlayers = [
  { src: '/images/players/league/falafl.jpg', name: 'Falafl' },
  { src: '/images/players/league/atrulixx.jpg', name: 'aTrulixx' },
  { src: '/images/players/league/beltrin.jpg', name: 'Beltrin' },
  { src: '/images/players/league/elkant.jpg', name: 'Elkant' },
  { src: '/images/players/league/hungerboo.jpg', name: 'HungerBoo' },
  { src: '/images/players/league/lostmyaim.jpg', name: 'LostMyAim' },
  { src: '/images/players/league/1overninja1.jpg', name: '1Overninja1' },
  { src: '/images/players/smash/martin.jpg', name: 'Martin' },
  { src: '/images/players/league/zwuck.jpg', name: 'Zwuck' }
];

export function renderHome() {
  const seasonStats = primeLeague.stats.recentSeason.values;
  const lifetimeStats = primeLeague.stats.lifetime.values;
  const carouselCycleSeconds = rotatorPlayers.length * carouselStepSeconds;

  renderLayout(`
    <div class="intro-splash-wrapper">
      <section class="intro-splash">
        <div class="tile-grid">
          <div class="tile tile--brand" style="--tile-i:0">
            <div class="intro-logo-slot" aria-hidden="true"></div>
            <div class="tile-brand-text">
              <p class="intro-eyebrow">Esport Verein aus Siegen</p>
              <p class="intro-name">Wieländer<br>Wühlmäuse</p>
            </div>
          </div>
          <a href="league-of-legends.html" class="tile tile--league" style="--tile-i:1">
            <img class="tile-game-logo" src="${games.league.logo}" alt="${games.league.title} Logo" loading="lazy">
            <span class="tile-label">League of Legends</span>
          </a>
          <a href="super-smash-bros.html" class="tile tile--smash" style="--tile-i:2">
            <img class="tile-game-logo" src="${games.smash.logo}" alt="${games.smash.title} Logo" loading="lazy">
            <span class="tile-label">Super Smash Bros.</span>
          </a>
          <a href="#prime-league-heading" class="tile tile--matches" style="--tile-i:3">
            <span class="tile-icon">🏆</span>
            <span class="tile-label">Matches</span>
            <span class="tile-sub">${primeLeague.recentMatches.length} zuletzt</span>
          </a>
          <div class="tile tile--roster" style="--tile-i:4" aria-label="Unsere Spieler">
            <div class="tile-rotator" style="--cycle:${carouselCycleSeconds}s;">
                ${rotatorPlayers.map(({ src, name }, index) => `
                  <div class="tile-rotator-slide" style="--delay:${index * -carouselStepSeconds}s;">
                    <img src="${src}" alt="${name}" loading="lazy">
                    <span class="tile-label tile-rotator-name">Team - ${name}</span>
                  </div>
                `).join('')}
              <div class="tile-rotator-shade"></div>
            </div>
          </div>
          <a href="${siteInstagramUrl()}" target="_blank" rel="noreferrer" class="tile tile--social-mini tile--social-instagram" style="--tile-i:5">
            <span class="tile-icon">Bilder</span>
            <span class="tile-label">Instagram</span>
            <span class="tile-sub">Shitposts ↗</span>
          </a>
          <a href="${siteTwitchUrl()}" target="_blank" rel="noreferrer" class="tile tile--social-mini tile--social-twitch" style="--tile-i:6">
            <span class="tile-icon">TV</span>
            <span class="tile-label">Twitch</span>
            <span class="tile-sub">League Stream ↗</span>
          </a>
          <a href="${primeLeague.url}" target="_blank" rel="noreferrer" class="tile tile--social-mini tile--social-prime" style="--tile-i:7">
            <span class="tile-icon">PL</span>
            <span class="tile-label">Prime League</span>
            <span class="tile-sub">${lifetimeStats[1][1]} · ${lifetimeStats[2][1]} Saisons</span>
          </a>
          <div class="tile tile--social-mini tile--smash-cumulative" style="--tile-i:8">
            <span class="tile-icon">SSBU</span>
            <span class="tile-label">Smash Team</span>
            <span class="tile-sub">${smashCumulativeStats.record} · ${smashCumulativeStats.winrate}</span>
          </div>
          <div class="tile tile--stat tile--league-balance" style="--tile-i:9">
            <strong>0</strong>
            <span>Ahnung</span>
          </div>
          <div class="tile tile--stat tile--stat-seasons" style="--tile-i:10"><strong>${lifetimeStats[2][1]}</strong><span>${lifetimeStats[2][0]}</span></div>
          <div class="tile tile--stat tile--stat-members" style="--tile-i:11"><strong>${lifetimeStats[3][1]}</strong><span>${lifetimeStats[3][0]}</span></div>
          <div class="tile tile--stat tile--stat-founded" style="--tile-i:12"><strong>${primeLeague.founded.slice(6)}</strong><span>Gegründet</span></div>
        </div>
        <div class="intro-scroll-indicator" aria-hidden="true">
          <span>Scroll</span>
          <div class="intro-scroll-chevrons"><i></i><i></i></div>
        </div>
      </section>
    </div>
    <section class="news-section" aria-labelledby="prime-league-heading">
      <div class="section-heading"><p class="eyebrow">01 / PRIME LEAGUE</p><h2 id="prime-league-heading">Unser Team</h2></div>
      <div class="stats-toggle" role="tablist" aria-label="Statistikzeitraum">
        <button type="button" class="stats-toggle-button active" role="tab" aria-selected="true" data-stats-view="lifetime">Lifetime</button>
        <button type="button" class="stats-toggle-button" role="tab" aria-selected="false" data-stats-view="recentSeason">Most recent season</button>
      </div>

      <div class="prime-stats" id="prime-stats" data-stats-container></div>
      <div class="prime-season" data-season-summary>
        <div><p class="eyebrow">${primeLeague.currentSeason.toUpperCase()}</p><h3>${seasonStats[0][1]}</h3></div>
        <div><strong>${seasonStats[1][1]}</strong><span>${seasonStats[2][1]} Punkte</span></div>
      </div>
      <a class="text-link" href="${primeLeague.url}" target="_blank" rel="noreferrer">Team auf Prime League ansehen <span>↗</span></a>
    </section>
    <section class="story-grid">
      <div><p class="eyebrow">02 / LETZTE ERGEBNISSE</p><h2>Aktuelle<br><em>Matches.</em></h2></div>
      <div class="story-copy"><ul class="match-list">${primeLeague.recentMatches.map((match) => `<li>${match}</li>`).join('')}</ul></div>
    </section>
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
  `, 'home', { introSplash: true });

  renderStats('lifetime');
  document.querySelectorAll('[data-stats-view]').forEach((button) => {
    button.addEventListener('click', () => renderStats(button.dataset.statsView));
  });
  loadInstagramEmbed();
  setupIntroMorph();
}

function siteInstagramUrl() {
  return 'https://www.instagram.com/wiwu.esport/';
}

function siteTwitchUrl() {
  return 'https://www.twitch.tv/fal4fl';
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
