import { app } from '../state.js';
import { $, age, avail, eurR, nextId, ok, today } from './core.js';
import { genCode, mkForm } from './form.js';

/* ---------- vue Ajouter ---------- */
/* Le formulaire démarre toujours vide : aucune valeur n'est présélectionnée (seule la date d'entrée vaut aujourd'hui) */
function freshState(){return{entree:today()}}
export function initAdd(){
 app.addForm=mkForm($('fadd'),freshState(),{mode:'add',onCancel(){
  const snap=Object.assign({},app.addForm.state);
  app.addForm.reset(freshState());
  app.toast(t('Saisie effacée'),()=>app.addForm.reset(snap));
  window.scrollTo({top:0,behavior:'smooth'});
 },onSubmit(S,dup){
  const p=Object.assign({},S,{id:nextId(),statut:'Disponible',cree:Date.now()});if(!p.entree)p.entree=today();
  p.code=genCode(p);if(p.collab==='')delete p.collab;
  const sv=app.save(p);
  app.toast(t('Ajouté ✓ · {n} en stock',{n:app.P.filter(avail).length}),()=>{app.remove(sv.id);app.toast(t('Annulé'))});
  app.addForm.reset(dup?Object.assign({},S,{photo:'',id:undefined,code:undefined}):freshState(S));
  window.scrollTo({top:0,behavior:'smooth'});
 }});
}
