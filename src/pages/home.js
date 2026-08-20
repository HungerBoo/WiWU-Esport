import { renderLayout } from '../components/layout.js';
import { primeLeague } from '../content/site-data.js';

const oldLogoImage = '/images/Geschichte-alt.png';
const newLogoImage = '/images/Geschichte-neu.png';

export function renderHome() {
  const seasonStats = primeLeague.stats.recentSeason.values;

  renderLayout(`
    <section class="hero">
      <p class="eyebrow">PRIME LEAGUE / ${primeLeague.abbreviation}</p>
      <h1>${primeLeague.teamName}</h1>
      <p class="hero-copy">League of Legends aus Deutschland. Seit dem 05.01.2024 in der Prime League aktiv.</p>
    </section>
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
  `);

  renderStats('lifetime');
  document.querySelectorAll('[data-stats-view]').forEach((button) => {
    button.addEventListener('click', () => renderStats(button.dataset.statsView));
  });
  loadInstagramEmbed();
}

function siteInstagramUrl() {
  return 'https://www.instagram.com/wiwu.esport/';
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
