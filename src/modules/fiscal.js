import { app } from '../state.js';
import { $, LSg, LSs, addDays, days, esc, eur, eurR, fd, num, ok, pad, sold, today } from './core.js';
import { copyText } from './listing.js';
import { fN } from './settings-core.js';
import { bigEur } from './goals.js';
import { sheetHead, showSheet } from './tools-index.js';
import { showCb } from './coach.js';
import { FLAME, MOIS, badgeList, streakInfo } from './gamification.js';
import { finDate, finJours, pendingSales } from './finalisation.js';
import { go } from './nav.js';
import { closeSheet } from './piece-sheet.js';

app.fiscCardHTML = fiscCardHTML;
app.openFisc = openFisc;

/* ===== 2. Ligne fiscale micro-entrepreneur ===== */
export const lastDay=(y,m)=>new Date(y,m,0).getDate();
/* le CA à déclarer = les ventes finalisées dans la période (voir finalisation.js), pas celles faites dans la période */
function caBetween(a,b){const L=app.P.filter(p=>{const d=finDate(p);return d&&d>=a&&d<=b&&d<=today()}),s=L.reduce((t,p)=>t+(p.pv||0),0);return{ca:s,gross:s,n:L.length}}
function periodsList(){const tdt=new Date(),y=tdt.getFullYear(),m=tdt.getMonth()+1,out=[];
 if(app.cfg.periode==='T'){let q=Math.ceil(m/3),yy=y;for(let i=0;i<5;i++){const sm=(q-1)*3+1,em=sm+2;out.push({key:yy+'-T'+q,label:t('T')+q+' '+yy,start:`${yy}-${pad(sm,2)}-01`,end:`${yy}-${pad(em,2)}-${lastDay(yy,em)}`,due:q===4?`${yy+1}-01-31`:`${yy}-${pad(em+1,2)}-${lastDay(yy,em+1)}`});q--;if(q===0){q=4;yy--}}}
 else{let mm=m,yy=y;for(let i=0;i<7;i++){const nm=mm===12?1:mm+1,ny=mm===12?yy+1:yy;out.push({key:yy+'-'+pad(mm,2),label:MOIS[mm-1]+' '+yy,start:`${yy}-${pad(mm,2)}-01`,end:`${yy}-${pad(mm,2)}-${lastDay(yy,mm)}`,due:`${ny}-${pad(nm,2)}-${lastDay(ny,nm)}`});mm--;if(mm===0){mm=12;yy--}}}
 return out}
function fiscStatus(){const y=new Date().getFullYear(),c=caBetween(y+'-01-01',y+'-12-31').ca,elapsed=Math.max(1,days(y+'-01-01',today())+1),yd=((y%4===0&&y%100!==0)||y%400===0)?366:365,proj=c/elapsed*yd,pl=+app.cfg.plafond||0,pct=pl?c/pl:0;
 let cross=null;if(pl&&c<pl&&proj>pl)cross=addDays(y+'-01-01',Math.round(pl/(c/elapsed)));
 const lvl=pct>=1?'r':pct>=.9?'r':pct>=.75?'o':'g';return{y,ca:c,pl,pct,proj,cross,lvl,reste:Math.max(0,pl-c),tva:+app.cfg.plafondTva||0}}
function fiscRuler(pct,v,tot,lab){return`<div class="gr"><span>${t(lab)}</span><b class="gp gc-${pct>=.9?'r':pct>=.75?'o':'g'}">${Math.round(pct*100)} %</b></div><div class="rl"><b class="gc-${pct>=.9?'r':pct>=.75?'o':'g'}" style="width:${Math.min(100,pct*100).toFixed(1)}%"></b></div><div class="gl2">${t('{a} sur {b}',{a:eur(v),b:eur(tot)})}</div>`}
function fiscCardHTML(){const f=fiscStatus();if(!f.pl)return'';return`<button type="button" class="card minic" data-tool="fisc"><span class="l">${t('plafond micro-entrepreneur {y}',{y:f.y})}</span><b>${eurR(f.ca)} <small>${t('sur {n}',{n:eurR(f.pl)})}</small></b><div class="rl dk"><b class="gc-${f.lvl==='g'?'g':f.lvl==='o'?'o':'r'}" style="width:${Math.min(100,f.pct*100).toFixed(1)}%"></b></div><span class="mini-s">${f.pct>=1?t('Plafond dépassé'):f.cross?t('À ce rythme : dépassement vers le {d}',{d:fd(f.cross)}):t('Il te reste {r}',{r:eurR(f.reste)})}</span></button>`}

