import { app } from '../state.js';
import { $ } from './core.js';

app.openTool = openTool;

/* ---------- outils : coach du lundi, simulateur de ballot, négociation, QR et bacs, commande vocale ---------- */
export const sheetHead=h=>`<div class="sh"><h2>${h}</h2><button type="button" class="x" data-x="1" aria-label="${t('Fermer')}">×</button></div>`;
export function showSheet(html){$('shc').onclick=null;$('shc').onchange=null;$('sheet').hidden=false;$('shc').innerHTML=html;$('sheet').firstElementChild.scrollTop=0}
export const TI=p=>`<svg viewBox="0 0 24 24" aria-hidden="true">${p}</svg>`;
export const TOOLS=[
 {k:'coach',t:'Coach du lundi',d:'Ton plan de la semaine en 30 secondes',i:TI('<path d="M4 19V9M10 19V5M16 19v-7M22 19H2"/><path d="m4 6 5-3 5 4 6-4"/>')},
 {k:'ballot',t:'Simulateur de ballot',d:'Chiffre d\'affaires probable, délai pour couvrir ton achat, risque de perte',i:TI('<rect x="4" y="9" width="16" height="11" rx="2"/><path d="M8 9V6a4 4 0 0 1 8 0v3"/>')},
 {k:'nego',t:'Négociation',d:'Colle le message d\'un acheteur, obtiens une réponse selon ton prix plancher',i:TI('<path d="M4 5h16v11H9l-5 4z"/>')},
 {k:'qr',t:'Étiquettes QR et bacs',d:'Imprime des étiquettes, range dans un bac, retrouve vite',i:TI('<path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h3v3h-3zM19 17v3h-3"/>')},
 {k:'trophees',t:'Trophées et séries',d:'Série de publication, badges, record de CA mensuel',i:TI('<path d="M7 4h10v5a5 5 0 0 1-10 0zM7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3M12 14v4M8 20h8"/>')},
 {k:'fisc',t:'Ligne fiscale',d:'Plafond micro-entrepreneur, alerte et déclaration URSSAF',i:TI('<path d="M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h5"/>')},
 {k:'complete',t:'Compléter les fiches',d:'Fiches sans grade, état ou code, 10 à la suite',i:TI('<path d="M5 12l4.5 4.5L19 7"/>')},
 {k:'merge',t:'Nettoyer les doublons',d:'Fusionne Aucun et Aucune, Brooks Brother et Brooks Brothers',i:TI('<path d="M6 4v5a4 4 0 0 0 4 4h4a4 4 0 0 1 4 4v3M6 20v-3M18 4v5"/>')},
 {k:'photos',t:'Photos et poids',d:'Compresse les photos pour alléger la sauvegarde JSON',i:TI('<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2"/><path d="m21 16-5-5-8 8"/>')},
 {k:'depenses',t:'Dépenses',d:'Carburant, matériel, cintres, abonnements, avec photo du ticket',i:TI('<path d="M5 4h14v17l-3-2-2 2-2-2-2 2-2-2-3 2zM9 9h6M9 13h6"/>')},
 {k:'treso',t:'Trésorerie',d:'Argent disponible prévu et date pour racheter un ballot',i:TI('<path d="M4 18V6M4 18h16M7 15l4-4 3 3 5-6"/>')},
 {k:'rapport',t:'Bilan mensuel PDF',d:'Un rapport propre pour un comptable, un associé ou une banque',i:TI('<path d="M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h4"/>')},
 {k:'trash',t:'Corbeille',d:'Récupère une pièce supprimée par erreur (30 jours)',i:TI('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>')},
 {k:'visuels',t:'Visuels réseaux',d:'Carrousel d\'arrivage et stories avec prix, prêts pour TikTok et Instagram',i:TI('<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>')},
 {k:'wrapped',t:'Wrapped',d:'Ton récap du mois ou de l\'année, à partager en story',i:TI('<path d="M12 3l2.5 5.5 6 .7-4.5 4 1.3 6L12 16.3 6.7 19.2 8 13.2 3.5 9.2l6-.7z"/>')},
 {k:'calcom',t:'Calendrier commercial',d:'Black Friday, Noël, soldes, rentrée : prépare tes promos à l\'avance',i:TI('<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>')},
 {k:'rappels',t:'Rappels et notifications',d:'Colis à déposer, live prévu, temps forts',i:TI('<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 20a2 2 0 0 0 4 0"/>')},
 {k:'defis',t:'Défis du mois',d:'Publie 100 pièces en novembre, et suis ta progression',i:TI('<path d="M5 21V4M5 4h12l-2 4 2 4H5"/>')},
 {k:'importo',t:'Importer des pièces',d:'Excel, CSV d\'une autre appli, export de tes données Vinted',i:TI('<path d="M12 4v11M8 11l4 4 4-4M5 20h14"/>')},
 {k:'aide',t:'Centre d\'aide',d:'Réponses, nouveautés et idées',i:TI('<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 1-1 1.7M12 17h.01"/>')},
 {k:'help',t:'Raccourcis',d:'Clavier sur ordinateur, glisser sur téléphone',i:TI('<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 10h.01M11 10h.01M15 10h.01M7 14h10"/>')},
 {k:'scan',t:'Scanner un QR',d:'Ouvre la fiche et dit dans quel bac se trouve la pièce',i:TI('<path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M4 12h16"/>')}];
/* Le mode simple (simple-mode.js) fournit app.toolsView : outils à montrer, plus l'en-tête et le pied de la liste */
export function openTools(){const v=app.toolsView?app.toolsView():{list:TOOLS,head:'',foot:''};showSheet(sheetHead(t('Outils'))+v.head+`<div class="tools">${v.list.map(x=>`<button type="button" class="tool" data-tool="${x.k}"><span class="tic">${x.i}</span><span class="tx"><b>${t(x.t)}</b><small>${t(x.d)}</small></span></button>`).join('')}</div>`+v.foot)}
function openTool(k){({coach:app.openCoach,ballot:app.openBallot,nego:app.openNego,qr:app.openQrTool,scan:app.openScanner,trophees:app.openTrophees,fisc:app.openFisc,complete:app.openComplete,merge:app.openMerge,help:app.openHelp,photos:app.openPhotos,visuels:app.openSocial,wrapped:app.openWrapped,calcom:app.openCalcom,rappels:app.openRappels,defis:app.openDefis,importo:app.openImportTool,news:app.openNews,aide:app.openAide,idee:app.openIdee,depenses:app.openDepenses,treso:app.openTreso,rapport:app.openReport,trash:app.openTrash})[k]()}
document.addEventListener('click',e=>{const b=e.target.closest('[data-tool]');if(b){e.preventDefault();app.openTool(b.dataset.tool)}});
$('tl').onclick=openTools;
