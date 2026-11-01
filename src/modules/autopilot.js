import { app } from '../state.js';
import { $, LSg, avail, days, esc, eur, fd, ok, title, today } from './core.js';
import { CFG0 } from './settings-core.js';
import { advice } from './advice.js';
import { colisList } from './colis.js';
import { pendingSales } from './finalisation.js';
import { incomplete } from './complete.js';
import { fournLow } from './supplies-planning.js';
import { goalCalc, goalKinds } from './goals.js';
import { bulkMod, bulkUndo } from './buyers.js';
import { fiscStatus } from './fiscal.js';
import { go } from './nav.js';

/* ---------- Max Autopilot, phase 1 : « Ma journée » ---------- */
/* Un moteur de tâches calcule ce qu'il y a à faire d'après tes données (des règles, pas d'IA) et propose des lots à valider.
   Niveaux : Manuel (Max liste, tu fais), Assisté (Max prépare un lot, tu valides : par défaut), Automatique encadré (pas encore disponible).
   Chaque lot appliqué est inscrit dans le journal, et peut être annulé. */
Object.assign(CFG0, { apMode: 'assist', apLog: [], apStats: { lots: 0, items: 0, min: 0 } });

export const AP_MODES = [['manual', 'Manuel', 'Max liste les tâches, tu fais tout'], ['assist', 'Assisté', 'Max prépare, tu valides'], ['auto', 'Automatique encadré', 'Bientôt']];
const MIN = { fin: .3, colis: .5, pub: 1, prix: 1.5 };   /* minutes économisées par pièce, estimation */
const MAXI = 5;                                         /* éléments montrés par tâche */
export const apMode = () => (app.cfg.apMode === 'manual' ? 'manual' : 'assist');

/* ---- lots proposés : chaque ligne = une pièce, ce qui change, et le texte à montrer ---- */
export function batchOf(kind) {
  const td = today();
  if (kind === 'fin') return pendingSales().map(p => ({ p, patch: { fin: td }, txt: t('Marquer finalisée') + ' · ' + eur(p.pv || 0) }));
  if (kind === 'colis') return colisList().map(p => ({ p, patch: { exp: td }, txt: t('Colis prêt') + (p.bac ? ' · ' + t('Bac {b}', { b: p.bac }) : '') }));
  if (kind === 'pub') return app.P.filter(p => avail(p) && !ok(p.pub)).map(p => ({ p, patch: { pub: td }, txt: t('Marquer publiée') }));
  if (kind === 'prix') {
    return app.P.filter(p => avail(p) && ok(p.pub) && days(p.pub, td) >= 45).map(p => ({ p, a: advice(p) })).filter(x => x.a && x.a.ok && x.a.reco > 0 && !(x.p.pvise > 0 && x.p.pvise <= x.a.reco))
      .sort((a, b) => days(b.p.pub, td) - days(a.p.pub, td)).map(x => ({ p: x.p, patch: { pvise: x.a.reco }, txt: (x.p.pvise > 0 ? eur(x.p.pvise) + ' → ' : '') + t('prix conseillé {p}', { p: eur(x.a.reco) }) }));
  }
  return [];
}