function openFisc(){const f=fiscStatus(),per=periodsList(),dec=app.cfg.fiscDeclared||{};let pk=per.length>1?per[1].key:per[0].key;
 const alert=f.pct>=1?{c:'r',t:t('Plafond dépassé'),x:t('Tu as dépassé le plafond de {p}. Vérifie sans attendre les règles sur autoentrepreneur.urssaf.fr.',{p:eurR(f.pl)})}:f.pct>=.9?{c:'r',t:t('À moins de 10 % du plafond'),x:t('Il te reste {r}. Ralentis ou prépare un changement de régime.',{r:eur(f.reste)})}:f.pct>=.75?{c:'o',t:t('Tu approches du plafond'),x:f.cross?t('Il te reste {r} : à ce rythme tu le dépasses vers le {d}.',{r:eur(f.reste),d:fd(f.cross)}):t('Il te reste {r}.',{r:eur(f.reste)})}:{c:'g',t:t('Marge confortable'),x:f.proj>f.pl?t('Il te reste {r} (à ce rythme tu atteindrais {p} en fin d\'année).',{r:eur(f.reste),p:eurR(f.proj)}):t('Il te reste {r}. Projection en fin d\'année : {p}.',{r:eur(f.reste),p:eurR(f.proj)})};
 showSheet(sheetHead(t('Ligne fiscale'))+`<div class="gcard"><div class="gh2"><span>${t('Plafond de chiffre d\'affaires {y}',{y:f.y})}</span></div><div class="gbig cd">${bigEur(f.ca)}</div>${fiscRuler(f.pct,f.ca,f.pl,'plafond micro-entrepreneur')}${f.tva?fiscRuler(f.ca/f.tva,f.ca,f.tva,'franchise en base de TVA'):''}</div>
  <div class="cl cl-${alert.c}"><i></i><div><b>${esc(alert.t)}</b><span>${esc(alert.x)}</span></div></div>
  <div class="card" style="margin-top:10px"><h3>${t('Déclaration URSSAF')}</h3><p class="sub">${t('Chiffre d\'affaires des ventes finalisées pendant la période : une vente compte quand l\'argent est reçu, pas le jour où tu l\'as faite. Les pièces retournées sont déjà retirées. Cotisations estimées avec ton taux.')}</p><div class="chips" id="fs_p" style="margin-bottom:12px">${per.map(p=>`<button type="button" class="chip sm${p.key===pk?' on':''}" data-pk="${p.key}">${esc(p.label)}</button>`).join('')}</div><div id="fs_d"></div></div>
  <div class="card"><h3>${t('Réglages fiscaux')}</h3><div class="row2 fld"><div><label class="l" for="f_pl">${t('Plafond (€)')}</label><input type="text" inputmode="decimal" id="f_pl" value="${esc(String(app.cfg.plafond).replace('.',app.DS))}"></div><div><label class="l" for="f_tx">${t('Cotisations (% du CA)')}</label><input type="text" inputmode="decimal" id="f_tx" value="${esc(String(app.cfg.tauxSoc).replace('.',app.DS))}"></div></div>
  <div class="row2 fld"><div><label class="l" for="f_tv">${t('Seuil de TVA (€)')}</label><input type="text" inputmode="decimal" id="f_tv" value="${esc(String(app.cfg.plafondTva).replace('.',app.DS))}"></div><div><label class="l" for="f_fj">${t('Finalisation automatique (jours)')}</label><input type="text" inputmode="numeric" id="f_fj" value="${finJours()}"></div></div>
  <div class="fld"><span class="l">${t('Déclaration')}</span><div class="chips"><button type="button" class="chip sm${app.cfg.periode!=='T'?' on':''}" data-pe="M">${t('Mensuelle')}</button><button type="button" class="chip sm${app.cfg.periode==='T'?' on':''}" data-pe="T">${t('Trimestrielle')}</button></div></div>
  <div class="hint">${t('Valeurs par défaut pour la vente de marchandises (plafond 203 100 €, seuil de TVA 91 900 €, cotisations 12,3 %). Vérifie-les sur autoentrepreneur.urssaf.fr : ton taux réel dépend de ton activité et de tes aides (ACRE, versement libératoire). Ces calculs sont des estimations, pas un conseil fiscal.')}</div></div>`);
 const draw=()=>{const p=per.find(x=>x.key===pk),r=caBetween(p.start,p.end),cot=r.ca*(+app.cfg.tauxSoc||0)/100,late=!dec[pk]&&p.due<today();
  $('fs_d').innerHTML=`<div class="kv" style="grid-template-columns:auto 1fr;margin-bottom:10px"><dt>${t('Période')}</dt><dd>${t('{a} au {b}',{a:fd(p.start),b:fd(p.end)})}</dd><dt>${t('Ventes finalisées')}</dt><dd>${r.n}</dd></div><div class="kpis two" style="margin-bottom:10px"><div class="kpi"><b>${eur(r.ca)}</b><span>${t('chiffre d\'affaires à déclarer')}</span></div><div class="kpi"><b>${eur(cot)}</b><span>${t('cotisations estimées ({p} %)',{p:String(app.cfg.tauxSoc).replace('.',app.DS)})}</span></div></div>
   <div class="hint">${t('Base imposable avec l\'abattement de 71 % : {a} · à déclarer avant le {d}',{a:eur(r.ca*.29),d:'<b>'+fd(p.due)+'</b>'})}${late?' <span style="color:var(--red)">'+t('(date dépassée)')+'</span>':''}</div>
   ${(()=>{const pe=pendingSales(),pt=pe.reduce((a,x)=>a+(x.pv||0),0);return pe.length?`<div class="cl cl-o"><i></i><div><b>${t(pe.length>1?'{n} ventes pas encore finalisées':'{n} vente pas encore finalisée',{n:pe.length})} · ${eur(pt)}</b><span>${t('Elles seront comptées dans la période où elles seront finalisées : quand tu les valides, ou automatiquement {n} jours après la vente.',{n:finJours()})}</span></div></div><button type="button" class="btn sec" id="fs_pend" style="margin-bottom:10px">${t('Voir les ventes à finaliser')}</button>`:`<div class="hint">${t('Aucune vente en attente de finalisation.')}</div>`})()}
   <div class="acts two"><button type="button" class="btn sec" id="fs_cp">${t('Copier le récapitulatif')}</button><button type="button" class="btn${dec[pk]?' sec':''}" id="fs_ok">${dec[pk]?t('Déclaré ✓ (annuler)'):t('Marquer déclaré')}</button></div>`;
  if($('fs_pend'))$('fs_pend').onclick=()=>{closeSheet();app.salesFilter('fin');go('sales')};
  $('fs_cp').onclick=()=>copyText(t('Déclaration URSSAF')+' · '+p.label+'\n'+t('Chiffre d\'affaires')+' : '+fN(r.ca)+' €\n'+t('Cotisations estimées')+' : '+fN(cot)+' €\n'+t('À déclarer avant le {d}',{d:fd(p.due)}),t('Récapitulatif'));
  $('fs_ok').onclick=()=>{const d=Object.assign({},app.cfg.fiscDeclared||{});if(d[pk])delete d[pk];else d[pk]=today();app.setCfg({fiscDeclared:d});dec[pk]=d[pk];draw()}};
 draw();
 $('fs_p').onclick=e=>{const b=e.target.closest('[data-pk]');if(!b)return;pk=b.dataset.pk;$('fs_p').querySelectorAll('.chip').forEach(c=>c.classList.toggle('on',c===b));draw()};
 $('shc').onchange=e=>{const m={f_pl:'plafond',f_tx:'tauxSoc',f_tv:'plafondTva',f_fj:'finJours'}[e.target.id];if(!m)return;const v=num(e.target.value);app.setCfg({[m]:isNaN(v)||v<0?0:v});app.toast(t('Réglage enregistré'));openFisc()};
 $('shc').onclick=e=>{const b=e.target.closest('[data-pe]');if(b){app.setCfg({periode:b.dataset.pe});openFisc()}}}
export function checkFiscAlert(){const f=fiscStatus();if(!f.pl||f.pct<.75||!$('cb').hidden)return;const lv=f.pct>=1?3:f.pct>=.9?2:1,k=f.y+':'+lv;if(LSg('fiscSeen','')===k)return;LSs('fiscSeen',k);
 showCb(f.pct>=1?t('Plafond micro dépassé'):f.pct>=.9?t('À moins de 10 % du plafond micro'):t('Tu approches du plafond micro ({p} %)',{p:Math.round(f.pct*100)}),t('Voir'),openFisc)}
