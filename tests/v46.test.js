import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { demarrer } from './helpers.js';
import { app } from '../src/state.js';

const $ = id => document.getElementById(id);
const tick = ms => new Promise(r => setTimeout(r, ms));
let nav, tools;
beforeAll(async () => {
  await demarrer(120);
  nav = await import('../src/modules/nav.js');
  tools = await import('../src/modules/tools-index.js');
});
afterEach(() => { $('sheet').hidden = true; });

describe('v46 : Ajouter, étapes', () => {
  it('les étapes suivent les onglets et avancent avec l\'onglet ouvert', async () => {
    nav.go('add'); app.addForm.draw(); await tick(20);
    const dots = () => [...$('fadd').querySelectorAll('.prog .pg i')];
    const txt = () => $('fadd').querySelector('.prog .mono').textContent;
    expect(dots().length).toBeGreaterThan(12);
    expect(txt()).toMatch(/1\D+\d+/);
    $('fadd').querySelector('[data-tg="cat"]').click();
    $('fadd').querySelector('[data-tg="etat"]').click();
    expect(dots().filter(d => d.className === 'f').length).toBeGreaterThan(5);
  });
});

describe('v46 : outils', () => {
  it('Dépenses, Compléter et Nettoyer ne sont plus des outils séparés', () => {
    const k = tools.TOOLS.map(x => x.k);
    ['depenses', 'complete', 'merge'].forEach(x => expect(k).not.toContain(x));
    ['fiches', 'journee', 'setup'].forEach(x => expect(k).toContain(x));
  });
  it('le nouvel outil réunit compléter et nettoyer', async () => {
    await app.openTool('fiches'); await tick(10);
    expect($('shc').querySelector('[data-fx="complete"]')).not.toBeNull();
    expect($('shc').querySelector('[data-fx="merge"]')).not.toBeNull();
    $('shc').querySelector('[data-fx="merge"]').click(); await tick(20);
    expect($('sheet').hidden).toBe(false);
  });
  it('les dépenses restent dans le Bilan', async () => {
    nav.go('dash'); app.renderDash(); await tick(30);
    expect($('dsh').querySelector('h3[data-sec="Dépenses"]')).not.toBeNull();
  });
});

describe('v46 : Bilan', () => {
  it('plus de courbe, plus de plafond ni de rapport en carte ; le rapport est dans l\'en-tête', async () => {
    nav.go('dash'); app.renderDash(); await tick(30);
    expect($('dsh').querySelector('[data-ck="courbe"]')).toBeNull();
    expect($('dsh').querySelector('[data-tool="rapport"]')).toBeNull();
    expect($('rptb').hidden).toBe(false);
    nav.go('list'); await tick(10);
    expect($('rptb').hidden).toBe(true);
    nav.go('dash');
    $('rptb').click(); await tick(30);
    expect($('sheet').hidden).toBe(false);
  });
});

describe('v46 : Ma journée terminée', () => {
  it('se replie en une ligne quand tout est fait, et se rouvre depuis l\'outil', async () => {
    const A = await import('../src/modules/autopilot.js');
    /* toutes les règles coupées et aucune tâche : on vide le stock disponible */
    const sauv = app.P.slice();
    app.P = app.P.filter(p => p.statut === 'Vendu').map(p => Object.assign({}, p, { fin: '2026-01-01', exp: '2026-01-01', grade: 'A', etat: 'Très bon état', code: p.code || 'X-1' }));
    app.setCfg({ apSnooze: {}, rules: {} }, true);
    const { LSs, today } = await import('../src/modules/core.js');
    LSs('lastBackup', today());
    nav.go('dash'); app.renderDash(); await tick(30);
    expect(A.tasksToday().map(x => x.id)).toEqual([]);
    {
      const c = $('dsh').querySelector('.ap');
      expect(c.classList.contains('apdone')).toBe(true);
      c.querySelector('[data-ap="jopen"]').click(); await tick(20);
      expect($('dsh').querySelector('.ap').classList.contains('apdone')).toBe(false);
      $('dsh').querySelector('[data-ap="jclose"]').click(); await tick(20);
      expect($('dsh').querySelector('.ap').classList.contains('apdone')).toBe(true);
      await app.openTool('journee'); await tick(30);
      expect(app.view).toBe('dash');
      expect($('dsh').querySelector('.ap').classList.contains('apdone')).toBe(false);
    }
    app.P = sauv;
  });
});

describe('v46 : premier lancement', () => {
  it('une fenêtre liste les questionnaires des indicateurs et se coche', async () => {
    app.setCfg({ setupDone: false, goal: 0, goalCA: 0 }, true);
    await app.openTool('setup'); await tick(10);
    expect(app.cfg.setupDone).toBe(true);
    const lignes = [...$('shc').querySelectorAll('[data-su]')].map(b => b.dataset.su);
    expect(lignes).toEqual(['goal', 'seuil', 'fourn', 'treso']);
    expect($('shc').querySelector('[data-su="goal"]').classList.contains('su-ok')).toBe(false);
    $('shc').querySelector('[data-su="seuil"]').click(); await tick(30);
    expect($('sheet').hidden).toBe(false);
  });
});