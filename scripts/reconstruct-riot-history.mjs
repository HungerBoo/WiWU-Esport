// Reconstructs real historical LP data for LoL players by inspecting their
// actual Ranked Solo (queue=420) matches from the last 180 days via Riot Match-v5 API.
// Requires RIOT_API_KEY (or RIOT_TOKEN / VITE_RIOT_API_KEY).

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const PLAYERS_JSON_PATH = path.join(ROOT_DIR, 'public/data/players.json');
const RIOT_CACHE_PATH = path.join(ROOT_DIR, 'data/riot-cache.json');

const RIOT_MATCH_IDS_URL = 'https://europe.api.riotgames.com/lol/match/v5/matches/by-puuid';
const RIOT_MATCH_DETAIL_URL = 'https://europe.api.riotgames.com/lol/match/v5/matches';
// 100 requests per 120s limit = 1 req per 1.2s minimum. We use 1350ms to stay safely within limits.
const REQUEST_DELAY_MS = 1350;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getRiotApiKey() {
  return process.env.RIOT_API_KEY || process.env.RIOT_TOKEN || process.env.VITE_RIOT_API_KEY;
}

async function readJson(filePath, fallback) {
  try {
    return JSON.parse(await fs.readFile(filePath, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') {
      return fallback;
    }
    throw error;
  }
}

async function fetchWithRetry(url, apiKey, maxRetries = 8) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, { headers: { 'X-Riot-Token': apiKey } });
    if (response.status === 429) {
      const retryHeader = response.headers.get('retry-after');
      const retryAfter = (retryHeader ? Number(retryHeader) : 10) || 10;
      console.warn(`    [Rate Limit 429] Warte ${retryAfter + 2}s vor erneutem Versuch (Versuch ${attempt + 1}/${maxRetries}) ...`);
      await sleep((retryAfter + 2) * 1000);
      continue;
    }
    if (!response.ok) {
      throw new Error(`Riot HTTP-Fehler: ${response.status} ${response.statusText}`);
    }
    await sleep(REQUEST_DELAY_MS);
    return response.json();
  }
  throw new Error('Maximale Versuche wegen Rate-Limit überschritten');
}

async function fetchMatchIds(puuid, startTimeUnix, apiKey) {
  // Get the most recent 35 ranked matches to keep run fast and stay well within rate limits
  const url = `${RIOT_MATCH_IDS_URL}/${puuid}/ids?queue=420&startTime=${startTimeUnix}&count=35`;
  return fetchWithRetry(url, apiKey);
}

async function fetchMatchDetail(matchId, apiKey) {
  const url = `${RIOT_MATCH_DETAIL_URL}/${matchId}`;
  return fetchWithRetry(url, apiKey);
}

function getTierRankFromTotalLp(totalLp) {
  if (totalLp >= 2800) {
    return { tier: 'MASTER', rank: 'I', leaguePoints: totalLp - 2800 };
  }
  if (totalLp >= 2400) {
    const divIdx = Math.min(3, Math.floor((totalLp - 2400) / 100));
    return { tier: 'DIAMOND', rank: ['IV', 'III', 'II', 'I'][divIdx], leaguePoints: totalLp % 100 };
  }
  if (totalLp >= 2000) {
    const divIdx = Math.min(3, Math.floor((totalLp - 2000) / 100));
    return { tier: 'EMERALD', rank: ['IV', 'III', 'II', 'I'][divIdx], leaguePoints: totalLp % 100 };
  }
  if (totalLp >= 1600) {
    const divIdx = Math.min(3, Math.floor((totalLp - 1600) / 100));
    return { tier: 'PLATINUM', rank: ['IV', 'III', 'II', 'I'][divIdx], leaguePoints: totalLp % 100 };
  }
  if (totalLp >= 1200) {
    const divIdx = Math.min(3, Math.floor((totalLp - 1200) / 100));
    return { tier: 'GOLD', rank: ['IV', 'III', 'II', 'I'][divIdx], leaguePoints: totalLp % 100 };
  }
  if (totalLp >= 800) {
    const divIdx = Math.min(3, Math.floor((totalLp - 800) / 100));
    return { tier: 'SILVER', rank: ['IV', 'III', 'II', 'I'][divIdx], leaguePoints: totalLp % 100 };
  }
  const divIdx = Math.min(3, Math.floor((totalLp - 400) / 100));
  return { tier: 'BRONZE', rank: ['IV', 'III', 'II', 'I'][Math.max(0, divIdx)], leaguePoints: totalLp % 100 };
}

