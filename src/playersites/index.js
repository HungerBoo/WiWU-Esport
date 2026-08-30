import { profile as falafl } from './falafl/content.js';
import { profile as zwuck } from './zwuck/content.js';
import { profile as oneoverninja1 } from './1overninja1/content.js';
import { profile as hungerboo } from './hungerboo/content.js';
import { profile as atrulixx } from './atrulixx/content.js';
import { profile as martin } from './martin/content.js';
import { profile as lostmyaim } from './lostmyaim/content.js';
import { profile as beltrin } from './beltrin/content.js';
import { profile as elkant } from './elkant/content.js';

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
