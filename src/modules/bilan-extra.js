import { app } from '../state.js';
import { $, LSg, LSs, addDays, age, avail, days, dj, esc, eur, eurR, ok, pad, profit, sold, today } from './core.js';
import { bilCtx, bilOk, bilRange, group, hbars, stats } from './dashboard.js';
import { MOIS } from './gamification.js';
import { sheetHead, showSheet } from './tools-index.js';

/* ---------- Bilan : bénéfice du mois avec le stock acheté, 8 graphiques de plus, rapport mensuel ---------- */
/* Les graphiques et l'indicateur suivent les filtres du Bilan (bilOk). Le rapport mensuel regarde tout le stock et toutes les ventes. */

const sum = (L, f) => L.reduce((a, x) => a + (f(x) || 0), 0);
const ymOf = d => String(d).slice(0, 7);
const dim = m => new Date(+m.slice(0, 4), +m.slice(5, 7), 0).getDate();
const prevM = m => { const d = new Date(+m.slice(0, 4), +m.slice(5, 7) - 2, 1); return d.getFullYear() + '-' + pad(d.getMonth() + 1, 2); };
const monthsBack = n => { const o = []; for (let i = n - 1; i >= 0; i--) { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i); o.push(d.getFullYear() + '-' + pad(d.getMonth() + 1, 2)); } return o; };
const mShort = m => new Date(m + '-15T12:00:00').toLocaleDateString(app.LOC, { month: 'short' }).replace('.', '');
const mLong = m => MOIS[+m.slice(5, 7) - 1] + ' ' + m.slice(0, 4);
const soldIn = (L, m, maxDay) => L.filter(p => sold(p) && ok(p.dv) && p.dv.startsWith(m) && (!maxDay || +p.dv.slice(8, 10) <= maxDay));
const addedIn = (L, m, maxDay) => L.filter(p => ok(p.entree) && p.entree.startsWith(m) && (!maxDay || +p.entree.slice(8, 10) <= maxDay));
const pct = (a, b) => (b ? (a - b) / Math.abs(b) * 100 : null);
const sg = n => (n > 0 ? '+' : n < 0 ? '−' : '') + Math.abs(Math.round(n));
const wdName = i => new Date(2024, 0, 1 + i).toLocaleDateString(app.LOC, { weekday: 'long' });
const wdOf = d => (new Date(d + 'T12:00:00').getDay() + 6) % 7;

/* ---------- indicateur : bénéfice du mois en comptant tout le stock acheté ce mois-ci ---------- */
export function monthProfit(L, m) {
  const S = soldIn(L, m), st = stats(S), add = addedIn(L, m), cost = sum(add, x => x.achat);
  return { m, ca: st.ca, frais: st.fr, classic: st.ben, nSold: st.n, nAdded: add.length, cost, ben: st.ca - st.fr - cost, kept: add.filter(avail).length };
}
function monthCardHTML() {
  const m = today().slice(0, 7), r = monthProfit(app.P.filter(bilOk), m);
  return `<div class="card bmo"><span class="l">${t('Bénéfice de {m}, achats de stock inclus', { m: MOIS[+m.slice(5, 7) - 1] })}</span>
  <div style="display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;margin:2px 0 6px"><b class="bmov" style="font-size:30px;font-variant-numeric:tabular-nums${r.ben < 0 ? ';color:var(--red)' : ''}">${eur(r.ben)}</b><span class="hint" style="margin:0">${t('{c} encaissés − {f} de frais − {a} de stock ajouté', { c: eurR(r.ca), f: eurR(r.frais), a: eurR(r.cost) })}</span></div>
  <div style="display:flex;gap:10px;margin:0 0 6px">${[[eurR(r.ca), tn(r.nSold, 'vente', 'ventes')], ['−' + eurR(r.cost), t('stock ajouté : {n}', { n: tn(r.nAdded, 'pièce', 'pièces') })], [eurR(r.classic), t('bénéfice classique')]].map(([v, l]) => `<div style="flex:1;min-width:0"><b style="display:block;font-size:18px;font-variant-numeric:tabular-nums">${v}</b><span class="hint" style="margin:0;display:block;font-size:12px">${esc(l)}</span></div>`).join('')}</div>
  <div class="hint" style="margin:6px 0 8px">${t('Le bénéfice classique ne déduit que le prix d\'achat des pièces vendues. Ici, tout ce que tu as acheté ce mois-ci est déduit, vendu ou non.')}</div>
  <button type="button" class="btn sm mint" data-mrep="1">${t('Rapport du mois')}</button></div>`;
}

