import test from 'node:test';import assert from 'node:assert/strict';
import {newProject,handoff} from '../web/modules/forge/engine.mjs';
import {exportWorkspaceSnapshot,validateWorkspaceSnapshot} from '../web/modules/forge/backup.mjs';
const make=()=>{
 const project=newProject({title:'New freelance service',kind:'service',description:'Practical work for clients'},'forge-a1111111-1111-4111-8111-111111111111','2026-11-20T20:00:00Z');
 const linked=handoff(project,'2026-11-20T21:00:00Z');
 return {alpha:[],bravo:[],charlie:{invoices:[],expenses:[],drafts:[]},forge:[linked.project],ventures:[linked.venture],profile:{name:'Test user',avatar:null},settings:{theme:'plum',density:'comfortable',reduceMotion:false}};
};
test('full workspace backup roundtrip preserves linked Creator Forge and Charlie project',()=>{
 const s=make(),raw=exportWorkspaceSnapshot(s),parsed=validateWorkspaceSnapshot(raw);
 assert.deepEqual(parsed,s);assert.equal(parsed.ventures[0].forgeId,parsed.forge[0].id);
});
test('full import fails when business record is orphaned, corrupt or from wrong format',()=>{
 const s=make();assert.throws(()=>validateWorkspaceSnapshot({format:'wrong',data:s}));
 assert.throws(()=>validateWorkspaceSnapshot({format:'app-foundry-workspace-v1',data:{...s,forge:[]}}),/no corresponding/);
 assert.throws(()=>validateWorkspaceSnapshot('{broken'));
});
test('full import rejects data types without creating accounts or financial records',()=>{
 const s=make();assert.throws(()=>validateWorkspaceSnapshot({format:'app-foundry-workspace-v1',data:{...s,profile:{name:'user',avatar:'<script>'}}}));
 assert.throws(()=>validateWorkspaceSnapshot({format:'app-foundry-workspace-v1',data:{...s,charlie:{invoices:[{pence:1.5}],expenses:[],drafts:[]}}}));
});
