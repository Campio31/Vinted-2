import { app } from '../state.js';
import { $, LSg, LSs, avail, esc, fd, isnum, today } from './core.js';
import { fmtP } from './stock-view.js';
import { advice } from './advice.js';
import { copyText } from './listing.js';
import { sheetHead, showSheet } from './tools-index.js';
import { fold } from './search.js';
import { unpub } from './publication.js';
import { photoBlob, shareFiles } from './proofs.js';

app.logoMark = logoMark;
app.openSocial = openSocial;

/* --- 3. visuels pour les réseaux --- */
export const FDN="Archivo, 'Arial Black', Arial, sans-serif";
function logoMark(c,x,y,s){c.save();c.translate(x,y);c.scale(s/104,s/104);c.fillStyle='#111';c.beginPath();c.roundRect?c.roundRect(0,0,104,104,22):c.rect(0,0,104,104);c.fill();c.fillStyle='#F1F2F4';c.fillRect(12,68,80,18);c.fillStyle='#C9CBD0';c.fillRect(18,46,68,18);c.translate(62,24);c.rotate(-12*Math.PI/180);c.translate(-62,-24);c.fillStyle='#FF4A1C';c.fillRect(32,14,58,18);c.restore()}
function coverDraw(c,img,x,y,w,h,r){c.save();c.beginPath();c.roundRect?c.roundRect(x,y,w,h,r||0):c.rect(x,y,w,h);c.clip();if(img){const k=Math.max(w/img.width,h/img.height),sw=w/k,sh=h/k;c.drawImage(img,(img.width-sw)/2,(img.height-sh)/2,sw,sh,x,y,w,h)}c.restore()}
export function wrapTxt(c,t,x,y,mw,lh,maxL){const ws=String(t).split(' ');let l='',n=0;for(const w of ws){const tt=l?l+' '+w:w;if(c.measureText(tt).width>mw&&l){c.fillText(l,x,y+n*lh);n++;l=w;if(maxL&&n>=maxL)return n}else l=tt}if(l){c.fillText(l,x,y+n*lh);n++}return n}
export function fitPx(x,t,s,mw,wt){x.font=(wt||800)+' '+s+'px '+FDN;while(x.measureText(t).width>mw&&s>40){s-=6;x.font=(wt||800)+' '+s+'px '+FDN}return s}
export function mkCanvas(w,h,bg){const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');x.fillStyle=bg;x.fillRect(0,0,w,h);x.textBaseline='alphabetic';return[c,x]}
async function loadPhoto(p){if(!p.photo)return null;try{const b=await photoBlob(p.photo);return b?await createImageBitmap(b):null}catch(e){return null}}
const priceOf=p=>{const a=advice(p);return isnum(p.pvise)&&p.pvise>0?p.pvise:a.ok?a.reco:(a.fallback||0)};
async function makeSocial(list,fmt,endTxt){await document.fonts.load('800 80px Archivo').catch(()=>{});const out=[],imgs=await Promise.all(list.map(loadPhoto)),n=list.length;
 if(fmt==='car'){const W=1080,H=1350;
  {const[c,x]=mkCanvas(W,H,'#111111');app.logoMark(x,80,80,120);x.fillStyle='#F1F2F4';fitPx(x,t('ARRIVAGE'),200,940);x.fillText(t('ARRIVAGE'),70,640);x.fillStyle='#FF4A1C';x.fillText(t('DU JOUR'),70,830);x.fillStyle='#C9CBD0';x.font='500 56px '+FDN;x.fillText(fd(today())+'  ·  '+tn(n,'pièce','pièces'),74,940);x.fillStyle='#8a8d94';x.font='500 40px '+FDN;x.fillText(t('Glisse pour voir les prix')+'  →',74,1240);out.push(c)}
  const pages=Math.ceil(n/4);
  for(let pg=0;pg<pages;pg++){const[c,x]=mkCanvas(W,H,'#F1F2F4');x.fillStyle='#111';x.font='800 54px '+FDN;x.fillText(t('ARRIVAGE'),50,86);x.fillStyle='#FF4A1C';x.fillText((pg+1)+'/'+pages,50+x.measureText(t('ARRIVAGE')).width+24,86);app.logoMark(x,W-130,36,70);
   for(let k=0;k<4;k++){const i=pg*4+k;if(i>=n)break;const p=list[i],cx=50+(k%2)*510,cy=130+Math.floor(k/2)*600,cw=470,ch=440;
    x.fillStyle='#E3E5EA';x.beginPath();x.roundRect?x.roundRect(cx,cy,cw,ch,28):x.rect(cx,cy,cw,ch);x.fill();coverDraw(x,imgs[i],cx,cy,cw,ch,28);
    const pr=priceOf(p),lab=pr?fmtP(pr):'';if(lab){x.font='800 54px '+FDN;const tw=x.measureText(lab).width+40;x.fillStyle='#FF4A1C';x.beginPath();x.roundRect?x.roundRect(cx+16,cy+ch-86,tw,70,35):x.rect(cx+16,cy+ch-86,tw,70);x.fill();x.fillStyle='#111';x.fillText(lab,cx+36,cy+ch-34)}
    x.fillStyle='#111';x.font='800 38px '+FDN;wrapTxt(x,[p.marque,tv(p.sub||p.cat)].filter(Boolean).join(' · '),cx+4,cy+ch+48,cw-8,42,1);x.fillStyle='#5a5e66';x.font='500 32px '+FDN;x.fillText([p.taille?t('Taille')+' '+p.taille:'',p.grade?t('Grade')+' '+p.grade:''].filter(Boolean).join('  ·  '),cx+4,cy+ch+92)}
   out.push(c)}
  {const[c,x]=mkCanvas(W,H,'#FF4A1C');app.logoMark(x,80,80,120);x.fillStyle='#111';x.font='800 130px '+FDN;wrapTxt(x,endTxt||t('Lots possibles : -10 % dès 2 pièces'),70,560,940,150,4);x.font='500 48px '+FDN;x.fillText(t('Écris-moi en message privé'),74,1180);out.push(c)}}
 else{const W=1080,H=1920;
  {const[c,x]=mkCanvas(W,H,'#111111');app.logoMark(x,80,100,120);x.fillStyle='#F1F2F4';fitPx(x,t('ARRIVAGE'),210,940);x.fillText(t('ARRIVAGE'),60,880);x.fillStyle='#FF4A1C';x.fillText(t('DU JOUR'),60,1080);x.fillStyle='#C9CBD0';x.font='500 60px '+FDN;x.fillText(fd(today())+'  ·  '+tn(n,'pièce','pièces'),66,1190);out.push(c)}
  for(let i=0;i<n;i++){const p=list[i],[c,x]=mkCanvas(W,H,'#111111');x.fillStyle='#2a2a2a';x.fillRect(0,0,W,1340);coverDraw(x,imgs[i],0,0,W,1340,0);
   const pr=priceOf(p),lab=pr?fmtP(pr):'';x.fillStyle='#FF4A1C';x.font='800 190px '+FDN;x.fillText(lab,60,1560);x.fillStyle='#F1F2F4';x.font='800 62px '+FDN;wrapTxt(x,[p.marque,tv(p.sub||p.cat)].filter(Boolean).join(' · '),60,1660,960,70,1);x.fillStyle='#C9CBD0';x.font='500 48px '+FDN;x.fillText([p.taille?t('Taille')+' '+p.taille:'',p.grade?t('Grade')+' '+p.grade:'',tv(p.genre)||''].filter(Boolean).join('  ·  '),62,1740);app.logoMark(x,W-170,1680,100);out.push(c)}
  {const[c,x]=mkCanvas(W,H,'#FF4A1C');app.logoMark(x,80,100,120);x.fillStyle='#111';x.font='800 150px '+FDN;wrapTxt(x,endTxt||t('Lots possibles : -10 % dès 2 pièces'),60,760,960,170,4);x.font='500 54px '+FDN;x.fillText(t('Écris-moi en message privé'),64,1500);out.push(c)}}
 return out}
function socialCandidates(src){let L;if(src==='today')L=app.P.filter(p=>avail(p)&&p.entree===today());else if(src==='topub')L=app.P.filter(unpub);else L=app.P.filter(avail).sort((a,b)=>(b.entree||'').localeCompare(a.entree||'')||(b.cree||0)-(a.cree||0));
 return[...L].sort((a,b)=>(b.photo?1:0)-(a.photo?1:0)||(b.cree||0)-(a.cree||0))}
function openSocial(){let src=LSg('socSrc','today'),fmt=LSg('socFmt','car'),end=LSg('socEnd',''),res=[];
 const draw=()=>{const L=socialCandidates(src),max=fmt==='car'?12:8,sel=L.slice(0,max);
  showSheet(sheetHead(t('Visuels réseaux'))+`<p class="sub">${t('Génère un carrousel ou des stories prêts pour TikTok et Instagram, à partir de tes photos et de tes prix.')}</p><div class="card"><span class="l">${t('Quelles pièces')}</span><div class="chips" id="so_s">${[['today','Ajoutées aujourd\'hui'],['topub','À publier'],['last','Derniers ajouts']].map(([k,l])=>`<button type="button" class="chip sm${src===k?' on':''}" data-ss="${k}">${t(l)}</button>`).join('')}</div>
  <span class="l" style="margin-top:12px">${t('Format')}</span><div class="chips" id="so_f">${[['car','Carrousel 4:5'],['story','Stories 9:16']].map(([k,l])=>`<button type="button" class="chip sm${fmt===k?' on':''}" data-sf="${k}">${t(l)}</button>`).join('')}</div>
  <div class="fld"><label class="l" for="so_e">${t('Texte de la dernière image')}</label><input type="text" id="so_e" value="${esc(end)}" placeholder="${esc(t('Lots possibles : -10 % dès 2 pièces'))}" autocomplete="off"></div>
  <div class="hint">${sel.length?t('{n} retenues (maximum {m}), celles avec photo d\'abord : {l}',{n:tn(sel.length,'pièce','pièces'),m:max,l:esc(sel.slice(0,3).map(p=>p.marque||tv(p.cat)).join(', '))+(sel.length>3?'…':'')}):t('Aucune pièce pour ce choix.')}</div>
  <div class="acts"><button type="button" class="btn mint" id="so_go"${sel.length?'':' disabled'}>${t('Générer les visuels')}</button></div></div><div id="so_r"></div>`);
  $('so_e').onchange=()=>{end=$('so_e').value.trim();LSs('socEnd',end)};
  $('shc').onclick=async e=>{const s=e.target.closest('[data-ss]'),f=e.target.closest('[data-sf]');if(s){src=s.dataset.ss;LSs('socSrc',src);draw();return}if(f){fmt=f.dataset.sf;LSs('socFmt',fmt);draw();return}
   if(e.target.closest('#so_go')){end=$('so_e').value.trim();LSs('socEnd',end);$('so_go').disabled=true;$('so_go').textContent=window.t('Création…');res=await makeSocial(sel,fmt,end);
    $('so_r').innerHTML=`<div class="card"><div class="socp">${res.map((c,i)=>`<canvas data-i="${i}"></canvas>`).join('')}</div><div class="acts"><button type="button" class="btn mint" id="so_sh">${window.t('Partager ou télécharger ({n})',{n:res.length})}</button><button type="button" class="btn sec" id="so_cp">${window.t('Copier la légende')}</button></div></div>`;
    res.forEach((c,i)=>{const v=$('so_r').querySelector('canvas[data-i="'+i+'"]');v.width=c.width;v.height=c.height;v.getContext('2d').drawImage(c,0,0)});$('so_go').disabled=false;$('so_go').textContent=window.t('Générer à nouveau');$('so_r').scrollIntoView({behavior:'smooth',block:'start'});return}
   if(e.target.closest('#so_sh')){const fs=[];for(let i=0;i<res.length;i++){const b=await new Promise(r=>res[i].toBlob(r,'image/png'));fs.push(new File([b],'max-'+(fmt==='car'?'carrousel':'story')+'-'+(i+1)+'.png',{type:'image/png'}))}await shareFiles(fs,window.t('Arrivage du {d}',{d:fd(today())}));return}
   if(e.target.closest('#so_cp')){const br=[...new Set(sel.map(p=>p.marque).filter(Boolean))].slice(0,4),pr=sel.map(priceOf).filter(v=>v>0);copyText(window.t('Arrivage du {d}',{d:fd(today())})+' : '+tn(sel.length,'pièce','pièces')+(pr.length?window.t(', à partir de {p}',{p:fmtP(Math.min(...pr))}):'')+'\n'+(end||window.t('Lots possibles : -10 % dès 2 pièces'))+'\n#vinted '+window.t('#secondemain')+' '+window.t('#friperie')+' #vintage '+br.map(b=>'#'+fold(b).replace(/ /g,'')).join(' '),window.t('Légende'))}}};draw()}
