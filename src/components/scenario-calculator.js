const OUTCOMES = [null, [2, 0], [2, 1], [1, 2], [0, 2]];
const POINTS = { '2-0': [3, 0], '2-1': [2, 1], '1-2': [1, 2], '0-2': [0, 3] };
const OUTCOME_POINTS = [[3, 0], [2, 1], [1, 2], [0, 3]];

export function renderScenarioSection() {
  return `
    <section class="scenario-section" aria-labelledby="scenario-heading">
      <div class="section-heading">
        <div>
          <p class="eyebrow">03 / GRUPPENPHASE</p>
          <h2 id="scenario-heading">Szenario-<em>Rechner.</em></h2>
        </div>
        <div class="scenario-toolbar">
          <button type="button" class="rank-refresh-btn" data-sc-fav title="Jedes offene Spiel gewinnt der Tabellenhöhere 2:0">Favoriten gewinnen</button>
          <button type="button" class="rank-refresh-btn" data-sc-random>Zufall</button>
          <button type="button" class="rank-refresh-btn" data-sc-reset>Zurücksetzen</button>
        </div>
      </div>
      <p class="scenario-sub" data-sc-sub></p>
      <div class="scenario-grid" data-sc-body>
        <p class="leaderboard-loading">Lade Gruppendaten ...</p>
      </div>
    </section>`;
}

