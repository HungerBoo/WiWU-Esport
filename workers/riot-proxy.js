/**
 * Cloudflare Worker: Riot API Live Proxy for WiWU Esport
 *
 * Secrets/Environment variables needed in Cloudflare Dashboard:
 * - RIOT_API_KEY: Secret Riot Games API Key
 *
 * Optional KV binding (Settings -> Bindings -> KV Namespace):
 * - SEARCH_CACHE: caches lookups for CACHE_TTL_SECONDS so repeated searches don't
 *   re-hit the Riot API or get persisted anywhere permanent. Worker works without it.
 *
 * Query params:
 * - ?gameName=Twisted%20Falafl&tagLine=CRIT
 * OR
 * - ?puuid=...
 * - &profile=1 also includes summoner level, profile icon and top champion masteries
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'public, max-age=60' // Cache at edge for 60 seconds
};

// Looked-up accounts expire from KV on their own after this many seconds
const CACHE_TTL_SECONDS = 600; // 10 minutes
const CHAMPION_MAP_TTL_SECONDS = 86400; // 24 hours, ddragon data rarely changes

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

function calculateTotalLp(tier, rank, leaguePoints) {
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

function formatTierName(tier, rank) {
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

// Retries once after Riot's Retry-After delay if the personal key's rate limit is hit
async function fetchRiotJson(url, apiKey, allowRetry = true) {
  const res = await fetch(url, { headers: { 'X-Riot-Token': apiKey } });
  if (res.status === 429 && allowRetry) {
    const retryAfterSeconds = Number(res.headers.get('Retry-After')) || 1;
    await sleep(retryAfterSeconds * 1000);
    return fetchRiotJson(url, apiKey, false);
  }
  if (!res.ok) return { ok: false, status: res.status };
  return { ok: true, data: await res.json() };
}

// Maps numeric championId -> { name, image } via Data Dragon, cached in KV since it barely changes
async function getChampionMap(env) {
  const cacheKey = 'ddragon:champion-map:v1';
  if (env?.SEARCH_CACHE) {
    const cached = await env.SEARCH_CACHE.get(cacheKey, 'json');
    if (cached) return cached;
  }

  try {
    const versionsRes = await fetch('https://ddragon.leagueoflegends.com/api/versions.json');
    const versions = await versionsRes.json();
    const latest = versions[0];

    const champsRes = await fetch(`https://ddragon.leagueoflegends.com/cdn/${latest}/data/de_DE/champion.json`);
    const champsJson = await champsRes.json();

    const map = {};
    for (const key of Object.keys(champsJson.data)) {
      const c = champsJson.data[key];
      map[c.key] = { name: c.name, image: `https://ddragon.leagueoflegends.com/cdn/${latest}/img/champion/${c.image.full}` };
    }

    if (env?.SEARCH_CACHE) {
      await env.SEARCH_CACHE.put(cacheKey, JSON.stringify(map), { expirationTtl: CHAMPION_MAP_TTL_SECONDS });
    }
    return map;
  } catch {
    return {};
  }
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    if (request.method !== 'GET') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    }

    const apiKey = (env && env.RIOT_API_KEY) || (typeof RIOT_API_KEY !== 'undefined' ? RIOT_API_KEY : null);
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'RIOT_API_KEY is not configured on worker' }), {
        status: 500,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    }

    const url = new URL(request.url);
    const gameName = url.searchParams.get('gameName');
    const tagLine = url.searchParams.get('tagLine');
    let puuid = url.searchParams.get('puuid');
    // Extra profile info (summoner level, icon, top champion masteries) is opt-in so
    // the lightweight rank-refresh buttons keep their existing fast response shape
    const includeProfile = url.searchParams.get('profile') === '1';

    try {
      if (!puuid) {
        if (!gameName || !tagLine) {
          return new Response(JSON.stringify({ error: 'Missing puuid or gameName+tagLine query parameters' }), {
            status: 400,
            headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
          });
        }

        // Fetch Account PUUID
        const accountUrl = `https://europe.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
        const accountRes = await fetch(accountUrl, {
          headers: { 'X-Riot-Token': apiKey }
        });

        if (!accountRes.ok) {
          return new Response(JSON.stringify({ error: `Account not found (${accountRes.status})` }), {
            status: accountRes.status,
            headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
          });
        }

        const accountData = await accountRes.json();
        puuid = accountData.puuid;
      }

      // Serve from short-lived KV cache when available, so repeated lookups never
      // re-hit Riot's API or get written into the repo/build output
      const cacheKey = `search:${puuid}:${includeProfile ? 'p1' : 'p0'}`;
      if (env?.SEARCH_CACHE) {
        const cached = await env.SEARCH_CACHE.get(cacheKey, 'json');
        if (cached) {
          return new Response(JSON.stringify({ ...cached, cached: true }), {
            status: 200,
            headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
          });
        }
      }

      // Fetch League Entries
      const leagueUrl = `https://euw1.api.riotgames.com/lol/league/v4/entries/by-puuid/${puuid}`;
      const leagueRes = await fetch(leagueUrl, {
        headers: { 'X-Riot-Token': apiKey }
      });

      if (!leagueRes.ok) {
        return new Response(JSON.stringify({ error: `Failed to fetch league entries (${leagueRes.status})` }), {
          status: leagueRes.status,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
        });
      }

      const entries = await leagueRes.json();
      const soloEntry = entries.find((e) => e.queueType === 'RANKED_SOLO_5x5') || entries[0];

      let profileInfo = {};
      if (includeProfile) {
        const [summonerResult, masteryResult, championMap] = await Promise.all([
          fetchRiotJson(`https://euw1.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`, apiKey),
          fetchRiotJson(`https://euw1.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-puuid/${puuid}/top?count=3`, apiKey),
          getChampionMap(env)
        ]);

        profileInfo = {
          gameName: gameName || null,
          tagLine: tagLine || null,
          summonerLevel: summonerResult.ok ? summonerResult.data.summonerLevel : null,
          profileIconId: summonerResult.ok ? summonerResult.data.profileIconId : null,
          topMasteries: masteryResult.ok
            ? masteryResult.data.map((m) => ({
                championId: m.championId,
                championLevel: m.championLevel,
                championPoints: m.championPoints,
                name: championMap[m.championId]?.name || `Champion ${m.championId}`,
                image: championMap[m.championId]?.image || null
              }))
            : []
        };
      }

      // Skip caching entirely when nothing is bound, so the site still works without KV
      const canCache = Boolean(env?.SEARCH_CACHE);

      if (!soloEntry) {
        const unrankedResult = { unranked: true, puuid, ...profileInfo };
        if (canCache) {
          await env.SEARCH_CACHE.put(cacheKey, JSON.stringify(unrankedResult), { expirationTtl: CACHE_TTL_SECONDS });
        }
        return new Response(JSON.stringify(unrankedResult), {
          status: 200,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
        });
      }

      const tier = soloEntry.tier;
      const rank = soloEntry.rank;
      const lp = soloEntry.leaguePoints;
      const wins = soloEntry.wins;
      const losses = soloEntry.losses;
      const winrate = wins + losses > 0 ? Math.round((wins / (wins + losses)) * 100) : 0;
      const totalLp = calculateTotalLp(tier, rank, lp);

      const rankResult = {
        puuid,
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
        lastUpdated: new Date().toISOString(),
        ...profileInfo
      };

      if (env?.SEARCH_CACHE) {
        await env.SEARCH_CACHE.put(cacheKey, JSON.stringify(rankResult), { expirationTtl: CACHE_TTL_SECONDS });
      }

      return new Response(JSON.stringify(rankResult), {
        status: 200,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    }
  }
};
