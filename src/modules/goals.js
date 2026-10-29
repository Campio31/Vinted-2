import { app } from '../state.js';
import { $, esc, eur, eurR, lc, sold, today } from './core.js';
import { go } from './nav.js';
import { stats } from './dashboard.js';

app.goalHTML = goalHTML;

/* ---------- objectifs mensuel et annuel (bénéfice net, chiffre d'affaires ou les deux) ---------- */
export const GKEY={net:{m:'goal',y:'goalY'},ca:{m:'goalCA',y:'goalYCA'}};
const GLAB={net:'Bénéfice net',ca:'Chiffre d\'affaires'};
const glab=k=>t(GLAB[k]);
export const goalKinds=()=>app.cfg.goalMode==='ca'?['ca']:app.cfg.goalMode==='both'?['net','ca']:['net'];
export function goalCalc(kind,per){const g=+app.cfg[GKEY[kind][per]]||0;if(!g)return null;
 const d=new Date(),y=d.getFullYear(),pre=per==='m'?today().slice(0,7):String(y);
 const S=stats(app.P.filter(x=>sold(x)&&(x.dv||'').startsWith(pre))),cur=kind==='net'?S.ben:S.ca;
 const total=per==='m'?new Date(y,d.getMonth()+1,0).getDate():((y%4===0&&y%100!==0)||y%400===0?366:365);
 const elapsed=per==='m'?d.getDate():Math.round((Date.UTC(y,d.getMonth(),d.getDate())-Date.UTC(y,0,0))/864e5);
 const left=total-elapsed,reste=Math.max(0,g-cur);
 return{kind,per,g,cur,pct:cur/g,exp:g*elapsed/total,left,reste,rate:per==='m'?reste/Math.max(1,left):reste/Math.max(1,left/30.44)}}
const goalColor=d=>d.cur>=d.g?'g':'o';
export const bigEur=v=>{const s=Math.abs(v).toFixed(2).split('.');return(v<0?'−':'')+Number(s[0]).toLocaleString(app.LOC)+'<small>'+app.DS+s[1]+' €</small>'};
const ruler=d=>`<div class="rl"><b class="gc-${goalColor(d)}" style="width:${Math.min(100,Math.max(0,d.pct*100)).toFixed(1)}%"></b></div>`;
function goalHTML(){const kinds=goalKinds(),out=[],now=new Date(),mois=now.toLocaleDateString(app.LOC,{month:'long'});
 [['m',t('Objectif {m}',{m:mois})],['y',t('Objectif {m}',{m:now.getFullYear()})]].forEach(([per,title])=>{const ds=kinds.map(k=>goalCalc(k,per)).filter(Boolean);if(!ds.length)return;
  const main=ds[0];
  out.push(`<div class="gcard"><div class="gh2"><span>${esc(title)} · ${lc(glab(main.kind))}</span><button type="button" data-goalset>${t('Modifier')}</button></div>
  <div class="gbig cd">${bigEur(main.cur)}</div>
  ${ds.map(d=>`<div class="gr"><span>${t('{k} · objectif {g}',{k:lc(glab(d.kind)),g:eurR(d.g)})}</span><b class="gp gc-${goalColor(d)}">${Math.round(d.pct*100)} %</b></div>${ruler(d)}<div class="gl2">${d.kind!==main.kind?eur(d.cur)+' · ':''}${d.cur>=d.g?t('Objectif atteint, bravo !'):t('Reste {r}',{r:eur(d.reste)})+' · '+t(d.per==='m'?'{x} par jour':'{x} par mois',{x:eur(d.rate)})+' · '+t(d.cur>=d.exp?'en avance sur le rythme':'en retard sur le rythme')}</div>`).join('')}</div>`)});
 return out.length?out.join(''):'<div class="card goal"><h3>'+t('Objectifs')+'</h3><p class="sub">'+t('Fixe un objectif mensuel ou annuel (bénéfice net, chiffre d\'affaires ou les deux) pour suivre ta progression.')+'</p><button type="button" class="btn sm" data-goalset>'+t('Définir mes objectifs')+'</button></div>'}
export function goalMini(){let ds=goalKinds().map(k=>goalCalc(k,'m')).filter(Boolean);if(!ds.length)ds=goalKinds().map(k=>goalCalc(k,'y')).filter(Boolean);
 return ds.map(d=>`<button type="button" class="gmini" data-goalset><div class="gr"><span>${t(d.kind==='net'?(d.per==='m'?'bénéfice du mois':'bénéfice de l\'année'):(d.per==='m'?'chiffre d\'affaires du mois':'chiffre d\'affaires de l\'année'))}</span><b class="gp gc-${goalColor(d)}">${Math.round(d.pct*100)} %</b></div>${ruler(d)}<small>${t('{a} sur {b}',{a:eur(d.cur),b:eur(d.g)})}</small></button>`).join('')}
document.addEventListener('click',e=>{if(e.target.closest('[data-goalset]')){go('set');setTimeout(()=>{const c=$('cfgc');if(c)c.scrollIntoView({behavior:'smooth',block:'center'});const i=c&&c.querySelector('input');if(i)i.focus()},80)}});
