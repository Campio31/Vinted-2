import { app } from '../state.js';
import { $, addDays, age, avail, days, dj, esc, eur, eurR, ok, pad, profit, sold, title, today } from './core.js';
import { hydrate } from './photos.js';
import { go } from './nav.js';
import { catSvg } from './stock-view.js';

app.renderDash = renderDash;

/* ---------- bilan ---------- */
export function stats(list){const s=list.filter(sold);const ca=s.reduce((a,x)=>a+(x.pv||0),0),cost=s.reduce((a,x)=>a+(x.achat||0),0),fr=s.reduce((a,x)=>a+(x.frais||0),0),ben=ca-cost-fr;
 const dl=s.filter(x=>ok(x.dv)&&(ok(x.pub)||ok(x.entree))).map(x=>Math.max(0,days(ok(x.pub)?x.pub:x.entree,x.dv)));
 return{s,n:s.length,ca,cost,fr,ben,marge:ca?ben/ca:0,panier:s.length?ca/s.length:0,delai:dl.length?dl.reduce((a,b)=>a+b,0)/dl.length:0}}
export function group(list,key){const o={};list.forEach(x=>{const k=(x[key]||'Non renseigné');const g=o[k]=o[k]||{k,n:0,ca:0,ben:0};g.n++;g.ca+=x.pv||0;g.ben+=profit(x)});return Object.values(o)}
export function hbars(rows,fmt){if(!rows.length)return'<div class="hint">'+t('Pas encore de données.')+'</div>';const mx=Math.max(...rows.map(r=>Math.abs(r.v)),1);return rows.map(r=>`<div class="hb"><span class="n">${esc(tv(r.k))}</span><div class="tr"><i class="${r.v<0?'neg':''}" style="width:${Math.max(3,Math.abs(r.v)/mx*100)}%"></i></div><span class="v">${fmt(r.v)}</span>${r.sub?`<small>${esc(r.sub)}</small>`:''}</div>`).join('')}
function renderDash(){
 $('per').innerHTML=[[30,'30 jours'],[90,'90 jours'],[0,'Tout']].map(([k,l])=>`<button type="button" class="chip${app.period===k?' on':''}" data-p="${k}">${t(l)}</button>`).join('');
 if(!app.P.length){$('dsh').innerHTML=`<div class="card empty">${app.loaded?t('Le bilan apparaît dès que tu as des pièces.')+'<br><button class="btn" id="exb2" type="button">'+t('Charger des exemples')+'</button>':t('Chargement…')}</div>`;if($('exb2'))$('exb2').onclick=app.loadExamples;return}
 const from=app.period?addDays(today(),-app.period):'';
 const inP=app.P.filter(x=>sold(x)&&(!from||(x.dv||'')>=from)),S=stats(inP),st=app.P.filter(avail);
 const rets=[];app.P.forEach(x=>(x.retours||[]).forEach(r=>{if(ok(r.d)&&(!from||r.d>=from))rets.push(r)}));const retSum=rets.reduce((a,r)=>a+(r.p||0),0);
 const stCost=st.reduce((a,x)=>a+(x.achat||0),0),old=st.filter(x=>ok(x.pub)&&days(x.pub,today())>=30).sort((a,b)=>days(b.pub,today())-days(a.pub,today()));
 const ecoul=app.P.length?app.P.filter(sold).length/app.P.length:0,avgAge=st.length?st.reduce((a,x)=>a+age(x),0)/st.length:0;
 const lbl=app.period?t('sur les {n} derniers jours',{n:app.period}):t('depuis le début');
 const pl=group(inP,'canal').sort((a,b)=>b.ben-a.ben),ct=group(inP,'cat').sort((a,b)=>b.ben-a.ben),br=group(inP.filter(x=>x.marque),'marque').sort((a,b)=>b.ben-a.ben).slice(0,6),sr=group(inP.filter(x=>x.prov),'prov').sort((a,b)=>b.ben-a.ben);
 const months=[];for(let i=5;i>=0;i--){const d=new Date();d.setDate(1);d.setMonth(d.getMonth()-i);months.push(d.getFullYear()+'-'+pad(d.getMonth()+1,2))}
 const ms=months.map(m=>({m,...stats(app.P.filter(x=>sold(x)&&(x.dv||'').startsWith(m)))})),mxm=Math.max(...ms.map(x=>x.ca),1);
 const mn=m=>new Date(m+'-15T12:00:00').toLocaleDateString(app.LOC,{month:'short'}).replace('.','');
 $('dsh').innerHTML=app.rappelsCardHTML()+app.goalHTML()+`<button type="button" class="card coachc" data-tool="coach"><b>${t('Coach du lundi')}</b><span>${esc(app.nextAction().txt)}</span></button>${app.fiscCardHTML()}${app.tresoCardHTML()}${app.rapportCardHTML()}${app.gamCardHTML()}${app.calCardHTML()}${app.defiCardHTML()}
 <div class="hero"><div class="t">${t('Bénéfice net {l}',{l:lbl})}</div><div class="big">${eur(S.ben)}</div><div class="s">${tn(S.n,'vente','ventes')} · ${t('{c} encaissés',{c:eur(S.ca)})} · ${t('marge {m} %',{m:(S.marge*100).toFixed(0)})}</div></div>
 <div class="kpis"><div class="kpi"><b>${eurR(S.panier)}</b><span>${t('panier moyen')}</span></div><div class="kpi"><b>${S.n?dj(S.delai):'—'}</b><span>${t('délai avant la vente')}</span></div><div class="kpi"><b>${(ecoul*100).toFixed(0)} %</b><span>${t('pièces vendues')}</span></div></div>
 ${rets.length?`<div class="kpis two"><div class="kpi"><b>${rets.length}</b><span>${t(rets.length>1?'retours':'retour')} ${lbl}</span></div><div class="kpi"><b>${eurR(retSum)}</b><span>${t('remboursés')}${S.ca?t(' ({p} % du CA)',{p:(retSum/S.ca*100).toFixed(0)}):''}</span></div></div>`:''}
 ${app.calHTML()}${app.depCardHTML(from,lbl)}<div class="card"><h3>${t('Stock actuel')}</h3><p class="sub">${tn(st.length,'pièce','pièces')} ${t('à vendre')}</p>
  <div class="kpis two" style="margin:0"><div class="kpi"><b>${eurR(stCost)}</b><span>${t('argent immobilisé')}</span></div><div class="kpi"><b>${st.length?dj(avgAge):'—'}</b><span>${t('ancienneté moyenne')}</span></div></div>
  ${app.pubBlock(st)}${old.length?`<div style="margin-top:14px"><span class="l">${t('En ligne depuis 30 jours et plus, à relancer ou baisser · {n}',{n:old.length})}</span>${old.slice(0,5).map(x=>`<button type="button" class="li" data-id="${esc(x.id)}" style="margin-bottom:6px"><div class="th">${catSvg(x)}</div><div class="m"><b>${esc(title(x))}</b><small>${esc([x.taille,tv(x.cat)].filter(Boolean).join(' · '))}</small></div><div class="p"><span class="tag x">${dj(days(x.pub,today()))}</span>${(a=>a.ok?`<small>${t('conseillé {p}',{p:eur(a.reco)})}</small>`:'')(app.advice(x))}</div></button>`).join('')}</div>`:'<div class="hint" style="margin-top:12px">'+t('Aucune pièce en ligne ne stagne depuis plus de 30 jours.')+'</div>'}</div>
 <div class="card"><h3>${t('Six derniers mois')}</h3><p class="sub">${t('Chiffre d\'affaires et bénéfice net par mois de vente')}</p><div class="mo">${ms.map(x=>`<div><b>${x.n?eurR(x.ben):''}</b><div class="pair"><i class="c" style="height:${x.ca/mxm*100}%;${x.ca?'':'display:none'}"></i><i class="p" style="height:${Math.max(0,x.ben)/mxm*100}%;${x.ben>0?'':'display:none'}"></i></div>${mn(x.m)}</div>`).join('')}</div><div class="lg"><span>${t('Chiffre d\'affaires')}</span><span class="p">${t('Bénéfice net')}</span></div></div>
 <div class="card"><h3>${t('Par plateforme')}</h3><p class="sub">${t('Bénéfice net {l}',{l:lbl})}</p>${hbars(pl.map(g=>({k:g.k,v:g.ben,sub:tn(g.n,'vente','ventes')+' · '+eur(g.ca)})),eurR)}</div>
 <div class="card"><h3>${t('Par catégorie')}</h3><p class="sub">${t('Bénéfice net {l}',{l:lbl})}</p>${hbars(ct.map(g=>({k:g.k,v:g.ben,sub:tn(g.n,'vente','ventes')})),eurR)}</div>
 <div class="card"><h3>${t('Meilleures marques')}</h3><p class="sub">${t('Bénéfice net {l}',{l:lbl})}</p>${hbars(br.map(g=>({k:g.k,v:g.ben,sub:tn(g.n,'vente','ventes')+' · '+t('{p} par pièce',{p:eurR(g.ben/g.n)})})),eurR)}</div>
 ${app.ballotsHTML()}${app.retoursHTML()}${sr.length?`<div class="card"><h3>${t('Provenance')}</h3><p class="sub">${t('Bénéfice net {l}, selon l\'endroit d\'achat',{l:lbl})}</p>${hbars(sr.map(g=>({k:g.k,v:g.ben,sub:tn(g.n,'vente','ventes')})),eurR)}</div>`:''}`;hydrate()}
