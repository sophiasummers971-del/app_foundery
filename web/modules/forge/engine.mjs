// Creator Forge: local-only projects, milestones, editable chapters and explicit business handoffs.
export const STAGES=['idea','plan','build','validate','launch','operate'];
export const KINDS=['guide','app','digital-product','service','music','other'];
export const TEMPLATES=[
 {kind:'guide',label:'Guide / ebook',steps:['Identify the reader and problem','Outline chapters','Write a first draft','Review and verify content','Export and prepare publication'],chapters:['Who this is for','The problem','First steps','Examples','Common mistakes','Next steps']},
 {kind:'app',label:'App / digital tool',steps:['Define the user problem','Identify one useful feature','Make a working prototype','Test with users','Fix failures before launch'],chapters:[]},
 {kind:'digital-product',label:'Digital product',steps:['Identify a paying audience','Describe the offer','Build a useful first version','Test value and price','Prepare launch materials'],chapters:[]},
 {kind:'service',label:'Business / service',steps:['Define your customer','Check practical requirements','Calculate costs and time','Test the service','Plan operations'],chapters:[]},
 {kind:'music',label:'Music / creative release',steps:['Define the release','Confirm rights and credits','Prepare assets','Choose distribution','Plan promotion'],chapters:[]},
 {kind:'other',label:'Other idea',steps:['Clarify the idea','Find the people it helps','Make a small plan','Test a real result','Decide what comes next'],chapters:[]}
];
const obj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const sane=(x,n)=>typeof x==='string'&&x.trim().length>0&&x.length<=n;
const optional=(x,n)=>typeof x==='string'&&x.length<=n;
const validDate=x=>typeof x==='string'&&x.length<=50&&Number.isFinite(Date.parse(x));
const idOK=(x,prefix)=>typeof x==='string'&&new RegExp('^'+prefix+'-[a-zA-Z0-9-]{8,80}$').test(x);
export function newProject(input,id,now=new Date().toISOString()){
 const title=String(input.title||'').trim(),description=String(input.description||'').trim(),kind=input.kind;
 if(!idOK(id,'forge')||!sane(title,120)||!sane(description,2000)||!KINDS.includes(kind)||!validDate(now))throw Error('Give your idea a clear title, type and description');
 const template=TEMPLATES.find(t=>t.kind===kind);
 return {id,title,description,kind,audience:'',outcome:'',notes:'',stage:'idea',createdAt:now,updatedAt:now,handoffAt:null,tasks:template.steps.map((title,i)=>({id:'step-'+i,title,done:false})),chapters:template.chapters.map((title,i)=>({id:'chapter-'+i,title,content:''}))};
}
export function validateProject(p){
 if(!obj(p)||!idOK(p.id,'forge')||!sane(p.title,120)||!sane(p.description,2000)||!KINDS.includes(p.kind)||!STAGES.includes(p.stage)||!validDate(p.createdAt)||!validDate(p.updatedAt)||!optional(p.audience,250)||!optional(p.outcome,500)||!optional(p.notes,3000)||p.handoffAt!==null&&!validDate(p.handoffAt))throw Error('Invalid project');
 if(!Array.isArray(p.tasks)||p.tasks.length>60||!Array.isArray(p.chapters)||p.chapters.length>60)throw Error('Invalid sections');
 const tasks=p.tasks.map(t=>{if(!obj(t)||!/^step-[a-zA-Z0-9-]{1,80}$/.test(t.id)||!sane(t.title,180)||typeof t.done!=='boolean')throw Error('Invalid milestone');return {id:t.id,title:t.title,done:t.done}});
 const chapters=p.chapters.map(c=>{if(!obj(c)||!/^chapter-[a-zA-Z0-9-]{1,80}$/.test(c.id)||!sane(c.title,150)||!optional(c.content,12000))throw Error('Invalid chapter');return {id:c.id,title:c.title,content:c.content}});
 if(new Set(tasks.map(t=>t.id)).size!==tasks.length||new Set(chapters.map(c=>c.id)).size!==chapters.length)throw Error('Duplicate sections');
 return {id:p.id,title:p.title,description:p.description,kind:p.kind,audience:p.audience,outcome:p.outcome,notes:p.notes,stage:p.stage,createdAt:p.createdAt,updatedAt:p.updatedAt,handoffAt:p.handoffAt,tasks,chapters};
}
export function validateLibrary(raw){const list=typeof raw==='string'?JSON.parse(raw):raw;if(!Array.isArray(list)||list.length>100)throw Error('Invalid Creator Forge library');const out=list.map(validateProject);if(new Set(out.map(p=>p.id)).size!==out.length)throw Error('Duplicate project ID');return out}
export function patch(p,changes,at=new Date().toISOString()){return validateProject({...p,...changes,updatedAt:at})}
export function progress(p){return p.tasks.length?Math.round(100*p.tasks.filter(t=>t.done).length/p.tasks.length):0}
export function toggleTask(p,id){if(!p.tasks.some(x=>x.id===id))throw Error('Milestone not found');return patch(p,{tasks:p.tasks.map(t=>t.id===id?{...t,done:!t.done}:t)})}
export function addTask(p,title,id){if(!sane(title,180)||!/^step-[a-zA-Z0-9-]{8,80}$/.test(id)||p.tasks.length>=60)throw Error('Invalid new milestone');return patch(p,{tasks:[...p.tasks,{id,title:title.trim(),done:false}]})}
export function addChapter(p,title,id){if(!sane(title,150)||!/^chapter-[a-zA-Z0-9-]{8,80}$/.test(id)||p.chapters.length>=60)throw Error('Invalid new chapter');return patch(p,{chapters:[...p.chapters,{id,title:title.trim(),content:''}]})}
export function updateChapter(p,id,content){if(!optional(content,12000)||!p.chapters.some(c=>c.id===id))throw Error('Invalid chapter edit');return patch(p,{chapters:p.chapters.map(c=>c.id===id?{...c,content}:c)})}
export function exportMarkdown(p){const x=validateProject(p);return '# '+x.title+'\n\n'+x.description+'\n\n'+(x.outcome?'Outcome: '+x.outcome+'\n\n':'')+'## Milestones\n\n'+x.tasks.map(t=>'- ['+(t.done?'x':' ')+'] '+t.title).join('\n')+'\n\n'+(x.chapters.length?x.chapters.map(c=>'## '+c.title+'\n\n'+c.content).join('\n\n'):'## Working notes\n\n'+x.notes)+'\n'}
export function handoff(p,now=new Date().toISOString()){
 const source=validateProject(p);
 if(source.handoffAt!==null)throw Error('Already handed off to Charlie');
 return {project:patch(source,{handoffAt:now},now),venture:{id:'venture-'+source.id.slice(6),forgeId:source.id,title:source.title,kind:source.kind,stage:'preparation',createdAt:now,notes:'Creator Forge handoff only. No business registration, invoice or payment created.',checklist:['Define the product or offer','Calculate pricing and costs','Review business and tax requirements','Prepare admin when commercially appropriate'].map(title=>({title,done:false}))}};
}
export function validateVentures(raw){
 const arr=typeof raw==='string'?JSON.parse(raw):raw;if(!Array.isArray(arr)||arr.length>100)throw Error('Invalid business projects');
 const seen=new Set();return arr.map(v=>{if(!obj(v)||!idOK(v.id,'venture')||!idOK(v.forgeId,'forge')||!sane(v.title,120)||!KINDS.includes(v.kind)||v.stage!=='preparation'||!validDate(v.createdAt)||!optional(v.notes,700)||!Array.isArray(v.checklist)||v.checklist.length!==4||v.checklist.some(t=>!obj(t)||!sane(t.title,120)||typeof t.done!=='boolean')||seen.has(v.forgeId))throw Error('Invalid Charlie handoff');seen.add(v.forgeId);return structuredClone(v)})
}
