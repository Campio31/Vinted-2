import { app } from '../state.js';
import { $, LSg, LSs, addDays, esc, eur, num, ok, sold, today } from './core.js';
import { sheetHead, showSheet } from './tools-index.js';
import { FLAME, MOIS, badgeList, streakInfo } from './gamification.js';
import { defiProg, defiTxt, defisNow } from './challenges.js';
import { rid } from './proofs.js';

/* ---------- Défis et trophées : un seul écran, 3 onglets (En cours, Trophées, Amis) ---------- */
/* Le niveau se calcule à partir de ce que tu fais déjà : rien n'est stocké, donc rien à synchroniser ni à tricher.
   Points : publier une pièce 1, vendre 3, préparer un colis 1, réussir un défi 5. Les pièces d'exemple ne comptent pas. */
export const LEVELS = [
  { n: 'Débutant', min: 0 }, { n: 'Chineur', min: 50 }, { n: 'Confirmé', min: 150 },
  { n: 'Pro', min: 400 }, { n: 'Expert', min: 1000 }, { n: 'Légende', min: 2500 },
];
const DEFI_TYPES = { pub: ['Publier', 'pièces publiées'], sold: ['Vendre', 'ventes'], ca: ['Atteindre', '€ de chiffre d\'affaires'], add: ['Ajouter', 'pièces au stock'] };
const PRE = [['pub', 100], ['sold', 50], ['ca', 1000], ['add', 50]];

export const defisReussis = () => (app.cfg.defis || []).filter(d => defiProg(d) >= d.target);
export function xpData() {
  const R = app.P.filter(p => !p.ex), pubs = R.filter(p => ok(p.pub)).length, sales = R.filter(sold).length, colis = R.filter(p => sold(p) && p.exp).length, med = defisReussis().length;
  return { pubs, sales, colis, med, xp: pubs + 3 * sales + colis + 5 * med };
}
export function levelOf(xp) {
  let i = 0; LEVELS.forEach((l, k) => { if (xp >= l.min) i = k; });
  const cur = LEVELS[i], next = LEVELS[i + 1] || null;
  return { i, cur, next, pct: next ? Math.min(1, (xp - cur.min) / (next.min - cur.min)) : 1, left: next ? next.min - xp : 0 };
}

/* défi proposé quand il n'y en a pas ce mois-ci : un peu plus que le mois dernier */
export function proposeDefi() {
  const m = today().slice(0, 7), prev = addDays(m + '-01', -1).slice(0, 7), R = app.P.filter(p => !p.ex);
  const n = R.filter(p => sold(p) && (p.dv || '').startsWith(prev)).length, pubs = R.filter(p => (p.pub || '').startsWith(prev)).length;
  if (n >= 3) return { type: 'sold', target: Math.max(n + 1, Math.ceil(n * 1.15)), why: t('Tu as vendu {n} pièces le mois dernier : on vise un peu plus.', { n }) };
  if (pubs >= 10) return { type: 'pub', target: Math.max(pubs + 1, Math.ceil(pubs * 1.15)), why: t('Tu as publié {n} pièces le mois dernier : on vise un peu plus.', { n: pubs }) };
  return { type: 'pub', target: 30, why: t('Pour démarrer : publier 30 pièces ce mois-ci, soit une par jour.') };
}

/* carnet de médailles : un mois = une case */
export function carnet() {
  const y = today().slice(0, 4), cur = today().slice(0, 7), D = app.cfg.defis || [];
  return Array.from({ length: 12 }, (_, i) => {
    const k = y + '-' + String(i + 1).padStart(2, '0'), L = D.filter(d => d.m === k);
    return { k, i, s: !L.length ? 'empty' : L.some(d => defiProg(d) >= d.target) ? 'ok' : k === cur ? 'cur' : k < cur ? 'miss' : 'empty' };
  });
}

let tab = 'now';
export function openProgress(t0) { if (t0) tab = t0; draw(); }
app.openTrophees = () => openProgress('now');
app.openDefis = () => openProgress('now');

