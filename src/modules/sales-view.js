import { app } from '../state.js';
import { $, LSg, LSs, addDays, esc, eur, eurR, fd, ok, profit, sold, title, today } from './core.js';
import { hydrate, phImg } from './photos.js';
import { go } from './nav.js';
import { catSvg } from './stock-view.js';
import { colisList } from './colis.js';
import { isFinal, pendingSales } from './finalisation.js';
import { activeChips, activeCount, facet, filterLabel, openFilters } from './filters.js';

app.renderSales = renderSales;

/* ---------- onglet Vente : toutes les ventes ---------- */
/* L'onglet Stock ne montre que le stock ; ici, toutes les pièces vendues, les plus récentes d'abord.
   La vente rapide en direct (ancien onglet Live) est dans Outils, Live. */
let flt = LSg('salesFlt', 'all');
let lim = 60;
let cf = ''; /* filtre par compte de vente ('' = tous) */
const host = $('v-sales');
host.innerHTML = '<div class="srch"><input type="search" id="sq" autocomplete="off" autocapitalize="none" spellcheck="false"></div><div class="chips" id="sflt" style="margin-bottom:12px"></div><div class="chips" id="scf" style="margin:-4px 0 12px"></div><div id="ssum"></div><div id="slst"></div>';

app.salesFilter = k => { flt = k; LSs('salesFlt', k); lim = 60; };
const isPrep = p => sold(p) && !p.exp && p.vt;
const row = p => {
  const pr = profit(p);
  return `<button type="button" class="li" data-id="${esc(p.id)}">${p.photo ? phImg(p.photo, 'th') : `<div class="th">${catSvg(p)}</div>`}<div class="m"><b>${esc(title(p))}${p.ex ? '<span class="ex">' + t('exemple') + '</span>' : ''}</b><small>${esc([p.taille, (app.hasComptes() ? app.cptName(p) : '') || tv(p.canal || 'Vinted'), p.acheteur ? '@' + p.acheteur : '', ok(p.dv) ? fd(p.dv) : ''].filter(Boolean).join(' · '))}${isPrep(p) ? ' <span class="tag x">' + t('à préparer') + '</span>' : ''}${isFinal(p) || !app.countsForFisc(p) ? '' : ' <span class="tag">' + t('à finaliser') + '</span>'}</small></div><div class="p ${pr >= 0 ? 'g' : 'b'}">${pr >= 0 ? '+' : ''}${eur(pr)}<small>${t('vendu {p}', { p: eur(p.pv) })}</small></div></button>`;
};

/* filtres de la fenêtre « Filtres » (même système que le Stock, voir filters.js) */
const ADVS = ['pf', 'cat', 'marque', 'per'];
const adv = Object.assign({ pf: '', cat: '', marque: '', per: '', tri: '' }, LSg('salesAdv', {}));
const perOk = p => {
  if (!adv.per) return true;
  const d = p.dv || '', t0 = today();
  return adv.per === 'mo' ? d.slice(0, 7) === t0.slice(0, 7) : adv.per === 'yr' ? d.slice(0, 4) === t0.slice(0, 4) : d >= addDays(t0, -(+adv.per));
};
const advOk = p => (!adv.pf || (p.canal || 'Vinted') === adv.pf) && (!adv.cat || p.cat === adv.cat) && (!adv.marque || p.marque === adv.marque) && perOk(p);
const advSave = () => { const o = Object.assign({}, adv); delete o.st; delete o.cf; LSs('salesAdv', o); };
function openSalesFilters() {
  adv.st = flt; adv.cf = cf;
  const S = () => app.P.filter(sold);
  openFilters({
    title: t('Filtres des ventes'), state: adv,
    groups: () => {
      const L = S(), F = salesLists(), CP = app.hasComptes() ? app.comptes() : [];
      return [
        { k: 'st', l: t('Statut'), o: [['all', t('Toutes')], ['month', t('Ce mois-ci')], ['prep', t('À préparer')], ['fin', t('À finaliser')]].map(([k, l]) => [k, l, F[k].length]) },
        ...(CP.length > 1 ? [{ k: 'cf', l: t('Compte de vente'), o: CP.map(c => [c.id, c.n, L.filter(p => (app.compteOf(p) || {}).id === c.id).length]) }] : []),
        { k: 'per', l: t('Période'), o: [['7', t('7 derniers jours')], ['30', t('30 derniers jours')], ['mo', t('Ce mois-ci')], ['yr', t('Cette année')]] },
        { k: 'pf', l: t('Plateforme'), o: facet(L, p => p.canal || 'Vinted').map(([v, n]) => [v, tv(v), n]) },
        { k: 'cat', l: t('Catégorie'), o: facet(L, p => p.cat).map(([v, n]) => [v, tv(v), n]) },
        { k: 'marque', l: t('Marque'), o: facet(L, p => p.marque).map(([v, n]) => [v, v, n]) },
        { k: 'tri', l: t('Trier par'), o: [['benD', t('Bénéfice, du plus grand')], ['benA', t('Bénéfice, du plus petit')], ['prixD', t('Prix de vente, du plus cher')], ['old', t('Plus anciennes d\'abord')]] },
      ].filter(g => g.o.length);
    },
    changed: () => { flt = adv.st || 'all'; LSs('salesFlt', flt); cf = adv.cf || ''; lim = 60; advSave(); renderSales(); },
    count: () => {
      const F = salesLists();
      return F[adv.st || 'all'].filter(p => !adv.cf || (app.compteOf(p) || {}).id === adv.cf).filter(advOk).length;
    },
    clear: () => { ADVS.concat('tri').forEach(k => { adv[k] = ''; }); adv.st = 'all'; adv.cf = ''; },
  });
}

