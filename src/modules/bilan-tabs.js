import { app } from '../state.js';
import { $, LSg, LSs, addDays, age, avail, days, dj, esc, ok, sold, today, eurR } from './core.js';
import { bilCtx, bilOk, bilRange, hbars, stats } from './dashboard.js';
import { addedIn, barsHTML, dim, mShort, monthProfit, monthsBack, prevM, soldIn as soldInM, sum } from './bilan-extra.js';
import { sheetHead, showSheet } from './tools-index.js';
import { closeSheet } from './piece-sheet.js';
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
    + '.btiles.bt-g .bkt{background:#FBEAF0;color:#5C2339}'
    /* Général : fond clair rose poudré et texte prune (plus de fond noir). L'objectif du mois et les objectifs détaillés forment un seul cadran. */
    + '#dsh[data-bt="g"] .gcard{background:linear-gradient(135deg,#FFF7F9,#FBEAF0);color:#3B1F2B;border:1px solid #F1D5DF}#dsh[data-bt="g"] .gcard .gh2 button{color:#A8345A}'
    + '#dsh[data-bt="g"] .gcard .gau .gtr{stroke:#EBD3DC}#dsh[data-bt="g"] .gcard .gau .gnd{stroke:#3B1F2B}#dsh[data-bt="g"] .gcard .gau .gnd0{fill:#3B1F2B}#dsh[data-bt="g"] .gcard .gau .gfg.gc-g{stroke:#2E9E6B}#dsh[data-bt="g"] .gcard .gau .gfg.gc-o{stroke:#E07B12}#dsh[data-bt="g"] .gcard .gau .gfg.gc-r{stroke:#D64545}#dsh[data-bt="g"] .gcard .gau .gpjarc{stroke:#B48AA0}'
    + '#dsh[data-bt="g"] .gcard .gau .gpc.gc-g{color:#1F7A55}#dsh[data-bt="g"] .gcard .gau .gpc.gc-o{color:#B85F0A}#dsh[data-bt="g"] .gcard .gau .gst.up{background:#DDF3EA;color:#146B4C}#dsh[data-bt="g"] .gcard .gau .gst.dn{background:#FBE3D2;color:#9A4A12}#dsh[data-bt="g"] .gcard .gau .gov{color:#9A6A12}#dsh[data-bt="g"] .gcard .gau .gov2{stroke:#D9A441}'
    + '#dsh[data-bt="g"] .gcard .gc-pj{color:#7A4A8C}#dsh[data-bt="g"] .gcard .gpj .pjd{background:#9B7BB0}#dsh[data-bt="g"] .gcard .hint,#dsh[data-bt="g"] .gcard small{color:#8C6B77}'
    + '.gcard>.bobj{background:none!important;border:0!important;border-radius:0!important;padding:14px 0 0!important;margin:16px 0 0!important;border-top:1px solid #F1D5DF!important}'
    /* Finance, Activité, Stock : graphiques en vignettes sur 3 colonnes, comme les indicateurs ; un toucher les agrandit */
    + '#dsh>.bgrid,#dsh>.btiles{grid-column:1/-1;max-width:640px}.bgrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:0 0 12px;align-items:start}'
    + '.bgrid>.card.bgr{margin:0;min-width:0;border-top:3px solid var(--bt);cursor:pointer;position:relative}'
    + '.bgrid>.card.bgr:not(.open){padding:8px;height:132px;overflow:hidden;border-radius:14px}.bgrid>.card.bgr:not(.open) h3{font-size:12px;line-height:1.2;margin:0 0 6px;max-height:29px;overflow:hidden}'
    + '.bgrid>.card.bgr:not(.open) .hd::after,.bgrid>.card.bgr:not(.open) h3::after,.bgrid>.card.bgr:not(.open) h3::before{display:none!important}.bgr:not(.open) .sub,.bgr:not(.open) .calh .ib{display:none!important}'
    + '.bgrid>.card.bgr:not(.open)>.bgv{width:333.33%;transform:scale(.3);transform-origin:0 0;pointer-events:none}'
    /* un graphique ouvert prend tout l'écran ; la croix, la touche Échap ou un nouveau toucher sur la vignette le referment */
    + '.bgrid>.card.bgr.open{position:fixed;inset:0;z-index:75;margin:0!important;border:0;border-radius:0;overflow:auto;padding:max(18px,env(safe-area-inset-top)) 16px calc(28px + env(safe-area-inset-bottom));background:var(--card,#fff);cursor:default;box-shadow:none;max-height:none;height:auto;grid-column:auto}'
    + '.bgx{display:none;align-items:center;justify-content:center;width:42px;height:42px;border:0;border-radius:50%;background:var(--soft);color:var(--ink);font-size:24px;line-height:1;cursor:pointer}.bgr.open>.bgx{display:flex;position:fixed;top:calc(10px + env(safe-area-inset-top));right:14px;z-index:2}'
    + '.bgr.open .hd::after,.bgr.open h3::after,.bgr.open h3::before{display:none!important}.bgr.open>h3,.bgr.open>.hd{padding-right:52px}.bgr.open .mo{height:min(52vh,380px)}.bgr.open svg{max-width:760px}.bgr.open>.bgv{max-width:900px}'
    + '.bt5{display:flex;gap:4px;overflow-x:auto;width:100%;margin:0 0 6px;scrollbar-width:none}.bt5::-webkit-scrollbar{display:none}.bt5 .chip{flex:1 0 auto;white-space:nowrap;min-height:44px;padding:0 9px;font-size:13px}'
    + '.bflt{display:flex;flex-wrap:wrap;gap:8px;align-items:center;width:100%}#per[data-bt="j"] .bflt{display:none}';
  if (typeof document !== 'undefined' && !document.getElementById('bt5css')) { const s = document.createElement('style'); s.id = 'bt5css'; s.textContent = css; document.head.appendChild(s); }
})();
const BY_TOOL = { treso: 'm', rapport: 'm', fisc: 'm', calcom: 'a', defis: 'a' };
const BY_CK = { seuil: 'm', cohorte: 's', fourn: 's', live: 'a', planning: 'a' };
const BY_SEC = { 'Ventes': 'a', 'Dépenses': 'm', 'Stock actuel': 's', 'Six derniers mois': 'm', 'Par plateforme': 'm', 'Par compte': 'm', 'Par catégorie': 'a', 'Meilleures marques': 'a', 'Provenance': 's', 'Retours': 'a', 'Analyse par ballot': 's',
  'D\'où vient chaque euro': 'm', 'Marge par mois': 'm', 'Bénéfice cumulé du mois': 'm', 'Ventes par jour de semaine': 'a', 'Ventes semaine par semaine': 'a', 'Ancienneté du stock': 's', 'Valeur du stock par catégorie': 's', 'Entrées et sorties par mois': 's', 'Comparer deux périodes': 'm', 'Saisonnalité': 'm',
  'Évolution du score': 'g', 'Chiffre d\'affaires par plateforme': 'g', 'Objectifs mois par mois': 'g' };
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
const OPEN = new Set();   /* graphique ouvert en plein écran (gardé seulement le temps de la visite, pour survivre aux redessins du Bilan) */
const keyOf = el => el.dataset.ck || (el.querySelector('h3[data-sec]') || {}).dataset?.sec || (el.querySelector('h3') || {}).textContent || '';
/** Prépare une carte-graphique en vignette : le titre reste dehors, tout le reste va dans .bgv (réduit tant que la carte est fermée). */
function vignette(el) {
  el.classList.add('bgr'); el.classList.remove('shut'); el.dataset.bk = keyOf(el);
  const h = el.querySelector('h3'), head = h ? (h.parentElement === el ? h : (h.closest('.calh') || h)) : null, wrap = document.createElement('div'); wrap.className = 'bgv';
  [...el.childNodes].forEach(n => { if (n !== head) wrap.appendChild(n); }); el.appendChild(wrap);
  const x = document.createElement('button'); x.type = 'button'; x.className = 'bgx'; x.textContent = '×'; x.setAttribute('aria-label', t('Fermer')); el.insertBefore(x, el.firstChild);
  const open = OPEN.has(el.dataset.bk); el.classList.toggle('open', open); el.setAttribute('role', 'button'); el.tabIndex = 0; el.setAttribute('aria-expanded', String(open));
}
/** Ouvre une vignette en plein écran, ou la referme. */
function basculer(el, on) {
  el.classList.toggle('open', on); el.setAttribute('aria-expanded', String(on));
  if (on) OPEN.add(el.dataset.bk); else OPEN.delete(el.dataset.bk);
}
const toutFermer = () => { OPEN.clear(); document.querySelectorAll('.bgrid > .card.bgr.open').forEach(c => { c.classList.remove('open'); c.setAttribute('aria-expanded', 'false'); }); };

