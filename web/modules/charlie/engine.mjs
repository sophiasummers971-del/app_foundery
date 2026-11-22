// Charlie DONE Stage 2: local sole-trader records, amounts stored in integer pence.
export function str(v,max=120){if(typeof v!=='string')throw Error('Expected text');const s=v.trim();if(!s||s.length>max)throw Error('Text must contain 1–'+max+' characters');return s}
export function day(v){if(typeof v!=='string'||! /^\d{4}-\d{2}-\d{2}$/.test(v))throw Error('Use YYYY-MM-DD');const d=new Date(v+'T12:00:00Z');if(!Number.isFinite(d.valueOf())||d.toISOString().slice(0,10)!==v)throw Error('Invalid date');return v}
export function pence(value){const s=String(value||'').trim().replaceAll(',','').replace(/^£/,'');if(!/^\d{1,7}(?:\.\d{1,2})?$/.test(s))throw Error('Use a positive money amount with two decimals');const n=Math.round(Number(s)*100);if(!Number.isSafeInteger(n)||n<=0)throw Error('Amount must be greater than zero');return n}
export function money(n){if(!Number.isSafeInteger(n)||n<0)throw Error('Invalid pence');return '£'+(n/100).toFixed(2)}
export function expense(data,id){if(!/^exp-[a-zA-Z0-9-]{5,70}$/.test(id))throw Error('Invalid expense ID');return {id,vendor:str(data.vendor),category:str(data.category||'Other',50),date:day(data.date),pence:pence(data.amount)}}
export function invoice(data,id){if(!/^inv-[a-zA-Z0-9-]{5,70}$/.test(id))throw Error('Invalid invoice ID');return {id,client:str(data.client),reference:str(data.reference,60),due:day(data.due),pence:pence(data.amount),paid:false}}
export function draft(data,id){if(!/^draft-[a-zA-Z0-9-]{5,70}$/.test(id))throw Error('Invalid draft ID');return {id,invoiceId:str(data.invoiceId,90),body:str(data.body,1600),sent:false}}
export function sum(records){return records.reduce((total,r)=>{if(!Number.isSafeInteger(r.pence)||r.pence<0)throw Error('Invalid record amount');const next=total+r.pence;if(!Number.isSafeInteger(next))throw Error('Total too large');return next},0)}
export function totals(state){return {invoices:sum(state.invoices),expenses:sum(state.expenses),outstanding:sum(state.invoices.filter(i=>!i.paid))}}
export function parseStore(raw){if(raw===null)return {invoices:[],expenses:[],drafts:[]};let s;try{s=JSON.parse(raw)}catch{throw Error('Saved ledger is unreadable; it has not been overwritten')}
 if(!s||typeof s!=='object'||!['invoices','expenses','drafts'].every(k=>Array.isArray(s[k])&&s[k].length<=200))throw Error('Saved ledger is invalid; it has not been overwritten');
 for(const r of [...s.invoices,...s.expenses])if(!r||typeof r.id!=='string'||!Number.isSafeInteger(r.pence)||r.pence<=0)throw Error('Saved amounts are invalid');
 for(const r of s.drafts)if(!r||typeof r.id!=='string'||typeof r.body!=='string')throw Error('Saved drafts are invalid');
 return s;
}
export function append(state,type,record){if(!['invoices','expenses','drafts'].includes(type))throw Error('Unknown type');if(state[type].length>=200)throw Error('Local record capacity reached');if(state[type].some(x=>x.id===record.id))throw Error('Duplicate ID');return {...state,[type]:[record,...state[type]]}}
export function saveDraft(state,record){return {...state,drafts:[record,...state.drafts.filter(x=>x.id!==record.id)]}}
export function exportJson(state){return JSON.stringify({format:'charlie-done-v1',exportedAt:new Date().toISOString(),data:state},null,2)}
