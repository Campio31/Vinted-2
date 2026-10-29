import { app } from '../state.js';
import { $, clean, esc, eur, fd, ok, profit, sold, title } from './core.js';
import { persist, tx } from './storage.js';
import { delai, med, nrm } from './advice.js';
import { CFG0, DEVICE_KEYS } from './settings-core.js';
import { queueMany } from './sync.js';
import { sheetHead, showSheet } from './tools-index.js';
import { diffEv } from './trash-history.js';

/* ===== v24 : lots, sélection, variantes, similaires, acheteurs ===== */
Object.assign(CFG0,{dash:null,shop:null,fourn:[],plan:[],fixes:[],noirs:{},vibr:true,onehand:false});
DEVICE_KEYS.push('onehand','vibr');
export const r2=v=>Math.round(v*100)/100;
export const buzz=ms=>{try{if(app.cfg.vibr!==false&&navigator.vibrate)navigator.vibrate(ms)}catch(e){}};
const toast24=app.toast;app.toast=function(m,u,d){if(u)buzz(16);return toast24(m,u,d)};

/* écriture groupée : une seule sauvegarde et un seul affichage pour N pièces */
export function bulkMod(ids,fn){const out=[];ids.forEach(id=>{const i=app.P.findIndex(x=>x.id===id);if(i<0)return;const old=app.P[i];let q=fn(Object.assign({},old));if(!q)return;q=clean(q);const ev=diffEv(old,q);if(ev.length)q=Object.assign({},q,{h:[...(q.h||[]),...ev.map(e=>({t:Date.now(),e}))].slice(-40)});app.P[i]=q;out.push({o:old,q})});
 if(!out.length)return out;app.renderAll();persist(async()=>{await tx('pieces','readwrite',s=>{out.forEach(x=>s.put(x.q))});await queueMany(out.map(x=>x.q.id),[])});return out}
export function bulkUndo(out){out.forEach(x=>{const i=app.P.findIndex(y=>y.id===x.o.id);if(i>=0)app.P[i]=x.o});app.renderAll();persist(async()=>{await tx('pieces','readwrite',s=>{out.forEach(x=>s.put(x.o))});await queueMany(out.map(x=>x.o.id),[])})}

/* ---------- acheteurs : fiche, fidèles, liste noire ---------- */
export const pseudoKey=s=>nrm(String(s||'').replace(/^@+/,''));
const noirs=()=>app.cfg.noirs||{};
const isBlack=ps=>{const k=pseudoKey(ps);return k?noirs()[k]||null:null};
function buyersData(){const o={};app.P.filter(p=>sold(p)&&p.acheteur).forEach(p=>{const k=pseudoKey(p.acheteur);if(!k)return;const b=o[k]=o[k]||{k,nom:p.acheteur,cmd:new Set(),pieces:[],ca:0,ben:0,last:'',ret:0};b.cmd.add(p.lot||p.id);b.pieces.push(p);b.ca+=p.pv||0;b.ben+=profit(p);if((p.dv||'')>b.last){b.last=p.dv||'';b.nom=p.acheteur}});
 app.P.forEach(p=>{if(!p.acheteur||sold(p))return;const b=o[pseudoKey(p.acheteur)];if(b)b.ret+=(p.retours||[]).length});return o}
export function buyerLine(ps){const b=buyersData()[pseudoKey(ps)],bl=isBlack(ps);let h='';
 if(bl)h+=`<span class="bw bad">⚠ ${t('Acheteur en liste noire')}${bl.m?' : '+esc(bl.m):''}</span>`;
 if(b)h+=`<span class="bw">${t('{n} commandes, {c} déjà achetés',{n:b.cmd.size,c:eur(b.ca)})}${b.cmd.size>=2?' · '+t('acheteur fidèle'):''}${b.ret?' · '+tn(b.ret,'retour','retours'):''}</span>`;return h}
