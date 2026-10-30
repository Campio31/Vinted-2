import { app } from '../state.js';
import { $, avail, days, esc, eur, eurR, isnum, ok, profit, sold, title, today } from './core.js';
import { phImg } from './photos.js';
import { catSvg, fmtP, pastel } from './stock-view.js';
import { advice } from './advice.js';
import { defFrais } from './settings-core.js';
import { renta } from './profitability.js';
import { estDelai } from './potential.js';
import { goalCalc, goalKinds } from './goals.js';
import { sellForm } from './sell-card.js';
import { same } from './sync.js';
import { FLAME, badgeList, streakInfo } from './gamification.js';
import { incomplete } from './complete.js';
import { markPublished } from './shortcuts.js';

app.renderKpi = renderKpi;
app.pieceTile = pieceTile;
app.pieceRow = pieceRow;
app.gamCardHTML = gamCardHTML;
app.depApply = depApply;
app.pubBlock = pubBlock;
app.nextAction = nextAction;

/* ===== v19 : publication, cartes allégées, sections du bilan, corbeille et historique, dépenses, trésorerie, rapport PDF ===== */
export const isDep=id=>String(id).startsWith('dep_');
app.isDep = isDep;
app.DEP = [];
function depApply(r,del,put){const i=app.DEP.findIndex(x=>x.id===r.id);if(r.deleted){if(i>=0){app.DEP.splice(i,1);del.push(r.id)}return}const d=Object.assign({},r.data,{id:r.id});if(i>=0){if(same(app.DEP[i],d))return;app.DEP[i]=d}else app.DEP.push(d);put.push(d)}

/* --- publication --- */
export const unpub=p=>avail(p)&&!ok(p.pub),onl=p=>avail(p)&&ok(p.pub);
const FLAB={Tous:'Tous',Incomplet:'À compléter',Apub:'À publier',Enligne:'En ligne'};
app.FLAB = FLAB;
const matchFiltK=(p,k)=>k==='Tous'||(k==='Incomplet'?incomplete(p):k==='Apub'?unpub(p):k==='Enligne'?onl(p):p.statut===k);
app.matchFiltK = matchFiltK;
export const matchFilt=p=>matchFiltK(p,app.filt);
app.matchFilt = matchFilt;
function pubBlock(st){const u=st.filter(x=>!ok(x.pub));if(!u.length)return'';const c=u.reduce((a,x)=>a+(x.achat||0),0);
 return`<div class="pubb"><div><b>${tn(u.length,'pièce jamais publiée','pièces jamais publiées')}</b><span>${t('{a} d\'achat immobilisés : elles ne peuvent pas se vendre tant qu\'elles ne sont pas en ligne.',{a:eurR(c)})}</span></div><button type="button" class="btn sm mint" data-topub="1">${t('Voir à publier')}</button></div>`}
document.addEventListener('click',e=>{const b=e.target.closest('[data-pub]');if(!b)return;e.preventDefault();e.stopPropagation();markPublished(app.P.find(x=>x.id===b.dataset.pub))},true);
function pieceTile(p,open){if(open)return pieceRow(p,true);
 const [bg,fg]=pastel(p),isA=avail(p),adv=isA?advice(p):null;let price='',cls='',dot='',lab='',marge='';
 if(isA){const set=isnum(p.pvise)&&p.pvise>0,v=set?p.pvise:adv.ok?adv.reco:0;price=v?fmtP(v):'—';lab=v?t(set?'visé':'conseillé'):'';if(!v)cls='n';
  if(v){const r=renta(p.achat||0,v,defFrais(v,'Vinted'),estDelai(p,v,adv));dot=`<i class="dot f-${r.c}"></i>`;marge=(r.net>=0?'+':'−')+fmtP(Math.abs(Math.round(r.net*100)/100))}}
 else if(sold(p)){const g=profit(p);price=(g>=0?'+':'−')+fmtP(Math.abs(g));cls=g>=0?'g':'n'}
 else{price=t('Indispo');cls='n'}
 const sub=[p.code?esc(p.code):'',esc(p.taille||''),p.bac?'<span class="ex-bac">'+esc(p.bac)+'</span>':'',incomplete(p)?'<span class="inc">'+t('à compléter')+'</span>':''].filter(Boolean).join(' · ');
 const stt=isA?(ok(p.pub)?`<span>${t('en ligne {n} j',{n:days(p.pub,today())})}</span>`:'<span class="off">'+t('à publier')+'</span>'):'';
 const mt=[p.grade?`<span class="pill sm g-${esc(p.grade)}">${esc(p.grade)}</span>`:'',stt,marge?`<span class="mg">${t('marge {m}',{m:marge})}</span>`:''].filter(Boolean).join('');
 return`<div class="tl"><span class="hl"></span><button type="button" class="im" data-id="${esc(p.id)}" style="background:${bg};color:${fg}" aria-label="${t('Ouvrir la fiche')}">${p.photo?phImg(p.photo):catSvg(p)}</button><span class="pr ${cls}">${price}${lab?`<small>${lab}</small>`:''}</span><div class="bd"><button type="button" class="ti" data-id="${esc(p.id)}"><b>${esc(title(p))}${p.ex?'<span class="ex">'+t('exemple')+'</span>':''}</b><span class="cdm">${sub}</span></button>${isA?`<div class="mt">${mt}</div><div class="ft">${dot}${ok(p.pub)?'':`<button type="button" class="vb pb" data-pub="${esc(p.id)}">${t('Publié')}</button>`}<button type="button" class="vb" data-qv="${esc(p.id)}">${t('Vendu')}</button></div>`:`<div class="st">${sold(p)?t('Vendu {p}',{p:eur(p.pv)})+' · '+esc(tv(p.canal||'Vinted')):t('Marquée indisponible')}</div>`}</div></div>`}
