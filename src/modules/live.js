import { app } from '../state.js';
import { $, LSg, LSs, avail, esc, eur, isnum, num, profit, sold, title, today } from './core.js';
import { hydrate } from './photos.js';
import { defFrais, fN } from './settings-core.js';
import { renta, rentaHTML } from './profitability.js';
import { goalMini } from './goals.js';
import { ageDelai, cand, priceFor } from './sell-card.js';

app.renderVendre = renderVendre;

/* ---------- onglet Vendre : vente rapide et mode Live ---------- */
function renderVendre(){$('gq').innerHTML=goalMini();renderLive()}

/* mode Live TikTok */
let liveSel=null,lf={prix:'',pseudo:''};
/* colis à préparer : vendus, pas encore marqués prêts, et vendus il y a 14 jours ou moins (un vieux colis, par exemple d'un historique importé, est considéré comme parti) */
export const COLIS_JOURS=14;
export const colisList=()=>app.P.filter(p=>sold(p)&&!p.exp&&p.vt&&Date.now()-p.vt<=COLIS_JOURS*864e5);
app.colisList = colisList;
function liveStats(){const ls=LSg('liveStart',0),L=ls?app.P.filter(p=>sold(p)&&p.canal==='TikTok Live'&&(p.vt||0)>=ls):[];return{ls,n:L.length,ca:L.reduce((a,x)=>a+(x.pv||0),0),ben:L.reduce((a,x)=>a+profit(x),0)}}
function renderLive(){renderLH();renderLCand();renderLCur();renderLCol()}
function renderLH(){const s=liveStats();$('lh').innerHTML=s.ls?`<div class="live-h on"><span class="live-dot"></span><b>${t('EN DIRECT')}</b><span class="live-s">${tn(s.n,'vente','ventes')} · ${eur(s.ca)} · ${t('bénéfice {b}',{b:eur(s.ben)})}</span><button type="button" class="btn sm sec" id="l_end">${t('Terminer')}</button></div>`:`<div class="live-h"><b>${t('Mode Live TikTok')}</b><span class="live-s">${t('Démarre le live pour compter tes ventes.')}</span><button type="button" class="btn sm mint" id="l_start">${t('Démarrer')}</button></div>`}
function renderLCand(){const q=$('ls').value.trim();const box=$('lc');if(liveSel){box.innerHTML='';return}
 const L=q?cand($('ls').value).slice(0,6):[];
 box.innerHTML=q?(L.length?L.map(p=>`<button type="button" class="lcand" data-lsel="${esc(p.id)}"><b>${esc(p.code||p.id)}</b><span>${esc(title(p))}${p.taille?' · '+esc(p.taille):''}</span></button>`).join(''):'<div class="hint">'+t('Aucune pièce en stock ne correspond.')+'</div>'):'<div class="hint">'+t('Tape le code ou le numéro de la pièce montrée à l\'écran.')+'</div>'}
function liveCalc(p){const x=num(lf.prix);if(isNaN(x))return'<div class="pv">'+t('Bénéfice net : —')+'</div>';return`<div class="pv">${rentaHTML(renta(p.achat||0,x,defFrais(x,'TikTok Live'),ageDelai(p),true))}</div>`}
function renderLCur(){const box=$('lcur');const p=liveSel&&app.P.find(x=>x.id===liveSel&&avail(x));if(!p){liveSel=null;box.innerHTML='';return}
 box.innerHTML=`<div class="lv"><div class="lv-code">${esc(p.code||p.id)}</div><div class="lv-title">${esc(title(p))}</div><div class="lv-sub">${[p.taille&&t('Taille')+' '+esc(p.taille),p.grade&&t('Grade')+' '+esc(p.grade),isnum(p.achat)&&t('acheté {p}',{p:eur(p.achat)})].filter(Boolean).join(' · ')}</div>
 <div class="lv-price"><button type="button" class="stp" data-lp="-5">−5</button><button type="button" class="stp" data-lp="-1">−1</button><div class="price"><input type="text" inputmode="decimal" id="lp" value="${esc(lf.prix)}" aria-label="${t('Prix')}"><span>€</span></div><button type="button" class="stp" data-lp="1">+1</button><button type="button" class="stp" data-lp="5">+5</button></div>
 <div id="lr">${liveCalc(p)}</div>
 <label class="l" for="lb" style="margin-top:12px">${t('@pseudo de l\'acheteur')}</label><input type="text" id="lb" value="${esc(lf.pseudo)}" placeholder="@${t('pseudo')}" autocapitalize="none" autocomplete="off" spellcheck="false">
 <button type="button" class="btn mint lv-go" id="l_sell">${esc(t('Vendu à @{p}',{p:lf.pseudo.replace(/^@+/,'')||'…'}))}</button><button type="button" class="btn sec" id="l_chg" style="margin-top:8px">${t('Changer de pièce')}</button></div>`;hydrate()}
