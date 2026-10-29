import { app } from '../state.js';
import { $, LSg, LSs, today } from './core.js';
import { tx } from './storage.js';
import { phBlob, phURL } from './photos.js';
import { cloud, queueMany } from './sync.js';
import { sheetHead, showSheet } from './tools-index.js';
import { compressBlob } from './photo-compress.js';
import { fmtSize } from './proofs.js';
import { scheduleDefis } from './challenges.js';

app.openPhotos = openPhotos;

/* --- 10. performances : défilement par morceaux, recherche allégée, espace photos --- */
let moreObs=null;
function obsMore(){if(moreObs)moreObs.disconnect();const m=$('more');if(!m||!('IntersectionObserver' in window))return;moreObs=new IntersectionObserver(es=>{if(es[0].isIntersecting){moreObs.disconnect();app.lim+=60;app.renderList()}},{rootMargin:'700px'});moreObs.observe(m)}
const renderList0=app.renderList;app.renderList=function(){renderList0();obsMore()};
let scT=null;window.addEventListener('scroll',()=>{if(scT||app.view!=='list')return;scT=setTimeout(()=>{scT=null;const m=$('more');if(m&&m.getBoundingClientRect().top<innerHeight+700){app.lim+=60;app.renderList()}},120)},{passive:true});
$('q').oninput=(()=>{let t;return()=>{clearTimeout(t);t=setTimeout(()=>{app.lim=60;app.renderList()},160)}})();
const renderAll0=app.renderAll;app.renderAll=function(){renderAll0();scheduleDefis()};
async function openPhotos(){showSheet(sheetHead(t('Photos et espace'))+'<div class="card"><p class="sub">'+t('Calcul en cours…')+'</p></div>');
 const recs=(await tx('photos','readonly',s=>s.getAll()))||[];let img=0,imgB=0,vid=0,vidB=0,big=0;const ids=[];
 recs.forEach(r=>{const b=r.blob;if(!b)return;if((b.type||'').startsWith('video')){vid++;vidB+=b.size}else{img++;imgB+=b.size;if(b.size>130000){big++;ids.push(r.id)}}});
 let est=null;try{est=await navigator.storage.estimate()}catch(e){}
 const lim_=1024*1048576,pc=imgB/lim_,lv=pc>=.85?'r':pc>=.6?'o':'g';
 showSheet(sheetHead(t('Photos et espace'))+`<div class="card"><h3>${t('Espace cloud (Supabase gratuit : 1 Go)')}</h3><div class="rl"><b class="gc-${lv}" style="width:${Math.min(100,pc*100).toFixed(1)}%"></b></div><div class="gl2">${t('{s} de photos sur 1 Go · {p} %',{s:fmtSize(imgB),p:Math.round(pc*100)})}</div>${pc>=.6?`<div class="cl cl-${lv}" style="margin-top:10px"><i></i><div><b>${t(pc>=.85?'Presque plein':'À surveiller')}</b><span>${t('Compresse tes photos, ou passe à une formule payante avant d\'atteindre la limite.')}</span></div></div>`:''}
  <div class="kv" style="grid-template-columns:auto 1fr;margin-top:12px"><dt>${t('Photos')}</dt><dd>${img}</dd><dt>${t('Sauvegarde JSON estimée')}</dt><dd>${t('environ {s}',{s:fmtSize(imgB*1.37)})}</dd><dt>${t('Vidéos de preuves (cet appareil)')}</dt><dd>${vid} · ${fmtSize(vidB)}</dd>${est&&est.quota?`<dt>${t('Stockage de l\'appareil')}</dt><dd>${t('{a} utilisés sur {b}',{a:fmtSize(est.usage),b:fmtSize(est.quota)})}</dd>`:''}<dt>${t('Photos lourdes (plus de 130 Ko)')}</dt><dd>${big}</dd></div>
  <p class="sub" style="margin-top:12px">${t('Les nouvelles photos sont réduites automatiquement (900 px, JPEG). Ce bouton réduit celles que tu as déjà.')}</p><div class="acts"><button type="button" class="btn mint" id="ph_go"${big?'':' disabled'}>${big?t(big>1?'Compresser {n} photos':'Compresser {n} photo',{n:big}):t('Tout est déjà léger')}</button></div><div class="hint" id="ph_s"></div></div>`);
 if(!$('ph_go'))return;$('ph_go').onclick=async()=>{$('ph_go').disabled=true;let done=0,saved=0,fail=0;const changed=[];
  for(const id of ids){try{const b=await phBlob(id);if(!b||b.size<=130000)continue;const nb=await compressBlob(b);if(nb.size<b.size*.9){await tx('photos','readwrite',st=>st.put({id,blob:nb}));const u=phURL.get(id);if(u){URL.revokeObjectURL(u);phURL.delete(id)}saved+=b.size-nb.size;changed.push(id)}}catch(e){fail++}
   done++;if(done%5===0)$('ph_s').textContent=t('{a} / {b} photos traitées…',{a:done,b:ids.length})}
  if(changed.length)await queueMany([],changed);$('ph_s').textContent=t('Terminé : {p}, {m} gagnés',{p:tn(changed.length,'photo allégée','photos allégées'),m:fmtSize(saved)})+(fail?' ('+tn(fail,'non lisible','non lisibles')+')':'')+'.';app.toast(t('{m} gagnés',{m:fmtSize(saved)}));setTimeout(()=>openPhotos(),1800)}}
export async function checkSpace(){if(!cloud||LSg('spaceDay','')===today())return;LSs('spaceDay',today());try{const recs=(await tx('photos','readonly',s=>s.getAll()))||[];const b=recs.reduce((a,r)=>a+(r.blob&&!(r.blob.type||'').startsWith('video')?r.blob.size:0),0);if(b/(1024*1048576)>=.7)app.toast(t('Espace photos à {p} % du Go gratuit : ouvre Outils, Photos et espace',{p:Math.round(b/(1024*1048576)*100)}),null,6000)}catch(e){}}