document.addEventListener('input',e=>{const el=e.target;if(!el||!/^(qb|lb|e_ps|s_ps|gs_ps)$/.test(el.id))return;let w=$(el.id+'_w');if(!w){w=document.createElement('div');w.id=el.id+'_w';w.className='bwr';el.insertAdjacentElement('afterend',w)}w.innerHTML=buyerLine(el.value)});
let bTab='fid',bQ='';
export function openBuyers(){const D=buyersData(),all=Object.values(D).sort((a,b)=>b.last.localeCompare(a.last)),nk=Object.keys(noirs());
 const q=pseudoKey(bQ),L=(bTab==='fid'?all.filter(b=>b.cmd.size>=2).sort((a,b)=>b.ca-a.ca):bTab==='tous'?all:nk.map(k=>D[k]||{k,nom:noirs()[k].nom,cmd:new Set(),pieces:[],ca:0,last:'',ret:0})).filter(b=>!q||b.k.includes(q));
 showSheet(sheetHead(t('Acheteurs'))+`<div class="chips" style="margin-bottom:10px">${[['fid',t('Fidèles')+' · '+all.filter(b=>b.cmd.size>=2).length],['tous',t('Tous')+' · '+all.length],['noir',t('Liste noire')+' · '+nk.length]].map(([k,l])=>`<button type="button" class="chip sm${bTab===k?' on':''}" data-bt="${k}">${l}</button>`).join('')}</div>
 <input type="search" id="by_q" placeholder="${t('Chercher un pseudo')}" value="${esc(bQ)}" autocomplete="off" autocapitalize="none">
 <div style="margin-top:12px">${L.length?L.slice(0,80).map(b=>`<button type="button" class="li" data-by="${esc(b.k)}"><div class="m"><b>@${esc(b.nom)}${noirs()[b.k]?' <span class="off">⚠</span>':''}</b><small>${b.cmd.size?t('{n} commandes, {c} déjà achetés',{n:b.cmd.size,c:eur(b.ca)})+(b.last?' · '+fd(b.last):''):esc(noirs()[b.k]&&noirs()[b.k].m||'')}</small></div></button>`).join(''):`<div class="empty" style="padding:14px 8px">${bTab==='noir'?t('Personne dans ta liste noire. Ajoute un pseudo ci-dessous.'):bTab==='fid'?t('Aucun acheteur n\'a encore commandé deux fois. Pense à noter le @pseudo à chaque vente.'):t('Aucune vente avec un pseudo. Le champ @pseudo est dans le formulaire de vente.')}</div>`}</div>
 <div class="card" style="margin-top:12px"><h3 style="margin:0 0 8px">${t('Ajouter à la liste noire')}</h3><div class="row2"><input type="text" id="by_n" placeholder="@${t('pseudo')}" autocapitalize="none" autocomplete="off"><input type="text" id="by_m" placeholder="${t('Motif (facultatif)')}"></div><div class="acts"><button type="button" class="btn sec" id="by_add">${t('Ajouter')}</button></div></div>`);
 $('by_q').oninput=()=>{bQ=$('by_q').value;const p=$('by_q').selectionStart;openBuyers();const i=$('by_q');i.focus();try{i.setSelectionRange(p,p)}catch(e){}};
 $('shc').onclick=e=>{const b=e.target.closest('[data-bt]');if(b){bTab=b.dataset.bt;return openBuyers()}const y=e.target.closest('[data-by]');if(y)return openBuyer(y.dataset.by);
  if(e.target.closest('#by_add')){const n=$('by_n').value.trim().replace(/^@+/,'');if(!n)return app.toast(t('Écris un pseudo'));blkSet(n,$('by_m').value.trim());bTab='noir';openBuyers();app.toast(t('Ajouté à la liste noire'))}}}
