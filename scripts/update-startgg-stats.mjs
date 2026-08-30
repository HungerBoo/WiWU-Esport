// Fetches start.gg match data for Smash players and refreshes their stats
// in public/data/players.json plus the persistent event cache in data/event-cache.json.
// Requires STARTGG_API_TOKEN in the environment. Never log the token.

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const PLAYERS_JSON_PATH = path.join(ROOT_DIR, 'public/data/players.json');
const EVENT_CACHE_PATH = path.join(ROOT_DIR, 'data/event-cache.json');

const STARTGG_ENDPOINT = 'https://api.start.gg/gql/alpha';
const REQUEST_DELAY_MS = 800;
const MAX_RETRIES = 6;
const MAX_BACKOFF_MS = 60_000;
// If more than this share of an event's set requests fail, treat the player's
// run as unreliable and keep the previously written stats instead of overwriting them.
const MAX_EVENT_FAILURE_RATIO = 0.3;

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

// start.gg's rate-limit window is longer than a few seconds, so prefer its own
// Retry-After hint over a short fixed backoff when one is present.
function getRetryDelayMs(response, attempt) {
  const retryAfter = Number(response.headers.get('retry-after'));

  if (Number.isFinite(retryAfter) && retryAfter > 0) {
    return retryAfter * 1000;
  }

  return Math.min(2000 * 2 ** attempt, MAX_BACKOFF_MS);
}

