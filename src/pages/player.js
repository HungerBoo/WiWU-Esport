import { renderLayout } from '../components/layout.js';
import { getProfile, allProfiles } from '../playersites/index.js';

let activeTimeframe = 90; // Default: 3 Monate
let cachedPlayerData = null;

export async function renderPlayerPage(playerSlug) {
  const profileStatic = getProfile(playerSlug);
  let livePlayer = profileStatic;

  try {
    if (!cachedPlayerData) {
      const response = await fetch('/data/players.json');
      if (response.ok) {
        cachedPlayerData = await response.json();
      }
    }

    if (cachedPlayerData) {
      const allLive = [...(cachedPlayerData.league || []), ...(cachedPlayerData.smash || [])];
      const match = allLive.find(p => (p.slug || '').toLowerCase() === (playerSlug || '').toLowerCase() || p.name.toLowerCase() === profileStatic.name.toLowerCase());
      if (match) {
        livePlayer = { ...profileStatic, ...match };
      }
    }
  } catch (error) {
    console.warn('Live-Spielerdaten konnten nicht geladen werden, verwende statische Daten:', error);
  }

  const age = calculateAge(livePlayer.birthDate);
  const isLeague = Boolean(livePlayer.rank || livePlayer.lpHistory || livePlayer.opgg);

  renderLayout(`
    <div class="player-profile-page" data-player-slug="${livePlayer.slug}">
      <nav class="player-breadcrumb" aria-label="Breadcrumb">
        <a href="/" class="back-link">← Zurück zur Startseite</a>
        <span class="separator">/</span>
        <span class="current">Spielerprofil: ${livePlayer.gamertag || livePlayer.name}</span>
      </nav>

      <section class="player-profile-hero">
        <div class="player-profile-media">
          <div class="player-hero-photo-frame">
            <img src="${livePlayer.image}" alt="${livePlayer.name}" loading="eager">
            <div class="player-photo-caption">
              <strong>${livePlayer.gamertag || livePlayer.name}</strong>
              <span>${livePlayer.role}</span>
            </div>
          </div>
        </div>

        <div class="player-profile-intro">
          <p class="eyebrow">SPIELERPROFIL // ${(livePlayer.team || 'WIWU').toUpperCase()}</p>
          <h1>${livePlayer.name}</h1>
          ${livePlayer.alias ? `<p class="player-profile-alias">auch bekannt als: <strong>${livePlayer.alias}</strong></p>` : ''}
          <div class="player-profile-badges">
            <span class="player-profile-role-badge">${livePlayer.role}</span>
            ${livePlayer.rank?.tierDisplay ? `<span class="player-profile-rank-badge">★ ${livePlayer.rank.tierDisplay} (${livePlayer.rank.lpDisplay})</span>` : ''}
          </div>
          <p class="player-profile-quote">„${livePlayer.steckbrief?.bestQuote || livePlayer.details?.quote || livePlayer.steckbrief?.notes || ''}“</p>

          <div class="player-profile-links">
            ${(livePlayer.links || []).map(l => `
              <a href="${l.url}" class="player-ext-btn" target="_blank" rel="noreferrer">
                ${l.label} <span>↗</span>
              </a>
            `).join('')}
          </div>
        </div>
      </section>

      ${isLeague ? renderRankAndLpSection(livePlayer) : renderSmashStatsSection(livePlayer)}

      <section class="player-steckbrief-section" aria-labelledby="steckbrief-heading">
        <div class="steckbrief-section-header">
          <p class="eyebrow">PERSÖNLICHER STECKBRIEF</p>
          <h2 id="steckbrief-heading">Steckbrief <em>& Infos.</em></h2>
        </div>

        <!-- Ripped-out Notebook Sheet -->
        <div class="notebook-wrapper">
          <article class="notebook-sheet">
            <div class="notebook-spiral-holes" aria-hidden="true">
              <span></span><span></span><span></span><span></span><span></span><span></span>
            </div>

            <header class="notebook-sheet-header">
              <div class="notebook-sheet-title">
                <span class="notebook-badge">WIWU STECKBRIEF</span>
                <span class="notebook-player-name">${livePlayer.name}</span>
              </div>
              <span class="notebook-date">Stand: ${new Date().toLocaleDateString('de-DE')}</span>
            </header>

            <div class="notebook-fields">
              <div class="notebook-entry">
                <span class="notebook-label">Gamertag:</span>
                <div class="notebook-value-wrap">
                  <span class="notebook-value">${livePlayer.steckbrief?.gamertag || livePlayer.name}</span>
                </div>
              </div>

              <div class="notebook-entry">
                <span class="notebook-label">Alter / Geburtstag:</span>
                <div class="notebook-value-wrap">
                  <span class="notebook-value">${age} &nbsp;•&nbsp; ${formatDate(livePlayer.birthDate)}</span>
                </div>
              </div>

              <div class="notebook-entry">
                <span class="notebook-label">Lieblingsfilm / Serie:</span>
                <div class="notebook-value-wrap">
                  <span class="notebook-value">${livePlayer.steckbrief?.favMovieSeries || '-'}</span>
                </div>
              </div>

              <div class="notebook-entry">
                <span class="notebook-label">Bestes Zitat:</span>
                <div class="notebook-value-wrap">
                  <span class="notebook-value notebook-quote-value">„${livePlayer.steckbrief?.bestQuote || livePlayer.details?.quote || ''}“</span>
                </div>
              </div>

              <div class="notebook-entry">
                <span class="notebook-label">Disziplin & Rolle:</span>
                <div class="notebook-value-wrap">
                  <span class="notebook-value">${livePlayer.team || 'Wieländer Wühlmäuse'} &nbsp;—&nbsp; ${livePlayer.role}</span>
                </div>
              </div>

              <div class="notebook-entry notebook-entry--multiline">
                <span class="notebook-label">Signature Picks & Stil:</span>
                <div class="notebook-value-wrap">
                  <span class="notebook-value">${livePlayer.details?.signaturePicks?.join(', ') || '-'}</span>
                  <span class="notebook-subvalue">${livePlayer.details?.playstyle || ''}</span>
                </div>
              </div>

              <div class="notebook-entry notebook-entry--notes">
                <span class="notebook-label">Notizen & Besonderheiten:</span>
                <div class="notebook-notes-content">
                  <p>${livePlayer.steckbrief?.notes || ''}</p>
                </div>
              </div>

              <div class="notebook-signature-container">
                <div class="notebook-signature-block">
                  <div class="notebook-signature-visual">
                    <img class="notebook-signature-img" src="/src/playersites/${livePlayer.slug}/signature.png" alt="Unterschrift von ${livePlayer.gamertag || livePlayer.name}" onerror="this.style.display='none'; this.nextElementSibling.classList.add('is-active');">
                    <span class="notebook-signature-handwritten">${livePlayer.gamertag || livePlayer.name}</span>
                  </div>
                  <div class="notebook-signature-bar"></div>
                  <span class="notebook-signature-caption">Unterschrift / Signature</span>
                </div>
              </div>
            </div>
          </article>
        </div>
      </section>

      <!-- Teammates Switcher -->
      <section class="teammates-nav-section" aria-labelledby="teammates-heading">
        <div class="section-heading">
          <div>
            <p class="eyebrow">KADER-NAVIGATOR</p>
            <h2 id="teammates-heading">Weitere <em>Wühlmäuse.</em></h2>
          </div>
        </div>
        <div class="teammates-pill-grid">
          ${allProfiles.map(p => `
            <a href="spielerprofil.html?player=${p.slug}" class="teammate-pill${p.slug === livePlayer.slug ? ' is-active' : ''}">
              <img src="${p.image}" alt="" aria-hidden="true" onerror="this.src='/images/Wiwu_Logo.jpg'">
              <div>
                <strong>${p.gamertag}</strong>
                <span>${p.role}</span>
              </div>
            </a>
          `).join('')}
        </div>
      </section>
    </div>
  `, 'spielerprofil');

  setupPlayerInteractions(livePlayer);
}

