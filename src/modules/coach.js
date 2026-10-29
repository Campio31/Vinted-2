import { app } from '../state.js';
import { $, LSg, LSs, addDays, avail, days, esc, eur, eurR, fd, ok, profit, sold, today } from './core.js';
import { stats } from './dashboard.js';
import { delai, med } from './advice.js';
import { copyText } from './listing.js';
import { goalCalc, goalKinds } from './goals.js';
import { colisList } from './live.js';
import { sheetHead, showSheet } from './tools-index.js';

app.openCoach = openCoach;

/* ===== 9. Coach du lundi ===== */
function coachData(){
 const now=today(),d7=addDays(now,-7),d14=addDays(now,-14),d30=addDays(now,-30),S=app.P.filter(sold),inR=(a,b)=>S.filter(x=>(x.dv||'')>a&&(x.dv||'')<=b);
 const w1=stats(inR(d7,now)),w0=stats(inR(d14,d7)),m30=stats(inR(d30,now)),all=stats(S);
 const st=app.P.filter(avail),dorm=st.filter(x=>ok(x.pub)&&days(x.pub,now)>=30),tracks=st.length>0,unpub=st.filter(x=>!ok(x.pub));
 const byB=l=>{const o={};l.forEach(p=>{const k=p.marque||t('Sans marque');(o[k]=o[k]||[]).push(p)});return o};
 const histB=byB(S),s30B=byB(inR(d30,now)),uB=byB(unpub),dB=byB(dorm),lines=[];
 const pc=(a,b)=>b?Math.round((a-b)/Math.abs(b)*100):null,dv=pc(w1.ben,w0.ben);
 lines.push({tone:w1.ben>=w0.ben?'g':'o',lead:t('Semaine écoulée : {v}, {b} de bénéfice',{v:tn(w1.n,'vente','ventes'),b:eur(w1.ben)}),txt:dv===null?(w0.n?'':t('Pas de vente la semaine précédente.')):t('{d} % par rapport à la semaine précédente ({b}).',{d:(dv>=0?'+':'')+dv,b:eur(w0.ben)})});
 const kind=goalKinds().find(k=>goalCalc(k,'m'))||goalKinds().find(k=>goalCalc(k,'y')),g=kind&&(goalCalc(kind,'m')||goalCalc(kind,'y'));
 if(g){const per=g.per==='m';
  if(g.cur>=g.g)lines.push({tone:'g',lead:t(per?'Objectif du mois atteint':'Objectif de l\'année atteint'),txt:t('{a} sur {b} : continue sur ta lancée.',{a:eur(g.cur),b:eur(g.g)})});
  else{const avg=m30.n?(kind==='net'?m30.ben:m30.ca)/m30.n:(all.n?(kind==='net'?all.ben:all.ca)/all.n:0),pubs30=app.P.filter(x=>ok(x.pub)&&x.pub>d30&&x.pub<=now).length,rate=pubs30>=8?Math.min(.9,Math.max(.2,m30.n/pubs30)):.5,days=g.per==='m'?Math.max(1,g.left):Math.max(1,g.left),needS=avg>0?Math.ceil(g.reste/avg):null;
   if(needS){const needP=Math.ceil(needS/rate),perDay=Math.max(1,Math.ceil(needP/days)),typ=app.P.filter(x=>ok(x.pub)&&x.pub>d14&&x.pub<=now).length/14,easy=typ>0?perDay<=typ*1.3:perDay<=10;
    lines.push({tone:easy?'o':'r',lead:t(per?'Objectif du mois de {g} : {s}':'Objectif de l\'année de {g} : {s}',{g:eurR(g.g),s:t(easy?'atteignable':'difficile')}),txt:t('Il reste {r}, soit environ {n} ventes ({a} en moyenne). Avec {p} % de pièces vendues, publie {d} par jour',{r:eur(g.reste),n:needS,a:eur(avg),p:Math.round(rate*100),d:tn(perDay,'pièce','pièces')})+(typ>0?' '+t('(tu en publies {n} en ce moment)',{n:Math.round(typ*10)/10}):'')+'.'})}}}
 const cands=Object.entries(uB).filter(([k,l])=>l.length>=5).map(([k,l])=>{const h=(histB[k]||[]).filter(x=>x.pv>0),dl=h.map(delai).filter(v=>v!==null);return{k,n:l.length,h:h.length,pm:h.length?med(h.map(x=>x.pv)):0,dm:dl.length?med(dl):null,score:h.length>=3?(h.reduce((a,x)=>a+profit(x),0)/h.length)*l.length:0}}).sort((a,b)=>b.score-a.score||b.n-a.n);
 cands.slice(0,2).forEach(c=>lines.push({tone:c.h>=3?'g':'n',lead:t('Publie les {n} {k} restants',{n:c.n,k:c.k}),txt:c.h>=3?t('Tu en as vendu {h} : environ {p} la pièce',{h:c.h,p:eur(c.pm)})+(c.dm!==null?t(', vendue en {n} j',{n:Math.round(c.dm)}):'')+'.':t('Pas assez de ventes pour juger : teste-en quelques-uns d\'abord.')}));
 Object.entries(dB).filter(([k,l])=>l.length>=5).sort((a,b)=>b[1].length-a[1].length).slice(0,1).forEach(([k,l])=>lines.push({tone:'o',lead:t('Solde les {k} en lots',{k}),txt:t('{n} en ligne depuis 30 jours et plus',{n:l.length})+((s30B[k]||[]).length?'':t(', aucune vente sur 30 jours'))+'. '+t('Propose des lots de 3 ou baisse de 15 %.')}));
 if(unpub.length>=5)lines.push({tone:unpub.length/Math.max(1,st.length)>.3?'r':'o',lead:t('{n} pièces jamais publiées',{n:unpub.length}),txt:t('{a} d\'achat qui ne peuvent pas se vendre : elles ne sont pas en ligne. Publie-en {n} par jour.',{a:eurR(unpub.reduce((a,x)=>a+(x.achat||0),0)),n:Math.min(10,Math.ceil(unpub.length/7))})});if(dorm.length)lines.push({tone:dorm.length/Math.max(1,st.length)>.3?'r':'o',lead:t('{n} en ligne depuis 30 jours et plus',{n:tn(dorm.length,'pièce','pièces')}),txt:t('{a} d\'achat immobilisés. Baisse de 10 à 15 % sur les plus anciennes.',{a:eurR(dorm.reduce((a,x)=>a+(x.achat||0),0))})});
 const nc=colisList().length;if(nc)lines.push({tone:'o',lead:t('{n} colis à préparer',{n:nc}),txt:t('Ils sont rangés par bac dans l\'onglet Live.')});
 const lb=LSg('lastBackup','');if(!lb||days(lb,now)>=7)lines.push({tone:'o',lead:t('Fais une sauvegarde'),txt:lb?t('Dernière sauvegarde il y a {n} jours.',{n:days(lb,now)}):t('Aucune sauvegarde JSON faite pour l\'instant.')});
 const d=new Date();return{title:t('Coach du lundi'),sub:t('semaine du {a} au {b}',{a:fd(addDays(now,-6)),b:fd(now)}),lines:lines.slice(0,8),text:t('Coach du lundi, {d}',{d:fd(now)})+'\n'+lines.map(l=>'• '+l.lead+(l.txt?' : '+l.txt:'')).join('\n')}}
function openCoach(){const c=coachData();LSs('coachDay',today());$('cb').hidden=true;
 showSheet(sheetHead(c.title)+`<p class="sub">${esc(c.sub)}</p>${c.lines.map(l=>`<div class="cl cl-${l.tone}"><i></i><div><b>${esc(l.lead)}</b>${l.txt?`<span>${esc(l.txt)}</span>`:''}</div></div>`).join('')}<div class="acts"><button type="button" class="btn sec" id="co_cp">${t('Copier le rapport')}</button></div>`);
 $('co_cp').onclick=()=>copyText(c.text,t('Rapport'))}
export function showCb(txt,btn,fn){$('cb').firstElementChild.textContent=txt;$('cb_go').textContent=btn;$('cb_go').onclick=fn;$('cb').hidden=false}
export function checkCoachBanner(){if(new Date().getDay()===1&&LSg('coachDay','')!==today()&&app.P.length)showCb(t('Ton coach du lundi est prêt'),t('Ouvrir'),openCoach)}
$('cb_go').onclick=openCoach;$('cb_x').onclick=()=>{$('cb').hidden=true;LSs('coachDay',today())};
