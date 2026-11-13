import { app } from '../state.js';
import { $, LSg, LSs, addDays, avail, days, dj, esc, eur, eurR, ok, pad, profit, sold, title, today } from './core.js';
import { bilOk, group, hbars, stats } from './dashboard.js';
import { MOIS } from './gamification.js';
import { sheetHead, showSheet } from './tools-index.js';
import { closeSheet } from './piece-sheet.js';
import { analyse, barsHTML, card, dim, markSeen, pct, prevM, scoreLabel, sg, soldIn, sum } from './bilan-extra.js';

/* ---------- Bilan : comparer deux périodes, saisonnalité, objectifs par indicateur, résumé, rappel du rapport, analyse de chaque ballot ---------- */

/* ===== comparer deux périodes ===== */
const PER = [['cm', 'Ce mois-ci'], ['lm', 'Mois dernier'], ['l2m', 'Il y a 2 mois'], ['lym', 'Même mois l\'an dernier'], ['l30', '30 derniers jours'], ['p30', '30 jours précédents'], ['ty', 'Cette année'], ['ly', 'Année dernière']];
/** Bornes { a, b } (dates incluses, jamais après aujourd'hui) d'une période nommée. */
export function periodRange(k) {
  const td = today(), y = +td.slice(0, 4), mo = +td.slice(5, 7), cap = b => (b > td ? td : b);
  const mr = (yy, mm) => { const d = new Date(yy, mm - 1, 1), m = d.getFullYear() + '-' + pad(d.getMonth() + 1, 2); return { a: m + '-01', b: cap(m + '-' + pad(dim(m), 2)) }; };
  if (k === 'cm') return mr(y, mo); if (k === 'lm') return mr(y, mo - 1); if (k === 'l2m') return mr(y, mo - 2); if (k === 'lym') return mr(y - 1, mo);
  if (k === 'l30') return { a: addDays(td, -29), b: td }; if (k === 'p30') return { a: addDays(td, -59), b: addDays(td, -30) };
  if (k === 'ty') return { a: y + '-01-01', b: td }; return { a: (y - 1) + '-01-01', b: (y - 1) + '-12-31' };
}
/** Deux périodes comparables : si l'une est en cours (finit aujourd'hui) et l'autre plus longue, on coupe l'autre au même nombre de jours. */
export function alignPeriods(A, B) {
  const td = today(), la = days(A.a, A.b), lb = days(B.a, B.b); let cut = false; A = { ...A }; B = { ...B };
  if (A.b === td && lb > la) { B.b = addDays(B.a, la); cut = true; } else if (B.b === td && la > lb) { A.b = addDays(A.a, lb); cut = true; }
  return { A, B, cut };
}
export function periodStats(L, r) {
  const S = L.filter(p => sold(p) && ok(p.dv) && p.dv >= r.a && p.dv <= r.b), st = stats(S), add = L.filter(p => ok(p.entree) && p.entree >= r.a && p.entree <= r.b);
  return { n: st.n, ca: st.ca, ben: st.ben, marge: st.marge * 100, panier: st.panier, delai: st.delai, added: sum(add, x => x.achat), nAdded: add.length };
}
const optHTML = (sel) => PER.map(([k, l]) => `<option value="${k}"${k === sel ? ' selected' : ''}>${esc(t(l))}</option>`).join('');
function cmpTable(st) {
  const L = app.P.filter(bilOk), al = alignPeriods(periodRange(st.a), periodRange(st.b)), A = periodStats(L, al.A), B = periodStats(L, al.B);
  const rows = [[t('Chiffre d\'affaires'), v => eurR(v), 'ca', true], [t('Bénéfice sur les pièces'), v => eurR(v), 'ben', true], [t('Ventes'), v => String(Math.round(v)), 'n', true], [t('Marge'), v => Math.round(v) + ' %', 'marge', true, 'pt'], [t('Panier moyen'), v => eurR(v), 'panier', true], [t('Délai avant la vente'), v => dj(v), 'delai', false], [t('Stock ajouté'), v => eurR(v), 'added', null]];
  const dl = (a, b, good, pt) => { const d = pt ? a - b : pct(a, b); if (d == null || !isFinite(d) || !Math.round(d)) return ''; const c = good == null ? 'var(--mute)' : (d > 0) === good ? 'var(--mint)' : 'var(--red)'; return `<span style="color:${c};font-weight:700">${Math.abs(d) > 500 && !pt ? (d > 0 ? '> +500' : '< −500') : sg(d)}${pt ? ' pt' : ' %'}</span>`; };
  return `<table style="width:100%;border-collapse:collapse;font-size:13px;font-variant-numeric:tabular-nums"><tr style="color:var(--mute);font-size:12px"><td></td><td style="text-align:right">${esc(t(PER.find(p => p[0] === st.a)[1]))}</td><td style="text-align:right">${esc(t(PER.find(p => p[0] === st.b)[1]))}</td><td style="text-align:right">${t('Écart')}</td></tr>
  ${rows.map(([l, f, k, good, pt]) => { const avg = ['marge', 'panier', 'delai'].includes(k), vl = P => (avg && !P.n ? '—' : f(P[k] || 0)); return `<tr style="border-top:1px solid var(--soft)"><td style="padding:7px 0">${esc(l)}</td><td style="text-align:right"><b>${vl(A)}</b></td><td style="text-align:right">${vl(B)}</td><td style="text-align:right">${avg && (!A.n || !B.n) ? '' : dl(A[k] || 0, B[k] || 0, good, pt)}</td></tr>`; }).join('')}</table>${al.cut ? `<div class="hint" style="margin-top:6px">${t('Les deux périodes sont comparées sur le même nombre de jours.')}</div>` : ''}`;
}
const cmpState = () => { const s = Object.assign({ a: 'cm', b: 'lm' }, LSg('bcmp', {})); ['a', 'b'].forEach(k => { if (!PER.some(p => p[0] === s[k])) s[k] = k === 'a' ? 'cm' : 'lm'; }); return s; };
function compareCard() {
  const st = cmpState(), sel = 'style="min-height:38px;border-radius:10px;border:1px solid var(--soft);padding:4px 8px;background:var(--card,#fff);color:inherit;font:inherit;max-width:100%"';
  return card('Comparer deux périodes', t('Choisis deux périodes : les chiffres suivent les filtres du Bilan.'), `<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:8px"><select data-cmp="a" ${sel} aria-label="${t('Première période')}">${optHTML(st.a)}</select><span>${t('face à')}</span><select data-cmp="b" ${sel} aria-label="${t('Deuxième période')}">${optHTML(st.b)}</select></div><div class="bcmpb">${cmpTable(st)}</div>`);
}

