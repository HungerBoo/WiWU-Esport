// Script to fetch recent tournaments for Smash players from start.gg
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const PLAYERS_JSON_PATH = path.join(ROOT_DIR, 'public/data/players.json');

const token = process.env.STARTGG_API_TOKEN;
if (!token) {
  console.error('STARTGG_API_TOKEN fehlt!');
  process.exit(1);
}

const playerData = JSON.parse(await fs.readFile(PLAYERS_JSON_PATH, 'utf8'));

function isUltimateEvent(event) {
  const name = (event.videogame?.name || event.name || '').toLowerCase();
  return name.includes('ultimate') || name.includes('super smash bros') || name.includes('turnier') || name.includes('singles') || name.includes('doubles');
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
          videogame { name }
          tournament { name slug isOnline }
          userEntrant(userId: $userId) {
            standing { placement }
          }
        }
      }
    }
  }
`;

for (const player of playerData.smash || []) {
  if (!player.startggPlayerId) continue;

  const pQuery = `query P($id: ID!) { player(id: $id) { user { id } } }`;
  const pRes = await fetch('https://api.start.gg/gql/alpha', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
    body: JSON.stringify({ query: pQuery, variables: { id: String(player.startggPlayerId) } })
  });
  const pData = await pRes.json();
  const userId = pData.data?.player?.user?.id;
  if (!userId) continue;

  const tRes = await fetch('https://api.start.gg/gql/alpha', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
    body: JSON.stringify({ query: RECENT_TOURNAMENTS_QUERY, variables: { userId: String(userId) } })
  });
  const tData = await tRes.json();
  const nodes = (tData.data?.user?.events?.nodes || []).filter(isUltimateEvent);

  player.recentTournaments = nodes.slice(0, 3).map(e => {
    const slug = e.tournament?.slug;
    const url = slug ? `https://www.start.gg/${slug}` : null;
    return {
      tournamentName: e.tournament?.name || 'Turnier',
      eventName: e.name || 'Singles',
      isOnline: Boolean(e.tournament?.isOnline),
      placement: e.userEntrant?.standing?.placement ?? null,
      totalEntrants: e.numEntrants ?? null,
      date: e.startAt ? new Date(e.startAt * 1000).toISOString().split('T')[0] : null,
      url,
      resultDisplay: e.userEntrant?.standing?.placement 
        ? `${e.userEntrant.standing.placement}. Platz${e.numEntrants ? ` / ${e.numEntrants}` : ''}`
        : 'Teilgenommen'
    };
  });

  console.log('✓', player.name, '->', player.recentTournaments.length, 'Turniere hinzugefügt:');
  for (const t of player.recentTournaments) {
    console.log('  •', t.tournamentName, '|', t.eventName, ':', t.resultDisplay, '| URL:', t.url);
  }
}

await fs.writeFile(PLAYERS_JSON_PATH, JSON.stringify(playerData, null, 2) + '\n');
console.log('players.json erfolgreich mit aktuellen Turnieren aktualisiert.');