function nowBody() {
  const x = xpData(), L = levelOf(x.xp), st = streakInfo(), defis = defisNow(), m = today().slice(0, 7);
  const lvl = `<div class="gcard" style="margin-bottom:10px"><div class="gh2"><span>${t('Niveau')}</span><span>${t('{n} points', { n: x.xp })}</span></div><div class="gbig cd">${t(L.cur.n)}</div><div class="rl"><b class="gc-g" style="width:${(L.pct * 100).toFixed(1)}%"></b></div><div class="gl2">${L.next ? t('Encore {n} points pour devenir {l}.', { n: L.left, l: t(L.next.n) }) : t('Niveau maximum atteint.')}</div><div class="gl2" style="margin-top:4px">${t('Publier une pièce 1 point · vendre 3 · préparer un colis 1 · réussir un défi 5')}</div></div>`;
  const ser = `<div class="gcard" style="margin-bottom:10px"><div class="gh2"><span>${t('Série de publication')}</span><span>${t('record {n} j', { n: st.best })}</span></div><div class="gbig cd" style="display:flex;align-items:center;gap:12px"><span class="flm${st.n ? ' on' : ''}">${FLAME}</span>${st.n}<small> ${t(st.n > 1 ? 'jours' : 'jour')}</small></div><div class="gl2">${t(st.today ? 'Tu as déjà publié aujourd\'hui.' : st.n ? 'Publie aujourd\'hui pour garder ta série.' : 'Publie une pièce aujourd\'hui pour lancer une série.')}</div></div>`;
  const card = d => { const g = defiProg(d), pc = Math.min(1, g / d.target); return `<div class="card" style="padding:14px"><div style="display:flex;justify-content:space-between;gap:8px"><b>${esc(defiTxt(d))}</b><span class="gp gc-${pc >= 1 ? 'g' : 'o'}">${Math.round(pc * 100)} %</span></div><div class="rl"><b class="gc-${pc >= 1 ? 'g' : 'o'}" style="width:${(pc * 100).toFixed(1)}%"></b></div><div class="gl2">${t('{a} sur {b}', { a: d.type === 'ca' ? eur(g) : g, b: d.type === 'ca' ? eur(d.target) : d.target })}${pc >= 1 ? ' · ' + t('défi réussi, +5 points') : ''}</div><button type="button" class="btn sm sec" data-ddel="${esc(d.id)}" style="margin-top:6px;width:auto">${t('Supprimer')}</button></div>`; };
  let dm;
  if (defis.length) dm = `<h3 style="margin:16px 0 8px">${t('Défi du mois')}</h3>${defis.map(card).join('')}`;
  else { const p = proposeDefi(); dm = `<h3 style="margin:16px 0 8px">${t('Défi du mois')}</h3><div class="card" style="padding:14px"><span class="l">${t('Proposé pour toi')}</span><b style="display:block;font-size:17px;margin:2px 0">${esc(defiTxt(p))}</b><div class="sub" style="margin:0 0 10px">${esc(p.why)}</div><button type="button" class="btn" data-dacc="1">${t('Accepter ce défi')}</button></div>`; }
  const other = `<div class="card"><h3>${t('Un autre défi')}</h3><div class="chips">${PRE.map(([ty, v]) => `<button type="button" class="chip sm" data-dp="${ty}" data-v="${v}">${esc(defiTxt({ type: ty, target: v }))}</button>`).join('')}</div>
   <div class="row2 fld" style="margin-top:12px"><div><label class="l" for="df_t">${t('Type')}</label><select id="df_t">${Object.entries(DEFI_TYPES).map(([k, v]) => `<option value="${k}">${t(v[0])} (${t(v[1])})</option>`).join('')}</select></div><div><label class="l" for="df_v">${t('Objectif')}</label><input type="text" inputmode="decimal" id="df_v" placeholder="100"></div></div><div class="acts"><button type="button" class="btn sec" id="df_ok">${t('Ajouter ce défi')}</button></div></div>`;
  const C = carnet(), won = C.filter(c => c.s === 'ok').length;
  const nb = `<div class="card"><h3>${t('Carnet de médailles {y}', { y: m.slice(0, 4) })}</h3><p class="sub" style="margin:0 0 10px">${t('Une médaille par mois où tu réussis un défi : {n} sur 12.', { n: won })}</p><div class="med">${C.map(c => `<div class="mdl ${c.s}${c.k === m ? ' now' : ''}"><i>${c.s === 'ok' ? '★' : ''}</i><span>${esc(MOIS[c.i].slice(0, 4).replace(/\.$/, ''))}</span></div>`).join('')}</div></div>`;
  return lvl + ser + dm + other + nb;
}
function tropheesBody() {
  const B = badgeList(), done = B.filter(b => b.ok).length, o = {};
  app.P.forEach(p => { if (sold(p) && ok(p.dv)) { const k = p.dv.slice(0, 7); o[k] = (o[k] || 0) + (p.pv || 0); } });
  const ms = Object.entries(o).sort((a, b) => b[1] - a[1])[0];
  return `${ms ? `<div class="card" style="padding:12px 14px"><span class="l">${t('Record de CA mensuel')}</span><b class="cd" style="font-size:30px">${eur(ms[1])}</b> <span class="sub">${MOIS[+ms[0].slice(5) - 1]} ${ms[0].slice(0, 4)}</span></div>` : ''}
  <p class="sub">${t('{a} sur {b}', { a: tn(done, 'badge', 'badges'), b: B.length })}</p><div class="badges">${B.map(b => `<div class="bdg${b.ok ? ' ok' : ''}"><i>${b.ok ? '<svg viewBox="0 0 24 24"><path d="m5 12 4.500 4.500L19 7"/></svg>' : '<svg viewBox="0 0 24 24"><rect x="6" y="11" width="12" height="9" rx="2"/><path d="M9 11V8a3 3 0 0 1 6 0v3"/></svg>'}</i><b>${esc(b.t)}</b><span>${esc(b.ok ? b.d : b.prog)}</span></div>`).join('')}</div>`;
}
function amisBody() { return `<div class="card"><h3>${t('Classement entre amis')}</h3><div id="am_in" class="hint">${t('Chargement…')}</div></div>`; }

