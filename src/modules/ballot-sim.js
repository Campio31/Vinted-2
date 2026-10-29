import { app } from '../state.js';
import { $, LSg, LSs, addDays, esc, eur, eurR, isnum, num, ok, sold, today } from './core.js';
import { CATS0, allBrands, freq, mrg } from './form.js';
import { delai, nrm } from './advice.js';
import { defFrais, fN } from './settings-core.js';
import { sheetHead, showSheet } from './tools-index.js';

app.openBallot = openBallot;

/* ===== 5. Simulateur de ballot ===== */
function poolStats(list,H){const cut=addDays(today(),-H),mat=list.filter(x=>ok(x.entree)&&x.entree<=cut),soldIn=mat.filter(x=>sold(x)&&delai(x)!==null&&delai(x)<=H),sp=list.filter(x=>sold(x)&&isnum(x.pv)&&x.pv>0);
 return{nm:mat.length,rate:mat.length?soldIn.length/mat.length:null,prices:sp.map(x=>x.pv),delais:soldIn.map(delai),ns:sp.length}}
function poolFor(marque,cat,H){const mq=nrm(marque),opts=[];
 if(mq)opts.push([marque+(cat?' · '+tv(cat):''),app.P.filter(x=>nrm(x.marque)===mq&&(!cat||x.cat===cat))]);
 if(cat)opts.push([t('catégorie {c} (toutes marques)',{c:tv(cat)}),app.P.filter(x=>x.cat===cat)]);
 opts.push([t('tout ton stock'),app.P]);
 for(let i=0;i<opts.length;i++){const ps=poolStats(opts[i][1],H);if(ps.nm>=8&&ps.ns>=3&&ps.delais.length>=2&&ps.rate>0)return{label:opts[i][0],ps,fallback:i>0}}
 const ps=poolStats(app.P,H);return{label:t('tout ton stock'),ps,fallback:true}}
function simBallot(prix,rows,H,runs){
 const pools=rows.map(r=>Object.assign({n:r.n},poolFor(r.marque,r.cat,H)));
 const pieces=[];pools.forEach(p=>{for(let i=0;i<p.n;i++)pieces.push(p.ps)});
 const rnd=a=>a[Math.floor(Math.random()*a.length)],nets=[],cas=[],be=[];let reached=0;
 for(let r=0;r<runs;r++){let ca=0,sum=0;const sales=[];
  for(const ps of pieces){if(Math.random()<(ps.rate||0)&&ps.prices.length){const pr=rnd(ps.prices),d=ps.delais.length?rnd(ps.delais):H/2,n=pr-defFrais(pr,'Vinted');ca+=pr;sum+=n;sales.push([d,n])}}
  nets.push(sum-prix);cas.push(ca);sales.sort((a,b)=>a[0]-b[0]);let c=0;for(const s of sales){c+=s[1];if(c>=prix){be.push(s[0]);reached++;break}}}
 nets.sort((a,b)=>a-b);cas.sort((a,b)=>a-b);be.sort((a,b)=>a-b);
 const q=(a,p)=>a.length?a[Math.min(a.length-1,Math.floor(p*(a.length-1)+.5))]:0,gain=nets.map(x=>x+prix).sort((a,b)=>a-b);
 return{pools,n:pieces.length,ca:{p10:q(cas,.1),p50:q(cas,.5),p90:q(cas,.9)},net:{p10:q(nets,.1),p50:q(nets,.5),p90:q(nets,.9)},loss:nets.filter(x=>x<0).length/runs,reach:reached/runs,be:q(be,.5),maxPrix:q(gain,.2),nets,runs}}
function parseBallot(t){const n=nrm(t),o={prix:null,n:null,marques:[]};
 let m=/(\d[\d\s.,]*)\s*(?:€|euros?|eur\b)/.exec(n);if(m){const v=num(m[1].replace(/\s/g,''));if(!isNaN(v))o.prix=v}
 m=/(\d+)\s*(?:pieces?|pcs|articles?|vetements?|pull|sweats?)/.exec(n);if(m)o.n=+m[1];
 const seen=new Set();allBrands().forEach(b=>{const k=nrm(b);if(k.length>=3&&!seen.has(k)&&new RegExp('(^|[^a-z0-9])'+k.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'([^a-z0-9]|$)').test(n)){seen.add(k);o.marques.push(b)}});
 return o}
