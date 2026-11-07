import { app } from '../state.js';
import { $, LSg, LSs, age, avail, days, dj, eur, eurR, ok, today } from './core.js';
import { bilCtx } from './dashboard.js';
import { incomplete } from './complete.js';
import { streakInfo } from './gamification.js';
import { tresoData } from './treasury.js';

/* ---------- Bilan : trois onglets, chacun avec sa couleur ---------- */
/* Sous l'objectif : Finances (vert), Activité (bleu), Stock (orange). Chaque onglet montre 6 indicateurs clés en haut,
   puis tous ses graphiques ouverts en petit : un appui agrandit le graphique sur place, un appui sur son titre le rétrécit.
   Le dernier onglet ouvert est retenu. */
const TABS = [['m', 'Finances'], ['a', 'Activité'], ['s', 'Stock']];
const BY_TOOL = { treso: 'm', rapport: 'm', fisc: 'm', calcom: 'a', defis: 'a' };
const BY_CK = { seuil: 'm', cohorte: 's', fourn: 's', live: 'a', planning: 'a' };
const BY_SEC = { 'Ventes': 'a', 'Dépenses': 'm', 'Stock actuel': 's', 'Six derniers mois': 'm', 'Par plateforme': 'm', 'Par compte': 'm', 'Par catégorie': 'a', 'Meilleures marques': 'a', 'Provenance': 's', 'Retours': 'a', 'Analyse par ballot': 's' };
const FIXED = el => el.matches('.ap, .dsa, .gcard, .hero, .empty, .btabs, .btiles, [data-ck="today"], button.btn');

export const tabOf = el => {
  if (el.dataset.tool) return BY_TOOL[el.dataset.tool] || 'm';
  if (el.classList.contains('kpis')) return 'm';
  if (el.dataset.ck && BY_CK[el.dataset.ck]) return BY_CK[el.dataset.ck];
  const h = el.querySelector('h3[data-sec]');
  if (h && BY_SEC[h.dataset.sec]) return BY_SEC[h.dataset.sec];
  return el.classList.contains('minic') ? 'a' : 'm';
};
let tab = LSg('bilTab', 'm');
if (!TABS.some(x => x[0] === tab)) tab = 'm';
const big = new Set();   /* graphiques agrandis : ils le restent quand le Bilan est redessiné */
const keyOf = el => el.dataset.ck || (el.querySelector('h3[data-sec]') || {}).dataset?.sec || (el.querySelector('h3') || {}).textContent || '';

/** Les 6 indicateurs de chaque onglet : [valeur, libellé, outil à ouvrir au toucher]. */
export function tilesOf(k) {
  const S = bilCtx.S || { n: 0, ca: 0, ben: 0, marge: 0, panier: 0, delai: 0 }, A = app.P.filter(avail), td = today();
  if (k === 'm') {
    const dep = (app.DEP || []).filter(d => ok(d.date) && (!bilCtx.from || d.date >= bilCtx.from)).reduce((a, d) => a + (d.montant || 0), 0), tr = tresoData();
    return [[eurR(S.ca), t('chiffre d\'affaires')], [S.n ? eurR(S.ben / S.n) : '—', t('bénéfice par vente')], [Math.round(S.marge * 100) + ' %', t('de marge')], [eurR(S.panier), t('panier moyen')], [eurR(dep), t('de dépenses')], [tr ? eurR(tr.now) : '—', t('trésorerie'), 'treso']];
  }
  if (k === 'a') {
    const sold = app.P.filter(p => p.statut === 'Vendu').length, ecoul = app.P.length ? sold / app.P.length : 0;
    return [[S.n, t(S.n > 1 ? 'ventes' : 'vente')], [S.n ? dj(S.delai) : '—', t('délai avant la vente')], [Math.round(ecoul * 100) + ' %', t('pièces vendues')], [app.colisCount ? app.colisCount() : 0, t('colis à préparer'), 'colis'], [streakInfo().n, t('jours de série'), 'trophees'], [A.filter(p => ok(p.pub)).length, t('pièces en ligne')]];
  }
  const imm = A.reduce((a, p) => a + (p.achat || 0), 0), moy = A.length ? A.reduce((a, p) => a + age(p), 0) / A.length : 0;
  return [[A.length, t('pièces en stock')], [eurR(imm), t('argent immobilisé')], [A.length ? dj(moy) : '—', t('ancienneté moyenne')], [A.filter(p => !ok(p.pub)).length, t('à publier')], [A.filter(p => ok(p.pub) && days(p.pub, td) >= 30).length, t('à relancer')], [app.P.filter(incomplete).length, t('fiches à compléter'), 'fiches']];
}
const tilesHTML = k => `<div class="btiles bt-${k}">${tilesOf(k).map(([v, l, tool]) => `<${tool ? 'button type="button"' : 'div'} class="bkt"${tool ? ` data-tool="${tool}"` : ''}><b>${v}</b><span>${l}</span></${tool ? 'button' : 'div'}>`).join('')}</div>`;

