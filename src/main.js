import './styles/site.css';
import { renderGame } from './pages/game.js';
import { renderHome } from './pages/home.js';
import { renderLegal } from './pages/legal.js';

const page = window.location.pathname.split('/').pop() || 'index.html';

if (page === 'league-of-legends.html') {
  renderGame('league');
} else if (page === 'super-smash-bros.html') {
  renderGame('smash');
} else if (page === 'impressum.html') {
  renderLegal();
} else {
  renderHome();
}