/* ---------- petits outils de dessin ---------- */
const card = (title, sub, body) => `<div class="card"><h3>${t(title)}</h3><p class="sub">${sub}</p>${body}</div>`;
const none = () => '<div class="hint">' + t('Pas encore de données.') + '</div>';
/** Courbes : series = [{ v:[nombre|null…], c: couleur, dash }], xl = étiquettes de l'axe, fmt = format des valeurs. */
function lineSVG(series, xl, fmt, label) {
  const n = Math.max(...series.map(s => s.v.length)), all = series.flatMap(s => s.v.filter(x => x != null));
  if (!all.length) return none();
  const W = 320, H = 150, L = 40, R = 10, T = 16, B = 22, lo = Math.min(0, ...all), hi0 = Math.max(...all, 1), hi = hi0 + (hi0 - lo) * 0.1;
  const X = i => L + (n > 1 ? i * (W - L - R) / (n - 1) : (W - L - R) / 2), Y = v => T + (1 - (v - lo) / ((hi - lo) || 1)) * (H - T - B);
  const grid = [lo, (lo + hi) / 2, hi].map(v => `<line x1="${L}" x2="${W - R}" y1="${Y(v).toFixed(1)}" y2="${Y(v).toFixed(1)}" style="stroke:var(--soft);stroke-width:1"/><text x="${L - 4}" y="${(Y(v) + 3).toFixed(1)}" text-anchor="end" style="fill:var(--mute);font-size:9px">${esc(fmt(v))}</text>`).join('');
  const paths = series.map(s => {
    let d = '', pen = false; s.v.forEach((v, i) => { if (v == null) { pen = false; return; } d += (pen ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(v).toFixed(1) + ' '; pen = true; });
    const last = s.v.map((v, i) => [v, i]).filter(x => x[0] != null).pop(), dots = s.dots ? s.v.map((v, i) => v == null ? '' : `<circle cx="${X(i).toFixed(1)}" cy="${Y(v).toFixed(1)}" r="3" style="fill:${s.c}"/>`).join('') : (last ? `<circle cx="${X(last[1]).toFixed(1)}" cy="${Y(last[0]).toFixed(1)}" r="3.5" style="fill:${s.c}"/>` : '');
    const tag = s.tag && last ? `<text x="${Math.min(W - R, X(last[1]) + 2).toFixed(1)}" y="${(Y(last[0]) - 7).toFixed(1)}" text-anchor="end" style="fill:${s.c};font-size:10px;font-weight:700">${esc(fmt(last[0]))}</text>` : '';
    return `<path d="${d}" style="fill:none;stroke:${s.c};stroke-width:2.2;stroke-linejoin:round;stroke-linecap:round${s.dash ? ';stroke-dasharray:5 4' : ''}"/>${dots}${tag}`;
  }).join('');
  const xs = xl.map((l, i) => l ? `<text x="${X(i).toFixed(1)}" y="${H - 6}" text-anchor="middle" style="fill:var(--mute);font-size:10px">${esc(l)}</text>` : '').join('');
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="${esc(label || '')}" style="display:block;max-width:520px">${grid}${paths}${xs}</svg>`;
}
/** Colonnes (même dessin que « Six derniers mois ») : cols = [{ a, b?, l, tag }], b = deuxième barre. */
function barsHTML(cols, legend) {
  const mx = Math.max(1, ...cols.map(c => Math.max(c.a, c.b || 0)));
  return `<div class="mo">${cols.map(c => `<div><b>${c.tag != null ? c.tag : (c.a || '')}</b><div class="pair"><i class="c" style="height:${c.a / mx * 100}%;${c.a ? '' : 'display:none'}${c.b == null ? ';width:70%' : ''}"></i>${c.b == null ? '' : `<i class="p" style="height:${c.b / mx * 100}%;${c.b ? '' : 'display:none'}"></i>`}</div>${esc(c.l)}</div>`).join('')}</div>${legend || ''}`;
}

/* ---------- Finances ---------- */
function euroCard() {
  const S = bilCtx.S, r = bilRange();
  if (!S || !S.ca) return card('D\'où vient chaque euro', bilCtx.lbl || '', none());
  const dep = sum((app.DEP || []).filter(d => ok(d.date) && (!r.from || d.date >= r.from) && (!r.to || d.date <= r.to)), d => d.montant), rest = S.ca - S.cost - S.fr - dep;
  const parts = [[t('Achat des pièces'), S.cost, 'var(--denim)'], [t('Frais de vente'), S.fr, 'var(--mute)'], [t('Dépenses'), dep, '#e8a33d'], [rest >= 0 ? t('Il te reste') : t('Perte'), Math.abs(rest), rest >= 0 ? 'var(--mint)' : 'var(--red)']].filter(p => p[1] > 0.004);
  const tot = Math.max(S.ca, parts.reduce((a, p) => a + (p[0] === t('Perte') ? 0 : p[1]), 0)) || 1;
  return card('D\'où vient chaque euro', t('Sur {c} encaissés {l}', { c: eurR(S.ca), l: bilCtx.lbl }),
    `<div style="display:flex;height:18px;border-radius:9px;overflow:hidden;background:var(--soft);margin-bottom:10px">${parts.map(p => `<i title="${esc(p[0])}" style="display:block;height:100%;width:${(p[1] / tot * 100).toFixed(2)}%;background:${p[2]}"></i>`).join('')}</div>`
    + parts.map(p => `<div style="display:flex;align-items:center;gap:8px;font-size:14px;margin:4px 0"><i style="width:10px;height:10px;border-radius:50%;background:${p[2]};flex:none"></i><span style="flex:1">${esc(p[0])}</span><b style="font-variant-numeric:tabular-nums">${eurR(p[1])}</b><span style="width:42px;text-align:right;color:var(--mute)">${Math.round(p[1] / S.ca * 100)} %</span></div>`).join(''));
}
function marginCard() {
  const L = app.P.filter(bilOk), ms = monthsBack(6).map(m => { const S = stats(soldIn(L, m)); return { m, v: S.n ? Math.round(S.marge * 100) : null, n: S.n }; });
  const sub = t('Part du chiffre d\'affaires qui reste en bénéfice, par mois de vente');
  if (!ms.some(x => x.v != null)) return card('Marge par mois', sub, none());
  return card('Marge par mois', sub, lineSVG([{ v: ms.map(x => x.v), c: 'var(--ink)', dots: true, tag: false }], ms.map(x => mShort(x.m)), v => Math.round(v) + ' %', t('Marge par mois')) + `<div class="hint" style="margin-top:6px">${ms.filter(x => x.v != null).map(x => mShort(x.m) + ' ' + x.v + ' %').join(' · ')}</div>`);
}
function cumulCard() {
  const L = app.P.filter(bilOk), m = today().slice(0, 7), pm = prevM(m), nd = dim(m), dn = +today().slice(8, 10);
  const daily = mm => { const a = new Array(dim(mm) + 1).fill(0); soldIn(L, mm).forEach(p => { a[+p.dv.slice(8, 10)] += profit(p); }); return a; };
  const cur = daily(m), old = daily(pm), cumu = (a, upto) => { let c = 0; const o = []; for (let d = 1; d <= upto; d++) { c += a[d] || 0; o.push(c); } return o; };
  const A = cumu(cur, dn), B = cumu(old, dim(pm)), so = A[A.length - 1] || 0, proj = dn ? so / dn * nd : 0;
  if (!so && !B.some(Boolean)) return card('Bénéfice cumulé du mois', MOIS[+m.slice(5, 7) - 1], none());
  const nn = Math.max(nd, B.length), pad0 = a => a.concat(new Array(Math.max(0, nn - a.length)).fill(null));
  const projS = new Array(nn).fill(null); for (let i = dn - 1; i <= nd - 1; i++) projS[i] = nd > dn ? so + (proj - so) * (i - (dn - 1)) / (nd - dn) : so;
  const xl = Array.from({ length: nn }, (_, i) => ([0, 6, 13, 20, 27].includes(i) ? String(i + 1) : ''));
  return card('Bénéfice cumulé du mois', t('{m} face à {p}, bénéfice sur les pièces vendues', { m: MOIS[+m.slice(5, 7) - 1], p: MOIS[+pm.slice(5, 7) - 1] }),
    lineSVG([{ v: pad0(B), c: 'var(--mute)' }, { v: projS, c: 'var(--mint)', dash: true }, { v: pad0(A), c: 'var(--ink)', tag: true }], xl, v => eurR(v), t('Bénéfice cumulé du mois'))
    + `<div class="lgd"><span style="color:var(--ink)">${t('Ce mois-ci')}</span><span style="color:var(--mute)">${t('Mois dernier')}</span><span style="color:var(--mint)">${t('Projection')}</span></div><div class="hint" style="margin-top:6px">${t('À ce rythme, tu finis le mois autour de {v}.', { v: eurR(proj) })}</div>`);
}

/* ---------- Activité ---------- */
function weekdayCard() {
  const S = bilCtx.inP || [], lbl = bilCtx.lbl || '';
  if (!S.length) return card('Ventes par jour de semaine', lbl, none());
  const rows = Array.from({ length: 7 }, (_, i) => ({ k: wdName(i), v: 0, ca: 0 }));
  S.filter(p => ok(p.dv)).forEach(p => { const r = rows[wdOf(p.dv)]; r.v++; r.ca += p.pv || 0; });
  const best = rows.reduce((a, r) => (r.v > a.v ? r : a), rows[0]);
  return card('Ventes par jour de semaine', t('Nombre de ventes {l}', { l: lbl }), hbars(rows.map(r => ({ k: r.k, v: r.v, sub: r.v ? eurR(r.ca) : '' })), v => String(v)) + `<div class="hint">${t('Jour le plus fort : {d}', { d: best.k })}</div>`);
}
function weeklyCard() {
  const L = app.P.filter(bilOk), wd = (new Date().getDay() + 6) % 7, mon = addDays(today(), -wd), cols = [];
  for (let i = 11; i >= 0; i--) { const a = addDays(mon, -7 * i), b = addDays(a, 6); cols.push({ a: L.filter(p => sold(p) && ok(p.dv) && p.dv >= a && p.dv <= b).length, l: i % 2 ? '' : (+a.slice(8, 10)) + '/' + (+a.slice(5, 7)) }); }
  const sub = t('Ventes par semaine, sur les 12 dernières semaines');
  if (!cols.some(c => c.a)) return card('Ventes semaine par semaine', sub, none());
  const tot = sum(cols, c => c.a), avg = tot / 12;
  return card('Ventes semaine par semaine', sub, barsHTML(cols) + `<div class="hint">${t('{a} ventes en moyenne par semaine', { a: (Math.round(avg * 10) / 10).toString().replace('.', app.DS || ',') })}</div>`);
}

/* ---------- Stock ---------- */
function ageCard() {
  const A = app.P.filter(p => avail(p) && bilOk(p)), sub = t('Depuis l\'entrée en stock');
  if (!A.length) return card('Ancienneté du stock', sub, none());
  const B = [[0, 14, 'Moins de 15 jours'], [15, 29, '15 à 29 jours'], [30, 59, '30 à 59 jours'], [60, 1e9, '60 jours et plus']];
  return card('Ancienneté du stock', sub, hbars(B.map(([a, b, l]) => { const g = A.filter(p => age(p) >= a && age(p) <= b); return { k: t(l), v: g.length, sub: g.length ? t('{c} immobilisés', { c: eurR(sum(g, x => x.achat)) }) : '' }; }), v => String(v)));
}
function valueCard() {
  const A = app.P.filter(p => avail(p) && bilOk(p)), sub = t('Prix d\'achat des pièces en stock');
  if (!A.length) return card('Valeur du stock par catégorie', sub, none());
  const g = {}; A.forEach(p => { const k = p.cat || 'Non renseigné'; g[k] = (g[k] || 0) + (p.achat || 0); });
  return card('Valeur du stock par catégorie', sub, hbars(Object.entries(g).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => ({ k, v })), eurR, true));
}
function flowCard() {
  const L = app.P.filter(bilOk), ms = monthsBack(6), sub = t('Pièces ajoutées et pièces vendues, par mois');
  const cols = ms.map(m => ({ a: addedIn(L, m).length, b: soldIn(L, m).length, l: mShort(m) }));
  if (!cols.some(c => c.a || c.b)) return card('Entrées et sorties par mois', sub, none());
  const ad = sum(cols, c => c.a), so = sum(cols, c => c.b);
  return card('Entrées et sorties par mois', sub, barsHTML(cols.map(c => Object.assign(c, { tag: c.a || c.b ? c.a + ' · ' + c.b : '' })), `<div class="lgd"><span>${t('Ajoutées')}</span><span class="p">${t('Vendues')}</span></div>`) + `<div class="hint">${ad > so ? t('Ton stock grossit : {a} pièces ajoutées pour {b} vendues.', { a: ad, b: so }) : t('Ton stock diminue : {a} pièces ajoutées pour {b} vendues.', { a: ad, b: so })}</div>`);
}
app.bilanChartsHTML = () => [euroCard, marginCard, cumulCard, weekdayCard, weeklyCard, ageCard, valueCard, flowCard].map(f => { try { return f(); } catch (e) { return ''; } }).join('');
app.bilanMonthHTML = monthCardHTML;

/* ---------- rapport mensuel : indicateurs, points forts, points à améliorer, perspectives ---------- */
export function analyse(m) {
  const L = app.P, cur = m === today().slice(0, 7), nd = dim(m), dn = cur ? +today().slice(8, 10) : nd, pm = prevM(m), pm2 = prevM(pm);
  const S = soldIn(L, m), P = soldIn(L, pm, cur ? dn : 0), s = stats(S), p = stats(P);
  const dep = sum((app.DEP || []).filter(d => ok(d.date) && d.date.startsWith(m)), d => d.montant), depP = sum((app.DEP || []).filter(d => ok(d.date) && d.date.startsWith(pm) && (!cur || +d.date.slice(8, 10) <= dn)), d => d.montant);
  const mp = monthProfit(L, m), mpP = monthProfit(L, pm);
  const R = []; L.forEach(x => (x.retours || []).forEach(r => { if (ok(r.d) && r.d.startsWith(m)) R.push(r); }));
  const stock = L.filter(avail), now = today(), old = stock.filter(x => ok(x.pub) && days(x.pub, now) >= 30), unpub = stock.filter(x => !ok(x.pub));
  const cats = group(S, 'cat').sort((a, b) => b.ben - a.ben), plats = group(S, 'canal').sort((a, b) => b.ben - a.ben);
  const wd = new Array(7).fill(0); S.forEach(x => { wd[wdOf(x.dv)]++; });
  const bestWd = wd.indexOf(Math.max(...wd)), tri = [m, pm, pm2].map(mm => stats(soldIn(L, mm)).ca);
  const six = monthsBack(6).map(mm => stats(soldIn(L, mm)).ca);
  const k = { ca: pct(s.ca, p.ca), ben: pct(s.ben, p.ben), n: pct(s.n, p.n), panier: pct(s.panier, p.panier), delai: p.delai ? pct(s.delai, p.delai) : null, marge: p.n && s.n ? s.marge * 100 - p.marge * 100 : null };
  const proj = cur && dn ? { ca: s.ca / dn * nd, n: s.n / dn * nd } : null;
  const rate = proj ? proj.n : s.n;
  const forts = [], ameliorer = [], persp = [];
  if (s.n && k.ca != null && k.ca >= 10) forts.push(t('Chiffre d\'affaires en hausse de {p} % : {a} contre {b}.', { p: Math.round(k.ca), a: eurR(s.ca), b: eurR(p.ca) }));
  if (s.n >= 3 && s.ca >= Math.max(...six) && s.ca > 0 && six.filter(x => x > 0).length >= 3) forts.push(t('C\'est ton meilleur mois de chiffre d\'affaires sur les 6 derniers mois.'));
  if (s.n && (s.marge >= 0.5 || (k.marge != null && k.marge >= 3))) forts.push(t('Marge de {m} % sur le chiffre d\'affaires{x}.', { m: Math.round(s.marge * 100), x: k.marge != null && k.marge >= 3 ? ' (' + t('{n} points de plus', { n: Math.round(k.marge) }) + ')' : '' }));
  if (cats[0] && cats[0].ben > 0 && S.length >= 3) forts.push(t('{c} est ta catégorie la plus rentable : {b} de bénéfice sur {n}.', { c: tv(cats[0].k), b: eurR(cats[0].ben), n: tn(cats[0].n, 'vente', 'ventes') }));
  if (s.n && k.delai != null && k.delai <= -15) forts.push(t('Tes pièces partent plus vite : {a} en moyenne contre {b} le mois précédent.', { a: dj(s.delai), b: dj(p.delai) }));
  if (s.n && k.panier != null && k.panier >= 10) forts.push(t('Panier moyen en hausse de {p} % ({a}).', { p: Math.round(k.panier), a: eurR(s.panier) }));
  if (mp.nSold >= 3 && mp.ben > 0 && mp.cost > 0) forts.push(t('Même en comptant les {a} de stock ajouté, le mois reste bénéficiaire : {b}.', { a: eurR(mp.cost), b: eurR(mp.ben) }));
  if (s.n >= 5 && R.length / s.n < 0.05) forts.push(t('Très peu de retours ce mois-ci ({n}).', { n: R.length }));
  if (!stock.length) forts.push(t('Tout le stock est vendu.'));
  if (s.n && k.ca != null && k.ca <= -10) ameliorer.push(t('Chiffre d\'affaires en baisse de {p} % : {a} contre {b}.', { p: Math.round(-k.ca), a: eurR(s.ca), b: eurR(p.ca) }));
  if (s.n && (s.marge < 0.3 || (k.marge != null && k.marge <= -3))) ameliorer.push(t('Marge de {m} % seulement{x} : vérifie tes prix d\'achat et tes frais.', { m: Math.round(s.marge * 100), x: k.marge != null && k.marge <= -3 ? ' (' + t('{n} points de moins', { n: Math.round(-k.marge) }) + ')' : '' }));
  const lose = cats.filter(c => c.ben < 0).pop(); if (lose && S.length >= 2) ameliorer.push(t('{c} te fait perdre de l\'argent ce mois-ci : {b}.', { c: tv(lose.k), b: eurR(lose.ben) }));
  if (old.length) ameliorer.push(t('{n} en ligne depuis 30 jours ou plus ({v} immobilisés) : baisse le prix ou relance-les.', { n: tn(old.length, 'pièce', 'pièces'), v: eurR(sum(old, x => x.achat)) }));
  if (unpub.length) ameliorer.push(t('{n} pas encore publiées : une pièce non publiée ne se vend pas.', { n: tn(unpub.length, 'pièce', 'pièces') }));
  if (mp.cost > mp.ca && mp.cost > 0) ameliorer.push(t('Tu as ajouté plus de stock ({a}) que tu n\'as encaissé de ventes ({b}) : ton stock grossit plus vite qu\'il ne se vend.', { a: eurR(mp.cost), b: eurR(mp.ca) }));
  if (s.n && k.delai != null && k.delai >= 25) ameliorer.push(t('Tes pièces mettent plus de temps à partir : {a} contre {b} le mois précédent.', { a: dj(s.delai), b: dj(p.delai) }));
  if (s.n >= 3 && R.length / s.n >= 0.1) ameliorer.push(t('{n} retours pour {v} ventes : précise les tailles et les défauts dans tes annonces.', { n: R.length, v: s.n }));
  if (s.ben > 0 && dep > s.ben * 0.3) ameliorer.push(t('Les dépenses hors pièces ({a}) pèsent {p} % de ton bénéfice.', { a: eurR(dep), p: Math.round(dep / s.ben * 100) }));
  if (!s.n) ameliorer.push(t('Aucune vente enregistrée ce mois-ci : publie régulièrement pour relancer l\'activité.'));
  if (proj && s.n) persp.push(t('À ce rythme, tu finis le mois autour de {a} de chiffre d\'affaires ({n}).', { a: eurR(proj.ca), n: tn(Math.round(proj.n), 'vente', 'ventes') }));
  if (!cur && tri.some(x => x > 0)) { const mn = Math.min(...tri), mx = Math.max(...tri), avg = sum(tri, x => x) / 3, tg = Math.round(avg * 1.1 / 10) * 10; persp.push(t('Sur les 3 derniers mois, ton chiffre d\'affaires va de {a} à {b} : vise {c} le mois prochain.', { a: eurR(mn), b: eurR(mx), c: eurR(tg) })); }
  if (rate > 0 && stock.length) { const mo = stock.length / rate; persp.push(t('À ce rythme ({r} par mois), ton stock de {n} s\'écoule en environ {k} mois.', { r: tn(Math.round(rate), 'vente', 'ventes'), n: tn(stock.length, 'pièce', 'pièces'), k: Math.max(1, Math.round(mo)) })); }
  if (cats[0] && cats[0].ben > 0 && S.length >= 3) persp.push(t('Mise sur {c} : c\'est ce qui rapporte le plus. Publie-en davantage.', { c: tv(cats[0].k) }));
  if (plats.length > 1 && plats[0].ben > 0) persp.push(t('{p} est ta plateforme la plus rentable ce mois-ci.', { p: tv(plats[0].k) }));
  if (S.length >= 5 && wd[bestWd] >= 2) persp.push(t('Tes meilleurs jours de vente sont le {d} : publie la veille.', { d: wdName(bestWd) }));
  if (old.length) persp.push(t('En relançant les pièces qui stagnent, tu peux libérer environ {v} d\'argent immobilisé.', { v: eurR(sum(old, x => x.achat)) }));
  if (!persp.length) persp.push(t('Ajoute des pièces et enregistre tes ventes : les perspectives se calculent à partir de ton historique.'));
  const kpi = [
    [t('Chiffre d\'affaires'), eur(s.ca), k.ca, 'pct'], [t('Bénéfice sur les pièces'), eur(s.ben), k.ben, 'pct'], [t('Bénéfice avec le stock ajouté'), eur(mp.ben), pct(mp.ben, mpP.ben), 'pct'],
    [t('Marge'), s.ca ? Math.round(s.marge * 100) + ' %' : '—', k.marge, 'pt'], [t('Ventes'), String(s.n), k.n, 'pct'], [t('Panier moyen'), eur(s.panier), k.panier, 'pct'], [t('Délai avant la vente'), s.n ? dj(s.delai) : '—', k.delai, 'pct'],
    [t('Stock ajouté'), tn(mp.nAdded, 'pièce', 'pièces') + ' · ' + eur(mp.cost), null], [t('Dépenses hors pièces'), eur(dep), pct(dep, depP), 'pct'], [t('Retours'), String(R.length), null],
    [t('Stock actuel'), tn(stock.length, 'pièce', 'pièces') + ' · ' + eur(sum(stock, x => x.achat)), null]];
  return { m, cur, pm, s, p, dep, mp, R, stock, old, unpub, cats, plats, k, proj, forts: forts.slice(0, 5), ameliorer: ameliorer.slice(0, 5), persp: persp.slice(0, 5), kpi };
}
const mark = '<svg viewBox="0 0 104 104" width="34" height="34"><rect width="104" height="104" rx="22" fill="#111"/><rect x="12" y="68" width="80" height="18" rx="3" fill="#F1F2F4"/><rect x="18" y="46" width="68" height="18" rx="3" fill="#C9CBD0"/><rect x="32" y="14" width="58" height="18" rx="3" fill="#FF4A1C" transform="rotate(-12 62 24)"/></svg>';
const dTxt = (v, kind, good) => (v == null || !isFinite(v) || !Math.round(v) ? '' : ` <small style="color:${(v > 0) === good ? 'var(--mint)' : 'var(--red)'}">${Math.abs(v) > 500 && kind !== 'pt' ? (v > 0 ? '> +500' : '< −500') : sg(v)}${kind === 'pt' ? ' pt' : ' %'}</small>`);
export function monthReportHTML(m) {
  const a = analyse(m), lst = (L, mk, col) => `<ul style="list-style:none;margin:0 0 6px;padding:0">${L.map(x => `<li style="display:flex;gap:8px;margin:0 0 7px;line-height:1.4"><b style="color:${col};flex:none">${mk}</b><span>${esc(x)}</span></li>`).join('')}</ul>`;
  const badUp = new Set([t('Délai avant la vente'), t('Dépenses hors pièces')]);
  return `<div class="rp"><div class="rph">${mark}<div><b>syno</b><span>${t('Rapport du mois')}</span></div><div class="rpm"><b>${esc(mLong(m))}</b><span>${a.cur ? t('en cours, au {d}', { d: today().slice(8, 10) + '/' + today().slice(5, 7) }) : t('face à {m}', { m: MOIS[+a.pm.slice(5, 7) - 1] })}</span></div></div>
  <h4>${t('Indicateurs clés')}</h4><table class="rt">${a.kpi.map(r => `<tr><td>${esc(r[0])}</td><td>${esc(r[1])}${r[3] ? dTxt(r[2], r[3], !badUp.has(r[0])) : ''}</td></tr>`).join('')}</table>
  ${a.cur ? `<div class="hint" style="margin:-4px 0 8px">${t('Évolutions comparées au même nombre de jours du mois précédent.')}</div>` : ''}
  <h4>${t('Points forts')}</h4>${a.forts.length ? lst(a.forts, '✓', 'var(--mint)') : `<p>${t('Pas encore de point fort net ce mois-ci : continue à publier et à vendre.')}</p>`}
  <h4>${t('Points à améliorer')}</h4>${a.ameliorer.length ? lst(a.ameliorer, '!', 'var(--red)') : `<p>${t('Rien d\'alarmant ce mois-ci.')}</p>`}
  <h4>${t('Perspectives d\'évolution')}</h4>${lst(a.persp, '→', 'var(--ink)')}
  <p class="rpf">${t('Analyse automatique à partir des données saisies dans Syno : elle donne des repères, pas un conseil comptable.')}</p></div>`;
}
export function openMonthReport(m0) {
  const months = monthsBack(7).reverse(); let m = m0 && months.includes(m0) ? m0 : (LSg('mrM', '') || months[0]); if (!months.includes(m)) m = months[0];
  const draw = () => {
    showSheet(sheetHead(t('Rapport du mois')) + `<div class="chips" style="margin-bottom:12px">${months.map(x => `<button type="button" class="chip sm${x === m ? ' on' : ''}" data-mm="${x}">${mShort(x)} ${x.slice(0, 4)}</button>`).join('')}</div><div class="acts" style="margin:0 0 12px"><button type="button" class="btn mint" id="mr_pdf">${t('Enregistrer en PDF')}</button></div><div class="rpv">${monthReportHTML(m)}</div>`);
    $('shc').onclick = e => { const b = e.target.closest('[data-mm]'); if (b) { m = b.dataset.mm; LSs('mrM', m); return draw(); } if (e.target.closest('#mr_pdf') && app.printHTML) app.printHTML(monthReportHTML(m)); };
  };
  draw();
}
app.openMonthReport = openMonthReport;
$('dsh').addEventListener('click', e => { if (e.target.closest('[data-mrep]')) openMonthReport(today().slice(0, 7)); });

/* ---------- traductions (K : français, English, Italiano, Español, Deutsch), ici pour que ce module reste autonome ---------- */
if (typeof window !== 'undefined' && window.K) {
  const K = window.K;
  K("{a} ventes en moyenne par semaine", "{a} sales per week on average", "{a} vendite a settimana in media", "{a} ventas por semana de media", "{a} Verkäufe pro Woche im Schnitt");
  K("{c} encaissés − {f} de frais − {a} de stock ajouté", "{c} collected − {f} fees − {a} of stock added", "{c} incassati − {f} di commissioni − {a} di stock aggiunto", "{c} cobrados − {f} de gastos − {a} de stock añadido", "{c} eingenommen − {f} Gebühren − {a} neuer Bestand");
  K("{c} est ta catégorie la plus rentable : {b} de bénéfice sur {n}.", "{c} is your most profitable category: {b} profit on {n}.", "{c} è la tua categoria più redditizia: {b} di utile su {n}.", "{c} es tu categoría más rentable: {b} de beneficio en {n}.", "{c} ist deine profitabelste Kategorie: {b} Gewinn bei {n}.");
  K("{c} immobilisés", "{c} tied up", "{c} immobilizzati", "{c} inmovilizados", "{c} gebunden");
  K("{c} te fait perdre de l'argent ce mois-ci : {b}.", "{c} is losing you money this month: {b}.", "{c} ti fa perdere soldi questo mese: {b}.", "{c} te hace perder dinero este mes: {b}.", "{c} kostet dich diesen Monat Geld: {b}.");
  K("{m} face à {p}, bénéfice sur les pièces vendues", "{m} versus {p}, profit on items sold", "{m} rispetto a {p}, utile sui capi venduti", "{m} frente a {p}, beneficio de las prendas vendidas", "{m} gegenüber {p}, Gewinn auf verkaufte Teile");
  K("{n} en ligne depuis 30 jours ou plus ({v} immobilisés) : baisse le prix ou relance-les.", "{n} online for 30 days or more ({v} tied up): lower the price or bump them.", "{n} online da 30 giorni o più ({v} immobilizzati): abbassa il prezzo o rilancia.", "{n} en línea desde hace 30 días o más ({v} inmovilizados): baja el precio o reactívalas.", "{n} seit 30 Tagen oder länger online ({v} gebunden): senke den Preis oder bring sie neu hoch.");
  K("{n} pas encore publiées : une pièce non publiée ne se vend pas.", "{n} not published yet: an unpublished item cannot sell.", "{n} non ancora pubblicati: un capo non pubblicato non si vende.", "{n} sin publicar: una prenda sin publicar no se vende.", "{n} noch nicht veröffentlicht: ein nicht veröffentlichtes Teil verkauft sich nicht.");
  K("{n} points de moins", "{n} points lower", "{n} punti in meno", "{n} puntos menos", "{n} Punkte weniger");
  K("{n} points de plus", "{n} points higher", "{n} punti in più", "{n} puntos más", "{n} Punkte mehr");
  K("{n} retours pour {v} ventes : précise les tailles et les défauts dans tes annonces.", "{n} returns for {v} sales: be more precise about sizes and flaws in your listings.", "{n} resi su {v} vendite: sii più preciso su taglie e difetti negli annunci.", "{n} devoluciones en {v} ventas: precisa las tallas y los defectos en tus anuncios.", "{n} Rücksendungen bei {v} Verkäufen: gib Größen und Mängel in deinen Anzeigen genauer an.");
  K("{p} est ta plateforme la plus rentable ce mois-ci.", "{p} is your most profitable platform this month.", "{p} è la tua piattaforma più redditizia questo mese.", "{p} es tu plataforma más rentable este mes.", "{p} ist diesen Monat deine profitabelste Plattform.");
  K("15 à 29 jours", "15 to 29 days", "Da 15 a 29 giorni", "15 a 29 días", "15 bis 29 Tage");
  K("30 à 59 jours", "30 to 59 days", "Da 30 a 59 giorni", "30 a 59 días", "30 bis 59 Tage");
  K("60 jours et plus", "60 days or more", "60 giorni e oltre", "60 días o más", "60 Tage und mehr");
  K("À ce rythme ({r} par mois), ton stock de {n} s'écoule en environ {k} mois.", "At this pace ({r} per month), your stock of {n} will sell out in about {k} months.", "A questo ritmo ({r} al mese), il tuo stock di {n} si esaurisce in circa {k} mesi.", "A este ritmo ({r} al mes), tu stock de {n} se agota en unos {k} meses.", "In diesem Tempo ({r} pro Monat) ist dein Bestand von {n} in etwa {k} Monaten verkauft.");
  K("À ce rythme, tu finis le mois autour de {a} de chiffre d'affaires ({n}).", "At this pace, you will end the month around {a} in revenue ({n}).", "A questo ritmo chiudi il mese intorno a {a} di fatturato ({n}).", "A este ritmo terminas el mes en torno a {a} de facturación ({n}).", "In diesem Tempo endest du den Monat bei etwa {a} Umsatz ({n}).");
  K("À ce rythme, tu finis le mois autour de {v}.", "At this pace, you will end the month around {v}.", "A questo ritmo chiudi il mese intorno a {v}.", "A este ritmo terminas el mes en torno a {v}.", "In diesem Tempo endest du den Monat bei etwa {v}.");
  K("Achat des pièces", "Cost of items", "Acquisto dei capi", "Compra de las prendas", "Einkauf der Teile");
  K("Ajoute des pièces et enregistre tes ventes : les perspectives se calculent à partir de ton historique.", "Add items and record your sales: outlooks are calculated from your history.", "Aggiungi capi e registra le vendite: le prospettive si calcolano dal tuo storico.", "Añade prendas y registra tus ventas: las perspectivas se calculan con tu historial.", "Füge Teile hinzu und erfasse deine Verkäufe: Die Aussichten werden aus deinem Verlauf berechnet.");
  K("Ajoutées", "Added", "Aggiunti", "Añadidas", "Hinzugefügt");
  K("Analyse automatique à partir des données saisies dans Syno : elle donne des repères, pas un conseil comptable.", "Automatic analysis based on the data entered in Syno: it gives benchmarks, not accounting advice.", "Analisi automatica basata sui dati inseriti in Syno: fornisce indicazioni, non una consulenza contabile.", "Análisis automático a partir de los datos introducidos en Syno: da referencias, no es un consejo contable.", "Automatische Analyse auf Basis der in Syno erfassten Daten: Sie liefert Orientierungswerte, keine Buchhaltungsberatung.");
  K("Ancienneté du stock", "Stock age", "Anzianità dello stock", "Antigüedad del stock", "Alter des Bestands");
  K("Aucune vente enregistrée ce mois-ci : publie régulièrement pour relancer l'activité.", "No sales recorded this month: publish regularly to restart activity.", "Nessuna vendita registrata questo mese: pubblica con regolarità per rilanciare l'attività.", "Ninguna venta registrada este mes: publica con regularidad para reactivar la actividad.", "Diesen Monat wurde kein Verkauf erfasst: Veröffentliche regelmäßig, um die Aktivität wieder anzukurbeln.");
  K("Bénéfice avec le stock ajouté", "Profit including added stock", "Utile con lo stock aggiunto", "Beneficio con el stock añadido", "Gewinn inkl. neuem Bestand");
  K("bénéfice classique", "classic profit", "utile classico", "beneficio clásico", "klassischer Gewinn");
  K("Bénéfice cumulé du mois", "Cumulative profit this month", "Utile cumulato del mese", "Beneficio acumulado del mes", "Kumulierter Gewinn des Monats");
  K("Bénéfice de {m}, achats de stock inclus", "{m} profit, stock purchases included", "Utile di {m}, acquisti di stock inclusi", "Beneficio de {m}, compras de stock incluidas", "Gewinn {m}, inkl. Bestandskäufe");
  K("C'est ton meilleur mois de chiffre d'affaires sur les 6 derniers mois.", "This is your best revenue month of the last 6 months.", "È il tuo mese migliore per fatturato degli ultimi 6 mesi.", "Es tu mejor mes de facturación de los últimos 6 meses.", "Das ist dein umsatzstärkster Monat der letzten 6 Monate.");
  K("Chiffre d'affaires en baisse de {p} % : {a} contre {b}.", "Revenue down {p} %: {a} versus {b}.", "Fatturato in calo del {p} %: {a} contro {b}.", "Facturación en baja un {p} %: {a} frente a {b}.", "Umsatz um {p} % gesunken: {a} gegenüber {b}.");
  K("Chiffre d'affaires en hausse de {p} % : {a} contre {b}.", "Revenue up {p} %: {a} versus {b}.", "Fatturato in crescita del {p} %: {a} contro {b}.", "Facturación al alza un {p} %: {a} frente a {b}.", "Umsatz um {p} % gestiegen: {a} gegenüber {b}.");
  K("D'où vient chaque euro", "Where every euro comes from", "Da dove viene ogni euro", "De dónde viene cada euro", "Woher jeder Euro kommt");
  K("Délai avant la vente", "Time to sell", "Tempo alla vendita", "Plazo hasta la venta", "Zeit bis zum Verkauf");
  K("Depuis l'entrée en stock", "Since entering stock", "Dall'ingresso in stock", "Desde la entrada en stock", "Seit dem Eingang im Bestand");
  K("en cours, au {d}", "in progress, as of {d}", "in corso, al {d}", "en curso, a día {d}", "laufend, Stand {d}");
  K("En relançant les pièces qui stagnent, tu peux libérer environ {v} d'argent immobilisé.", "By bumping the items that stagnate, you could free up about {v} of tied-up money.", "Rilanciando i capi fermi puoi liberare circa {v} di denaro immobilizzato.", "Reactivando las prendas estancadas puedes liberar unos {v} de dinero inmovilizado.", "Wenn du die Ladenhüter neu hochbringst, kannst du etwa {v} gebundenes Geld freisetzen.");
  K("Entrées et sorties par mois", "Stock in and out by month", "Entrate e uscite per mese", "Entradas y salidas por mes", "Zu- und Abgänge pro Monat");
  K("Évolutions comparées au même nombre de jours du mois précédent.", "Changes are compared with the same number of days of the previous month.", "Variazioni confrontate con lo stesso numero di giorni del mese precedente.", "Evoluciones comparadas con el mismo número de días del mes anterior.", "Veränderungen im Vergleich zur gleichen Anzahl Tage des Vormonats.");
  K("face à {m}", "versus {m}", "rispetto a {m}", "frente a {m}", "gegenüber {m}");
  K("Il te reste", "What's left", "Ti resta", "Te queda", "Das bleibt dir");
  K("Indicateurs clés", "Key indicators", "Indicatori chiave", "Indicadores clave", "Kennzahlen");
  K("Jour le plus fort : {d}", "Strongest day: {d}", "Giorno più forte: {d}", "Día más fuerte: {d}", "Stärkster Tag: {d}");
  K("Le bénéfice classique ne déduit que le prix d'achat des pièces vendues. Ici, tout ce que tu as acheté ce mois-ci est déduit, vendu ou non.", "The classic profit only deducts the purchase price of the items sold. Here, everything you bought this month is deducted, sold or not.", "L'utile classico deduce solo il prezzo d'acquisto dei capi venduti. Qui si deduce tutto ciò che hai comprato questo mese, venduto o no.", "El beneficio clásico solo descuenta el precio de compra de las prendas vendidas. Aquí se descuenta todo lo que has comprado este mes, vendido o no.", "Der klassische Gewinn zieht nur den Einkaufspreis der verkauften Teile ab. Hier wird alles abgezogen, was du diesen Monat gekauft hast, ob verkauft oder nicht.");
  K("Les dépenses hors pièces ({a}) pèsent {p} % de ton bénéfice.", "Expenses outside items ({a}) weigh {p} % of your profit.", "Le spese fuori dai capi ({a}) pesano il {p} % del tuo utile.", "Los gastos ajenos a las prendas ({a}) pesan un {p} % de tu beneficio.", "Die Ausgaben außerhalb der Teile ({a}) machen {p} % deines Gewinns aus.");
  K("Marge", "Margin", "Margine", "Margen", "Marge");
  K("Marge de {m} % seulement{x} : vérifie tes prix d'achat et tes frais.", "Margin of only {m} %{x}: check your purchase prices and fees.", "Margine di solo {m} %{x}: controlla prezzi d'acquisto e commissioni.", "Margen de solo {m} %{x}: revisa tus precios de compra y tus gastos.", "Nur {m} % Marge{x}: prüfe deine Einkaufspreise und Gebühren.");
  K("Marge de {m} % sur le chiffre d'affaires{x}.", "Margin of {m} % on revenue{x}.", "Margine del {m} % sul fatturato{x}.", "Margen del {m} % sobre la facturación{x}.", "{m} % Marge auf den Umsatz{x}.");
  K("Marge par mois", "Margin by month", "Margine per mese", "Margen por mes", "Marge pro Monat");
  K("Même en comptant les {a} de stock ajouté, le mois reste bénéficiaire : {b}.", "Even counting the {a} of stock added, the month stays profitable: {b}.", "Anche contando i {a} di stock aggiunto, il mese resta in utile: {b}.", "Incluso contando los {a} de stock añadido, el mes sigue con beneficio: {b}.", "Selbst mit den {a} neuem Bestand bleibt der Monat im Plus: {b}.");
  K("Mise sur {c} : c'est ce qui rapporte le plus. Publie-en davantage.", "Bet on {c}: it pays the most. Publish more of it.", "Punta su {c}: è ciò che rende di più. Pubblicane di più.", "Apuesta por {c}: es lo que más rinde. Publica más.", "Setze auf {c}: Es bringt am meisten. Veröffentliche mehr davon.");
  K("Moins de 15 jours", "Under 15 days", "Meno di 15 giorni", "Menos de 15 días", "Weniger als 15 Tage");
  K("Nombre de ventes {l}", "Number of sales {l}", "Numero di vendite {l}", "Número de ventas {l}", "Anzahl Verkäufe {l}");
  K("Panier moyen en hausse de {p} % ({a}).", "Average basket up {p} % ({a}).", "Carrello medio in crescita del {p} % ({a}).", "Cesta media al alza un {p} % ({a}).", "Durchschnittlicher Warenkorb um {p} % gestiegen ({a}).");
  K("Part du chiffre d'affaires qui reste en bénéfice, par mois de vente", "Share of revenue that remains as profit, by month of sale", "Quota del fatturato che resta come utile, per mese di vendita", "Parte de la facturación que queda como beneficio, por mes de venta", "Anteil des Umsatzes, der als Gewinn bleibt, pro Verkaufsmonat");
  K("Pas encore de point fort net ce mois-ci : continue à publier et à vendre.", "No clear strength yet this month: keep publishing and selling.", "Nessun punto di forza netto questo mese: continua a pubblicare e vendere.", "Aún no hay un punto fuerte claro este mes: sigue publicando y vendiendo.", "Noch keine klare Stärke diesen Monat: Veröffentliche und verkaufe weiter.");
  K("Perspectives d'évolution", "Outlook", "Prospettive di evoluzione", "Perspectivas de evolución", "Entwicklungsaussichten");
  K("Perte", "Loss", "Perdita", "Pérdida", "Verlust");
  K("Pièces ajoutées et pièces vendues, par mois", "Items added and items sold, by month", "Capi aggiunti e capi venduti, per mese", "Prendas añadidas y prendas vendidas, por mes", "Hinzugefügte und verkaufte Teile pro Monat");
  K("Points à améliorer", "Points to improve", "Punti da migliorare", "Puntos a mejorar", "Verbesserungspunkte");
  K("Points forts", "Strengths", "Punti di forza", "Puntos fuertes", "Stärken");
  K("Prix d'achat des pièces en stock", "Purchase price of items in stock", "Prezzo d'acquisto dei capi in stock", "Precio de compra de las prendas en stock", "Einkaufspreis der Teile im Bestand");
  K("Projection", "Projection", "Proiezione", "Proyección", "Prognose");
  K("Retours", "Returns", "Resi", "Devoluciones", "Rücksendungen");
  K("Rien d'alarmant ce mois-ci.", "Nothing alarming this month.", "Niente di allarmante questo mese.", "Nada alarmante este mes.", "Nichts Alarmierendes diesen Monat.");
  K("Stock ajouté", "Stock added", "Stock aggiunto", "Stock añadido", "Neuer Bestand");
  K("stock ajouté : {n}", "stock added: {n}", "stock aggiunto: {n}", "stock añadido: {n}", "neuer Bestand: {n}");
  K("Sur {c} encaissés {l}", "Out of {c} collected {l}", "Su {c} incassati {l}", "De {c} cobrados {l}", "Von {c} eingenommen {l}");
  K("Sur les 3 derniers mois, ton chiffre d'affaires va de {a} à {b} : vise {c} le mois prochain.", "Over the last 3 months, your revenue ranges from {a} to {b}: aim for {c} next month.", "Negli ultimi 3 mesi il tuo fatturato va da {a} a {b}: punta a {c} il mese prossimo.", "En los últimos 3 meses tu facturación va de {a} a {b}: apunta a {c} el mes que viene.", "In den letzten 3 Monaten lag dein Umsatz zwischen {a} und {b}: Peile nächsten Monat {c} an.");
  K("Tes meilleurs jours de vente sont le {d} : publie la veille.", "Your best selling days are {d}: publish the day before.", "I tuoi giorni migliori per vendere sono {d}: pubblica il giorno prima.", "Tus mejores días de venta son el {d}: publica el día anterior.", "Deine besten Verkaufstage sind {d}: Veröffentliche am Tag davor.");
  K("Tes pièces mettent plus de temps à partir : {a} contre {b} le mois précédent.", "Your items take longer to sell: {a} versus {b} the previous month.", "I tuoi capi impiegano più tempo a partire: {a} contro {b} il mese precedente.", "Tus prendas tardan más en venderse: {a} frente a {b} el mes anterior.", "Deine Teile brauchen länger bis zum Verkauf: {a} gegenüber {b} im Vormonat.");
  K("Tes pièces partent plus vite : {a} en moyenne contre {b} le mois précédent.", "Your items sell faster: {a} on average versus {b} the previous month.", "I tuoi capi partono più in fretta: {a} in media contro {b} il mese precedente.", "Tus prendas se venden más rápido: {a} de media frente a {b} el mes anterior.", "Deine Teile verkaufen sich schneller: im Schnitt {a} gegenüber {b} im Vormonat.");
  K("Ton stock diminue : {a} pièces ajoutées pour {b} vendues.", "Your stock is shrinking: {a} items added for {b} sold.", "Il tuo stock diminuisce: {a} capi aggiunti per {b} venduti.", "Tu stock disminuye: {a} prendas añadidas por {b} vendidas.", "Dein Bestand schrumpft: {a} Teile hinzugefügt, {b} verkauft.");
  K("Ton stock grossit : {a} pièces ajoutées pour {b} vendues.", "Your stock is growing: {a} items added for {b} sold.", "Il tuo stock cresce: {a} capi aggiunti per {b} venduti.", "Tu stock crece: {a} prendas añadidas por {b} vendidas.", "Dein Bestand wächst: {a} Teile hinzugefügt, {b} verkauft.");
  K("Tout le stock est vendu.", "All the stock is sold.", "Tutto lo stock è venduto.", "Todo el stock está vendido.", "Der gesamte Bestand ist verkauft.");
  K("Très peu de retours ce mois-ci ({n}).", "Very few returns this month ({n}).", "Pochissimi resi questo mese ({n}).", "Muy pocas devoluciones este mes ({n}).", "Sehr wenige Rücksendungen diesen Monat ({n}).");
  K("Tu as ajouté plus de stock ({a}) que tu n'as encaissé de ventes ({b}) : ton stock grossit plus vite qu'il ne se vend.", "You added more stock ({a}) than you collected in sales ({b}): your stock grows faster than it sells.", "Hai aggiunto più stock ({a}) di quanto hai incassato in vendite ({b}): il tuo stock cresce più in fretta di quanto si vende.", "Has añadido más stock ({a}) del que has cobrado en ventas ({b}): tu stock crece más rápido de lo que se vende.", "Du hast mehr Bestand hinzugefügt ({a}), als du an Verkäufen eingenommen hast ({b}): Dein Bestand wächst schneller, als er sich verkauft.");
  K("Valeur du stock par catégorie", "Stock value by category", "Valore dello stock per categoria", "Valor del stock por categoría", "Bestandswert pro Kategorie");
  K("Vendues", "Sold", "Vendute", "Vendidas", "Verkauft");
  K("Ventes par jour de semaine", "Sales by day of the week", "Vendite per giorno della settimana", "Ventas por día de la semana", "Verkäufe nach Wochentag");
  K("Ventes par semaine, sur les 12 dernières semaines", "Sales per week over the last 12 weeks", "Vendite a settimana, nelle ultime 12 settimane", "Ventas por semana en las últimas 12 semanas", "Verkäufe pro Woche in den letzten 12 Wochen");
  K("Ventes semaine par semaine", "Sales week by week", "Vendite settimana per settimana", "Ventas semana a semana", "Verkäufe Woche für Woche");
}
