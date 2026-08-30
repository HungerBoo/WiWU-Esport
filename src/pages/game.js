import { renderPlayerCard } from '../components/cards.js';
import { renderLayout } from '../components/layout.js';
import { games } from '../content/site-data.js';

const PLAYER_COLORS = {
  falafl: '#013b13',
  zwuck: '#008f58',
  '1overninja1': '#b58900',
  hungerboo: '#d35400',
  atrulixx: '#1b6ca8',
  lostmyaim: '#8e44ad',
  beltrin: '#16a085',
  elkant: '#c0392b'
};

const DEFAULT_COLOR = '#4a6b58';

let activeLeaderboardTimeframe = 90;
let activeLeaderboardSlugs = new Set(['falafl', 'zwuck', '1overninja1', 'hungerboo', 'atrulixx', 'lostmyaim', 'beltrin', 'elkant']);

export async function renderGame(gameKey) {
  const game = games[gameKey];
  const isLeague = gameKey === 'league';

  renderLayout(`
    <section class="game-hero">
      <div class="game-hero-heading">
        <h1>${game.heading.replace(' ', '<br>')}</h1>
        <img class="game-logo" src="${game.logo}" alt="${game.title} Logo">
      </div>
      <div class="game-hero-copy">
        <p class="game-hero-description">${game.description}</p>
      </div>
      <div class="game-hero-feature${game.teamImages?.length ? ' has-team-image' : ''}">
        ${renderStatementsCarousel(game.statements)}
        ${game.teamImages?.length ? renderGameImageGallery(game.teamImages, game.title) : ''}
      </div>
    </section>

    <section class="roster-section" aria-labelledby="roster-heading">
      <div class="section-heading">
        <div>
          <p class="eyebrow">01 / KADER</p>
          <h2 id="roster-heading">Aktueller <em>Kader.</em></h2>
        </div>
        <p class="roster-hint">Karte anklicken für Stats und Profile</p>
      </div>
      <p class="roster-status">Kader wird geladen ...</p>
    </section>

    ${isLeague ? `
      <section class="league-leaderboard-section" aria-labelledby="leaderboard-heading">
        <div class="section-heading">
          <div>
            <p class="eyebrow">02 / SOLO QUEUE LEADERBOARD</p>
            <h2 id="leaderboard-heading">WiWU SoloQ <em>Leaderboard.</em></h2>
          </div>
          <div class="leaderboard-heading-meta">
            <span class="leaderboard-live-badge">Riot API Live</span>
          </div>
        </div>

        <div class="leaderboard-grid">
          <!-- Left Column: Leaderboard Table -->
          <div class="leaderboard-list-col">
            <div class="leaderboard-card-container">
              <div class="leaderboard-header-row">
                <span>Platz & Spieler</span>
                <span>Rang & LP</span>
                <span>Winrate</span>
              </div>
              <div class="leaderboard-list" data-leaderboard-list>
                <p class="leaderboard-loading">Lade Live-Rangliste ...</p>
              </div>
            </div>
          </div>

          <!-- Right Column: Multi-Player Comparison Graph -->
          <div class="leaderboard-graph-col">
            <div class="leaderboard-graph-wrapper">
              <div class="leaderboard-graph-controls">
                <div class="leaderboard-graph-title">
                  <strong>LP Entwicklung im Vergleich</strong>
                  <span class="leaderboard-graph-subtitle" data-lb-range-label>Letzte 3 Monate</span>
                </div>
                <div class="lp-timeframe-selector" role="tablist" aria-label="Zeitraum auswählen">
                  <button type="button" class="lp-timeframe-btn${activeLeaderboardTimeframe === 7 ? ' is-active' : ''}" data-lb-timeframe="7" role="tab" aria-selected="${activeLeaderboardTimeframe === 7}">1 Woche</button>
                  <button type="button" class="lp-timeframe-btn${activeLeaderboardTimeframe === 90 ? ' is-active' : ''}" data-lb-timeframe="90" role="tab" aria-selected="${activeLeaderboardTimeframe === 90}">3 Monate</button>
                  <button type="button" class="lp-timeframe-btn${activeLeaderboardTimeframe === 180 ? ' is-active' : ''}" data-lb-timeframe="180" role="tab" aria-selected="${activeLeaderboardTimeframe === 180}">6 Monate</button>
                </div>
              </div>

              <div class="leaderboard-chart-container" data-lb-chart-container tabindex="0" aria-label="Interaktiver SoloQ Vergleichschart">
                <!-- Multi-Player SVG Graph -->
              </div>

              <!-- Interactive Legend -->
              <div class="leaderboard-legend-box">
                <div class="legend-header">
                  <span class="legend-header-title">Legende (Klicken zum Ein-/Ausblenden):</span>
                  <div class="legend-actions">
                    <button type="button" class="legend-action-btn" data-legend-select-all>Alle</button>
                    <button type="button" class="legend-action-btn" data-legend-deselect-all>Keine</button>
                  </div>
                </div>
                <div class="leaderboard-legend-grid" data-lb-legend-grid>
                  <!-- Legend items rendered via JS -->
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    ` : ''}
  `, gameKey);

  setupStatementsCarousel();
  setupGameImageGallery();

  try {
    const response = await fetch('/data/players.json');
    if (!response.ok) {
      throw new Error(`Spielerdaten konnten nicht geladen werden (${response.status}).`);
    }

    const playerData = await response.json();
    const players = playerData[gameKey] || [];
    const roster = document.querySelector('.roster-section');
    const profileLabel = gameKey === 'smash' ? 'Supermajor' : 'Prime League';
    roster.querySelector('.roster-status').outerHTML = players.length
      ? `<div class="roster-grid">${players.map((player) => renderPlayerCard({ ...player, profileLabel })).join('')}</div>`
      : '<p class="roster-status">Keine Spieler eingetragen.</p>';

    if (isLeague) {
      setupLeaderboardAndGraph(players);
    }

    document.querySelectorAll('.player-card img').forEach((image) => {
      image.addEventListener('error', () => {
        image.src = '/images/Wiwu_Logo.jpg';
        image.alt = 'WiWU Logo als Platzhalter';
      }, { once: true });
    });

    document.querySelectorAll('.player-card').forEach((card) => {
      const front = card.querySelector('.player-card-front');
      const back = card.querySelector('.player-card-back');

      const setFlipped = (flipped) => {
        card.classList.toggle('is-flipped', flipped);
        front.setAttribute('aria-hidden', String(flipped));
        back.setAttribute('aria-hidden', String(!flipped));
      };

      card.addEventListener('click', (event) => {
        if (event.target.closest('a')) return;
        setFlipped(!card.classList.contains('is-flipped'));
      });
      card.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') setFlipped(false);
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          setFlipped(!card.classList.contains('is-flipped'));
        }
      });
    });
  } catch (error) {
    document.querySelector('.roster-status').textContent = 'Die Kaderdaten konnten nicht geladen werden.';
    console.error(error);
  }
}

