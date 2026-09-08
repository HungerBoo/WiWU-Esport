// Floating hover card showing a player's profile icon, name, rank and winrate.
// Data is fetched lazily on hover (debounced) and cached per puuid for the session.

import { site } from '../content/site-data.js';
import { getDdragonVersion, profileIconUrl } from '../utils/ddragon.js';

const HOVER_DELAY_MS = 350; // avoids firing a request while the cursor just sweeps past
const playerCache = new Map();

let cardEl = null;
let hoverTimer = null;
let activePuuid = null;

function ensureCard() {
  if (!cardEl) {
    cardEl = document.createElement('div');
    cardEl.className = 'player-hovercard';
    cardEl.setAttribute('aria-hidden', 'true');
    document.body.appendChild(cardEl);
  }
  return cardEl;
}

function positionCard(target) {
  const card = ensureCard();
  const rect = target.getBoundingClientRect();
  const top = window.scrollY + rect.top - card.offsetHeight - 10;

  card.style.left = `${Math.max(8, Math.min(window.innerWidth - card.offsetWidth - 8, window.scrollX + rect.left))}px`;
  // Flip below the row when there isn't room above it
  card.style.top = `${top < window.scrollY ? window.scrollY + rect.bottom + 10 : top}px`;
}

function renderCard(name, data) {
  const rank = data && !data.unranked ? data : null;
  const iconMarkup = data?.iconUrl
    ? `<img src="${data.iconUrl}" alt="" class="player-hovercard-icon" onerror="this.style.visibility='hidden';">`
    : '<span class="player-hovercard-icon player-hovercard-icon--empty"></span>';

  if (!data) {
    return `
      <div class="player-hovercard-head">
        <span class="player-hovercard-icon player-hovercard-icon--empty"></span>
        <strong>${name}</strong>
      </div>
      <span class="player-hovercard-status">Lade Rang ...</span>
    `;
  }

  if (data.error) {
    return `
      <div class="player-hovercard-head">
        <span class="player-hovercard-icon player-hovercard-icon--empty"></span>
        <strong>${name}</strong>
      </div>
      <span class="player-hovercard-status">Rang nicht verfügbar.</span>
    `;
  }

  return `
    <div class="player-hovercard-head">
      ${iconMarkup}
      <div class="player-hovercard-identity">
        <strong>${name}</strong>
        ${data.summonerLevel != null ? `<span>Level ${data.summonerLevel}</span>` : ''}
      </div>
    </div>
    <div class="player-hovercard-rank">
      <span class="player-hovercard-tier">${rank?.tierDisplay || 'Unranked'}</span>
      <span class="player-hovercard-lp">${rank?.lpDisplay || '0 LP'}</span>
    </div>
    <span class="player-hovercard-wr">${rank?.winrate ?? 0}% Winrate · ${rank?.wins ?? 0}S / ${rank?.losses ?? 0}N</span>
  `;
}

async function loadPlayer(puuid) {
  if (playerCache.has(puuid)) return playerCache.get(puuid);
  if (!site.riotProxyUrl) return { error: true };

  try {
    const res = await fetch(`${site.riotProxyUrl.replace(/\/$/, '')}?puuid=${encodeURIComponent(puuid)}&profile=1`);
    const data = res.ok ? await res.json() : { error: true };

    if (!data.error && data.profileIconId != null) {
      data.iconUrl = profileIconUrl(await getDdragonVersion(), data.profileIconId);
    }

    playerCache.set(puuid, data);
    return data;
  } catch {
    const failed = { error: true };
    playerCache.set(puuid, failed);
    return failed;
  }
}

function hideCard() {
  clearTimeout(hoverTimer);
  activePuuid = null;
  if (cardEl) cardEl.classList.remove('is-visible');
}

function showCard(target) {
  const puuid = target.dataset.hoverPuuid;
  const name = target.dataset.hoverName || 'Unbekannt';
  if (!puuid) return;

  clearTimeout(hoverTimer);
  hoverTimer = setTimeout(async () => {
    activePuuid = puuid;
    const card = ensureCard();
    card.innerHTML = renderCard(name, playerCache.get(puuid) || null);
    card.classList.add('is-visible');
    positionCard(target);

    const data = await loadPlayer(puuid);
    if (activePuuid !== puuid) return;

    card.innerHTML = renderCard(name, data);
    positionCard(target);
  }, HOVER_DELAY_MS);
}

export function attachPlayerHoverCards(root) {
  if (!root) return;

  root.querySelectorAll('[data-hover-puuid]').forEach(target => {
    target.addEventListener('mouseenter', () => showCard(target));
    target.addEventListener('mouseleave', hideCard);
    target.addEventListener('focus', () => showCard(target));
    target.addEventListener('blur', hideCard);
  });
}