/* ===== saisonnalité : le mois type de l'année, calculé sur tout l'historique ===== */
export function seasonData(L) {
  const by = {}; L.filter(p => sold(p) && ok(p.dv)).forEach(p => { const y = p.dv.slice(0, 4), mo = +p.dv.slice(5, 7), o = (by[mo] = by[mo] || {}); const a = (o[y] = o[y] || { ca: 0, ben: 0, n: 0 }); a.ca += p.pv || 0; a.ben += profit(p); a.n++; });
  return Array.from({ length: 12 }, (_, i) => { const ys = Object.values(by[i + 1] || {}), n = ys.length; return { mo: i + 1, years: n, ca: n ? sum(ys, x => x.ca) / n : 0, ben: n ? sum(ys, x => x.ben) / n : 0 }; });
}
function seasonCard() {
  const D = seasonData(app.P.filter(bilOk)), sub = t('Chiffre d\'affaires et bénéfice moyens de chaque mois de l\'année');
  const act = D.filter(x => x.years); if (act.length < 3) return card('Saisonnalité', sub, `<div class="hint">${t('Pas assez d\'historique : la saisonnalité apparaît à partir de 3 mois de ventes.')}</div>`);
  const k = v => (v >= 1000 ? (v / 1000).toFixed(1).replace('.', app.DS || ',') + 'k' : String(Math.round(v)));
  const best = act.reduce((a, x) => (x.ca > a.ca ? x : a), act[0]), worst = act.reduce((a, x) => (x.ca < a.ca ? x : a), act[0]);
  const cols = D.map(x => ({ a: x.ca, b: Math.max(0, x.ben), l: new Date(2000, x.mo - 1, 15).toLocaleDateString(app.LOC, { month: 'narrow' }), tag: x.ca ? k(x.ca) : '' }));
  const yrs = Math.max(...D.map(x => x.years));
  return card('Saisonnalité', sub, barsHTML(cols, `<div class="lgd"><span>${t('Chiffre d\'affaires')}</span><span class="p">${t('Bénéfice net')}</span></div>`) + `<div class="hint">${t('Mois le plus fort : {a}. Mois le plus calme : {b}.', { a: MOIS[best.mo - 1], b: MOIS[worst.mo - 1] })} ${best.mo !== worst.mo ? t('Prévois ton stock 3 à 4 semaines avant {a}.', { a: MOIS[best.mo - 1] }) : ''}</div><div class="hint">${yrs > 1 ? t('Moyenne sur {n} ans de ventes.', { n: yrs }) : t('Basé sur un an de ventes : la tendance se précisera avec le temps.')}</div>`);
}

/* ===== objectifs par indicateur (ventes, marge, délai de vente) ===== */
export function objState() {
  const o = app.cfg.objx || {}, m = today().slice(0, 7), nd = dim(m), dn = +today().slice(8, 10), st = stats(soldIn(app.P, m)), out = [];
  if (+o.ventes > 0) { const tg = +o.ventes, exp = tg * dn / nd, v = st.n; out.push({ k: 'ventes', l: t('Ventes du mois'), v: String(v), tg: String(tg), p: v / tg, s: v >= tg ? 'ok' : v >= exp * 0.9 ? 'pace' : 'late', hint: v < exp * 0.9 ? t('Il manque {n} ventes pour tenir le rythme.', { n: Math.max(1, Math.ceil(exp - v)) }) : '' }); }
  if (+o.marge > 0) { const tg = +o.marge, v = Math.round(st.marge * 100); out.push({ k: 'marge', l: t('Marge du mois'), v: v + ' %', tg: tg + ' %', p: v / tg, s: st.n < 3 ? 'wait' : v >= tg ? 'ok' : v >= tg - 5 ? 'pace' : 'late', hint: '' }); }
  if (+o.delai > 0) { const tg = +o.delai, v = st.delai; out.push({ k: 'delai', l: t('Délai avant la vente'), v: st.n ? dj(v) : '—', tg: dj(tg), p: st.n && v ? tg / v : 0, s: st.n < 3 ? 'wait' : v <= tg ? 'ok' : v <= tg * 1.2 ? 'pace' : 'late', hint: '' }); }
  return out;
}
const PILL = { ok: ['Atteint', 'var(--mint)'], pace: ['Dans le rythme', 'var(--denim)'], late: ['En retard', 'var(--red)'], wait: ['Pas assez de ventes', 'var(--mute)'] };
function objCard() {
  const L = objState();
  if (!L.length) return `<div class="card bobj"><span class="l">${t('Objectifs détaillés')}</span><p class="hint" style="margin:4px 0 8px">${t('Fixe un objectif de ventes, de marge ou de délai de vente : le Bilan te dit si tu es dans le rythme.')}</p><button type="button" class="btn sm sec" data-obj="1">${t('Fixer mes objectifs')}</button></div>`;
  return `<div class="card bobj"><span class="l">${t('Objectifs détaillés')}</span>${L.map(x => `<div style="margin:10px 0 0"><div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap"><b style="flex:1">${esc(x.l)}</b><span style="font-variant-numeric:tabular-nums">${esc(x.v)} <span style="color:var(--mute)">/ ${esc(x.tg)}</span></span><span style="font-size:11px;font-weight:700;color:#fff;background:${PILL[x.s][1]};border-radius:10px;padding:2px 8px">${t(PILL[x.s][0])}</span></div><div style="height:8px;background:var(--soft);border-radius:4px;overflow:hidden;margin-top:5px"><i style="display:block;height:100%;width:${Math.min(100, Math.max(2, x.p * 100))}%;background:${PILL[x.s][1]}"></i></div>${x.hint ? `<div class="hint" style="margin:4px 0 0">${esc(x.hint)}</div>` : ''}</div>`).join('')}<button type="button" class="btn sm sec" data-obj="1" style="margin-top:10px">${t('Modifier mes objectifs')}</button></div>`;
}
export function openObjectifs() {
  const o = app.cfg.objx || {}, f = (id, lab, unit, v) => `<div style="margin:0 0 12px"><span class="l">${lab}</span><div class="price"><input type="text" inputmode="decimal" id="${id}" value="${v > 0 ? v : ''}" placeholder="0"><span>${unit}</span></div></div>`;
  showSheet(sheetHead(t('Objectifs détaillés')) + `<p class="sub">${t('Laisse vide un objectif dont tu n\'as pas besoin.')}</p>${f('ox_v', t('Ventes par mois'), t('ventes'), +o.ventes)}${f('ox_m', t('Marge visée'), '%', +o.marge)}${f('ox_d', t('Délai de vente visé'), t('jours'), +o.delai)}<div class="acts"><button type="button" class="btn mint" id="ox_save">${t('Enregistrer')}</button></div>`);
  $('shc').onclick = e => {
    if (!e.target.closest('#ox_save')) return; const num = id => Math.max(0, parseFloat(String($(id).value).replace(',', '.')) || 0);
    app.setCfg({ objx: { ventes: Math.round(num('ox_v')), marge: Math.min(100, num('ox_m')), delai: Math.round(num('ox_d')) } }); closeSheet(); app.renderDash();
  };
}
app.openObjectifs = openObjectifs;