function setupLeaderboardAndGraph(leaguePlayers) {
  const leaderboardListEl = document.querySelector('[data-leaderboard-list]');
  if (!leaderboardListEl || !leaguePlayers?.length) return;

  // Sort players by totalLp descending
  const sortedPlayers = [...leaguePlayers].sort((a, b) => {
    const lpA = a.rank?.totalLp ?? 0;
    const lpB = b.rank?.totalLp ?? 0;
    return lpB - lpA;
  });

  // Ensure default active slugs contains all available players
  activeLeaderboardSlugs = new Set(sortedPlayers.map(p => p.slug));

  // Render Leaderboard list
  leaderboardListEl.innerHTML = sortedPlayers.map((player, index) => {
    const rank = player.rank || {
      tier: 'UNRANKED',
      rank: '',
      tierDisplay: 'Unranked',
      lpDisplay: '0 LP',
      winrate: 0,
      wins: 0,
      losses: 0
    };

    const color = PLAYER_COLORS[player.slug] || DEFAULT_COLOR;
    const isTop3 = index < 3;
    const rankClass = isTop3 ? ` leaderboard-row--top${index + 1}` : '';

    return `
      <div class="leaderboard-row${rankClass}" data-player-slug="${player.slug}">
        <div class="leaderboard-player-cell">
          <span class="leaderboard-rank-pos">#0${index + 1}</span>
          <div class="leaderboard-avatar-wrap">
            <img src="${player.image}" alt="${player.name}" class="leaderboard-avatar" onerror="this.src='/images/Wiwu_Logo.jpg'">
            <span class="leaderboard-color-indicator" style="background-color: ${color};" title="Farbe im Chart"></span>
          </div>
          <div class="leaderboard-name-block">
            <a href="${player.opgg || '#'}" class="leaderboard-player-link" target="_blank" rel="noreferrer" title="${player.name} auf OP.GG aufrufen">
              <strong>${player.name}</strong>
            </a>
            <div class="leaderboard-sublinks">
              <span class="leaderboard-role-tag">${player.role}</span>
              <span class="dot-sep">•</span>
              <a href="spielerprofil.html?player=${player.slug}" class="leaderboard-profile-link">Profil ↗</a>
            </div>
          </div>
        </div>

        <div class="leaderboard-tier-cell">
          <div class="leaderboard-tier-badge" data-tier="${(rank.tier || 'unranked').toLowerCase()}">
            <img src="/images/ranks/${(rank.tier || 'unranked').toLowerCase()}.png" alt="" class="leaderboard-tier-icon" onerror="this.style.display='none';">
            <span class="tier-name">${rank.tierDisplay}</span>
          </div>
          <span class="tier-lp-text">${rank.lpDisplay}</span>
        </div>

        <div class="leaderboard-winrate-cell">
          <strong class="wr-percent">${rank.winrate}%</strong>
          <div class="wr-mini-bar">
            <div class="wr-mini-fill" style="width: ${rank.winrate}%;"></div>
          </div>
          <span class="wr-record">${rank.wins}W / ${rank.losses}L</span>
        </div>
      </div>
    `;
  }).join('');

  // Initial draw of multi-player chart and legend
  renderMultiPlayerChartAndLegend(sortedPlayers);

  // Timeframe selector buttons
  document.querySelectorAll('[data-lb-timeframe]').forEach(btn => {
    btn.addEventListener('click', () => {
      const tf = parseInt(btn.dataset.lbTimeframe, 10);
      activeLeaderboardTimeframe = tf;
      document.querySelectorAll('[data-lb-timeframe]').forEach(b => {
        const isCurrent = parseInt(b.dataset.lbTimeframe, 10) === tf;
        b.classList.toggle('is-active', isCurrent);
        b.setAttribute('aria-selected', String(isCurrent));
      });

      const rangeLabels = { 7: 'Letzte 7 Tage', 90: 'Letzte 3 Monate', 180: 'Letzte 6 Monate' };
      const labelEl = document.querySelector('[data-lb-range-label]');
      if (labelEl) labelEl.textContent = rangeLabels[tf] || '';

      renderMultiPlayerChartAndLegend(sortedPlayers);
    });
  });

  // Select all / Deselect all
  document.querySelector('[data-legend-select-all]')?.addEventListener('click', () => {
    activeLeaderboardSlugs = new Set(sortedPlayers.map(p => p.slug));
    renderMultiPlayerChartAndLegend(sortedPlayers);
  });

  document.querySelector('[data-legend-deselect-all]')?.addEventListener('click', () => {
    activeLeaderboardSlugs.clear();
    renderMultiPlayerChartAndLegend(sortedPlayers);
  });
}

