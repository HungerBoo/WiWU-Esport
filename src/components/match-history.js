// Shared "last N Ranked Solo/Duo matches" view, used on player profile and search pages.
// The compact row focuses on the searched player's own performance; clicking a row expands
// the full scoreboard. Expanding costs no extra API calls since the worker already sent
// every participant.

export function renderMatchHistoryContent(matches, ownPuuid, wiwuPuuids = {}) {
  if (!matches) {
    return `<p class="match-history-status">Letzte Spiele werden geladen ...</p>`;
  }

  if (matches.length === 0) {
    return `<p class="match-history-status">Keine Ranked Solo/Duo Spiele gefunden.</p>`;
  }

  const own = matches.map(m => findOwnParticipant(m, ownPuuid)).filter(Boolean);
  const wins = own.filter(p => p.win).length;

  return `
    <div class="match-history-header">
      <strong>Letzte ${matches.length} Spiele (Ranked Solo/Duo)</strong>
      <span class="match-history-record">${wins}S / ${own.length - wins}N</span>
    </div>
    <div class="match-list">
      ${matches.map((m, index) => renderMatchRow(m, ownPuuid, wiwuPuuids, index)).join('')}
    </div>
  `;
}

function findOwnParticipant(match, ownPuuid) {
  return (match.participants || []).find(p => p.puuid === ownPuuid) || null;
}

function renderMatchRow(match, ownPuuid, wiwuPuuids, index) {
  const me = findOwnParticipant(match, ownPuuid);
  if (!me) return '';

  const kda = me.deaths === 0 ? 'Perfect' : ((me.kills + me.assists) / me.deaths).toFixed(2);
  const durationMin = Math.max(1, Math.round((match.gameDurationSeconds || 0) / 60));
  const csPerMin = ((me.cs || 0) / durationMin).toFixed(1);

  const mates = (match.participants || []).filter(
    p => p.puuid !== ownPuuid && p.teamId === me.teamId && wiwuPuuids[p.puuid]
  );

  return `
    <div class="match-entry">
      <button type="button" class="match-row ${me.win ? 'match-row--win' : 'match-row--loss'}" data-match-toggle data-match-index="${index}" aria-expanded="false">
        <img src="${me.championImage || ''}" alt="${me.championName}" class="match-champion-icon" onerror="this.style.display='none';">
        <div class="match-primary">
          <strong class="match-champion-name">${me.championName}</strong>
          <span class="match-kda-line">${me.kills} / ${me.deaths} / ${me.assists}<span class="match-kda-ratio">${kda} KDA</span></span>
        </div>
        <div class="match-secondary">
          <span class="match-cs">${me.cs} CS <span class="match-cs-min">(${csPerMin}/min)</span></span>
          ${mates.length ? `<span class="match-wiwu-tag">mit ${mates.map(m => wiwuPuuids[m.puuid]).join(', ')}</span>` : ''}
        </div>
        <div class="match-meta">
          <span class="match-result">${me.win ? 'Sieg' : 'Niederlage'}</span>
          <span class="match-when">${formatRelativeTime(match.gameEndTimestamp)}</span>
          <span class="match-duration">${durationMin} Min</span>
        </div>
        <span class="match-expand-hint" aria-hidden="true">▾</span>
      </button>
      <div class="match-detail" data-match-detail data-match-index="${index}" hidden>
        ${renderMatchDetail(match, ownPuuid, wiwuPuuids)}
      </div>
    </div>
  `;
}

