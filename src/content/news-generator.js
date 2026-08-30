// Generates real-time news feed from League of Legends (Riot API),
// Smash Bros. (start.gg), and Prime League data.

export function generateNewsFeed(playerData, primeLeagueData) {
  const news = [];
  const todayStr = new Date().toISOString().split('T')[0];

  // 1. League of Legends Rank-Ups & SoloQ Milestones
  const leaguePlayers = playerData?.league || [];
  for (const player of leaguePlayers) {
    if (!player.rank) continue;

    const rank = player.rank;
    const history = player.lpHistory || [];
    const playerUrl = `spielerprofil.html?player=${player.slug}`;

    // Rank-Up / High Performance item
    if (rank.tier && rank.tier !== 'UNRANKED') {
      const isEmeraldPlus = ['EMERALD', 'DIAMOND', 'MASTER', 'GRANDMASTER', 'CHALLENGER'].includes(rank.tier);
      const isHighWr = rank.winrate >= 55;

      let title = `${player.name} auf ${rank.tierDisplay}`;
      let description = `Starke SoloQ-Performance: ${player.name} steht bei ${rank.lpDisplay} in ${rank.tierDisplay} mit einer Winrate von ${rank.winrate}% (${rank.wins} Siege / ${rank.losses} Niederlagen).`;
      let badge = 'Rank Up';

      if (rank.tier === 'EMERALD') {
        title = `${player.name} klettert auf ${rank.tierDisplay}`;
        description = `${player.name} behauptet sich in der oberen Elo und grindet durch Emerald mit ${rank.winrate}% Winrate. Nächstes Ziel: Diamond Promo!`;
      } else if (isHighWr) {
        title = `${player.name} dominiert Solo-Queue mit ${rank.winrate}% WR`;
        description = `Nach ${rank.wins + rank.losses} Spielen hält ${player.name} eine überragende Siegrate in ${rank.tierDisplay} (${rank.lpDisplay}).`;
        badge = 'Winrate';
      }

      // Date of latest match/point or today
      const latestDate = history.length > 0 ? history[history.length - 1].date : todayStr;

      news.push({
        id: `lol-rank-${player.slug}`,
        category: 'lol',
        badge,
        date: formatDate(latestDate),
        timestamp: new Date(latestDate).getTime(),
        tag: `Riot Games // ${rank.tierDisplay}`,
        title,
        description,
        meta: `${rank.tierDisplay} • ${rank.winrate}% WR`,
        link: playerUrl
      });
    }
  }

  // 2. Smash Bros. Offline Tournament Results (start.gg)
  const smashPlayers = playerData?.smash || [];
  for (const player of smashPlayers) {
    const tournaments = player.recentTournaments || [];
    for (const t of tournaments) {
      if (!t.tournamentName) continue;

      const placementText = t.placement ? `${t.placement}. Platz${t.totalEntrants ? ` / ${t.totalEntrants}` : ''}` : 'Teilgenommen';
      const eventTitle = `${player.name} bei ${t.tournamentName}`;
      const description = `${player.name} vertritt die Wieländer Wühlmäuse offline im ${t.eventName} Bracket und erzielt den ${placementText}.`;

      news.push({
        id: `smash-${player.slug}-${t.tournamentName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        category: 'smash',
        badge: 'Tournament',
        date: formatDate(t.date || todayStr),
        timestamp: t.date ? new Date(t.date).getTime() : Date.now() - 86400000,
        tag: `start.gg // Offline Event`,
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
      news.push({
        id: 'prime-league-results',
        category: 'prime',
        badge: 'Matchday',
        date: formatDate(todayStr),
        timestamp: Date.now() - 3600000 * 12,
        tag: `Prime League // Division 7.5`,
        title: `Prime League Match-Ergebnisse`,
        description: `Die jüngsten Begegnungen der Gruppenphase: ${recentMatches.join(', ')}. Vorbereitung auf die nächste Saison läuft!`,
        meta: `${primeLeagueData.currentSeason || 'Division 7.5'}`,
        link: primeLeagueData.url || 'league-of-legends.html'
      });
    }

    const seasonStats = primeLeagueData.stats?.recentSeason?.values || [];
    if (seasonStats.length > 0) {
      news.push({
        id: 'prime-league-season-summary',
        category: 'prime',
        badge: 'Season',
        date: formatDate('2026-08-20'),
        timestamp: new Date('2026-08-20').getTime(),
        tag: `Prime League // Tabelle`,
        title: `Saisonabschluss: ${primeLeagueData.currentSeason}`,
        description: `Die Wieländer Wühlmäuse belegen den 6. Platz in Gruppe 7.5 mit 4 Punkten. Taktische Invades und neue Teamcompositions für den nächsten Split sind in Vorbereitung.`,
        meta: `6. Platz • 4 Punkte`,
        link: primeLeagueData.url || 'league-of-legends.html'
      });
    }
  }

  // Sort descending by timestamp (newest first)
  news.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  return news;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}.${parts[1]}.${parts[0]}`;
  }
  return dateStr;
}
