import assert from 'node:assert/strict';
import { generateNewsFeed } from '../src/content/news-generator.js';

const samplePlayerData = {
  league: [
    {
      slug: 'falafl',
      name: 'Falafl',
      rank: {
        tier: 'EMERALD',
        rank: 'III',
        tierDisplay: 'Emerald III',
        lpDisplay: '20 LP',
        totalLp: 2120,
        winrate: 64,
        wins: 37,
        losses: 21
      },
      lpHistory: [
        { date: '2026-09-10', totalLp: 1980, tier: 'PLATINUM', rank: 'I' },
        { date: '2026-09-20', totalLp: 2120, tier: 'EMERALD', rank: 'III' }
      ]
    }
  ],
  smash: [
    {
      slug: 'martin',
      name: 'Martin',
      recentTournaments: [
        {
          tournamentName: 'DOWNTOWN SMASH #9',
          eventName: 'SINGLES 1v1 - Main',
          isOnline: false,
          placement: 25,
          totalEntrants: 96,
          date: '2026-09-19',
          url: 'https://example.com/tournament/1'
        }
      ]
    }
  ]
};

const news = generateNewsFeed(samplePlayerData, {
  recentMatches: ['PTC 2:0 WIWU'],
  currentSeason: 'Spring Split 2025/26',
  url: 'https://example.com/league'
});

assert.ok(news.some((item) => item.category === 'lol' && item.title.includes('Falafl')));
assert.ok(news.some((item) => item.category === 'smash' && item.title.includes('DOWNTOWN SMASH #9')));
console.log('news-generator regression checks passed');