/* ---- flèches : la période du Bilan face à la période d'avant, de même durée (30 jours si « Tout ») ---- */
function windows() {
  const r = bilRange(), to = r.to || today(), from = r.from || addDays(today(), -29), n = days(from, to) + 1;
  return { from, to, pf: addDays(from, -n), pt: addDays(from, -1) };
}
const soldIn = (a, b) => app.P.filter(p => sold(p) && ok(p.dv) && p.dv >= a && p.dv <= b && bilOk(p));
/* état du stock à une date passée, reconstitué avec les dates d'entrée, de publication et de vente */
const stockAt = d => app.P.filter(p => bilOk(p) && ok(p.entree) && p.entree <= d && !(sold(p) && ok(p.dv) && p.dv <= d));
const sumAge = (L, d) => L.length ? L.reduce((a, p) => a + Math.max(0, days(p.entree, d)), 0) / L.length : 0;
const onlineAt = d => stockAt(d).filter(p => ok(p.pub) && p.pub <= d);
const rateAt = d => { const all = app.P.filter(p => bilOk(p) && ok(p.entree) && p.entree <= d); return all.length ? all.filter(p => sold(p) && ok(p.dv) && p.dv <= d).length / all.length : 0; };
/** Délai de vente d'une pièce, en jours (depuis la mise en ligne, sinon l'entrée en stock) ; null si les dates manquent. */
const delayOf = p => { const f = ok(p.pub) ? p.pub : ok(p.entree) ? p.entree : ''; return f && ok(p.dv) ? Math.max(0, days(f, p.dv)) : null; };
const mtr = L => { const S = stats(L), dl = L.map(delayOf).filter(v => v != null); return { n: S.n, ca: S.ca, ben: S.ben, fr: S.fr, frp: S.ca ? S.fr / S.ca * 100 : 0, bpv: S.n ? S.ben / S.n : 0, marge: S.marge * 100, panier: S.panier, delai: S.delai, rap: dl.length ? dl.filter(v => v <= 7).length / dl.length * 100 : 0 }; };
/** Plateforme qui vend le plus (par nombre de ventes) : { k, n, share } ou null. */
const pfTop = L => { const g = {}; L.forEach(x => { const k = x.canal || 'Vinted'; g[k] = (g[k] || 0) + 1; }); const e = Object.entries(g).sort((a, b) => b[1] - a[1])[0]; return e ? { k: e[0], n: e[1], share: e[1] / L.length * 100 } : null; };
/** Jour de la semaine (0 = lundi) où l'on vend le plus : { i, n } ou null. */
const wdTop = L => { const c = [0, 0, 0, 0, 0, 0, 0], v = [0, 0, 0, 0, 0, 0, 0]; L.forEach(x => { if (!ok(x.dv)) return; const i = (new Date(x.dv + 'T12:00:00').getDay() + 6) % 7; c[i]++; v[i] += x.pv || 0; }); const i = c.map((n, j) => j).sort((a, b) => c[b] - c[a] || v[b] - v[a])[0]; return c[i] ? { i, n: c[i] } : null; };
const wdName = i => new Date(2024, 0, 1 + i).toLocaleDateString(app.LOC, { weekday: 'long' });
const retoursIn = (a, b) => app.P.filter(bilOk).reduce((s, x) => s + (x.retours || []).filter(r => ok(r.d) && r.d >= a && r.d <= b).reduce((q, r) => q + (r.p || 0), 0), 0);
const tauxSoc = () => +app.cfg.tauxSoc || 0;
/** Flèche en valeur absolue (pour les petits nombres : +3, −2). */
const arrowN = (cur, prev, goodUp) => { if (prev == null || cur == null) return '<i class="bka">&nbsp;</i>'; const d = cur - prev; if (!d) return '<i class="bka eq">→</i>'; const up = d > 0; return `<i class="bka ${up ? 'up' : 'dn'} ${up === goodUp ? 'ok' : 'ko'}">${up ? '↑' : '↓'} ${Math.abs(Math.round(d * 10) / 10)}</i>`; };
const sgn = v => (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(Math.round(v)) + ' %';

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
      /* bénéfice du mois, achats de stock compris, face au mois d'avant au même nombre de jours */
      const m0 = today().slice(0, 7), dn = +today().slice(8, 10), L0 = app.P.filter(bilOk), bs = monthProfit(L0, m0), bp = monthProfit(L0, prevM(m0), dn);
      return [
        [eurR(S.ben), t('bénéfice net'), '', arrow(c.ben, p.ben, true)],
        [eurR(S.ca), t('chiffre d\'affaires'), '', arrow(c.ca, p.ca, true)],
        [Math.round(S.marge * 100) + ' %', t('de marge'), '', arrow(c.marge, p.marge, true, true)],
        [S.n, t(S.n > 1 ? 'ventes' : 'vente'), '', arrow(c.n, p.n, true)],
        [A.length, t('pièces en stock'), '', arrow(stockAt(td).length, stockAt(td0).length, true)],
        [eurR(bs.ben), t('bénéfice du mois avec le stock'), '', arrow(bs.ben, bp.ben, true)]];
    }
    if (k === 'm') {
      /* Finance : frais de vente, bénéfice par vente, frais sur le CA, cotisations estimées, croissance du CA, remboursements */
      const tx = tauxSoc(), gr = p.ca ? (c.ca - p.ca) / p.ca * 100 : null, rc = retoursIn(W.from, W.to), rp = retoursIn(W.pf, W.pt);
      return [
        [eurR(S.fr), t('de frais de vente'), '', arrow(c.fr, p.fr, false)],
        [S.n ? eurR(S.ben / S.n) : '—', t('bénéfice par vente'), '', arrow(c.bpv, p.bpv, true)],
        [S.ca ? Math.round(S.fr / S.ca * 100) + ' %' : '—', t('de frais sur le CA'), '', S.ca && p.ca ? arrow(c.frp, p.frp, false, true) : arrow()],
        [tx ? eurR(S.ca * tx / 100) : '—', t('de cotisations estimées'), '', tx ? arrow(c.ca, p.ca, false) : arrow()],
        [gr == null ? '—' : sgn(gr), t('de croissance du CA'), '', arrow()],
        [eurR(rc), t('remboursés'), '', arrow(rc, rp, false)]];
    }
    /* Activité : pièces en ligne, taux d'écoulement, délai, plateforme n°1, ventes rapides, jour le plus fort */
    const fp = app.P.filter(bilOk), sd = fp.filter(p => p.statut === 'Vendu').length, ecoul = fp.length ? sd / fp.length : 0;
    const L1 = soldIn(W.from, W.to), L0 = soldIn(W.pf, W.pt), top = pfTop(L1), wd = wdTop(L1);
    const sh0 = top && L0.length ? L0.filter(x => (x.canal || 'Vinted') === top.k).length / L0.length * 100 : null;
    return [
      [A.filter(p => ok(p.pub)).length, t('pièces en ligne'), '', arrow(onlineAt(td).length, onlineAt(td0).length, true)],
      [Math.round(ecoul * 100) + ' %', t('d\'écoulement'), '', arrow(rateAt(td) * 100, rateAt(td0) * 100, true, true)],
      [S.n ? dj(S.delai) : '—', t('délai avant la vente'), '', arrow(c.delai, p.delai, false)],
      [top ? tv(top.k) : '—', top ? t('{p} % des ventes', { p: Math.round(top.share) }) : t('plateforme n°1'), '', top ? arrow(top.share, sh0, true, true) : arrow()],
      [S.n ? Math.round(c.rap) + ' %' : '—', t('vendues en moins de 7 jours'), '', S.n && p.n ? arrow(c.rap, p.rap, true, true) : arrow()],
      [wd ? wdName(wd.i) : '—', wd ? t(wd.n > 1 ? '{n} ventes ce jour-là' : '{n} vente ce jour-là', { n: wd.n }) : t('jour de vente le plus fort'), '', arrow()]];
  }
  /* Stock : valeur d'achat, âge moyen, mois de stock restants, stock net du mois, catégorie dominante, pièces en ligne depuis 60 jours et plus */
  const imm = L => L.reduce((a, p) => a + (p.achat || 0), 0), s0 = stockAt(td0), s1 = stockAt(td);
  const moy = A.length ? A.reduce((a, p) => a + age(p), 0) / A.length : 0, rate = soldIn(addDays(td, -89), td).length / 3;
  const m0 = td.slice(0, 7), dn = +td.slice(8, 10), L0 = app.P.filter(bilOk), net = addedIn(L0, m0).length - soldInM(L0, m0).length, net0 = addedIn(L0, prevM(m0), dn).length - soldInM(L0, prevM(m0), dn).length;
  const cat = {}; A.forEach(x => { const c = x.cat || 'Non renseigné'; cat[c] = (cat[c] || 0) + 1; }); const dom = Object.entries(cat).sort((a, b) => b[1] - a[1])[0];
  const old60 = (L, d) => L.filter(p => ok(p.pub) && p.pub <= d && days(p.pub, d) >= 60).length;
  return [
    [eurR(imm(A)), t('de valeur d\'achat du stock'), '', arrow(imm(s1), imm(s0), false)],
    [A.length ? dj(moy) : '—', t('d\'âge moyen'), '', arrow(sumAge(s1, td), sumAge(s0, td0), false)],
    [rate ? t('{n} mois', { n: cnt(A.length / rate) }) : '—', t('de stock restant'), '', rate ? arrow(A.length / rate, s0.length / rate, false) : arrow()],
    [(net > 0 ? '+' : net < 0 ? '−' : '') + Math.abs(net), t('de stock net ce mois-ci'), '', arrowN(net, net0, false)],
    [dom ? tv(dom[0]) : '—', dom ? t('{p} % du stock', { p: Math.round(dom[1] / A.length * 100) }) : t('catégorie dominante'), '', arrow()],
    [old60(A, td), t('en ligne depuis 60 jours et plus'), '', arrow(old60(s1, td), old60(s0, td0), false)]];
}
/* identifiants des indicateurs, dans l'ordre des tuiles de chaque onglet : un toucher ouvre le détail de l'indicateur */
const TILE_IDS = {
  g: ['g-ben', 'g-ca', 'g-marge', 'g-n', 'g-stock', 'g-benstock'],
  m: ['m-frais', 'm-bpv', 'm-frp', 'm-cotis', 'm-croiss', 'm-retours'],
  a: ['a-online', 'a-ecoul', 'a-delai', 'a-pf', 'a-rapide', 'a-jour'],
  s: ['s-immo', 's-age', 's-mois', 's-net', 's-catdom', 's-60'],
};
const tilesHTML = k => `<div class="btiles bt-${k}">${tilesOf(k).map(([v, l, tool, ar], i) => `<button type="button" class="bkt" data-tile="${TILE_IDS[k][i]}" data-tab="${k}" data-i="${i}">${ar}<b>${v}</b><span>${l}</span></button>`).join('')}</div>`;

