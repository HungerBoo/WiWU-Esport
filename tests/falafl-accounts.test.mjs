import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = new URL('..', import.meta.url);

async function readJson(filePath) {
  return JSON.parse(await readFile(new URL(filePath, root), 'utf8'));
}

test('Falafl profile keeps the primary OP.GG link without exposing a second account', async () => {
  const players = await readJson('public/data/players.json');
  const falafl = players.league.find((player) => player.slug === 'falafl');

  assert.ok(falafl, 'Falafl should be present in league data');
  assert.equal(falafl.alternateRiotIds, undefined);
  assert.match(falafl.opgg, /Twisted%20Falafl-CRIT/);
});

test('Falafl profile metadata keeps only its primary OP.GG link', async () => {
  const { profile } = await import(new URL('../src/content/players/falafl.js', import.meta.url));

  assert.equal(profile.alternateRiotIds, undefined);
  assert.equal(profile.links.filter((link) => link.label === 'OP.GG').length, 1);
  assert.ok(profile.links.some((link) => link.label === 'OP.GG' && link.url.includes('Twisted%20Falafl-CRIT')));
});
