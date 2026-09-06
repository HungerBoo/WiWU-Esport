/**
 * Cloudflare Worker: Riot API Live Proxy for WiWU Esport
 *
 * Secrets/Environment variables needed in Cloudflare Dashboard:
 * - RIOT_API_KEY: Secret Riot Games API Key
 *
 * Query params:
 * - ?gameName=Twisted%20Falafl&tagLine=CRIT
 * OR
 * - ?puuid=...
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'public, max-age=60' // Cache at edge for 60 seconds
};

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

      if (!soloEntry) {
        return new Response(JSON.stringify({ unranked: true, puuid }), {
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
        lastUpdated: new Date().toISOString()
      };

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
