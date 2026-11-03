import { app } from '../state.js';
import { $, LSg, LSs } from './core.js';

/* ---------- Bilan : trois onglets sous la courbe et l'objectif ---------- */
/* Finances (trésorerie, fiscal, rapports, bénéfice, dépenses, graphiques de gains), Activité (ventes en calendrier,
   défis, catégories, marques, live) et Stock (stock actuel, provenance, qualité des achats, fournitures).
   Chaque carte reçoit la classe de son onglet ; le CSS masque les autres. Le dernier onglet ouvert est retenu. */
const TABS = [['m', 'Finances'], ['a', 'Activité'], ['s', 'Stock']];
const BY_TOOL = { fisc: 'm', treso: 'm', rapport: 'm', calcom: 'a', defis: 'a' };
const BY_CK = { seuil: 'm', cohorte: 's', fourn: 's', live: 'a', planning: 'a' };
const BY_SEC = { 'Ventes': 'a', 'Dépenses': 'm', 'Stock actuel': 's', 'Six derniers mois': 'm', 'Par plateforme': 'm', 'Par compte': 'm', 'Par catégorie': 'a', 'Meilleures marques': 'a', 'Provenance': 's', 'Retours': 'a', 'Analyse par ballot': 's' };
const FIXED = el => el.matches('.ap, .dsa, .gcard, .empty, .btabs, [data-ck="courbe"], [data-ck="today"], button.btn');

export const tabOf = el => {
  if (el.dataset.tool) return BY_TOOL[el.dataset.tool] || 'm';
  if (el.classList.contains('hero') || el.classList.contains('kpis')) return 'm';
  if (el.dataset.ck && BY_CK[el.dataset.ck]) return BY_CK[el.dataset.ck];
  const h = el.querySelector('h3[data-sec]');
  if (h && BY_SEC[h.dataset.sec]) return BY_SEC[h.dataset.sec];
  return el.classList.contains('minic') ? 'a' : 'm';
};
let tab = LSg('bilTab', 'm');
if (!TABS.some(x => x[0] === tab)) tab = 'm';

function barHTML() {
  return `<div class="dsa btabs" role="tablist" aria-label="${t('Bilan')}">${TABS.map(([k, l]) => `<button type="button" role="tab" class="chip${k === tab ? ' on' : ''}" aria-selected="${k === tab}" data-bt="${k}">${t(l)}</button>`).join('')}</div>`;
}

const renderDash0 = app.renderDash;
app.renderDash = function () {
  renderDash0.apply(this, arguments);
  const box = $('dsh');
  if (!box || !app.loaded) return;
  const items = [...box.children].filter(el => !FIXED(el));
  /* rien à classer, ou bilan réduit du mode simple : pas d'onglets */
  if (!items.length || items.every(el => el.style.display === 'none')) { box.querySelectorAll('.btabs').forEach(b => b.remove()); delete box.dataset.bt; return; }
  items.forEach(el => { el.classList.remove('bt-m', 'bt-a', 'bt-s'); el.classList.add('bt-' + tabOf(el)); });
  /* la barre se place juste avant la première carte classée */
  box.querySelectorAll('.btabs').forEach(b => b.remove());
  items[0].insertAdjacentHTML('beforebegin', barHTML());
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
