/* ---------- Cartes : illustrations « Papier Encré » ---------- */
/* Dessins SVG des vêtements (viewBox 316 × 194), logo du mouton, dos « Flocons » par rareté et packs « Cristal ».
   Un vêtement = une silhouette + un motif + une couleur + une finition ; les marques d'usure suivent l'état. */
export const INK = '#16130f', CREAM = '#f3ead7', BLUE = '#1f3fbf', RED = '#ff5a36', YEL = '#ffc933', GRN = '#2f9e5b';
export const COL = { Rouge: '#e0412b', Bleu: '#1f3fbf', Écru: '#efe5cf', Jaune: '#ffc933', Vert: '#2f9e5b', Beige: '#d9c3a0', Camel: '#c1853f', Moutarde: '#d8a31f', Bordeaux: '#7b1e2b', Orange: '#ff7a2b', Blanc: '#fbf8f0', Brun: '#6b4423', Noir: '#2a2520', Indigo: '#243a8a', Marine: '#1b2a49', Crème: '#f1e6c8', Argent: '#c4c9d4', Rose: '#ff7fa8', Champagne: '#e8d4a5', Cognac: '#9a4f1c', Marron: '#5b3a22', Nuit: '#151a3a', Irisé: '#b9a7ff', Violet: '#6a3fb5', Ivoire: '#f6efdc', Or: '#e0b020', Kraft: '#c9a56b' };
const lum = h => { const n = parseInt(h.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255; return (0.299 * r + 0.587 * g + 0.114 * b) / 255; };
const mix = (a, b, k) => { const x = parseInt(a.slice(1), 16), y = parseInt(b.slice(1), 16), f = (s, i) => Math.round(((x >> s) & 255) * (1 - k) + ((y >> s) & 255) * k); return '#' + [16, 8, 0].map(s => f(s).toString(16).padStart(2, '0')).join(''); };

/* ---- silhouettes : [rôle, tracé]. body = tissu, trim = bord-côte ou doublure, line = trait, seam = couture pointillée, dot = bouton [cx, cy, r] ---- */
const arm = (y) => `M60 ${y} L84 26 Q100 44 116 26 L140 ${y}`;
const TEE = 'M60 34 L84 26 Q100 44 116 26 L140 34 L186 92 L162 108 L146 84 L146 150 L54 150 L54 84 L38 108 L14 92 Z';
const COAT = 'M60 20 L86 12 L100 40 L114 12 L140 20 L180 100 L158 114 L146 84 L146 164 L54 164 L54 84 L42 114 L20 100 Z';
const JACK = 'M54 28 L84 20 L100 38 L116 20 L146 28 L190 92 L166 108 L148 84 L148 150 L52 150 L52 84 L34 108 L10 92 Z';
const dots = (ys, x = 100, r = 3.4) => ys.map(y => ['dot', x, y, r]);
export const SIL = {
  bonnet: o => [['body', 'M28 118 Q28 30 100 24 Q172 30 172 118 Z'], ['trim', 'M24 112 H176 V142 H24 Z'], ['line', 'M44 112 V142 M64 112 V142 M84 112 V142 M104 112 V142 M124 112 V142 M144 112 V142 M164 112 V142'], ...(o.pom ? [['trim', 'M83 12 a17 17 0 1 0 34 0 a17 17 0 1 0 -34 0']] : [])],
  echarpe: () => [['body', 'M14 52 Q100 22 186 52 L186 92 Q100 62 14 92 Z'], ['body', 'M136 76 L186 82 L176 164 L128 158 Z'], ['line', 'M132 160 v10 M142 162 v10 M152 164 v10 M162 165 v10 M172 166 v10']],
  pull: () => [['body', TEE], ['trim', 'M84 26 Q100 44 116 26 L112 20 Q100 36 88 20 Z'], ['trim', 'M54 136 H146 V150 H54 Z'], ['trim', 'M14 92 L38 108 L31 116 L7 100 Z'], ['trim', 'M186 92 L162 108 L169 116 L193 100 Z']],
  jean: () => [['body', 'M54 14 H146 L156 162 H106 L100 72 L94 162 H44 Z'], ['trim', 'M54 14 H146 V30 H54 Z'], ['line', 'M60 36 Q74 56 90 36 M140 36 Q126 56 110 36 M100 30 V72'], ['seam', 'M50 160 L58 36 M150 160 L142 36'], ...dots([22], 100, 3)],
  gilet: () => [['body', 'M44 30 L74 22 Q100 44 126 22 L156 30 L162 64 L150 70 L150 152 L50 152 L50 70 L38 64 Z'], ['trim', 'M74 22 Q100 44 126 22 L122 16 Q100 34 78 16 Z'], ['line', 'M100 40 V152'], ['trim', 'M50 142 H150 V152 H50 Z']],
  moufles: () => [['body', 'M16 152 V74 Q16 26 48 26 Q78 26 78 74 V152 Z'], ['body', 'M16 98 Q-4 98 0 118 Q4 132 16 128'], ['trim', 'M16 134 H78 V156 H16 Z'], ['body', 'M122 152 V74 Q122 26 154 26 Q184 26 184 74 V152 Z'], ['body', 'M184 98 Q204 98 200 118 Q196 132 184 128'], ['trim', 'M122 134 H184 V156 H122 Z']],
  chemise: () => [['body', 'M60 34 L84 26 L100 44 L116 26 L140 34 L186 92 L162 108 L146 84 L146 156 L54 156 L54 84 L38 108 L14 92 Z'], ['trim', 'M84 26 L100 44 L116 26 L126 38 L100 60 L74 38 Z'], ['line', 'M100 44 V156 M112 78 H136 V100 H112'], ...dots([70, 92, 114, 136], 100, 3)],
  bottes: o => [['body', 'M10 14 H46 V112 Q84 116 90 144 V162 H10 Z'], ['body', 'M110 14 H146 V112 Q184 116 190 144 V162 H110 Z'], ['trim', 'M10 150 H90 V162 H10 Z'], ['trim', 'M110 150 H190 V162 H110 Z'], ['trim', o.fur ? 'M6 8 H50 V26 H6 Z' : 'M10 14 H46 V22 H10 Z'], ['trim', o.fur ? 'M106 8 H150 V26 H106 Z' : 'M110 14 H146 V22 H110 Z']],
  bottesH: () => [['body', 'M20 8 H78 V120 Q120 126 132 148 V164 H20 Z'], ['body', 'M120 8 H176 V120 Q196 124 200 148 V164 H120 Z'], ['trim', 'M20 152 H132 V164 H20 Z'], ['trim', 'M120 152 H200 V164 H120 Z'], ['trim', 'M20 8 H78 V22 H20 Z'], ['trim', 'M120 8 H176 V22 H120 Z']],
  cabas: () => [['body', 'M38 62 H162 L174 162 H26 Z'], ['line', 'M62 62 Q62 12 100 12 Q138 12 138 62'], ['trim', 'M62 98 H138 V138 H62 Z']],
  jupe: () => [['body', 'M62 30 H138 L186 158 H14 Z'], ['trim', 'M62 24 H138 V38 H62 Z'], ['line', 'M84 38 L56 158 M100 38 V158 M116 38 L144 158']],
  parka: () => [['body', 'M58 40 L84 30 Q100 50 116 30 L142 40 L186 104 L162 120 L146 96 L146 162 L54 162 L54 96 L38 120 L14 104 Z'], ['trim', 'M74 36 Q100 0 126 36 Q114 54 100 58 Q86 54 74 36 Z'], ['line', 'M100 58 V162 M62 112 H88 V138 H62 M112 112 H138 V138 H112'], ['seam', 'M88 62 L84 80 M112 62 L116 80']],
  manteau: o => [['body', COAT], ['trim', 'M86 12 L100 40 L100 72 L68 42 Z'], ['trim', 'M114 12 L100 40 L100 72 L132 42 Z'], ['line', 'M100 72 V164'], ...(o.belt ? [['trim', 'M54 100 H146 V114 H54 Z'], ['dot', 100, 107, 5]] : dots([92, 116, 140], 100, 3.6)), ...(o.toggles ? [['line', 'M88 90 H112 M88 114 H112 M88 138 H112']] : [])],
  cardigan: () => [['body', TEE], ['trim', 'M84 26 L100 60 L116 26 L122 34 L100 74 L78 34 Z'], ['trim', 'M54 136 H146 V150 H54 Z'], ['line', 'M100 60 V150'], ...dots([84, 104, 124], 100, 3.2)],
  robe: () => [['body', 'M80 14 H120 L128 72 L172 162 H28 L72 72 Z'], ['trim', 'M72 72 H128 V86 H72 Z'], ['line', 'M80 14 L90 40 M120 14 L110 40'], ['seam', 'M100 86 V162']],
  baskets: () => [['body', 'M22 22 H80 L84 94 L130 104 Q190 112 190 140 V152 H22 Z'], ['trim', 'M22 142 H190 V156 H22 Z'], ['line', 'M28 40 H72 M28 58 H72 M30 76 H74'], ['trim', 'M22 22 H80 V36 H22 Z'], ['seam', 'M30 126 H182']],
  pantalon: () => [['body', 'M56 14 H144 L152 162 H108 L100 78 L92 162 H48 Z'], ['trim', 'M56 14 H144 V28 H56 Z'], ['line', 'M100 28 V78 M60 160 L66 36 M140 160 L134 36']],
  gants: () => [['body', 'M62 152 V86 H142 V152 Z'], ['body', 'M62 86 V44 Q62 32 72 32 Q82 32 82 44 V86'], ['body', 'M82 86 V26 Q82 14 92 14 Q102 14 102 26 V86'], ['body', 'M102 86 V22 Q102 10 112 10 Q122 10 122 22 V86'], ['body', 'M122 86 V34 Q122 22 132 22 Q142 22 142 34 V86'], ['body', 'M142 108 L172 80 Q182 72 188 82 Q192 92 180 102 L142 130'], ['trim', 'M58 134 H146 V158 H58 Z']],
  veste: () => [['body', JACK], ['trim', 'M84 20 L100 38 L116 20 L126 30 L100 52 L74 30 Z'], ['line', 'M100 38 V150 M62 96 H90 V120 H62 M110 96 H138 V120 H110'], ['seam', 'M52 84 L60 148 M148 84 L140 148'], ...dots([60, 84], 100, 3)],
  blouson: () => [['body', JACK], ['trim', 'M84 20 L100 38 L116 20 L124 26 L100 46 L76 26 Z'], ['trim', 'M52 136 H148 V150 H52 Z'], ['trim', 'M10 92 L34 108 L28 116 L4 100 Z'], ['trim', 'M190 92 L166 108 L172 116 L196 100 Z'], ['line', 'M100 46 V136']],
  cape: o => [['body', 'M100 14 Q30 24 10 162 H190 Q170 24 100 14 Z'], ['trim', 'M72 20 Q100 40 128 20 L128 36 Q100 54 72 36 Z'], ['line', 'M100 54 V162'], ['dot', 100, 58, 5], ...(o.cl ? [] : [])],
  sneaker: () => [['body', 'M14 98 Q58 92 88 70 L108 84 L150 94 Q190 102 190 130 V146 H14 Z'], ['trim', 'M14 134 H190 V150 H14 Z'], ['line', 'M96 88 L108 100 M112 92 L122 104 M128 96 L138 106'], ['seam', 'M24 118 H180'], ['trim', 'M150 94 Q190 102 190 130 H152 Z']],
  moonboots: () => [['body', 'M44 16 H100 Q112 16 112 32 V92 Q172 86 186 128 V150 Q186 162 172 162 H44 Q30 162 30 150 V32 Q30 16 44 16 Z'], ['trim', 'M30 140 H186 V162 H30 Z'], ['trim', 'M30 16 H112 V34 H30 Z'], ['line', 'M30 70 H112 M30 100 H112']],
  doudoune: () => [['body', 'M58 40 L84 30 Q100 50 116 30 L142 40 L186 104 L162 120 L146 96 L146 162 L54 162 L54 96 L38 120 L14 104 Z'], ['trim', 'M84 30 Q100 50 116 30 L112 22 Q100 40 88 22 Z'], ['line', 'M100 50 V162 M54 70 H146 M54 92 H146 M54 114 H146 M54 136 H146']],
  toque: () => [['body', 'M24 112 Q20 40 100 36 Q180 40 176 112 Q150 128 100 124 Q50 128 24 112 Z'], ['trim', 'M16 108 Q100 142 184 108 L184 138 Q100 172 16 138 Z'], ['line', 'M30 116 l4 -6 M52 126 l4 -6 M76 132 l4 -6 M104 134 l4 -6 M130 132 l4 -6 M154 126 l4 -6 M174 116 l4 -6']],
  blazer: () => [['body', 'M56 22 L84 14 L100 44 L116 14 L144 22 L186 96 L162 110 L148 86 L148 158 L52 158 L52 86 L38 110 L14 96 Z'], ['trim', 'M84 14 L100 44 L100 90 L66 44 Z'], ['trim', 'M116 14 L100 44 L100 90 L134 44 Z'], ['line', 'M100 90 V158 M62 120 H84 M116 120 H138'], ...dots([100, 120], 100, 3.4)],
  cintre: () => [['line', 'M100 44 Q100 10 124 10 Q144 14 134 36'], ['body', 'M100 46 L186 126 Q194 138 180 140 H20 Q6 138 14 126 Z'], ['trim', 'M20 140 H180 V148 H20 Z'], ['line', 'M100 46 V30']],
  colis: () => [['body', 'M28 52 L100 28 L172 52 V132 L100 156 L28 132 Z'], ['line', 'M28 52 L100 76 L172 52 M100 76 V156'], ['trim', 'M86 33 L116 43 V160 L86 150 Z'], ['trim', 'M126 112 H160 V132 H126 Z']],
};

/* ---- motifs et finitions (les identifiants sont propres à chaque carte pour éviter les collisions) ---- */
function defs(id, base, pat, fin) {
  const a = lum(base) > .55 ? mix(base, INK, .55) : mix(base, CREAM, .6), b = mix(base, INK, .3);
  const P = {
    stripes: `<pattern id="pt${id}" width="14" height="14" patternUnits="userSpaceOnUse"><rect width="7" height="14" fill="${a}"/></pattern>`,
    hstripes: `<pattern id="pt${id}" width="14" height="14" patternUnits="userSpaceOnUse"><rect width="14" height="6" fill="${a}"/></pattern>`,
    check: `<pattern id="pt${id}" width="22" height="22" patternUnits="userSpaceOnUse"><rect width="10" height="22" fill="${a}" opacity=".4"/><rect width="22" height="10" fill="${a}" opacity=".4"/></pattern>`,
    jacquard: `<pattern id="pt${id}" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M12 2 L22 12 L12 22 L2 12 Z" fill="none" stroke="${a}" stroke-width="2"/><circle cx="12" cy="12" r="2.4" fill="${a}"/></pattern>`,
    nordic: `<pattern id="pt${id}" width="32" height="24" patternUnits="userSpaceOnUse"><path d="M0 4 L8 12 L16 4 L24 12 L32 4" fill="none" stroke="${a}" stroke-width="2"/><path d="M16 14 v8 M12 18 h8 M13 15 l6 6 M19 15 l-6 6" stroke="${a}" stroke-width="1.6"/></pattern>`,
    quilt: `<pattern id="pt${id}" width="22" height="22" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0 H22 M0 0 V22" stroke="${b}" stroke-width="2" fill="none"/></pattern>`,
    cable: `<pattern id="pt${id}" width="18" height="24" patternUnits="userSpaceOnUse"><path d="M5 0 Q13 6 5 12 Q-3 18 5 24 M13 0 Q5 6 13 12 Q21 18 13 24" stroke="${b}" stroke-width="2.4" fill="none"/></pattern>`,
    cord: `<pattern id="pt${id}" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="2.4" height="6" fill="${b}" opacity=".5"/></pattern>`,
    denim: `<pattern id="pt${id}" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(30)"><path d="M0 3 H6" stroke="${a}" stroke-width="1" opacity=".5"/></pattern>`,
    tweed: `<pattern id="pt${id}" width="8" height="8" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.2" fill="${a}" opacity=".6"/><circle cx="6" cy="6" r="1.2" fill="${b}" opacity=".7"/></pattern>`,
  }[pat] || '';
  return `<defs>${P}<pattern id="dt${id}" width="6" height="6" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="1.1" fill="${INK}" opacity=".5"/></pattern>
   <linearGradient id="gd${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff1b0"/><stop offset=".35" stop-color="#e0b020"/><stop offset=".65" stop-color="#a8740a"/><stop offset="1" stop-color="#f7d66b"/></linearGradient>
   <linearGradient id="hl${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff8ad4"/><stop offset=".25" stop-color="#8ad4ff"/><stop offset=".5" stop-color="#b6ff8a"/><stop offset=".75" stop-color="#ffe08a"/><stop offset="1" stop-color="#ff8ad4"/></linearGradient></defs>`;
}
const wear = e => {
  const w = [];
  if (e <= 3) w.push(`<path d="M70 72 Q100 82 132 70" fill="none" stroke="${INK}" stroke-width="1.6" stroke-dasharray="2 3" opacity=".4"/>`);
  if (e <= 2) w.push(`<ellipse cx="122" cy="112" rx="10" ry="7" fill="${INK}" opacity=".16"/>`);
  if (e <= 1) w.push([...Array(14)].map((_, i) => `<circle cx="${60 + (i * 37) % 86}" cy="${52 + (i * 53) % 84}" r="1.8" fill="${INK}" opacity=".3"/>`).join(''));
  return w.join('');
};

/* ---- illustrations dessinées à la main (dossier cartes-svg, une par carte, viewBox 316 × 194) ---- */
const FILES = import.meta.glob('./cartes-svg/*.svg', { query: '?raw', import: 'default', eager: true });
const ART = {};
Object.entries(FILES).forEach(([f, svg]) => { const m = /\/(\d\d)-[^/]*$/.exec(f); if (m) ART[+m[1]] = svg; });
/* marques d'usure posées sur le dessin (autour du centre) : pli, tache, pelage, selon l'état */
const wearC = e => {
  const w = [];
  if (e <= 3) w.push(`<path d="M120 92 Q158 102 196 90" fill="none" stroke="${INK}" stroke-width="1.6" stroke-dasharray="2 3" opacity=".4"/>`);
  if (e <= 2) w.push(`<ellipse cx="178" cy="120" rx="10" ry="7" fill="${INK}" opacity=".16"/>`);
  if (e <= 1) w.push([...Array(14)].map((_, i) => `<circle cx="${112 + (i * 37) % 92}" cy="${66 + (i * 53) % 78}" r="1.8" fill="${INK}" opacity=".3"/>`).join(''));
  return w.join('');
};
function artSVG(num, e) {
  const svg = ART[num].replace(/<rect width="316" height="194" fill="#f3ead7"\/>/, '').replace(/^<svg ([^>]*?)\s+width="\d+"\s+height="\d+">/, '<svg class="cga" aria-hidden="true" $1>');
  return svg.replace(/<\/svg>\s*$/, wearC(e) + '</svg>');
}
/** Illustration d'un vêtement. card = { sil, col, pat, fin, opt } ; e = état (1 à 5). */
export function garmentSVG(card, id, e = 5) {
  if (card.num && ART[card.num]) return artSVG(card.num, e);
  const base = COL[card.col] || '#d9c3a0', trim = mix(base, INK, .22), pat = card.pat && card.pat !== 'uni' ? card.pat : '', fin = card.fin || '';
  const L = (SIL[card.sil] || SIL.pull)(card.opt || {}), body = [];
  const fill = fin === 'holo' || card.col === 'Irisé' ? `url(#hl${id})` : card.col === 'Or' ? `url(#gd${id})` : base;
  L.forEach(([r, d, y, z]) => {
    if (r === 'body') {
      body.push(`<path d="${d}" fill="${fill}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`);
      if (pat) body.push(`<path d="${d}" fill="url(#pt${id})" opacity=".85"/>`);
      body.push(`<path d="${d}" fill="url(#dt${id})" opacity=".32"/>`);
      if (fin === 'or') body.push(`<path d="${d}" fill="url(#gd${id})" opacity=".42" stroke="#a8740a" stroke-width="1.2"/>`);
      if (fin === 'holo') body.push(`<path d="${d}" fill="url(#hl${id})" opacity=".5"/>`);
      body.push(`<path d="${d}" fill="none" stroke="${CREAM}" stroke-width="1.4" stroke-dasharray="4 3" opacity=".75" transform="translate(100 85) scale(.93) translate(-100 -85)"/>`);
    } else if (r === 'trim') {
      body.push(`<path d="${d}" fill="${fin === 'or' ? '#e0b020' : trim}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="${d}" fill="url(#dt${id})" opacity=".28"/>`);
    } else if (r === 'line') body.push(`<path d="${d}" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>`);
    else if (r === 'seam') body.push(`<path d="${d}" fill="none" stroke="${CREAM}" stroke-width="1.6" stroke-dasharray="4 3" opacity=".85"/>`);
    else if (r === 'dot') body.push(`<circle cx="${d}" cy="${y}" r="${z}" fill="${fin === 'or' ? '#f7d66b' : CREAM}" stroke="${INK}" stroke-width="2"/>`);
  });
  return `<svg class="cga" viewBox="0 0 316 194" aria-hidden="true">${defs(id, base, pat, fin)}<ellipse cx="158" cy="180" rx="84" ry="6" fill="${INK}" opacity=".18"/><g transform="translate(58 10)">${body.join('')}${wear(e)}</g></svg>`;
}

/* ---- logo : le mouton à l'étiquette jaune (n°18) ---- */
export const SHEEP = `<svg viewBox="0 0 100 100" class="cgl" aria-hidden="true"><g stroke="${INK}" stroke-width="3" stroke-linejoin="round"><rect x="31" y="74" width="6" height="16" rx="2" fill="${INK}"/><rect x="55" y="74" width="6" height="16" rx="2" fill="${INK}"/><circle cx="30" cy="62" r="14" fill="${CREAM}"/><circle cx="40" cy="50" r="18" fill="${CREAM}"/><circle cx="58" cy="46" r="20" fill="${CREAM}"/><circle cx="50" cy="64" r="18" fill="${CREAM}"/><circle cx="68" cy="60" r="14" fill="${CREAM}"/><ellipse cx="82" cy="58" rx="11" ry="13" fill="${INK}"/><ellipse cx="72" cy="47" rx="7" ry="4.5" transform="rotate(-30 72 47)" fill="${INK}"/><rect x="66" y="50" width="9" height="13" rx="2" transform="rotate(14 70 56)" fill="${YEL}"/></g><circle cx="70.5" cy="53.5" r="1.4" fill="${INK}"/><circle cx="86" cy="55" r="2" fill="${CREAM}"/></svg>`;

/* ---- dos des cartes : motif « Flocons » en papier découpé, une couleur par rareté ---- */
export const BACKC = ['#8a8070', '#2f9e5b', '#1f3fbf', '#7a45c9', '#e0a410', '#e0407a', '#16130f'];
export function backSVG(r, id) {
  const c = BACKC[r] || BACKC[0], flake = `<g stroke="${CREAM}" stroke-width="2.4" stroke-linecap="round" fill="none"><path d="M0 -12 V12 M-10.4 -6 L10.4 6 M-10.4 6 L10.4 -6"/><path d="M0 -8 L-3.5 -12 M0 -8 L3.5 -12 M0 8 L-3.5 12 M0 8 L3.5 12"/></g>`;
  return `<svg class="cgbk" viewBox="0 0 360 504" aria-hidden="true"><defs><pattern id="fk${id}" width="64" height="64" patternUnits="userSpaceOnUse"><g transform="translate(16 16)">${flake}</g><g transform="translate(48 48) scale(.8)">${flake}</g></pattern>
   ${r === 6 ? `<linearGradient id="bk${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2a2218"/><stop offset=".5" stop-color="#7a5a14"/><stop offset="1" stop-color="#16130f"/></linearGradient>` : r === 5 ? `<linearGradient id="bk${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e0407a"/><stop offset=".5" stop-color="#6a3fb5"/><stop offset="1" stop-color="#1f8fbf"/></linearGradient>` : ''}</defs>
   <rect width="360" height="504" rx="26" fill="${r >= 5 ? `url(#bk${id})` : c}"/><rect width="360" height="504" rx="26" fill="url(#fk${id})" opacity=".35"/><rect x="14" y="14" width="332" height="476" rx="18" fill="none" stroke="${CREAM}" stroke-width="3"/>
   <circle cx="180" cy="252" r="86" fill="${c === '#16130f' ? '#2a2218' : c}" stroke="${CREAM}" stroke-width="5"/><circle cx="180" cy="252" r="70" fill="${INK}" opacity=".18"/><g transform="translate(116 188) scale(1.28)">${SHEEP.replace(/^<svg[^>]*>|<\/svg>$/g, '')}</g></svg>`;
}

/* ---- packs « Cristal » : Givre (simple), Glacier (rare), Aurore (sublime) ---- */
export const PACKS = { s: { n: 'Givre', c: ['#e7f3ff', '#9cc8f0', '#4d87c4'] }, p: { n: 'Glacier', c: ['#cfe6ff', '#3f78d6', '#1b3f9a'] }, a: { n: 'Aurore', c: ['#ffd1ea', '#8a7bff', '#25b8b0'] } };
export function packSVG(kind, id) {
  const P = PACKS[kind] || PACKS.s, [c1, c2, c3] = P.c;
  return `<svg class="pks" viewBox="0 0 200 280" aria-hidden="true"><defs><linearGradient id="pk${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset=".55" stop-color="${c2}"/><stop offset="1" stop-color="${c3}"/></linearGradient></defs>
   <path d="M20 14 l8 -6 l8 6 l8 -6 l8 6 l8 -6 l8 6 l8 -6 l8 6 l8 -6 l8 6 l8 -6 l8 6 l8 -6 l8 6 l8 -6 l8 6 l8 -6 l8 6 V266 l-8 6 l-8 -6 l-8 6 l-8 -6 l-8 6 l-8 -6 l-8 6 l-8 -6 l-8 6 l-8 -6 l-8 6 l-8 -6 l-8 6 l-8 -6 l-8 6 l-8 -6 l-8 6 l-8 -6 Z" fill="url(#pk${id})" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
   <g class="pk-f" fill="#fff" opacity=".28"><path d="M20 14 L100 60 L20 130 Z"/><path d="M180 14 L120 90 L180 150 Z"/><path d="M30 266 L90 190 L170 266 Z"/></g>
   <g fill="none" stroke="${INK}" stroke-width="2" opacity=".5"><path d="M20 130 L100 60 L180 150"/><path d="M90 190 L100 60 M90 190 L170 266"/></g>
   <circle cx="100" cy="130" r="48" fill="${INK}" opacity=".2"/><circle cx="100" cy="130" r="44" fill="${CREAM}" stroke="${INK}" stroke-width="4"/><g transform="translate(66 96) scale(.68)">${SHEEP.replace(/^<svg[^>]*>|<\/svg>$/g, '')}</g>
   <rect x="38" y="204" width="124" height="28" rx="6" fill="${INK}"/><text x="100" y="224" text-anchor="middle" font-family="Archivo, Arial Black, sans-serif" font-weight="800" font-size="19" fill="${CREAM}" letter-spacing="2">${P.n.toUpperCase()}</text>
   <g class="pk-cr" fill="none" stroke="${CREAM}" stroke-width="3" stroke-linecap="round"><path d="M100 82 L92 112 L108 130 L94 160 L104 190"/><path d="M92 112 L70 122 M108 130 L134 124 M94 160 L76 176"/></g></svg>`;
}