function openBallot(){
 const H0=LSg('ballotH',45);
 showSheet(sheetHead(t('Simulateur de ballot'))+`<div class="card"><p class="sub" style="margin-bottom:10px">${t('Décris le ballot : l\'appli simule 2 000 scénarios à partir de tes ventes passées.')}</p>
  <label class="l" for="bl_t">${t('Description (facultatif)')}</label><input type="text" id="bl_t" placeholder="${t('40 pièces, mix Woolrich et Tommy, 768 €')}" autocomplete="off"><button type="button" class="btn sec sm" id="bl_fill" style="margin-top:8px">${t('Remplir le formulaire')}</button>
  <div class="row2 fld"><div><label class="l" for="bl_p">${t('Prix du ballot (€)')}</label><input type="text" inputmode="decimal" id="bl_p"></div><div><label class="l" for="bl_n">${t('Nombre de pièces')}</label><input type="text" inputmode="numeric" id="bl_n"></div></div>
  <span class="l">${t('Composition annoncée')}</span><div id="bl_rows"></div><button type="button" class="chip sm add" id="bl_add">${t('+ ajouter une marque')}</button><div class="hint">${t('Les pièces non détaillées sont simulées comme la moyenne de ton stock.')}</div>
  <span class="l" style="margin-top:14px">${t('Horizon de vente')}</span><div class="chips" id="bl_h">${[30,45,60].map(h=>`<button type="button" class="chip sm${h===H0?' on':''}" data-h="${h}">${t('{n} jours',{n:h})}</button>`).join('')}</div>
  <div class="acts"><button type="button" class="btn" id="bl_go">${t('Simuler')}</button></div></div><div id="bl_out"></div>`);
 const cats=mrg(CATS0,freq('cat'));
 const row=(m,c,q)=>`<div class="blr"><input type="text" class="bm" list="bl_dl" placeholder="${t('Marque')}" value="${esc(m||'')}"><select class="bc"><option value="">${t('Toutes')}</option>${cats.map(x=>`<option value="${esc(x)}"${x===c?' selected':''}>${esc(tv(x))}</option>`).join('')}</select><input type="text" inputmode="numeric" class="bq" placeholder="${t('Qté')}" value="${q||''}"><button type="button" class="bx" aria-label="${t('Retirer')}">×</button></div>`;
 $('bl_rows').innerHTML=row()+row()+`<datalist id="bl_dl">${allBrands().map(b=>`<option value="${esc(b)}">`).join('')}</datalist>`;
 let H=H0;
 $('bl_add').onclick=()=>$('bl_rows').querySelector('datalist').insertAdjacentHTML('beforebegin',row());
 $('bl_rows').onclick=e=>{if(e.target.classList.contains('bx'))e.target.closest('.blr').remove()};
 $('bl_h').onclick=e=>{const b=e.target.closest('[data-h]');if(!b)return;H=+b.dataset.h;LSs('ballotH',H);$('bl_h').querySelectorAll('.chip').forEach(x=>x.classList.toggle('on',x===b))};
 $('bl_fill').onclick=()=>{const o=parseBallot($('bl_t').value);if(o.prix!=null)$('bl_p').value=fN(o.prix);if(o.n)$('bl_n').value=o.n;
  if(o.marques.length){const per=Math.floor((o.n||0)/o.marques.length),rest=(o.n||0)-per*o.marques.length;$('bl_rows').querySelectorAll('.blr').forEach(r=>r.remove());const dl=$('bl_rows').querySelector('datalist');o.marques.forEach((m,i)=>dl.insertAdjacentHTML('beforebegin',row(m,'',o.n?per+(i===0?rest:0):'')))}
  app.toast(t(o.prix!=null||o.n||o.marques.length?'Formulaire rempli : vérifie les valeurs':'Je n\'ai rien reconnu dans cette description'))};
 $('bl_go').onclick=()=>{const prix=num($('bl_p').value),N=Math.round(num($('bl_n').value));
  if(isNaN(prix)||prix<=0)return app.toast(t('Indique le prix du ballot'));if(isNaN(N)||N<1)return app.toast(t('Indique le nombre de pièces'));
  let rows=[...$('bl_rows').querySelectorAll('.blr')].map(r=>({marque:r.querySelector('.bm').value.trim(),cat:r.querySelector('.bc').value,n:Math.round(num(r.querySelector('.bq').value))})).filter(r=>(r.marque||r.cat)&&r.n>0);
  let used=rows.reduce((a,r)=>a+r.n,0);if(used>N){const f=N/used;rows.forEach(r=>r.n=Math.max(1,Math.floor(r.n*f)));used=rows.reduce((a,r)=>a+r.n,0)}
  if(N>used)rows.push({marque:'',cat:'',n:N-used});
  if(!app.P.some(sold))return app.toast(t('Il faut des ventes passées pour simuler'));
  const s=simBallot(prix,rows,H,2000);renderBallot(s,prix,N,H)}}
