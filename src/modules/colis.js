import { app } from '../state.js';
import { $, LSg, LSs, esc, eur, sold, title, today } from './core.js';
import { sheetHead, showSheet } from './tools-index.js';

app.openColis = openColis;
app.colisList = colisList;

/* ---------- outil Colis à préparer ---------- */
/* Colis à préparer : vendus, pas encore marqués prêts, et vendus il y a 14 jours ou moins
   (un vieux colis, par exemple d'un historique importé, est considéré comme parti). */
export const COLIS_JOURS = 14;
export function colisList() {
  return app.P.filter(p => sold(p) && !p.exp && p.vt && Date.now() - p.vt <= COLIS_JOURS * 864e5);
}

let mode = LSg('colisMode', 'bac');

/** Corps de l'outil : liste des colis, par bac ou par acheteur. */
export function colisBody() {
  const C = colisList();
  const head = `<p class="sub" style="margin:0 0 10px">${t('Les pièces vendues dont le colis n\'est pas encore parti. Touche « Prêt » quand le colis est emballé.')}</p>` +
    (C.length ? `<div class="chips" style="margin-bottom:10px"><button type="button" class="chip sm${mode === 'bac' ? ' on' : ''}" data-cm="bac">${t('Par bac')}</button><button type="button" class="chip sm${mode === 'buyer' ? ' on' : ''}" data-cm="buyer">${t('Par acheteur')}</button></div>` : '');
  if (!C.length) return head + '<div class="empty" style="padding:14px 8px">' + t('Rien à préparer. Les ventes faites dans l\'appli apparaissent ici.') + '</div>';
  if (mode === 'bac') {
    const S = [...C].sort((a, b) => (a.bac || '￿').localeCompare(b.bac || '￿', app.LOC, { numeric: true }) || (a.code || '').localeCompare(b.code || ''));
    return head + '<div class="prepl">' + S.map(x => `<div class="pre"><span class="bacb">${esc(x.bac || '—')}</span><div class="pm"><b>${esc(title(x))}${x.taille ? ' · ' + esc(x.taille) : ''}</b><small>${esc(x.code || '')} · ${x.acheteur ? '@' + esc(x.acheteur) + ' · ' : ''}${esc(tv(x.canal || ''))}</small></div><button type="button" class="btn sm sec gh" data-proof="${esc(x.id)}">${t('Preuves')}</button><button type="button" class="btn sm mint" data-prep="${esc(x.id)}">${t('Prêt')}</button></div>`).join('') + '</div>';
  }
  const g = new Map();
  [...C].sort((a, b) => (b.vt || 0) - (a.vt || 0)).forEach(p => { const k = p.acheteur || ''; if (!g.has(k)) g.set(k, []); g.get(k).push(p); });
  return head + [...g.entries()].map(([k, L]) => `<div class="parcel"><div class="ph"><b>${k ? '@' + esc(k) : t('Sans pseudo')}</b><span>${tn(L.length, 'pièce', 'pièces')} · ${eur(L.reduce((a, x) => a + (x.pv || 0), 0))}</span></div><ul>${L.map(x => `<li><b>${esc(x.code || x.id)}</b> ${esc(title(x))}${x.taille ? ' · ' + esc(x.taille) : ''} <button type="button" class="lnkb" data-proof="${esc(x.id)}">${t('preuves')}</button></li>`).join('')}</ul><button type="button" class="btn mint" data-col="${esc(k)}">${t('Colis prêt')}</button></div>`).join('');
}

export function openColis() {
  const draw = () => { const b = $('colb'); if (b) b.innerHTML = colisBody(); };
  showSheet(sheetHead(t('Colis à préparer')) + '<div class="card" id="colb"></div>');
  draw();
  $('shc').onclick = e => {
    const cm = e.target.closest('[data-cm]');
    if (cm) { mode = cm.dataset.cm; LSs('colisMode', mode); draw(); return; }
    const pr = e.target.closest('[data-prep]');
    if (pr) {
      const x = app.P.find(y => y.id === pr.dataset.prep);
      if (x) { const old = Object.assign({}, x); app.save(Object.assign({}, x, { exp: today() })); draw(); app.toast(t('Colis prêt') + (x.bac ? t(' · bac {b}', { b: x.bac }) : ''), () => { app.save(old); draw(); }); }
      return;
    }
    const col = e.target.closest('[data-col]');
    if (col) {
      const k = col.dataset.col, L = colisList().filter(p => (p.acheteur || '') === k), old = L.map(p => Object.assign({}, p));
      L.forEach(p => app.save(Object.assign({}, p, { exp: today() })));
      draw(); app.toast(k ? t('Colis prêt pour @{k}', { k }) : t('Colis prêt'), () => { old.forEach(p => app.save(p)); draw(); });
    }
  };
}
