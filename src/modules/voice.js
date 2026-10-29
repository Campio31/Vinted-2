import { app } from '../state.js';
import { $, LSg, LSs, avail, esc, eur, isnum, num, title, today } from './core.js';
import { go } from './nav.js';
import { COLORS, allBrands, lev } from './form.js';
import { closeSheet } from './piece-sheet.js';
import { nrm } from './advice.js';
import { defFrais, fN } from './settings-core.js';
import { priceFor } from './sell-card.js';
import { TI, sheetHead, showSheet } from './tools-index.js';

/* ===== 6. Commande vocale ===== */
const WNUM={zero:0,un:1,une:1,deux:2,trois:3,quatre:4,cinq:5,six:6,sept:7,huit:8,neuf:9,dix:10,onze:11,douze:12,treize:13,quatorze:14,quinze:15,seize:16,vingt:20,vingts:20,trente:30,quarante:40,cinquante:50,soixante:60};
function frNumWords(tokens){let tot=0,cur=0,got=false;for(let i=0;i<tokens.length;i++){const w=tokens[i];if(w==='et'||w==='')continue;if(w==='quatre'&&/^vingts?$/.test(tokens[i+1]||'')){cur+=80;i++;got=true;continue}
  if(w==='cent'||w==='cents'){cur=(cur||1)*100;got=true;continue}if(w in WNUM){cur+=WNUM[w];got=true;continue}break}return got?tot+cur:null}
function voicePrice(n){let m=/(\d+(?:[.,]\d+)?)\s*(?:euros?|€|eur\b|e\b)/.exec(n);if(m)return num(m[1]);
 const t=n.split(/[\s-]+/),i=t.findIndex(w=>/^euros?$/.test(w));if(i>0){let j=i-1;while(j>=0&&(t[j] in WNUM||/^(et|cent|cents|vingts?)$/.test(t[j])))j--;const v=frNumWords(t.slice(j+1,i));if(v!==null)return v}
 m=/(?:a|pour|prix)\s+(\d+(?:[.,]\d+)?)\b/.exec(n);return m?num(m[1]):null}
const CATW={tshirt:'Tshirt','t-shirt':'Tshirt',tee:'Tshirt',sweat:'Sweat',pull:'Sweat',hoodie:'Sweat',chemise:'Chemise',pantalon:'Pantalon',jean:'Pantalon',jeans:'Pantalon',veste:'Veste',manteau:'Veste',doudoune:'Veste',blouson:'Veste',short:'Short',polo:'Polo',maillot:'Maillot',robe:'RobeJupe',jupe:'RobeJupe'};
function parseVoice(text){const n=nrm(text).replace(/[,.!?]/g,' ').replace(/\s+/g,' ').trim(),o={raw:text,n};
 if(/\b(annule|annuler|annulation)\b/.test(n))return Object.assign(o,{intent:'undo'});
 if(/\b(ou est|ou se trouve|ou sont|trouve|cherche|recherche|montre)\b/.test(n)&&!/\bvendu/.test(n))o.intent=/\bou\b/.test(n)?'where':'search';
 else if(/\bvendu|vendue|vendus|j ai vendu|vends\b/.test(n))o.intent='sell';else o.intent=/\d/.test(n)&&/vinted|tiktok|live|euro/.test(n)?'sell':'unknown';
 o.price=voicePrice(n);o.canal=/tik ?tok|\blive\b/.test(n)?'TikTok Live':/vinted/.test(n)?'Vinted':null;const ps=/@\s?(\w+)/.exec(text);if(ps)o.pseudo=ps[1];
 const toks=n.split(' ');o.brand=null;const bs=allBrands().map(b=>[b,nrm(b)]).filter(x=>x[1].length>=3).sort((a,b)=>b[1].length-a[1].length);
 for(const [b,k] of bs){if((' '+n+' ').includes(' '+k+' ')){o.brand=b;break}}
 if(!o.brand){for(const t of toks){if(t.length<4)continue;const hit=bs.find(([b,k])=>!k.includes(' ')&&lev(t,k)<=1&&Math.abs(t.length-k.length)<=1);if(hit){o.brand=hit[0];break}}}
 o.color=Object.keys(COLORS).find(c=>toks.includes(nrm(c)))||null;o.cat=null;for(const t of toks){if(CATW[t]){o.cat=CATW[t];break}}
 let sz=/(?:taille|en)\s+(xxl|3xl|xl|xs|[sml]|\d{2})\b/.exec(n);if(!sz)sz=/\b(xxl|3xl|xl|xs)\b/.exec(n);if(!sz)sz=/\b([sml])\b/.exec(n.replace(/\b(a|en)\s+[sml]\b/,'$&'));
 o.size=sz?sz[1].toUpperCase():null;o.code=(/\b([a-z]{2}[a-z0-9]{4,}-\d{3})\b/i.exec(text)||[])[1]||null;return o}