function renderBallot(s,prix,N,H){
 const cp=prix/N,loss=Math.round(s.loss*100),col=loss<=15?'g':loss<=40?'o':'r',bins=12,mn=s.nets[0],mx=s.nets[s.nets.length-1],w=(mx-mn)/bins||1,h=Array(bins).fill(0);s.nets.forEach(x=>{h[Math.min(bins-1,Math.floor((x-mn)/w))]++});const hm=Math.max(...h),zero=(0-mn)/w;
 $('bl_out').innerHTML=`<div class="card"><div class="pot pot-${col}" style="margin:0 0 12px"><div class="pt"><span class="mono">${t('risque de perte')}</span><b>${loss} %</b></div><div class="ps">${t(loss<=15?'Faible':loss<=40?'À surveiller':'Élevé')} : ${t(loss>1?'{n} scénarios sur 100 finissent sous ton prix d\'achat.':'{n} scénario sur 100 finissent sous ton prix d\'achat.',{n:loss})}</div></div>
  <div class="kpis two" style="margin-bottom:10px"><div class="kpi"><b>${eurR(s.ca.p50)}</b><span>${t('chiffre d\'affaires probable ({a} à {b})',{a:eurR(s.ca.p10),b:eurR(s.ca.p90)})}</span></div><div class="kpi ${s.net.p50>=0?'':'neg'}"><b>${s.net.p50>=0?'+':'−'}${eurR(Math.abs(s.net.p50))}</b><span>${t('bénéfice net probable ({a} à {b})',{a:eurR(s.net.p10),b:eurR(s.net.p90)})}</span></div></div>
  <div class="kv" style="grid-template-columns:auto 1fr;margin-bottom:12px"><dt>${t('Coût par pièce')}</dt><dd>${eur(cp)}</dd><dt>${t('Prix couvert en')}</dt><dd>${s.reach>=.5?t('environ {n} jours (dans {p} % des scénarios)',{n:Math.round(s.be),p:Math.round(s.reach*100)}):t('pas atteint en {h} jours dans {p} % des scénarios',{h:H,p:Math.round((1-s.reach)*100)})}</dd><dt>${t('Prix maximum raisonnable')}</dt><dd>${t('{p} (80 % de chances d\'être rentable)',{p:eurR(s.maxPrix)})}</dd></div>
  <svg viewBox="0 0 240 70" class="hist" role="img" aria-label="${t('Répartition du bénéfice net sur les scénarios')}">${h.map((c,i)=>`<rect x="${i*20+1}" y="${64-Math.round(c/hm*58)}" width="18" height="${Math.max(1,Math.round(c/hm*58))}" rx="2" fill="${(mn+(i+.5)*w)<0?'var(--red)':'var(--mint)'}"/>`).join('')}${zero>0&&zero<bins?`<line x1="${zero*20}" y1="2" x2="${zero*20}" y2="66" stroke="var(--ink)" stroke-dasharray="3 3"/>`:''}</svg><div class="hint" style="text-align:center">${t('Bénéfice net : de {a} à {b} · trait pointillé = zéro',{a:eurR(mn),b:eurR(mx)})}</div>
  <span class="l" style="margin-top:12px">${t('Sur quoi repose la simulation')}</span>${s.pools.map(p=>`<div class="pr2b"><span>${tn(p.n,'pièce','pièces')} · ${esc(p.label)}</span><b>${p.ps.rate!==null?t('{p} % vendues en {h} j',{p:Math.round(p.ps.rate*100),h:H}):t('peu de données')}${p.fallback?' · '+t('estimation large'):''}</b></div>`).join('')}
  <div class="hint">${t('Simulation sur ton historique ({n} tirages) : les pièces sont vendues avec la probabilité observée, aux prix et délais de tes ventes passées, frais de vente déduits. Ce n\'est pas une garantie.',{n:s.runs})}</div></div>`;
 $('bl_out').scrollIntoView({behavior:'smooth',block:'start'})}
