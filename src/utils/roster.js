// Loads the WiWU roster's Riot PUUIDs once, so match participants can be flagged as teammates

let rosterPromise = null;

export function getWiwuPuuidMap() {
  if (!rosterPromise) {
    rosterPromise = fetch('/data/players.json')
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        const map = {};
        for (const player of data?.league || []) {
          if (player.puuid) map[player.puuid] = player.name;
        }
        return map;
      })
      .catch(() => ({}));
  }
  return rosterPromise;
}
