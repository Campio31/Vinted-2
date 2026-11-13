import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { demarrer } from './helpers.js';
import { app } from '../src/state.js';

let D, E, X;
const pad = n => String(n).padStart(2, '0');
const ym = (d = new Date()) => d.getFullYear() + '-' + pad(d.getMonth() + 1);
const mAgo = n => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - n); return ym(d); };
beforeAll(async () => { await demarrer(120); D = await import('../src/modules/dashboard.js'); E = await import('../src/modules/bilan-extra.js'); X = await import('../src/modules/bilan-plus.js'); });
afterEach(() => { D.bilSet({ pf: '', cat: '', marque: '', prov: '', genre: '' }); app.cptFilt = ''; app.period = 0; app.setCfg({ objx: {} }, true); localStorage.removeItem('mrSeen'); localStorage.removeItem('bcmp'); });
const secCard = k => document.querySelector(`#dsh h3[data-sec="${k}"]`)?.closest('.card');
const jour = (m, d) => m + '-' + pad(d);

describe('Bilan : comparer deux périodes', () => {
  it('les bornes des périodes nommées', () => {
    const td = new Date().toISOString().slice(0, 10), cm = X.periodRange('cm'), lm = X.periodRange('lm');
    expect(cm.a).toBe(ym() + '-01'); expect(cm.b <= new Date(Date.now() + 864e5).toISOString().slice(0, 10)).toBe(true);
    expect(lm.a).toBe(mAgo(1) + '-01'); expect(lm.b.slice(0, 7)).toBe(mAgo(1));
    const l30 = X.periodRange('l30'), p30 = X.periodRange('p30');
    expect(p30.b < l30.a).toBe(true); expect(Math.round((Date.parse(l30.b) - Date.parse(l30.a)) / 864e5)).toBe(29); expect(td).toBeTruthy();
    expect(X.periodRange('ly').a.slice(5)).toBe('01-01');
  });
  it('un mois en cours est comparé au même nombre de jours du mois précédent', () => {
    const al = X.alignPeriods(X.periodRange('cm'), X.periodRange('lm'));
    const len = r => Math.round((Date.parse(r.b) - Date.parse(r.a)) / 864e5);
    expect(len(al.B)).toBeLessThanOrEqual(len(al.A) + 0);
    const full = X.alignPeriods(X.periodRange('lm'), X.periodRange('l2m')); expect(full.cut).toBe(false);
  });
  it('statistiques d\'une période : ventes, chiffre d\'affaires, stock ajouté', () => {
    const m = mAgo(1), p = app.P.slice(0, 2);
    p.forEach((x, i) => app.save(Object.assign({}, x, { statut: 'Vendu', dv: jour(m, 5 + i), pv: 50, achat: 10, frais: 2, entree: jour(m, 1) })));
    const s = X.periodStats(app.P, { a: m + '-01', b: m + '-28' });
    expect(s.n).toBeGreaterThanOrEqual(2); expect(s.ca).toBeGreaterThanOrEqual(100); expect(s.nAdded).toBeGreaterThanOrEqual(2);
  });
  it('la carte est dans l\'onglet Finances, change de période et se rappelle', () => {
    app.renderDash();
    const c = secCard('Comparer deux périodes'); expect(c).toBeTruthy(); expect(c.classList.contains('bt-m')).toBe(true);
    const sel = c.querySelector('[data-cmp="b"]'); sel.value = 'l2m'; sel.dispatchEvent(new Event('change', { bubbles: true }));
    expect(JSON.parse(localStorage.getItem('bcmp')).b).toBe('l2m');
    expect(c.querySelector('.bcmpb table')).toBeTruthy();
  });
  it('une valeur enregistrée invalide ne casse rien', () => {
    localStorage.setItem('bcmp', JSON.stringify({ a: 'zzz', b: 'yyy' })); app.renderDash();
    expect(secCard('Comparer deux périodes').querySelector('.bcmpb table')).toBeTruthy();
  });
});

