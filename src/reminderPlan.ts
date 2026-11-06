import {exposure,meaningful} from './trainingHistory.ts';
import {dayKey,quietHour} from './core.ts';
import type {State} from './model';
export interface ReminderDay {snoozes:number;snoozeUntil?:number;skip?:boolean;handled?:string[]}
export interface ReminderEvent {id:string;at:number;kind:'exercise'|'followup'|'prep'|'partial'|'recovery'|'water'|'move';date:string}
export function reminderEvents(s:State,now=Date.now()):ReminderEvent[]{
 const r=s.reminders;if(!r.enabled||!s.onboard)return [];
 const events:ReminderEvent[]=[];
 const add=(at:number,kind:ReminderEvent['kind'],date:string)=>{if(at>now&&!quietHour(new Date(at).getHours(),r.quietStart,r.quietEnd))events.push({id:`fityar-${date}-${kind}`,at,kind,date});};
 for(let i=0;i<7;i++){
  const d=new Date(now);d.setDate(d.getDate()+i);d.setHours(r.hour,r.minute,0,0);
  const date=dayKey(d),ledger=r.days?.[date],done=s.sessions.some(x=>x.date===date&&exposure(x).seconds>0);
  const previous=s.sessions.filter(x=>x.status!=='missed'&&meaningful(x)&&x.date<date).sort((a,b)=>b.at-a.at)[0];
  const recovery=previous&&previous.recovery===undefined&&new Date(previous.at+86400000).toDateString()===d.toDateString();
  if(!ledger?.skip&&!done){
   const kind=s.active&&i===0?'partial':recovery?'recovery':'exercise';
   const activeAt=s.active&&i===0?s.active.started+(s.active.paused?30*60000:Math.max(0,s.active.steps.reduce((n,x)=>n+x.seconds,0)-s.active.elapsed)*1000+15*60000):d.getTime();
   const at=ledger?.snoozeUntil??(s.active&&i===0?activeAt:d.getTime());
   add(at,kind,date);
   // A fixed single follow-up per date. Reopening never pushes it further into the future.
   if(!ledger?.snoozes)add(at+45*60000,'followup',date);
   if(r.prep&&!s.active&&!ledger?.snoozes){const prep=new Date(d);prep.setHours(r.workEndHour??17,r.workEndMinute??0,0,0);if(prep.getTime()<at)add(prep.getTime(),'prep',date);}
  }
  if(r.water){const w=new Date(d);w.setHours(15,0,0,0);add(w.getTime(),'water',date);}
  if(r.move){const m=new Date(d);m.setHours(12,0,0,0);add(m.getTime(),'move',date);}
 }
 return events;
}
export function reminderAction(s:State,action:string,id:string,date:string,now=Date.now()):State{
 if(!['snooze','skip','start'].includes(action)||date!==dayKey(new Date(now)))return s;
 const prior=s.reminders.days?.[date]??{snoozes:0};if(prior.handled?.includes(id))return s;
 const row:ReminderDay={...prior,handled:[...(prior.handled??[]).slice(-19),id]};
 if(action==='snooze'){row.snoozes++;row.snoozeUntil=now+15*60000;}
 if(action==='skip'){row.skip=true;row.snoozeUntil=undefined;}
 if(action==='start')row.snoozeUntil=undefined;
 const days=Object.fromEntries(Object.entries({...s.reminders.days,[date]:row}).filter(([d])=>d>=dayKey(new Date(now-7*86400000))));
 return {...s,reminders:{...s.reminders,days}};
}