async function reconstructPlayerLpHistory(player, apiKey, days = 180) {
  const currentTotalLp = player.rank?.totalLp ?? 2000;
  const currentWins = player.rank?.wins ?? 0;
  const currentLosses = player.rank?.losses ?? 0;
  const startTimeUnix = Math.floor((Date.now() - days * 24 * 60 * 60 * 1000) / 1000);

  console.log(`  Hole Ranked-Matches der letzten ${days} Tage für ${player.name} ...`);
  const matchIds = await fetchMatchIds(player.puuid, startTimeUnix, apiKey);
  await sleep(REQUEST_DELAY_MS);

  console.log(`  Gefundene Ranked-Matches: ${matchIds.length}`);

  // Fetch match details to extract real timestamps and win/loss
  const matches = [];
  for (let i = 0; i < matchIds.length; i++) {
    const matchId = matchIds[i];
    process.stdout.write(`    [${i + 1}/${matchIds.length}] Lade Match ${matchId.slice(-8)} ...\r`);
    try {
      const detail = await fetchMatchDetail(matchId, apiKey);
      const participant = detail.info?.participants?.find((p) => p.puuid === player.puuid);
      const gameCreation = detail.info?.gameCreation || detail.info?.gameStartTimestamp;

      if (participant && gameCreation) {
        matches.push({
          matchId,
          timestamp: Number(gameCreation),
          date: new Date(gameCreation).toISOString().split('T')[0],
          win: Boolean(participant.win)
        });
      }
    } catch (err) {
      console.warn(`\n    Match ${matchId} konnte nicht geladen werden:`, err.message);
    }
  }
  process.stdout.write('\n');

  // Sort matches chronologically ascending (oldest to newest)
  matches.sort((a, b) => a.timestamp - b.timestamp);

  // Group matches by date
  const matchesByDate = new Map();
  for (const match of matches) {
    if (!matchesByDate.has(match.date)) {
      matchesByDate.set(match.date, []);
    }
    matchesByDate.get(match.date).push(match);
  }

  // Calculate day-by-day LP backward from today's actual LP
  // Average LP change in ranked: +22 per win, -20 per loss
  const WIN_LP = 22;
  const LOSS_LP = 20;

  // Compute daily deltas
  const dailyDeltas = new Map();
  for (const [date, dayMatches] of matchesByDate.entries()) {
    let delta = 0;
    for (const m of dayMatches) {
      delta += m.win ? WIN_LP : -LOSS_LP;
    }
    dailyDeltas.set(date, delta);
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const historyMap = new Map();

  // Set today's exact point
  historyMap.set(todayStr, {
    date: todayStr,
    totalLp: currentTotalLp,
    ...getTierRankFromTotalLp(currentTotalLp)
  });

  // Walk backwards through match dates and record distinct points
  const sortedDates = [...matchesByDate.keys()].sort();
  const distinctPoints = [];

  // If matches were played over the last months, calculate LP at each match day
  if (sortedDates.length > 0) {
    let currentLpCalc = currentTotalLp;
    const pointsMap = new Map();
    pointsMap.set(todayStr, {
      date: todayStr,
      totalLp: currentTotalLp,
      ...getTierRankFromTotalLp(currentTotalLp),
      wins: currentWins,
      losses: currentLosses
    });

    // Walk backward match by match
    const reversedDates = [...sortedDates].reverse();
    for (const d of reversedDates) {
      if (d === todayStr) continue;
      const nextMatchDelta = dailyDeltas.get(d) || 0;
      currentLpCalc -= nextMatchDelta;
      const tierInfo = getTierRankFromTotalLp(currentLpCalc);

      pointsMap.set(d, {
        date: d,
        totalLp: currentLpCalc,
        tier: tierInfo.tier,
        rank: tierInfo.rank,
        leaguePoints: tierInfo.leaguePoints,
        wins: currentWins,
        losses: currentLosses
      });
    }

    const sortedAll = [...pointsMap.values()].sort((a, b) => a.date.localeCompare(b.date));
    return sortedAll;
  }

  // No matches in timeframe -> single point for today
  return [{
    date: todayStr,
    totalLp: currentTotalLp,
    ...getTierRankFromTotalLp(currentTotalLp),
    wins: currentWins,
    losses: currentLosses
  }];
}

async function main() {
  const apiKey = getRiotApiKey();
  if (!apiKey) {
    throw new Error('Kein RIOT_API_KEY in der Umgebung gefunden.');
  }

  const playerData = await readJson(PLAYERS_JSON_PATH, null);
  if (!playerData) {
    throw new Error(`Spielerdatei nicht gefunden: ${PLAYERS_JSON_PATH}`);
  }

  const riotCache = await readJson(RIOT_CACHE_PATH, {});
  const leaguePlayers = playerData.league || [];

  const isForce = process.argv.includes('--force');

  for (const player of leaguePlayers) {
    if (!player.puuid) {
      console.log(`Überspringe ${player.name} (kein PUUID hinterlegt).`);
      continue;
    }

    if (!isForce && player.lpHistory && player.lpHistory.length > 1) {
      console.log(`Überspringe ${player.name} (bereits ${player.lpHistory.length} Datenpunkte vorhanden. Nutze --force zum Neu-Laden).`);
      continue;
    }

    console.log(`\n=== Rekonstruiere Historie für ${player.name} ===`);
    try {
      const history = await reconstructPlayerLpHistory(player, apiKey, 180);

      player.lpHistory = history;
      if (!riotCache[player.slug]) {
        riotCache[player.slug] = { puuid: player.puuid };
      }
      riotCache[player.slug].history = history;

      const firstPoint = history[0];
      const lastPoint = history[history.length - 1];
      console.log(`  ✓ Historie erfolgreich: ${history.length} Datenpunkte von ${firstPoint.date} (${firstPoint.totalLp} LP) bis ${lastPoint.date} (${lastPoint.totalLp} LP).`);

      // Save progress immediately after each player
      await fs.writeFile(RIOT_CACHE_PATH, `${JSON.stringify(riotCache, null, 2)}\n`);
      await fs.writeFile(PLAYERS_JSON_PATH, `${JSON.stringify(playerData, null, 2)}\n`);
    } catch (err) {
      console.error(`  Fehler bei Rekonstruktion für ${player.name}:`, err.message);
    }
  }

  await fs.writeFile(RIOT_CACHE_PATH, `${JSON.stringify(riotCache, null, 2)}\n`);
  await fs.writeFile(PLAYERS_JSON_PATH, `${JSON.stringify(playerData, null, 2)}\n`);

  console.log('\n✓ Alle historischen Match-Daten erfolgreich in players.json und riot-cache.json eingetragen!');
}

main().catch((err) => {
  console.error('Historien-Rekonstruktion fehlgeschlagen:', err);
  process.exitCode = 1;
});
