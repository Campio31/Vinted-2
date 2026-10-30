import { app } from '../state.js';
import { $, LSg, LSs, esc, eur, eurR, fd, ok, profit, sold, title, today } from './core.js';
import { hydrate, phImg } from './photos.js';
import { go } from './nav.js';
import { catSvg } from './stock-view.js';
import { colisList } from './colis.js';
import { isFinal, pendingSales } from './finalisation.js';

app.renderSales = renderSales;

/* ---------- onglet Vente : toutes les ventes ---------- */
/* L'onglet Stock ne montre que le stock ; ici, toutes les pièces vendues, les plus récentes d'abord.
   La vente rapide en direct (ancien onglet Live) est dans Outils, Live. */
let flt = LSg('salesFlt', 'all');
let lim = 60;
const host = $('v-sales');
host.innerHTML = '<div class="srch"><input type="search" id="sq" autocomplete="off" autocapitalize="none" spellcheck="false"></div><div class="chips" id="sflt" style="margin-bottom:12px"></div><div id="ssum"></div><div id="slst"></div>';

app.salesFilter = k => { flt = k; LSs('salesFlt', k); lim = 60; };
const isPrep = p => sold(p) && !p.exp && p.vt;
const row = p => {
  const pr = profit(p);
  return `<button type="button" class="li" data-id="${esc(p.id)}">${p.photo ? phImg(p.photo, 'th') : `<div class="th">${catSvg(p)}</div>`}<div class="m"><b>${esc(title(p))}${p.ex ? '<span class="ex">' + t('exemple') + '</span>' : ''}</b><small>${esc([p.taille, tv(p.canal || 'Vinted'), p.acheteur ? '@' + p.acheteur : '', ok(p.dv) ? fd(p.dv) : ''].filter(Boolean).join(' · '))}${isPrep(p) ? ' <span class="tag x">' + t('à préparer') + '</span>' : ''}${isFinal(p) ? '' : ' <span class="tag">' + t('à finaliser') + '</span>'}</small></div><div class="p ${pr >= 0 ? 'g' : 'b'}">${pr >= 0 ? '+' : ''}${eur(pr)}<small>${t('vendu {p}', { p: eur(p.pv) })}</small></div></button>`;
};

export function salesLists() {
  const S = app.P.filter(sold), mo = today().slice(0, 7);
  return { all: S, month: S.filter(p => (p.dv || '').slice(0, 7) === mo), prep: colisList(), fin: pendingSales() };
}

function renderSales() {
  const F = salesLists(), q = $('sq').value.trim().toLowerCase();
  $('sq').placeholder = t('Rechercher une vente (pièce, @pseudo, code…)');
  if (!(flt in F)) flt = 'all';
  $('sflt').innerHTML = [['all', 'Toutes'], ['month', 'Ce mois-ci'], ['prep', 'À préparer'], ['fin', 'À finaliser']].map(([k, l]) => `<button type="button" class="chip sm${flt === k ? ' on' : ''}" data-sf="${k}">${t(l)} · ${F[k].length}</button>`).join('');
  const toks = app.searchToks(q), pseudo = q.replace(/^@/, '');
  const L = F[flt].filter(p => !q || (toks.length && app.searchScore(p, toks) >= 0) || (p.acheteur || '').toLowerCase().includes(pseudo) || (p.code || '').toLowerCase().includes(q))
    .sort((a, b) => (b.dv || '').localeCompare(a.dv || '') || (b.vt || 0) - (a.vt || 0));
  const ca = L.reduce((a, p) => a + (p.pv || 0), 0), ben = L.reduce((a, p) => a + profit(p), 0), prep = F.prep.length;
  $('ssum').innerHTML = `<div class="card"><div class="kpis" style="grid-template-columns:repeat(3,minmax(0,1fr));margin-bottom:0"><div class="kpi"><b>${L.length}</b><span>${t(L.length > 1 ? 'ventes' : 'vente')}</span></div><div class="kpi"><b>${eurR(ca)}</b><span>${t('encaissés')}</span></div><div class="kpi"><b>${eurR(ben)}</b><span>${t('de bénéfice')}</span></div></div>${prep && flt !== 'prep' ? `<div class="tdx"><span>${t('{n} à préparer pour l\'envoi', { n: prep })}</span><button type="button" class="btn sec" data-sprep="1">${t('Préparer')}</button></div>` : ''}${flt === 'fin' ? `<div class="tdx"><span>${F.fin.length ? t('Une vente est finalisée quand l\'argent est reçu. Elle compte alors dans ton chiffre d\'affaires à déclarer.') : t('Aucune vente en attente de finalisation.')}</span>${F.fin.length ? `<button type="button" class="btn sec" data-sfin="1">${t('Tout finaliser ({n})', { n: F.fin.length })}</button>` : ''}</div>` : ''}</div>`;
  const page = L.slice(0, lim);
  $('slst').innerHTML = page.length ? page.map(row).join('') + (L.length > lim ? `<button type="button" class="btn sec" id="smore">${t('Afficher plus ({n})', { n: L.length - lim })}</button>` : '')
    : `<div class="card empty">${app.P.some(sold) || q ? t('Aucune vente ici.') : t('Aucune vente pour l\'instant. Les ventes faites depuis une fiche ou en Live apparaissent ici.')}</div>`;
  hydrate();
}

$('sq').addEventListener('input', () => { lim = 60; renderSales(); });
$('sflt').onclick = e => { const b = e.target.closest('[data-sf]'); if (b) { flt = b.dataset.sf; LSs('salesFlt', flt); lim = 60; renderSales(); } };
host.addEventListener('click', e => {
  if (e.target.closest('#smore')) { lim += 60; renderSales(); return; }
  if (e.target.closest('[data-sprep]')) { app.openColis(); return; }
  if (e.target.closest('[data-sfin]')) {
    const L = pendingSales(), old = app.finalize(L);
    renderSales(); app.toast(t('{n} ventes finalisées', { n: L.length }), () => { old.forEach(p => app.save(p)); renderSales(); });
    return;
  }
  const b = e.target.closest('.li[data-id]');
  if (b) app.openSheet(b.dataset.id);
});
$('lv_back').onclick = () => go('sales');
app.openSalesFilter = k => { app.salesFilter(k); go('sales'); };
