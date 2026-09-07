import { profile as falafl } from './falafl.js';
import { profile as zwuck } from './zwuck.js';
import { profile as oneoverninja1 } from './1overninja1.js';
import { profile as hungerboo } from './hungerboo.js';
import { profile as atrulixx } from './atrulixx.js';
import { profile as martin } from './martin.js';
import { profile as lostmyaim } from './lostmyaim.js';
import { profile as beltrin } from './beltrin.js';
import { profile as elkant } from './elkant.js';

export const allProfiles = [
  falafl,
  zwuck,
  oneoverninja1,
  hungerboo,
  atrulixx,
  martin,
  lostmyaim,
  beltrin,
  elkant
];

export const profilesBySlug = {
  falafl,
  zwuck,
  '1overninja1': oneoverninja1,
  'fickdieduennendeggah': oneoverninja1,
  'fickdiedünnendeggah': oneoverninja1,
  hungerboo,
  atrulixx,
  martin,
  lostmyaim,
  beltrin,
  elkant
};

export function getProfile(key) {
  if (!key) return falafl;
  const normalized = String(key).trim().toLowerCase();
  return profilesBySlug[normalized] || allProfiles.find(p => p.name.toLowerCase() === normalized || p.gamertag.toLowerCase() === normalized) || falafl;
}
