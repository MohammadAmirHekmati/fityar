import {elapsed} from './core.ts';
import type {Active,Session,Workload,MuscleGroup,StopReason} from './core';

export function measuredLoad(active:Active,groups:Record<string,{group:MuscleGroup}>,now:number):Workload {
 const load:Workload={warmup:0,work:0,cooldown:0,rest:0,groups:{push:0,legs:0,core:0,back:0,cardio:0},source:'timer'};
 const clock=elapsed(active,now);let start=0;
 active.steps.forEach((step,i)=>{
  const seconds=Math.max(0,Math.min(step.seconds,active.skipped.includes(i)?active.stepSeconds?.[i]??0:clock-start));
  const phase=step.exercise?(step.phase??'work'):'rest';load[phase]+=seconds;
  if(phase==='work'&&groups[step.exercise??''])load.groups[groups[step.exercise!].group]+=seconds;
  start+=step.seconds;
 });
 return load;
}
// Timer exposure is not a rep counter. Legacy records have only actual minutes,
// never enough evidence to infer completed sets from their planned duration.
export function exposure(s:Session){
 const zero={push:0,legs:0,core:0,back:0,cardio:0};
 if(s.status==='missed'||s.stopReason==='test'||s.activity==='none')return {seconds:0,work:0,groups:zero};
 const seconds=Math.max(0,s.minutes*60);
 if(s.activity==='warmup')return {seconds,work:0,groups:zero};
 if(s.load)return {seconds,work:s.load.work,groups:s.load.groups};
 // Conservative approximation, explicitly used only for old records without phase data.
 const work=s.activity==='main'?seconds:Math.max(0,seconds-5*60);
 return {seconds,work,groups:s.mode==='strength'?{...zero,push:work/3,legs:work/3,core:work/3}:{...zero,cardio:work}};
}
export const meaningful=(s:Session)=>{const x=exposure(s);return x.work>=120||x.seconds>=600;};
export function clarificationNeeded(history:Session[],now=Date.now()){
 return history.filter(s=>s.status==='partial'&&!s.stopReason&&now-s.at<28*86400000).sort((a,b)=>b.at-a.at)[0];
}
export function recoveryNeeded(history:Session[],now=Date.now()){
 return history.filter(s=>s.status!=='missed'&&s.recovery===undefined&&now-s.at<28*86400000&&
  (s.pain||s.stopReason==='pain'||s.stopReason==='fatigue'||(now-s.at>=12*3600000&&meaningful(s)))).sort((a,b)=>b.at-a.at)[0];
}
export function trainingEvidence(history:Session[],now:number){
 const rows=history.filter(s=>s.status!=='missed').sort((a,b)=>b.at-a.at);
 const unresolvedPain=rows.find(s=>(s.pain||s.stopReason==='pain'||(s.recovery??0)>=7)&&s.recovery!==2);
 const fatigue=rows.find(s=>now-s.at<72*3600000&&s.recovery!==2&&
  ((s.recovery??0)>=5||s.stopReason==='fatigue'||(exposure(s).seconds>0&&(s.effort>=8||!s.talk))));
 const loaded=rows.filter(s=>{const groups=Object.entries(exposure(s).groups).filter(([g])=>g!=='cardio');return now-s.at<48*3600000&&(groups.some(([,n])=>n>=60)||groups.reduce((n,[,seconds])=>n+seconds,0)>=120);});
 const completed=rows.filter(s=>now-s.at<=35*86400000&&s.status==='complete'&&meaningful(s)&&s.recovery===2&&!s.pain&&s.effort<=5&&s.talk).filter((s,i,all)=>all.findIndex(x=>x.date===s.date&&x.mode===s.mode)===i);
 const strength=completed.filter(s=>Object.entries(exposure(s).groups).some(([g,n])=>g!=='cardio'&&n>=60));
 const first=strength.at(-1)?.at??now;
 const weeks=Math.max(1,Math.floor((now-first)/(7*86400000))+1);
 const stage=!strength.length||now-strength[0].at>10*86400000?0:weeks>=4&&strength.length>=6?2:weeks>=2&&strength.length>=2?1:0;
 return {rows,unresolvedPain,fatigue,loaded,completed,strength,weeks,stage};
}

export function correctSession(row:Session,reason:StopReason,activity?:Session['activity']):Session {
 return {...row,stopReason:reason,activity:reason==='test'?'none':activity,pain:row.pain||reason==='pain'};
}
