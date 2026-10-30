import { app } from '../state.js';
import { $, LSg, LSs, esc, eur, eurR, num, sold, today } from './core.js';
import { sheetHead, showSheet } from './tools-index.js';
import { MOIS } from './gamification.js';
import { rid } from './proofs.js';

app.defiCardHTML = defiCardHTML;
app.openDefis = openDefis;

/* --- 6. défis du mois --- */
const DEFI_T={pub:['Publier','pièces publiées'],sold:['Vendre','ventes'],ca:['Atteindre','€ de chiffre d\'affaires'],add:['Ajouter','pièces au stock']};
export function defiProg(d){const m=d.m;if(d.type==='pub')return app.P.filter(p=>(p.pub||'').startsWith(m)).length;if(d.type==='add')return app.P.filter(p=>(p.entree||'').startsWith(m)).length;const S=app.P.filter(p=>sold(p)&&(p.dv||'').startsWith(m));return d.type==='sold'?S.length:S.reduce((a,p)=>a+(p.pv||0),0)}
export const defiTxt=d=>d.type==='ca'?t('Atteindre {n} de chiffre d\'affaires',{n:eurR(d.target)}):d.type==='pub'?t('Publier {n} pièces',{n:d.target}):d.type==='sold'?t('Vendre {n} pièces',{n:d.target}):t('Ajouter {n} pièces au stock',{n:d.target});
export function defisNow(){const m=today().slice(0,7);return(app.cfg.defis||[]).filter(d=>d.m===m)}
function defiCardHTML(){const L=defisNow();if(!L.length)return`<button type="button" class="card minic" data-tool="defis"><span class="l">${t('défi du mois')}</span><b>—</b><span class="mini-s">${t('Lance un défi : « publie 100 pièces ce mois-ci »')}</span></button>`;
 const d=L[0],g=defiProg(d),pc=Math.min(1,g/d.target);return`<button type="button" class="card minic" data-tool="defis"><span class="l">${t('défi du mois')}</span><b>${d.type==='ca'?eurR(g):g} <small>${t('sur {n}',{n:d.type==='ca'?eurR(d.target):d.target})}</small></b><div class="rl dk"><b class="gc-${pc>=1?'g':'o'}" style="width:${(pc*100).toFixed(1)}%"></b></div><span class="mini-s">${esc(defiTxt(d))}</span></button>`}
export function openDefis(){const m=today().slice(0,7),L=defisNow(),PRE=[['pub',100],['sold',50],['ca',1000],['add',50]];
 showSheet(sheetHead(t('Défis du mois'))+`<p class="sub">${MOIS[+m.slice(5)-1]} ${m.slice(0,4)}</p>${L.map(d=>{const g=defiProg(d),pc=Math.min(1,g/d.target);return`<div class="card" style="padding:14px"><div style="display:flex;justify-content:space-between;gap:8px"><b>${esc(defiTxt(d))}</b><span class="gp gc-${pc>=1?'g':'o'}">${Math.round(pc*100)} %</span></div><div class="rl"><b class="gc-${pc>=1?'g':'o'}" style="width:${(pc*100).toFixed(1)}%"></b></div><div class="gl2">${t('{a} sur {b}',{a:d.type==='ca'?eur(g):g,b:d.type==='ca'?eur(d.target):d.target})}${pc>=1?' · '+t('défi réussi'):''}</div><button type="button" class="btn sm sec" data-ddel="${esc(d.id)}" style="margin-top:6px">${t('Supprimer')}</button></div>`}).join('')||'<div class="empty" style="padding:14px 8px">'+t('Aucun défi ce mois-ci.')+'</div>'}
  <div class="card"><h3>${t('Lancer un défi')}</h3><div class="chips">${PRE.map(([ty,v])=>`<button type="button" class="chip sm" data-dp="${ty}" data-v="${v}">${esc(defiTxt({type:ty,target:v}))}</button>`).join('')}</div>
  <div class="row2 fld" style="margin-top:12px"><div><label class="l" for="df_t">${t('Type')}</label><select id="df_t">${Object.entries(DEFI_T).map(([k,v])=>`<option value="${k}">${t(v[0])} (${t(v[1])})</option>`).join('')}</select></div><div><label class="l" for="df_v">${t('Objectif')}</label><input type="text" inputmode="decimal" id="df_v" placeholder="100"></div></div><div class="acts"><button type="button" class="btn sec" id="df_ok">${t('Ajouter ce défi')}</button></div></div>
  <div class="card"><h3>${t('Classement entre amis')}</h3><div id="am_in" class="hint">${t('Chargement…')}</div></div>`);app.amisInit();
 const add=(type,v)=>{if(!(v>0))return app.toast(t('Indique un objectif'));app.setCfg({defis:[...(app.cfg.defis||[]),{id:rid(),type,target:v,m}]});openDefis();app.renderAll()};
 $('shc').onclick=e=>{if(e.target.closest('[data-am]'))return app.amisClick(e);const p=e.target.closest('[data-dp]');if(p)return add(p.dataset.dp,+p.dataset.v);if(e.target.closest('#df_ok'))return add($('df_t').value,num($('df_v').value));
  const x=e.target.closest('[data-ddel]');if(x){app.setCfg({defis:(app.cfg.defis||[]).filter(d=>d.id!==x.dataset.ddel)});openDefis();app.renderAll()}}}
let defiT=null;export function scheduleDefis(){clearTimeout(defiT);defiT=setTimeout(()=>{if(app.importing||!app.loaded||!app.P.length)return;const done=LSg('defiDone',[]);defisNow().forEach(d=>{if(!done.includes(d.id)&&defiProg(d)>=d.target){done.push(d.id);LSs('defiDone',done);app.toast(t('Défi réussi : {d}',{d:defiTxt(d)}),null,5000)}})},900)}