let colisMode=LSg('colisMode','bac');
function renderLCol(){const C=colisList(),box=$('lcol');
 const head=`<h3 style="margin:18px 0 8px">${t('À préparer ({n})',{n:C.length})}</h3>`+(C.length?`<div class="chips" style="margin-bottom:10px"><button type="button" class="chip sm${colisMode==='bac'?' on':''}" data-cm="bac">${t('Par bac')}</button><button type="button" class="chip sm${colisMode==='buyer'?' on':''}" data-cm="buyer">${t('Par acheteur')}</button></div>`:'');
 if(!C.length){box.innerHTML=head+'<div class="empty" style="padding:14px 8px">'+t('Rien à préparer. Les ventes faites dans l\'appli apparaissent ici.')+'</div>';return}
 if(colisMode==='bac'){const S2=[...C].sort((a,b)=>(a.bac||'￿').localeCompare(b.bac||'￿',app.LOC,{numeric:true})||(a.code||'').localeCompare(b.code||''));
  box.innerHTML=head+'<div class="prepl">'+S2.map(x=>`<div class="pre"><span class="bacb">${esc(x.bac||'—')}</span><div class="pm"><b>${esc(title(x))}${x.taille?' · '+esc(x.taille):''}</b><small>${esc(x.code||'')} · ${x.acheteur?'@'+esc(x.acheteur)+' · ':''}${esc(tv(x.canal||''))}</small></div><button type="button" class="btn sm sec gh" data-proof="${esc(x.id)}">${t('Preuves')}</button><button type="button" class="btn sm mint" data-prep="${esc(x.id)}">${t('Prêt')}</button></div>`).join('')+'</div>';return}
 const g=new Map();[...C].sort((a,b)=>(b.vt||0)-(a.vt||0)).forEach(p=>{const k=p.acheteur||'';if(!g.has(k))g.set(k,[]);g.get(k).push(p)});
 box.innerHTML=head+[...g.entries()].map(([k,L])=>`<div class="parcel"><div class="ph"><b>${k?'@'+esc(k):t('Sans pseudo')}</b><span>${tn(L.length,'pièce','pièces')} · ${eur(L.reduce((a,x)=>a+(x.pv||0),0))}</span></div><ul>${L.map(x=>`<li><b>${esc(x.code||x.id)}</b> ${esc(title(x))}${x.taille?' · '+esc(x.taille):''} <button type="button" class="lnkb" data-proof="${esc(x.id)}">${t('preuves')}</button></li>`).join('')}</ul><button type="button" class="btn mint" data-col="${esc(k)}">${t('Colis prêt')}</button></div>`).join('')}
