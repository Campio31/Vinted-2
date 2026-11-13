import { app } from '../state.js';
import { $, LSg, LSs, addDays, age, avail, days, dj, ok, sold, today, eurR } from './core.js';
import { bilCtx, bilOk, bilRange, stats } from './dashboard.js';
import { incomplete } from './complete.js';
import { streakInfo } from './gamification.js';
import { tresoData } from './treasury.js';
import { scoreOf } from './bilan-extra.js';
import './bilan-plus.js';

/* ---------- Bilan : cinq onglets en haut, chacun avec sa couleur ---------- */
/* Ma journée (violet), Général (rose), Finance (vert), Activité (bleu), Stock (orange). Les onglets prennent la place des filtres, qui passent juste dessous.
   Général garde le bénéfice net (avec le bénéfice du mois, stock acheté compris), les objectifs et le résumé, sur le fond rose de l'onglet.
   Finance, Activité et Stock montrent 6 indicateurs clés avec une flèche de hausse ou de baisse, puis leurs graphiques en petites vignettes rangées comme les indicateurs :
   un toucher agrandit un graphique, un toucher sur son titre le referme. Le dernier onglet et les graphiques ouverts sont retenus. */
const TABS = [['j', 'Ma journée'], ['g', 'Général'], ['m', 'Finance'], ['a', 'Activité'], ['s', 'Stock']];
const TAB_IDS = TABS.map(x => x[0]);
/* couleurs : [fond de l'onglet, texte, fond de l'onglet choisi] */
const COLORS = { j: ['#EEEAFB', '#4A2FA0', '#7B5CD6'], g: ['#FCE7F0', '#99224F', '#D6336C'] };
(() => {
  const css = TAB_IDS.map(x => `#dsh[data-bt="${x}"]>${TAB_IDS.filter(o => o !== x).map(o => `.bt-${o}`).join(`,#dsh[data-bt="${x}"]>`)}{display:none!important}`).join('')
    + Object.entries(COLORS).map(([k, c]) => `.btabs .chip[data-bt="${k}"]{color:${c[1]};background:${c[0]}}.btabs .chip.on[data-bt="${k}"]{background:${c[2]};color:#fff}#dsh[data-bt="${k}"]{--bt:${c[2]}}.bchips.bt-${k} .chip.on{background:${c[2]};border-color:${c[2]};color:#fff}`).join('')
    + '.btiles.bt-g .bkt{background:#FCE7F0;color:#7A1B3D}'
    /* Général : le fond noir devient rose (bénéfice net et objectif), le bénéfice du mois vit dans la carte du bénéfice net */
    + '#dsh[data-bt="g"]{--hero:#C9235F;--hero-on:#fff}#dsh[data-bt="g"] .gcard{--acc:#FFD166;--mint:#A8F0CF;--red:#FFD6D6}#dsh[data-bt="g"] .gcard .gc-pj{color:#FFE9F2}#dsh[data-bt="g"] .gcard .gpj .pjd{background:#FFE9F2}#dsh[data-bt="g"] .gcard .gau .gpjarc{stroke:#FFE9F2}'
    + '.hero .bmo{margin:16px 0 0;padding:14px 0 0;border-top:1px solid rgba(255,255,255,.3);background:none;box-shadow:none;border-radius:0;color:inherit}.hero .bmo .l{color:rgba(255,255,255,.88)}.hero .bmo .hint{color:rgba(255,255,255,.85)}.hero .bmo .bmov{color:#fff!important;font-size:34px!important}.hero .bmo .btn{background:#fff;color:#8f1c47;border:0}'
    /* Finance, Activité, Stock : graphiques en vignettes sur 3 colonnes, comme les indicateurs ; un toucher les agrandit */
    + '#dsh>.bgrid,#dsh>.btiles{grid-column:1/-1;max-width:640px}.bgrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:0 0 12px;align-items:start}'
    + '.bgrid>.card.bgr{margin:0;min-width:0;border-top:3px solid var(--bt);cursor:pointer;position:relative}'
    + '.bgrid>.card.bgr:not(.open){padding:8px;height:132px;overflow:hidden;border-radius:14px}.bgrid>.card.bgr:not(.open) h3{font-size:12px;line-height:1.2;margin:0 0 6px;max-height:29px;overflow:hidden}'
    + '.bgrid>.card.bgr:not(.open) .hd::after,.bgrid>.card.bgr:not(.open) h3::after,.bgrid>.card.bgr:not(.open) h3::before{display:none!important}.bgr:not(.open) .sub,.bgr:not(.open) .calh .ib{display:none!important}'
    + '.bgrid>.card.bgr:not(.open)>.bgv{width:333.33%;transform:scale(.3);transform-origin:0 0;pointer-events:none}'
    + '.bgrid>.card.bgr.open{grid-column:1/-1;cursor:default;box-shadow:inset 4px 0 0 var(--bt)}.bgrid>.card.bgr.open>.hd,.bgrid>.card.bgr.open>h3{cursor:pointer}'
    + '.bt5{display:flex;gap:4px;overflow-x:auto;width:100%;margin:0 0 6px;scrollbar-width:none}.bt5::-webkit-scrollbar{display:none}.bt5 .chip{flex:1 0 auto;white-space:nowrap;min-height:44px;padding:0 9px;font-size:13px}'
    + '.bflt{display:flex;flex-wrap:wrap;gap:8px;align-items:center;width:100%}#per[data-bt="j"] .bflt{display:none}';
  if (typeof document !== 'undefined' && !document.getElementById('bt5css')) { const s = document.createElement('style'); s.id = 'bt5css'; s.textContent = css; document.head.appendChild(s); }
})();
const BY_TOOL = { treso: 'm', rapport: 'm', fisc: 'm', calcom: 'a', defis: 'a' };
const BY_CK = { seuil: 'm', cohorte: 's', fourn: 's', live: 'a', planning: 'a' };
const BY_SEC = { 'Ventes': 'a', 'Dépenses': 'm', 'Stock actuel': 's', 'Six derniers mois': 'm', 'Par plateforme': 'm', 'Par compte': 'm', 'Par catégorie': 'a', 'Meilleures marques': 'a', 'Provenance': 's', 'Retours': 'a', 'Analyse par ballot': 's',
  'D\'où vient chaque euro': 'm', 'Marge par mois': 'm', 'Bénéfice cumulé du mois': 'm', 'Ventes par jour de semaine': 'a', 'Ventes semaine par semaine': 'a', 'Ancienneté du stock': 's', 'Valeur du stock par catégorie': 's', 'Entrées et sorties par mois': 's', 'Comparer deux périodes': 'm', 'Saisonnalité': 'm' };
const FIXED = el => el.matches('.ap, .dsa, .gcard, .hero, .bmo, .bobj, .bsum, .bnote, .empty, .btabs, .btiles, .bchips, [data-ck="today"], button.btn');

export const tabOf = el => {
  if (el.matches('.tdy, .ap, .bnote, [data-ck="today"]')) return 'j';
  if (el.matches('.bsum, .hero, .gcard, .bmo, .bobj, .dsa')) return 'g';
  if (el.dataset.tool) return BY_TOOL[el.dataset.tool] || 'm';
  if (el.classList.contains('kpis')) return 'm';
  if (el.dataset.ck && BY_CK[el.dataset.ck]) return BY_CK[el.dataset.ck];
  const h = el.querySelector('h3[data-sec]');
  if (h && BY_SEC[h.dataset.sec]) return BY_SEC[h.dataset.sec];
  return el.classList.contains('minic') ? 'a' : 'm';
};
let tab = LSg('bilTab', 'g');
if (!TAB_IDS.includes(tab)) tab = 'g';
const OPEN = new Set(LSg('bilOpen', []));   /* graphiques agrandis, gardés d'une fois sur l'autre */
const keyOf = el => el.dataset.ck || (el.querySelector('h3[data-sec]') || {}).dataset?.sec || (el.querySelector('h3') || {}).textContent || '';
/** Prépare une carte-graphique en vignette : le titre reste dehors, tout le reste va dans .bgv (réduit tant que la carte est fermée). */
function vignette(el) {
  el.classList.add('bgr'); el.classList.remove('shut'); el.dataset.bk = keyOf(el);
  const h = el.querySelector('h3'), head = h ? (h.parentElement === el ? h : (h.closest('.calh') || h)) : null, wrap = document.createElement('div'); wrap.className = 'bgv';
  [...el.childNodes].forEach(n => { if (n !== head) wrap.appendChild(n); }); el.appendChild(wrap);
  const open = OPEN.has(el.dataset.bk); el.classList.toggle('open', open); el.setAttribute('role', 'button'); el.tabIndex = 0; el.setAttribute('aria-expanded', String(open));
}
/** Ouvre ou ferme une vignette et retient le choix. */
function basculer(el, on) {
  el.classList.toggle('open', on); el.setAttribute('aria-expanded', String(on));
  if (on) OPEN.add(el.dataset.bk); else OPEN.delete(el.dataset.bk); LSs('bilOpen', [...OPEN]);
}

/* ---- flèches : la période du Bilan face à la période d'avant, de même durée (30 jours si « Tout ») ---- */
function windows() {
  const r = bilRange(), to = r.to || today(), from = r.from || addDays(today(), -29), n = days(from, to) + 1;
  return { from, to, pf: addDays(from, -n), pt: addDays(from, -1) };
}
const soldIn = (a, b) => app.P.filter(p => sold(p) && ok(p.dv) && p.dv >= a && p.dv <= b && bilOk(p));
const depIn = (a, b) => (app.DEP || []).filter(d => ok(d.date) && d.date >= a && d.date <= b).reduce((s, d) => s + (d.montant || 0), 0);
/* état du stock à une date passée, reconstitué avec les dates d'entrée, de publication et de vente */
const stockAt = d => app.P.filter(p => bilOk(p) && ok(p.entree) && p.entree <= d && !(sold(p) && ok(p.dv) && p.dv <= d));
const sumAge = (L, d) => L.length ? L.reduce((a, p) => a + Math.max(0, days(p.entree, d)), 0) / L.length : 0;
const onlineAt = d => stockAt(d).filter(p => ok(p.pub) && p.pub <= d);
const rateAt = d => { const all = app.P.filter(p => bilOk(p) && ok(p.entree) && p.entree <= d); return all.length ? all.filter(p => sold(p) && ok(p.dv) && p.dv <= d).length / all.length : 0; };
const mtr = L => { const S = stats(L); return { n: S.n, ca: S.ca, ben: S.ben, bpv: S.n ? S.ben / S.n : 0, marge: S.marge * 100, panier: S.panier, delai: S.delai }; };

/** Flèche d'une tuile : cur et prev sont comparés ; goodUp dit si la hausse est une bonne nouvelle ; pts = écart en points. */
function arrow(cur, prev, goodUp, pts) {
  if (prev == null || cur == null || (!cur && !prev)) return '<i class="bka">&nbsp;</i>';
  const d = pts ? cur - prev : (prev ? (cur - prev) / Math.abs(prev) * 100 : 100), r = Math.round(d);
  if (!r) return '<i class="bka eq">→</i>';
  const up = d > 0, good = up === goodUp;
  return `<i class="bka ${up ? 'up' : 'dn'} ${good ? 'ok' : 'ko'}" aria-label="${up ? t('en hausse') : t('en baisse')}">${up ? '↑' : '↓'} ${Math.abs(r)}${pts ? ' pt' : ' %'}</i>`;
}

/** Les 6 indicateurs de chaque onglet : [valeur, libellé, outil au toucher, flèche]. */
export function tilesOf(k) {
  const S = bilCtx.S || { n: 0, ca: 0, ben: 0, marge: 0, panier: 0, delai: 0 }, A = app.P.filter(p => avail(p) && bilOk(p)), td = today(), td0 = addDays(td, -30);
  if (k === 'g' || k === 'm' || k === 'a') {
    const W = windows(), c = mtr(soldIn(W.from, W.to)), p = mtr(soldIn(W.pf, W.pt));
    if (k === 'g') {
      const m0 = today().slice(0, 7), d0 = new Date(); d0.setDate(1); d0.setMonth(d0.getMonth() - 1);
      const sc = scoreOf(app.P, m0), sp = scoreOf(app.P, d0.getFullYear() + '-' + String(d0.getMonth() + 1).padStart(2, '0'));
      return [
        [eurR(S.ben), t('bénéfice net'), '', arrow(c.ben, p.ben, true)],
        [eurR(S.ca), t('chiffre d\'affaires'), '', arrow(c.ca, p.ca, true)],
        [Math.round(S.marge * 100) + ' %', t('de marge'), '', arrow(c.marge, p.marge, true, true)],
        [S.n, t(S.n > 1 ? 'ventes' : 'vente'), '', arrow(c.n, p.n, true)],
        [A.length, t('pièces en stock'), '', arrow(stockAt(td).length, stockAt(td0).length, true)],
        [sc.n ? sc.total + ' / 100' : '—', t('score du mois'), '', sc.n && sp.n ? arrow(sc.total, sp.total, true, true) : arrow()]];
    }
    if (k === 'm') {
      const dep = (app.DEP || []).filter(d => ok(d.date) && (!bilCtx.from || d.date >= bilCtx.from) && (!bilRange().to || d.date <= bilRange().to)).reduce((a, d) => a + (d.montant || 0), 0), tr = tresoData();
      return [
        [eurR(S.ca), t('chiffre d\'affaires'), '', arrow(c.ca, p.ca, true)],
        [S.n ? eurR(S.ben / S.n) : '—', t('bénéfice par vente'), '', arrow(c.bpv, p.bpv, true)],
        [Math.round(S.marge * 100) + ' %', t('de marge'), '', arrow(c.marge, p.marge, true, true)],
        [eurR(S.panier), t('panier moyen'), '', arrow(c.panier, p.panier, true)],
        [eurR(dep), t('de dépenses'), '', arrow(depIn(W.from, W.to), depIn(W.pf, W.pt), false)],
        [tr ? eurR(tr.now) : '—', t('trésorerie'), 'treso', tr ? arrow(tr.rate, 0, true) : arrow()]];
    }
    const fp = app.P.filter(bilOk), sd = fp.filter(p => p.statut === 'Vendu').length, ecoul = fp.length ? sd / fp.length : 0;
    return [
      [S.n, t(S.n > 1 ? 'ventes' : 'vente'), '', arrow(c.n, p.n, true)],
      [S.n ? dj(S.delai) : '—', t('délai avant la vente'), '', arrow(c.delai, p.delai, false)],
      [Math.round(ecoul * 100) + ' %', t('pièces vendues'), '', arrow(rateAt(td) * 100, rateAt(td0) * 100, true, true)],
      [app.colisCount ? app.colisCount() : 0, t('colis à préparer'), 'colis', arrow()],
      [streakInfo().n, t('jours de série'), 'trophees', arrow()],
      [A.filter(p => ok(p.pub)).length, t('pièces en ligne'), '', arrow(onlineAt(td).length, onlineAt(td0).length, true)]];
  }
  const imm = L => L.reduce((a, p) => a + (p.achat || 0), 0), s0 = stockAt(td0), s1 = stockAt(td);
  const aPub = (L, d) => L.filter(p => !(ok(p.pub) && p.pub <= d)).length, relance = (L, d) => L.filter(p => ok(p.pub) && p.pub <= d && days(p.pub, d) >= 30).length;
  const moy = A.length ? A.reduce((a, p) => a + age(p), 0) / A.length : 0;
  return [
    [A.length, t('pièces en stock'), '', arrow(s1.length, s0.length, true)],
    [eurR(A.reduce((a, p) => a + (p.achat || 0), 0)), t('argent immobilisé'), '', arrow(imm(s1), imm(s0), false)],
    [A.length ? dj(moy) : '—', t('ancienneté moyenne'), '', arrow(sumAge(s1, td), sumAge(s0, td0), false)],
    [A.filter(p => !ok(p.pub)).length, t('à publier'), '', arrow(aPub(s1, td), aPub(s0, td0), false)],
    [A.filter(p => ok(p.pub) && days(p.pub, td) >= 30).length, t('à relancer'), '', arrow(relance(s1, td), relance(s0, td0), false)],
    [app.P.filter(p => bilOk(p) && incomplete(p)).length, t('fiches à compléter'), 'fiches', arrow()]];
}
const tilesHTML = k => `<div class="btiles bt-${k}">${tilesOf(k).map(([v, l, tool, ar]) => `<${tool ? 'button type="button"' : 'div'} class="bkt"${tool ? ` data-tool="${tool}"` : ''}>${ar}<b>${v}</b><span>${l}</span></${tool ? 'button' : 'div'}>`).join('')}</div>`;

/** Onglets visibles : « Ma journée » n'existe que si la carte du jour est là. */
const shownTabs = box => TABS.filter(([k]) => k !== 'j' || box.querySelector('.tdy, .ap'));
/** La barre d'onglets, tout en haut du Bilan à la place des filtres. */
function barHTML(shown) {
  return `<div class="bt5 btabs" role="tablist" aria-label="${t('Bilan')}">${shown.map(([k, l]) => `<button type="button" role="tab" class="chip${k === tab ? ' on' : ''}" aria-selected="${k === tab}" data-bt="${k}">${t(l)}</button>`).join('')}</div>`;
}

const renderDash0 = app.renderDash;
const kids = box => [...box.children].filter(el => !FIXED(el));
app.renderDash = function () {
  renderDash0.apply(this, arguments);
  const box = $('dsh');
  if (!box || !app.loaded) return;
  /* le bénéfice net de la période se place tout en haut, au-dessus des objectifs ; le bénéfice du mois avec le stock ajouté suit les objectifs (hors onglets) */
  /* la carte « Aujourd'hui » / « Ma journée » reste tout en haut quand elle existe */
  const hero = box.querySelector('.hero'), goal = box.querySelector('.gcard'), top = box.querySelector('.ap, .tdy'), bmo = box.querySelector('.bmo');
  if (hero) { if (goal) { if (goal.previousElementSibling !== hero) goal.before(hero); } else if (top) { if (top.nextElementSibling !== hero) top.after(hero); } else if (box.firstElementChild !== hero) box.prepend(hero); }
  /* le bénéfice du mois (stock acheté compris) rejoint le bénéfice net dans la même carte */
  if (bmo && hero && bmo.parentElement !== hero) { bmo.classList.remove('card'); hero.appendChild(bmo); }
  /* objectifs détaillés sous l'objectif du mois ; résumé en une phrase puis rappel du rapport, juste avant le bénéfice net */
  const bobj = box.querySelector('.bobj'), bsum = box.querySelector('.bsum'), bnote = box.querySelector('.bnote'), after = goal || hero;
  if (bobj && after && after.nextElementSibling !== bobj) after.after(bobj);
  if (hero && bsum && hero.previousElementSibling !== bsum) hero.before(bsum);
  if (bnote && (bsum || hero)) (bsum || hero).before(bnote);
  box.querySelectorAll('.btiles, .btabs, .bchips').forEach(b => b.remove());
  const items = kids(box);
  /* rien à classer, ou bilan réduit du mode simple : pas d'onglets */
  if (!items.length || items.every(el => el.style.display === 'none')) { delete box.dataset.bt; return; }
  /* chaque élément du Bilan va dans un seul onglet (les cartes fixes aussi : Ma journée, Général) */
  [...box.children].filter(el => !el.matches('.btiles, .bchips, .empty, button.btn')).forEach(el => { TAB_IDS.forEach(k => el.classList.remove('bt-' + k)); el.classList.add('bt-' + tabOf(el)); });
  /* les anciennes cartes d'indicateurs sont remplacées par les 6 tuiles de l'onglet */
  items.filter(el => el.matches('button.minic, .kpis')).forEach(el => el.remove());
  const rest = kids(box), cards = rest.filter(el => el.classList.contains('card') && el.style.display !== 'none');
  const head = ['g', 'm', 'a', 's'].map(tilesHTML).join('');
  if (rest[0]) rest[0].insertAdjacentHTML('beforebegin', head); else box.insertAdjacentHTML('beforeend', head);
  /* les graphiques de chaque onglet : vignettes rangées sur 3 colonnes, sous les indicateurs */
  ['m', 'a', 's'].forEach(k => {
    const L = cards.filter(el => el.classList.contains('bt-' + k)); if (!L.length) return;
    const grid = document.createElement('div'); grid.className = 'bgrid bt-' + k; L[0].before(grid);
    L.forEach(el => { vignette(el); grid.appendChild(el); });
  });
  /* les onglets prennent la place des filtres, qui passent dans une ligne juste dessous */
  const shown = shownTabs(box), per = $('per'); if (!shown.some(x => x[0] === tab)) tab = 'g';
  if (per) { per.innerHTML = barHTML(shown) + '<div class="bflt">' + per.innerHTML + '</div>'; per.dataset.bt = tab; const on = per.querySelector('.btabs .chip.on'); if (on && typeof on.scrollIntoView === 'function') on.scrollIntoView({ inline: 'center', block: 'nearest' }); }
  box.dataset.bt = tab;
};

/** Change d'onglet sans redessiner le Bilan. */
function setTab(k) {
  const box = $('dsh'), per = $('per'); tab = k; LSs('bilTab', tab); box.dataset.bt = tab; if (per) per.dataset.bt = tab;
  document.querySelectorAll('#per .btabs .chip').forEach(c => { const on = c.dataset.bt === tab; c.classList.toggle('on', on); c.setAttribute('aria-selected', String(on)); if (on && typeof c.scrollIntoView === 'function') c.scrollIntoView({ inline: 'center', block: 'nearest' }); });
}
$('per').addEventListener('click', e => { const b = e.target.closest('.btabs [data-bt]'); if (b) setTab(b.dataset.bt); });
/* un toucher sur une vignette l'agrandit ; un toucher sur le titre d'un graphique ouvert le referme. Les boutons à l'intérieur gardent leur rôle.
   Écouteur en phase de capture : il passe avant le repli des sections du Bilan. */
$('dsh').addEventListener('click', e => {
  const el = e.target.closest('.bgrid > .card.bgr'); if (!el) return;
  if (!el.classList.contains('open')) { basculer(el, true); e.stopPropagation(); return; }
  if (e.target.closest('h3')) { basculer(el, false); e.stopPropagation(); }
}, true);
$('dsh').addEventListener('keydown', e => {
  if ((e.key !== 'Enter' && e.key !== ' ') || !e.target.matches || !e.target.matches('.bgrid > .card.bgr')) return;
  e.preventDefault(); basculer(e.target, !e.target.classList.contains('open'));
});