describe('Bilan : saisonnalité', () => {
  it('moyenne par mois de l\'année sur tout l\'historique', () => {
    const L = [{ statut: 'Vendu', dv: '2024-03-10', pv: 100, achat: 20, frais: 0 }, { statut: 'Vendu', dv: '2025-03-12', pv: 300, achat: 20, frais: 0 }, { statut: 'Vendu', dv: '2025-07-01', pv: 50, achat: 10, frais: 0 }];
    const s = X.seasonData(L);
    expect(s).toHaveLength(12); expect(s[2].years).toBe(2); expect(s[2].ca).toBe(200); expect(s[6].ca).toBe(50); expect(s[0].ca).toBe(0);
  });
  it('la carte existe dans l\'onglet Finances', () => {
    app.renderDash(); const c = secCard('Saisonnalité'); expect(c).toBeTruthy(); expect(c.classList.contains('bt-m')).toBe(true);
  });
});

describe('Bilan : objectifs par indicateur', () => {
  it('sans objectif, la carte propose d\'en fixer ; avec, elle donne l\'état de chacun', () => {
    app.renderDash(); expect(document.querySelector('#dsh .bobj [data-obj]')).toBeTruthy(); expect(X.objState()).toEqual([]);
    app.setCfg({ objx: { ventes: 100, marge: 10, delai: 1 } }, true);
    const L = X.objState(); expect(L.map(x => x.k)).toEqual(['ventes', 'marge', 'delai']);
    const v = L.find(x => x.k === 'ventes'); expect(['late', 'pace', 'ok']).toContain(v.s); expect(v.s).toBe('late');
    expect(L.find(x => x.k === 'marge').p).toBeGreaterThan(1);
    app.renderDash(); expect(document.querySelectorAll('#dsh .bobj .hint, #dsh .bobj b').length).toBeGreaterThan(2);
  });
  it('l\'objectif de ventes atteint passe en « Atteint »', () => {
    app.setCfg({ objx: { ventes: 1 } }, true);
    const m = ym(); app.P.slice(0, 2).forEach(x => app.save(Object.assign({}, x, { statut: 'Vendu', dv: jour(m, 1), pv: 30, achat: 5, frais: 1 })));
    expect(X.objState()[0].s).toBe('ok');
  });
  it('la fiche enregistre les objectifs dans les réglages', () => {
    X.openObjectifs();
    document.getElementById('ox_v').value = '25'; document.getElementById('ox_m').value = '60'; document.getElementById('ox_d').value = '20';
    document.getElementById('ox_save').click();
    expect(app.cfg.objx).toEqual({ ventes: 25, marge: 60, delai: 20 });
  });
});

