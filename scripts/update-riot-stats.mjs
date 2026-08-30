// Fetches Riot Games API ranked data for League of Legends players
// and updates rank information and LP history in public/data/players.json
// and persistent cache in data/riot-cache.json.
// Requires RIOT_API_KEY (or RIOT_TOKEN / VITE_RIOT_API_KEY) in environment. Never log the key.

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const PLAYERS_JSON_PATH = path.join(ROOT_DIR, 'public/data/players.json');
const RIOT_CACHE_PATH = path.join(ROOT_DIR, 'data/riot-cache.json');

const RIOT_ACCOUNT_URL = 'https://europe.api.riotgames.com/riot/account/v1/accounts/by-riot-id';
const RIOT_LEAGUE_URL = 'https://euw1.api.riotgames.com/lol/league/v4/entries/by-puuid';
const REQUEST_DELAY_MS = 250;

const TIER_BASE_LP = {
  IRON: 0,
  BRONZE: 400,
  SILVER: 800,
  GOLD: 1200,
  PLATINUM: 1600,
  EMERALD: 2000,
  DIAMOND: 2400,
  MASTER: 2800,
  GRANDMASTER: 2800,
  CHALLENGER: 2800
};

const DIVISION_OFFSET = {
  IV: 0,
  III: 100,
  II: 200,
  I: 300
};

export function calculateTotalLp(tier, rank, leaguePoints) {
  if (!tier) return 0;
  const upperTier = tier.toUpperCase();
  const base = TIER_BASE_LP[upperTier] ?? 1200;
  const divOffset = DIVISION_OFFSET[rank] ?? 0;
  const lp = Number(leaguePoints) || 0;

  if (['MASTER', 'GRANDMASTER', 'CHALLENGER'].includes(upperTier)) {
    return base + lp;
  }
  return base + divOffset + lp;
}

export function formatTierName(tier, rank) {
  if (!tier) return 'Unranked';
  const prettyTier = tier.charAt(0).toUpperCase() + tier.slice(1).toLowerCase();
  if (['Master', 'Grandmaster', 'Challenger'].includes(prettyTier)) {
    return prettyTier;
  }
  return `${prettyTier} ${rank || ''}`.trim();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

function getRiotApiKey() {
  return process.env.RIOT_API_KEY || process.env.RIOT_TOKEN || process.env.VITE_RIOT_API_KEY;
}

async function fetchRiotAccount(gameName, tagLine, apiKey) {
  const url = `${RIOT_ACCOUNT_URL}/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
  const response = await fetch(url, {
    headers: { 'X-Riot-Token': apiKey }
  });

  if (!response.ok) {
    throw new Error(`Account fetch failed for ${gameName}#${tagLine} (${response.status}: ${response.statusText})`);
  }
  return response.json();
}

async function fetchRiotLeagueEntries(puuid, apiKey) {
  const url = `${RIOT_LEAGUE_URL}/${puuid}`;
  const response = await fetch(url, {
    headers: { 'X-Riot-Token': apiKey }
  });

  if (!response.ok) {
    throw new Error(`League entries fetch failed for PUUID ${puuid.slice(0, 8)}... (${response.status}: ${response.statusText})`);
  }
  return response.json();
}

