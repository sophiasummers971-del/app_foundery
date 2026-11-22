// Alpha ONE restore v1: strict, bounded, local-only receipts.
import {ACTIONS,isoDay} from './engine.mjs';
const plain=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const label=(x,max)=>typeof x==='string'&&x.length>0&&x.length<=max;
const finiteMoney=x=>typeof x==='number'&&Number.isFinite(x)&&x>0&&x<=99999999;
function receipt(r){
 if(!plain(r)||r.version!==1||!label(r.id,90)||!ACTIONS.some(x=>x.id===r.action)||!label(r.createdAt,60)||!Number.isFinite(Date.parse(r.createdAt))||r.status!=='completed'||!plain(r.result)||r.result.kind!==r.action)throw Error('Invalid saved receipt');
 const x=r.result;
 if(r.action==='tasks'){
  if(!Array.isArray(x.items)||x.items.length<1||x.items.length>30||x.total!==x.items.length)throw Error('Invalid checklist');
  for(const item of x.items)if(!plain(item)||!Number.isInteger(item.id)||item.id<1||!label(item.text,180)||typeof item.done!=='boolean')throw Error('Invalid task item');
 }else if(r.action==='bill'){
  if(!label(x.payee,100)||!finiteMoney(x.amount))throw Error('Invalid saved bill');
  try{isoDay(x.date)}catch{throw Error('Invalid saved bill date')}
 }else{
  if(!label(x.person,80)||!label(x.invoice,60)||!finiteMoney(x.amount)||!label(x.subject,160)||!label(x.message,1800))throw Error('Invalid follow-up draft');
 }
 return r;
}
export function alphaBackup(items){const checked=validateAlphaBackup({format:'alpha-one-history-v1',receipts:items});return JSON.stringify({format:'alpha-one-history-v1',receipts:checked},null,2)}
export function validateAlphaBackup(value){
 const obj=typeof value==='string'?JSON.parse(value):value;
 if(!plain(obj)||obj.format!=='alpha-one-history-v1'||!Array.isArray(obj.receipts)||obj.receipts.length>40)throw Error('Invalid Alpha history backup');
 const seen=new Set();
 for(const r of obj.receipts){receipt(r);if(seen.has(r.id))throw Error('Duplicate history receipt');seen.add(r.id)}
 return structuredClone(obj.receipts);
}
