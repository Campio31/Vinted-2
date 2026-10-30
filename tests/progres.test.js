import { describe, it, expect, beforeAll } from 'vitest';
import { demarrer } from './helpers.js';
import { app } from '../src/state.js';

const $ = id => document.getElementById(id);
let tools, P, C;
beforeAll(async () => {
  await demarrer(150);
  tools = await import('../src/modules/tools-index.js');
  P = await import('../src/modules/progress.js');
  C = await import('../src/modules/coach.js');
});

describe('Coach du lundi : 3 priorités', () => {
  it('donne au plus 3 priorités, chacune avec une action', () => {
    const c = C.coachData();
    expect(c.top.length).toBeGreaterThan(0);
    expect(c.top.length).toBeLessThanOrEqual(3);
    for (const l of c.top) expect(['pub', 'cut', 'colis', 'goal', 'backup', 'add']).toContain(l.act);
    expect(c.head.length).toBeGreaterThan(10);
  });

  it('la fenêtre montre un bouton par priorité, et il mène à l\'écran concerné', async () => {
    await app.openTool('coach');
    const btns = [...document.querySelectorAll('#shc [data-coact]')];
    expect(btns.length).toBe(C.coachData().top.length);
    const first = btns[0];
    const act = first.dataset.coact;
    first.click();
    expect($('sheet').hidden).toBe(true);
    expect(app.view).toBe({ colis: 'sales', pub: 'list', cut: 'list', goal: 'quick', backup: 'set', add: 'add' }[act] || app.view);
    if (act === 'colis') expect(document.querySelector('#sflt .chip.on').dataset.sf).toBe('prep');
  });
});

describe('niveaux', () => {
  it('passent d\'un palier à l\'autre', () => {
    expect(P.levelOf(0).cur.n).toBe('Débutant');
    expect(P.levelOf(49).cur.n).toBe('Débutant');
    expect(P.levelOf(50).cur.n).toBe('Chineur');
    expect(P.levelOf(149).cur.n).toBe('Chineur');
    expect(P.levelOf(150).cur.n).toBe('Confirmé');
    const top = P.levelOf(5000);
    expect(top.cur.n).toBe('Légende');
    expect(top.next).toBeNull();
    expect(top.pct).toBe(1);
    expect(P.levelOf(100).left).toBe(50);
  });

  it('les points suivent la règle : publier 1, vendre 3, colis 1, défi 5, exemples exclus', () => {
    const R = app.P.filter(p => !p.ex);
    const x = P.xpData();
    expect(x.xp).toBe(R.filter(p => p.pub).length + 3 * R.filter(p => p.statut === 'Vendu').length + R.filter(p => p.statut === 'Vendu' && p.exp).length + 5 * x.med);
    const avant = P.xpData().xp;
    const p = app.P.find(q => q.statut === 'Vendu');
    p.ex = true;
    expect(P.xpData().xp).toBe(avant - 3 - (p.pub ? 1 : 0) - (p.exp ? 1 : 0));
    delete p.ex;
  });

  it('un message félicite quand le niveau monte, pas au premier calcul', async () => {
    localStorage.removeItem('lvlSeen');
    P.checkLevel();
    expect(localStorage.getItem('lvlSeen')).not.toBeNull();
    localStorage.setItem('lvlSeen', '-1');
    $('toast').hidden = true;
    P.checkLevel();
    expect($('toast').hidden).toBe(false);
    expect($('toast').textContent).toMatch(/Niveau|Level/);
  });
});

describe('Défis et trophées : un seul écran', () => {
  it('l\'outil est unique et les anciens points d\'entrée mènent au même écran', async () => {
    const k = tools.TOOLS.map(x => x.k);
    expect(k).toContain('trophees');
    expect(k).not.toContain('defis');
    for (const key of ['trophees', 'defis']) {
      await app.openTool(key);
      expect($('shc').querySelectorAll('[data-ptab]')).toHaveLength(3);
    }
  });

  it('trois onglets : En cours, Trophées, Amis', async () => {
    await app.openTool('defis');
    expect($('shc').textContent).toMatch(/points/);
    expect($('shc').querySelector('.med')).toBeTruthy();
    $('shc').querySelector('[data-ptab="trophees"]').click();
    expect($('shc').querySelectorAll('.bdg').length).toBeGreaterThan(10);
    $('shc').querySelector('[data-ptab="amis"]').click();
    expect($('am_in')).toBeTruthy();
    $('shc').querySelector('[data-ptab="now"]').click();
  });

  it('propose un défi un peu au-dessus du mois dernier et l\'accepte d\'un geste', () => {
    app.setCfg({ defis: [] });
    const p = P.proposeDefi();
    expect(['sold', 'pub']).toContain(p.type);
    expect(p.target).toBeGreaterThan(0);
    P.openProgress('now');
    expect($('shc').querySelector('[data-dacc]')).toBeTruthy();
    $('shc').querySelector('[data-dacc]').click();
    expect(app.cfg.defis).toHaveLength(1);
    expect(app.cfg.defis[0]).toMatchObject({ type: p.type, target: p.target, m: new Date().toISOString().slice(0, 7) });
    expect($('shc').querySelector('[data-dacc]')).toBeNull();
  });

  it('le carnet de médailles : mois en cours, puis médaille quand le défi est réussi (+5 points)', () => {
    const m = new Date().toISOString().slice(0, 7);
    app.setCfg({ defis: [{ id: 'd0', type: 'ca', target: 99999999, m }] });
    let c = P.carnet().find(x => x.k === m);
    expect(c.s).toBe('cur');
    const avant = P.xpData().xp;
    app.setCfg({ defis: [{ id: 'd1', type: 'add', target: 1, m }] });
    c = P.carnet().find(x => x.k === m);
    expect(c.s).toBe('ok');
    expect(P.xpData().xp).toBe(avant + 5);
    expect(P.carnet()).toHaveLength(12);
  });

  it('on peut supprimer un défi', () => {
    app.setCfg({ defis: [{ id: 'd2', type: 'ca', target: 99999999, m: new Date().toISOString().slice(0, 7) }] });
    P.openProgress('now');
    $('shc').querySelector('[data-ddel]').click();
    expect(app.cfg.defis).toHaveLength(0);
  });
});
