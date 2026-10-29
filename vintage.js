/* Repères de datation vintage. Ce sont des indices courants chez les revendeurs, pas des preuves : une étiquette peut être
   recousue, une marque a plusieurs usines, un modèle a été réédité. Recoupe toujours plusieurs indices avant d'écrire une date. */
window.VINTAGE={
 general:[
  {t:'Pays « Made in »',l:['Made in West Germany, Yugoslavia, Czechoslovakia, USSR : avant 1990-1992 (ces pays n\'existent plus).','Made in USA, UK, France, Italy, Japan : fréquent avant 2000, surtout pour les vestes, les jeans et le sportswear.','Made in Hong Kong, Taiwan, Corée du Sud : très présent dans les années 80 et 90.','Made in China, Vietnam, Bangladesh, Cambodge : surtout après 2000.']},
  {t:'Étiquette d\'entretien',l:['Texte en une seule langue (souvent anglais ou français) : plutôt avant 1995.','Pictogrammes de lavage : à partir de la fin des années 70 en Europe.','Étiquette en satin ou en tissu rêche, cousue sur les quatre côtés : plutôt années 70 à 90.','Numéro RN (USA) : existe depuis 1959. Un numéro RN renvoie à un fabricant, tu peux le chercher dans la base de la FTC.','Plusieurs langues et code-barres sur l\'étiquette : plutôt après 2000.']},
  {t:'Coutures et finitions',l:['Ourlet à point simple (une seule ligne de couture) sur un t-shirt : plutôt avant 1995.','Coutures « chain stitch » apparentes sur les jeans : plutôt anciens.','Boutons en métal gravé, bien lourds : plutôt anciens.']},
  {t:'Fermetures éclair',l:['Talon, Scovill, Conmar, Crown : plutôt avant les années 80.','Zip en métal marqué YKK : l\'apparence du logo change selon les époques, compare avec des photos datées.','Zip en plastique moulé : plutôt à partir des années 70-80.']},
  {t:'Ce qui fait monter le prix',l:['Étiquette ancienne et lisible, photographiée de près.','Pays de fabrication d\'époque (USA, UK, France, Italie, Japon) cité dans l\'annonce.','Modèle ou coloris recherché, taille portable aujourd\'hui, bon état.','Écris les indices dans l\'annonce : un acheteur qui voit la preuve accepte mieux un prix plus élevé.']}],
 marques:[
 {n:'Levi\'s',a:['levis','levi','levi strauss'],r:[
  {t:'Étiquette rouge (tab)',l:['« LEVI\'S » écrit avec un grand E majuscule (Big E) : avant 1971.','« levi\'s » avec un petit e : après 1971.']},
  {t:'Fabrication',l:['Made in USA, étiquette interne avec numéro de modèle (501, 505, 517) : surtout avant 2003, quand les usines américaines ferment.','Bords lisières rouges (selvedge, « redline ») visibles en retournant l\'ourlet : jeans plus anciens et recherchés.','Bouton gravé avec un numéro à l\'intérieur : indique l\'usine, utile pour confirmer l\'origine.','Mexique, Hongrie, Turquie, Chine : productions plus récentes.']},
  {t:'Indices utiles',l:['Étiquette de taille avec W et L en pouces : jeans classiques.','Coutures « single stitch » sur les poches : plus ancien.','Les vestes trucker portent un type 1, 2 ou 3 (3 à partir de la fin des années 60) : cherche le « Type » pour justifier le prix.']}]},
 {n:'Nike',a:['nike'],r:[
  {t:'Logos et étiquettes',l:['Étiquette blanche avec « NIKE » en lettres capitales et un swoosh : plutôt années 80.','Étiquette grise ou « silver tag » : années 90, souvent sur les polaires et les vestes.','Swoosh brodé avec « Nike » écrit dessus ou dessous : variantes selon les époques, compare avec des photos datées.','« Made in USA » : plutôt avant 1990.']},
  {t:'Fabrication',l:['Made in Korea, Taiwan, Thaïlande : fréquent années 80-90.','Made in Indonesia, Vietnam, Chine : plutôt années 90 et après.']}]},
 {n:'Adidas',a:['adidas'],r:[
  {t:'Logos',l:['Trèfle (trefoil) : années 70 à 90, puis logo de la ligne Originals.','Logo « Equipment » avec trois bandes sur fond : début des années 90.','Logo « Performance » (trois bandes en pente) : à partir de 1991.']},
  {t:'Fabrication',l:['Made in West Germany : avant 1990.','Made in France : années 70-80, notamment pour les survêtements.','Made in Yugoslavia ou Taiwan : années 80.','Étiquette « Ventex » ou « Adidas Ventex » : années 70-80.']}]},
 {n:'Lacoste',a:['lacoste','izod lacoste','chemise lacoste'],r:[
  {t:'Étiquettes',l:['« Chemise Lacoste » avec crocodile brodé : années 70, très recherché.','« Izod Lacoste » : version américaine, années 70 jusqu\'à 1993.','« Lacoste » avec un chiffre de taille (3, 4, 5…) : commun, sans date précise ; la taille n\'est pas la taille S/M/L.','Étiquette « Devanlay » : fabricant sous licence en France, années 70 à 2005.']},
  {t:'Fabrication',l:['Made in France : plutôt avant 2005.','Made in Tunisia, Pérou, Madagascar, Maurice : plus récent.','Crocodile cousu (tissé) plus épais : plutôt ancien, la broderie plus fine est plus récente.']}]},
 {n:'Ralph Lauren / Polo',a:['ralph lauren','polo ralph lauren','polo','polo sport','chaps'],r:[
  {t:'Lignes',l:['« Polo Country » : années 80, recherché.','« Polo Sport » : années 90.','« Chaps » : ligne plus accessible, valeur moindre.','« Polo Jeans Co. » : années 90.']},
  {t:'Fabrication',l:['Made in USA : plutôt années 80-90.','Made in Hong Kong, Chine : années 90 et après.']}]},
 {n:'Tommy Hilfiger',a:['tommy hilfiger','tommy'],r:[
  {t:'Époques',l:['La marque naît en 1985 ; avant cette date, rien ne peut venir de Tommy Hilfiger.','Drapeaux rouge, blanc, bleu très gros sur la poitrine : années 90, très recherché.','Logo « Tommy Hilfiger » en lettres brodées : années 90 et 2000.','Logo drapeau carré plus petit : à partir des années 2000.']}]},
 {n:'Carhartt',a:['carhartt','carhartt wip'],r:[
  {t:'Étiquettes',l:['« Carhartt » sans « WIP » : lignes de vêtements de travail.','« Carhartt WIP » : ligne urbaine lancée en 1989.','Étiquette « Made in USA » avec « Union Made » : très ancien, recherché.','Doublure en flanelle ou en couverture : modèles de travail plus anciens.']}]},
 {n:'Champion',a:['champion'],r:[
  {t:'Étiquettes',l:['Étiquette « Reverse Weave » avec un « C » : modèle d\'origine, recherché.','Étiquette bleue avec « C » rouge/bleu : années 80-90.','Logo « Champion » avec un petit « C » à droite : années 90.','« Made in USA » : plutôt avant 2000.']}]},
 {n:'Stüssy',a:['stussy','stüssy'],r:[
  {t:'Époques',l:['Étiquette noire avec « Stüssy » en signature : années 80 à 90.','Made in USA : plus ancien et plus recherché que les productions récentes.','« International Stüssy Tribe » : période milieu des années 90.']}]},
 {n:'The North Face',a:['the north face','north face','tnf'],r:[
  {t:'Étiquettes et modèles',l:['Étiquette brune « Brown Label » : années 80-90, souvent Made in USA.','Nuptse, Denali, Baltoro : modèles recherchés.','Logo brodé « The North Face » avec le demi-dôme : variantes selon les années.']}]},
 {n:'Patagonia',a:['patagonia'],r:[
  {t:'Époques',l:['Made in USA : plutôt avant 2000.','Étiquette « Synchilla » : polaire des années 80-90, très recherchée.','Étiquette « Patagonia Inc. » avec numéro de série : plus ancien.']}]},
 {n:'Burberry',a:['burberry','burberrys'],r:[
  {t:'Étiquettes',l:['« Burberrys of London » (avec un s) : avant 1999.','« Burberry London » : à partir de la fin des années 90.','Doublure en tartan Nova Check : repère classique.','Made in England : plutôt avant les années 2000.']}]},
 {n:'Barbour',a:['barbour'],r:[
  {t:'Étiquettes',l:['Étiquette avec « By Appointment » aux armoiries royales : le nombre de mentions de la famille royale indique les époques.','Made in England ou Great Britain : la majorité des modèles recherchés.','Doublure tartan : modèles classiques.']}]},
 {n:'Reebok',a:['reebok'],r:[
  {t:'Logos',l:['Drapeau britannique : années 80-90.','Logo « vector » en triangle : à partir de 1992.','Étiquette « Reebok Classic » : années 90.']}]},
 {n:'Diesel',a:['diesel'],r:[
  {t:'Époques',l:['« Diesel Industry » : jeans années 90.','Made in Italy : plutôt années 90 et début des années 2000.','Boutons de braguette gravés : plus anciens.']}]},
 {n:'Kappa',a:['kappa','robe di kappa'],r:[
  {t:'Logos',l:['Logo « Omini » (deux silhouettes dos à dos) : années 70 à 2000.','« Robe di Kappa » : étiquette plus ancienne.','Made in Italy : plutôt avant 2000.']}]},
 {n:'Puma',a:['puma'],r:[
  {t:'Époques',l:['Made in West Germany : avant 1990.','Logo puma bondissant avec « PUMA » sous le félin : étiquette ancienne.','Made in Yugoslavia : années 70-80.']}]}
 ]};
