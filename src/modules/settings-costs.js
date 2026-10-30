import { app } from '../state.js';
import { $, esc, num } from './core.js';
import { GKEY, goalKinds } from './goals.js';
import { DEFAULTS } from './platforms.js';

/* ---------- objectif et coûts (écran Réglages) ---------- */
export function renderCfg(){const c=$('cfgc');if(!c||c.contains(document.activeElement))return;
 const f=(id,l,v)=>`<div><label class="l" for="${id}">${t(l)}</label><input type="text" inputmode="decimal" id="${id}" value="${esc(String(v).replace('.',app.DS))}"></div>`;
 c.innerHTML=`<h3>${t('Objectif et coûts')}</h3><p class="sub">${t('Servent à l\'objectif mensuel, au calcul de marge et aux frais préremplis. Synchronisés entre tes appareils.')}</p>
 <div class="fld"><span class="l">${t('Objectif à suivre')}</span><div class="chips">${[['net','Bénéfice net'],['ca','Chiffre d\'affaires'],['both','Les deux']].map(([k,l])=>`<button type="button" class="chip${app.cfg.goalMode===k?' on':''}" data-gm="${k}">${t(l)}</button>`).join('')}</div></div>
 <div class="row2 fld">${goalKinds().map(k=>f(k==='net'?'c_goal':'c_goalCA',k==='net'?'Bénéfice net par mois (€)':'Chiffre d\'affaires par mois (€)',app.cfg[GKEY[k].m]||'')).join('')}</div>
 <div class="row2 fld">${goalKinds().map(k=>f(k==='net'?'c_goalY':'c_goalYCA',k==='net'?'Bénéfice net par an (€)':'Chiffre d\'affaires par an (€)',app.cfg[GKEY[k].y]||'')).join('')}</div>
 <div class="hint">${t('Laisse un champ vide pour ne pas fixer d\'objectif.')}</div>
 <div class="row2 fld">${f('c_emb','Emballage par colis (€)',app.cfg.emb)}${f('c_port','Envoi à ta charge (€)',app.cfg.port)}</div>
 ${[1,2].map(i=>`<div class="fld"><span class="l">${t('Plateforme {n}',{n:i})}</span><div class="row2"><div><label class="l" for="c_pf${i}">${t('Nom')}</label><input type="text" id="c_pf${i}" value="${esc(app.cfg['pf'+i]||'')}" placeholder="${esc(DEFAULTS[i])}" maxlength="24" autocomplete="off"></div>${f(i===1?'c_comV':'c_comT','Commission (%)',i===1?app.cfg.comV:app.cfg.comT)}</div></div>`).join('')}
 <div class="row2 fld">${f('c_roi','ROI minimum pour le vert (%)',app.cfg.roi)}${f('c_minM','Marge minimum pour le vert (€)',app.cfg.minM)}</div>
 <div class="hint">${t('Donne à tes deux plateformes de vente le nom que tu veux. Renseigne la commission que chacune te prélève (0 si aucune) : elle sert à préremplir les frais de tes ventes.')}</div>`}
$('cfgc').addEventListener('click',e=>{const b=e.target.closest('[data-gm]');if(!b)return;app.setCfg({goalMode:b.dataset.gm});document.activeElement.blur();renderCfg();app.renderAll()});
$('cfgc').addEventListener('change',e=>{if(e.target.id==='c_pf1'||e.target.id==='c_pf2'){app.setCfg({[e.target.id.slice(2)]:e.target.value.trim().slice(0,24)});app.toast(t('Réglage enregistré'));app.renderAll();return}const map={c_goal:'goal',c_goalCA:'goalCA',c_goalY:'goalY',c_goalYCA:'goalYCA',c_emb:'emb',c_port:'port',c_comV:'comV',c_comT:'comT',c_roi:'roi',c_minM:'minM'},k=map[e.target.id];if(!k)return;const v=num(e.target.value);app.setCfg({[k]:isNaN(v)||v<0?0:v});app.toast(t('Réglage enregistré'));app.renderAll()});