function liveSelect(id){const p=app.P.find(x=>x.id===id);if(!p)return;liveSel=id;const pr=priceFor(p);lf={prix:pr?fN(pr):'',pseudo:''};$('ls').value='';renderLCand();renderLCur();const i=$('lb');if(i)i.focus()}
$('ls').addEventListener('input',renderLCand);
$('ls').addEventListener('keydown',e=>{if(e.key==='Enter'){const L=cand($('ls').value);if($('ls').value.trim()&&L.length){e.preventDefault();liveSelect(L[0].id)}}});
$('vl').addEventListener('click',e=>{
 if(e.target.closest('#l_start')){LSs('liveStart',Date.now());renderLH();app.toast(t('Live démarré'));return}
 if(e.target.closest('#l_end')){const s=liveStats();LSs('liveStart',0);renderLH();app.toast(t('Live terminé : {v}, bénéfice {b}',{v:tn(s.n,'vente','ventes'),b:eur(s.ben)}));return}
 const sl=e.target.closest('[data-lsel]');if(sl){liveSelect(sl.dataset.lsel);return}
 const lp=e.target.closest('[data-lp]');if(lp){const x=num(lf.prix)||0;lf.prix=fN(Math.max(0,x+Number(lp.dataset.lp)));$('lp').value=lf.prix;const p=app.P.find(y=>y.id===liveSel);if(p)$('lr').innerHTML=liveCalc(p);return}
 if(e.target.closest('#l_chg')){liveSel=null;lf={prix:'',pseudo:''};renderLCand();renderLCur();$('ls').focus();return}
 if(e.target.closest('#l_sell')){liveSell();return}
 const cm=e.target.closest('[data-cm]');if(cm){colisMode=cm.dataset.cm;LSs('colisMode',colisMode);renderLCol();return}
 const pr=e.target.closest('[data-prep]');if(pr){const x=app.P.find(y=>y.id===pr.dataset.prep);if(x){const old=Object.assign({},x);app.save(Object.assign({},x,{exp:today()}));renderLCol();app.toast(t('Colis prêt')+(x.bac?t(' · bac {b}',{b:x.bac}):''),()=>{app.save(old);renderLCol()})}return}
 const col=e.target.closest('[data-col]');
 if(col){const k=col.dataset.col,L=colisList().filter(p=>(p.acheteur||'')===k),old=L.map(p=>Object.assign({},p));L.forEach(p=>app.save(Object.assign({},p,{exp:today()})));renderLCol();app.toast(k?t('Colis prêt pour @{k}',{k}):t('Colis prêt'),()=>{old.forEach(p=>app.save(p));renderLCol()})}});
$('vl').addEventListener('input',e=>{
 if(e.target.id==='lp'){lf.prix=e.target.value;const p=app.P.find(y=>y.id===liveSel);if(p)$('lr').innerHTML=liveCalc(p)}
 if(e.target.id==='lb'){lf.pseudo=e.target.value;const b=$('l_sell');if(b)b.textContent=t('Vendu à @{p}',{p:lf.pseudo.replace(/^@+/,'')||'…'})}});
$('vl').addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.id==='lb'){e.preventDefault();liveSell()}});
function liveSell(){const p=app.P.find(x=>x.id===liveSel);if(!p)return;const x=num(lf.prix),ps=(lf.pseudo||'').trim().replace(/^@+/,'');
 if(isNaN(x)||x<0){app.toast(t('Indique le prix'));return}
 if(!ps){app.toast(t('Entre le @pseudo de l\'acheteur'));const i=$('lb');if(i)i.focus();return}
 if(!app.guardSale(p,x,defFrais(x,'TikTok Live'),today()))return;const q=Object.assign({},p,{statut:'Vendu',pv:x,canal:'TikTok Live',dv:today(),frais:defFrais(x,'TikTok Live'),acheteur:ps,vt:Date.now()});LSs('lastCanal','TikTok Live');
 app.save(q);liveSel=null;lf={prix:'',pseudo:''};renderLive();app.toast(t('Vendu à @{p}',{p:ps})+' · '+t('bénéfice {b}',{b:eur(profit(q))}),()=>{app.save(p);renderLive()});$('ls').focus()}
