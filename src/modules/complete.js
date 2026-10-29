import { app } from '../state.js';
import { $, avail, esc, pad, title } from './core.js';
import { hydrate, phImg } from './photos.js';
import { CATS0, ETAT0, GEN, GRADES, SUBS0, combo, freq, genCode, mrg, recentBrands, sizesFor, subsOf } from './form.js';
import { catSvg } from './stock-view.js';
import { sheetHead, showSheet } from './tools-index.js';
import { scheduleBadges } from './gamification.js';
import { canonVal } from './dedupe.js';

app.openComplete = openComplete;

/* ===== 4. Fiches à compléter ===== */
const NEED=['cat','sub','marque','grade','etat'];
export function missingFields(p){return NEED.filter(k=>!p[k]||(k==='marque'&&/^non (identifi|renseign)/i.test(p.marque)))}
export const incomplete=p=>missingFields(p).length>0||(!p.code&&!!(p.cat&&p.sub&&p.marque&&p.grade));
app.incomplete = incomplete;
const incList=()=>app.P.filter(incomplete).sort((a,b)=>(avail(b)-avail(a))||(missingFields(b).length-missingFields(a).length));
export function openComplete(){const L0=incList(),noGrade=app.P.filter(p=>!p.grade).length,noEtat=app.P.filter(p=>!p.etat).length,noCode=app.P.filter(p=>!p.code).length;
 if(!L0.length)return showSheet(sheetHead(t('Fiches à compléter'))+'<div class="empty">'+t('Toutes tes fiches sont complètes.')+'</div>');
 showSheet(sheetHead(t('Fiches à compléter'))+`<div class="card"><div class="kv" style="grid-template-columns:auto 1fr;margin-bottom:12px"><dt>${t('Fiches à compléter')}</dt><dd><b>${L0.length}</b></dd><dt>${t('Sans grade')}</dt><dd>${noGrade}</dd><dt>${t('Sans état')}</dt><dd>${noEtat}</dd><dt>${t('Sans code')}</dt><dd>${noCode}</dd></div><p class="sub">${t('Le mode « 10 fiches en 2 minutes » enchaîne uniquement les champs qui manquent. Le code se génère tout seul dès que c\'est possible.')}</p><div class="acts"><button type="button" class="btn mint" id="cp_go">${t('Compléter 10 fiches')}</button></div></div>`);
 $('cp_go').onclick=()=>runComplete()}
function runComplete(){const queue=incList().slice(0,10),total=queue.length;let i=0,done=0,t0=Date.now(),timer=null;
 const fmt=ms=>{const s=Math.round(ms/1000);return Math.floor(s/60)+':'+pad(s%60,2)};
 const finish=()=>{clearInterval(timer);const left=incList().length;showSheet(sheetHead(t('Bravo'))+`<div class="card" style="text-align:center"><div class="cd" style="font-size:64px">${done}</div><p class="sub">${t(done>1?'fiches complétées en {d}':'fiche complétée en {d}',{d:fmt(Date.now()-t0)})}</p><p>${left?t(left>1?'Il reste {n} fiches à compléter.':'Il reste {n} fiche à compléter.',{n:left}):t('Toutes tes fiches sont complètes.')}</p><div class="acts">${left?'<button type="button" class="btn mint" id="cp_again">'+t('10 de plus')+'</button>':''}<button type="button" class="btn sec" data-x="1">${t('Fermer')}</button></div></div>`);if($('cp_again'))$('cp_again').onclick=runComplete;scheduleBadges()};
 const OPT={cat:()=>mrg(CATS0,freq('cat')),sub:p=>mrg(SUBS0[p.cat]||[],subsOf(p.cat||'')),marque:()=>recentBrands(),taille:p=>sizesFor(p.cat),genre:()=>GEN,grade:()=>GRADES,etat:()=>ETAT0},LAB={cat:'Catégorie',sub:'Type',marque:'Marque',taille:'Taille',genre:'Genre',grade:'Grade',etat:'État'};
 const show=()=>{if(i>=queue.length)return finish();const p=app.P.find(x=>x.id===queue[i].id);if(!p){i++;return show()}const miss=missingFields(p);
  if(!miss.length){if(!p.code){const g=genCode(p);if(g)app.save(Object.assign({},p,{code:g}))}done++;i++;return show()}
  showSheet(sheetHead(t('Fiche {a} sur {b}',{a:i+1,b:total}))+`<div class="pg" style="margin-bottom:6px">${queue.map((_,k)=>`<i class="${k<i?'f':k===i?'c':''}"></i>`).join('')}</div><div class="hint" style="margin:0 0 10px"><span id="cp_t">${fmt(Date.now()-t0)}</span> · ${t(done>1?'{n} complétées':'{n} complétée',{n:done})}</div>
   <div class="card"><div class="qtop" style="margin-bottom:10px"><div class="th">${p.photo?phImg(p.photo):catSvg(p)}</div><div class="m"><b>${esc(title(p))}</b><small>${esc([p.code,p.taille,p.cat].filter(Boolean).join(' · ')||p.id)}</small></div></div>
   ${miss.map(k=>`<span class="l" style="margin-top:12px">${t(LAB[k])}</span><div class="chips">${(OPT[k](p)||[]).slice(0,k==='marque'?18:30).map(v=>`<button type="button" class="chip sm${k==='grade'?' g-'+v:''}" data-cf="${k}" data-v="${esc(v)}">${esc(tv(v))}</button>`).join('')}</div>${k==='marque'?'<input type="text" class="cpm" placeholder="'+t('Autre marque')+'" style="margin-top:8px" autocomplete="off">':''}`).join('')}
   <div class="acts two"><button type="button" class="btn sec" id="cp_skip">${t('Passer')}</button><button type="button" class="btn sec" id="cp_stop">${t('Terminer')}</button></div></div>`);
  hydrate();$('shc').onclick=e=>{const b=e.target.closest('[data-cf]');if(!b)return;const k=b.dataset.cf,v=b.dataset.v;apply(p.id,k,v)};
  const mi=$('shc').querySelector('.cpm');if(mi)mi.onkeydown=e=>{if(e.key==='Enter'&&mi.value.trim()){e.preventDefault();apply(p.id,'marque',canonVal('marque',mi.value.trim()))}};
  $('cp_skip').onclick=()=>{i++;show()};$('cp_stop').onclick=finish;
  clearInterval(timer);timer=setInterval(()=>{const e=$('cp_t');if(e)e.textContent=fmt(Date.now()-t0);else clearInterval(timer)},1000)};
 const apply=(id,k,v)=>{const p=app.P.find(x=>x.id===id);if(!p)return;const q=Object.assign({},p);q[k]=v;if(k==='cat')delete q.sub;if(!q.code||combo(q)!==combo(p)){const g=genCode(q);if(g)q.code=g}app.save(q);const left=missingFields(q);if(!left.length){done++;i++;setTimeout(show,250)}else show()};
 show()}
