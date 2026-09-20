// Generates real-time news feed from League of Legends (Riot API),
// Smash Bros. (start.gg), and Prime League data.

import { formatDate } from '../utils/dates.js';

function normalizeDateValue(dateLike) {
  if (!dateLike) return null;
  const parsed = new Date(dateLike);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getSortedHistory(history = []) {
  return [...history]
    .filter((entry) => entry && (entry.date || entry.totalLp || entry.tier || entry.rank))
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''));
}

function createNewsItem(item) {
  if (!item || !item.id || !item.title) return null;
  return item;
}

export function generateNewsFeed(playerData, primeLeagueData) {
  const news = [];
  const seenIds = new Set();
  const todayStr = new Date().toISOString().split('T')[0];
  const recentWindowMs = 1000 * 60 * 60 * 24 * 90;
  const nowTs = Date.now();

  const addNews = (entry) => {
    const safeEntry = createNewsItem(entry);
    if (!safeEntry) return;

    if (seenIds.has(safeEntry.id)) return;
    seenIds.add(safeEntry.id);
    news.push(safeEntry);
  };

  // 1. League of Legends Rank-Ups / Deranks only when the rank actually changed recently
  const leaguePlayers = playerData?.league || [];
  for (const player of leaguePlayers) {
    if (!player?.rank) continue;

    const rank = player.rank;
    const history = getSortedHistory(player.lpHistory || []);
    const latestHistory = history[history.length - 1] || null;
    const previousHistory = history.length > 1 ? history[history.length - 2] : null;
    const playerUrl = `spielerprofil.html?player=${player.slug}`;
    const latestDate = latestHistory?.date || player.rank?.lastUpdated || todayStr;
    const latestDateTs = normalizeDateValue(latestDate)?.getTime() || nowTs;

    if (!rank.tier || rank.tier === 'UNRANKED') continue;

    const tierChanged = !!previousHistory && (previousHistory.tier || '') !== (rank.tier || '');
    const rankChanged = !!previousHistory && (previousHistory.rank || '') !== (rank.rank || '');
    const lpChanged = !!previousHistory && Number(previousHistory.totalLp || 0) !== Number(rank.totalLp || 0);
    const recentRankEvent = (latestDateTs >= nowTs - recentWindowMs) && (tierChanged || rankChanged || lpChanged);

    if (!recentRankEvent) continue;

    const prevRankDisplay = previousHistory && previousHistory.tier
      ? `${previousHistory.tier.charAt(0).toUpperCase() + previousHistory.tier.slice(1).toLowerCase()} ${previousHistory.rank || ''}`.trim()
      : null;

    const currentRankDisplay = rank.tierDisplay || `${rank.tier} ${rank.rank}`.trim();
    const isRecentRankUp = Number(rank.totalLp || 0) > Number(previousHistory?.totalLp || 0);
    const isRecentDerank = Number(rank.totalLp || 0) < Number(previousHistory?.totalLp || 0);

    let title = `${player.name} auf ${currentRankDisplay}`;
    let description = `Moderne SoloQ-Form: ${player.name} steht bei ${rank.lpDisplay} in ${currentRankDisplay} mit ${rank.winrate}% Winrate (${rank.wins}W / ${rank.losses}L).`;
    let badge = 'Rank Up';

    if (isRecentDerank && prevRankDisplay) {
      title = `Absturz: ${player.name} in ${currentRankDisplay}`;
      description = `Nach einer harten Serie fällt ${player.name} von ${prevRankDisplay} auf ${currentRankDisplay} (${rank.lpDisplay}) zurück. Stabilität ist jetzt der Schlüssel.`;
      badge = 'Derank';
    } else if (isRecentRankUp && prevRankDisplay) {
      title = `Aufstieg: ${player.name} erreicht ${currentRankDisplay}!`;
      description = `Glückwunsch! ${player.name} steigt von ${prevRankDisplay} auf ${currentRankDisplay} (${rank.lpDisplay}) und hält dabei ${rank.winrate}% Winrate.`;
      badge = 'Rank Up';
    }

    addNews({
      id: `lol-rank-${player.slug}-${latestDate}`,
      category: 'lol',
      badge,
      date: formatDate(latestDate),
      timestamp: latestDateTs,
      tag: `Riot Games // ${currentRankDisplay}`,
      title,
      description,
      meta: `${currentRankDisplay} • ${rank.winrate}% WR`,
      link: playerUrl
    });
  }

  // 2. Smash Bros. Offline Tournament Results (only recent offline events)
  const smashPlayers = playerData?.smash || [];
  for (const player of smashPlayers) {
    const tournaments = [...(player.recentTournaments || [])]
      .filter((t) => !!t?.tournamentName && (t.isOnline === false || t.isOnline === 'false'))
      .filter((t) => {
        const date = normalizeDateValue(t.date);
        return date && (nowTs - date.getTime()) <= recentWindowMs;
      })
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''));

    for (const t of tournaments) {
      const placementText = t.placement ? `${t.placement}. Platz${t.totalEntrants ? ` / ${t.totalEntrants}` : ''}` : 'Teilgenommen';
      const eventKey = `${player.slug}-${(t.tournamentName || '').trim()}-${(t.eventName || '').trim()}-${t.date || ''}`;
      const eventTitle = `${player.name} bei ${t.tournamentName}`;
      const description = `${player.name} vertritt die Wieländer Wühlmäuse offline im ${t.eventName || 'Main Event'} Bracket und erzielt den ${placementText}.`;

      addNews({
        id: `smash-${eventKey.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`,
        category: 'smash',
        badge: 'Tournament',
        date: formatDate(t.date || todayStr),
        timestamp: normalizeDateValue(t.date)?.getTime() || Date.now() - 86400000,
        tag: 'start.gg // Offline Event',
        title: eventTitle,
        description,
        meta: placementText,
        link: t.url || `spielerprofil.html?player=${player.slug}`
      });
    }
  }

  // 3. Prime League Standings & Recent Matchdays
  if (primeLeagueData) {
    const recentMatches = primeLeagueData.recentMatches || [];
    if (recentMatches.length > 0) {
      addNews({
        id: 'prime-league-results',
        category: 'prime',
        badge: 'Matchday',
        date: formatDate(todayStr),
        timestamp: Date.now() - 3600000 * 12,
        tag: `Prime League // Division 7.5`,
        title: 'Prime League Match-Ergebnisse',
        description: `Die jüngsten Begegnungen der Gruppenphase: ${recentMatches.join(', ')}. Vorbereitung auf die nächste Saison läuft!`,
        meta: `${primeLeagueData.currentSeason || 'Division 7.5'}`,
        link: primeLeagueData.url || 'league-of-legends.html'
      });
    }
  }

  // Sort descending by timestamp (newest first)
  news.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  return news;
}
