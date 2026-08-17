export function renderPlayerCard({ name, role, age, image }) {
  return `
    <article class="player-card">
      <img src="${image}" alt="${name}" loading="lazy">
      <div class="player-info">
        <h3>${name}</h3>
        <p>${role}</p>
        <small>${age}</small>
      </div>
    </article>
  `;
}

export function renderNewsCard([title, summary, date, href], index) {
  return `
    <a href="${href}" class="news-card">
      <span class="news-number">0${index + 1}</span>
      <div>
        <h3>${title}</h3>
        <p>${summary}</p>
        <time>${date}</time>
      </div>
    </a>
  `;
}
