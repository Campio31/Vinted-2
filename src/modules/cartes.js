import { app } from '../state.js';
import { esc } from './core.js';
import { CFG0 } from './settings-core.js';
import { catSvg } from './stock-view.js';

/* ---------- jeu de cartes ---------- */
/* Chaque défi réussi offre un pack de 3 cartes (pack premium : au moins une carte Rare ou mieux). Cinq raretés.
   Les cartes n'ont aucune valeur réelle et ne servent qu'à collectionner. Tout est gardé dans les réglages (cfg.cartes), donc sur tous tes appareils. */
Object.assign(CFG0, { cartes: null });

export const RARETES = ['Commune', 'Rare', 'Épique', 'Légendaire', 'Mythique'];
const ODDS = { s: [68, 22, 7.5, 2.2, 0.3], p: [0, 72, 20, 6.5, 1.5] };
export const DUST = [1, 3, 8, 20, 50];
export const CRAFT = [5, 15, 40, 100, 250];
const PITY = 4;
const slug = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-');
const B = (set, r, L) => L.map(n => ({ id: 'b-' + slug(n), n, set, r, k: 'brand' }));
const P = (set, r, L) => L.map(([n, cat]) => ({ id: 'p-' + slug(n), n, set, r, k: 'piece', cat }));
const O = (set, r, L) => L.map(([n, ic]) => ({ id: 'o-' + slug(n), n, set, r, k: 'objet', ic }));
export const SETS = ['Fast-fashion', 'Classiques', 'Street et outdoor', 'Légendes', 'Pièces', 'Revendeur', 'Mythiques'];
export const CARDS = [
  ...B('Fast-fashion', 0, ['Zara', 'H&M', 'Kiabi', 'Decathlon', 'Primark', 'Bershka', 'Pull&Bear', 'Jules', 'Celio', 'C&A', 'Gémo', 'Mango']),
  ...B('Classiques', 1, ['Nike', 'Adidas', 'Puma', 'Levi\'s', 'Lacoste', 'Tommy Hilfiger', 'Ralph Lauren', 'Calvin Klein', 'Reebok', 'Champion', 'Fila', 'Diesel']),
  ...B('Street et outdoor', 2, ['The North Face', 'Carhartt', 'Patagonia', 'Stüssy', 'Dickies', 'Timberland', 'Kappa', 'Ellesse']),
  ...B('Légendes', 3, ['Supreme', 'Stone Island', 'Burberry', 'Moncler', 'C.P. Company']),
  ...P('Pièces', 0, [['T-shirt', 'Tshirt'], ['Polo', 'Polo'], ['Chemise', 'Chemise'], ['Short', 'Short'], ['Pantalon', 'Pantalon'], ['Sweat', 'Sweat']]),
  ...P('Pièces', 1, [['Jean', 'Pantalon'], ['Veste', 'Veste'], ['Doudoune', 'Veste'], ['Robe', 'RobeJupe'], ['Maillot', 'Maillot']]),
  ...P('Pièces', 2, [['Baskets', 'Chaussures'], ['Sac', 'Sac']]),
  ...O('Revendeur', 0, [['Carton d\'expédition', 'box'], ['Rouleau de scotch', 'tape']]),
  ...O('Revendeur', 1, [['Étiqueteuse', 'tag'], ['Pèse-colis', 'scale']]),
  ...O('Revendeur', 2, [['Anneau lumineux', 'light']]),
  ...O('Revendeur', 3, [['Live à 100 ventes', 'star']]),
  ...O('Mythiques', 4, [['Trouvaille du siècle', 'star'], ['Étiquette dorée', 'tag'], ['Archive 1990', 'tape'], ['Le ballot parfait', 'box']]),
];
const byId = Object.fromEntries(CARDS.map(c => [c.id, c]));
const IC = {
  box: '<path d="M3 8l9-5 9 5-9 5zM3 8v8l9 5 9-5V8M12 13v8"/>', tape: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/>', tag: '<path d="M4 4h8l8 8-8 8-8-8z"/><circle cx="8.500" cy="8.500" r="1.200"/>',
  scale: '<path d="M5 20h14M12 4v16M5 8h14l-3 6H8z"/>', light: '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="3"/>', star: '<path d="M12 3l2.500 5.500 6 .7-4.500 4 1.300 6L12 16.300 6.700 19.200 8 13.200 3.500 9.200l6-.7z"/>',
};

