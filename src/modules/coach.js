import { app } from '../state.js';
import { $, LSg, LSs, addDays, avail, days, esc, eur, eurR, fd, ok, sold, today } from './core.js';
import { stats } from './dashboard.js';
import { copyText } from './listing.js';
import { goalCalc, goalKinds } from './goals.js';
import { colisList } from './live.js';
import { go } from './nav.js';
import { closeSheet } from './piece-sheet.js';
import { sheetHead, showSheet } from './tools-index.js';

app.openCoach = openCoach;

/* ===== 9. Coach du lundi : un bilan en une ligne et 3 priorités, chacune avec son bouton ===== */
const ACTIONS = {
  pub: () => { app.filt = 'Apub'; app.lim = 60; go('list'); },
  cut: () => { app.filt = 'Enligne'; app.lim = 60; go('list'); },
  colis: () => { app.salesFilter('prep'); go('sales'); },
  goal: () => app.openTool('courbe'),
  backup: () => go('set'),
  add: () => go('add'),
};
const BTN = { pub: 'Voir à publier', cut: 'Voir ces pièces', colis: 'Préparer', goal: 'Voir l\'objectif', backup: 'Sauvegarder', add: 'Ajouter une pièce' };

export function coachData() {
  const now = today(), d7 = addDays(now, -7), d14 = addDays(now, -14), d30 = addDays(now, -30), S = app.P.filter(sold), inR = (a, b) => S.filter(x => (x.dv || '') > a && (x.dv || '') <= b);
  const w1 = stats(inR(d7, now)), w0 = stats(inR(d14, d7)), m30 = stats(inR(d30, now)), all = stats(S);
  const st = app.P.filter(avail), dorm = st.filter(x => ok(x.pub) && days(x.pub, now) >= 30), unpub = st.filter(x => !ok(x.pub)), nc = colisList().length;
  const dv = w0.ben ? Math.round((w1.ben - w0.ben) / Math.abs(w0.ben) * 100) : null;
  const head = t('Semaine écoulée : {v}, {b} de bénéfice', { v: tn(w1.n, 'vente', 'ventes'), b: eur(w1.ben) }) + (dv === null ? '' : ' · ' + t('{d} % par rapport à la semaine précédente', { d: (dv >= 0 ? '+' : '') + dv }));
  const P = [];
  if (nc) P.push({ act: 'colis', lead: t('Prépare {n} colis', { n: nc }), txt: t('Ils sont rangés par bac : touche Préparer dans l\'onglet Vente.') });
  if (unpub.length) { const n = Math.min(unpub.length, 15); P.push({ act: 'pub', lead: t('Publie {n} pièces', { n }), txt: t('{a} d\'achat qui ne peuvent pas se vendre tant qu\'elles ne sont pas en ligne.', { a: eurR(unpub.reduce((a, x) => a + (x.achat || 0), 0)) }) }); }
  if (dorm.length) { const n = Math.min(dorm.length, 10); P.push({ act: 'cut', lead: t('Baisse le prix de {n} pièces', { n }), txt: t('En ligne depuis 30 jours et plus ({a} d\'achat immobilisés) : baisse de 10 à 15 % sur les plus anciennes.', { a: eurR(dorm.reduce((a, x) => a + (x.achat || 0), 0)) }) }); }
  const kind = goalKinds().find(k => goalCalc(k, 'm')), g = kind && goalCalc(kind, 'm');
  if (g && g.cur < g.g) { const avg = m30.n ? (kind === 'net' ? m30.ben : m30.ca) / m30.n : (all.n ? (kind === 'net' ? all.ben : all.ca) / all.n : 0), need = avg > 0 ? Math.ceil(g.reste / avg) : null; if (need) P.push({ act: 'goal', lead: t('Objectif du mois : encore {n} ventes', { n: need }), txt: t('Il reste {r} pour atteindre {g}.', { r: eur(g.reste), g: eurR(g.g) }) }); }
  const lb = LSg('lastBackup', '');
  if (!lb || days(lb, now) >= 7) P.push({ act: 'backup', lead: t('Fais une sauvegarde'), txt: lb ? t('Dernière sauvegarde il y a {n} jours.', { n: days(lb, now) }) : t('Aucune sauvegarde JSON faite pour l\'instant.') });
  if (!P.length) P.push({ act: 'add', lead: t('Tout est à jour'), txt: t('Rien d\'urgent : cherche de nouvelles pièces à ajouter au stock.') });
  const top = P.slice(0, 3);
  return { title: t('Coach du lundi'), sub: t('semaine du {a} au {b}', { a: fd(addDays(now, -6)), b: fd(now) }), head, tone: w1.ben >= w0.ben ? 'g' : 'o', top, text: t('Coach du lundi, {d}', { d: fd(now) }) + '\n' + head + '\n' + top.map((l, i) => (i + 1) + '. ' + l.lead + ' : ' + l.txt).join('\n') };
}
function openCoach() {
  const c = coachData(); LSs('coachDay', today()); $('cb').hidden = true;
  showSheet(sheetHead(c.title) + `<p class="sub">${esc(c.sub)}</p><div class="cl cl-${c.tone}"><i></i><div><b>${esc(c.head)}</b></div></div>
   <h3 style="margin:16px 0 8px">${t('Tes 3 priorités')}</h3>${c.top.map((l, i) => `<div class="card" style="padding:14px"><div style="display:flex;gap:12px;align-items:flex-start"><span class="gp gc-o" style="flex:none">${i + 1}</span><div style="min-width:0"><b>${esc(l.lead)}</b><div class="sub" style="margin:4px 0 10px">${esc(l.txt)}</div><button type="button" class="btn sm" data-coact="${l.act}" style="width:auto">${t(BTN[l.act])}</button></div></div></div>`).join('')}
   <div class="acts"><button type="button" class="btn sec" id="co_cp">${t('Copier le rapport')}</button></div>`);
  $('co_cp').onclick = () => copyText(c.text, t('Rapport'));
  $('shc').onclick = e => { const b = e.target.closest('[data-coact]'); if (b && ACTIONS[b.dataset.coact]) { closeSheet(); ACTIONS[b.dataset.coact](); } };
}
export function showCb(txt,btn,fn){$('cb').firstElementChild.textContent=txt;$('cb_go').textContent=btn;$('cb_go').onclick=fn;$('cb').hidden=false}
export function checkCoachBanner(){if(new Date().getDay()===1&&LSg('coachDay','')!==today()&&app.P.length)showCb(t('Ton coach du lundi est prêt'),t('Ouvrir'),openCoach)}
$('cb_go').onclick=openCoach;$('cb_x').onclick=()=>{$('cb').hidden=true;LSs('coachDay',today())};
