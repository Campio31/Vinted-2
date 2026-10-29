import { app } from '../state.js';
import { $, LSg, LSs, esc, eur, num, title } from './core.js';
import { nrm } from './advice.js';
import { copyText } from './listing.js';
import { defFrais, fN } from './settings-core.js';
import { cand, priceFor } from './sell-card.js';
import { sheetHead, showSheet } from './tools-index.js';

app.openNego = openNego;

/* ===== 8. Négociation ===== */
function parseOffer(t){const n=nrm(t).replace(/(\d)\s*[.,]\s*(\d{1,2})(?!\d)/g,'$1.$2');let m=/(\d+(?:\.\d+)?)\s*(?:€|euros?|eur\b|e\b)/.exec(n);if(m)return +m[1];
 m=/(?:propose|offre|donne|laisse|fais|ferai|prend|prends|pour|a|offer|offering|ti offro|ofrezco|biete|for|per)\s+(\d+(?:\.\d+)?)(?!\d)/.exec(n);if(m)return +m[1];const all=n.match(/\b\d+(?:\.\d+)?\b/g);return all&&all.length===1&&+all[0]<1000?+all[0]:null}
function openNego(){
 let sel=null;const pct=LSg('floorPct',80);
 showSheet(sheetHead(t('Négociation'))+`<div class="card"><label class="l" for="ng_m">${t('Message de l\'acheteur')}</label><textarea id="ng_m" rows="4" placeholder="${t('Bonjour, je vous propose 15 € pour le pull, c\'est possible ?')}"></textarea>
  <label class="l" for="ng_q" style="margin-top:12px">${t('Pièce (facultatif)')}</label><input type="search" id="ng_q" placeholder="${t('Code ou marque')}" autocomplete="off" autocapitalize="none"><div id="ng_c"></div>
  <div class="row2 fld"><div><label class="l" for="ng_p">${t('Prix affiché (€)')}</label><input type="text" inputmode="decimal" id="ng_p"></div><div><label class="l" for="ng_f">${t('Prix plancher (€)')}</label><input type="text" inputmode="decimal" id="ng_f"></div></div>
  <span class="l">${t('Plancher par défaut')}</span><div class="chips" id="ng_pc">${[70,80,90].map(v=>`<button type="button" class="chip sm${v===pct?' on':''}" data-pc="${v}">${t('{n} % du prix',{n:v})}</button>`).join('')}</div>
  <div class="acts"><button type="button" class="btn" id="ng_go">${t('Proposer une réponse')}</button></div></div><div id="ng_out"></div>`);
 const setFloor=()=>{const p=num($('ng_p').value);if(!isNaN(p)&&p>0)$('ng_f').value=fN(Math.round(p*LSg('floorPct',80)/100*2)/2)};
 $('ng_p').oninput=setFloor;
 $('ng_pc').onclick=e=>{const b=e.target.closest('[data-pc]');if(!b)return;LSs('floorPct',+b.dataset.pc);$('ng_pc').querySelectorAll('.chip').forEach(x=>x.classList.toggle('on',x===b));setFloor()};
 $('ng_q').oninput=()=>{const q=$('ng_q').value.trim(),L=q?cand(q).slice(0,5):[];$('ng_c').innerHTML=L.map(p=>`<button type="button" class="lcand" data-ngp="${esc(p.id)}"><b>${esc(p.code||p.id)}</b><span>${esc(title(p))}${p.taille?' · '+esc(p.taille):''}</span></button>`).join('')};
 $('ng_c').onclick=e=>{const b=e.target.closest('[data-ngp]');if(!b)return;sel=app.P.find(x=>x.id===b.dataset.ngp);$('ng_q').value='';$('ng_c').innerHTML=`<div class="hint">${t('Pièce choisie :')} <b>${esc(title(sel))}</b> · ${t('acheté {p}',{p:eur(sel.achat)})}</div>`;const v=priceFor(sel);if(v){$('ng_p').value=fN(v);setFloor()}};
 $('ng_go').onclick=()=>{const msg=$('ng_m').value,price=num($('ng_p').value);let floor=num($('ng_f').value);
  if(isNaN(price)||price<=0)return app.toast(t('Indique le prix affiché'));if(isNaN(floor)||floor<=0){floor=Math.round(price*.8*2)/2}
  $('ng_out').innerHTML=negoHTML(msg,price,floor,sel);$('ng_out').scrollIntoView({behavior:'smooth',block:'start'})}}
