import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { demarrer } from './helpers.js';
import { app } from '../src/state.js';

let D, B, K;
beforeAll(async () => { await demarrer(120); D = await import('../src/modules/dashboard.js'); B = await import('../src/modules/bilan-tabs.js'); K = await import('../src/modules/ballots-calendar.js'); });
afterEach(() => { D.bilSet({ pf: '', cat: '', marque: '', prov: '', genre: '' }); app.cptFilt = ''; app.period = 0; });

const vendues = () => app.P.filter(p => p.statut === 'Vendu');
const enStock = () => app.P.filter(p => p.statut === 'Disponible');
const cats = () => [...new Set(vendues().map(p => p.cat).filter(Boolean))];
const tuile = (k, i) => B.tilesOf(k)[i][0];
const txt = () => document.getElementById('dsh').textContent;

describe('Bilan : les filtres valent pour tous les indicateurs et graphiques', () => {
  it('le jeu d\'essai a plusieurs catégories de pièces vendues et en stock', () => {
    expect(cats().length).toBeGreaterThan(1); expect(enStock().length).toBeGreaterThan(3);
  });
  it('onglet Stock : pièces, argent immobilisé et fiches suivent le filtre', () => {
    const c = cats()[0], tout = enStock().length;
    D.bilSet({ cat: c });
    const A = enStock().filter(p => p.cat === c);
    expect(A.length).toBeLessThan(tout);
    expect(tuile('s', 0)).toBe(A.length);
    expect(tuile('s', 3)).toBe(A.filter(p => !p.pub).length);
  });
  it('onglet Activité : pièces vendues et pièces en ligne suivent le filtre', () => {
    const c = cats()[0]; D.bilSet({ cat: c });
    const F = app.P.filter(p => p.cat === c), sd = F.filter(p => p.statut === 'Vendu').length;
    expect(tuile('a', 2)).toBe(Math.round(sd / F.length * 100) + ' %');
    expect(tuile('a', 5)).toBe(F.filter(p => p.statut === 'Disponible' && p.pub).length);
  });
  it('le tableau du Bilan : stock actuel, six mois, calendrier, retours et ballots filtrés', () => {
    const c = cats()[0], F = app.P.filter(p => p.cat === c);
    D.bilSet({ cat: c }); app.period = 0; app.renderDash();
    const t1 = txt(), nStock = F.filter(p => p.statut === 'Disponible').length;
    const sub = document.querySelector('#dsh h3[data-sec="Stock actuel"]').closest('.card').querySelector('.sub').textContent;
    expect(parseInt(sub, 10)).toBe(nStock);
    /* calendrier : ventes du mois affiché = ventes de la catégorie ce mois-là */
    const m = app.calM || new Date().toISOString().slice(0, 7);
    const attendu = F.filter(p => p.statut === 'Vendu' && (p.dv || '').startsWith(m)).length;
    const cal = document.querySelector('#dsh .calh .sub'); if (cal) expect(parseInt(cal.textContent, 10)).toBe(attendu);
    D.bilSet({ cat: '' }); app.renderDash();
    expect(txt()).not.toBe(t1);
  });
  it('les ballots du Bilan suivent le filtre, mais la trésorerie compte tous les ballots', () => {
    const tous = K.ballotsData();
    if (!tous.length) return;
    const c = cats()[0]; D.bilSet({ cat: c });
    const filtres = K.ballotsData(D.bilOk);
    expect(K.ballotsData().length).toBe(tous.length);
    filtres.forEach(b => { const t0 = tous.find(x => x.name === b.name); expect(b.n).toBeLessThanOrEqual(t0.n); });
  });
  it('les retours ne comptent que les pièces retenues', () => {
    const p = vendues()[0]; app.save(Object.assign({}, p, { retours: [{ d: p.dv, p: 5, m: 'Taille' }] }));
    expect(app.retoursHTML()).not.toBe('');
    const autre = cats().find(x => x !== p.cat); D.bilSet({ cat: autre });
    expect(app.retoursHTML()).toBe('');
    D.bilSet({ cat: p.cat }); expect(app.retoursHTML()).not.toBe('');
  });
  it('« Par compte » respecte la période et les critères', () => {
    const s = require_src();
    expect(s).toContain('(!to||(x.dv||\'\')<=to)&&advOk(x)&&(app.compteOf(x)||{}).id===c.id');
  });
});

import fs from 'node:fs';
import path from 'node:path';
const require_src = () => fs.readFileSync(path.resolve(process.cwd(), 'src/modules/dashboard.js'), 'utf8');
