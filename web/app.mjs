import * as A from './modules/alpha/engine.mjs';
import {alphaBackup,validateAlphaBackup} from './modules/alpha/backup.mjs';
import * as B from './modules/bravo/engine.mjs';
import {validateBravoImport} from './modules/bravo/backup.mjs';
import * as C from './modules/charlie/engine.mjs';
import {validateCharlieImport} from './modules/charlie/backup.mjs';
import * as F from './modules/forge/engine.mjs';
import {exportWorkspaceSnapshot,validateWorkspaceSnapshot} from './modules/forge/backup.mjs';
const $=id=>document.getElementById(id);
const el=(tag,text,klass)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(klass)n.className=klass;return n};
const K={alpha:'foundry-unified-alpha-v1',bravo:'foundry-unified-bravo-v1',charlie:'foundry-unified-charlie-v1',profile:'foundry-unified-profile-v1',settings:'foundry-unified-settings-v1',forge:'foundry-unified-forge-v1',ventures:'foundry-unified-ventures-v1'};
const defaults={alpha:[],bravo:[],charlie:{invoices:[],expenses:[],drafts:[]},profile:{name:'Your space',avatar:null},settings:{theme:'midnight',density:'comfortable',reduceMotion:false},forge:[],ventures:[]};
const state={...structuredClone(defaults),blocked:new Set(),page:'home',alphaChoice:'tasks',pending:null,selectedDraft:null,selectedForge:null,selectedChapter:null};
function toast(value){const t=$('toast');t.textContent=String(value);t.hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.hidden=true,4700)}
function load(key,validate,fallback){const raw=localStorage.getItem(K[key]);if(raw===null)return structuredClone(fallback);try{return validate(raw)}catch{state.blocked.add(key);toast(key+' saved data is unreadable. Writing is blocked until you import a valid backup.');return structuredClone(fallback)}}
function initialize(){
 state.alpha=load('alpha',r=>validateAlphaBackup({format:'alpha-one-history-v1',receipts:JSON.parse(r)}),[]);
 state.bravo=load('bravo',r=>validateBravoImport({format:'bravo-paperless-v1',records:B.parseStore(r)}),[]);
 state.charlie=load('charlie',r=>validateCharlieImport({format:'charlie-done-v1',data:C.parseStore(r)}),defaults.charlie);
 state.forge=load('forge',r=>F.validateLibrary(r),[]);
 state.ventures=load('ventures',r=>F.validateVentures(r),[]);
 try{const p=JSON.parse(localStorage.getItem(K.profile)||'null');if(p&&typeof p.name==='string'&&p.name.length<=60&&(!p.avatar||(typeof p.avatar==='string'&&p.avatar.length<240000&&/^data:image\/(png|jpeg|webp);base64,/.test(p.avatar))))state.profile=p}catch{}
 try{const s=JSON.parse(localStorage.getItem(K.settings)||'null');if(s&&['midnight','plum','light'].includes(s.theme)&&['comfortable','compact'].includes(s.density)&&typeof s.reduceMotion==='boolean')state.settings=s}catch{}
 applySettings();drawProfile();drawAll();route();window.addEventListener('hashchange',route);$('clock').textContent=new Intl.DateTimeFormat('en-GB',{dateStyle:'medium'}).format(new Date());
}
function persist(key,value){if(state.blocked.has(key))throw Error('Saved '+key+' data is unreadable. Import a valid backup before saving.');localStorage.setItem(K[key],JSON.stringify(value));state[key]=value;drawAll()}
function download(name,data,type='application/json'){const url=URL.createObjectURL(new Blob([data],{type}));const a=el('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000)}
const go=name=>{location.hash=name};
function route(){
 const valid=['home','forge','alpha','bravo','charlie','activity','profile','settings','help'];const next=location.hash.slice(1);state.page=valid.includes(next)?next:'home';
 for(const view of document.querySelectorAll('[data-view]'))view.hidden=view.dataset.view!==state.page;
 for(const link of document.querySelectorAll('[data-page]')){if(link.dataset.page===state.page)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current')}
 $('breadcrumb').textContent='Workspace / '+state.page.charAt(0).toUpperCase()+state.page.slice(1);
 document.body.classList.remove('nav-open');$('menu').setAttribute('aria-expanded','false');
 if(state.page==='activity')drawActivity();if(state.page==='settings')fillSettings();if(state.page==='profile')drawProfile();window.scrollTo(0,0);
}
function applySettings(){document.documentElement.dataset.theme=state.settings.theme;document.body.classList.toggle('compact',state.settings.density==='compact');document.body.classList.toggle('reduced-motion',state.settings.reduceMotion)}
function avatar(id){const n=$(id);n.replaceChildren();if(state.profile.avatar){const image=el('img');image.src=state.profile.avatar;image.alt='';n.append(image)}else n.textContent=state.profile.name.trim().slice(0,1).toUpperCase()||'U'}
function drawProfile(){avatar('top-avatar');avatar('profile-avatar');$('top-name').textContent=state.profile.name;$('profile-name-view').textContent=state.profile.name;$('profile-name').value=state.profile.name==='Your space'?'':state.profile.name}
function metric(number,label){const n=el('div',undefined,'metric');n.append(el('strong',String(number)),el('span',label));return n}
function item(title,detail,button,handler){
 const row=el('div',undefined,'listrow'),left=el('div');left.append(el('strong',title),el('small',detail));row.append(left);
 if(button){const b=el('button',button);b.type='button';b.addEventListener('click',handler);row.append(b)}return row
}
function fillList(node,rows,empty){node.replaceChildren();if(!rows.length)node.append(el('p',empty,'muted'));else for(const row of rows)node.append(row)}
function drawAll(){drawHome();drawForge();drawBravo();drawCharlie();drawVentures();drawActivity()}
function drawHome(){
 const cards=$('home-stats');cards.replaceChildren();for(const [n,label] of [[state.forge.length,'Ideas and projects'],[state.alpha.length,'Actions saved'],[state.bravo.length,'Documents tracked'],[state.charlie.invoices.length,'Invoices recorded']]){
 const box=el('div',undefined,'stat');box.append(el('strong',String(n)),el('small',label));cards.append(box)}
 const open=state.bravo.filter(r=>!r.done).sort((a,b)=>a.deadline.localeCompare(b.deadline)).slice(0,4);
 fillList($('home-deadlines'),open.map(r=>item(r.title,r.deadline+' · '+B.status(r),null)),'No pending deadlines in your local catalogue.');
}
function drawBravo(){
 const box=$('bravo-metrics');box.replaceChildren();
 for(const [n,label] of [[state.bravo.length,'Documents'],[state.bravo.filter(r=>!r.done&&B.status(r)==='Overdue').length,'Overdue'],[state.bravo.filter(r=>r.done).length,'Complete']])box.append(metric(n,label));
 const found=B.find(state.bravo,$('bravo-search').value).sort((a,b)=>a.deadline.localeCompare(b.deadline));
 fillList($('bravo-list'),found.map(r=>item(r.title,r.category+' · '+r.deadline+' · '+B.status(r),r.done?'Reopen':'Complete',()=>{try{persist('bravo',state.bravo.map(x=>x.id===r.id?{...x,done:!x.done}:x));toast('Document status saved locally')}catch(e){toast(e.message)}})),'No documents found. Add a reminder on the left.');
}
function drawCharlie(){
 const box=$('charlie-metrics');box.replaceChildren();const totals=C.totals(state.charlie);
 for(const [n,label] of [[C.money(totals.invoices),'Total invoiced'],[C.money(totals.expenses),'Expenses'],[C.money(totals.outstanding),'Outstanding']])box.append(metric(n,label));
 fillList($('charlie-invoices'),state.charlie.invoices.map(i=>item(i.reference+' · '+i.client,C.money(i.pence)+' · '+i.due+' · '+(i.paid?'Paid':'Outstanding'),i.paid?'Mark unpaid':'Mark paid',()=>{try{persist('charlie',{...state.charlie,invoices:state.charlie.invoices.map(x=>x.id===i.id?{...x,paid:!x.paid}:x)});toast('Invoice status saved')}catch(e){toast(e.message)}})),'No invoices recorded yet.');
 fillList($('charlie-expenses'),state.charlie.expenses.map(e=>item(e.vendor,C.money(e.pence)+' · '+e.category+' · '+e.date,null)),'No expenses recorded yet.');
 const select=$('c-draft-invoice'),selected=select.value;select.replaceChildren();for(const i of state.charlie.invoices){const o=el('option',i.reference+' / '+i.client);o.value=i.id;select.append(o)}if(state.charlie.invoices.some(i=>i.id===selected))select.value=selected;
 fillList($('charlie-drafts'),state.charlie.drafts.map(d=>item('Follow-up · '+(state.charlie.invoices.find(i=>i.id===d.invoiceId)?.reference||d.invoiceId),d.body.slice(0,130),'Edit',()=>{select.value=d.invoiceId;$('c-draft-body').value=d.body;state.selectedDraft=d.id;toast('Editing locally. Nothing will be sent.')})),'No follow-up drafts saved.');
}
function drawActivity(){
 const all=[...state.forge.map(x=>({title:x.title,detail:F.progress(x)+'% milestones · Creator Forge · '+x.stage})),...state.alpha.map(r=>({title:A.ACTIONS.find(a=>a.id===r.action)?.title||r.action,detail:new Date(r.createdAt).toLocaleDateString('en-GB')+' · Alpha ONE'})),...state.bravo.map(r=>({title:r.title,detail:'Due '+r.deadline+' · Bravo'})),...state.charlie.invoices.map(r=>({title:r.reference+' · '+r.client,detail:C.money(r.pence)+' · Charlie'}))];
 fillList($('activity-list'),all.slice(0,40).map(r=>item(r.title,r.detail,null)),'Your completed work will appear here.');
}
function setAlpha(action){
 state.alphaChoice=action;state.pending=null;$('alpha-result').className='empty';$('alpha-result').textContent='Your result will appear here. Choose an action and prepare it.';$('alpha-actions').replaceChildren();
 for(const button of document.querySelectorAll('[data-alpha]'))button.classList.toggle('selected',button.dataset.alpha===action);
 for(const f of document.querySelectorAll('[data-alpha-form]'))f.hidden=f.dataset.alphaForm!==action;
 $('alpha-task-heading').textContent={tasks:'Turn notes into a checklist',bill:'Make a bill reminder',followup:'Prepare a follow-up'}[action];
}
function prepareAlpha(action,values){
 try{const result=A.runAction(action,values);state.pending={action,result};const box=$('alpha-result');box.className='prepared';box.replaceChildren();
 if(action==='tasks'){box.append(el('h3',String(result.total)+' organised tasks'));const ul=el('ul');for(const t of result.items)ul.append(el('li',t.text));box.append(ul)}
 else if(action==='bill'){box.append(el('h3',result.payee),el('p','£'+result.amount.toFixed(2)+' · Due '+result.date))}
 else{box.append(el('h3',result.subject));const p=el('pre',result.message);p.style.whiteSpace='pre-wrap';p.style.overflowWrap='anywhere';box.append(p)}
 const actions=$('alpha-actions');actions.replaceChildren();const keep=el('button','Keep this result','primary');keep.type='button';keep.addEventListener('click',()=>{try{const r=A.safeReceipt(action,result);persist('alpha',[r,...state.alpha].slice(0,40));state.pending=null;actions.replaceChildren();toast('Saved locally. Nothing sent.');if(action==='bill'){const b=el('button','Download calendar reminder','ghost');b.type='button';b.addEventListener('click',()=>download('alpha-one-bill.ics',A.reminderICS(result,r.id),'text/calendar'));actions.append(b)}}catch(e){toast(e.message)}});
 const discard=el('button','Discard','ghost');discard.type='button';discard.addEventListener('click',()=>{state.pending=null;box.className='empty';box.textContent='Discarded. Nothing saved.';actions.replaceChildren()});actions.append(keep,discard);
 }catch(e){toast(e.message)}
}

const faqs=[
 ['Do I need an account?','No. This preview supports a local profile only; there is no sign-in or cloud account.'],
 ['Where is my data?','Work is saved in this browser using localStorage. Clearing site data can erase it. Use exports as backups.'],
 ['How do I import data from the three older pages?','Export JSON from each old page. In this unified app, visit Settings and select the corresponding backup file. Nothing migrates automatically.'],
 ['Does Alpha send messages or reminders?','No. It prepares checklists, calendar files and message drafts. You decide what to use.'],
 ['Does Bravo upload documents?','No. It records document metadata, titles, due dates and notes only.'],
 ['Does Charlie charge clients or send invoices?','No. It records invoices, expenses and drafts. It never processes a payment or sends an email.'],
 ['How do I use an avatar?','Open My profile and choose a JPEG, PNG or WebP image under 150 KB. It stays in your browser.'],
 ['Can I open this on my phone?','Yes. This hosted version works in a mobile browser and the Android preview app. Data stays in each browser or app separately. Export and import backups to move records.'],
 ['What if an import fails?','Backup files are validated before replacement. An invalid file is rejected without overwriting saved records.'],
 ['Is my profile secure authentication?','No. A local display name or avatar is not identity verification. Account authentication belongs in a later release.']
];
function drawFAQ(){const q=$('faq-search').value.toLocaleLowerCase('en-GB');const node=$('faq-list');node.replaceChildren();let count=0;for(const [question,answer] of faqs){if(!(question+' '+answer).toLocaleLowerCase('en-GB').includes(q))continue;const d=el('details');d.append(el('summary',question),el('p',answer));node.append(d);count++}if(!count)node.append(el('p','No matching answers. Try another search.','muted'))}
function fillSettings(){$('setting-theme').value=state.settings.theme;$('setting-density').value=state.settings.density;$('setting-motion').checked=state.settings.reduceMotion}
async function restoreFiles(){
 const selected=[['alpha',$('import-alpha').files?.[0]],['bravo',$('import-bravo').files?.[0]],['charlie',$('import-charlie').files?.[0]]].filter(x=>x[1]);
 if(!selected.length){toast('Choose a JSON backup to restore.');return}
 const ready=[];try{
  for(const [name,file] of selected){if(file.size>2_000_000)throw Error(name+' backup exceeds 2 MB');const raw=await file.text();const data=name==='alpha'?validateAlphaBackup(raw):name==='bravo'?validateBravoImport(raw):validateCharlieImport(raw);ready.push([name,data])}
  const describe=(key,data)=>key.toUpperCase()+': '+(key==='charlie'?(data.invoices.length+data.expenses.length+data.drafts.length):data.length)+' incoming records';
  if(!confirm('Replace local data for these selected tools?\n\n'+ready.map(([key,data])=>describe(key,data)).join('\n')+'\n\nExisting records for selected tools will be replaced. Export them first if needed.'))return;
  // All selected files have been validated before any writes; only selected namespaces are touched.
  const before=ready.map(([key])=>[key,localStorage.getItem(K[key])]);
  try{for(const [key,data] of ready)localStorage.setItem(K[key],JSON.stringify(data))}
  catch(error){for(const [key,old] of before){try{if(old===null)localStorage.removeItem(K[key]);else localStorage.setItem(K[key],old)}catch{}}throw Error('Could not store backup. Previous records were restored where possible.')}
  for(const [key,data] of ready){state[key]=data;state.blocked.delete(key)}
  drawAll();toast('Backup restored locally. No cloud connection used.');
 }catch(e){toast('Restore rejected: '+e.message)}
}
function wire(){
 for(const button of document.querySelectorAll('[data-go]'))button.addEventListener('click',()=>go(button.dataset.go));
 $('top-profile').addEventListener('click',()=>go('profile'));
 $('menu').addEventListener('click',()=>{const open=document.body.classList.toggle('nav-open');$('menu').setAttribute('aria-expanded',String(open))});
 for(const btn of document.querySelectorAll('[data-alpha]'))btn.addEventListener('click',()=>setAlpha(btn.dataset.alpha));
 $('alpha-tasks').addEventListener('submit',e=>{e.preventDefault();prepareAlpha('tasks',{text:$('alpha-lines').value})});
 $('alpha-bill').addEventListener('submit',e=>{e.preventDefault();prepareAlpha('bill',{payee:$('alpha-payee').value,amount:$('alpha-amount').value,date:$('alpha-date').value})});
 $('alpha-followup').addEventListener('submit',e=>{e.preventDefault();prepareAlpha('followup',{person:$('alpha-person').value,invoice:$('alpha-invoice').value,amount:$('alpha-follow-amount').value})});
 $('bravo-form').addEventListener('submit',e=>{e.preventDefault();try{const record=B.makeRecord({title:$('bravo-title').value,category:$('bravo-category').value,deadline:$('bravo-date').value,notes:$('bravo-notes').value},'doc-'+crypto.randomUUID());persist('bravo',B.upsert(state.bravo,record));e.currentTarget.reset();toast('Document reminder saved locally')}catch(err){toast(err.message)}});
 $('bravo-search').addEventListener('input',drawBravo);
 $('bravo-export').addEventListener('click',()=>{try{if(state.blocked.has('bravo'))throw Error('Catalogue unreadable: restore before exporting');download('bravo-paperless.json',B.json(state.bravo))}catch(e){toast(e.message)}});
 $('bravo-csv').addEventListener('click',()=>{try{if(state.blocked.has('bravo'))throw Error('Catalogue unreadable: restore before exporting');download('bravo-paperless.csv',B.csv(state.bravo),'text/csv')}catch(e){toast(e.message)}});
 $('charlie-invoice').addEventListener('submit',e=>{e.preventDefault();try{const record=C.invoice({client:$('c-client').value,reference:$('c-ref').value,amount:$('c-amount').value,due:$('c-due').value},'inv-'+crypto.randomUUID());persist('charlie',C.append(state.charlie,'invoices',record));e.currentTarget.reset();toast('Invoice recorded, nothing sent')}catch(err){toast(err.message)}});
 $('charlie-expense').addEventListener('submit',e=>{e.preventDefault();try{const record=C.expense({vendor:$('c-vendor').value,category:$('c-category').value,amount:$('c-exp-amount').value,date:$('c-exp-date').value},'exp-'+crypto.randomUUID());persist('charlie',C.append(state.charlie,'expenses',record));e.currentTarget.reset();toast('Expense recorded locally')}catch(err){toast(err.message)}});
 $('charlie-draft').addEventListener('submit',e=>{e.preventDefault();try{const invoiceId=$('c-draft-invoice').value;if(!state.charlie.invoices.some(i=>i.id===invoiceId))throw Error('Choose an existing invoice');const draft=C.draft({invoiceId,body:$('c-draft-body').value},state.selectedDraft||'draft-'+crypto.randomUUID());persist('charlie',C.saveDraft(state.charlie,draft));state.selectedDraft=null;$('c-draft-body').value='';toast('Draft saved locally, never sent')}catch(err){toast(err.message)}});
 $('charlie-export').addEventListener('click',()=>{try{if(state.blocked.has('charlie'))throw Error('Ledger unreadable: restore before exporting');download('charlie-done.json',C.exportJson(state.charlie))}catch(e){toast(e.message)}});
 $('profile-form').addEventListener('submit',async e=>{e.preventDefault();try{const name=$('profile-name').value.trim();if(!name||name.length>60)throw Error('Enter a display name under 60 characters');let avatarData=state.profile.avatar;const file=$('profile-photo').files?.[0];if(file){if(file.size>150000||!['image/png','image/jpeg','image/webp'].includes(file.type))throw Error('Avatar must be PNG, JPEG or WebP under 150 KB');avatarData=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(Error('Avatar read error'));reader.readAsDataURL(file)})}const data={name,avatar:avatarData};localStorage.setItem(K.profile,JSON.stringify(data));state.profile=data;drawProfile();toast('Local profile saved')}catch(err){toast(err.message)}});
 const updateSettings=()=>{state.settings={theme:$('setting-theme').value,density:$('setting-density').value,reduceMotion:$('setting-motion').checked};localStorage.setItem(K.settings,JSON.stringify(state.settings));applySettings()};
 for(const id of ['setting-theme','setting-density','setting-motion'])$(id).addEventListener('change',updateSettings);
 $('import-confirm').addEventListener('click',restoreFiles);$('faq-search').addEventListener('input',drawFAQ);drawFAQ();
}
wire();wireForge();initialize();

// Creator Forge module / explicit Charlie business handoff.
const forgeDate=()=>new Date().toISOString();
const forgeUid=(prefix)=>prefix+'-'+crypto.randomUUID();
function forgeSave(projects){persist('forge',F.validateLibrary(projects))}
function ventureSave(items){persist('ventures',F.validateVentures(items))}
function currentForge(){return state.forge.find(x=>x.id===state.selectedForge)||null}
function replaceForge(updated){forgeSave(state.forge.map(x=>x.id===updated.id?updated:x));state.selectedForge=updated.id}
function drawForge(){
 const metrics=$('forge-metrics');metrics.replaceChildren();
 for(const [n,label] of [[state.forge.length,'Projects'],[state.forge.filter(x=>x.stage==='build'||x.stage==='validate').length,'In progress'],[state.forge.filter(x=>x.handoffAt!==null).length,'With Charlie']])metrics.append(metric(n,label));
 fillList($('forge-projects'),state.forge.map(p=>item(p.title,p.kind+' · '+p.stage+' · '+F.progress(p)+'% verified steps','Open',()=>openForge(p.id))),'Every working project starts as an idea. Add yours on the left.');
 if(currentForge())drawForgeEditor();else $('forge-editor').hidden=true;
}
function openForge(id){if(!state.forge.some(x=>x.id===id))throw Error('Project not found');state.selectedForge=id;state.selectedChapter=null;drawForgeEditor();if(state.page!=='forge')go('forge');else $('forge-editor').scrollIntoView({behavior:'smooth',block:'start'})}
function drawForgeEditor(){
 const p=currentForge();if(!p){$('forge-editor').hidden=true;return}
 $('forge-editor').hidden=false;$('forge-editor-title').textContent=p.title;$('forge-editor-badge').textContent=p.stage.toUpperCase();
 $('forge-stage').value=p.stage;$('forge-audience').value=p.audience;$('forge-outcome').value=p.outcome;$('forge-notes').value=p.notes;
 $('forge-progress').textContent=F.progress(p)+'%';
 const root=$('forge-tasks');root.replaceChildren();
 for(const task of p.tasks){
  const label=el('label',undefined,'forge-step'),cb=el('input');cb.type='checkbox';cb.checked=task.done;cb.addEventListener('change',()=>{try{replaceForge(F.toggleTask(p,task.id));toast('Milestone updated. No other work marked completed.')}catch(e){toast(e.message)}});
  label.append(cb,el('span',task.title));root.append(label);
 }
 $('forge-writing').hidden=false;
 const chapters=$('forge-chapters');chapters.replaceChildren();
 for(const chapter of p.chapters)chapters.append(item(chapter.title,(chapter.content.trim().length?'Draft '+chapter.content.trim().length+' characters':'Empty chapter'),'Edit',()=>{state.selectedChapter=chapter.id;$('forge-chapter-body').value=chapter.content;toast('Editing: '+chapter.title)}));
 if(!p.chapters.length)chapters.append(el('p','No chapters yet. Use this space for working documents or add a chapter.','muted'));
 if(!p.chapters.some(x=>x.id===state.selectedChapter)){state.selectedChapter=p.chapters[0]?.id||null}
 $('forge-chapter-body').value=p.chapters.find(x=>x.id===state.selectedChapter)?.content||'';
 $('forge-linked').textContent=p.handoffAt?'Linked to Charlie business preparation on '+new Date(p.handoffAt).toLocaleDateString('en-GB'):'No business handoff yet. Your project remains in Creator Forge.';
 $('forge-to-charlie').disabled=p.handoffAt!==null;
}
function drawVentures(){
 const target=$('charlie-ventures');if(!target)return;
 const elements=state.ventures.map(v=>{
  const wrapper=el('div',undefined,'venture-record');
  const head=el('div',undefined,'venture-title');head.append(el('strong',v.title),el('small','Preparation only · Linked Creator Forge project'));wrapper.append(head);
  const checklist=el('div',undefined,'forge-checklist');
  v.checklist.forEach((t,index)=>{
   const label=el('label',undefined,'forge-step'),cb=el('input');cb.type='checkbox';cb.checked=t.done;
   cb.addEventListener('change',()=>{try{ventureSave(state.ventures.map(x=>x.id===v.id?{...x,checklist:x.checklist.map((j,i)=>i===index?{...j,done:cb.checked}:j)}:x));toast('Business preparation checkpoint saved')}catch(e){toast(e.message)}});
   label.append(cb,el('span',t.title));checklist.append(label);
  });
  wrapper.append(checklist);const open=el('button','Return to Creator Forge ↗','ghost');open.type='button';open.addEventListener('click',()=>openForge(v.forgeId));wrapper.append(open);return wrapper;
 });
 fillList(target,elements,'No projects handed off yet. Create a project in Creator Forge and explicitly send it to Charlie when business preparation becomes useful.');
}
function wireForge(){
 $('forge-new').addEventListener('submit',e=>{
  e.preventDefault();
  try{
   const project=F.newProject({title:$('forge-title').value,kind:$('forge-kind').value,description:$('forge-description').value},forgeUid('forge'));
   if(state.forge.length>=100)throw Error('Local project library is full');
   forgeSave([project,...state.forge]);e.currentTarget.reset();state.selectedForge=project.id;state.selectedChapter=null;drawForge();toast('Project created. The suggested milestones are not completed.');$('forge-editor').scrollIntoView({block:'start',behavior:'smooth'});
  }catch(err){toast(err.message)}
 });
 $('forge-save').addEventListener('click',()=>{
  try{const p=currentForge();if(!p)throw Error('Select a project');replaceForge(F.patch(p,{stage:$('forge-stage').value,audience:$('forge-audience').value,notes:$('forge-notes').value,outcome:$('forge-outcome').value}));toast('Project details saved. Stage is your declared status, not proof of a launch.')}catch(e){toast(e.message)}
 });
 $('forge-add-task').addEventListener('submit',e=>{
  e.preventDefault();try{const p=currentForge();if(!p)throw Error('Select a project');replaceForge(F.addTask(p,$('forge-task-title').value,forgeUid('step')));e.currentTarget.reset();toast('Milestone added')}catch(err){toast(err.message)}
 });
 $('forge-add-chapter').addEventListener('submit',e=>{
  e.preventDefault();try{const p=currentForge();if(!p)throw Error('Select a project');const id=forgeUid('chapter');replaceForge(F.addChapter(p,$('forge-chapter-title').value,id));state.selectedChapter=id;drawForgeEditor();e.currentTarget.reset();toast('New writing section added')}catch(err){toast(err.message)}
 });
 $('forge-save-chapter').addEventListener('click',()=>{
  try{const p=currentForge();if(!p||!state.selectedChapter)throw Error('Select a writing section');replaceForge(F.updateChapter(p,state.selectedChapter,$('forge-chapter-body').value));toast('Draft saved locally')}catch(err){toast(err.message)}
 });
 $('forge-export').addEventListener('click',()=>{
  try{if(state.blocked.has('forge'))throw Error('Project library unreadable: restore before exporting');const p=currentForge();if(!p)throw Error('Select a project');download(p.title.toLowerCase().replace(/[^a-z0-9]+/g,'-').slice(0,80)+'.md',F.exportMarkdown(p),'text/markdown');toast('Project Markdown downloaded')}catch(err){toast(err.message)}
 });
 $('forge-to-charlie').addEventListener('click',()=>{
  try{
   const p=currentForge();if(!p)throw Error('Choose a project');if(p.handoffAt)throw Error('Already linked to Charlie');
   const result=F.handoff(p);
   if(state.ventures.some(x=>x.forgeId===p.id))throw Error('Charlie already has this project');
   if(!confirm('Send "'+p.title+'" to Charlie business preparation?\n\nThis creates a linked planning record only. No invoice, transaction, business registration or customer message will be created.'))return;
   if(state.blocked.has('forge')||state.blocked.has('ventures'))throw Error('A saved data store is unreadable. Handoff is blocked.');
   const nextProjects=F.validateLibrary(state.forge.map(x=>x.id===p.id?result.project:x));
   const nextVentures=F.validateVentures([result.venture,...state.ventures]);
   const snapshots=[['forge',localStorage.getItem(K.forge)],['ventures',localStorage.getItem(K.ventures)]];
   try{localStorage.setItem(K.forge,JSON.stringify(nextProjects));localStorage.setItem(K.ventures,JSON.stringify(nextVentures))}
   catch(error){for(const [k,value] of snapshots){try{if(value===null)localStorage.removeItem(K[k]);else localStorage.setItem(K[k],value)}catch{}}throw Error('Handoff save failed; previous data restored where possible')}
   state.forge=nextProjects;state.ventures=nextVentures;drawAll();toast('Charlie has the business preparation record. No business actions executed.');go('charlie');
  }catch(err){toast(err.message)}
 });
}

const STARTERS={
 guide:[
  ['Build Your First AI Assistant Without Being a Programmer','A practical beginner guide explaining one working assistant, tool choices, approvals, tests and limitations.'],
  ['From Idea to Reality With AI','A guide for turning a rough idea into a real, tested project with honest progress.'],
  ["The Independent Creator's Survival Kit",'A practical guide for independent creators working with limited money, time and tools.']
 ],
 app:[
  ['One-task planning companion','Help a freelancer turn a goal into three verifiable tasks and track what is truly completed.'],
  ['Local document deadline tracker','Give people a safe place to see upcoming paperwork obligations without uploading documents.'],
  ['Accessibility-first small business checklist','Help someone keep track of the practical steps for starting a small service.']
 ],
 'digital-product':[
  ['Weekend digital workbook','A small printable workbook that helps one audience solve one clearly defined problem.'],
  ['Creator release checklist kit','Reusable checklists for a creator launching a guide, video or music release.'],
  ['Beginner project starter templates','A pack of structured project plans with milestones and review sheets.']
 ],
 service:[
  ['Independent creator support service','Offer small, clearly scoped help with planning and organising creative projects.'],
  ['Administrative follow-up assistant','A service that helps sole traders prepare reminders and review follow-up drafts.'],
  ['Digital setup guidance','Beginner-friendly help organising tools, backups and digital working routines.']
 ],
 music:[
  ['Independent release planning kit','Plan a music release with artwork, rights, distribution, dates and promotional tasks.'],
  ['Artist press kit','Create an editable portfolio with biography, music descriptions and press resources.'],
  ['Music project progress journal','Track recording, production, approvals and release tasks.']
 ],
 other:[
  ['One useful community resource','A small guide or tool based on one recurring problem people around you experience.'],
  ['Personal learning project','Build a practical learning plan with visible milestones and a final demonstrated outcome.'],
  ['Simple time-saving toolkit','Collect and test small workflows that remove repetitive work.']
 ]
};
function wireIdeasAndBackup(){
 $('forge-starter-button').addEventListener('click',()=>{
  const kind=$('forge-kind').value,results=$('forge-starter-results');results.replaceChildren();
  const suggestions=STARTERS[kind]||STARTERS.other;
  for(const [title,description] of suggestions){
   const box=item(title,description,'Use this idea',()=>{
    $('forge-title').value=title;$('forge-description').value=description;
    $('forge-title').focus();toast('Starter added to the form. Edit it before creating your project.');
   });results.append(box);
  }
  toast('Three curated starting ideas. These are templates, not AI-generated results.');
 });
 $('workspace-export').addEventListener('click',()=>{
  try{
   for(const key of ['alpha','bravo','charlie','forge','ventures'])if(state.blocked.has(key))throw Error('Unreadable '+key+' data. Export blocked to prevent an incomplete backup.');
   const data={alpha:state.alpha,bravo:state.bravo,charlie:state.charlie,forge:state.forge,ventures:state.ventures,profile:state.profile,settings:state.settings};
   download('app-foundry-workspace.json',exportWorkspaceSnapshot(data));
   toast('Full local backup exported. Keep the unencrypted file private.');
  }catch(e){toast(e.message)}
 });
 $('workspace-restore').addEventListener('click',async()=>{
  const file=$('workspace-import').files?.[0];if(!file){toast('Choose a full App Foundry JSON backup first.');return}
  if(file.size>4_000_000){toast('Backup exceeds 4 MB.');return}
  try{
   const decoded=validateWorkspaceSnapshot(await file.text()),keys=Object.keys(decoded);
   if(!confirm('Replace all seven local App Foundry data areas from this backup?\n\nCreator Forge, linked Charlie projects, Alpha, Bravo, Charlie, profile and settings.\n\nThis cannot be undone. Export your current workspace first.'))return;
   const snapshots=keys.map(key=>[key,localStorage.getItem(K[key])]);
   try{for(const key of keys)localStorage.setItem(K[key],JSON.stringify(decoded[key]))}
   catch(e){for(const [key,previous] of snapshots){try{if(previous===null)localStorage.removeItem(K[key]);else localStorage.setItem(K[key],previous)}catch{}}throw Error('Failed to restore local storage; previous values were restored where possible')}
   for(const key of keys){state[key]=decoded[key];state.blocked.delete(key)}
   state.selectedForge=null;state.selectedChapter=null;drawAll();drawProfile();applySettings();fillSettings();toast('Complete workspace restored locally. No cloud connection used.');
  }catch(err){toast('Backup rejected: '+err.message)}
 });
}
wireIdeasAndBackup();