function pieceRow(p,open){const adv=open?null:advice(p);
 const th=p.photo?phImg(p.photo,'th'):`<div class="th">${catSvg(p)}</div>`,isA=avail(p);
 const info=isA?(ok(p.pub)?t('en ligne {n} j',{n:days(p.pub,today())}):'<span class="off">'+t('à publier')+'</span>'):'';
 const sub=[p.code?esc(p.code):'',esc(p.taille||''),p.grade?`<span class="pill sm g-${esc(p.grade)}">${esc(p.grade)}</span>`:'',info,incomplete(p)?'<span class="inc">'+t('à compléter')+'</span>':''].filter(Boolean).join(' · ');
 return`<div class="qrow${open?' open':''}"><div class="qtop"><button type="button" class="qm" data-id="${esc(p.id)}">${th}<span class="m"><b>${esc(title(p))}${p.ex?'<span class="ex">'+t('exemple')+'</span>':''}</b><small>${sub}</small></span></button><div class="p">${isnum(p.achat)?eur(p.achat):''}<small>${adv&&adv.ok?t('conseillé {p}',{p:eur(adv.reco)}):t('acheté')}</small></div>${open?'<button type="button" class="btn sm sec" data-qx="1">'+t('Annuler')+'</button>':`${ok(p.pub)?'':`<button type="button" class="btn sm sec gh" data-pub="${esc(p.id)}">${t('Publié')}</button>`}<button type="button" class="btn sm sec gh" data-qv="${esc(p.id)}">${t('Vendu')}</button>`}</div>${open?sellForm(p):''}</div>`}
function renderKpi(){if(!$('kp'))return;const st=app.P.filter(avail),tdy=today(),td=app.P.filter(p=>p.entree===tdy).length;
 const dorm=st.filter(p=>!ok(p.pub)).length,pct=st.length?dorm/st.length:0,lv=pct>0.5?' neg':pct>0.25?' warn':'';
 $('kp').innerHTML=`<div class="kpi"><b>${st.length}</b><span>${t('en stock')}</span></div><div class="kpi"><b>${eurR(st.reduce((s,p)=>s+(p.achat||0),0))}</b><span>${t('valeur d\'achat')}</span></div><div class="kpi"><b>${td}</b><span>${t('ajoutées aujourd\'hui')}</span></div><div class="kpi${lv}"><b>${dorm}</b><span>${t('à publier, pas encore en ligne · {p} % du stock',{p:Math.round(pct*100)})}</span></div>`}
function nextAction(){const st=app.P.filter(avail),u=st.filter(x=>!ok(x.pub)).length,hasGoal=goalKinds().some(k=>goalCalc(k,'m')||goalCalc(k,'y')),inc=app.P.filter(incomplete).length;
 if(!app.P.length)return{txt:t('Ajoute ta première pièce pour commencer')};
 if(u){const n=Math.min(5,u);return{txt:t(n>1?'Publie {n} pièces aujourd\'hui pour lancer ta série':'Publie {n} pièce aujourd\'hui pour lancer ta série',{n})}}
 if(!hasGoal)return{txt:t('Fixe un objectif du mois pour suivre ta progression')};
 if(inc)return{txt:t('Complète {n} fiches en 2 minutes',{n:Math.min(10,inc)})};
 return{txt:t('Ton plan de la semaine en 30 secondes')}}
function gamCardHTML(){const st=streakInfo(),done=badgeList().filter(b=>b.ok).length,u=app.P.filter(unpub).length;
 const sub=st.today?t('Publié aujourd\'hui'):st.n?t('Publie une pièce pour continuer'):u?t('Publie {n} pièces pour démarrer ta série',{n:Math.min(5,u)}):t('Publie une pièce pour démarrer ta série');
 return`<button type="button" class="card minic" ${!st.n&&u?'data-topub="1"':'data-tool="trophees"'}><span class="l">${t('série de publication')}</span><b><span class="flm sm${st.n?' on':''}">${FLAME}</span> ${st.n} <small>${tn(st.n,'jour','jours')} · ${tn(done,'badge','badges')}</small></b><span class="mini-s">${sub}</span></button>`}