async function requestStartGG(query, variables) {
  const token = process.env.STARTGG_API_TOKEN;

  if (!token) {
    throw new Error('STARTGG_API_TOKEN fehlt');
  }

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const response = await fetch(STARTGG_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ query, variables })
    });

    if (response.status === 429 || (response.status >= 500 && response.status <= 599)) {
      if (attempt === MAX_RETRIES) {
        throw new Error(`start.gg HTTP-Fehler nach ${MAX_RETRIES} Versuchen: ${response.status} ${response.statusText}`);
      }

      const backoffMs = getRetryDelayMs(response, attempt);
      console.warn(`start.gg antwortete mit ${response.status}, warte ${backoffMs}ms und versuche es erneut ...`);
      await sleep(backoffMs);
      continue;
    }

    if (!response.ok) {
      throw new Error(`start.gg HTTP-Fehler: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();

    if (result.errors?.length) {
      throw new Error(`start.gg GraphQL-Fehler: ${JSON.stringify(result.errors)}`);
    }

    await sleep(REQUEST_DELAY_MS);
    return result.data;
  }

  throw new Error('start.gg-Anfrage fehlgeschlagen');
}

const PLAYER_USER_QUERY = `
  query PlayerUser($playerId: ID!) {
    player(id: $playerId) {
      id
      gamerTag
      user {
        id
        slug
      }
    }
  }
`;

async function fetchUserForPlayer(playerId) {
  const data = await requestStartGG(PLAYER_USER_QUERY, { playerId });
  return data.player?.user ?? null;
}

const USER_EVENTS_QUERY = `
  query UserEvents($userId: ID!, $page: Int!) {
    user(id: $userId) {
      events(query: { page: $page, perPage: 50 }) {
        pageInfo {
          page
          totalPages
        }
        nodes {
          id
          name
          videogame {
            id
            name
          }
          tournament {
            id
            name
            isOnline
          }
        }
      }
    }
  }
`;

async function fetchAllUserEvents(userId) {
  const events = [];
  let page = 1;

  while (true) {
    const data = await requestStartGG(USER_EVENTS_QUERY, { userId, page });
    const connection = data.user?.events;

    if (!connection) {
      console.log(`  Events-Seite ${page}: keine Verbindung von start.gg erhalten.`);
      break;
    }

    const pageInfo = connection.pageInfo;
    const nodes = connection.nodes ?? [];
    events.push(...nodes);
    console.log(`  Events-Seite ${page}/${pageInfo?.totalPages ?? '?'}: ${nodes.length} Events gefunden (gesamt bisher: ${events.length}).`);

    if (!pageInfo || pageInfo.totalPages == null || page >= pageInfo.totalPages) {
      break;
    }

    page++;
  }

  return events;
}

function isUltimateEvent(event) {
  const name = event.videogame?.name?.toLowerCase() ?? '';
  return name.includes('ultimate') || name.includes('super smash bros. ultimate');
}

function mergeEventIds(cachedIds, discoveredIds) {
  return [...new Set([...cachedIds, ...discoveredIds])]
    .map(Number)
    .sort((a, b) => a - b);
}

async function updateEventCacheForPlayer(player, eventCache) {
  const playerKey = String(player.startggPlayerId);
  const cachedIds = eventCache[playerKey] ?? [];
  console.log(`  Bereits im Cache: ${cachedIds.length} Event-IDs.`);

  let user;
  try {
    user = await fetchUserForPlayer(player.startggPlayerId);
  } catch (error) {
    console.error(`Event-Discovery für ${player.name} fehlgeschlagen; Cache bleibt unverändert.`, error.message);
    return cachedIds;
  }

  if (!user) {
    console.warn(`Kein start.gg-User für ${player.name} gefunden; Cache bleibt unverändert.`);
    return cachedIds;
  }

  console.log(`  start.gg-User gefunden: id=${user.id}, slug=${user.slug ?? 'unbekannt'}.`);

  let discoveredEvents;
  try {
    discoveredEvents = await fetchAllUserEvents(user.id);
  } catch (error) {
    console.error(`Events für ${player.name} konnten nicht geladen werden; Cache bleibt unverändert.`, error.message);
    return cachedIds;
  }

  const ultimateEvents = discoveredEvents.filter(isUltimateEvent);
  const ultimateEventIds = ultimateEvents.map((event) => Number(event.id));
  const mergedIds = mergeEventIds(cachedIds, ultimateEventIds);
  const newIds = mergedIds.filter((id) => !cachedIds.includes(id));

  console.log(`  ${discoveredEvents.length} Events insgesamt entdeckt, davon ${ultimateEvents.length} Ultimate-Events; ${newIds.length} neue Event-IDs, ${mergedIds.length} Event-IDs insgesamt im Cache.`);

  eventCache[playerKey] = mergedIds;
  return mergedIds;
}

const PLAYER_SETS_QUERY = `
  query PlayerSetsInEvent($eventId: ID!, $playerId: ID!, $page: Int!) {
    event(id: $eventId) {
      id
      name
      tournament {
        id
        name
        isOnline
      }
      sets(page: $page, perPage: 50, filters: { playerIds: [$playerId] }) {
        pageInfo {
          page
          totalPages
        }
        nodes {
          id
          state
          completedAt
          winnerId
          slots {
            entrant {
              id
              participants {
                player {
                  id
                }
              }
            }
          }
        }
      }
    }
  }
`;

function getPlayerEntrantId(set, playerId) {
  const targetPlayerId = String(playerId);

  for (const slot of set.slots ?? []) {
    const entrant = slot?.entrant;
    if (!entrant) continue;

    const containsPlayer = (entrant.participants ?? []).some(
      (participant) => String(participant?.player?.id) === targetPlayerId
    );

    if (containsPlayer) {
      return String(entrant.id);
    }
  }

  return null;
}

function didPlayerWin(set, playerId) {
  const playerEntrantId = getPlayerEntrantId(set, playerId);

  if (!playerEntrantId || set.winnerId == null) {
    return null;
  }

  return String(set.winnerId) === playerEntrantId;
}

function normalizeSet(set, event, playerId) {
  if (!set.completedAt) return null;
  if (set.winnerId == null) return null;

  const win = didPlayerWin(set, playerId);
  if (win === null) return null;

  return {
    id: String(set.id),
    eventId: String(event.id),
    completedAt: Number(set.completedAt),
    isOnline: event.tournament?.isOnline === true,
    win
  };
}

async function fetchSetsForEvent(eventId, playerId) {
  const normalizedSets = [];
  let page = 1;
  let eventName = null;
  let rawSetCount = 0;

  while (true) {
    const data = await requestStartGG(PLAYER_SETS_QUERY, { eventId, playerId, page });
    const event = data.event;

    if (!event?.sets) {
      console.log(`    Event ${eventId}: keine Sets-Daten von start.gg erhalten (Event existiert evtl. nicht mehr).`);
      break;
    }

    eventName ??= event.name;
    const rawSets = event.sets.nodes ?? [];
    rawSetCount += rawSets.length;

    for (const rawSet of rawSets) {
      const normalized = normalizeSet(rawSet, event, playerId);

      if (normalized) {
        normalizedSets.push(normalized);
      }
    }

    const pageInfo = event.sets.pageInfo;

    if (!pageInfo || pageInfo.totalPages == null || page >= pageInfo.totalPages) {
      break;
    }

    page++;
  }

  console.log(`    Event ${eventId} ("${eventName ?? 'unbekannt'}"): ${rawSetCount} Sets von start.gg, ${normalizedSets.length} davon zählbar.`);

  return normalizedSets;
}

function deduplicateSets(sets) {
  const byId = new Map();

  for (const set of sets) {
    byId.set(String(set.id), set);
  }

  return [...byId.values()];
}

function getSixMonthsAgoUnix() {
  const date = new Date();
  date.setUTCMonth(date.getUTCMonth() - 6);
  return Math.floor(date.getTime() / 1000);
}

function calculateRate(wins, losses) {
  const total = wins + losses;

  if (total === 0) {
    return null;
  }

  return Math.round((wins / total) * 100);
}

function computeStats(inputSets) {
  const sets = deduplicateSets(inputSets);
  const sixMonthsAgo = getSixMonthsAgoUnix();

  let allWins = 0;
  let allLosses = 0;
  let recentWins = 0;
  let recentLosses = 0;
  let offlineWins = 0;
  let offlineLosses = 0;
  let onlineWins = 0;
  let onlineLosses = 0;

  for (const set of sets) {
    if (set.win) {
      allWins++;
    } else {
      allLosses++;
    }

    if (set.completedAt >= sixMonthsAgo) {
      if (set.win) {
        recentWins++;
      } else {
        recentLosses++;
      }
    }

    if (set.isOnline) {
      if (set.win) {
        onlineWins++;
      } else {
        onlineLosses++;
      }
    } else if (set.win) {
      offlineWins++;
    } else {
      offlineLosses++;
    }
  }

  return {
    allTime: { wins: allWins, losses: allLosses, winrate: calculateRate(allWins, allLosses) },
    last6Months: { wins: recentWins, losses: recentLosses, winrate: calculateRate(recentWins, recentLosses) },
    offline: { wins: offlineWins, losses: offlineLosses, winrate: calculateRate(offlineWins, offlineLosses) },
    online: { wins: onlineWins, losses: onlineLosses, winrate: calculateRate(onlineWins, onlineLosses) },
    countedSetCount: sets.length
  };
}

function formatRate(value) {
  return value == null ? 'N/A' : `${value}%`;
}

function formatRecord(stat) {
  return `${stat.wins}-${stat.losses} (${formatRate(stat.winrate)})`;
}

function formatSiteStats(stats) {
  return {
    'All Time': formatRecord(stats.allTime),
    'Letzte 6 Monate': formatRecord(stats.last6Months),
    Offline: formatRate(stats.offline.winrate),
    Online: formatRate(stats.online.winrate)
  };
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

async function updateStatsForPlayer(player, eventCache) {
  const eventIds = await updateEventCacheForPlayer(player, eventCache);
  console.log(`  Lade Sets aus ${eventIds.length} bekannten Events ...`);

  const allSets = [];
  let failedEventCount = 0;

  for (const [index, eventId] of eventIds.entries()) {
    console.log(`    [${index + 1}/${eventIds.length}] Event ${eventId} wird geladen ...`);

    try {
      const sets = await fetchSetsForEvent(eventId, player.startggPlayerId);
      allSets.push(...sets);
    } catch (error) {
      failedEventCount++;
      console.error(`    Event ${eventId} für ${player.name} konnte nicht geladen werden:`, error.message);
    }
  }

  if (eventIds.length > 0 && failedEventCount / eventIds.length > MAX_EVENT_FAILURE_RATIO) {
    console.error(`Zu viele fehlgeschlagene Events für ${player.name} (${failedEventCount}/${eventIds.length}); Statistik bleibt unverändert.`);
    return null;
  }

  const stats = computeStats(allSets);
  console.log(`  ${allSets.length} rohe Sets gesammelt, ${stats.countedSetCount} nach Deduplizierung; ${failedEventCount} Event(s) fehlgeschlagen.`);

  return formatSiteStats(stats);
}

const RECENT_TOURNAMENTS_QUERY = `
  query RecentTournaments($userId: ID!) {
    user(id: $userId) {
      events(query: { perPage: 12, page: 1 }) {
        nodes {
          id
          name
          startAt
          numEntrants
          videogame {
            name
          }
          tournament {
            name
            slug
            isOnline
          }
          userEntrant(userId: $userId) {
            standing {
              placement
            }
          }
        }
      }
    }
  }
`;

async function fetchRecentTournaments(userId) {
  if (!userId) return [];
  try {
    const data = await requestStartGG(RECENT_TOURNAMENTS_QUERY, { userId });
    const nodes = data.user?.events?.nodes || [];
    const ultimateEvents = nodes.filter(isUltimateEvent);

    return ultimateEvents.slice(0, 3).map((e) => {
      const placement = e.userEntrant?.standing?.placement ?? null;
      const totalEntrants = e.numEntrants ?? null;
      const dateStr = e.startAt ? new Date(e.startAt * 1000).toISOString().split('T')[0] : null;
      const slug = e.tournament?.slug;
      const url = slug ? `https://www.start.gg/${slug}` : null;

      return {
        tournamentName: e.tournament?.name || 'Turnier',
        eventName: e.name || 'Singles',
        isOnline: Boolean(e.tournament?.isOnline),
        placement,
        totalEntrants,
        date: dateStr,
        url,
        resultDisplay: placement ? `${placement}. Platz${totalEntrants ? ` / ${totalEntrants}` : ''}` : 'Teilgenommen'
      };
    });
  } catch (error) {
    console.warn('Konnte letzte Turniere nicht laden:', error.message);
    return [];
  }
}