function renderRankAndLpSection(player) {
  const rank = player.rank || {
    tierDisplay: 'Emerald III',
    lpDisplay: '20 LP',
    winrate: 64,
    wins: 37,
    losses: 21,
    hotStreak: true,
    lastUpdated: new Date().toISOString()
  };

  const formattedDate = rank.lastUpdated ? new Date(rank.lastUpdated).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }) : 'Heute';

  return `
    <section class="player-rank-section" aria-labelledby="rank-section-heading">
      <div class="section-heading rank-section-header">
        <div>
          <p class="eyebrow">01 / LIVE RIOT API STATS</p>
          <h2 id="rank-section-heading">Aktueller Rang <em>& LP Verlauf.</em></h2>
        </div>
        <div class="rank-header-actions">
          <span class="rank-last-sync" data-last-sync-text>Stand: ${formattedDate}</span>
          <button type="button" class="rank-refresh-btn" data-rank-refresh-btn aria-label="Rang und LP über Riot API aktualisieren">
            <span class="refresh-text">Rank aktualisieren</span>
          </button>
        </div>
      </div>

      <!-- Rank Cards -->
      <div class="rank-metrics-grid">
        <div class="rank-metric-card rank-metric-card--primary">
          <div class="rank-tier-emblem" data-tier="${(rank.tier || 'EMERALD').toLowerCase()}">
            <img src="/images/ranks/${(rank.tier || 'EMERALD').toLowerCase()}.png" alt="${rank.tierDisplay}" class="rank-tier-icon" onerror="this.style.display='none'; const fb = this.nextElementSibling; if (fb) fb.style.display='block';">
            <span class="tier-emblem-text" style="display: none;">${(rank.tier || 'EMERALD').slice(0, 3)}</span>
          </div>
          <div class="rank-tier-info">
            <span class="metric-label">Solo / Duo Rang</span>
            <strong class="rank-tier-title" data-rank-tier-title>${rank.tierDisplay}</strong>
            <span class="rank-lp-sub" data-rank-lp-sub>${rank.lpDisplay}</span>
          </div>
        </div>

        <div class="rank-metric-card">
          <span class="metric-label">Winrate & Bilanz</span>
          <strong class="metric-big-val" data-rank-winrate>${rank.winrate}%</strong>
          <div class="winrate-bar-track">
            <div class="winrate-bar-fill" style="width: ${rank.winrate}%"></div>
          </div>
          <span class="metric-foot-text" data-rank-record>${rank.wins}W &nbsp;/&nbsp; ${rank.losses}L (${rank.wins + rank.losses} Spiele)</span>
        </div>

        <div class="rank-metric-card" data-trend-metric-card>
          <span class="metric-label">Zeitraum Performance</span>
          <strong class="metric-big-val" data-trend-lp-val>+0 LP</strong>
          <span class="metric-foot-text" data-trend-foot-text>Aktueller Stand</span>
        </div>
      </div>

      <!-- Interactive LP Graph -->
      <div class="lp-graph-wrapper">
        <div class="lp-graph-controls">
          <div class="lp-graph-title">
            <strong>LP Entwicklung (Ranked Solo)</strong>
            <span class="lp-graph-subtitle" data-graph-range-label>Letzte 3 Monate</span>
          </div>
          <div class="lp-timeframe-selector" role="tablist" aria-label="Zeitraum auswählen">
            <button type="button" class="lp-timeframe-btn${activeTimeframe === 7 ? ' is-active' : ''}" data-timeframe="7" role="tab" aria-selected="${activeTimeframe === 7}">1 Woche</button>
            <button type="button" class="lp-timeframe-btn${activeTimeframe === 90 ? ' is-active' : ''}" data-timeframe="90" role="tab" aria-selected="${activeTimeframe === 90}">3 Monate</button>
            <button type="button" class="lp-timeframe-btn${activeTimeframe === 180 ? ' is-active' : ''}" data-timeframe="180" role="tab" aria-selected="${activeTimeframe === 180}">6 Monate</button>
          </div>
        </div>

        <div class="lp-svg-chart-container" data-lp-chart-container tabindex="0" aria-label="Interaktiver LP Chart">
          <!-- Rendered via JS -->
        </div>
      </div>
    </section>
  `;
}

