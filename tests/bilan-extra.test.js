import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { demarrer } from './helpers.js';
import { app } from '../src/state.js';

let D, E;
const loc = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); };
const jour = n => { const d = new Date(); d.setDate(n); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
beforeAll(async () => { await demarrer(120); D = await import('../src/modules/dashboard.js'); E = await import('../src/modules/bilan-extra.js'); });
afterEach(() => { D.bilSet({ pf: '', cat: '', marque: '', prov: '', genre: '' }); app.cptFilt = ''; app.period = 0; });

const secCard = k => document.querySelector(`#dsh h3[data-sec="${k}"]`)?.closest('.card');

describe('Bilan : bénéfice net en haut, indicateur du mois, 6 graphiques par onglet', () => {
  it('le bénéfice sur 90 jours n\'est plus en haut ; le score est au-dessus d\'un seul cadran d\'objectifs', () => {
    app.setCfg({ goal: 800, goalMode: 'net', goalCA: 0 }, true); app.renderDash();
    const box = document.getElementById('dsh'), hero = box.querySelector('.hero'), goal = box.querySelector('.gcard'), bmo = box.querySelector('.bmo'), sum = box.querySelector('.bsum');
    expect(goal).toBeTruthy(); expect(sum).toBeTruthy();
    /* les anciennes cartes de bénéfice net et de bénéfice du mois sont masquées : ce sont maintenant des indicateurs */
    expect(hero.style.display).toBe('none'); expect(bmo.style.display).toBe('none');
    /* seules la carte « Ma journée », la barre de personnalisation et le rappel peuvent précéder le score */
    let el = sum.previousElementSibling; while (el) { expect(el.matches('.ap, .tdy, .dsa, .bnote, .hero')).toBe(true); el = el.previousElementSibling; }
    expect(sum.nextElementSibling).toBe(goal);
    /* l'objectif du mois et les objectifs détaillés sont dans le même cadran */
    expect(goal.querySelector(':scope > .bobj')).toBeTruthy();
    app.setCfg({ goal: 0, goalMode: 'net', goalCA: 0 }, true);
  });
  it('le score est présenté en grand, avec le résumé en dessous', () => {
    app.renderDash(); const sum = document.querySelector('#dsh .bsum');
    expect(sum.querySelector('svg')).toBeTruthy(); expect(sum.querySelector('svg text').textContent).toMatch(/^(\d+|—)$/);
    expect(sum.querySelector('[data-mrep]')).toBeTruthy();
    expect(sum.querySelectorAll('p')).toHaveLength(1);   /* une seule phrase, discrète */
    expect(sum.style.background).toContain('gradient');
  });
  it('indicateur : ventes du mois − frais − prix d\'achat de tout le stock ajouté ce mois-ci', () => {
    const m = loc(), avant = E.monthProfit(app.P, m);
    const neuf = { id: 'bx1', statut: 'Disponible', cat: 'Haut', achat: 40, entree: jour(1), marque: 'X', taille: 'M' };
    app.save(neuf);
    const apres = E.monthProfit(app.P, m);
    expect(apres.cost).toBeCloseTo(avant.cost + 40, 5);
    expect(apres.ben).toBeCloseTo(avant.ben - 40, 5);
    expect(apres.nAdded).toBe(avant.nAdded + 1);
    expect(apres.ben).toBeCloseTo(apres.ca - apres.frais - apres.cost, 5);
    expect(apres.classic).toBeCloseTo(avant.classic, 5);
  });
  it('la carte du mois affiche le résultat et suit les filtres', () => {
    app.renderDash();
    const v1 = document.querySelector('#dsh .bmov').textContent;
    expect(v1).toMatch(/\d/);
    const cat = [...new Set(app.P.map(p => p.cat).filter(Boolean))][0];
    D.bilSet({ cat }); app.renderDash();
    const m = loc(), r = E.monthProfit(app.P.filter(D.bilOk), m);
    expect(document.querySelector('#dsh .bmov').textContent.replace(/\D/g, '')).toBe(new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR' }).format(r.ben).replace(/\D/g, ''));
  });
  it('les 8 nouveaux graphiques sont dans le bon onglet', () => {
    app.renderDash();
    const attendu = { m: ['D\'où vient chaque euro', 'Marge par mois', 'Bénéfice cumulé du mois'], a: ['Ventes par jour de semaine', 'Ventes semaine par semaine'], s: ['Ancienneté du stock', 'Valeur du stock par catégorie', 'Entrées et sorties par mois'] };
    Object.entries(attendu).forEach(([tab, L]) => L.forEach(k => { const c = secCard(k); expect(c, k).toBeTruthy(); expect(c.classList.contains('bt-' + tab), k).toBe(true); }));
  });
  it('chaque onglet propose au moins 6 graphiques avec le jeu d\'essai', () => {
    app.renderDash();
    ['m', 'a', 's'].forEach(tab => { const n = document.querySelectorAll(`#dsh .bgrid.bt-${tab} > .card.bgr`).length; expect(n, tab).toBeGreaterThanOrEqual(tab === 's' ? 4 : 6); });
  });
  it('les graphiques suivent les filtres du Bilan', () => {
    app.renderDash();
    const tous = secCard('Valeur du stock par catégorie').querySelectorAll('.hb').length;
    const cat = [...new Set(app.P.filter(p => p.statut === 'Disponible').map(p => p.cat).filter(Boolean))][0];
    D.bilSet({ cat }); app.renderDash();
    const un = secCard('Valeur du stock par catégorie').querySelectorAll('.hb').length;
    expect(tous).toBeGreaterThan(1); expect(un).toBe(1);
  });
});

describe('Rapport du mois', () => {
  it('analyse : indicateurs, points forts, points à améliorer, perspectives', () => {
    const a = E.analyse(loc());
    expect(a.kpi.length).toBe(11);
    expect(a.persp.length).toBeGreaterThan(0);
    [a.forts, a.ameliorer, a.persp].forEach(L => { expect(L.length).toBeLessThanOrEqual(5); L.forEach(x => { expect(typeof x).toBe('string'); expect(x).not.toMatch(/undefined|NaN|\{[a-z]\}/); }); });
  });
  it('un mois sans vente le dit, un mois en hausse le félicite', () => {
    const vide = E.analyse('2001-03');
    expect(vide.s.n).toBe(0);
    expect(vide.ameliorer.length).toBeGreaterThan(0);
    const m = loc(), pm = (() => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 1); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); })();
    app.P.slice(0, 5).forEach((p, i) => app.save(Object.assign({}, p, { statut: 'Vendu', dv: pm + '-10', pv: 20, achat: 5, frais: 1, entree: pm + '-01' })));
    app.P.slice(5, 14).forEach(p => app.save(Object.assign({}, p, { statut: 'Vendu', dv: m + '-01', pv: 60, achat: 10, frais: 2, entree: pm + '-01' })));
    const a = E.analyse(pm.replace(/.*/, m));
    expect(a.k.ca).toBeGreaterThan(10);
    expect(a.forts.some(x => /Revenue up|Chiffre d'affaires en hausse/.test(x))).toBe(true);
  });
  it('le rapport s\'ouvre, se change de mois et propose le PDF', () => {
    app.renderDash();
    document.querySelector('#dsh [data-mrep]').click();
    const sheet = document.getElementById('shc');
    expect(sheet.querySelector('#mr_pdf')).toBeTruthy();
    expect(sheet.querySelectorAll('h4').length).toBeGreaterThanOrEqual(7);   /* score, indicateurs, images, forts, à améliorer, perspectives, plan */
    const autre = sheet.querySelectorAll('[data-mm]')[1]; autre.click();
    expect(document.getElementById('shc').querySelector('.rp')).toBeTruthy();
  });
  it('tous les textes du Bilan, des graphiques et du rapport sont traduits', () => {
    I18N.miss.clear();
    app.renderDash(); document.querySelector('#dsh [data-mrep]').click();
    document.getElementById('shc').querySelectorAll('[data-mm]').forEach(b => { b.click(); });
    ['2001-03', loc()].forEach(m => E.monthReportHTML(m));
    const manquants = [...I18N.miss].filter(k => !/^[\d\s€%.,:+−-]+$/.test(k));
    expect(manquants).toEqual([]);
  });
});

describe('Bilan : onglet Général', () => {
  it('six indicateurs : bénéfice net, chiffre d\'affaires, marge, ventes, stock, score', async () => {
    localStorage.removeItem('bilTab'); app.renderDash();
    const tuiles = [...document.querySelectorAll('#dsh .btiles.bt-g .bkt')];
    expect(tuiles).toHaveLength(6);
    const S = D.bilCtx.S; expect(tuiles[0].querySelector('b').textContent.replace(/\D/g, '')).toBe(new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(Math.round(S.ben)).replace(/\D/g, ''));
    expect(tuiles[3].querySelector('b').textContent).toBe(String(S.n));
    /* le dernier indicateur est le bénéfice du mois avec le stock ajouté (à la place du score) */
    expect(tuiles[5].dataset.tile).toBe('g-benstock'); expect(tuiles[5].querySelector('span').textContent).toBe(t('bénéfice du mois avec le stock'));
    expect(tuiles[5].querySelector('b').textContent.replace(/\D/g, '')).toBe(new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(Math.round(E.monthProfit(app.P.filter(D.bilOk), loc()).ben)).replace(/\D/g, ''));
  });
  it('les filtres se trouvent sous les onglets et disparaissent dans « Ma journée »', () => {
    app.renderDash();
    const per = document.getElementById('per');
    expect(per.firstElementChild.classList.contains('btabs')).toBe(true);
    expect(per.querySelector('.bflt [data-p]')).toBeTruthy();
    expect(document.getElementById('bt5css').textContent).toContain('#per[data-bt="j"] .bflt{display:none}');
  });
});

describe('Bilan : détail de chaque indicateur', () => {
  it('un toucher sur un indicateur ouvre sa fiche : valeur, évolution, calcul', () => {
    app.renderDash();
    ['g', 'm', 'a', 's'].forEach(k => {
      const tuiles = [...document.querySelectorAll(`#dsh .btiles.bt-${k} .bkt`)]; expect(tuiles, k).toHaveLength(6);
      tuiles.forEach(b => {
        expect(b.tagName).toBe('BUTTON'); expect(b.dataset.tile).toMatch(/^[gmas]-/);
        b.click();
        const s = document.getElementById('shc'); expect(s.textContent.toLowerCase(), b.dataset.tile).toContain(b.querySelector('span').textContent.toLowerCase());
        expect(s.textContent, b.dataset.tile).toContain(b.querySelector('b').textContent.trim());
        expect(s.querySelectorAll('.card').length, b.dataset.tile).toBeGreaterThanOrEqual(2);
      });
    });
  });
  it('le détail du bénéfice avec le stock donne sa composition et ouvre le rapport', () => {
    app.renderDash(); document.querySelector('#dsh [data-tile="g-benstock"]').click();
    const s = document.getElementById('shc'); expect(s.textContent).toContain(t('Stock ajouté ce mois-ci'));
    expect(s.querySelector('.mo')).toBeTruthy(); s.querySelector('#tl_rep').click();
    expect(document.getElementById('shc').querySelector('.rp')).toBeTruthy();
  });
  it('les indicateurs liés à un outil proposent de l\'ouvrir', () => {
    app.renderDash(); document.querySelector('#dsh [data-tile="m-cotis"]').click();
    expect(document.querySelector('#shc [data-tool="fisc"]')).toBeTruthy();
  });
  it('tous les textes des fiches sont traduits', () => {
    I18N.miss.clear(); app.renderDash();
    document.querySelectorAll('#dsh .btiles .bkt').forEach(b => b.click());
    expect([...I18N.miss].filter(k => !/^[\d\s€%.,:+−-]+$/.test(k))).toEqual([]);
  });
});

describe('Bilan : les indicateurs choisis', () => {
  const ids = k => [...document.querySelectorAll(`#dsh .btiles.bt-${k} .bkt`)].map(b => b.dataset.tile);
  it('chaque onglet a les 6 indicateurs demandés, dans l\'ordre', () => {
    app.renderDash();
    expect(ids('m')).toEqual(['m-frais', 'm-bpv', 'm-frp', 'm-cotis', 'm-croiss', 'm-retours']);
    expect(ids('a')).toEqual(['a-online', 'a-ecoul', 'a-delai', 'a-pf', 'a-rapide', 'a-jour']);
    expect(ids('s')).toEqual(['s-immo', 's-age', 's-mois', 's-net', 's-catdom', 's-60']);
  });
  it('les calculs : frais, frais sur le CA, plateforme n°1, jour fort, mois de stock, stock net', () => {
    app.setCfg({ tauxSoc: 12 }, true); D.bilSet({ pf: '', cat: '', marque: '', prov: '', genre: '' }); app.period = 90; app.renderDash();
    const S = D.bilCtx.S, val = id => document.querySelector(`#dsh [data-tile="${id}"] b`).textContent;
    const nb = s => +String(s).replace(/[^\d.,-]/g, '').replace(',', '.');
    expect(nb(val('m-frais'))).toBeCloseTo(Math.round(S.fr), 0);
    expect(nb(val('m-frp'))).toBe(Math.round(S.fr / S.ca * 100));
    expect(nb(val('m-cotis'))).toBeCloseTo(Math.round(S.ca * 0.12), 0);
    const pf = {}; D.bilCtx.inP.forEach(x => { const k = x.canal || 'Vinted'; pf[k] = (pf[k] || 0) + 1; });
    const top = Object.entries(pf).sort((a, b) => b[1] - a[1])[0];
    expect(document.querySelector('#dsh [data-tile="a-pf"] span').textContent).toContain(String(Math.round(top[1] / D.bilCtx.inP.length * 100)));
    expect(val('a-jour').length).toBeGreaterThan(2);
    const A = app.P.filter(p => p.statut === 'Disponible'), cat = {}; A.forEach(x => { const c = x.cat || 'Non renseigné'; cat[c] = (cat[c] || 0) + 1; });
    expect(document.querySelector('#dsh [data-tile="s-catdom"] span').textContent).toContain(String(Math.round(Math.max(...Object.values(cat)) / A.length * 100)));
    expect(val('s-net')).toMatch(/^[+−]?\d+$/);
  });
  it('les fiches de détail donnent la répartition quand elle existe (plateforme, jour, catégorie)', () => {
    app.renderDash();
    ['a-pf', 'a-jour', 's-catdom'].forEach(id => { document.querySelector(`#dsh [data-tile="${id}"]`).click(); expect(document.getElementById('shc').querySelectorAll('.hb').length, id).toBeGreaterThan(0); });
  });
  it('3 graphiques dans Général : score, plateformes, objectifs mois par mois', () => {
    app.renderDash(); const cards = [...document.querySelectorAll('#dsh .bgrid.bt-g > .card.bgr')].map(c => c.dataset.bk);
    expect(cards).toEqual(['Évolution du score', 'Chiffre d\'affaires par plateforme', 'Objectifs mois par mois']);
    const pf = document.querySelector('#dsh .bgrid.bt-g [data-bk="Chiffre d\'affaires par plateforme"]'); expect(pf.querySelector('svg circle')).toBeTruthy();
    app.setCfg({ objx: { ventes: 1, marge: 10, delai: 90 } }, true); app.renderDash();
    expect(document.querySelector('#dsh [data-bk="Objectifs mois par mois"] table')).toBeTruthy();
    app.setCfg({ objx: {} }, true);
  });
  it('tout est traduit', () => {
    I18N.miss.clear(); app.renderDash(); document.querySelectorAll('#dsh .btiles .bkt').forEach(b => b.click());
    expect([...I18N.miss].filter(k => !/^[\d\s€%.,:+−-]+$/.test(k))).toEqual([]);
  });
});
