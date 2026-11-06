import type {State} from './model';
import {elapsed} from './core.ts';
import {newFlow,flowQuestions,validAnswer,recordSession,performedGroups} from './coach.ts';
import type {Answers} from './coach';
import type {StopReason} from './core';

export function beginFeedback(s:State,at=Date.now()):State {
 const a=s.active;if(!a)return s;
 const id=a.id??`legacy-${a.started}`,endedAt=a.endedAt??at;
 const active={...a,id,endedAt,elapsed:Math.min(elapsed(a,endedAt),a.steps.reduce((n,x)=>n+x.seconds,0)),started:endedAt,paused:true};
 const partial=!!a.skipped.length||active.elapsed<a.steps.reduce((n,x)=>n+x.seconds,0);
 const c=s.coach??{profile:{}};
 const previous=c.flow?.kind==='post'||c.flow?.kind==='stop'&&c.flow.target==='active'?c.flow:
  c.draft?.kind==='post'||c.draft?.kind==='stop'&&c.draft.target==='active'?c.draft:undefined;
 const answers=previous?.kind==='stop'?{...previous.post,...previous.answers}:previous?.answers??{};
 const flow={...newFlow('post'),answers,partial,sessionId:id};
 flow.cursor=flowQuestions(flow).findIndex(q=>!validAnswer(q,answers[q.key]));
 if(flow.cursor<0)flow.cursor=flowQuestions(flow).length;
 return {...s,active,coach:{...c,flow,draft:c.draft===previous?undefined:c.draft}};
}

export function recoverFeedback(s:State):State {
 if(!s.active)return s;
 if(s.active.endedAt||s.coach?.flow?.kind==='post'||s.coach?.flow?.kind==='stop'&&s.coach.flow.target==='active')return beginFeedback(s,s.active.paused?s.active.started:Date.now());
 return s;
}

export function commitFeedback(s:State,id:string,answers:Answers):State {
 if(s.sessions.some(x=>x.id===id))return s; // Repeated tap / retry after durable commit.
 if(!s.active||s.active.id!==id||!s.active.endedAt)throw Error('Missing pending session');
 const c=s.coach??{profile:{}},f={...newFlow('post'),partial:!!s.active.skipped.length||elapsed(s.active)<s.active.steps.reduce((n,x)=>n+x.seconds,0),answers};
 if(!flowQuestions(f).every(q=>validAnswer(q,answers[q.key])))throw Error('Incomplete feedback');
 const record=recordSession(s.active,answers,s.active.endedAt,answers.reason as StopReason|undefined);
 const feedback={...c.feedback};
 if(record.stopReason!=='test')for(const g of performedGroups(s.active,s.active.endedAt))feedback[g]=[...(feedback[g]??[]),{at:record.at,effort:answers.group===g||record.stopReason==='fatigue'?8:record.effort,pain:record.pain}];
 return {...s,sessions:[record,...s.sessions],active:null,coach:{...c,flow:undefined,draft:c.draft?.kind==='post'||c.draft?.kind==='stop'?undefined:c.draft,ready:undefined,feedback,lastSaved:record.id}};
}

// Write before publishing UI state. Failed writes leave the previous pending state intact.
export function durableTransition(s:State,change:Partial<State>|((old:State)=>State),write:(next:State)=>void):State {
 const next=typeof change==='function'?change(s):{...s,...change};
 if(next!==s)write(next);
 return next;
}

export function createDurableStore(initial:State,write:(next:State)=>void){
 let current=initial;
 return {get:()=>current,apply:(change:Partial<State>|((old:State)=>State))=>{
  current=durableTransition(current,change,write);return current;
 }};
}
