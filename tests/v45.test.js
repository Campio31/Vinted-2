import { describe, it, expect, beforeAll } from 'vitest';
import { demarrer } from './helpers.js';
import { app } from '../src/state.js';

const $ = id => document.getElementById(id);
const tick = ms => new Promise(r => setTimeout(r, ms));
let nav;
beforeAll(async () => {
  await demarrer(120);
  nav = await import('../src/modules/nav.js');
});

describe('v45 : pastille colis sur Outils', () => {
  it('la pastille de la barre est sur Outils, plus sur Vente', async () => {
    const bg = $('nbg');
    expect(bg.closest('button').dataset.v).toBe('tools');
    expect(document.querySelector('nav [data-v="sales"] .nbg')).toBeNull();
    app.renderAll(); await tick(10);
    const n = app.colisCount();
    expect(bg.hidden).toBe(!n);
    if (n) expect(bg.textContent).toBe(String(n));
  });
});

describe('v45 : Bilan', () => {
  it('le bénéfice net est juste sous la carte Objectifs, hors onglets', async () => {
    app.setCfg({ goal: 800, goalMode: 'net', goalCA: 0 }, true);
    nav.go('dash'); app.renderDash(); await tick(30);
    const box = $('dsh'), hero = box.querySelector('.hero');
    expect(hero).not.toBeNull();
    expect(hero.previousElementSibling.classList.contains('gcard')).toBe(true);
    expect(hero.className).not.toMatch(/bt-[mas]/);
    app.setCfg({ goal: 0, goalMode: 'net', goalCA: 0 }, true);
  });
  it('les indicateurs de Finances sont dans un bandeau qui défile', async () => {
    nav.go('dash'); app.renderDash(); await tick(30);
    const strip = $('dsh').querySelector('.bstrip.bt-m');
    expect(strip).not.toBeNull();
    expect(strip.querySelector('[data-tool="treso"]')).not.toBeNull();
    expect(strip.querySelector('.kpis')).not.toBeNull();
    expect($('dsh').querySelector(':scope > [data-tool="treso"]')).toBeNull();
    expect($('dsh').querySelector('.bstrip.bt-a [data-tool="defis"]')).not.toBeNull();
    /* « Personnaliser » retrouve toujours chaque carte, même rangée dans un bandeau */
    $('dsh').querySelector('[data-dcust]').click(); await tick(20);
    expect($('shc').querySelectorAll('.dcr').length).toBeGreaterThan(8);
    $('sheet').hidden = true;
  });
});
describe('v45 : compte en sélection', () => {
  it('la sélection peut être rangée dans un compte, ou en être retirée', async () => {
    app.setCfg({ comptes: [{ id: 'c1', n: 'Vinted perso', pf: 'Vinted', fiscal: true }, { id: 'c2', n: 'Vinted pro', pf: 'Vinted', fiscal: true }], cptMain: 'c1' }, true);
    const sel = await import('../src/modules/selection.js');
    const L = app.P.filter(p => p.statut === 'Disponible').slice(0, 2);
    sel.selSet(true); L.forEach(p => sel.SEL.add(p.id));
    document.querySelector('[data-sa=act]').click(); await tick(10);
    const b = $('shc').querySelector('[data-sx="cpt"]');
    expect(b).not.toBeNull();
    b.click(); await tick(10);
    $('shc').querySelector('[data-sc="c2"]').click(); await tick(20);
    L.forEach(p => expect(app.P.find(x => x.id === p.id).stk).toBe('c2'));
    sel.selSet(true); L.forEach(p => sel.SEL.add(p.id));
    document.querySelector('[data-sa=act]').click(); await tick(10);
    $('shc').querySelector('[data-sx="cpt"]').click(); await tick(10);
    $('shc').querySelector('[data-sc="-"]').click(); await tick(20);
    L.forEach(p => expect(app.P.find(x => x.id === p.id).stk).toBeUndefined());
    app.setCfg({ comptes: [], cptMain: '' }, true);
    $('sheet').hidden = true;
  });
});