function barHTML() {
  return `<div class="dsa btabs" role="tablist" aria-label="${t('Bilan')}">${TABS.map(([k, l]) => `<button type="button" role="tab" class="chip${k === tab ? ' on' : ''}" aria-selected="${k === tab}" data-bt="${k}">${t(l)}</button>`).join('')}</div>`;
}

const renderDash0 = app.renderDash;
const kids = box => [...box.children].filter(el => !FIXED(el));
app.renderDash = function () {
  renderDash0.apply(this, arguments);
  const box = $('dsh');
  if (!box || !app.loaded) return;
  /* le bénéfice net de la période se place juste sous la carte Objectifs (hors onglets) */
  const hero = box.querySelector('.hero'), goal = box.querySelector('.gcard') || box.querySelector('.ap');
  if (hero && goal && goal.nextElementSibling !== hero) goal.after(hero);
  box.querySelectorAll('.btiles, .btabs').forEach(b => b.remove());
  const items = kids(box);
  /* rien à classer, ou bilan réduit du mode simple : pas d'onglets */
  if (!items.length || items.every(el => el.style.display === 'none')) { delete box.dataset.bt; return; }
  items.forEach(el => { el.classList.remove('bt-m', 'bt-a', 'bt-s'); el.classList.add('bt-' + tabOf(el)); });
  /* les anciennes cartes d'indicateurs sont remplacées par les 6 tuiles de l'onglet */
  items.filter(el => el.matches('button.minic, .kpis')).forEach(el => el.remove());
  const rest = kids(box);
  /* graphiques : ouverts, en petit ; un appui les agrandit */
  rest.filter(el => el.classList.contains('card')).forEach(el => {
    el.classList.add('bmini'); el.classList.remove('shut');
    el.classList.toggle('bbig', big.has(keyOf(el)));
  });
  const first = rest[0];
  if (first) first.insertAdjacentHTML('beforebegin', barHTML() + TABS.map(([k]) => tilesHTML(k)).join(''));
  else box.insertAdjacentHTML('beforeend', barHTML() + TABS.map(([k]) => tilesHTML(k)).join(''));
  box.dataset.bt = tab;
};

$('dsh').addEventListener('click', e => {
  const b = e.target.closest('[data-bt]');
  if (!b || !b.classList.contains('chip')) return;
  tab = b.dataset.bt; LSs('bilTab', tab);
  const box = $('dsh');
  box.dataset.bt = tab;
  box.querySelectorAll('.btabs .chip').forEach(c => { const on = c.dataset.bt === tab; c.classList.toggle('on', on); c.setAttribute('aria-selected', String(on)); });
});
/* graphique en petit : un appui l'agrandit (et bloque l'action du clic) ; un appui sur son titre, une fois grand, le rétrécit */
$('dsh').addEventListener('click', e => {
  const c = e.target.closest('.bmini');
  if (!c || !$('dsh').contains(c)) return;
  if (!c.classList.contains('bbig')) { e.preventDefault(); e.stopPropagation(); c.classList.add('bbig'); big.add(keyOf(c)); return; }
  const h = e.target.closest('h3');
  if (h && c.contains(h)) { e.preventDefault(); e.stopPropagation(); c.classList.remove('bbig'); big.delete(keyOf(c)); }
}, true);