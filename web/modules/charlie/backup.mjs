// Charlie DONE restore: enforce ledger shape, numeric precision and relationships.
import {str,day} from './engine.mjs';
const plain=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const amount=v=>Number.isSafeInteger(v)&&v>0&&v<=999999999;
export function validateCharlieImport(raw){
 const doc=typeof raw==='string'?JSON.parse(raw):raw;
 if(!plain(doc)||doc.format!=='charlie-done-v1'||!plain(doc.data))throw Error('Unsupported Charlie backup');
 const state=doc.data;
 if(!['invoices','expenses','drafts'].every(k=>Array.isArray(state[k])&&state[k].length<=200))throw Error('Invalid ledger collections');
 const ids=new Set(),invoices=[],expenses=[],drafts=[];
 for(const i of state.invoices){
  if(!plain(i)||!/^inv-[a-zA-Z0-9-]{5,70}$/.test(i.id)||ids.has(i.id)||typeof i.paid!=='boolean'||!amount(i.pence))throw Error('Invalid invoice in backup');
  invoices.push({id:i.id,client:str(i.client),reference:str(i.reference,60),due:day(i.due),pence:i.pence,paid:i.paid});ids.add(i.id);
 }
 for(const e of state.expenses){
  if(!plain(e)||!/^exp-[a-zA-Z0-9-]{5,70}$/.test(e.id)||ids.has(e.id)||!amount(e.pence))throw Error('Invalid expense in backup');
  expenses.push({id:e.id,vendor:str(e.vendor),category:str(e.category,50),date:day(e.date),pence:e.pence});ids.add(e.id);
 }
 for(const d of state.drafts){
  if(!plain(d)||!/^draft-[a-zA-Z0-9-]{5,70}$/.test(d.id)||ids.has(d.id)||!invoices.some(i=>i.id===d.invoiceId)||d.sent!==false)throw Error('Invalid draft in backup');
  drafts.push({id:d.id,invoiceId:d.invoiceId,body:str(d.body,1600),sent:false});ids.add(d.id);
 }
 return {invoices,expenses,drafts};
}
