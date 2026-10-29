import { app } from '../state.js';
import { TI, TOOLS } from './tools-index.js';
import { CHANGELOG, FAQ } from './help-news.js';
import { openBuyers } from './buyers.js';
import { openCohortes, openCourbe, openLives, openSeuil, openTranches } from './analytics.js';
import { openFourn, openPlanning } from './supplies-planning.js';
import { openVintage } from './vintage.js';
import { openBoutique } from './branding.js';
import { openConfort } from './comfort.js';

/* ---------- outils, nouveautés, aide ---------- */
TOOLS.push(
 {k:'planning',t:'Planning',d:'Photos, sourcing, lives, dépôts de colis, et ta liste du jour',i:TI('<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4M8 14h3"/>')},
 {k:'vintage',t:'Datation vintage',d:'Étiquettes, logos et made in par marque, pour justifier un prix plus élevé',i:TI('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>')},
 {k:'buyers',t:'Acheteurs',d:'Historique par pseudo, acheteurs fidèles, liste noire',i:TI('<circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0M16 11a3 3 0 1 0-1-5.800M18 20a5 5 0 0 0-3-4.500"/>')},
 {k:'lives',t:'Bilan des lives',d:'CA, ventes par heure, meilleures pièces, comparaison avec les lives précédents',i:TI('<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>')},
 {k:'cohortes',t:'Qualité de tes achats',d:'Sur les pièces entrées un mois donné, combien sont vendues à 30, 60 et 90 jours',i:TI('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>')},
 {k:'tranches',t:'Rentabilité par prix d\'achat',d:'Les pièces à 2 € rapportent-elles plus que celles à 8 € ?',i:TI('<path d="M4 18V6M4 18h16M7 15l4-4 3 3 5-6"/>')},
 {k:'courbe',t:'Bénéfice cumulé et objectif',d:'Chaque jour, en avance ou en retard sur ton objectif du mois',i:TI('<path d="M3 17l5-5 4 3 8-9"/><path d="M3 20h18"/>')},
 {k:'seuil',t:'Seuil de rentabilité',d:'À partir de combien de ventes tu couvres tes frais fixes',i:TI('<path d="M4 20h16M6 20V10M12 20V4M18 20v-7"/>')},
 {k:'fourn',t:'Fournitures',d:'Sachets, cartons, scotch : stock, alerte et coût réel du colis',i:TI('<path d="M3 8l9-5 9 5-9 5zM3 8v8l9 5 9-5V8"/>')},
 {k:'boutique',t:'Ma boutique',d:'Ton logo, ton nom et ta couleur sur les PDF et les visuels',i:TI('<path d="M4 9l1-5h14l1 5M4 9v11h16V9M4 9h16M9 20v-6h6v6"/>')},
 {k:'confort',t:'Confort',d:'Vibrations légères et mode une main',i:TI('<path d="M8 13V5a2 2 0 0 1 4 0v6M12 11V4a2 2 0 0 1 4 0v8M16 12V7a2 2 0 0 1 4 0v8a7 7 0 0 1-7 7h-1a7 7 0 0 1-6-3.500L3 14a2 2 0 0 1 3-2l2 2"/>')});
const openTool24=app.openTool;app.openTool=function(k){const m={planning:openPlanning,vintage:()=>openVintage(),buyers:openBuyers,lives:openLives,cohortes:openCohortes,tranches:openTranches,courbe:openCourbe,seuil:openSeuil,fourn:()=>openFourn(),boutique:openBoutique,confort:openConfort};if(m[k])return m[k]();return openTool24(k)};
CHANGELOG.unshift({v:'v24',d:'2026-10-30',t:['Sélection multiple : baisse de prix, publication, ballot, bac, étiquettes et lots en un geste (appui long sur une pièce)','Vente groupée : un paiement, un colis, prix et frais répartis entre les pièces','Variantes : même modèle, autre taille ou couleur','Pièces similaires déjà vendues dans chaque fiche','Acheteurs fidèles et liste noire','Bilan des lives, qualité des achats par mois, rentabilité par prix d\'achat','Bénéfice cumulé comparé à l\'objectif, seuil de rentabilité','Fournitures avec alerte, planning de la semaine et liste du jour','Datation vintage par marque','Bilan personnalisable, mode une main, vibrations, logo et couleur de ta boutique']});
FAQ.push(['Vendre plusieurs pièces dans un seul colis','Touche longuement une pièce (ou le bouton Sélection), choisis les autres pièces, puis Actions, Créer un lot, Vendre ensemble. Entre le prix total payé et les frais du colis : Max les répartit entre les pièces pour que chaque marge reste juste.'],
 ['Modifier plusieurs pièces d\'un coup','Bouton Sélection dans le Stock (ou appui long sur une pièce). Touche les pièces ou Tout pour le filtre en cours, puis Actions : baisser le prix, marquer publiées, changer de ballot ou de bac, imprimer les étiquettes.'],
 ['Personnaliser le bilan','Dans le Bilan, bouton Personnaliser : masque les cartes inutiles et change leur ordre. Les nouvelles cartes (courbe de l\'objectif, seuil de rentabilité, qualité des achats, dernier live) y sont masquées au départ.'],
 ['Dater une pièce vintage','Outils, Datation vintage, ou le bouton Repères vintage dans la fiche d\'une pièce de marque connue. Coche les indices vérifiés pour obtenir une phrase à coller dans l\'annonce.'],
 ['Mettre mon logo sur les PDF','Outils, Ma boutique : nom, couleur et logo remplacent ceux de Max sur les PDF, les visuels et le Wrapped.']);
