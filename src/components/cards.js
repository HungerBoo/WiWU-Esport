export function renderPlayerCard({ name, role, birthDate, image }) {
  const age = calculateAge(birthDate);

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

function calculateAge(birthDate) {
  const [year, month, day] = birthDate.split('-').map(Number);
  const today = new Date();
  let age = today.getFullYear() - year;
  const birthdayHasPassed = today.getMonth() + 1 > month
    || (today.getMonth() + 1 === month && today.getDate() >= day);

  if (!birthdayHasPassed) {
    age -= 1;
  }

  return `${age} Jahre`;
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