/* ---- les tâches, de la plus importante à la moins importante ---- */
export function tasksToday() {
  const T = [], A = app.P.filter(avail), td = today(), mk = (id, tone, n, ttl, why, o) => T.push(Object.assign({ id, tone, n, title: ttl, why }, o));
  const f = fiscStatus();
  if (f.pl && f.pct >= .75) mk('plafond', f.pct >= .9 ? 'r' : 'o', Math.round(f.pct * 100), t('Plafond micro : {p} %', { p: Math.round(f.pct * 100) }), f.cross ? t('À ce rythme tu le dépasses vers le {d}.', { d: fd(f.cross) }) : t('Il te reste {r}.', { r: eur(f.reste) }), { go: 'fisc', btn: t('Ouvrir la ligne fiscale') });
  const fin = batchOf('fin'); if (fin.length) mk('fin', 'o', fin.length, t(fin.length > 1 ? '{n} ventes à finaliser' : '{n} vente à finaliser', { n: fin.length }), t('Elles comptent dans ton chiffre d\'affaires à déclarer une fois finalisées.'), { kind: 'fin', go: 'sales:fin' });
  const col = batchOf('colis'); if (col.length) mk('colis', 'r', col.length, t(col.length > 1 ? '{n} colis à préparer' : '{n} colis à préparer', { n: col.length }), t('Les acheteurs attendent leur envoi : les plus anciens d\'abord.'), { kind: 'colis', go: 'colis' });
  const pub = batchOf('pub'); if (pub.length) mk('pub', 'o', pub.length, t(pub.length > 1 ? '{n} pièces à publier' : '{n} pièce à publier', { n: pub.length }), t('Elles ne peuvent pas se vendre tant qu\'elles ne sont pas en ligne.'), { kind: 'pub', go: 'list:Apub' });
  const prix = batchOf('prix'); if (prix.length) mk('prix', 'n', prix.length, t(prix.length > 1 ? '{n} prix à examiner' : '{n} prix à examiner', { n: prix.length }), t('En ligne depuis plus de 45 jours : le prix conseillé peut accélérer la vente.'), { kind: 'prix', go: 'list:Enligne' });
  const inc = A.filter(incomplete).length + app.P.filter(p => !avail(p) && incomplete(p)).length; if (inc) mk('inc', 'n', inc, t(inc > 1 ? '{n} fiches à compléter' : '{n} fiche à compléter', { n: inc }), t('Il manque la grade, l\'état ou le type : 10 fiches en 2 minutes.'), { go: 'complete', btn: t('Compléter') });
  const kind = goalKinds().find(k => goalCalc(k, 'm')), g = kind && goalCalc(kind, 'm');
  if (g && g.cur < g.g && +td.slice(8) >= 15) mk('goal', 'n', Math.round(g.pct * 100), t('Objectif du mois : {p} %', { p: Math.round(g.pct * 100) }), t('Il reste {r} pour l\'atteindre.', { r: eur(g.reste) }), { go: 'courbe', btn: t('Voir l\'objectif') });
  const fo = fournLow(); if (fo.length) mk('fourn', 'o', fo.length, t('À racheter : {n}', { n: fo.map(x => x.n).slice(0, 2).join(', ') }), t('Ton stock de fournitures est bas.'), { go: 'fourn', btn: t('Voir les fournitures') });
  const lb = LSg('lastBackup', ''); if (app.P.length && (!lb || days(lb, td) >= 7)) mk('backup', 'n', 0, t('Fais une sauvegarde'), lb ? t('Dernière sauvegarde il y a {n} jours.', { n: days(lb, td) }) : t('Aucune sauvegarde JSON faite pour l\'instant.'), { go: 'set', btn: t('Sauvegarder') });
  return T;
}

/* ---- appliquer un lot, avec journal et annulation ---- */
export function applyBatch(kind, ids) {
  const plan = batchOf(kind).filter(x => ids.includes(x.p.id));
  if (!plan.length) return 0;
  const patch = Object.fromEntries(plan.map(x => [x.p.id, x.patch]));
  const out = bulkMod(plan.map(x => x.p.id), q => Object.assign(q, patch[q.id]));
  const n = out.length, min = Math.round(n * (MIN[kind] || 0) * 10) / 10, st = Object.assign({ lots: 0, items: 0, min: 0 }, app.cfg.apStats);
  const entry = { t: Date.now(), k: kind, n, ids: out.map(x => x.q.id) };
  app.setCfg({ apStats: { lots: st.lots + 1, items: st.items + n, min: Math.round((st.min + min) * 10) / 10 }, apLog: [entry, ...(app.cfg.apLog || [])].slice(0, 60) });
  app.toast(t('{n} modifications appliquées', { n }), () => {
    bulkUndo(out);
    const s2 = Object.assign({ lots: 0, items: 0, min: 0 }, app.cfg.apStats);
    app.setCfg({ apStats: { lots: Math.max(0, s2.lots - 1), items: Math.max(0, s2.items - n), min: Math.max(0, Math.round((s2.min - min) * 10) / 10) }, apLog: (app.cfg.apLog || []).map(e => e.t === entry.t ? Object.assign({}, e, { undone: 1 }) : e) });
    app.renderAll();
  }, 8000);
  app.renderAll();
  return n;
}

