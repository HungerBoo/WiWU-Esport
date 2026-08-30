import './styles/site.css';
import { renderGame } from './pages/game.js';
import { renderHome } from './pages/home.js';
import { renderLegal } from './pages/legal.js';
import { renderPlayerPage } from './pages/player.js';

const page = window.location.pathname.split('/').pop() || 'index.html';
const searchParams = new URLSearchParams(window.location.search);

if (page === 'league-of-legends.html') {
  renderGame('league');
} else if (page === 'super-smash-bros.html') {
  renderGame('smash');
} else if (page === 'spielerprofil.html') {
  renderPlayerPage(searchParams.get('player') || 'falafl');
} else if (page === 'impressum.html') {
  renderLegal();
} else {
  renderHome();
}