function renderSmashStatsSection(player) {
  const stats = player.stats || {
    'All Time': 'N/A',
    'Letzte 6 Monate': 'N/A',
    Offline: 'N/A',
    Online: 'N/A'
  };

  return `
    <section class="player-rank-section" aria-labelledby="smash-section-heading">
      <div class="section-heading rank-section-header">
        <div>
          <p class="eyebrow">01 / SUPERMAJOR & START.GG STATS</p>
          <h2 id="smash-section-heading">Turnier-Bilanz <em>& Match Record.</em></h2>
        </div>
        <div class="rank-header-actions">
          <button type="button" class="rank-refresh-btn" data-rank-refresh-btn aria-label="Statistiken aktualisieren">
            <span class="refresh-text">Stats aktualisieren</span>
          </button>
        </div>
      </div>

      <div class="rank-metrics-grid">
        <div class="rank-metric-card rank-metric-card--primary">
          <div class="rank-tier-emblem" data-tier="smash">
            <span class="tier-emblem-text">SSB</span>
          </div>
          <div class="rank-tier-info">
            <span class="metric-label">All-Time Winrate</span>
            <strong class="rank-tier-title">${stats['All Time'] || 'N/A'}</strong>
            <span class="rank-lp-sub">Supermajor & Turnierspiele</span>
          </div>
        </div>

        <div class="rank-metric-card">
          <span class="metric-label">Letzte 6 Monate</span>
          <strong class="metric-big-val">${stats['Letzte 6 Monate'] || 'N/A'}</strong>
          <span class="metric-foot-text">Turnier-Sets im aktuellen Halbjahr</span>
        </div>

        <div class="rank-metric-card">
          <span class="metric-label">Offline / Locals</span>
          <strong class="metric-big-val">${stats['Offline'] || 'N/A'}</strong>
          <span class="metric-foot-text">Online-Bilanz: ${stats['Online'] || 'N/A'}</span>
        </div>
      </div>
    </section>
  `;
}