function blkSet(nom,m){const k=pseudoKey(nom);if(!k)return;const o=Object.assign({},noirs());o[k]={nom,m:m||'',t:Date.now()};app.setCfg({noirs:o})}
function blkDel(k){const o=Object.assign({},noirs());delete o[k];app.setCfg({noirs:o})}
export function openBuyer(k,back){const b=buyersData()[k],bl=noirs()[k];if(!b&&!bl)return openBuyers();const nom=b?b.nom:bl.nom,MOTIFS_B=['Retour abusif','Litige','Ne paie pas','Autre'];
 showSheet(sheetHead('@'+esc(nom))+`<div class="card">${b?`<dl class="kv"><dt>${t('Commandes')}</dt><dd>${b.cmd.size}</dd><dt>${t('Pièces achetées')}</dt><dd>${b.pieces.length}</dd><dt>${t('Total dépensé')}</dt><dd>${eur(b.ca)}</dd><dt>${t('Ton bénéfice')}</dt><dd>${eur(b.ben)}</dd><dt>${t('Dernier achat')}</dt><dd>${fd(b.last)}</dd>${b.ret?`<dt>${t('Retours')}</dt><dd>${b.ret}</dd>`:''}</dl>`:`<p class="sub" style="margin:0">${t('Pas encore d\'achat chez toi.')}</p>`}
  ${bl?`<div class="cl cl-r" style="margin-top:10px"><i></i><div><b>${t('En liste noire')}</b><span>${esc(bl.m||'')}</span></div></div>`:''}</div>
  ${b?`<div class="card"><h3 style="margin:0 0 8px">${t('Historique')}</h3>${b.pieces.sort((x,y)=>(y.dv||'').localeCompare(x.dv||'')).map(p=>`<button type="button" class="li" data-id="${esc(p.id)}" style="margin-bottom:6px"><div class="m"><b>${esc(title(p))}</b><small>${fd(p.dv)}${p.lot?' · '+t('lot'):''}</small></div><div class="p">${eur(p.pv)}</div></button>`).join('')}</div>`:''}
  ${bl?`<div class="acts"><button type="button" class="btn sec" id="bu_del">${t('Retirer de la liste noire')}</button></div>`:`<div class="card"><span class="l">${t('Liste noire')}</span><div class="chips" id="bu_m" style="margin:8px 0">${MOTIFS_B.map(m=>`<button type="button" class="chip sm" data-v="${esc(m)}">${t(m)}</button>`).join('')}</div><div class="acts"><button type="button" class="btn red" id="bu_add">${t('Ajouter à la liste noire')}</button></div></div>`}
  <div class="acts"><button type="button" class="btn sec" id="bu_back">${t('Retour')}</button></div>`);
 $('bu_back').onclick=()=>back?back():openBuyers();
 if($('bu_del'))$('bu_del').onclick=()=>{blkDel(k);openBuyer(k,back)};
 if($('bu_add')){$('bu_m').onclick=e=>{const c=e.target.closest('[data-v]');if(!c)return;const was=c.classList.contains('on');$('bu_m').querySelectorAll('.chip').forEach(x=>x.classList.remove('on'));if(!was)c.classList.add('on')};$('bu_add').onclick=()=>{const m=document.querySelector('#bu_m .on');blkSet(nom,m?m.dataset.v:'');openBuyer(k,back);app.toast(t('Ajouté à la liste noire'))}}}

/* ---------- pièces similaires déjà vendues ---------- */
function similarSold(p){const S=app.P.filter(x=>sold(x)&&x.id!==p.id&&ok(x.dv)),sub=x=>x.sub||x.cat,m=nrm(p.marque);if(!sub(p))return null;
 const lv=[];if(m&&p.taille)lv.push([x=>nrm(x.marque)===m&&sub(x)===sub(p)&&x.taille===p.taille,[p.marque,tv(sub(p)),p.taille]]);if(m)lv.push([x=>nrm(x.marque)===m&&sub(x)===sub(p),[p.marque,tv(sub(p))]]);lv.push([x=>sub(x)===sub(p),[tv(sub(p))]]);
 for(let i=0;i<lv.length;i++){const r=S.filter(lv[i][0]);if(r.length>=3||(i===lv.length-1&&r.length)||(r.length&&lv.length===1)){const pr=r.map(x=>x.pv||0),d=r.map(delai).filter(v=>v!=null);return{r,lab:lv[i][1].join(' '),min:Math.min(...pr),max:Math.max(...pr),med:med(pr),d:d.length?d.reduce((a,b)=>a+b,0)/d.length:null}}}
 return null}
export function similarHTML(p){const s=similarSold(p);if(!s)return`<p class="sub" style="margin:0 0 6px">${t('Pas encore de vente comparable pour cette pièce.')}</p>`;
 return`<div class="sim"><b>${tn(s.r.length,'vendu','vendus')} : ${esc(s.lab)}</b><span>${s.min===s.max?eur(s.min):t('entre {a} et {b}',{a:eur(s.min),b:eur(s.max)})} · ${t('prix médian {p}',{p:eur(s.med)})}${s.d!=null?' · '+t('{n} jours en moyenne',{n:Math.round(s.d)}):''}</span></div>`}