function renderMatchDetail(match, ownPuuid, wiwuPuuids) {
  const me = findOwnParticipant(match, ownPuuid);
  if (!me) return '';

  const durationMin = Math.max(1, Math.round((match.gameDurationSeconds || 0) / 60));
  const team1 = (match.participants || []).filter(p => p.teamId === 100);
  const team2 = (match.participants || []).filter(p => p.teamId === 200);

  return `
    <div class="match-detail-stats">
      ${renderStat('Schaden an Champions', formatNumber(me.damageToChampions))}
      ${renderStat('Schaden erhalten', formatNumber(me.damageTaken))}
      ${renderStat('Gold', formatNumber(me.goldEarned))}
      ${renderStat('Vision Score', me.visionScore ?? '-')}
      ${renderStat('Wards', `${me.wardsPlaced ?? 0} gesetzt / ${me.wardsKilled ?? 0} zerstört`)}
      ${renderStat('Champion Level', me.champLevel ?? '-')}
      ${me.killParticipation != null ? renderStat('Kill Participation', `${Math.round(me.killParticipation * 100)}%`) : ''}
      ${me.teamDamagePercentage != null ? renderStat('Team-Schadensanteil', `${Math.round(me.teamDamagePercentage * 100)}%`) : ''}
      ${me.largestMultiKill > 1 ? renderStat('Größter Multikill', `${me.largestMultiKill}x`) : ''}
    </div>

    ${me.items.some(Boolean) ? `
      <div class="match-items">
        <span class="match-detail-label">Items</span>
        <div class="match-item-row">
          ${me.items.map(src => src
            ? `<img src="${src}" alt="" class="match-item-icon" onerror="this.style.visibility='hidden';">`
            : '<span class="match-item-icon match-item-icon--empty"></span>').join('')}
        </div>
      </div>
    ` : ''}

    <div class="match-scoreboard">
      ${renderScoreboardTeam('Team Blau', team1, ownPuuid, wiwuPuuids, durationMin, 'blue')}
      ${renderScoreboardTeam('Team Rot', team2, ownPuuid, wiwuPuuids, durationMin, 'red')}
    </div>
  `;
}

function renderScoreboardTeam(label, participants, ownPuuid, wiwuPuuids, durationMin, variant) {
  const won = participants[0]?.win;

  return `
    <div class="match-team match-team--${variant}">
      <span class="match-team-label">${label} · ${won ? 'Sieg' : 'Niederlage'}</span>
      ${participants.map(p => {
        const isOwn = p.puuid === ownPuuid;
        const wiwuName = wiwuPuuids[p.puuid];
        const classes = [
          'match-scoreboard-row',
          isOwn ? 'match-scoreboard-row--self' : '',
          !isOwn && wiwuName ? 'match-scoreboard-row--wiwu' : ''
        ].filter(Boolean).join(' ');
        const displayName = p.riotIdGameName
          ? `${p.riotIdGameName}${p.riotIdTagline ? `#${p.riotIdTagline}` : ''}`
          : 'Unbekannt';

        return `
          <div class="${classes}">
            <img src="${p.championImage || ''}" alt="${p.championName}" class="match-scoreboard-icon" onerror="this.style.display='none';">
            <span class="match-scoreboard-name">${displayName}${wiwuName ? '<span class="match-wiwu-badge">WiWU</span>' : ''}</span>
            <span class="match-scoreboard-kda">${p.kills}/${p.deaths}/${p.assists}</span>
            <span class="match-scoreboard-cs">${p.cs} CS</span>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderStat(label, value) {
  return `
    <div class="match-stat">
      <span class="match-stat-label">${label}</span>
      <strong class="match-stat-value">${value}</strong>
    </div>
  `;
}

function formatNumber(value) {
  return typeof value === 'number' ? value.toLocaleString('de-DE') : '-';
}

function formatRelativeTime(timestamp) {
  if (!timestamp) return '';
  const diffMinutes = Math.round((Date.now() - timestamp) / 60000);
  if (diffMinutes < 60) return `vor ${Math.max(1, diffMinutes)} Min`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `vor ${diffHours} Std`;

  const diffDays = Math.round(diffHours / 24);
  return diffDays === 1 ? 'gestern' : `vor ${diffDays} Tagen`;
}

export function setupMatchHistoryInteractions(root) {
  if (!root) return;

  root.querySelectorAll('[data-match-toggle]').forEach(button => {
    button.addEventListener('click', () => {
      const detail = root.querySelector(`[data-match-detail][data-match-index="${button.dataset.matchIndex}"]`);
      if (!detail) return;

      const willOpen = detail.hidden;
      detail.hidden = !willOpen;
      button.classList.toggle('is-open', willOpen);
      button.setAttribute('aria-expanded', String(willOpen));
    });
  });
}