function negoReply(msg,price,floor){
 const n=nrm(msg),offer=parseOffer(msg),lot=/\blot\b|plusieurs|pack|ensemble|deux articles|2 articles|les deux|bundle|both|two items|more than one|lotto|piu articoli|entrambi|due articoli|\blote\b|varios|ambos|dos articulos|paket|mehrere|beide|zwei artikel/.test(n),last=/dernier prix|meilleur prix|baisse|geste|reduc|remise|moins cher|best price|last price|discount|cheaper|lower|ultimo prezzo|prezzo migliore|sconto|mejor precio|ultimo precio|descuento|rebaja|mas barato|letzter preis|bester preis|rabatt|billiger|nachlass/.test(n),r2=v=>Math.round(v*2)/2,fmt=v=>String(r2(v)).replace('.',app.DS)+' €';
 const mid=Math.max(floor,Math.min(price,r2((Math.max(offer||0,floor)+price)/2)));
 if(offer!==null){
  if(offer>=price)return{tag:'g',analysis:t('Offre de {o} : au prix affiché ou au-dessus.',{o:fmt(offer)}),main:t('Bonjour, avec plaisir ! C\'est d\'accord pour {p}. Je prépare le colis dès que tu valides l\'achat sur Vinted. Merci !',{p:fmt(price)}),alt:null,price:price};
  if(offer>=floor){const strong=offer>=floor+(price-floor)*.5;const accept=t('Bonjour, c\'est d\'accord pour {o}. Je prépare le colis dès ton achat, merci !',{o:fmt(offer)});const counter=t('Bonjour, merci pour ton offre ! Je peux faire {m} avec envoi soigné. Dis-moi si ça te convient.',{m:fmt(mid)});
   return{tag:strong?'g':'o',analysis:t('Offre de {o} : au-dessus de ton plancher ({f}).',{o:fmt(offer),f:fmt(floor)}),main:strong?accept:counter,alt:strong?counter:accept,mainLabel:strong?t('Accepte {o}',{o:fmt(offer)}):t('Contre-propose {m}',{m:fmt(mid)}),altLabel:strong?t('Ou contre-propose {m}',{m:fmt(mid)}):t('Ou accepte {o}',{o:fmt(offer)}),price:strong?offer:mid}}
  const c=Math.max(floor,r2(price*.92));return{tag:'r',analysis:t('Offre de {o} : sous ton plancher ({f}).',{o:fmt(offer),f:fmt(floor)}),main:t('Bonjour, merci pour ton intérêt ! {o} est un peu juste pour cette pièce. Mon dernier prix est {c}, avec envoi soigné.',{o:fmt(offer),c:fmt(c)}),alt:t('Bonjour, merci ! Je ne peux pas descendre à {o}. Je reste à {p}, mais n\'hésite pas à regarder mes autres articles : je fais un lot avec remise.',{o:fmt(offer),p:fmt(price)}),mainLabel:t('Refuse et propose {c}',{c:fmt(c)}),altLabel:t('Ou reste ferme et propose un lot'),price:c}}
 if(lot)return{tag:'g',analysis:t('L\'acheteur demande un lot ou plusieurs articles.'),main:t('Bonjour ! Oui, je fais un prix sur les lots : -10 % dès 2 articles et -15 % dès 3, avec un seul envoi. Dis-moi lesquels t\'intéressent et je te fais le prix.'),alt:null,price:null};
 const dispo=/disponible|dispo\b|toujours a vendre|encore a vendre|toujours la|available|still for sale|still there|disponibile|ancora in vendita|sigue a la venta|aun disponible|verfugbar|noch da|noch zu verkaufen/.test(n);
 if(!last&&dispo)return{tag:'g',analysis:t('L\'acheteur demande si la pièce est disponible.'),main:t('Bonjour ! Oui, elle est toujours disponible. Tu veux que je te donne des mesures ou des photos en plus ? Je prépare le colis dès ton achat.'),alt:null,price:null};
 if(!last)return{tag:'n',analysis:t('Pas de prix ni de demande de remise dans le message.'),main:t('Bonjour, merci pour ton message ! N\'hésite pas si tu veux des mesures ou des photos en plus. Je suis à ton écoute.'),alt:null,price:null};
 {const c=Math.max(floor,r2(price*.93));return{tag:'o',analysis:t('Pas de prix précis dans le message.'),main:t('Bonjour, merci pour ton message ! Je peux faire {c} au lieu de {p}, avec envoi soigné sous 48 h. Ça te convient ?',{c:fmt(c),p:fmt(price)}),alt:t('Bonjour, merci ! Le prix est déjà ajusté, mais je peux faire un geste sur un lot si tu prends plusieurs articles.'),mainLabel:t('Propose {c}',{c:fmt(c)}),altLabel:t('Ou reste ferme'),price:c}}}
function negoHTML(msg,price,floor,sel){const r=negoReply(msg,price,floor),cost=sel?((sel.achat||0)):null;
 const margin=p=>p==null||cost===null?'':`<div class="hint">${t('Bénéfice net à {p} : {b}',{p:eur(p),b:eur(p-cost-defFrais(p,'Vinted'))})}</div>`;
 const box=(label,txt,p,main)=>`<div class="nbx${main?' main':''}"><div class="nh"><b>${esc(label)}</b></div><div class="nt">${esc(txt)}</div>${margin(p)}<div class="acts" style="margin-top:8px"><button type="button" class="btn${main?'':' sec'} sm" data-cp="${esc(txt)}">${t('Copier la réponse')}</button></div></div>`;
 setTimeout(()=>{document.querySelectorAll('#ng_out [data-cp]').forEach(b=>b.onclick=()=>copyText(b.dataset.cp,t('Réponse')))},0);
 return`<div class="card"><div class="feu f-${r.tag}"><i></i><b>${esc(r.analysis)}</b></div>${box(r.mainLabel||t('Réponse conseillée'),r.main,r.price,true)}${r.alt?box(r.altLabel||t('Autre option'),r.alt,null,false):''}<div class="hint">${t('Relis avant d\'envoyer : tu gardes le dernier clic.')}</div></div>`}