function add(type, v) {
  if (!(v > 0)) return app.toast(t('Indique un objectif'));
  app.setCfg({ defis: [...(app.cfg.defis || []), { id: rid(), type, target: v, m: today().slice(0, 7) }] });
  draw(); app.renderAll();
}
function draw() {
  const tabs = [['now', 'En cours'], ['trophees', 'Trophées'], ['amis', 'Amis']];
  showSheet(sheetHead(t('Défis et trophées')) + `<div class="chips" style="margin-bottom:12px">${tabs.map(([k, l]) => `<button type="button" class="chip sm${tab === k ? ' on' : ''}" data-ptab="${k}">${t(l)}</button>`).join('')}</div>` + (tab === 'trophees' ? tropheesBody() : tab === 'amis' ? amisBody() : nowBody()));
  $('shc').onclick = e => {
    if (e.target.closest('[data-am]')) return app.amisClick(e);
    const tb = e.target.closest('[data-ptab]'); if (tb) { tab = tb.dataset.ptab; return draw(); }
    if (e.target.closest('[data-dacc]')) { const p = proposeDefi(); return add(p.type, p.target); }
    const p = e.target.closest('[data-dp]'); if (p) return add(p.dataset.dp, +p.dataset.v);
    if (e.target.closest('#df_ok')) return add($('df_t').value, num($('df_v').value));
    const x = e.target.closest('[data-ddel]'); if (x) { app.setCfg({ defis: (app.cfg.defis || []).filter(d => d.id !== x.dataset.ddel) }); draw(); app.renderAll(); }
  };
  if (tab === 'amis') app.amisInit();
}

/* message quand tu montes de niveau (le premier calcul ne dit rien : on ne félicite pas pour l'existant) */
let lvT = null;
export function checkLevel() {
  if (app.importing || !app.loaded || !app.P.length) return;
  const L = levelOf(xpData().xp), seen = LSg('lvlSeen', null);
  if (seen === null) { LSs('lvlSeen', L.i); return; }
  if (L.i > seen) { LSs('lvlSeen', L.i); app.toast(t('Niveau {l} atteint !', { l: t(L.cur.n) }), null, 5000); }
}
const scheduleBadges0 = app.scheduleBadges;
app.scheduleBadges = function () { scheduleBadges0(); clearTimeout(lvT); lvT = setTimeout(checkLevel, 1000); };
