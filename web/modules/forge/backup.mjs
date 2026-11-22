// Versioned App Foundry full-workspace JSON backup. No cloud, encryption or automatic import.
import {validateAlphaBackup} from '../alpha/backup.mjs';
import {validateBravoImport} from '../bravo/backup.mjs';
import {validateCharlieImport} from '../charlie/backup.mjs';
import {validateLibrary,validateVentures} from './engine.mjs';
const goodObj=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
function profileOK(p){
 if(!goodObj(p)||typeof p.name!=='string'||p.name.length<1||p.name.length>60||!(p.avatar===null||typeof p.avatar==='string'&&p.avatar.length<240000&&/^data:image\/(png|jpeg|webp);base64,/.test(p.avatar)))throw Error('Invalid profile');
 return {name:p.name,avatar:p.avatar};
}
function settingsOK(s){
 if(!goodObj(s)||!['midnight','plum','light'].includes(s.theme)||!['comfortable','compact'].includes(s.density)||typeof s.reduceMotion!=='boolean')throw Error('Invalid appearance preferences');
 return {theme:s.theme,density:s.density,reduceMotion:s.reduceMotion};
}
export function validateWorkspaceSnapshot(input){
 const doc=typeof input==='string'?JSON.parse(input):input;
 if(!goodObj(doc)||doc.format!=='app-foundry-workspace-v1'||!goodObj(doc.data))throw Error('Not a supported App Foundry backup');
 const d=doc.data;
 const cleaned={
 alpha:validateAlphaBackup({format:'alpha-one-history-v1',receipts:d.alpha}),
 bravo:validateBravoImport({format:'bravo-paperless-v1',records:d.bravo}),
 charlie:validateCharlieImport({format:'charlie-done-v1',data:d.charlie}),
 forge:validateLibrary(d.forge),
 ventures:validateVentures(d.ventures),
 profile:profileOK(d.profile),settings:settingsOK(d.settings)
 };
 for(const v of cleaned.ventures){const project=cleaned.forge.find(p=>p.id===v.forgeId);if(!project||project.handoffAt===null)throw Error('Business handoff has no corresponding Creator Forge project')}
 return cleaned;
}
export function exportWorkspaceSnapshot(state){
 const data=validateWorkspaceSnapshot({format:'app-foundry-workspace-v1',data:state});
 return JSON.stringify({format:'app-foundry-workspace-v1',exportedAt:new Date().toISOString(),data},null,2);
}