function voiceMatch(o,pool){const sc=p=>{let s=0,k=0;if(o.brand){k++;if(nrm(p.marque)===nrm(o.brand))s+=3;else return -1}if(o.color){k++;if((p.coul||[]).includes(o.color))s+=2;else return -1}if(o.size){k++;if(nrm(p.taille)===nrm(o.size))s+=2;else return -1}if(o.cat){k++;if(p.cat===o.cat)s+=2;else return -1}if(o.code){return nrm(p.code)===nrm(o.code)?10:-1}return k?s:-1};
 const sc2=pool.map(p=>[sc(p),p]).filter(x=>x[0]>0);if(!sc2.length)return[];const top=Math.max(...sc2.map(x=>x[0]));return sc2.filter(x=>x[0]===top).map(x=>x[1]).sort((a,b)=>(a.entree||'').localeCompare(b.entree||''))}
let lastUndo=null;
function speak(t){try{if('speechSynthesis' in window){speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t);u.lang='fr-FR';speechSynthesis.speak(u)}}catch(e){}}
function voiceSell(p,o){const canal=o.canal||LSg('lastCanal','Vinted'),pr=isnum(o.price)?o.price:priceFor(p),fr=defFrais(pr,canal),old=p;
 const q=Object.assign({},p,{statut:'Vendu',pv:pr,canal,dv:today(),frais:fr,vt:Date.now()});if(o.pseudo)q.acheteur=o.pseudo;LSs('lastCanal',canal);app.save(q);lastUndo=()=>app.save(old);
 const msg='Vendu : '+title(p)+(p.taille?' '+p.taille:'')+', '+fN(pr)+' euros, '+canal+(p.bac?'. Bac '+p.bac:'');speak(msg);app.toast('Vendu · '+eur(pr)+(p.bac?' · bac '+p.bac:''),()=>{old&&app.save(old)});return msg}