function renderMultiPlayerChartAndLegend(players) {
  const chartContainer = document.querySelector('[data-lb-chart-container]');
  const legendGrid = document.querySelector('[data-lb-legend-grid]');
  if (!chartContainer || !players?.length) return;

  // Render Legend Items
  if (legendGrid) {
    legendGrid.innerHTML = players.map(player => {
      const color = PLAYER_COLORS[player.slug] || DEFAULT_COLOR;
      const isActive = activeLeaderboardSlugs.has(player.slug);
      const tierDisplay = player.rank?.tierDisplay || 'Unranked';
      const lpDisplay = player.rank?.lpDisplay || '0 LP';

      return `
        <button type="button" class="legend-pill${isActive ? ' is-active' : ''}" data-toggle-slug="${player.slug}" aria-pressed="${isActive}">
          <span class="legend-color-dot" style="background-color: ${color};"></span>
          <span class="legend-player-name">${player.name}</span>
          <span class="legend-player-lp">${tierDisplay.split(' ')[0]} ${lpDisplay}</span>
        </button>
      `;
    }).join('');

    // Toggle click listeners
    legendGrid.querySelectorAll('[data-toggle-slug]').forEach(pill => {
      pill.addEventListener('click', () => {
        const slug = pill.dataset.toggleSlug;
        if (activeLeaderboardSlugs.has(slug)) {
          // Keep at least one active if possible
          if (activeLeaderboardSlugs.size > 1) {
            activeLeaderboardSlugs.delete(slug);
          }
        } else {
          activeLeaderboardSlugs.add(slug);
        }
        renderMultiPlayerChartAndLegend(players);
      });

      // Hover to highlight single player line
      pill.addEventListener('mouseenter', () => {
        const slug = pill.dataset.toggleSlug;
        chartContainer.querySelectorAll('.multi-player-line').forEach(line => {
          line.classList.toggle('is-dimmed', line.dataset.playerSlug !== slug);
          line.classList.toggle('is-highlighted', line.dataset.playerSlug === slug);
        });
      });

      pill.addEventListener('mouseleave', () => {
        chartContainer.querySelectorAll('.multi-player-line').forEach(line => {
          line.classList.remove('is-dimmed', 'is-highlighted');
        });
      });
    });
  }

  // Draw Multi-Line SVG Chart
  drawMultiPlayerChart(chartContainer, players, activeLeaderboardSlugs, activeLeaderboardTimeframe);
}

