// Shared "head-to-head" live/spectator game view, used on player profile and search pages

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
      <div class="live-team-col live-team-col--red">
        <span class="live-team-label">Team Rot</span>
        ${renderLiveTeamParticipants(liveGame.team2)}
      </div>
    </div>
  `;
}

function renderLiveTeamParticipants(participants = []) {
  return participants.map(p => `
    <div class="live-participant-row${p.isSearchedPlayer ? ' live-participant-row--self' : ''}">
      ${p.championImage ? `<img src="${p.championImage}" alt="${p.championName}" class="live-champion-icon" onerror="this.style.display='none';">` : ''}
      <div class="live-participant-info">
        <strong>${p.championName}</strong>
        <span>${p.riotIdGameName ? `${p.riotIdGameName}${p.riotIdTagline ? `#${p.riotIdTagline}` : ''}` : 'Unbekannt'}</span>
      </div>
    </div>
  `).join('');
}