/* ---- état ---- */
const blank = () => ({ own: {}, dust: 0, s: 0, p: 0, paid: [], pity: 0, sets: [] });
export const state = () => Object.assign(blank(), app.cfg.cartes || {});
const save = o => app.setCfg({ cartes: o });
export const owned = () => CARDS.filter(c => state().own[c.id] > 0).length;
export const packsLeft = () => { const s = state(); return s.s + s.p; };

function rnd() { const a = new Uint32Array(1); (window.crypto || globalThis.crypto).getRandomValues(a); return a[0] / 4294967296; }
function rarity(odds) { let x = rnd() * odds.reduce((a, b) => a + b, 0); for (let i = 0; i < odds.length; i++) { x -= odds[i]; if (x < 0) return i; } return 0; }
const cardOf = r => { const L = CARDS.filter(c => c.r === r); return L[Math.floor(rnd() * L.length)]; };

/** Offre un pack (kind : 's' standard, 'p' premium). `id` évite de l'offrir deux fois pour le même défi. */
export function grantPack(kind, id) {
  const s = state();
  if (id && s.paid.includes(id)) return false;
  s[kind]++; if (id) s.paid = [...s.paid, id].slice(-500);
  save(s); return true;
}

/** Ouvre un pack : renvoie les cartes tirées [{c, nouv}] et met la collection à jour. */
export function openPack(kind) {
  const s = state();
  if (!(s[kind] > 0)) return null;
  s[kind]--;
  const rs = [0, 1, 2].map(() => rarity(ODDS[kind]));
  if (kind === 'p' && !rs.some(r => r >= 1)) rs[2] = rarity(ODDS.p);
  if (kind === 's') { if (rs.some(r => r >= 1)) s.pity = 0; else if (s.pity >= PITY) { rs[2] = rarity(ODDS.p); s.pity = 0; } else s.pity++; }
  const own = Object.assign({}, s.own), res = [];
  rs.forEach(r => { const c = cardOf(r), nouv = !(own[c.id] > 0); own[c.id] = (own[c.id] || 0) + 1; if (!nouv) s.dust += DUST[r]; res.push({ c, nouv }); });
  s.own = own;
  /* collection complète : un pack premium, une seule fois */
  const bonus = [];
  SETS.forEach(n => { if (!s.sets.includes(n) && CARDS.filter(c => c.set === n).every(c => own[c.id] > 0)) { s.sets = [...s.sets, n]; s.p++; bonus.push(n); } });
  save(s);
  return { res, bonus };
}

/** Fabrique une carte manquante avec la poussière des doublons. */
export function craft(id) {
  const s = state(), c = byId[id];
  if (!c || s.own[id] > 0 || s.dust < CRAFT[c.r]) return false;
  s.dust -= CRAFT[c.r]; s.own = Object.assign({}, s.own, { [id]: 1 });
  save(s); return true;
}