function drawMultiPlayerChart(container, allPlayers, activeSlugs, days) {
  const activePlayers = allPlayers.filter(p => activeSlugs.has(p.slug) && p.lpHistory && p.lpHistory.length > 0);

  const width = 760;
  const height = 290;
  const padLeft = 72;
  const padRight = 24;
  const padTop = 24;
  const padBottom = 38;

  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const now = new Date();
  const startTime = new Date(now.getTime() - days * 24 * 60 * 60 * 1000).getTime();
  const endTime = now.getTime();
  const totalTimeSpan = endTime - startTime || 1;

  if (activePlayers.length === 0) {
    container.innerHTML = `
      <div class="chart-empty-state">
        <p>Keine Spieler für den Graphen ausgewählt.</p>
        <small>Wähle mindestens einen Spieler in der Legende aus.</small>
      </div>
    `;
    return;
  }

  // Collect all totalLp values to define global Y scale
  const allLpValues = [];
  const playerSeries = [];

  for (const player of activePlayers) {
    const sortedHistory = [...player.lpHistory].sort((a, b) => new Date(a.date) - new Date(b.date));
    const pointsInWindow = sortedHistory.filter(h => new Date(h.date).getTime() >= startTime);
    const pointsBeforeWindow = sortedHistory.filter(h => new Date(h.date).getTime() < startTime);
    const baselinePoint = pointsBeforeWindow.length > 0 
      ? pointsBeforeWindow[pointsBeforeWindow.length - 1] 
      : (pointsInWindow[0] || sortedHistory[0]);

    const timeline = [];
    const startDateStr = new Date(startTime).toISOString().split('T')[0];
    const todayDateStr = now.toISOString().split('T')[0];

    timeline.push({
      ...baselinePoint,
      date: startDateStr,
      timestamp: startTime,
      isAnchor: true
    });

    for (const pt of pointsInWindow) {
      if (pt.date !== startDateStr && pt.date !== todayDateStr) {
        timeline.push({
          ...pt,
          timestamp: new Date(pt.date).getTime(),
          isAnchor: false
        });
      }
    }

    const todayPoint = sortedHistory[sortedHistory.length - 1];
    timeline.push({
      ...todayPoint,
      date: todayDateStr,
      timestamp: endTime,
      isAnchor: false
    });

    timeline.forEach(t => allLpValues.push(t.totalLp || 0));
    playerSeries.push({
      player,
      color: PLAYER_COLORS[player.slug] || DEFAULT_COLOR,
      timeline
    });
  }

  const rawMin = Math.min(...allLpValues);
  const rawMax = Math.max(...allLpValues);
  const paddingLp = Math.max(30, Math.round((rawMax - rawMin) * 0.12));
  const minLp = Math.floor((rawMin - paddingLp) / 50) * 50;
  const maxLp = Math.ceil((rawMax + paddingLp) / 50) * 50;
  const lpRange = maxLp - minLp || 1;

  // Y Grid lines
  const gridCount = 4;
  const gridLines = [];
  for (let i = 0; i <= gridCount; i++) {
    const frac = i / gridCount;
    const y = padTop + plotH * (1 - frac);
    const lpVal = Math.round(minLp + lpRange * frac);
    const approxTier = getTierDivisionFromTotalLp(lpVal);
    gridLines.push({ y, lpVal, approxTier });
  }

  // X Axis Ticks (5 ticks across timeframe)
  const xTicksCount = 5;
  const xTicks = [];
  for (let i = 0; i < xTicksCount; i++) {
    const frac = i / (xTicksCount - 1);
    const t = startTime + frac * totalTimeSpan;
    const x = padLeft + frac * plotW;
    const d = new Date(t);
    const dateFormatted = `${d.getDate()}.${d.getMonth() + 1}.`;
    xTicks.push({ x, label: dateFormatted });
  }

  // Build Paths and Points per player
  const renderedSeries = playerSeries.map(series => {
    const points = series.timeline.map(item => {
      const itemTime = Math.max(startTime, Math.min(endTime, item.timestamp || new Date(item.date).getTime()));
      const timeProgress = (itemTime - startTime) / totalTimeSpan;
      const x = padLeft + timeProgress * plotW;
      const y = padTop + plotH - ((item.totalLp - minLp) / lpRange) * plotH;
      return { x, y, item, playerName: series.player.name, playerSlug: series.player.slug, color: series.color };
    });

    const linePathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    return { ...series, points, linePathD };
  });

  const svgHtml = `
    <svg viewBox="0 0 ${width} ${height}" class="multi-lp-chart-svg" preserveAspectRatio="none" aria-hidden="true">
      <!-- Background Grid -->
      ${gridLines.map(g => `
        <line x1="${padLeft}" y1="${g.y.toFixed(1)}" x2="${width - padRight}" y2="${g.y.toFixed(1)}" stroke="rgba(22,32,29,0.1)" stroke-dasharray="3,3" />
        <text x="${padLeft - 10}" y="${(g.y + 3.5).toFixed(1)}" text-anchor="end" class="chart-y-label">${g.approxTier}</text>
      `).join('')}

      <!-- Bottom baseline -->
      <line x1="${padLeft}" y1="${padTop + plotH}" x2="${width - padRight}" y2="${padTop + plotH}" stroke="rgba(22,32,29,0.22)" />

      <!-- Player Lines -->
      ${renderedSeries.map(s => `
        <path d="${s.linePathD}" fill="none" stroke="${s.color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="multi-player-line" data-player-slug="${s.player.slug}" />
      `).join('')}

      <!-- X Axis Ticks -->
      ${xTicks.map(t => `
        <line x1="${t.x.toFixed(1)}" y1="${padTop + plotH}" x2="${t.x.toFixed(1)}" y2="${padTop + plotH + 4}" stroke="rgba(22,32,29,0.3)" />
        <text x="${t.x.toFixed(1)}" y="${padTop + plotH + 18}" text-anchor="middle" class="chart-x-label">${t.label}</text>
      `).join('')}

      <!-- Interactive Data Dots -->
      ${renderedSeries.flatMap(s => s.points.map((p) => `
        <circle class="multi-chart-point" cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="4" fill="${p.color}" stroke="#ffffff" stroke-width="1.5" data-player-name="${p.playerName}" data-player-slug="${p.playerSlug}" data-date="${p.item.date}" data-tier="${p.item.tier || ''}" data-rank="${p.item.rank || ''}" data-lp="${p.item.leaguePoints}" data-totallp="${p.item.totalLp}" />
      `)).join('')}
    </svg>
    <div class="chart-tooltip" data-chart-tooltip aria-hidden="true"></div>
  `;

  container.innerHTML = svgHtml;
  attachMultiChartTooltipEvents(container);
}