/* ---- écran : carte « Ma journée » en haut du Bilan ---- */
let openId = '', excl = new Set(), showLog = false;
const KIND_LABEL = { fin: 'Ventes finalisées', colis: 'Colis prêts', pub: 'Pièces publiées', prix: 'Prix mis à jour' };
function taskHTML(x) {
  const mode = apMode(), batch = x.kind && mode === 'assist', isOpen = openId === x.id && batch;
  const body = isOpen ? (() => {
    const L = batchOf(x.kind), shown = L.slice(0, MAXI), nSel = L.filter(y => !excl.has(y.p.id)).length;
    return `<div class="apl">${shown.map(y => `<label class="apr"><input type="checkbox" data-aps="${esc(y.p.id)}"${excl.has(y.p.id) ? '' : ' checked'}><span><b>${esc(title(y.p))}${y.p.taille ? ' · ' + esc(y.p.taille) : ''}</b><small>${esc(y.txt)}</small></span></label>`).join('')}${L.length > MAXI ? `<div class="hint">${t('{n} autres dans la liste complète.', { n: L.length - MAXI })} <button type="button" class="lnk" data-ap="go:${esc(x.go || '')}">${t('Voir tout')}</button></div>` : ''}</div>
      <div class="acts two"><button type="button" class="btn" data-ap="do:${x.kind}"${nSel ? '' : ' disabled'}>${t('Appliquer à {n}', { n: nSel })}</button><button type="button" class="btn sec" data-ap="close">${t('Fermer')}</button></div>`;
  })() : '';
  return `<div class="apt t-${x.tone}${isOpen ? ' open' : ''}"><button type="button" class="aph" data-ap="${batch ? 'open:' + x.id : 'go:' + (x.go || '')}"><span class="apn">${x.n || '·'}</span><span class="apx"><b>${esc(x.title)}</b><small>${esc(x.why)}</small></span><span class="apb">${batch ? (isOpen ? '▴' : t('À valider')) : esc(x.btn || t('Ouvrir'))}</span></button>${body}</div>`;
}
export function journeeHTML() {
  if (!app.P.length) return '';
  const T = tasksToday(), mode = apMode(), st = Object.assign({ lots: 0, items: 0, min: 0 }, app.cfg.apStats), log = app.cfg.apLog || [];
  const cnt = k => (T.find(x => x.id === k) || {}).n || 0, hi = new Date().getHours(), hello = hi < 12 ? t('Bonjour') : hi < 18 ? t('Bon après-midi') : t('Bonsoir');
  return `<div class="card tdy ap" data-ck="today" data-lb="${esc(t('Ma journée'))}"><h3 style="margin:0 0 4px">${t('Ma journée')}</h3><p class="sub" style="margin:0 0 10px">${hello} ! ${T.length ? t(T.length > 1 ? 'Voici tes {n} priorités.' : 'Voici ta priorité.', { n: T.length }) : t('Tout est à jour : rien d\'urgent aujourd\'hui.')}</p>
   <div class="apc"><div><b>${cnt('pub')}</b><span>${t('à publier')}</span></div><div><b>${cnt('colis')}</b><span>${t('à préparer')}</span></div><div><b>${cnt('prix')}</b><span>${t('à relancer')}</span></div></div>
   ${T.map(taskHTML).join('')}
   <div class="apm" role="group" aria-label="${esc(t('Niveau d\'automatisation'))}">${AP_MODES.map(([k, l, d]) => `<button type="button" class="${mode === k ? 'on' : ''}" data-ap="mode:${k}"${k === 'auto' ? ' disabled' : ''} title="${esc(t(d))}">${t(l)}</button>`).join('')}</div>
   <div class="hint" style="margin:6px 0 0">${t(AP_MODES.find(m => m[0] === mode)[2])}.</div>
   ${st.lots ? `<div class="hint" style="margin:8px 0 0">${t('Avec Max : {l} lots, {n} modifications, environ {m} min gagnées (estimation).', { l: st.lots, n: st.items, m: Math.round(st.min) })}</div>` : ''}
   ${log.length ? `<button type="button" class="lnk" data-ap="log" style="margin-top:8px">${showLog ? t('Masquer le journal') : t('Journal des actions')}</button>` : ''}
   ${showLog ? `<div class="apj">${log.slice(0, 15).map(e => `<div class="${e.undone ? 'un' : ''}"><span>${new Date(e.t).toLocaleString(app.LOC, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span><b>${t(KIND_LABEL[e.k] || e.k)} · ${e.n}</b>${e.undone ? `<em>${t('annulé')}</em>` : ''}</div>`).join('')}</div>` : ''}
  </div>`;
}
app.journeeHTML = journeeHTML;
app.tasksToday = tasksToday;

function goTo(spec) {
  const [k, v] = String(spec).split(':');
  if (k === 'sales') { app.salesFilter(v || 'all'); return go('sales'); }
  if (k === 'list') { app.filt = v || 'Tous'; app.lim = 60; return go('list'); }
  if (k === 'set') return go('set');
  if (k) app.openTool(k);
}
$('dsh').addEventListener('click', e => {
  const b = e.target.closest('[data-ap]'); if (!b) return;
  const [a, v] = [b.dataset.ap.split(':')[0], b.dataset.ap.split(':').slice(1).join(':')];
  if (a === 'open') { openId = openId === v ? '' : v; excl = new Set(); return app.renderDash(); }
  if (a === 'close') { openId = ''; return app.renderDash(); }
  if (a === 'go') return goTo(v);
  if (a === 'log') { showLog = !showLog; return app.renderDash(); }
  if (a === 'mode') { if (v !== 'auto') app.setCfg({ apMode: v }); openId = ''; return app.renderDash(); }
  if (a === 'do') { const ids = batchOf(v).filter(y => !excl.has(y.p.id)).map(y => y.p.id); openId = ''; excl = new Set(); applyBatch(v, ids); }
});
$('dsh').addEventListener('change', e => {
  const c = e.target.closest('[data-aps]'); if (!c) return;
  c.checked ? excl.delete(c.dataset.aps) : excl.add(c.dataset.aps);
  app.renderDash();
});
