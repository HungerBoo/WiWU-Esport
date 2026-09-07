// Shared fixed-position feedback toast used after live Riot API refresh actions

export function showToast(message) {
  let toast = document.querySelector('.player-feedback-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'player-feedback-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('is-active');
  setTimeout(() => toast.classList.remove('is-active'), 3200);
}