/* ===== résumé en une phrase, et rappel quand le rapport du mois est prêt ===== */
export function summarySentence() {
  const m = today().slice(0, 7), a = analyse(m);
  if (!a.s.n) return t('Pas encore de vente ce mois-ci : publie des pièces pour lancer le mois.');
  const proj = a.proj ? a.proj.ca : a.s.ca, pv = stats(soldIn(app.P, a.pm)).ca, p = pv ? pct(proj, pv) : null, pmn = MOIS[+a.pm.slice(5, 7) - 1];
  let s = p == null ? t('Environ {a} projetés ce mois-ci.', { a: eurR(proj) }) : p >= 10 ? t('Bon rythme : environ {a} projetés ce mois-ci, soit +{p} % face à {m}.', { a: eurR(proj), p: Math.round(p), m: pmn }) : p <= -10 ? t('Mois en retrait : environ {a} projetés, soit −{p} % face à {m}.', { a: eurR(proj), p: Math.round(-p), m: pmn }) : t('Rythme stable : environ {a} projetés ce mois-ci, comme {m}.', { a: eurR(proj), m: pmn });
  if (a.unpub.length) s += ' ' + t('À publier : {n}.', { n: a.unpub.length }); else if (a.old.length) s += ' ' + t('À relancer : {n}.', { n: a.old.length });
  const late = objState().find(x => x.s === 'late'); if (late) s += ' ' + t('Objectif en retard : {o}.', { o: late.l });
  return s;
}
function sumCard() {
  const m = today().slice(0, 7), sc = analyse(m).score;
  return `<div class="card bsum"><p style="margin:0 0 8px;font-size:16px;line-height:1.4;font-weight:700">${esc(summarySentence())}</p><div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">${sc.n ? `<span style="font-size:13px;color:var(--mute)">${t('Score du mois')} <b style="color:var(--ink)">${sc.total}/100</b> · ${t(scoreLabel(sc.total))}</span>` : ''}<button type="button" class="btn sm sec" data-mrep="1" style="width:auto;margin-left:auto">${t('Voir le rapport')}</button></div></div>`;
}
export function noteMonth() {
  const td = today(), pm = prevM(td.slice(0, 7));
  if (+td.slice(8, 10) > 12 || LSg('mrSeen', []).includes(pm)) return '';
  return app.P.some(p => sold(p) && ok(p.dv) && p.dv.startsWith(pm)) ? pm : '';
}
function noteCard() {
  const pm = noteMonth(); if (!pm) return '';
  return `<div class="card bnote" style="border-left:4px solid var(--mint)"><b>${t('Ton rapport de {m} est prêt', { m: MOIS[+pm.slice(5, 7) - 1] })}</b><div class="hint" style="margin:2px 0 8px">${t('Score, points forts, points à améliorer et plan d\'action.')}</div><div style="display:flex;gap:8px"><button type="button" class="btn sm mint" data-mrep="${pm}" style="width:auto">${t('Ouvrir')}</button><button type="button" class="chip sm" data-bnx="${pm}">${t('Plus tard')}</button></div></div>`;
}