/* ---- détail d'un indicateur : sa valeur, son évolution sur 6 mois, comment il est calculé, et l'outil lié s'il y en a un ---- */
const endOf = m => { const e = m + '-' + String(dim(m)).padStart(2, '0'); return e > today() ? today() : e; };
const money = v => eurR(v), pcent = v => Math.round(v) + ' %', cnt = v => String(Math.round(v * 10) / 10).replace('.', app.DS || ',');
/** f(L, m) : valeur de l'indicateur pour le mois m (L = pièces retenues par les filtres) ; fmt = affichage ; tool = outil lié ; ex = explication. */
const DETAIL = {
  'g-ben': { f: (L, m) => stats(soldInM(L, m)).ben, fmt: money, ex: 'Bénéfice sur les pièces vendues sur la période choisie : prix de vente moins prix d\'achat et frais.' },
  'g-ca': { f: (L, m) => stats(soldInM(L, m)).ca, fmt: money, ex: 'Total encaissé sur les ventes de la période choisie.' },
  'g-marge': { f: (L, m) => { const S = stats(soldInM(L, m)); return S.n ? S.marge * 100 : null; }, fmt: pcent, ex: 'Part du chiffre d\'affaires qui reste en bénéfice.' },
  'g-n': { f: (L, m) => soldInM(L, m).length, fmt: cnt, ex: 'Nombre de pièces vendues sur la période choisie.' },
  'g-stock': { f: (L, m) => stockAt(endOf(m)).length, fmt: cnt, ex: 'Pièces à vendre en stock.' },
  'g-benstock': { f: (L, m) => monthProfit(L, m).ben, fmt: money, ex: 'Ventes du mois moins les frais, moins le prix d\'achat de tout le stock ajouté ce mois-ci, vendu ou non.' },
  'm-frais': { f: (L, m) => stats(soldInM(L, m)).fr, fmt: money, ex: 'Total des frais retenus sur les ventes de la période choisie.' },
  'm-bpv': { f: (L, m) => { const S = stats(soldInM(L, m)); return S.n ? S.ben / S.n : null; }, fmt: money, ex: 'Bénéfice moyen gagné sur chaque pièce vendue.' },
  'm-frp': { f: (L, m) => { const S = stats(soldInM(L, m)); return S.ca ? S.fr / S.ca * 100 : null; }, fmt: pcent, ex: 'Part du chiffre d\'affaires absorbée par les frais de vente.' },
  'm-cotis': { f: (L, m) => stats(soldInM(L, m)).ca * tauxSoc() / 100, fmt: money, ex: 'Cotisations sociales estimées : chiffre d\'affaires multiplié par le taux des réglages. Estimation, à faire valider.', tool: 'fisc' },
  'm-croiss': { f: (L, m) => { const a = stats(soldInM(L, m)).ca, b = stats(soldInM(L, prevM(m))).ca; return b ? (a - b) / b * 100 : null; }, fmt: v => sgn(v), ex: 'Évolution du chiffre d\'affaires face à la période d\'avant.' },
  'm-retours': { f: (L, m) => sum(L, x => sum((x.retours || []).filter(r => ok(r.d) && r.d.startsWith(m)), r => r.p)), fmt: money, ex: 'Montants remboursés à tes acheteurs sur la période.',
    rt: 'Par motif', rows: () => { const W = windows(), g = {}; app.P.filter(bilOk).forEach(x => (x.retours || []).forEach(r => { if (ok(r.d) && r.d >= W.from && r.d <= W.to) { const k = r.m || 'Non précisé'; g[k] = (g[k] || 0) + 1; } })); return Object.entries(g).map(([k, v]) => ({ k, v })).sort((a, b) => b.v - a.v); } },
  'a-online': { f: (L, m) => onlineAt(endOf(m)).length, fmt: cnt, ex: 'Pièces actuellement en ligne.' },
  'a-ecoul': { f: (L, m) => rateAt(endOf(m)) * 100, fmt: pcent, ex: 'Part des pièces entrées en stock qui ont été vendues.' },
  'a-delai': { f: (L, m) => { const S = stats(soldInM(L, m)); return S.n ? S.delai : null; }, fmt: dj, ex: 'Temps moyen entre la mise en ligne (ou l\'entrée) et la vente.' },
  'a-pf': { f: (L, m) => { const t0 = pfTop(soldInM(L, m)); return t0 ? t0.share : null; }, fmt: pcent, ex: 'Plateforme qui réalise le plus de ventes, et sa part du total.',
    rt: 'Par plateforme', rows: () => { const W = windows(), g = {}; soldIn(W.from, W.to).forEach(x => { const k = x.canal || 'Vinted'; g[k] = g[k] || { k, v: 0, ca: 0 }; g[k].v++; g[k].ca += x.pv || 0; }); return Object.values(g).sort((a, b) => b.v - a.v).map(g2 => ({ k: g2.k, v: g2.v, sub: eurR(g2.ca) })); } },
  'a-rapide': { f: (L, m) => { const dl = soldInM(L, m).map(delayOf).filter(v => v != null); return dl.length ? dl.filter(v => v <= 7).length / dl.length * 100 : null; }, fmt: pcent, ex: 'Part des ventes réalisées dans les 7 jours qui suivent la mise en ligne.' },
  'a-jour': { ex: 'Jour de la semaine où tu vends le plus de pièces sur la période.',
    rt: 'Par jour de la semaine', rows: () => { const W = windows(), c = [0, 0, 0, 0, 0, 0, 0]; soldIn(W.from, W.to).forEach(x => { if (ok(x.dv)) c[(new Date(x.dv + 'T12:00:00').getDay() + 6) % 7]++; }); return c.map((v, i) => ({ k: wdName(i), v })); } },
  's-immo': { f: (L, m) => sum(stockAt(endOf(m)), x => x.achat), fmt: money, ex: 'Prix d\'achat des pièces en stock : l\'argent qui dort.' },
  's-age': { f: (L, m) => { const s = stockAt(endOf(m)); return s.length ? sumAge(s, endOf(m)) : null; }, fmt: dj, ex: 'Temps moyen passé en stock par les pièces à vendre.' },
  's-mois': { f: (L, m) => { const n = soldInM(L, m).length; return n ? stockAt(endOf(m)).length / n : null; }, fmt: v => t('{n} mois', { n: cnt(v) }), ex: 'Nombre de mois qu\'il faudrait pour écouler le stock au rythme de vente des 3 derniers mois.' },
  's-net': { f: (L, m) => addedIn(L, m).length - soldInM(L, m).length, fmt: v => (v > 0 ? '+' : '') + Math.round(v), ex: 'Pièces ajoutées moins pièces vendues sur le mois : positif, ton stock grossit.' },
  's-catdom': { ex: 'Catégorie qui représente la plus grande part de ton stock.',
    rt: 'Par catégorie', rows: () => { const g = {}; app.P.filter(x => avail(x) && bilOk(x)).forEach(x => { const k = x.cat || 'Non renseigné'; g[k] = (g[k] || 0) + 1; }); return Object.entries(g).map(([k, v]) => ({ k, v })).sort((a, b) => b.v - a.v).slice(0, 8); } },
  's-60': { f: (L, m) => stockAt(endOf(m)).filter(p => ok(p.pub) && p.pub <= endOf(m) && days(p.pub, endOf(m)) >= 60).length, fmt: cnt, ex: 'Pièces en ligne depuis 60 jours ou plus : à baisser ou retirer.' },
};
/** Ouvre la fiche détaillée d'une tuile. */
export function openTile(id, tabK, i) {
  const d = DETAIL[id]; if (!d) return; const T = tilesOf(tabK)[+i]; if (!T) return;
  const L = app.P.filter(bilOk), ms = monthsBack(6);
  const vals = d.f ? ms.map(m => d.f(L, m)) : null, has = vals && vals.some(v => v != null && v !== 0);
  const serie = has ? `<div class="card"><h3>${t('Les 6 derniers mois')}</h3>${barsHTML(ms.map((m, k) => ({ a: Math.max(0, vals[k] || 0), l: mShort(m), tag: vals[k] == null ? '' : d.fmt(vals[k]) })))}</div>` : '';
  const rows = d.rows ? d.rows() : null, m0 = today().slice(0, 7), r = id === 'g-benstock' ? monthProfit(L, m0) : null;
  const decomp = r ? `<div class="card"><h3>${t('Comment il se compose')}</h3><div class="kv" style="grid-template-columns:auto 1fr"><dt>${t('Ventes encaissées')}</dt><dd>${eurR(r.ca)}</dd><dt>${t('Frais de vente')}</dt><dd>−${eurR(r.frais)}</dd><dt>${t('Stock ajouté ce mois-ci')}</dt><dd>−${eurR(r.cost)} · ${tn(r.nAdded, 'pièce', 'pièces')}</dd><dt>${t('Bénéfice classique')}</dt><dd>${eurR(r.classic)}</dd></div></div>` : '';
  showSheet(sheetHead(esc(T[1].charAt(0).toUpperCase() + T[1].slice(1))) + `<div class="card"><div style="font-size:38px;font-weight:800;line-height:1.1;font-variant-numeric:tabular-nums">${T[0]}</div><div style="margin-top:4px">${T[3]} <span class="hint" style="margin:0">${t('face à la période d\'avant')}</span></div></div>${decomp}${serie}${rows && rows.length ? `<div class="card"><h3>${t(d.rt)}</h3>${hbars(rows, v => String(v))}</div>` : ''}<div class="card"><h3>${t('Comment c\'est calculé')}</h3><p class="sub" style="margin:0">${t(d.ex)}</p></div>${d.tool ? `<div class="acts"><button type="button" class="btn mint" data-tool="${d.tool}">${t('Ouvrir')}</button></div>` : ''}${r ? `<div class="acts"><button type="button" class="btn sec" id="tl_rep">${t('Rapport du mois')}</button></div>` : ''}`);
  $('shc').onclick = e => { if (e.target.closest('#tl_rep')) { closeSheet(); if (app.openMonthReport) app.openMonthReport(m0); } };
}
$('dsh').addEventListener('click', e => { const b = e.target.closest('.btiles .bkt[data-tile]'); if (b) openTile(b.dataset.tile, b.dataset.tab, b.dataset.i); });

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
  /* le bénéfice net sur 90 jours n'est plus en haut (il reste dans les indicateurs) et le bénéfice du mois est devenu un indicateur : on masque ces deux cartes */
  if (hero) hero.style.display = 'none';
  if (bmo) bmo.style.display = 'none';
  /* l'objectif du mois et les objectifs détaillés forment un seul cadran ; le score est tout en haut, puis le rappel du rapport */
  const bobj = box.querySelector('.bobj'), bsum = box.querySelector('.bsum'), bnote = box.querySelector('.bnote');
  if (bobj && goal) { if (bobj.parentElement !== goal) goal.appendChild(bobj); }
  else if (bobj && hero && hero.nextElementSibling !== bobj) hero.after(bobj);
  const first = goal || bobj || hero;
  if (bsum && first && first.previousElementSibling !== bsum) first.before(bsum);
  if (bnote && (bsum || first)) (bsum || first).before(bnote);
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
  ['g', 'm', 'a', 's'].forEach(k => {
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
/* un toucher sur une vignette l'ouvre en plein écran ; la croix la referme. Les boutons à l'intérieur gardent leur rôle.
   Écouteur en phase de capture : il passe avant le repli des sections du Bilan. */
$('dsh').addEventListener('click', e => {
  const el = e.target.closest('.bgrid > .card.bgr'); if (!el) return;
  if (!el.classList.contains('open')) { basculer(el, true); e.stopPropagation(); return; }
  if (e.target.closest('.bgx')) { basculer(el, false); e.stopPropagation(); }
}, true);
/* Échap ferme le graphique ; changer d'écran aussi */
document.addEventListener('keydown', e => { if (e.key === 'Escape') toutFermer(); });
document.addEventListener('click', e => { if (e.target.closest && e.target.closest('[data-v]')) toutFermer(); });
$('dsh').addEventListener('keydown', e => {
  if ((e.key !== 'Enter' && e.key !== ' ') || !e.target.matches || !e.target.matches('.bgrid > .card.bgr')) return;
  e.preventDefault(); basculer(e.target, !e.target.classList.contains('open'));
});