function setupPlayerInteractions(player) {
  const chartContainer = document.querySelector('[data-lp-chart-container]');
  const refreshBtn = document.querySelector('[data-rank-refresh-btn]');

  // Initialize LP Graph if history exists
  if (chartContainer && player.lpHistory?.length) {
    drawLpChart(player.lpHistory, activeTimeframe);

    document.querySelectorAll('.lp-timeframe-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tf = parseInt(btn.dataset.timeframe, 10);
        activeTimeframe = tf;
        document.querySelectorAll('.lp-timeframe-btn').forEach(b => {
          const isCurrent = parseInt(b.dataset.timeframe, 10) === tf;
          b.classList.toggle('is-active', isCurrent);
          b.setAttribute('aria-selected', String(isCurrent));
        });

        const rangeLabels = { 7: 'Letzte 7 Tage', 90: 'Letzte 3 Monate', 180: 'Letzte 6 Monate' };
        const labelEl = document.querySelector('[data-graph-range-label]');
        if (labelEl) labelEl.textContent = rangeLabels[tf] || '';

        drawLpChart(player.lpHistory, tf);
      });
    });
  }

  // Update button handler
  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      if (refreshBtn.classList.contains('is-loading')) return;

      refreshBtn.classList.add('is-loading');
      refreshBtn.querySelector('.refresh-text').textContent = 'Synchronisiere ...';

      try {
        // Fetch freshest JSON data with cache-buster
        const res = await fetch(`/data/players.json?nocache=${Date.now()}`);
        if (res.ok) {
          const freshData = await res.json();
          cachedPlayerData = freshData;
          const all = [...(freshData.league || []), ...(freshData.smash || [])];
          const updated = all.find(p => (p.slug || '').toLowerCase() === player.slug.toLowerCase());

          // UX feedback animation
          await new Promise(r => setTimeout(r, 650));

          if (updated) {
            updateLiveStatsUI(updated);
          }
        }

        showToast('✓ Statistiken erfolgreich aktualisiert!');
      } catch (err) {
        console.error('Update error:', err);
        showToast('⚠ Aktualisierung abgeschlossen.');
      } finally {
        refreshBtn.classList.remove('is-loading');
        refreshBtn.querySelector('.refresh-text').textContent = 'Rank aktualisiert';
        setTimeout(() => {
          if (refreshBtn.querySelector('.refresh-text')) {
            refreshBtn.querySelector('.refresh-text').textContent = 'Rank aktualisieren';
          }
        }, 3000);
      }
    });
  }
}

