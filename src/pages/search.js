import { renderLayout } from '../components/layout.js';
import { site } from '../content/site-data.js';
import { getDdragonVersion, profileIconUrl } from '../utils/ddragon.js';

const SEARCH_CACHE_TTL_MS = 10 * 60 * 1000; // mirrors the worker's KV TTL, session-only

export async function renderPlayerSearch(gameName, tagLine) {
  renderLayout(`
    <div class="player-search-page">
      <nav class="player-breadcrumb" aria-label="Breadcrumb">
        <a href="/" class="back-link">← Zurück zur Startseite</a>
        <span class="separator">/</span>
        <span class="current">Spieler-Suche</span>
      </nav>

      <section class="search-hero">
        <p class="eyebrow">LEAGUE OF LEGENDS // RIOT API LIVE</p>
        <h1>Spieler <em>suchen.</em></h1>
        <p class="search-hero-copy">Gib einen Riot ID ein (Name#Tag), um Rang, Level und Top-Champions live abzurufen.</p>

        <form class="player-search-form" data-search-form>
          <input type="text" name="riotId" class="player-search-input" placeholder="z. B. Twisted Falafl#CRIT" data-search-input required autocomplete="off">
          <button type="submit" class="player-search-submit">Suchen</button>
        </form>
      </section>

      <section class="search-results" data-search-results aria-live="polite"></section>
    </div>
  `, 'spielersuche');

  setupSearchInteractions(gameName, tagLine);
}

function setupSearchInteractions(initialGameName, initialTagLine) {
  const form = document.querySelector('[data-search-form]');
  const input = document.querySelector('[data-search-input]');
  const resultsEl = document.querySelector('[data-search-results]');

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const [name, tag] = splitRiotId(input.value);
    if (!name || !tag) {
      renderMessage(resultsEl, 'Bitte gib eine vollständige Riot ID im Format Name#Tag ein.', 'error');
      return;
    }
    runSearch(resultsEl, name, tag);
    updateUrl(name, tag);
  });

  if (initialGameName && initialTagLine) {
    input.value = `${initialGameName}#${initialTagLine}`;
    runSearch(resultsEl, initialGameName, initialTagLine);
  }
}

function splitRiotId(value) {
  const trimmed = (value || '').trim();
  const idx = trimmed.lastIndexOf('#');
  if (idx <= 0) return [null, null];
  return [trimmed.slice(0, idx).trim(), trimmed.slice(idx + 1).trim()];
}

function updateUrl(gameName, tagLine) {
  const params = new URLSearchParams({ gameName, tagLine });
  window.history.pushState({}, '', `spielersuche.html?${params.toString()}`);
}

async function runSearch(resultsEl, gameName, tagLine) {
  renderMessage(resultsEl, 'Suche läuft ...', 'loading');

  if (!site.riotProxyUrl) {
    renderMessage(resultsEl, 'Die Live-Suche ist derzeit nicht verfügbar.', 'error');
    return;
  }

  const cacheKey = `riot-search:${gameName}#${tagLine}`.toLowerCase();
  const cached = readSessionCache(cacheKey);
  if (cached) {
    await renderResult(resultsEl, gameName, tagLine, cached);
    return;
  }

  try {
    const params = new URLSearchParams({ gameName, tagLine, profile: '1' });
    const res = await fetch(`${site.riotProxyUrl.replace(/\/$/, '')}?${params.toString()}`);
    const data = await res.json();

    if (!res.ok || data.error) {
      renderMessage(resultsEl, describeError(res.status, data.error), 'error');
      return;
    }

    writeSessionCache(cacheKey, data);
    await renderResult(resultsEl, gameName, tagLine, data);
  } catch (err) {
    console.error('Player search error:', err);
    renderMessage(resultsEl, 'Die Suche ist fehlgeschlagen. Bitte versuche es erneut.', 'error');
  }
}

function describeError(status, message) {
  if (status === 404) return 'Kein Spieler mit dieser Riot ID gefunden.';
  if (status === 429) return 'Zu viele Anfragen. Bitte versuche es in Kürze erneut.';
  return message || 'Der Spieler konnte nicht geladen werden.';
}

