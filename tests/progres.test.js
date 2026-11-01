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

describe('Défis, cartes, trophées et classement : un seul écran', () => {
  it('l\'outil est unique et les anciens points d\'entrée mènent au même écran', async () => {
    const k = tools.TOOLS.map(x => x.k);
    expect(k).toContain('trophees');
    expect(k).not.toContain('defis');
    for (const key of ['trophees', 'defis']) {
      await app.openTool(key);
      expect($('shc').querySelectorAll('[data-ptab]').length).toBeGreaterThanOrEqual(4);
    }
  });

  it('quatre onglets : Défis, Cartes, Trophées, Classement', async () => {
    await app.openTool('defis');
    expect([...$('shc').querySelectorAll('.ptabs [data-ptab]')].map(b => b.dataset.ptab)).toEqual(['now', 'cartes', 'trophees', 'classement']);
    expect($('shc').textContent).toMatch(/points/);
    expect($('shc').querySelector('.med')).toBeNull();
    $('shc').querySelector('[data-ptab="cartes"]').click();
    expect($('shc').querySelectorAll('.cdk').length).toBeGreaterThan(50);
    $('shc').querySelector('[data-ptab="trophees"]').click();
    expect($('shc').querySelectorAll('.tro').length).toBe(10);
    $('shc').querySelector('[data-ptab="classement"]').click();
    expect($('shc').textContent).toMatch(/classement|ranking/i);
    $('shc').querySelector('[data-ptab="now"]').click();
  });

  it('les défis se créent tout seuls : 3+3 au mois, 1+2 à la semaine, sans défi saisi à la main', async () => {
    app.setCfg({ defis: [] });
    const D = await import('../src/modules/challenges.js');
    D.ensureDefis();
    const M = D.defisOf('month'), W = D.defisOf('week');
    expect(M.filter(d => d.src === 'common')).toHaveLength(3);
    expect(M.filter(d => d.src === 'perso')).toHaveLength(3);
    expect(W.filter(d => d.src === 'common')).toHaveLength(1);
    expect(W.filter(d => d.src === 'perso')).toHaveLength(2);
    expect(new Set(M.filter(d => d.src === 'perso').map(d => d.type)).size).toBe(3);
    D.ensureDefis();
    expect(app.cfg.defis).toHaveLength(9);
    P.openProgress('now');
    expect($('shc').querySelectorAll('.dfi')).toHaveLength(9);
    expect($('shc').querySelector('[data-dacc],[data-ddel],#df_ok')).toBeNull();
  });

  it('les défis communs sont les mêmes pour tout le monde, les personnels dépendent de tes ventes', async () => {
    const D = await import('../src/modules/challenges.js');
    const a = D.generate('month', '2026-11-10').filter(d => d.src === 'common').map(d => d.type + d.target);
    const b = D.generate('month', '2026-11-25').filter(d => d.src === 'common').map(d => d.type + d.target);
    expect(a).toEqual(b);
    const faible = D.personal('week', { pub: 0, add: 0, sold: 0, ca: 0, colis: 0 }, 2);
    const fort = D.personal('week', { pub: 60, add: 20, sold: 20, ca: 900, colis: 15 }, 2);
    expect(fort[0].target).toBeGreaterThan(faible[0].target);
  });

  it('un défi réussi offre un pack, une seule fois, et le pack s\'ouvre en 3 cartes', async () => {
    const D = await import('../src/modules/challenges.js'), K = await import('../src/modules/cartes.js');
    const m = new Date().toISOString().slice(0, 7);
    app.P.push({ id: 'prg-add', cat: 'Tshirt', marque: 'Test', statut: 'Disponible', entree: new Date().toISOString().slice(0, 10) });
    const d = { id: 'test:add', scope: 'week', src: 'common', type: 'add', target: 1, m, from: '2000-01-01', to: '2999-12-31' };
    app.setCfg({ defis: [d], cartes: null });
    D.ensureDefis();
    expect(K.state().s).toBe(1);
    D.ensureDefis();
    expect(K.state().s).toBe(1);
    const x = P.xpData().xp;
    expect(app.cfg.defis.find(q => q.id === 'test:add').done).toBeTruthy();
    expect(x).toBeGreaterThanOrEqual(5);
    const r = K.openPack('s');
    expect(r.res).toHaveLength(3);
    expect(K.state().s).toBe(0);
    expect(K.owned()).toBeGreaterThan(0);
    expect(K.openPack('s')).toBeNull();
    app.P = app.P.filter(p => p.id !== 'prg-add');
  });

  it('un pack premium donne au moins une carte Rare ou mieux, les doublons font de la poussière, et on fabrique une carte', async () => {
    const K = await import('../src/modules/cartes.js');
    app.setCfg({ cartes: { own: {}, dust: 0, s: 0, p: 40, paid: [], pity: 0, sets: [] } });
    for (let i = 0; i < 40; i++) { const r = K.openPack('p'); expect(r.res.some(x => x.c.r >= 1)).toBe(true); }
    expect(K.state().dust).toBeGreaterThan(0);
    const manque = K.CARDS.find(c => !K.state().own[c.id] && c.r === 0);
    if (manque) { app.setCfg({ cartes: Object.assign({}, K.state(), { dust: 10 }) }); expect(K.craft(manque.id)).toBe(true); expect(K.state().own[manque.id]).toBe(1); expect(K.state().dust).toBe(10 - K.CRAFT[0]); }
    app.setCfg({ cartes: null });
  });

  it('l\'onglet Cartes ouvre un pack à l\'écran', async () => {
    const K = await import('../src/modules/cartes.js');
    app.setCfg({ cartes: { own: {}, dust: 0, s: 1, p: 0, paid: [], pity: 0, sets: [] } });
    P.openProgress('cartes');
    $('shc').querySelector('[data-popen="s"]').click();
    expect($('shc').querySelectorAll('.popen .cdk.down')).toHaveLength(3);
    $('shc').querySelector('[data-pflip]').click();
    expect($('shc').querySelectorAll('.popen .cdk.down')).toHaveLength(0);
    $('shc').querySelector('[data-pclose]').click();
    expect($('shc').querySelector('.popen')).toBeNull();
    expect(K.owned()).toBeGreaterThan(0);
    app.setCfg({ cartes: null });
  });

  it('les trophées ont cinq paliers et les paliers se calculent d\'après les ventes', async () => {
    const T = await import('../src/modules/trophees.js');
    expect(T.TIERS).toEqual(['Bronze', 'Argent', 'Or', 'Platine', 'Diamant']);
    for (const c of T.CATS) expect(c.th).toHaveLength(5);
    const v = T.trophyData().find(c => c.k === 'ventes');
    expect(v.tier).toBe(v.th.filter(x => v.val >= x).length);
    expect(T.trophyTiers()).toBeGreaterThan(0);
  });

  it('les points du mois du classement suivent la règle', async () => {
    const R = await import('../src/modules/rang.js');
    const m = '2099-01';
    const base = { cat: 'Tshirt', marque: 'Z', statut: 'Disponible' };
    app.P.push(Object.assign({}, base, { id: 'rg1', pub: m + '-02' }), Object.assign({}, base, { id: 'rg2', statut: 'Vendu', pv: 5, dv: m + '-03', exp: m + '-04' }));
    expect(R.ptsMonth(m)).toBe(1 + 3 + 1 - 0);
    app.P = app.P.filter(p => !p.id.startsWith('rg'));
  });

  it('le classement se rejoint avec un pseudo et une région, et se quitte', async () => {
    app.setCfg({ rang: null });
    P.openProgress('classement');
    $('rg_ps').value = 'Camille'; $('rg_rg').value = 'Bretagne';
    $('shc').querySelector('[data-rg="join"]').click(); await new Promise(r => setTimeout(r, 20));
    expect(app.cfg.rang).toMatchObject({ on: true, pseudo: 'Camille', region: 'Bretagne' });
    expect($('shc').textContent).toContain('Camille');
    $('shc').querySelector('[data-rg="leave"]').click(); await new Promise(r => setTimeout(r, 20));
    expect(app.cfg.rang.on).toBe(false);
  });
});