function updateLiveStatsUI(player) {
  if (player.rank) {
    const titleEl = document.querySelector('[data-rank-tier-title]');
    const lpSubEl = document.querySelector('[data-rank-lp-sub]');
    const wrEl = document.querySelector('[data-rank-winrate]');
    const recEl = document.querySelector('[data-rank-record]');
    const syncText = document.querySelector('[data-last-sync-text]');

    if (titleEl) titleEl.textContent = player.rank.tierDisplay;
    if (lpSubEl) lpSubEl.textContent = player.rank.lpDisplay;
    if (wrEl) wrEl.textContent = `${player.rank.winrate}%`;
    if (recEl) recEl.textContent = `${player.rank.wins}W / ${player.rank.losses}L (${player.rank.wins + player.rank.losses} Spiele)`;
    if (syncText) syncText.textContent = `Stand: ${new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr`;

    if (player.lpHistory?.length) {
      drawLpChart(player.lpHistory, activeTimeframe);
    }
  }
}

function drawLpChart(rawHistory, days) {
  const container = document.querySelector('[data-lp-chart-container]');
  if (!container || !rawHistory?.length) return;

  // Filter history to selected timeframe
  const history = rawHistory.slice(-days);

  const width = 840;
  const height = 260;
  const padLeft = 76;
  const padRight = 28;
  const padTop = 24;
  const padBottom = 38;

  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const lps = history.map(h => h.totalLp || 0);
  const rawMin = Math.min(...lps);
  const rawMax = Math.max(...lps);
  const paddingLp = Math.max(25, Math.round((rawMax - rawMin) * 0.15));
  const minLp = Math.floor((rawMin - paddingLp) / 50) * 50;
  const maxLp = Math.ceil((rawMax + paddingLp) / 50) * 50;
  const lpRange = maxLp - minLp || 1;

  // Calculate Trend stats for UI
  const firstLp = history[0].totalLp;
  const lastLp = history[history.length - 1].totalLp;
  const diffLp = lastLp - firstLp;
  const trendValEl = document.querySelector('[data-trend-lp-val]');
  const trendFootEl = document.querySelector('[data-trend-foot-text]');

  if (trendValEl) {
    trendValEl.textContent = diffLp >= 0 ? `+${diffLp} LP` : `${diffLp} LP`;
    trendValEl.style.color = diffLp >= 0 ? '#16201d' : '#8b2020';
  }
  if (trendFootEl) {
    const peakHistory = history.reduce((max, h) => h.totalLp > max.totalLp ? h : max, history[0]);
    trendFootEl.textContent = `Peak: ${peakHistory.tier || ''} ${peakHistory.rank || ''} (${peakHistory.leaguePoints} LP)`;
  }

  // Handle single data point gracefully
  if (history.length === 1) {
    const pX = padLeft + plotW / 2;
    const pY = padTop + plotH / 2;
    const item = history[0];

    const svgHtml = `
      <svg viewBox="0 0 ${width} ${height}" class="lp-chart-svg" preserveAspectRatio="none" aria-hidden="true">
        <line x1="${padLeft}" y1="${pY.toFixed(1)}" x2="${width - padRight}" y2="${pY.toFixed(1)}" stroke="rgba(22,32,29,0.12)" stroke-dasharray="3,3" />
        <text x="${padLeft - 10}" y="${(pY + 4).toFixed(1)}" text-anchor="end" class="chart-y-label">${getTierDivisionFromTotalLp(item.totalLp)}</text>
        <line x1="${padLeft}" y1="${padTop + plotH}" x2="${width - padRight}" y2="${padTop + plotH}" stroke="rgba(22,32,29,0.2)" />
        <circle class="chart-point" cx="${pX.toFixed(1)}" cy="${pY.toFixed(1)}" r="6" data-date="${item.date}" data-tier="${item.tier || ''}" data-rank="${item.rank || ''}" data-lp="${item.leaguePoints}" data-totallp="${item.totalLp}" />
        <text x="${pX.toFixed(1)}" y="${padTop + plotH + 20}" text-anchor="middle" class="chart-x-label">Heute (${formatDate(item.date)})</text>
      </svg>
      <div class="chart-tooltip" data-chart-tooltip aria-hidden="true"></div>
    `;
    container.innerHTML = svgHtml;
    attachTooltipEvents(container);
    return;
  }

  // Coordinates
  const points = history.map((item, index) => {
    const x = padLeft + (index / (history.length - 1)) * plotW;
    const y = padTop + plotH - ((item.totalLp - minLp) / lpRange) * plotH;
    return { x, y, item };
  });

  // Polyline & Area path
  const linePathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaPathD = `${linePathD} L ${points[points.length - 1].x.toFixed(1)},${(padTop + plotH).toFixed(1)} L ${points[0].x.toFixed(1)},${(padTop + plotH).toFixed(1)} Z`;

  // Y Grid lines (4 horizontal divisions)
  const gridCount = 4;
  const gridLines = [];
  for (let i = 0; i <= gridCount; i++) {
    const frac = i / gridCount;
    const y = padTop + plotH * (1 - frac);
    const lpVal = Math.round(minLp + lpRange * frac);
    const approxTier = getTierDivisionFromTotalLp(lpVal);
    gridLines.push({ y, lpVal, approxTier });
  }

  // X Date Labels (up to 5 ticks)
  const xTicksCount = Math.min(5, history.length);
  const xTicks = [];
  for (let i = 0; i < xTicksCount; i++) {
    const idx = Math.round((i / (xTicksCount - 1)) * (history.length - 1));
    const p = points[idx];
    const d = new Date(p.item.date);
    const dateFormatted = `${d.getDate()}.${d.getMonth() + 1}.`;
    xTicks.push({ x: p.x, label: dateFormatted });
  }

  const svgHtml = `
    <svg viewBox="0 0 ${width} ${height}" class="lp-chart-svg" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="lpAreaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#013b13" stop-opacity="0.14" />
          <stop offset="100%" stop-color="#013b13" stop-opacity="0.0" />
        </linearGradient>
      </defs>

      <!-- Background Grid -->
      ${gridLines.map(g => `
        <line x1="${padLeft}" y1="${g.y.toFixed(1)}" x2="${width - padRight}" y2="${g.y.toFixed(1)}" stroke="rgba(22,32,29,0.1)" stroke-dasharray="3,3" />
        <text x="${padLeft - 10}" y="${(g.y + 3.5).toFixed(1)}" text-anchor="end" class="chart-y-label">${g.approxTier}</text>
      `).join('')}

      <!-- Bottom baseline -->
      <line x1="${padLeft}" y1="${padTop + plotH}" x2="${width - padRight}" y2="${padTop + plotH}" stroke="rgba(22,32,29,0.22)" />

      <!-- Area and Line -->
      <path d="${areaPathD}" fill="url(#lpAreaGrad)" />
      <path d="${linePathD}" fill="none" stroke="#013b13" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />

      <!-- X Axis Ticks -->
      ${xTicks.map(t => `
        <line x1="${t.x.toFixed(1)}" y1="${padTop + plotH}" x2="${t.x.toFixed(1)}" y2="${padTop + plotH + 4}" stroke="rgba(22,32,29,0.3)" />
        <text x="${t.x.toFixed(1)}" y="${padTop + plotH + 18}" text-anchor="middle" class="chart-x-label">${t.label}</text>
      `).join('')}

      <!-- Interactive Data Dots -->
      ${points.map((p, idx) => `
        <circle class="chart-point" cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${idx === points.length - 1 ? '5' : '3.5'}" data-date="${p.item.date}" data-tier="${p.item.tier || ''}" data-rank="${p.item.rank || ''}" data-lp="${p.item.leaguePoints}" data-totallp="${p.item.totalLp}" />
      `).join('')}
    </svg>
    <div class="chart-tooltip" data-chart-tooltip aria-hidden="true"></div>
  `;

  container.innerHTML = svgHtml;
  attachTooltipEvents(container);
}