function readSessionCache(key) {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const { data, savedAt } = JSON.parse(raw);
    if (Date.now() - savedAt > SEARCH_CACHE_TTL_MS) {
      sessionStorage.removeItem(key);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function writeSessionCache(key, data) {
  try {
    sessionStorage.setItem(key, JSON.stringify({ data, savedAt: Date.now() }));
  } catch {
    // sessionStorage unavailable (private mode etc.) - not critical, just skip caching
  }
}

function renderMessage(container, message, type = 'info') {
  container.innerHTML = `<p class="search-status search-status--${type}">${message}</p>`;
}

async function renderResult(container, gameName, tagLine, data) {
  const version = await getDdragonVersion();
  const iconUrl = data.profileIconId != null
    ? profileIconUrl(version, data.profileIconId)
    : '/images/Wiwu_Logo.jpg';

  const rank = data.unranked ? null : data;
  const masteries = data.topMasteries || [];
  const opggUrl = `https://www.op.gg/summoners/euw/${encodeURIComponent(gameName)}-${encodeURIComponent(tagLine)}`;

  container.innerHTML = `
    <article class="search-result-card">
      <div class="search-result-header">
        <img src="${iconUrl}" alt="Profilsymbol" class="search-result-icon" onerror="this.src='/images/Wiwu_Logo.jpg'">
        <div class="search-result-name-block">
          <strong>${gameName}<span class="search-result-tag">#${tagLine}</span></strong>
          ${data.summonerLevel != null ? `<span class="search-result-level">Level ${data.summonerLevel}</span>` : ''}
        </div>
        <a href="${opggUrl}" class="player-ext-btn" target="_blank" rel="noreferrer">OP.GG <span>↗</span></a>
        ${data.cached ? '<span class="leaderboard-live-badge">Aus Cache</span>' : '<span class="leaderboard-live-badge">Riot API Live</span>'}
      </div>

      <div class="rank-metrics-grid">
        <div class="rank-metric-card rank-metric-card--primary">
          <div class="rank-tier-emblem" data-tier="${(rank?.tier || 'unranked').toLowerCase()}">
            <img src="/images/ranks/${(rank?.tier || 'unranked').toLowerCase()}.png" alt="${rank?.tierDisplay || 'Unranked'}" class="rank-tier-icon" onerror="this.style.display='none'; const fb = this.nextElementSibling; if (fb) fb.style.display='block';">
            <span class="tier-emblem-text" style="display: none;">${(rank?.tier || 'UNR').slice(0, 3)}</span>
          </div>
          <div class="rank-tier-info">
            <span class="metric-label">Solo / Duo Rang</span>
            <strong class="rank-tier-title">${rank?.tierDisplay || 'Unranked'}</strong>
            <span class="rank-lp-sub">${rank?.lpDisplay || '0 LP'}</span>
          </div>
        </div>

        <div class="rank-metric-card">
          <span class="metric-label">Winrate & Bilanz</span>
          <strong class="metric-big-val">${rank?.winrate ?? 0}%</strong>
          <div class="winrate-bar-track">
            <div class="winrate-bar-fill" style="width: ${rank?.winrate ?? 0}%"></div>
          </div>
          <span class="metric-foot-text">${rank?.wins ?? 0}W &nbsp;/&nbsp; ${rank?.losses ?? 0}L</span>
        </div>

        <div class="rank-metric-card">
          <span class="metric-label">Zusammenfassung</span>
          <strong class="metric-big-val">${(rank?.wins ?? 0) + (rank?.losses ?? 0)}</strong>
          <span class="metric-foot-text">Ranked-Spiele diese Saison</span>
        </div>
      </div>

      ${masteries.length ? `
        <div class="mastery-list-wrapper">
          <strong class="mastery-list-title">Top Champions (Meisterschaft)</strong>
          <div class="mastery-list">
            ${masteries.map(m => `
              <div class="mastery-card">
                ${m.image ? `<img src="${m.image}" alt="${m.name}" class="mastery-icon" onerror="this.style.display='none';">` : ''}
                <div class="mastery-info">
                  <strong>${m.name}</strong>
                  <span>Level ${m.championLevel} • ${m.championPoints.toLocaleString('de-DE')} Punkte</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    </article>
  `;
}