function runVoice(text){const o=parseVoice(text),out=$('vc_out');if(!out)return;
 const say=(h,cls)=>{out.innerHTML=`<div class="vres ${cls||''}">${h}</div>`};
 if(o.intent==='undo'){if(lastUndo){lastUndo();lastUndo=null;speak('Annulé');return say('<b>Annulé</b> : la dernière action est défaite.','g')}return say('Rien à annuler.','o')}
 if(o.intent==='unknown'||(!o.brand&&!o.cat&&!o.color&&!o.size&&!o.code))return say(`<b>Je n'ai pas compris.</b><br>Essaie : « Vendu, Tommy bleu L, 18 euros, Vinted ».`,'o');
 const pool=o.intent==='sell'?app.P.filter(avail):app.P,m=voiceMatch(o,pool);
 if(o.intent==='where'){if(!m.length)return say('<b>Aucune pièce trouvée.</b>','o');const p=m[0];speak(p.bac?'Bac '+p.bac:'Pas de bac renseigné');return say(`<b>${esc(title(p))}${p.taille?' · '+esc(p.taille):''}</b><br>${p.bac?'Bac <b>'+esc(p.bac)+'</b>':'Pas de bac renseigné'} · ${esc(p.code||'')}${m.length>1?`<br><small>${m.length-1} autre${m.length>2?'s':''} pièce${m.length>2?'s':''} correspondante${m.length>2?'s':''}</small>`:''}`,'g')}
 if(o.intent==='search'){const q=[o.brand,o.cat,o.color,o.size].filter(Boolean).join(' ');closeSheet();go('list');$('q').value=q;app.filt='Disponible';app.renderList();return}
 if(!m.length)return say(`<b>Aucune pièce en stock ne correspond</b> à « ${esc([o.brand,o.cat,o.color,o.size].filter(Boolean).join(' '))} ».`,'o');
 const same=m.every(p=>nrm(p.marque)===nrm(m[0].marque)&&p.cat===m[0].cat&&p.taille===m[0].taille&&(p.coul||[]).join()===(m[0].coul||[]).join());
 if(m.length===1||same){const p=m[0];if(!isnum(o.price)&&!priceFor(p))return say(`<b>${esc(title(p))}</b> : je n'ai pas entendu le prix. Redis-le, par exemple « Vendu, Tommy bleu L, 18 euros ».`,'o');const msg=voiceSell(p,o);return say(`<b>${esc(msg)}</b>${m.length>1?`<br><small>${m.length} pièces identiques : j'ai pris la plus ancienne.</small>`:''}`,'g')}
 voiceChoices=m.slice(0,6);voiceSpec=o;out.innerHTML=`<div class="vres o"><b>${m.length} pièces correspondent.</b> Laquelle ?</div>`+voiceChoices.map((p,i)=>`<button type="button" class="lcand" data-vc="${i}"><b>${i+1}</b><span>${esc(title(p))}${p.taille?' · '+esc(p.taille):''}${p.code?' · '+esc(p.code):''}${p.bac?' · bac '+esc(p.bac):''}</span></button>`).join('');speak(m.length+' pièces correspondent. Laquelle ?')}
let voiceChoices=[],voiceSpec=null;
export function openVoice(){
 const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
 showSheet(sheetHead('Commande vocale')+`<div class="card" style="text-align:center"><button type="button" class="micbig" id="vc_mic" aria-label="Parler">${TI('<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>')}</button><div id="vc_st" class="hint" style="margin:8px 0">${SR?'Touche le micro et parle.':'Le micro n\'est pas disponible dans ce navigateur : écris la commande ci-dessous.'}</div>
  <div class="hint">« Vendu, Tommy bleu L, 18 euros, Vinted » · « Où est le Nike gris M ? » · « Annule »</div>
  <div class="pwrow" style="margin-top:12px"><input type="text" id="vc_t" placeholder="Ou écris ta commande" autocomplete="off"><button type="button" class="btn sm" id="vc_go">OK</button></div></div><div id="vc_out"></div>`);
 let rec=null;const st=m=>{$('vc_st').textContent=m};
 const start=()=>{if(!SR)return $('vc_t').focus();try{rec=new SR();rec.lang='fr-FR';rec.interimResults=true;rec.maxAlternatives=1;let fin='';
  rec.onstart=()=>{$('vc_mic').classList.add('on');st('J\'écoute…')};rec.onerror=e=>{$('vc_mic').classList.remove('on');st(e.error==='not-allowed'?'Accès au micro refusé.':'Je n\'ai rien entendu, réessaie.')};
  rec.onresult=e=>{let t='';for(const r of e.results){t+=r[0].transcript;if(r.isFinal)fin=t}$('vc_t').value=t;st('« '+t+' »')};
  rec.onend=()=>{$('vc_mic').classList.remove('on');const t=fin.trim();if(t){$('vc_t').value=t;runVoice(t)}};rec.start()}catch(e){st('Micro indisponible')}};
 $('vc_mic').onclick=()=>{if(rec&&$('vc_mic').classList.contains('on')){rec.stop();return}start()};
 $('vc_go').onclick=()=>{const t=$('vc_t').value.trim();if(t)runVoice(t)};$('vc_t').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();const t=$('vc_t').value.trim();if(t)runVoice(t)}};
 $('vc_out').onclick=e=>{const b=e.target.closest('[data-vc]');if(!b)return;const p=voiceChoices[+b.dataset.vc];if(!p)return;const msg=voiceSell(p,voiceSpec);$('vc_out').innerHTML=`<div class="vres g"><b>${esc(msg)}</b></div>`};
 if(SR)setTimeout(start,250)}
$('mic').onclick=openVoice;
