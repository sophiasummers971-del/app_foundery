// Bravo PAPERLESS Stage 2: metadata only, no access to document contents.
export function text(value,max=160){if(typeof value!=='string')throw Error('Expected text');const s=value.trim();if(!s||s.length>max)throw Error('Enter 1–'+max+' characters');return s}
export function optional(value,max=1200){if(value==null||value==='')return '';if(typeof value!=='string'||value.length>max)throw Error('Notes too long');return value.trim()}
export function day(value){if(typeof value!=='string'||! /^\d{4}-\d{2}-\d{2}$/.test(value))throw Error('Enter date YYYY-MM-DD');const d=new Date(value+'T12:00:00Z');if(!Number.isFinite(d.valueOf())||d.toISOString().slice(0,10)!==value)throw Error('Invalid date');return value}
export function makeRecord(form,id){
 if(typeof id!=='string'||! /^doc-[a-zA-Z0-9-]{5,70}$/.test(id))throw Error('Invalid document ID');
 return {id,title:text(form.title,120),category:text(form.category||'General',50),deadline:day(form.deadline),notes:optional(form.notes,600),done:false};
}
export function status(record,today=new Date().toISOString().slice(0,10)){
 day(today);if(record.done)return 'Complete';
 return day(record.deadline)<today?'Overdue':record.deadline===today?'Due today':'Upcoming';
}
export function find(records,query){const q=String(query||'').trim().toLocaleLowerCase('en-GB');return records.filter(r=>(r.title+' '+r.category+' '+r.notes).toLocaleLowerCase('en-GB').includes(q))}
export function parseStore(raw){if(raw===null)return [];let data;try{data=JSON.parse(raw)}catch{throw Error('Saved records cannot be read. Data was not overwritten.')}
 if(!Array.isArray(data)||data.length>200)throw Error('Invalid saved catalogue. Data was not overwritten.');
 for(const r of data){if(!r||typeof r!=='object'||typeof r.id!=='string'||typeof r.title!=='string'||typeof r.deadline!=='string'||typeof r.done!=='boolean')throw Error('Stored catalogue is invalid. Data was not overwritten.')}
 return data;
}
export function upsert(records,record){if(records.length>=200&&!records.some(r=>r.id===record.id))throw Error('Local catalogue is full');return [record,...records.filter(r=>r.id!==record.id)]}
export function csv(records){
 const cell=x=>{let s=String(x??'');if(/^[=+\-@]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';};
 const rows=[['Title','Category','Deadline','Status','Notes'],...records.map(r=>[r.title,r.category,r.deadline,status(r),r.notes])];
 return '\ufeff'+rows.map(row=>row.map(cell).join(',')).join('\r\n')+'\r\n';
}
export function json(records){return JSON.stringify({format:'bravo-paperless-v1',exportedAt:new Date().toISOString(),records},null,2)}
