import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = new URL('..', import.meta.url);

async function readJson(filePath) {
  return JSON.parse(await readFile(new URL(filePath, root), 'utf8'));
}

test('Falafl includes the secondary Riot account Juli006#EUW in player data', async () => {
  const players = await readJson('public/data/players.json');
  const falafl = players.league.find((player) => player.slug === 'falafl');

  assert.ok(falafl, 'Falafl should be present in league data');
  assert.ok(Array.isArray(falafl.alternateRiotIds), 'Falafl should expose alternate Riot IDs');
  assert.deepEqual(falafl.alternateRiotIds, [{ gameName: 'Juli006', tagLine: 'EUW' }]);
});

test('Falafl profile metadata exposes the secondary account', async () => {
  const { profile } = await import(new URL('../src/content/players/falafl.js', import.meta.url));

  assert.ok(Array.isArray(profile.alternateRiotIds));
  assert.deepEqual(profile.alternateRiotIds, [{ gameName: 'Juli006', tagLine: 'EUW' }]);
});