async function main() {
  const playerData = await readJson(PLAYERS_JSON_PATH, null);

  if (!playerData) {
    throw new Error(`Spielerdatei nicht gefunden: ${PLAYERS_JSON_PATH}`);
  }

  const eventCache = await readJson(EVENT_CACHE_PATH, {});

  const smashPlayers = playerData.smash ?? [];

  for (const player of smashPlayers) {
    if (!player.startggPlayerId) {
      continue;
    }

    console.log(`Aktualisiere ${player.name} (startggPlayerId=${player.startggPlayerId}) ...`);

    try {
      const user = await fetchUserForPlayer(player.startggPlayerId);
      if (user?.id) {
        player.userId = user.id;
        const recentTournaments = await fetchRecentTournaments(user.id);
        if (recentTournaments.length > 0) {
          player.recentTournaments = recentTournaments;
          console.log(`  ${recentTournaments.length} letzte Turniere für ${player.name} geladen.`);
        }
      }

      const stats = await updateStatsForPlayer(player, eventCache);

      if (stats) {
        player.stats = stats;
        console.log(`  Neue Statistik für ${player.name}:`, stats);
      }
    } catch (error) {
      console.error(`Statistik für ${player.name} konnte nicht aktualisiert werden; bestehende Werte bleiben erhalten.`, error.message);
    }
  }

  await fs.mkdir(path.dirname(EVENT_CACHE_PATH), { recursive: true });
  await fs.writeFile(EVENT_CACHE_PATH, `${JSON.stringify(eventCache, null, 2)}\n`);
  await fs.writeFile(PLAYERS_JSON_PATH, `${JSON.stringify(playerData, null, 2)}\n`);

  console.log('start.gg-Statistiken wurden aktualisiert.');
}

main().catch((error) => {
  console.error('Update fehlgeschlagen:', error.message);
  process.exitCode = 1;
});