export function salesLists() {
  const S = app.P.filter(sold), mo = today().slice(0, 7);
  return { all: S, month: S.filter(p => (p.dv || '').slice(0, 7) === mo), prep: colisList(), fin: pendingSales() };
}

function renderSales() {
  const F = salesLists(), q = $('sq').value.trim().toLowerCase();
  $('sq').placeholder = t('Rechercher une vente (pièce, @pseudo, code…)');
  if (!(flt in F)) flt = 'all';
  const nAdv = activeCount(adv, ADVS);
  $('sflt').innerHTML = [['all', 'Toutes'], ['month', 'Ce mois-ci'], ['prep', 'À préparer'], ['fin', 'À finaliser']].map(([k, l]) => `<button type="button" class="chip sm${flt === k ? ' on' : ''}" data-sf="${k}">${t(l)} · ${F[k].length}</button>`).join('') + `<button type="button" class="chip sm fbtn${nAdv ? ' on' : ''}" data-sfadv="1">${filterLabel(nAdv)}</button>`;
  const CP = app.hasComptes() ? app.comptes() : [];
  if (cf && !CP.some(c => c.id === cf)) cf = '';
  $('scf').innerHTML = CP.length > 1 ? [['', t('Tous les comptes'), F[flt].length], ...CP.map(c => [c.id, c.n, F[flt].filter(p => (app.compteOf(p) || {}).id === c.id).length])].map(([k, l, n]) => `<button type="button" class="chip sm${cf === k ? ' on' : ''}" data-cf="${esc(k)}">${esc(l)} · ${n}</button>`).join('') : '';
  const toks = app.searchToks(q), pseudo = q.replace(/^@/, '');
  const TRI = { benD: (a, b) => profit(b) - profit(a), benA: (a, b) => profit(a) - profit(b), prixD: (a, b) => (b.pv || 0) - (a.pv || 0), old: (a, b) => (a.dv || '').localeCompare(b.dv || '') }[adv.tri];
  const L = F[flt].filter(p => !cf || (app.compteOf(p) || {}).id === cf).filter(advOk).filter(p => !q || (toks.length && app.searchScore(p, toks) >= 0) || (p.acheteur || '').toLowerCase().includes(pseudo) || (p.code || '').toLowerCase().includes(q))
    .sort((a, b) => (TRI ? TRI(a, b) : 0) || (b.dv || '').localeCompare(a.dv || '') || (b.vt || 0) - (a.vt || 0));
  const act = activeChips(adv, ADVS, { pf: v => tv(v), cat: v => tv(v), per: v => ({ 7: t('7 derniers jours'), 30: t('30 derniers jours'), mo: t('Ce mois-ci'), yr: t('Cette année') })[v] });
  const ca = L.reduce((a, p) => a + (p.pv || 0), 0), ben = L.reduce((a, p) => a + profit(p), 0), prep = F.prep.length;
  $('ssum').innerHTML = `<div class="card"><div class="kpis ssk"><div class="kpi"><b>${L.length}</b><span>${t(L.length > 1 ? 'ventes' : 'vente')}</span></div><div class="kpi"><b>${eurR(ca)}</b><span>${t('encaissés')}</span></div><div class="kpi"><b>${eurR(ben)}</b><span>${t('de bénéfice')}</span></div></div>${prep && flt !== 'prep' ? `<div class="tdx"><span>${t('{n} à préparer pour l\'envoi', { n: prep })}</span><button type="button" class="btn sec" data-sprep="1">${t('Préparer')}</button></div>` : ''}${flt === 'fin' ? `<div class="tdx"><span>${F.fin.length ? t('Une vente est finalisée quand l\'argent est reçu. Elle compte alors dans ton chiffre d\'affaires à déclarer.') : t('Aucune vente en attente de finalisation.')}</span>${F.fin.length ? `<button type="button" class="btn sec" data-sfin="1">${t('Tout finaliser ({n})', { n: F.fin.length })}</button>` : ''}</div>` : ''}</div>`;
  const page = L.slice(0, lim);
  $('slst').innerHTML = act + (page.length ? page.map(row).join('') + (L.length > lim ? `<button type="button" class="btn sec" id="smore">${t('Afficher plus ({n})', { n: L.length - lim })}</button>` : '')
    : `<div class="card empty">${app.P.some(sold) || q ? t('Aucune vente ici.') : t('Aucune vente pour l\'instant. Les ventes faites depuis une fiche ou en Live apparaissent ici.')}</div>`);
  hydrate();
}

$('sq').addEventListener('input', () => { lim = 60; renderSales(); });
$('scf').onclick = e => { const b = e.target.closest('[data-cf]'); if (b) { cf = b.dataset.cf; lim = 60; renderSales(); } };
$('slst').addEventListener('click', e => {
  const fc = e.target.closest('[data-fclr]');
  if (!fc) return;
  e.stopPropagation();
  if (fc.dataset.fclr === '*') ADVS.forEach(k => { adv[k] = ''; }); else adv[fc.dataset.fclr] = '';
  advSave(); lim = 60; renderSales();
});
$('sflt').onclick = e => { if (e.target.closest('[data-sfadv]')) return openSalesFilters(); const b = e.target.closest('[data-sf]'); if (b) { flt = b.dataset.sf; LSs('salesFlt', flt); lim = 60; renderSales(); } };
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