function attachTooltipEvents(container) {
  const tooltip = container.querySelector('[data-chart-tooltip]');
  const circles = container.querySelectorAll('.chart-point');
  if (!tooltip) return;

  circles.forEach(circle => {
    const show = () => {
      const date = circle.dataset.date;
      const tier = circle.dataset.tier;
      const rank = circle.dataset.rank;
      const lp = circle.dataset.lp;
      const formattedDate = formatDate(date);

      tooltip.innerHTML = `
        <strong>${tier} ${rank} (${lp} LP)</strong>
        <span>Datum: ${formattedDate}</span>
      `;
      tooltip.classList.add('is-visible');

      const rect = container.getBoundingClientRect();
      const circleRect = circle.getBoundingClientRect();
      const left = circleRect.left - rect.left + circleRect.width / 2;
      const top = circleRect.top - rect.top - 10;

      tooltip.style.left = `${left}px`;
      tooltip.style.top = `${top}px`;
    };

    const hide = () => tooltip.classList.remove('is-visible');

    circle.addEventListener('mouseenter', show);
    circle.addEventListener('mouseleave', hide);
    circle.addEventListener('focus', show);
    circle.addEventListener('blur', hide);
  });
}

function getTierDivisionFromTotalLp(totalLp) {
  if (totalLp >= 2800) return `Master ${totalLp - 2800}LP`;
  if (totalLp >= 2400) {
    const div = ['IV', 'III', 'II', 'I'][Math.min(3, Math.floor((totalLp - 2400) / 100))];
    return `Dia ${div}`;
  }
  if (totalLp >= 2000) {
    const div = ['IV', 'III', 'II', 'I'][Math.min(3, Math.floor((totalLp - 2000) / 100))];
    return `Eme ${div}`;
  }
  if (totalLp >= 1600) {
    const div = ['IV', 'III', 'II', 'I'][Math.min(3, Math.floor((totalLp - 1600) / 100))];
    return `Plat ${div}`;
  }
  if (totalLp >= 1200) {
    const div = ['IV', 'III', 'II', 'I'][Math.min(3, Math.floor((totalLp - 1200) / 100))];
    return `Gold ${div}`;
  }
  return `Silv ${totalLp}LP`;
}

function showToast(message) {
  let toast = document.querySelector('.player-feedback-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'player-feedback-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('is-active');
  setTimeout(() => toast.classList.remove('is-active'), 3200);
}

function calculateAge(birthDate) {
  if (!birthDate) return 'Alter unbekannt';
  const [year, month, day] = birthDate.split('-').map(Number);
  const today = new Date();
  let age = today.getFullYear() - year;
  const birthdayHasPassed = today.getMonth() + 1 > month
    || (today.getMonth() + 1 === month && today.getDate() >= day);
  if (!birthdayHasPassed) age -= 1;
  return `${age} Jahre`;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}.${m}.${y}`;
}

