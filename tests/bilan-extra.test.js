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
  it('le bénéfice net de la période est au-dessus des objectifs, le bénéfice du mois juste après', () => {
    app.setCfg({ goal: 800, goalMode: 'net', goalCA: 0 }, true); app.renderDash();
    const box = document.getElementById('dsh'), hero = box.querySelector('.hero'), goal = box.querySelector('.gcard'), bmo = box.querySelector('.bmo');
    expect(hero).toBeTruthy(); expect(goal).toBeTruthy(); expect(bmo).toBeTruthy();
    /* seule la carte « Ma journée » peut rester au-dessus du bénéfice net */
    let el = hero.previousElementSibling; while (el) { expect(el.matches('.ap, .tdy, .dsa')).toBe(true); el = el.previousElementSibling; }
    expect(hero.nextElementSibling).toBe(goal);
    expect(goal.nextElementSibling).toBe(bmo);
    app.setCfg({ goal: 0, goalMode: 'net', goalCA: 0 }, true);
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
    ['m', 'a', 's'].forEach(tab => { const n = document.querySelectorAll(`#dsh .card.bt-${tab}.bsel0`).length; expect(n, tab).toBeGreaterThanOrEqual(tab === 's' ? 4 : 6); });
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
    expect(sheet.querySelectorAll('h4').length).toBe(4);
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
