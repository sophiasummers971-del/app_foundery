// Bravo PAPERLESS restore: validate before replacing browser catalogue.
import {makeRecord,day} from './engine.mjs';
const plain=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
export function validateBravoImport(raw){
 const doc=typeof raw==='string'?JSON.parse(raw):raw;
 if(!plain(doc)||doc.format!=='bravo-paperless-v1'||!Array.isArray(doc.records)||doc.records.length>200)throw Error('Unsupported Bravo backup');
 const seen=new Set(),out=[];
 for(const item of doc.records){
  if(!plain(item)||typeof item.id!=='string'||!/^doc-[a-zA-Z0-9-]{5,70}$/.test(item.id)||typeof item.done!=='boolean'||seen.has(item.id))throw Error('Invalid or duplicate document record');
  const clean=makeRecord({title:item.title,category:item.category,deadline:day(item.deadline),notes:item.notes},item.id);
  clean.done=item.done;out.push(clean);seen.add(item.id);
 }
 return out;
}