/* ---- affichage ---- */
const icon = c => c.k === 'piece' ? catSvg({ cat: c.cat }) : c.k === 'objet' ? `<svg viewBox="0 0 24 24" aria-hidden="true">${IC[c.ic]}</svg>` : `<span class="mono">${esc(c.n.replace(/[^A-Za-zÀ-ÿ&]/g, '').slice(0, 2).toUpperCase())}</span>`;
const nm = c => c.k === 'brand' ? c.n : t(c.n);
export const cardTile = (c, n, big, down) => `<button type="button" class="cdk r${c.r}${n > 0 ? '' : ' miss'}${big ? ' big' : ''}${down ? ' down' : ''}" ${down ? 'data-flip="1"' : `data-card="${esc(c.id)}"`} aria-label="${esc(nm(c) + ' · ' + t(RARETES[c.r]))}"><span class="cdi">${icon(c)}</span><b>${esc(nm(c))}</b><i>${t(RARETES[c.r])}</i>${n > 1 ? `<em>×${n}</em>` : ''}</button>`;
let shown = null, sel = '';
export function cartesBody() {
  const s = state(), got = owned();
  const bar = `<div class="gcard cartes-h"><div class="gh2"><span>${t('Ma collection')}</span><span>${got} / ${CARDS.length}</span></div><div class="rl"><b class="gc-g" style="width:${(got / CARDS.length * 100).toFixed(1)}%"></b></div>
   <div class="packs"><div><b>${s.s}</b><span>${t('packs')}</span><button type="button" class="btn sm" data-popen="s"${s.s ? '' : ' disabled'}>${t('Ouvrir')}</button></div><div><b>${s.p}</b><span>${t('packs premium')}</span><button type="button" class="btn sm mint" data-popen="p"${s.p ? '' : ' disabled'}>${t('Ouvrir')}</button></div><div><b>${s.dust}</b><span>${t('poussière')}</span></div></div>
   <div class="gl2">${t('Un pack par défi réussi, un pack premium pour un défi du mois (au moins une carte Rare). Les doublons deviennent de la poussière pour fabriquer une carte qui te manque.')}</div></div>`;
  const open = shown ? `<div class="card popen"><h3>${shown.bonus.length ? t('Collection complète : un pack premium en cadeau') : t('Ton pack')}</h3><div class="prow">${shown.res.map(x => cardTile(x.c, 1, true, true)).join('')}</div><div class="acts two"><button type="button" class="btn sec" data-pflip="1">${t('Tout révéler')}</button><button type="button" class="btn" data-pclose="1">${t('Ranger dans ma collection')}</button></div></div>` : '';
  const one = sel && byId[sel] ? (() => { const c = byId[sel], n = s.own[c.id] || 0; return `<div class="card csel"><div class="prow">${cardTile(c, n, true)}</div><p class="sub" style="margin:8px 0">${n ? t('Tu as cette carte') + (n > 1 ? ' ×' + n : '') + ' · ' + t(c.set) : t('Il te manque cette carte : {c} poussière pour la fabriquer.', { c: CRAFT[c.r] })}</p>${n ? '' : `<button type="button" class="btn" data-craft="${esc(c.id)}"${s.dust >= CRAFT[c.r] ? '' : ' disabled'}>${t('Fabriquer ({c} poussière)', { c: CRAFT[c.r] })}</button>`}</div>`; })() : '';
  const sets = SETS.map(n => { const L = CARDS.filter(c => c.set === n), k = L.filter(c => s.own[c.id] > 0).length; return `<div class="card cset"><div class="gh2"><b>${t(n)}</b><span>${k} / ${L.length}${k === L.length ? ' ✓' : ''}</span></div><div class="cgrid">${L.map(c => cardTile(c, s.own[c.id] || 0)).join('')}</div></div>`; }).join('');
  return bar + open + one + sets;
}
/** Gère les touches de l'onglet Cartes ; renvoie true si l'écran doit être redessiné. */
export function cartesClick(e) {
  const o = e.target.closest('[data-popen]');
  if (o) { const r = openPack(o.dataset.popen); if (r) { shown = r; sel = ''; return true; } return false; }
  const f = e.target.closest('[data-flip]');
  if (f) { f.classList.remove('down'); return false; }
  if (e.target.closest('[data-pflip]')) { document.querySelectorAll('.popen .cdk.down').forEach(x => x.classList.remove('down')); return false; }
  if (e.target.closest('[data-pclose]')) { shown = null; return true; }
  const c = e.target.closest('[data-card]');
  if (c) { sel = sel === c.dataset.card ? '' : c.dataset.card; return true; }
  const k = e.target.closest('[data-craft]');
  if (k) { craft(k.dataset.craft); return true; }
  return null;
}
