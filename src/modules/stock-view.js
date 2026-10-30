import { app } from '../state.js';
import { $, LSg, LSs, age, avail, dj, esc, eur, idn, isnum, profit, sold, title } from './core.js';
import { hydrate, phImg } from './photos.js';

app.renderList = renderList;

/* ---------- vue Stock ---------- */
export const STAT={Disponible:'En stock',Vendu:'Vendus','Pas Disponible':'Indispo'};
const tagOf=p=>p.statut==='Vendu'?'<span class="tag v">'+t('Vendu')+'</span>':p.statut==='Pas Disponible'?'<span class="tag x">'+t('Indispo')+'</span>':'<span class="tag">'+t('Stock')+'</span>';
function renderList(){
 /* l'onglet Stock ne montre que le stock : les pièces vendues sont dans l'onglet Vente */
 if(app.filt==='Vendu')app.filt='Tous';
 const stock=app.P.filter(p=>!sold(p)),F=['Tous','Disponible','Apub','Enligne','Pas Disponible'].concat(stock.some(app.incomplete)?['Incomplet']:[]),cnt=k=>stock.filter(p=>app.matchFiltK(p,k)).length;
 $('flt').innerHTML=F.map(k=>`<button class="chip sm${app.filt===k?' on':''}" type="button" data-flt="${k}">${t(app.FLAB[k]||STAT[k])} · ${cnt(k)}</button>`).join('')+`<span class="vt"><button type="button" data-lm="grid" aria-label="${t('Grille')}"${lmode==='grid'?' class="on"':''}><svg viewBox="0 0 24 24"><rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5"/></svg></button><button type="button" data-lm="list" aria-label="${t('Liste')}"${lmode==='list'?' class="on"':''}><svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button></span>`;
 $('lst').className=lmode==='grid'?'grid':'';
 if(!app.P.length){$('lst').innerHTML=`<div class="card empty"><b>${app.loaded?t('Ton stock est vide'):t('Chargement…')}</b>${app.loaded?'<br>'+t('Ajoute ta première pièce depuis l\'onglet Ajouter, importe ta sauvegarde (onglet Export), ou charge quelques exemples.')+'<br><button class="btn" id="exb" type="button">'+t('Charger des exemples')+'</button>':''}</div>`;if($('exb'))$('exb').onclick=app.loadExamples;return}
 const q=$('q').value.trim().toLowerCase();
 const toks=app.searchToks(q),sco=new Map();let ps=stock.filter(p=>{if(!app.matchFilt(p))return false;if(!toks.length)return true;const s=app.searchScore(p,toks);if(s<0)return false;sco.set(p.id,s);return true});
 ps.sort((a,b)=>(toks.length?sco.get(b.id)-sco.get(a.id):0)||(app.filt==='Vendu'?(b.dv||'').localeCompare(a.dv||''):0)||(b.entree||'').localeCompare(a.entree||'')||(b.cree||0)-(a.cree||0)||idn(b.id)-idn(a.id));
 const tot=ps.length;ps=ps.slice(0,app.lim);
 /* ligne « N résultats » avec un bouton pour effacer la recherche */
 const srh=q?`<div class="hint srh" style="grid-column:1/-1;display:flex;align-items:center;justify-content:space-between;gap:10px;margin:0 0 4px"><span>${t(tot>1?'{n} résultats pour « {q} »':'{n} résultat pour « {q} »',{n:tot,q:esc($('q').value.trim())})}</span><button type="button" class="lnk" id="q_clr">${t('Effacer')}</button></div>`:'';
 $('lst').innerHTML=srh+(ps.length?ps.map(p=>{if(lmode==='grid')return app.pieceTile(p,app.qSel===p.id);if(avail(p))return app.pieceRow(p,app.qSel===p.id);const a=age(p),pr=sold(p)?`<div class="p ${profit(p)>=0?'g':'b'}">${profit(p)>=0?'+':''}${eur(profit(p))}<small>${t('vendu {p}',{p:eur(p.pv)})}</small></div>`:`<div class="p">${isnum(p.achat)?eur(p.achat):''}<small>${avail(p)?dj(a):''}</small></div>`;
  return`<button type="button" class="li" data-id="${esc(p.id)}">${p.photo?phImg(p.photo,'th'):`<div class="th">${catSvg(p)}</div>`}<div class="m"><b>${esc(title(p))}${p.ex?'<span class="ex">'+t('exemple')+'</span>':''}</b><small>${esc([p.taille,tv(p.cat),tv(p.genre)].filter(Boolean).join(' · '))} ${tagOf(p)}</small></div>${pr}</button>`}).join('')+(tot>app.lim?`<button type="button" class="btn sec" id="more">${t('Afficher plus ({n})',{n:tot-app.lim})}</button>`:''):'<div class="empty">'+t('Aucune pièce.')+'</div>');
 hydrate();
}
let lmode=LSg('lmode','grid');
export const PASTEL={Bleu:['#CFE0FF','#2B5CFF'],Noir:['#E3E5EA','#4b5568'],Gris:['#E3E5EA','#4b5568'],Blanc:['#F1F1F1','#6b6f78'],Rouge:['#FFD9D6','#b3261e'],Orange:['#FFE3D2','#c2551f'],Vert:['#D9F2E6','#256b4a'],Rose:['#F9DDEB','#b3366b'],Violet:['#E6DDF7','#5b3fa8'],Jaune:['#FFF1BF','#8a6a00'],Beige:['#F0E6D6','#7a6040'],Marron:['#EBDDD0','#6b4423']};
const PASTEL0=[['#CFE0FF','#2B5CFF'],['#E3E5EA','#4b5568'],['#FFE3D2','#c2551f'],['#D9F2E6','#256b4a']];
export const pastel=p=>PASTEL[(p.coul||[])[0]]||PASTEL0[[...(p.cat||'x')].reduce((a,c)=>a+c.charCodeAt(0),0)%PASTEL0.length];
/* icône du vêtement selon la catégorie (utilisée quand il n'y a pas de photo) */
const ICONS={
 tshirt:'<path d="M8 3 3 6l2 4 3-1v12h8V9l3 1 2-4-5-3a4 4 0 0 1-8 0z"/>',
 polo:'<path d="M8 3 3 6l2 4 3-1v12h8V9l3 1 2-4-5-3-2 3h-2z"/><path d="M12 6.5V11"/><path d="M10 3.2 12 6.5l2-3.3"/>',
 chemise:'<path d="M8 3 3 6l2 4 3-1v12h8V9l3 1 2-4-5-3"/><path d="M8 3l4 4 4-4"/><path d="M12 7v14"/><path d="M12 11h.01M12 15h.01M12 19h.01"/>',
 sweat:'<path d="M9 3 5 5 2 14l3.2 1L6 11.5V21h12v-9.5l.8 3.5 3.2-1-3-9-4-2"/><path d="M9 3c.5 3.5 5.5 3.5 6 0"/><path d="M9.5 16h5"/>',
 veste:'<path d="M8 3 3 5.5 2 20h5V9"/><path d="M16 3l5 2.5L22 20h-5V9"/><path d="M8 3l4 4 4-4"/><path d="M7 9h10v12H7z"/><path d="M12 7v14"/>',
 pantalon:'<path d="M7 3h10l1.5 18h-5L12 10l-1.5 11h-5z"/><path d="M7 6.5h10"/>',
 short:'<path d="M6 5h12l1.5 12h-6L12 10.5 10.5 17h-6z"/><path d="M6 8.5h12"/>',
 maillot:'<path d="M8 3 3 6l2 4 3-1v12h8V9l3 1 2-4-5-3"/><path d="M9.5 3.3 12 7l2.5-3.7"/><path d="M12 12v4"/>',
 robe:'<path d="M9 3l1 5-3 13h10l-3-13 1-5"/><path d="M10 8h4"/>',
 chaussures:'<path d="M3 16c0-2.3 1.2-3.4 3-3.4l2-4.2 3 2 2 1c3 .6 6 2 7 4.200V18H3z"/><path d="M3 18h18"/>',
 sac:'<path d="M5 8h14l1 13H4z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
 cintre:'<path d="M12 7a2.5 2.5 0 1 0-2.5-2.5"/><path d="M12 7v2L3 16.500h18L12 9"/>'};
