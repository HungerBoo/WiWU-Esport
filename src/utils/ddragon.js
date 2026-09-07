// Shared Data Dragon (League of Legends static assets CDN) helpers
let cachedVersion = null;

export async function getDdragonVersion() {
  if (cachedVersion) return cachedVersion;

  try {
    const stored = sessionStorage.getItem('ddragon-version');
    if (stored) {
      cachedVersion = stored;
      return cachedVersion;
    }
  } catch {
    // sessionStorage unavailable (private mode etc.) - fall through to network fetch
  }

  try {
    const res = await fetch('https://ddragon.leagueoflegends.com/api/versions.json');
    const versions = await res.json();
    cachedVersion = versions[0];
    try {
      sessionStorage.setItem('ddragon-version', cachedVersion);
    } catch {
      // non-critical if it can't be persisted
    }
  } catch {
    cachedVersion = '14.24.1'; // reasonable fallback if ddragon is unreachable
  }

  return cachedVersion;
}

export function profileIconUrl(version, profileIconId) {
  return `https://ddragon.leagueoflegends.com/cdn/${version}/img/profileicon/${profileIconId}.png`;
}