export async function updateRiotStats() {
  const apiKey = getRiotApiKey();

  if (!apiKey) {
    console.warn('Kein RIOT_API_KEY in der Umgebung gefunden. Überspringe Riot-Update.');
    return;
  }

  const playerData = await readJson(PLAYERS_JSON_PATH, null);
  if (!playerData) {
    throw new Error(`Spielerdatei nicht gefunden: ${PLAYERS_JSON_PATH}`);
  }

  const riotCache = await readJson(RIOT_CACHE_PATH, {});
  const todayStr = new Date().toISOString().split('T')[0];
  const leaguePlayers = playerData.league || [];

  for (const player of leaguePlayers) {
    const riotId = player.riotId || parseRiotIdFromOpgg(player.opgg);
    if (!riotId) {
      console.log(`Keine Riot-ID für ${player.name} gefunden.`);
      continue;
    }

    player.riotId = riotId;
    console.log(`Aktualisiere ${player.name} (${riotId.gameName}#${riotId.tagLine}) ...`);

    try {
      let puuid = player.puuid || riotCache[player.slug]?.puuid;
      if (!puuid) {
        const account = await fetchRiotAccount(riotId.gameName, riotId.tagLine, apiKey);
        puuid = account.puuid;
        await sleep(REQUEST_DELAY_MS);
      }
      player.puuid = puuid;

      const entries = await fetchRiotLeagueEntries(puuid, apiKey);
      await sleep(REQUEST_DELAY_MS);

      const soloEntry = entries.find((e) => e.queueType === 'RANKED_SOLO_5x5') || entries[0];

      if (soloEntry) {
        const tier = soloEntry.tier;
        const rank = soloEntry.rank;
        const lp = soloEntry.leaguePoints;
        const wins = soloEntry.wins;
        const losses = soloEntry.losses;
        const winrate = wins + losses > 0 ? Math.round((wins / (wins + losses)) * 100) : 0;
        const totalLp = calculateTotalLp(tier, rank, lp);

        player.rank = {
          tier,
          rank,
          leaguePoints: lp,
          wins,
          losses,
          winrate,
          hotStreak: Boolean(soloEntry.hotStreak),
          tierDisplay: formatTierName(tier, rank),
          lpDisplay: `${lp} LP`,
          totalLp,
          lastUpdated: new Date().toISOString()
        };

        // Cache & Real History maintenance (no fake data)
        if (!riotCache[player.slug]) {
          riotCache[player.slug] = {
            puuid,
            history: []
          };
        }

        const playerHistory = riotCache[player.slug].history || [];
        const todaySnapshot = {
          date: todayStr,
          tier,
          rank,
          leaguePoints: lp,
          totalLp,
          wins,
          losses
        };

        const updatedHistory = recordLpChange(playerHistory, todaySnapshot);

        // Keep up to 100 historical change points
        if (updatedHistory.length > 100) {
          updatedHistory.splice(0, updatedHistory.length - 100);
        }

        riotCache[player.slug].history = updatedHistory;
        player.lpHistory = updatedHistory;

        console.log(`  ✓ ${player.name}: ${player.rank.tierDisplay} (${player.rank.lpDisplay}) - ${winrate}% WR (${wins}W/${losses}L)`);
      } else {
        console.log(`  ! ${player.name} ist aktuell unranked.`);
      }
    } catch (error) {
      console.error(`  Fehler bei ${player.name}:`, error.message);
    }
  }

  await fs.mkdir(path.dirname(RIOT_CACHE_PATH), { recursive: true });
  await fs.writeFile(RIOT_CACHE_PATH, `${JSON.stringify(riotCache, null, 2)}\n`);
  await fs.writeFile(PLAYERS_JSON_PATH, `${JSON.stringify(playerData, null, 2)}\n`);

  console.log('Riot-Statistiken wurden erfolgreich aktualisiert.');
}

function recordLpChange(history, todaySnapshot) {
  if (!history || history.length === 0) {
    return [todaySnapshot];
  }

  const result = [...history].sort((a, b) => a.date.localeCompare(b.date));
  const lastIndex = result.length - 1;
  const lastItem = result[lastIndex];

  // If there is already an entry for today, update it
  if (lastItem.date === todaySnapshot.date) {
    result[lastIndex] = todaySnapshot;
    return result;
  }

  // If LP hasn't changed compared to previous recorded point, don't add duplicate
  if (lastItem.totalLp === todaySnapshot.totalLp) {
    return result;
  }

  // LP has changed on a new date -> add new data point
  result.push(todaySnapshot);
  return result;
}

function parseRiotIdFromOpgg(opggUrl) {
  if (!opggUrl) return null;
  try {
    const lastPart = decodeURIComponent(opggUrl.split('/').pop().split('?')[0]);
    if (lastPart.includes('-')) {
      const idx = lastPart.lastIndexOf('-');
      const gameName = lastPart.slice(0, idx);
      const tagLine = lastPart.slice(idx + 1);
      if (gameName && tagLine) {
        return { gameName, tagLine };
      }
    }
  } catch {
    // ignore
  }
  return null;
}

// Run directly if invoked as script
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  updateRiotStats().catch((err) => {
    console.error('Riot-Stats Update fehlgeschlagen:', err);
    process.exitCode = 1;
  });
}