export async function setupScenarioCalculator() {
  const root = document.querySelector('.scenario-section');
  if (!root) return;
  const body = root.querySelector('[data-sc-body]');

  let data;
  try {
    const response = await fetch('/data/group-scenarios.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    data = await response.json();
  } catch (error) {
    body.innerHTML = '<p class="leaderboard-loading">Gruppendaten konnten nicht geladen werden.</p>';
    console.error(error);
    return;
  }

  const teams = Object.fromEntries(data.teams.map((t) => [t.id, t]));
  const base = data.teams.map((t) => t.id);
  const idx = Object.fromEntries(base.map((k, i) => [k, i]));
  const n = base.length;
  const upSpots = data.promotionSpots ?? 2;
  const downFrom = n - (data.relegationSpots ?? 2) + 1;
  const highlight = data.highlight;

  const parse = (result) => {
    const m = /^(\d):(\d)$/.exec(result || '');
    return m && POINTS[`${m[1]}-${m[2]}`] ? [Number(m[1]), Number(m[2])] : null;
  };
  const played = data.matches.filter((m) => parse(m.result));
  const open = data.matches.filter((m) => !parse(m.result));
  let sel = new Array(open.length).fill(0);

  root.querySelector('[data-sc-sub]').textContent = data.subtitle || '';

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const badge = (id, sm) => `<span class="sc-badge${sm ? ' sm' : ''}" style="background:${teams[id].bg};color:${teams[id].fg}">${esc(teams[id].short.slice(0, 4))}</span>`;

  function standings() {
    const s = {};
    base.forEach((k) => { s[k] = { k, w: 0, l: 0, mw: 0, ml: 0, pts: 0, open: 0 }; });
    const apply = (h, a, x, y) => {
      const [ph, pa] = POINTS[`${x}-${y}`];
      s[h].pts += ph; s[a].pts += pa;
      s[h].mw += x; s[h].ml += y; s[a].mw += y; s[a].ml += x;
      if (x > y) { s[h].w++; s[a].l++; } else { s[a].w++; s[h].l++; }
    };
    played.forEach((m) => apply(m.home, m.away, ...parse(m.result)));
    open.forEach((m, i) => {
      if (sel[i]) apply(m.home, m.away, ...OUTCOMES[sel[i]]);
      else { s[m.home].open++; s[m.away].open++; }
    });
    const list = base.map((k) => s[k]).sort((p, q) => q.pts - p.pts || idx[p.k] - idx[q.k]);
    list.forEach((t) => {
      t.rank = 1 + list.filter((o) => o.pts > t.pts).length;
      t.last = t.rank + list.filter((o) => o.pts === t.pts).length - 1;
      t.max = t.pts + 3 * t.open;
    });
    return list;
  }

  function zoneShares(p, up, down) {
    for (let i = 0; i < n; i++) {
      let above = 0; let eq = 0;
      for (let j = 0; j < n; j++) { if (p[j] > p[i]) above++; else if (p[j] === p[i]) eq++; }
      let u = 0; let d = 0;
      for (let r = above + 1; r <= above + eq; r++) { if (r <= upSpots) u++; if (r >= downFrom) d++; }
      up[i] += u / eq; down[i] += d / eq;
    }
  }

  function probabilities() {
    const pts = new Array(n).fill(0);
    played.forEach((m) => { const [ph, pa] = POINTS[m.result.replace(':', '-')]; pts[idx[m.home]] += ph; pts[idx[m.away]] += pa; });
    const rest = [];
    open.forEach((m, i) => {
      if (sel[i]) { const [ph, pa] = POINTS[OUTCOMES[sel[i]].join('-')]; pts[idx[m.home]] += ph; pts[idx[m.away]] += pa; }
      else rest.push([idx[m.home], idx[m.away]]);
    });
    const up = new Array(n).fill(0); const down = new Array(n).fill(0);
    const exact = rest.length <= 10;
    let runs = 0;
    if (exact) {
      const p = pts.slice();
      (function rec(m) {
        if (m === rest.length) { zoneShares(p, up, down); runs++; return; }
        const [h, a] = rest[m];
        for (const [x, y] of OUTCOME_POINTS) { p[h] += x; p[a] += y; rec(m + 1); p[h] -= x; p[a] -= y; }
      }(0));
    } else {
      runs = 40000;
      const p = new Array(n);
      for (let it = 0; it < runs; it++) {
        for (let i = 0; i < n; i++) p[i] = pts[i];
        for (const [h, a] of rest) { const o = OUTCOME_POINTS[(Math.random() * 4) | 0]; p[h] += o[0]; p[a] += o[1]; }
        zoneShares(p, up, down);
      }
    }
    return { up: up.map((v) => v / runs), down: down.map((v) => v / runs), exact, open: rest.length };
  }

  const pct = (v) => {
    if (v >= 0.99995) return '100%';
    if (v <= 0.00005) return '0%';
    const p = v * 100;
    if (p < 0.1) return '<0.1%';
    if (p > 99.9) return '>99.9%';
    return `${p < 1 || p > 99 ? p.toFixed(1) : Math.round(p)}%`;
  };

  const days = (list) => [...new Set(list.map((m) => m.day))];

  function render() {
    const list = standings();
    const pr = probabilities();
    const setN = sel.filter(Boolean).length;

    const rows = list.map((t) => {
      const i = idx[t.k];
      const u = pr.up[i]; const d = pr.down[i];
      const zone = t.last <= upSpots ? ' is-up' : t.rank >= downFrom ? ' is-down' : '';
      const straddle = (t.rank <= upSpots && t.last > upSpots) || (t.rank < downFrom && t.last >= downFrom);
      let tag = t.open ? `${t.open} offen` : 'fertig';
      if (pr.exact && u >= 0.99995) tag = '<span class="sc-pill ok">Aufstieg sicher</span>';
      else if (pr.exact && d >= 0.99995) tag = '<span class="sc-pill bad">Abstieg sicher</span>';
      else if (straddle) tag = '<span class="sc-pill tie">Gleichstand</span>';
      return `<div class="sc-row${zone}${t.k === highlight ? ' is-us' : ''}">
        <span class="sc-rank">${t.rank}.</span>
        <span class="sc-team">${badge(t.k)}<span class="sc-tname"><b>${esc(teams[t.k].name)}</b><small>${tag}</small></span></span>
        <span class="sc-num">${t.w}–${t.l}</span>
        <span class="sc-num sc-hide">${t.mw}:${t.ml}</span>
        <span class="sc-pts">${t.pts}</span>
        <span class="sc-num sc-hide">${t.max}</span>
        <span class="sc-prob up"><b>${pct(u)}</b><i><u style="width:${u * 100}%"></u></i></span>
        <span class="sc-prob down"><b>${pct(d)}</b><i><u style="width:${d * 100}%"></u></i></span>
      </div>`;
    }).join('');

    const note = pr.open === 0
      ? 'Alle Spiele festgelegt – Auf-/Abstieg ist in diesem Szenario eindeutig (bei Punktgleichheit an einer Zonengrenze zählt der Platz anteilig).'
      : `Aufstieg/Abstieg: ${pr.exact ? 'exakt berechnet über alle' : 'simuliert über 40.000 zufällige'} Ausgänge der ${pr.open} noch nicht getippten Spiele (jedes Ergebnis gleich wahrscheinlich). Punktgleiche Teams teilen sich den Platz; liegt so ein Gleichstand auf einer Zonengrenze, wird anteilig gezählt.`;

    const openHtml = days(open).map((day) => {
      const ms = open.map((m, i) => [m, i]).filter(([m]) => m.day === day);
      return `<div class="sc-day"><div class="sc-day-h"><strong>Spieltag ${day}</strong><span>${ms.filter(([, i]) => sel[i]).length}/${ms.length} getippt</span></div>
        ${ms.map(([m, i]) => {
          const s = sel[i];
          return `<div class="sc-match${s ? ' is-set' : ''}">
            <span class="sc-side${s ? (s <= 2 ? ' win' : ' lose') : ''}">${badge(m.home, 1)}<b>${esc(teams[m.home].short)}</b></span>
            <span class="sc-mid"><span class="sc-seg">${[1, 2, 3, 4].map((o) => `<button type="button" data-sc-i="${i}" data-sc-o="${o}" class="${s === o ? 'on' : ''}">${OUTCOMES[o].join(':')}</button>`).join('')}</span><small>${esc(m.date || '')}</small></span>
            <span class="sc-side away${s ? (s >= 3 ? ' win' : ' lose') : ''}"><b>${esc(teams[m.away].short)}</b>${badge(m.away, 1)}</span>
          </div>`;
        }).join('')}</div>`;
    }).join('') || '<p class="leaderboard-loading">Keine offenen Spiele mehr.</p>';

    const playedHtml = days(played).map((day) => `<div class="sc-day"><div class="sc-day-h"><strong>Spieltag ${day}</strong></div>
      ${played.filter((m) => m.day === day).map((m) => {
        const [x, y] = parse(m.result);
        return `<div class="sc-match">
          <span class="sc-side${x > y ? ' win' : ' lose'}">${badge(m.home, 1)}<b>${esc(teams[m.home].short)}</b></span>
          <span class="sc-mid"><span class="sc-score">${x}:${y}</span></span>
          <span class="sc-side away${y > x ? ' win' : ' lose'}"><b>${esc(teams[m.away].short)}</b>${badge(m.away, 1)}</span>
        </div>`;
      }).join('')}</div>`).join('');

    const showPlayed = body.querySelector('[data-sc-played]')?.hidden === false;

    body.innerHTML = `
      <div class="leaderboard-card-container sc-table">
        <div class="sc-thead-bar"><strong>Tabelle</strong><span><b>${setN}</b> / ${open.length} Spiele getippt</span></div>
        <div class="sc-row sc-head"><span>#</span><span>Team</span><span>Bil.</span><span class="sc-hide">Maps</span><span>Pkt</span><span class="sc-hide">Max</span><span>Aufstieg</span><span>Abstieg</span></div>
        ${rows}
        <div class="sc-legend"><span><i class="up"></i>Platz 1–${upSpots} · Aufstieg</span><span><i class="down"></i>Platz ${downFrom}–${n} · Abstieg</span><span><i class="tie"></i>Punktgleich an Zonengrenze</span></div>
        <p class="sc-note">${note}</p>
      </div>
      <div class="leaderboard-card-container sc-matches">
        <div class="sc-thead-bar"><strong>Offene Spiele</strong><span>Bo3 · 2:0 = 3/0 · 2:1 = 2/1</span></div>
        ${openHtml}
        <button type="button" class="sc-toggle" data-sc-toggle>${showPlayed ? 'Gespielte Partien ausblenden' : 'Gespielte Partien anzeigen'}</button>
        <div data-sc-played ${showPlayed ? '' : 'hidden'}>${playedHtml}</div>
      </div>`;
  }

  body.addEventListener('click', (event) => {
    const pick = event.target.closest('button[data-sc-i]');
    if (pick) {
      const i = Number(pick.dataset.scI); const o = Number(pick.dataset.scO);
      sel[i] = sel[i] === o ? 0 : o;
      render();
      return;
    }
    if (event.target.closest('[data-sc-toggle]')) {
      const panel = body.querySelector('[data-sc-played]');
      panel.hidden = !panel.hidden;
      event.target.closest('[data-sc-toggle]').textContent = panel.hidden ? 'Gespielte Partien anzeigen' : 'Gespielte Partien ausblenden';
    }
  });

  root.querySelector('[data-sc-reset]').addEventListener('click', () => { sel.fill(0); render(); });
  root.querySelector('[data-sc-random]').addEventListener('click', () => {
    sel = sel.map((v) => v || 1 + ((Math.random() * 4) | 0));
    render();
  });
  root.querySelector('[data-sc-fav]').addEventListener('click', () => {
    open.forEach((m, i) => {
      if (sel[i]) return;
      const st = Object.fromEntries(standings().map((t) => [t.k, t]));
      const homeBetter = st[m.home].pts > st[m.away].pts || (st[m.home].pts === st[m.away].pts && idx[m.home] < idx[m.away]);
      sel[i] = homeBetter ? 1 : 4;
    });
    render();
  });

  render();
}
