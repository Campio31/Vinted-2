import { app } from '../state.js';
import { LSg, LSs } from './core.js';

app.setCfg = setCfg;

/* ---------- réglages (synchronisés entre appareils, sauf les clés propres à l'appareil) ---------- */
export const CFG0={goal:0,goalCA:0,goalY:0,goalYCA:0,goalMode:'net',lang:'',emb:0.42,port:0,comV:0,comT:0,roi:100,minM:3,auto:false,lastAuto:'',remember:true,plafond:203100,plafondTva:91900,tauxSoc:12.3,periode:'M',fiscDeclared:{},alias:{},cash:null,cashDate:'',ballotBudget:0,depotH:'18:00',liveAt:'',notifOn:false,defis:[]};
export const DEVICE_KEYS=['lastAuto','remember','lang'];
app.cfg = Object.assign({},CFG0,LSg('cfg',{}));
export const syncCfg=()=>{const o={};Object.keys(app.cfg).forEach(k=>{if(!DEVICE_KEYS.includes(k))o[k]=app.cfg[k]});return o};
function setCfg(patch,local){app.cfg=Object.assign({},app.cfg,patch);LSs('cfg',app.cfg);if(!local&&app.cloud)app.queue('put','__settings')}
export function applyCfg(d){if(!d||typeof d!=='object')return;const o={};Object.keys(CFG0).forEach(k=>{if(!DEVICE_KEYS.includes(k)&&d[k]!==undefined)o[k]=d[k]});app.cfg=Object.assign({},app.cfg,o);LSs('cfg',app.cfg);app.scheduleRender()}
export const fN=v=>String(Math.round(v*100)/100).replace('.',app.DS);
app.fN = fN;
export const defFrais=(prix,canal)=>{const pct=canal==='TikTok Live'?app.cfg.comT:canal==='Vinted'?app.cfg.comV:0;return Math.round(((app.cfg.emb||0)+(app.cfg.port||0)+prix*(pct||0)/100)*100)/100};
app.defFrais = defFrais;
