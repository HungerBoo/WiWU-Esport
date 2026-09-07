import './styles/site.css';
import { renderGame } from './views/game.js';
import { renderHome } from './views/home.js';
import { renderLegal } from './views/legal.js';
import { renderPlayerPage } from './views/player.js';
import { renderPlayerSearch } from './views/search.js';

const page = window.location.pathname.split('/').pop() || 'index.html';
const searchParams = new URLSearchParams(window.location.search);

if (page === 'league-of-legends.html') {
  renderGame('league');
} else if (page === 'super-smash-bros.html') {
  renderGame('smash');
} else if (page === 'spielerprofil.html') {
  renderPlayerPage(searchParams.get('player') || 'falafl');
} else if (page === 'spielersuche.html') {
  renderPlayerSearch(searchParams.get('gameName'), searchParams.get('tagLine'));
} else if (page === 'impressum.html') {
  renderLegal();
} else {
  renderHome();
}
