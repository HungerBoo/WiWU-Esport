// Shared "head-to-head" live/spectator game view, used on player profile and search pages.
// Clicking any teammate/opponent lazily fetches their current rank via the Riot proxy
// worker (by puuid) and shows it in a detail card below the two team columns.

import { site } from '../content/site-data.js';

// Session-only cache so re-clicking the same participant doesn't refetch
const rankDetailCache = new Map();

export function renderLiveGameContent(liveGame) {
  if (!liveGame) {
    return `<p class="live-game-status">Live-Spielstatus wird geladen ...</p>`;
  }

  if (!liveGame.inGame) {
    return `<p class="live-game-status">Aktuell nicht im Spiel.</p>`;
  }

  const minutes = Math.floor((liveGame.gameLengthSeconds || 0) / 60);
  const seconds = String((liveGame.gameLengthSeconds || 0) % 60).padStart(2, '0');

  return `
    <div class="live-game-header">
      <strong>🔴 Live: ${liveGame.queueName || liveGame.gameMode}</strong>
      <span class="live-game-timer">${minutes}:${seconds}</span>
    </div>
    <div class="live-teams-grid">
      <div class="live-team-col live-team-col--blue">
        <span class="live-team-label">Team Blau</span>
        ${renderLiveTeamParticipants(liveGame.team1)}
      </div>
      <span class="live-vs-divider">VS</span>
      <div class="live-team-col live-team-col--red">
        <span class="live-team-label">Team Rot</span>
        ${renderLiveTeamParticipants(liveGame.team2)}
      </div>
    </div>
    <div class="live-detail-slot" data-live-detail-slot hidden></div>
  `;
}

function renderLiveTeamParticipants(participants = []) {
  return participants.map(p => {
    const riotName = p.riotIdGameName ? `${p.riotIdGameName}${p.riotIdTagline ? `#${p.riotIdTagline}` : ''}` : 'Unbekannt';

    if (p.isSearchedPlayer) {
      return `
        <div class="live-participant-row live-participant-row--self">
          ${p.championImage ? `<img src="${p.championImage}" alt="${p.championName}" class="live-champion-icon" onerror="this.style.display='none';">` : ''}
          <div class="live-participant-info">
            <strong>${p.championName}</strong>
            <span>${riotName}</span>
          </div>
        </div>
      `;
    }

    return `
      <button type="button" class="live-participant-row" data-live-participant data-puuid="${p.puuid || ''}" data-champion-name="${p.championName}" data-champion-image="${p.championImage || ''}" data-riot-name="${riotName}">
        ${p.championImage ? `<img src="${p.championImage}" alt="${p.championName}" class="live-champion-icon" onerror="this.style.display='none';">` : ''}
        <div class="live-participant-info">
          <strong>${p.championName}</strong>
          <span>${riotName}</span>
        </div>
      </button>
    `;
  }).join('');
}

export function setupLiveGameInteractions(root) {
  if (!root) return;

  root.querySelectorAll('[data-live-participant]').forEach(row => {
    row.addEventListener('click', () => toggleParticipantDetail(root, row));
  });
}

async function toggleParticipantDetail(root, row) {
  const slot = root.querySelector('[data-live-detail-slot]');
  const puuid = row.dataset.puuid;
  if (!slot || !puuid) return;

  const alreadyOpenForThisRow = slot.dataset.openPuuid === puuid && !slot.hidden;
  root.querySelectorAll('[data-live-participant]').forEach(r => r.classList.remove('is-selected'));

  if (alreadyOpenForThisRow) {
    closeParticipantDetail(slot, root);
    return;
  }

  row.classList.add('is-selected');
  slot.hidden = false;
  slot.dataset.openPuuid = puuid;

  const participant = {
    championName: row.dataset.championName,
    championImage: row.dataset.championImage,
    riotName: row.dataset.riotName
  };

  const cached = rankDetailCache.get(puuid);
  slot.innerHTML = renderParticipantDetail(participant, cached || null);
  bindCloseButton(root, slot);
  if (cached || !site.riotProxyUrl) return;

  try {
    const res = await fetch(`${site.riotProxyUrl.replace(/\/$/, '')}?puuid=${encodeURIComponent(puuid)}&profile=1`);
    const data = res.ok ? await res.json() : { error: true };
    rankDetailCache.set(puuid, data);
    if (slot.dataset.openPuuid === puuid) {
      slot.innerHTML = renderParticipantDetail(participant, data);
      bindCloseButton(root, slot);
    }
  } catch {
    if (slot.dataset.openPuuid === puuid) {
      slot.innerHTML = renderParticipantDetail(participant, { error: true });
      bindCloseButton(root, slot);
    }
  }
}

function bindCloseButton(root, slot) {
  slot.querySelector('[data-live-detail-close]')?.addEventListener('click', () => closeParticipantDetail(slot, root));
}

function closeParticipantDetail(slot, root) {
  slot.hidden = true;
  slot.innerHTML = '';
  delete slot.dataset.openPuuid;
  root?.querySelectorAll('[data-live-participant]').forEach(r => r.classList.remove('is-selected'));
}

function renderParticipantDetail(participant, rankData) {
  const { championName, championImage, riotName } = participant;

  if (!rankData) {
    return `
      <div class="live-detail-card">
        <button type="button" class="live-detail-close" data-live-detail-close aria-label="Schließen">✕</button>
        <p class="live-game-status">Lade Rang ...</p>
      </div>
    `;
  }

  if (rankData.error) {
    return `
      <div class="live-detail-card">
        <button type="button" class="live-detail-close" data-live-detail-close aria-label="Schließen">✕</button>
        <p class="live-game-status">Rang konnte nicht geladen werden.</p>
      </div>
    `;
  }

  const rank = rankData.unranked ? null : rankData;

  return `
    <div class="live-detail-card">
      <button type="button" class="live-detail-close" data-live-detail-close aria-label="Schließen">✕</button>
      <div class="live-detail-header">
        ${championImage ? `<img src="${championImage}" alt="${championName}" class="live-champion-icon">` : ''}
        <div>
          <strong>${riotName || 'Unbekannt'}</strong>
          <span>${championName}</span>
        </div>
      </div>
      <div class="live-detail-rank">
        <span class="live-detail-tier">${rank?.tierDisplay || 'Unranked'}</span>
        <span class="live-detail-lp">${rank?.lpDisplay || '0 LP'}</span>
        <span class="live-detail-wr">${rank?.winrate ?? 0}% WR (${rank?.wins ?? 0}S / ${rank?.losses ?? 0}N)</span>
      </div>
    </div>
  `;
}
