// Alpha ONE: deterministic, local-only actions.
export const ACTIONS=[
{id:'tasks',title:'Organise my to-do list',description:'Turn scattered notes into a checklist.'},
{id:'bill',title:'Remember a bill',description:'Create a calendar reminder before the bill is due.'},
{id:'followup',title:'Chase a payment',description:'Prepare an editable message without sending it.'}
];
export function clean(value,max=8000){if(typeof value!=='string'||value.length>max)throw Error('Text exceeds allowed length');return value.replace(/\r\n?/g,'\n').trim()}
export function tasksFromText(text){
 const lines=clean(text,3000).split('\n').map(x=>x.replace(/^\s*(?:[-*•]|\d+[.)]|\[[ xX]\])\s*/u,'').trim()).filter(Boolean);
 if(!lines.length||lines.length>30)throw Error('Enter 1–30 task lines');
 const seen=new Set(),items=[];
 for(const line of lines){
  if(line.length>180)throw Error('Task lines must be 180 characters or fewer');
  const key=line.toLocaleLowerCase('en-GB');
  if(!seen.has(key)){seen.add(key);items.push({id:items.length+1,text:line,done:false});}
 }
 return {kind:'tasks',items,total:items.length};
}
export function parseAmount(input){
 const value=clean(input,40).replace(/[,£$\s]/g,'');
 if(!/^\d{1,8}(?:\.\d{1,2})?$/.test(value))throw Error('Use a valid amount with up to two decimals');
 const n=Number(value);if(!Number.isFinite(n)||n<=0)throw Error('Amount must be greater than zero');return Math.round(n*100)/100;
}
export function isoDay(day){
 if(typeof day!=='string'|| !/^\d{4}-\d{2}-\d{2}$/.test(day))throw Error('Choose a due date');
 const d=new Date(day+'T12:00:00Z');if(!Number.isFinite(d.getTime())||d.toISOString().slice(0,10)!==day)throw Error('Invalid date');return day;
}
export function billReminder({payee,amount,date}){
 const name=clean(payee,100);if(!name)throw Error('Who is the bill for?');
 return {kind:'bill',payee:name,amount:parseAmount(amount),date:isoDay(date)};
}
export function paymentFollowup({person,invoice,amount}){
 const to=clean(person,80),ref=clean(invoice,60);
 if(!to||!ref)throw Error('Enter recipient and invoice reference');
 const total=parseAmount(amount);
 return {kind:'followup',person:to,invoice:ref,amount:total,subject:'Follow-up on invoice '+ref,
 message:'Hello '+to+',\n\nI am following up regarding invoice '+ref+' for £'+total.toFixed(2)+'. Could you please confirm when payment is expected?\n\nThank you.'};
}
export function runAction(id,input){
 if(id==='tasks')return tasksFromText(input.text);
 if(id==='bill')return billReminder(input);
 if(id==='followup')return paymentFollowup(input);
 throw Error('Unknown action');
}
function esc(s){return String(s).replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;')}
export function reminderICS(r,uid='alpha-one-local'){
 if(r.kind!=='bill'||!/^[a-z0-9-]{1,100}$/.test(uid))throw Error('Invalid reminder');
 const next=new Date(r.date+'T12:00:00Z');next.setUTCDate(next.getUTCDate()+1);
 const from=r.date.replaceAll('-',''),to=next.toISOString().slice(0,10).replaceAll('-','');
 return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Alpha ONE//Local reminders//EN','BEGIN:VEVENT',
 'UID:'+uid+'@alpha-one.local','DTSTAMP:20261119T000000Z','DTSTART;VALUE=DATE:'+from,'DTEND;VALUE=DATE:'+to,
 'SUMMARY:'+esc('Bill due: '+r.payee),'DESCRIPTION:'+esc('Amount: £'+r.amount.toFixed(2)),
 'BEGIN:VALARM','TRIGGER:-P1D','ACTION:DISPLAY','DESCRIPTION:'+esc('Bill due tomorrow: '+r.payee),
 'END:VALARM','END:VEVENT','END:VCALENDAR',''].join('\r\n');
}
export function safeReceipt(action,result,now=new Date().toISOString(),id){
 if(!ACTIONS.some(x=>x.id===action))throw Error('Unknown receipt action');
 if(!Number.isFinite(Date.parse(now)))throw Error('Invalid timestamp');
 return {version:1,id:id||'ao-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,9),
 action,createdAt:now,status:'completed',result};
}