function attachMultiChartTooltipEvents(container) {
  const tooltip = container.querySelector('[data-chart-tooltip]');
  const circles = container.querySelectorAll('.multi-chart-point');
  if (!tooltip) return;

  circles.forEach(circle => {
    const show = () => {
      const playerName = circle.dataset.playerName;
      const date = circle.dataset.date;
      const tier = circle.dataset.tier;
      const rank = circle.dataset.rank;
      const lp = circle.dataset.lp;
      const color = circle.getAttribute('fill');
      const formattedDate = formatDate(date);

      tooltip.innerHTML = `
        <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 2px;">
          <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: ${color};"></span>
          <strong style="color: #ffffff; font-size: 12px;">${playerName}</strong>
        </div>
        <span style="color: var(--acid); font-weight: 700;">${tier} ${rank} (${lp} LP)</span>
        <span style="color: #9aa39c; font-size: 10px;">Datum: ${formattedDate}</span>
      `;
      tooltip.classList.add('is-visible');

      const rect = container.getBoundingClientRect();
      const circleRect = circle.getBoundingClientRect();
      const left = circleRect.left - rect.left + circleRect.width / 2;
      const top = circleRect.top - rect.top - 12;

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

function formatDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}.${m}.${y}`;
}

function renderGameImageGallery(images, title) {
  return `
    <div class="game-feature-gallery" aria-label="Impressionen von ${title}">
      ${images.map((src, index) => `
        <img class="${index === 0 ? 'is-active' : ''}" src="${src}" alt="${title} Impression ${index + 1}" loading="lazy">
      `).join('')}
    </div>
  `;
}

function setupGameImageGallery() {
  const gallery = document.querySelector('.game-feature-gallery');
  const images = gallery ? [...gallery.querySelectorAll('img')] : [];
  if (images.length <= 1) return;

  let index = 0;
  window.setInterval(() => {
    images[index].classList.remove('is-active');
    index = (index + 1) % images.length;
    images[index].classList.add('is-active');
  }, 5000);
}

function renderStatementsCarousel(statements) {
  if (!statements?.length) {
    return '';
  }

  return `
    <div class="intro-carousel">
      <div class="intro-carousel-track">
        ${statements.map(({ name, text }) => `
          <blockquote class="intro-carousel-slide">
            <p>${text}</p>
            <cite>${name}</cite>
          </blockquote>
        `).join('')}
      </div>
      ${statements.length > 1 ? `
        <div class="intro-carousel-dots">
          ${statements.map((statement, index) => `<button class="intro-carousel-dot" type="button" data-index="${index}" aria-label="${statement.name} anzeigen"></button>`).join('')}
        </div>
      ` : ''}
    </div>
  `;
}

function setupStatementsCarousel() {
  const carousel = document.querySelector('.intro-carousel');
  if (!carousel) return;

  const track = carousel.querySelector('.intro-carousel-track');
  const slides = [...carousel.querySelectorAll('.intro-carousel-slide')];
  const dots = [...carousel.querySelectorAll('.intro-carousel-dot')];

  if (slides.length <= 1) return;

  let index = 0;
  let timer = null;
  let dragStartX = null;
  let dragDeltaX = 0;
  let isDragging = false;
  let dragged = false;

  const goTo = (nextIndex) => {
    index = (nextIndex + slides.length) % slides.length;
    track.style.transform = `translateX(-${index * 100}%)`;
    dots.forEach((dot, dotIndex) => dot.classList.toggle('is-active', dotIndex === index));
  };

  const finishDrag = () => {
    if (!isDragging) return;
    const threshold = Math.max(40, carousel.clientWidth * 0.12);
    if (Math.abs(dragDeltaX) >= threshold) {
      goTo(index + (dragDeltaX < 0 ? 1 : -1));
    } else {
      goTo(index);
    }
    dragStartX = null;
    dragDeltaX = 0;
    isDragging = false;
    carousel.classList.remove('is-dragging');
    window.setTimeout(() => { dragged = false; }, 0);
  };

  const stopAutoplay = () => {
    if (timer) window.clearInterval(timer);
    timer = null;
  };

  const startAutoplay = () => {
    stopAutoplay();
    timer = window.setInterval(() => goTo(index + 1), 15000);
  };

  dots.forEach((dot, dotIndex) => dot.addEventListener('click', () => { goTo(dotIndex); startAutoplay(); }));

  carousel.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    if (event.target.closest('.intro-carousel-dot')) return;
    dragStartX = event.clientX;
    dragDeltaX = 0;
    isDragging = true;
    dragged = false;
    carousel.setPointerCapture?.(event.pointerId);
    carousel.classList.add('is-dragging');
    stopAutoplay();
  });

  carousel.addEventListener('pointermove', (event) => {
    if (!isDragging || dragStartX === null) return;
    dragDeltaX = event.clientX - dragStartX;
    if (Math.abs(dragDeltaX) > 6) dragged = true;
    track.style.transform = `translateX(calc(-${index * 100}% + ${dragDeltaX}px))`;
  });

  carousel.addEventListener('pointerup', (event) => {
    finishDrag();
    carousel.releasePointerCapture?.(event.pointerId);
    startAutoplay();
  });
  carousel.addEventListener('pointercancel', () => {
    finishDrag();
    startAutoplay();
  });
  carousel.addEventListener('click', (event) => {
    if (dragged) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);

  carousel.addEventListener('mouseenter', stopAutoplay);
  carousel.addEventListener('mouseleave', startAutoplay);
  carousel.addEventListener('focusin', stopAutoplay);
  carousel.addEventListener('focusout', startAutoplay);

  goTo(0);
  startAutoplay();
}
