import { app } from '../state.js';
import { $, LSg, LSs, avail, esc, title, today } from './core.js';
import { abc, freq } from './form.js';
import { closeSheet } from './piece-sheet.js';
import { sheetHead, showSheet } from './tools-index.js';

app.openQrTool = openQrTool;
app.openScanner = openScanner;

/* ===== 7. QR et emplacement (bacs) ===== */
const qrSvg=(t,cell)=>{const q=qrcode(0,'M');q.addData(t);q.make();return q.createSvgTag(cell||3,0)};
const naturalBacs=()=>abc(freq('bac'));
function openQrTool(){
 let mode=LSg('qrMode','new'),sel=new Set();
 const list=()=>{const st=app.P.filter(avail);return mode==='new'?st.filter(p=>p.entree===today()):mode==='nobac'?st.filter(p=>!p.bac):mode==='all'?st:st.filter(p=>p.bac===mode)};
 const draw=()=>{const L=list();sel=new Set([...sel].filter(id=>L.some(p=>p.id===id)));
  $('qr_list').innerHTML=L.slice(0,80).map(p=>`<label class="qrr"><input type="checkbox" data-sel="${esc(p.id)}"${sel.has(p.id)?' checked':''}><span><b>${esc(p.code||p.id)}</b> ${esc(title(p))}${p.taille?' · '+esc(p.taille):''}</span><em>${esc(p.bac||'—')}</em></label>`).join('')||'<div class="hint">Aucune pièce dans ce filtre.</div>';
  $('qr_n').textContent=L.length+' pièce'+(L.length>1?'s':'')+(L.length>80?' (80 affichées)':'')+' · '+sel.size+' sélectionnée'+(sel.size>1?'s':'');
  $('qr_flt').querySelectorAll('.chip').forEach(c=>c.classList.toggle('on',c.dataset.m===mode))};
 const bacs=naturalBacs();
 showSheet(sheetHead('Étiquettes QR et bacs')+`<div class="card"><p class="sub" style="margin-bottom:10px">Choisis des pièces, range-les dans un bac, imprime leurs étiquettes. Scanner le QR ouvre la fiche et indique le bac.</p>
  <div class="chips" id="qr_flt"><button type="button" class="chip sm" data-m="new">Ajoutées aujourd'hui</button><button type="button" class="chip sm" data-m="nobac">Sans bac</button><button type="button" class="chip sm" data-m="all">Tout le stock</button>${bacs.map(b=>`<button type="button" class="chip sm" data-m="${esc(b)}">${esc(b)}</button>`).join('')}</div>
  <div class="hint" id="qr_n" style="margin:8px 0"></div><div class="qrl" id="qr_list"></div>
  <div class="acts two" style="margin-top:8px"><button type="button" class="btn sec sm" id="qr_all">Tout sélectionner</button><button type="button" class="btn sec sm" id="qr_none">Rien</button></div>
  <label class="l" for="qr_b" style="margin-top:14px">Ranger la sélection dans le bac</label><div class="pwrow"><input type="text" id="qr_b" list="qr_bl" placeholder="B3" autocapitalize="characters" autocomplete="off"><button type="button" class="btn sm" id="qr_set">Ranger</button></div><datalist id="qr_bl">${bacs.map(b=>`<option value="${esc(b)}">`).join('')}</datalist>
  <div class="acts"><button type="button" class="btn" id="qr_print">Imprimer les étiquettes</button></div></div>`);
 $('qr_flt').onclick=e=>{const c=e.target.closest('[data-m]');if(c){mode=c.dataset.m;LSs('qrMode',mode);draw()}};
 $('qr_list').onchange=e=>{const i=e.target.dataset.sel;if(!i)return;e.target.checked?sel.add(i):sel.delete(i);$('qr_n').textContent=$('qr_n').textContent.replace(/· \d+ sélectionnée.*/,'· '+sel.size+' sélectionnée'+(sel.size>1?'s':''))};
 $('qr_all').onclick=()=>{list().slice(0,80).forEach(p=>sel.add(p.id));draw()};$('qr_none').onclick=()=>{sel.clear();draw()};
 $('qr_set').onclick=()=>{const b=$('qr_b').value.trim().toUpperCase();if(!b)return app.toast('Indique le bac');if(!sel.size)return app.toast('Sélectionne des pièces');
  const olds=[...sel].map(id=>app.P.find(p=>p.id===id)).filter(Boolean);olds.forEach(p=>app.save(Object.assign({},p,{bac:b})));app.toast(olds.length+' pièce'+(olds.length>1?'s':'')+' rangée'+(olds.length>1?'s':'')+' dans '+b,()=>olds.forEach(p=>app.save(p)));draw()};
 $('qr_print').onclick=()=>{const L=[...sel].map(id=>app.P.find(p=>p.id===id)).filter(Boolean);if(!L.length)return app.toast('Sélectionne des pièces');printLabels(L)};
 draw()}
export function printLabels(L){let box=$('plabels');if(!box){box=document.createElement('div');box.id='plabels';document.body.appendChild(box)}
 box.innerHTML=L.map(p=>`<div class="plb"><div class="pq">${qrSvg('stock:'+p.id,3)}</div><div class="pt2"><b>${esc(p.bac||'')}</b><span class="pc2">${esc(p.code||p.id)}</span><span>${esc(title(p))}</span><span>${esc([p.taille,p.grade&&'grade '+p.grade].filter(Boolean).join(' · '))}</span></div></div>`).join('');
 document.body.classList.add('printing');const done=()=>{document.body.classList.remove('printing');window.removeEventListener('afterprint',done)};window.addEventListener('afterprint',done);setTimeout(()=>window.print(),150)}
let scanStream=null,scanRaf=0;
function stopScan(){cancelAnimationFrame(scanRaf);if(scanStream){scanStream.getTracks().forEach(t=>t.stop());scanStream=null}$('scan').hidden=true}
async function openScanner(){
 closeSheet();
 if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia)return app.toast('La caméra n\'est pas disponible ici (il faut une adresse https)');
 try{scanStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'},audio:false})}catch(e){return app.toast('Accès à la caméra refusé')}
 const v=$('scan_v');v.srcObject=scanStream;await v.play().catch(()=>{});$('scan').hidden=false;$('scan_s').textContent='Place le QR dans le cadre';
 const det=window.BarcodeDetector?new BarcodeDetector({formats:['qr_code']}):null,cv=document.createElement('canvas'),cx=cv.getContext('2d',{willReadFrequently:true});
 const tick=async()=>{if(!scanStream)return;if(v.readyState>=2){let txt=null;
   try{if(det){const r=await det.detect(v);if(r.length)txt=r[0].rawValue}else if(window.jsQR){cv.width=v.videoWidth;cv.height=v.videoHeight;cx.drawImage(v,0,0);const im=cx.getImageData(0,0,cv.width,cv.height),r=jsQR(im.data,cv.width,cv.height);if(r)txt=r.data}}catch(e){}
   if(txt){const found=findByQr(txt);if(found){stopScan();app.openSheet(found.id);return}$('scan_s').textContent='QR lu, mais aucune pièce correspondante : '+txt.slice(0,30)}}
  scanRaf=requestAnimationFrame(tick)};tick()}
const findByQr=t=>{const m=/^stock:(.+)$/.exec(String(t).trim());return app.P.find(p=>p.id===(m?m[1]:t))||app.P.find(p=>p.code===String(t).trim())};
$('scan_x').onclick=stopScan;
