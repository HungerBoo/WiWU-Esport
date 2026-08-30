// Script to generate public/data/news.json from players.json and site-data.js

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateNewsFeed } from '../src/content/news-generator.js';
import { primeLeague } from '../src/content/site-data.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const PLAYERS_JSON_PATH = path.join(ROOT_DIR, 'public/data/players.json');
const NEWS_JSON_PATH = path.join(ROOT_DIR, 'public/data/news.json');

async function main() {
  const playerData = JSON.parse(await fs.readFile(PLAYERS_JSON_PATH, 'utf8'));
  const news = generateNewsFeed(playerData, primeLeague);

  await fs.writeFile(NEWS_JSON_PATH, JSON.stringify(news, null, 2) + '\n');
  console.log(`✓ public/data/news.json erfolgreich mit ${news.length} News-Einträgen generiert.`);
}

main().catch(err => {
  console.error('Fehler bei News-Generierung:', err);
  process.exit(1);
});