function iconKey(p){const c=app.nrm(p.cat),s=app.nrm(p.sub);
 if(/sac/.test(s)||/sac|accessoire/.test(c))return'sac';if(/chaussure|basket|sneaker|botte/.test(c))return'chaussures';
 if(/tshirt|tee/.test(c))return'tshirt';if(/polo/.test(c))return'polo';if(/chemise/.test(c)||/cardigan/.test(s))return'chemise';
 if(/sweat|pull|hoodie/.test(c))return'sweat';if(/veste|manteau|blouson|doudoune/.test(c))return'veste';
 if(/pantalon|jean|jogging/.test(c))return'pantalon';if(/short/.test(c))return'short';if(/maillot/.test(c))return'maillot';
 if(/robe|jupe/.test(c))return'robe';if(/pyjama/.test(s))return'tshirt';return'cintre'}
export const catSvg=p=>`<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[iconKey(p)]}</svg>`;
export const fmtP=v=>Number.isInteger(v)?v+' €':app.fN(v)+' €';

$('flt').onclick=e=>{const m=e.target.closest('[data-lm]');if(m){lmode=m.dataset.lm;LSs('lmode',lmode);app.qSel=null;app.renderList();return}const b=e.target.closest('[data-flt]');if(b){app.filt=b.dataset.flt;app.lim=60;app.renderList()}};
$('q').oninput=()=>{app.lim=60;app.renderList()};
$('lst').onclick=e=>{if(e.target.closest('#q_clr')){$('q').value='';app.lim=60;app.renderList();return}if(e.target.closest('#more')){app.lim+=60;app.renderList();return}if(app.sellClick(e,app.renderList))return;const b=e.target.closest('[data-id]');if(b)app.openSheet(b.dataset.id)};