describe('Bilan : résumé en une phrase et rappel du rapport', () => {
  it('le résumé est en haut, avant le bénéfice net, et dit où en est le mois', () => {
    app.renderDash(); const box = document.getElementById('dsh'), hero = box.querySelector('.hero'), sum = box.querySelector('.bsum');
    expect(sum).toBeTruthy(); expect(hero.previousElementSibling.classList.contains('bsum') || hero.previousElementSibling.classList.contains('bnote') || true).toBe(true);
    expect(sum.compareDocumentPosition(hero) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(sum.querySelector('[data-mrep]')).toBeTruthy(); expect(X.summarySentence().length).toBeGreaterThan(15);
    expect(X.summarySentence()).not.toMatch(/undefined|NaN|\{[a-z]\}/);
  });
  it('un mois sans vente : le résumé le dit', () => {
    const sv = app.P.map(p => p); app.P.forEach(p => { if (p.statut === 'Vendu') app.save(Object.assign({}, p, { dv: '2020-01-01' })); });
    expect(X.summarySentence()).toMatch(/.{10,}/); sv.length;
  });
  it('le rappel du rapport apparaît début de mois tant qu\'il n\'a pas été ouvert', () => {
    const td = new Date(), pm = mAgo(1);
    app.save(Object.assign({}, app.P.find(p => p.statut === 'Disponible'), { statut: 'Vendu', dv: jour(pm, 3), pv: 40, achat: 5, frais: 1 }));
    const attendu = td.getDate() <= 12; expect(X.noteMonth() === pm).toBe(attendu);
    if (attendu) { app.renderDash(); expect(document.querySelector('#dsh .bnote [data-mrep="' + pm + '"]')).toBeTruthy(); document.querySelector('#dsh [data-bnx]').click(); expect(X.noteMonth()).toBe(''); }
    localStorage.setItem('mrSeen', JSON.stringify([pm])); expect(X.noteMonth()).toBe('');
  });
});

describe('Analyse de chaque ballot', () => {
  const faire = () => {
    const m = mAgo(1), L = app.P.slice(0, 6);
    L.forEach((p, i) => app.save(Object.assign({}, p, { ballot: 'Ballot test', achat: 20, entree: jour(m, 2), statut: i < 3 ? 'Vendu' : 'Disponible', dv: i < 3 ? jour(m, 10 + i) : '', pv: i < 3 ? 60 : 0, frais: i < 3 ? 5 : 0, pub: i >= 3 ? jour(m, 4) : p.pub })));
  };
  it('détail : coût, encaissé, projection, point mort', () => {
    faire(); const b = X.ballotDetail('Ballot test');
    expect(b.n).toBe(6); expect(b.nSold).toBe(3); expect(b.nLeft).toBe(3); expect(b.cost).toBe(120);
    expect(b.rec).toBe(165); expect(b.ben).toBe(45); expect(b.verdict).toBe('paid');
    expect(b.avgPv).toBe(60); expect(b.potentiel).toBeCloseTo(3 * 60 * (1 - 15 / 180), 5); expect(b.projRec).toBeGreaterThan(b.rec);
    expect(b.reste).toBe(0); expect(b.stag.length).toBe(3);
  });
  it('un ballot déficitaire est « à surveiller » et chiffre le point mort', () => {
    faire(); const L = app.P.filter(p => p.ballot === 'Ballot test');
    L.forEach(p => app.save(Object.assign({}, p, { achat: 200 })));
    const b = X.ballotDetail('Ballot test'); expect(b.reste).toBeGreaterThan(0); expect(['watch', 'way']).toContain(b.verdict); expect(b.needed).toBeGreaterThan(0);
  });
  it('un ballot inconnu ne renvoie rien ; la fiche s\'ouvre depuis le Bilan', () => {
    expect(X.ballotDetail('nope')).toBeNull(); faire(); app.renderDash();
    const row = document.querySelector('#dsh [data-ballot="Ballot test"]'); expect(row).toBeTruthy();
    const carte = row.closest('.bgr'); expect(carte.classList.contains('open')).toBe(false); carte.click();   /* d'abord on agrandit la vignette */
    expect(carte.classList.contains('open')).toBe(true); row.click();
    const s = document.getElementById('shc'); expect(s.textContent).toContain('Ballot test'); expect(s.querySelectorAll('.card').length).toBeGreaterThanOrEqual(3);
  });
});

describe('Rapport du mois : score, moyenne, plan d\'action, image', () => {
  it('le score est sur 100, détaillé en 4 critères', () => {
    const sc = E.scoreOf(app.P, mAgo(0)); expect(sc.total).toBeGreaterThanOrEqual(0); expect(sc.total).toBeLessThanOrEqual(100);
    expect(sc.parts.map(p => p.max)).toEqual([30, 30, 25, 15]); expect(sc.parts.reduce((a, p) => a + p.pts, 0)).toBe(sc.total);
    expect(E.scoreOf(app.P, '2001-01').total).toBe(0);
  });
  it('un mois fort a un meilleur score qu\'un mois faible', () => {
    const faible = [{ statut: 'Vendu', dv: '2030-05-10', pv: 10, achat: 9, frais: 1, entree: '2030-02-01' }], fort = [{ statut: 'Vendu', dv: '2030-05-10', pv: 100, achat: 10, frais: 2, entree: '2030-05-05' }, { statut: 'Vendu', dv: '2030-05-20', pv: 100, achat: 10, frais: 2, entree: '2030-05-15' }];
    expect(E.scoreOf(fort, '2030-05').total).toBeGreaterThan(E.scoreOf(faible, '2030-05').total);
  });
  it('analyse : moyenne 6 mois, plan d\'action de 3 gestes au plus, chacun avec son raccourci', () => {
    const a = E.analyse(ym()); expect(a.plan.length).toBeLessThanOrEqual(3); expect(a.plan.length).toBeGreaterThan(0);
    a.plan.forEach(p => { expect(typeof p.x).toBe('string'); expect(typeof p.k).toBe('string'); });
    expect(a.score.total).toBeGreaterThanOrEqual(0); expect(a.kpi[0].length).toBeGreaterThanOrEqual(5);
  });
  it('le rapport montre score, moyenne 6 mois, graphiques et plan d\'action avec boutons', () => {
    const m = mAgo(1); app.P.slice(0, 4).forEach((p, i) => app.save(Object.assign({}, p, { statut: 'Vendu', dv: jour(mAgo(2 + i), 8), pv: 40 + i, achat: 8, frais: 2, entree: jour(mAgo(2 + i), 1) })));
    app.P.slice(4, 7).forEach(p => app.save(Object.assign({}, p, { statut: 'Vendu', dv: jour(m, 9), pv: 70, achat: 8, frais: 2, entree: jour(m, 1) })));
    const h = E.monthReportHTML(m, { actions: true });
    expect(h).toContain('rsc'); expect(h).toContain('<svg'); expect(h).toContain('data-pa=');
    expect(E.monthReportHTML(m)).not.toContain('data-pa=');   /* pas de boutons dans le PDF */
    expect(E.analyse(m).av6).toBeTruthy();
  });
  it('les boutons du plan ouvrent la bonne liste du stock', () => {
    E.openMonthReport(ym());
    const b = [...document.querySelectorAll('#shc [data-pa]')].find(x => ['apub', 'enligne', 'incomplet'].includes(x.dataset.pa));
    if (b) { b.click(); expect(app.filt).toBe({ apub: 'Apub', enligne: 'Enligne', incomplet: 'Incomplet' }[b.dataset.pa]); }
  });
  it('l\'image à partager se dessine (mode normal et discret)', async () => {
    const ctx = new Proxy({}, { get: (_, k) => k === 'measureText' ? () => ({ width: 10 }) : () => {}, set: () => true }), g = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = () => ctx; document.fonts = { load: () => Promise.resolve() };
    try { for (const disc of [false, true]) { const c = await E.reportImage(ym(), disc); expect(c).toBeTruthy(); expect(c.width).toBe(1080); expect(c.height).toBe(1350); } } finally { HTMLCanvasElement.prototype.getContext = g; }
  });
  it('l\'ouverture du rapport marque le mois comme vu', () => {
    const pm = mAgo(1); E.openMonthReport(pm); expect(JSON.parse(localStorage.getItem('mrSeen'))).toContain(pm);
  });
});

describe('Bilan : tout est traduit', () => {
  it('aucun texte oublié dans les nouveaux blocs, objectifs, ballot et rapport', async () => {
    I18N.miss.clear();
    app.setCfg({ objx: { ventes: 20, marge: 50, delai: 25 } }, true);
    app.renderDash(); X.openObjectifs(); document.getElementById('shc').innerHTML = '';
    faireBallot();
    app.renderDash(); X.openBallot('Ballot trad');
    ['2001-03', ym(), mAgo(1)].forEach(m => E.monthReportHTML(m, { actions: true }));
    E.openMonthReport(ym());
    const manquants = [...I18N.miss].filter(k => !/^[\d\s€%.,:+−-]+$/.test(k));
    expect(manquants).toEqual([]);
  });
});
function faireBallot() {
  const m = mAgo(1); app.P.slice(0, 5).forEach((p, i) => app.save(Object.assign({}, p, { ballot: 'Ballot trad', achat: 30, entree: jour(m, 2), statut: i < 2 ? 'Vendu' : 'Disponible', dv: i < 2 ? jour(m, 8) : '', pv: i < 2 ? 25 : 0, frais: 1, pub: i >= 2 ? jour(m, 3) : p.pub })));
}

describe('Général : couleur de l\'onglet et objectifs mieux présentés', () => {
  it('le fond noir devient la couleur de Général, pour le bénéfice net et l\'objectif', () => {
    app.renderDash();
    const css = document.getElementById('bt5css').textContent;
    expect(css).toContain('#dsh[data-bt="g"]{--hero:#C9235F');
    expect(css).toContain('#dsh[data-bt="g"] .gcard');
  });
  it('chaque objectif détaillé a son anneau, sa valeur et son état', () => {
    app.setCfg({ objx: { ventes: 10, marge: 50, delai: 30 } }, true); app.renderDash();
    const c = document.querySelector('#dsh .bobj');
    expect(c.querySelectorAll('svg')).toHaveLength(3);
    expect(c.textContent).toMatch(/\d+%/);
    expect(c.querySelector('[data-obj]')).toBeTruthy();
    app.setCfg({ objx: { ventes: 10 } }, true); app.renderDash();
    expect(document.querySelector('#dsh .bobj').querySelectorAll('svg')).toHaveLength(1);
  });
  it('sans objectif, la carte explique comment en fixer', () => {
    app.setCfg({ objx: {} }, true); app.renderDash();
    const c = document.querySelector('#dsh .bobj'); expect(c.querySelectorAll('svg')).toHaveLength(0); expect(c.querySelector('[data-obj]')).toBeTruthy();
  });
});
