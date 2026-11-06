import {meaningful} from './trainingHistory.ts';
import type {State} from './model';
import {dayKey} from './core.ts';
import {choosePlan} from './coach.ts';
export function quickStart(s:State,now=Date.now()):State{
 if(s.active||s.coach?.flow||s.coach?.ready?.date!==dayKey(new Date(now))||s.sessions.some(x=>x.date===dayKey(new Date(now))&&meaningful(x)))return s;
 const p=choosePlan(s.coach.profile,s.coach.ready.answers,s.sessions,s.coach.feedback,now);
 if(!p.steps.length)return s;
 return {...s,active:{id:String(now),started:now,elapsed:0,paused:false,steps:p.steps,decision:p.decision,program:p.program,skipped:[]}};
}