$('per').onclick=e=>{const b=e.target.closest('[data-p]');if(b){app.period=+b.dataset.p;app.renderDash()}};
$('dsh').onclick=e=>{const c=e.target.closest('[data-cal]');if(c){const[y,m]=app.calM.split('-').map(Number),n=new Date(y,m-1+Number(c.dataset.cal),1);app.calM=n.getFullYear()+'-'+pad(n.getMonth()+1,2);app.calD='';app.renderDash();return}const dy=e.target.closest('[data-day]');if(dy){app.calD=app.calD===dy.dataset.day?'':dy.dataset.day;app.renderDash();return}if(e.target.closest('[data-ball]')){app.ballAll=!app.ballAll;app.renderDash();return}if(e.target.closest('[data-motifs]')){app.openMotifs();return}const tp=e.target.closest('[data-topub]');if(tp){app.filt='Apub';app.lim=60;go('list');return}const sc=e.target.closest('[data-sec]');if(sc){sc.closest('.card').classList.toggle('shut');app.saveSec();return}const al=e.target.closest('[data-allsec]');if(al){document.querySelectorAll('#dsh .card.cs').forEach(c=>c.classList.toggle('shut',al.dataset.allsec==='1'));app.saveSec();return}const b=e.target.closest('.li');if(b)app.openSheet(b.dataset.id)};