/* ===== analyse de chaque ballot ===== */
export function ballotDetail(name) {
  const L = app.P.filter(p => p.ballot === name); if (!L.length) return null;
  const S = L.filter(sold), left = L.filter(avail), cost = sum(L, x => x.achat), ca = sum(S, x => x.pv), frais = sum(S, x => x.frais), rec = ca - frais, st = stats(S), start = L.map(x => x.entree).filter(ok).sort()[0] || '';
  const avgPv = S.length ? ca / S.length : (() => { const cs = new Set(left.map(x => x.cat)), G = app.P.filter(x => sold(x) && cs.has(x.cat)); return G.length ? sum(G, x => x.pv) / G.length : 0; })();
  const fr = ca ? frais / ca : 0, potentiel = left.length && avgPv ? left.length * avgPv * (1 - fr) : 0, projRec = rec + potentiel, reste = Math.max(0, cost - rec), avgNet = S.length ? rec / S.length : 0;
  const weeks = start ? Math.max(1, (days(start, today()) + 1) / 7) : 0, rate = weeks && S.length ? S.length / weeks : 0;
  const stag = left.filter(x => ok(x.pub) && days(x.pub, today()) >= 30), cats = group(S, 'cat').sort((a, b) => b.ben - a.ben), ranked = S.slice().sort((a, b) => profit(b) - profit(a));
  let verdict; if (rec >= cost * 2) verdict = 'x2'; else if (rec >= cost) verdict = 'paid'; else if (!S.length || !avgPv) verdict = 'unk'; else if (projRec >= cost) verdict = 'way'; else verdict = 'watch';
  return { name, n: L.length, nSold: S.length, nLeft: left.length, cost, ca, frais, rec, ben: rec - cost, roi: cost ? rec / cost : 0, delai: st.delai, avgPv, potentiel, projRec, projBen: projRec - cost, projRoi: cost ? projRec / cost : 0, reste, needed: reste > 0 && avgNet > 0 ? Math.ceil(reste / avgNet) : 0, start, rate, weeksToClear: rate > 0 && left.length ? left.length / rate : 0, stag, cats, best: ranked.slice(0, 3), worst: ranked.length > 3 ? ranked.slice(-3).reverse() : [], verdict };
}
const VERD = { x2: 'Excellent : ce ballot a déjà doublé sa mise.', paid: 'Rentabilisé : tout ce qui reste à vendre est du bénéfice.', way: 'En bonne voie : en vendant le reste au prix moyen, le ballot sera rentabilisé.', watch: 'À surveiller : même en vendant tout le reste au prix moyen, le ballot ne couvrirait pas son prix.', unk: 'Pas assez de ventes pour estimer la rentabilité de ce ballot.' };
export function openBallot(name) {
  const b = ballotDetail(name); if (!b) return;
  const kp = (v, l, neg) => `<div class="kpi${neg ? ' neg' : ''}"><b>${v}</b><span>${l}</span></div>`, row = p => `<div style="display:flex;gap:8px;justify-content:space-between;margin:4px 0;font-size:14px"><span style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(title(p))}</span><b style="font-variant-numeric:tabular-nums;color:${profit(p) < 0 ? 'var(--red)' : 'inherit'}">${eur(profit(p))}</b></div>`;
  const col = b.verdict === 'watch' ? 'var(--red)' : b.verdict === 'unk' ? 'var(--mute)' : 'var(--mint)', pc = Math.min(100, b.cost ? b.rec / b.cost * 100 : 0);
  showSheet(sheetHead(esc(b.name)) + `<div class="card" style="border-left:4px solid ${col}"><b>${t(VERD[b.verdict])}</b><div style="height:10px;background:var(--soft);border-radius:5px;overflow:hidden;margin:10px 0 4px"><i style="display:block;height:100%;width:${pc}%;background:${col}"></i></div><div class="hint" style="margin:0">${t('{c} encaissés (frais déduits) sur {p} de prix du ballot', { c: eurR(b.rec), p: eurR(b.cost) })}</div></div>
  <div class="card"><h3>${t('Résultat')}</h3><div class="kpis">${kp(eurR(b.cost), t('prix du ballot'))}${kp(eurR(b.rec), t('encaissé net'))}${kp(eurR(b.ben), t('bénéfice réalisé'), b.ben < 0)}</div><div class="kpis">${kp(Math.round(b.roi * 100) + ' %', t('du prix récupéré'))}${kp(b.nSold + ' / ' + b.n, t('pièces vendues'))}${kp(b.nSold ? dj(b.delai) : '—', t('délai moyen de vente'))}</div></div>
  <div class="card"><h3>${t('Et pour la suite ?')}</h3>${b.nLeft ? (b.avgPv ? `<div class="kpis">${kp(eurR(b.avgPv), t('prix de vente moyen'))}${kp(eurR(b.potentiel), t('encore à encaisser'))}${kp(eurR(b.projBen), t('bénéfice final estimé'), b.projBen < 0)}</div><div class="hint">${t('Estimation : {n} restantes vendues au prix moyen, frais déduits. Retour final estimé : {r} % du prix du ballot.', { n: tn(b.nLeft, 'pièce', 'pièces'), r: Math.round(b.projRoi * 100) })}</div>` : `<div class="hint">${t('Pas assez de ventes pour estimer ce qui reste à encaisser.')}</div>`) : `<div class="hint">${t('Tout le ballot est vendu.')}</div>`}
  ${b.reste > 0 ? `<div class="hint" style="margin-top:6px">${t('Il reste {r} à récupérer pour couvrir le prix du ballot.', { r: eurR(b.reste) })} ${b.needed ? t('Environ {n} ventes de plus au rythme actuel.', { n: b.needed }) : ''}</div>` : ''}
  ${b.rate ? `<div class="hint" style="margin-top:6px">${t('Rythme : {r} ventes par semaine depuis l\'entrée du ballot.', { r: (Math.round(b.rate * 10) / 10).toString().replace('.', app.DS || ',') })} ${b.weeksToClear ? t('À ce rythme, le reste part en environ {w} semaines.', { w: Math.max(1, Math.round(b.weeksToClear)) }) : ''}</div>` : ''}
  ${b.stag.length ? `<div class="hint" style="margin-top:6px;color:var(--red)">${t('{n} en ligne depuis 30 jours ou plus : baisse le prix ou relance-les.', { n: tn(b.stag.length, 'pièce', 'pièces') })}</div>` : ''}</div>
  ${b.cats.length ? `<div class="card"><h3>${t('Par catégorie')}</h3><p class="sub">${t('Bénéfice net des pièces vendues')}</p>${hbars(b.cats.map(g => ({ k: g.k, v: g.ben, sub: tn(g.n, 'vente', 'ventes') })), eurR)}</div>` : ''}
  ${b.best.length ? `<div class="card"><h3>${t('Meilleures ventes')}</h3>${b.best.map(row).join('')}${b.worst.length ? `<span class="l" style="margin-top:12px">${t('Ventes les moins rentables')}</span>${b.worst.map(row).join('')}` : ''}</div>` : ''}`);
}
app.openBallot = openBallot;

/* ===== branchement dans le Bilan ===== */
const safe = f => () => { try { return f(); } catch (e) { return ''; } };
const charts0 = app.bilanChartsHTML, month0 = app.bilanMonthHTML;
app.bilanChartsHTML = () => (charts0 ? charts0() : '') + safe(compareCard)() + safe(seasonCard)();
app.bilanMonthHTML = () => (month0 ? month0() : '') + safe(objCard)() + safe(sumCard)() + safe(noteCard)();
$('dsh').addEventListener('click', e => {
  if (e.target.closest('[data-obj]')) return openObjectifs();
  const nx = e.target.closest('[data-bnx]'); if (nx) { markSeen(nx.dataset.bnx); const c = nx.closest('.bnote'); if (c) c.remove(); return; }
  const bl = e.target.closest('[data-ballot]'); if (bl) openBallot(bl.dataset.ballot);
});
$('dsh').addEventListener('change', e => {
  const s = e.target.closest('[data-cmp]'); if (!s) return;
  const st = cmpState(); st[s.dataset.cmp] = s.value; LSs('bcmp', st);
  const c = s.closest('.card'), body = c && c.querySelector('.bcmpb'); if (body) body.innerHTML = cmpTable(st);
});

/* ---------- traductions (K : français, English, Italiano, Español, Deutsch) ---------- */
if (typeof window !== 'undefined' && window.K) {
  const K = window.K;
  K("{c} encaissés (frais déduits) sur {p} de prix du ballot", "{c} collected (fees deducted) against {p} bale price", "{c} incassati (commissioni detratte) su {p} di prezzo della balla", "{c} cobrados (gastos deducidos) sobre {p} de precio del fardo", "{c} eingenommen (nach Gebühren) bei {p} Ballenpreis");
  K("{n} en ligne depuis 30 jours ou plus : baisse le prix ou relance-les.", "{n} online for 30 days or more: lower the price or bump them.", "{n} online da 30 giorni o più: abbassa il prezzo o rilancia.", "{n} en línea desde hace 30 días o más: baja el precio o reactívalas.", "{n} seit 30 Tagen oder länger online: senke den Preis oder bring sie neu hoch.");
  K("30 jours précédents", "Previous 30 days", "30 giorni precedenti", "30 días anteriores", "Vorherige 30 Tage");
  K("À ce rythme, le reste part en environ {w} semaines.", "At this pace, the rest will sell in about {w} weeks.", "A questo ritmo, il resto parte in circa {w} settimane.", "A este ritmo, el resto se vende en unas {w} semanas.", "In diesem Tempo ist der Rest in etwa {w} Wochen verkauft.");
  K("À publier : {n}.", "To publish: {n}.", "Da pubblicare: {n}.", "Por publicar: {n}.", "Zu veröffentlichen: {n}.");
  K("À redresser", "Needs a turnaround", "Da risollevare", "A remontar", "Braucht Nachbesserung");
  K("À relancer : {n}.", "To bump: {n}.", "Da rilanciare: {n}.", "Por reactivar: {n}.", "Neu hochzubringen: {n}.");
  K("À surveiller : même en vendant tout le reste au prix moyen, le ballot ne couvrirait pas son prix.", "To watch: even selling everything left at the average price, the bale would not cover its price.", "Da tenere d'occhio: anche vendendo tutto il resto al prezzo medio, la balla non coprirebbe il suo prezzo.", "A vigilar: incluso vendiendo todo lo que queda al precio medio, el fardo no cubriría su precio.", "Im Auge behalten: Selbst wenn alles Übrige zum Durchschnittspreis verkauft wird, deckt der Ballen seinen Preis nicht.");
  K("Année dernière", "Last year", "Anno scorso", "Año pasado", "Letztes Jahr");
  K("Atteint", "Reached", "Raggiunto", "Alcanzado", "Erreicht");
  K("Au-dessus de ta moyenne des 6 derniers mois : {a} de chiffre d'affaires contre {b} en moyenne.", "Above your 6-month average: {a} in revenue versus {b} on average.", "Sopra la tua media degli ultimi 6 mesi: {a} di fatturato contro {b} in media.", "Por encima de tu media de los últimos 6 meses: {a} de facturación frente a {b} de media.", "Über deinem 6-Monats-Schnitt: {a} Umsatz gegenüber durchschnittlich {b}.");
  K("Baisser le prix ou relancer {n} en ligne depuis 30 jours ou plus", "Lower the price or bump {n} online for 30 days or more", "Abbassare il prezzo o rilanciare {n} online da 30 giorni o più", "Bajar el precio o reactivar {n} en línea desde hace 30 días o más", "Preis senken oder {n} neu hochbringen, seit 30 Tagen oder länger online");
  K("Basé sur un an de ventes : la tendance se précisera avec le temps.", "Based on one year of sales: the trend will sharpen over time.", "Basato su un anno di vendite: la tendenza si preciserà con il tempo.", "Basado en un año de ventas: la tendencia se afinará con el tiempo.", "Basiert auf einem Jahr Verkäufe: Der Trend wird mit der Zeit genauer.");
  K("bénéfice final estimé", "estimated final profit", "utile finale stimato", "beneficio final estimado", "geschätzter Endgewinn");
  K("Bénéfice net des pièces vendues", "Net profit of items sold", "Utile netto dei capi venduti", "Beneficio neto de las prendas vendidas", "Nettogewinn der verkauften Teile");
  K("bénéfice réalisé", "profit made", "utile realizzato", "beneficio obtenido", "erzielter Gewinn");
  K("Bon mois", "Good month", "Buon mese", "Buen mes", "Guter Monat");
  K("Bon rythme : environ {a} projetés ce mois-ci, soit +{p} % face à {m}.", "Good pace: about {a} projected this month, i.e. +{p} % versus {m}.", "Buon ritmo: circa {a} previsti questo mese, cioè +{p} % rispetto a {m}.", "Buen ritmo: unos {a} previstos este mes, es decir +{p} % frente a {m}.", "Gutes Tempo: etwa {a} für diesen Monat prognostiziert, also +{p} % gegenüber {m}.");
  K("Ce mois", "This month", "Questo mese", "Este mes", "Dieser Monat");
  K("Ce mois-ci fait mieux.", "This month does better.", "Questo mese va meglio.", "Este mes va mejor.", "Dieser Monat ist besser.");
  K("Ce mois-ci fait moins bien.", "This month does worse.", "Questo mese va peggio.", "Este mes va peor.", "Dieser Monat ist schlechter.");
  K("Chiffre d'affaires et bénéfice moyens de chaque mois de l'année", "Average revenue and profit for each month of the year", "Fatturato e utile medi di ogni mese dell'anno", "Facturación y beneficio medios de cada mes del año", "Durchschnittlicher Umsatz und Gewinn jedes Monats im Jahr");
  K("Choisis deux périodes : les chiffres suivent les filtres du Bilan.", "Choose two periods: the figures follow the Summary filters.", "Scegli due periodi: i numeri seguono i filtri del Bilancio.", "Elige dos periodos: las cifras siguen los filtros del Balance.", "Wähle zwei Zeiträume: Die Zahlen folgen den Filtern der Bilanz.");
  K("Compléter les {n} fiches incomplètes", "Complete the {n} incomplete listings", "Completare le {n} schede incomplete", "Completar las {n} fichas incompletas", "Die {n} unvollständigen Einträge vervollständigen");
  K("Croissance", "Growth", "Crescita", "Crecimiento", "Wachstum");
  K("Dans le rythme", "On pace", "Nel ritmo", "En el ritmo", "Im Plan");
  K("Délai de vente visé", "Target time to sell", "Tempo di vendita obiettivo", "Plazo de venta objetivo", "Ziel-Verkaufsdauer");
  K("délai moyen de vente", "average time to sell", "tempo medio di vendita", "plazo medio de venta", "durchschnittliche Verkaufsdauer");
  K("Deuxième période", "Second period", "Secondo periodo", "Segundo periodo", "Zweiter Zeitraum");
  K("du prix récupéré", "of the price recovered", "del prezzo recuperato", "del precio recuperado", "des Preises zurückgeholt");
  K("Écart", "Change", "Differenza", "Diferencia", "Abweichung");
  K("En bonne voie : en vendant le reste au prix moyen, le ballot sera rentabilisé.", "On track: selling the rest at the average price, the bale will pay for itself.", "Sulla buona strada: vendendo il resto al prezzo medio, la balla sarà ripagata.", "Bien encaminado: vendiendo el resto al precio medio, el fardo se rentabilizará.", "Auf gutem Weg: Wenn der Rest zum Durchschnittspreis verkauft wird, rechnet sich der Ballen.");
  K("En dessous de ta moyenne des 6 derniers mois : {a} contre {b} en moyenne.", "Below your 6-month average: {a} versus {b} on average.", "Sotto la tua media degli ultimi 6 mesi: {a} contro {b} in media.", "Por debajo de tu media de los últimos 6 meses: {a} frente a {b} de media.", "Unter deinem 6-Monats-Schnitt: {a} gegenüber durchschnittlich {b}.");
  K("En images", "In pictures", "In immagini", "En imágenes", "In Bildern");
  K("En retard", "Behind", "In ritardo", "Con retraso", "Im Rückstand");
  K("encaissé net", "net collected", "incassato netto", "cobrado neto", "netto eingenommen");
  K("encore à encaisser", "still to collect", "ancora da incassare", "aún por cobrar", "noch einzunehmen");
  K("Environ {a} projetés ce mois-ci.", "About {a} projected this month.", "Circa {a} previsti questo mese.", "Unos {a} previstos este mes.", "Etwa {a} für diesen Monat prognostiziert.");
  K("Environ {n} ventes de plus au rythme actuel.", "About {n} more sales at the current pace.", "Circa {n} vendite in più al ritmo attuale.", "Unas {n} ventas más al ritmo actual.", "Etwa {n} Verkäufe mehr im aktuellen Tempo.");
  K("Estimation : {n} restantes vendues au prix moyen, frais déduits. Retour final estimé : {r} % du prix du ballot.", "Estimate: {n} remaining sold at the average price, fees deducted. Estimated final return: {r} % of the bale price.", "Stima: {n} rimanenti venduti al prezzo medio, commissioni detratte. Ritorno finale stimato: {r} % del prezzo della balla.", "Estimación: {n} restantes vendidas al precio medio, gastos deducidos. Retorno final estimado: {r} % del precio del fardo.", "Schätzung: {n} verbleibend, zum Durchschnittspreis verkauft, nach Gebühren. Geschätzter Endertrag: {r} % des Ballenpreises.");
  K("Et pour la suite ?", "And what next?", "E per il futuro?", "¿Y después?", "Und wie geht es weiter?");
  K("Excellent : ce ballot a déjà doublé sa mise.", "Excellent: this bale has already doubled its stake.", "Eccellente: questa balla ha già raddoppiato la posta.", "Excelente: este fardo ya ha duplicado su inversión.", "Ausgezeichnet: Dieser Ballen hat seinen Einsatz schon verdoppelt.");
  K("Excellent", "Excellent", "Eccellente", "Excelente", "Ausgezeichnet");
  K("face à", "versus", "rispetto a", "frente a", "gegenüber");
  K("Fixe un objectif de ventes, de marge ou de délai de vente : le Bilan te dit si tu es dans le rythme.", "Set a goal for sales, margin or time to sell: the Summary tells you whether you are on pace.", "Fissa un obiettivo di vendite, margine o tempo di vendita: il Bilancio ti dice se sei nel ritmo.", "Fija un objetivo de ventas, margen o plazo de venta: el Balance te dice si vas en el ritmo.", "Setze ein Ziel für Verkäufe, Marge oder Verkaufsdauer: Die Bilanz zeigt dir, ob du im Plan bist.");
  K("Fixer mes objectifs", "Set my goals", "Fissa i miei obiettivi", "Fijar mis objetivos", "Meine Ziele festlegen");
  K("Fixer un objectif de marge, de délai ou de ventes", "Set a margin, time-to-sell or sales goal", "Fissare un obiettivo di margine, tempo di vendita o vendite", "Fijar un objetivo de margen, plazo de venta o ventas", "Ein Ziel für Marge, Verkaufsdauer oder Verkäufe festlegen");
  K("Il manque {n} ventes pour tenir le rythme.", "{n} sales short of the pace.", "Mancano {n} vendite per tenere il ritmo.", "Faltan {n} ventas para mantener el ritmo.", "Es fehlen {n} Verkäufe, um im Plan zu bleiben.");
  K("Il reste {r} à récupérer pour couvrir le prix du ballot.", "{r} left to recover to cover the bale price.", "Restano {r} da recuperare per coprire il prezzo della balla.", "Quedan {r} por recuperar para cubrir el precio del fardo.", "Noch {r} zurückzuholen, um den Ballenpreis zu decken.");
  K("Il y a 2 mois", "2 months ago", "2 mesi fa", "Hace 2 meses", "Vor 2 Monaten");
  K("Image à partager", "Image to share", "Immagine da condividere", "Imagen para compartir", "Bild zum Teilen");
  K("Laisse vide un objectif dont tu n'as pas besoin.", "Leave blank any goal you do not need.", "Lascia vuoto un obiettivo che non ti serve.", "Deja en blanco un objetivo que no necesites.", "Lass ein Ziel leer, das du nicht brauchst.");
  K("Les deux périodes sont comparées sur le même nombre de jours.", "Both periods are compared over the same number of days.", "I due periodi sono confrontati sullo stesso numero di giorni.", "Los dos periodos se comparan con el mismo número de días.", "Beide Zeiträume werden über die gleiche Anzahl Tage verglichen.");
  K("Marge du mois", "Margin this month", "Margine del mese", "Margen del mes", "Marge des Monats");
  K("Marge visée", "Target margin", "Margine obiettivo", "Margen objetivo", "Ziel-Marge");
  K("Meilleures ventes", "Best sales", "Migliori vendite", "Mejores ventas", "Beste Verkäufe");
  K("Même mois l'an dernier", "Same month last year", "Stesso mese dell'anno scorso", "Mismo mes del año pasado", "Gleicher Monat im Vorjahr");
  K("Même niveau.", "Same level.", "Stesso livello.", "Mismo nivel.", "Gleiches Niveau.");
  K("Modifier mes objectifs", "Edit my goals", "Modifica i miei obiettivi", "Editar mis objetivos", "Meine Ziele bearbeiten");
  K("Mois en retrait : environ {a} projetés, soit −{p} % face à {m}.", "Month behind: about {a} projected, i.e. −{p} % versus {m}.", "Mese in calo: circa {a} previsti, cioè −{p} % rispetto a {m}.", "Mes a la baja: unos {a} previstos, es decir −{p} % frente a {m}.", "Schwächerer Monat: etwa {a} prognostiziert, also −{p} % gegenüber {m}.");
  K("Mois le plus fort : {a}. Mois le plus calme : {b}.", "Strongest month: {a}. Quietest month: {b}.", "Mese più forte: {a}. Mese più calmo: {b}.", "Mes más fuerte: {a}. Mes más tranquilo: {b}.", "Stärkster Monat: {a}. Ruhigster Monat: {b}.");
  K("Mois moyen", "Average month", "Mese medio", "Mes medio", "Durchschnittlicher Monat");
  K("Moyenne 6 mois", "6-month average", "Media 6 mesi", "Media 6 meses", "6-Monats-Schnitt");
  K("Moyenne de tes mois précédents : {s} / 100.", "Average of your previous months: {s} / 100.", "Media dei tuoi mesi precedenti: {s} / 100.", "Media de tus meses anteriores: {s} / 100.", "Durchschnitt deiner Vormonate: {s} / 100.");
  K("Moyenne sur {n} ans de ventes.", "Average over {n} years of sales.", "Media su {n} anni di vendite.", "Media de {n} años de ventas.", "Durchschnitt über {n} Jahre Verkäufe.");
  K("Objectif en retard : {o}.", "Goal behind: {o}.", "Obiettivo in ritardo: {o}.", "Objetivo con retraso: {o}.", "Ziel im Rückstand: {o}.");
  K("Objectifs détaillés", "Detailed goals", "Obiettivi dettagliati", "Objetivos detallados", "Detaillierte Ziele");
  K("Pas assez de ventes", "Not enough sales", "Poche vendite", "Pocas ventas", "Zu wenige Verkäufe");
  K("Pas assez de ventes pour estimer ce qui reste à encaisser.", "Not enough sales to estimate what is left to collect.", "Poche vendite per stimare ciò che resta da incassare.", "Pocas ventas para estimar lo que queda por cobrar.", "Zu wenige Verkäufe, um den noch einzunehmenden Betrag zu schätzen.");
  K("Pas assez de ventes pour estimer la rentabilité de ce ballot.", "Not enough sales to estimate this bale's profitability.", "Poche vendite per stimare la redditività di questa balla.", "Pocas ventas para estimar la rentabilidad de este fardo.", "Zu wenige Verkäufe, um die Rentabilität dieses Ballens zu schätzen.");
  K("Pas assez d'historique : la saisonnalité apparaît à partir de 3 mois de ventes.", "Not enough history: seasonality appears after 3 months of sales.", "Storico insufficiente: la stagionalità appare dopo 3 mesi di vendite.", "Historial insuficiente: la estacionalidad aparece a partir de 3 meses de ventas.", "Zu wenig Verlauf: Die Saisonalität erscheint ab 3 Monaten Verkäufen.");
  K("Pas encore de vente ce mois-ci : publie des pièces pour lancer le mois.", "No sales yet this month: publish items to get the month going.", "Ancora nessuna vendita questo mese: pubblica dei capi per far partire il mese.", "Aún no hay ventas este mes: publica prendas para arrancar el mes.", "Noch kein Verkauf diesen Monat: Veröffentliche Teile, um den Monat anzukurbeln.");
  K("Plan d'action", "Action plan", "Piano d'azione", "Plan de acción", "Aktionsplan");
  K("Première période", "First period", "Primo periodo", "Primer periodo", "Erster Zeitraum");
  K("Prévois ton stock 3 à 4 semaines avant {a}.", "Plan your stock 3 to 4 weeks before {a}.", "Prevedi il tuo stock 3 o 4 settimane prima di {a}.", "Prevé tu stock 3 o 4 semanas antes de {a}.", "Plane deinen Bestand 3 bis 4 Wochen vor {a}.");
  K("prix de vente moyen", "average selling price", "prezzo di vendita medio", "precio de venta medio", "durchschnittlicher Verkaufspreis");
  K("prix du ballot", "bale price", "prezzo della balla", "precio del fardo", "Ballenpreis");
  K("Publier {n}", "Publish {n}", "Pubblicare {n}", "Publicar {n}", "{n} veröffentlichen");
  K("Rapidité de vente", "Speed of sale", "Rapidità di vendita", "Rapidez de venta", "Verkaufsgeschwindigkeit");
  K("Régularité", "Consistency", "Regolarità", "Regularidad", "Regelmäßigkeit");
  K("Renseigner le motif de {n}", "Fill in the reason for {n}", "Indicare il motivo di {n}", "Indicar el motivo de {n}", "Grund für {n} angeben");
  K("Rentabilisé : tout ce qui reste à vendre est du bénéfice.", "Paid back: everything left to sell is profit.", "Ripagata: tutto ciò che resta da vendere è utile.", "Rentabilizado: todo lo que queda por vender es beneficio.", "Amortisiert: Alles, was noch zu verkaufen ist, ist Gewinn.");
  K("Résultat", "Result", "Risultato", "Resultado", "Ergebnis");
  K("Revoir tes prix d'achat et tes frais : la marge est sous 30 %", "Review your purchase prices and fees: the margin is below 30 %", "Rivedi i prezzi d'acquisto e le commissioni: il margine è sotto il 30 %", "Revisa tus precios de compra y tus gastos: el margen está por debajo del 30 %", "Prüfe deine Einkaufspreise und Gebühren: Die Marge liegt unter 30 %");
  K("Rien d'urgent : continue sur ta lancée.", "Nothing urgent: keep up the momentum.", "Niente di urgente: continua così.", "Nada urgente: sigue con ese impulso.", "Nichts Dringendes: Mach weiter so.");
  K("Rythme : {r} ventes par semaine depuis l'entrée du ballot.", "Pace: {r} sales per week since the bale came in.", "Ritmo: {r} vendite a settimana dall'ingresso della balla.", "Ritmo: {r} ventas por semana desde la entrada del fardo.", "Tempo: {r} Verkäufe pro Woche seit dem Eingang des Ballens.");
  K("Rythme stable : environ {a} projetés ce mois-ci, comme {m}.", "Steady pace: about {a} projected this month, like {m}.", "Ritmo stabile: circa {a} previsti questo mese, come {m}.", "Ritmo estable: unos {a} previstos este mes, como {m}.", "Stabiles Tempo: etwa {a} für diesen Monat prognostiziert, wie {m}.");
  K("Score du mois", "Score of the month", "Punteggio del mese", "Puntuación del mes", "Monatsbewertung");
  K("Score, points forts, points à améliorer et plan d'action.", "Score, strengths, points to improve and action plan.", "Punteggio, punti di forza, punti da migliorare e piano d'azione.", "Puntuación, puntos fuertes, puntos a mejorar y plan de acción.", "Bewertung, Stärken, Verbesserungspunkte und Aktionsplan.");
  K("Surveiller le ballot « {b} » : {p} % du prix récupéré", "Keep an eye on the bale « {b} »: {p} % of the price recovered", "Tieni d'occhio la balla « {b} »: {p} % del prezzo recuperato", "Vigila el fardo « {b} »: {p} % del precio recuperado", "Ballen « {b} » im Auge behalten: {p} % des Preises zurückgeholt");
  K("Ton rapport de {m} est prêt", "Your {m} report is ready", "Il tuo rapporto di {m} è pronto", "Tu informe de {m} está listo", "Dein Bericht für {m} ist fertig");
  K("Tout le ballot est vendu.", "The whole bale is sold.", "Tutta la balla è venduta.", "Todo el fardo está vendido.", "Der ganze Ballen ist verkauft.");
  K("Ventes les moins rentables", "Least profitable sales", "Vendite meno redditizie", "Ventas menos rentables", "Am wenigsten profitable Verkäufe");
  K("Ventes par mois", "Sales per month", "Vendite al mese", "Ventas por mes", "Verkäufe pro Monat");
  K("Voir le rapport", "See the report", "Vedi il rapporto", "Ver el informe", "Bericht ansehen");
  K("Y aller", "Go", "Vai", "Ir", "Hingehen");
  K("Analyse détaillée", "Detailed analysis", "Analisi dettagliata", "Análisis detallado", "Detaillierte Analyse");
  K("Comparer deux périodes", "Compare two periods", "Confronta due periodi", "Comparar dos periodos", "Zwei Zeiträume vergleichen");
  K("Saisonnalité", "Seasonality", "Stagionalità", "Estacionalidad", "Saisonalität");
}
