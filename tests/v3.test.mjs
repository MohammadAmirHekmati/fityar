import {quickStart} from '../src/quickStart.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import {choosePlan,answerFlow,newFlow,completeAnswers,leaveFlow,flowChanged} from '../src/coach.ts';
import {elapsed,actualSeconds,dayKey} from '../src/core.ts';
import {initial,validate} from '../src/model.ts';
import {reminderEvents,reminderAction} from '../src/reminderPlan.ts';
const now=new Date('2026-11-06T10:00:00').getTime();
const profile={adult:'yes',restriction:'no',push:'knee',pushReps:'6',legs:'free',core:'yes',cardio:'20',run:'yes'};
const daily={symptoms:'no',pain:'no',sleep:'ok',energy:'good',minutes:'60',place:'inside',support:'none'};
const row={id:'a',date:'2026-11-02',at:now-4*86400000,mode:'strength',minutes:45,planned:45,effort:3,pain:false,talk:true,status:'complete',reason:{fa:'آزمون',en:'test'},recovery:2};
const history=[row,{...row,id:'b',at:now-6*86400000},{...row,id:'c',at:now-8*86400000}];
test('All 116 supported minute ceilings preserve real main work / همه زمان‌های مجاز',()=>{
 for(let minutes=5;minutes<=120;minutes++)for(const place of ['inside','outside','both']){
  const p=choosePlan(profile,{...daily,minutes:String(minutes),place},history,{},now);
  const total=p.steps.reduce((n,s)=>n+s.seconds,0),work=p.steps.filter(s=>s.phase==='work'&&s.exercise).reduce((n,s)=>n+s.seconds,0);
  assert.ok(total<=minutes*60&&total>0);assert.equal(total,p.decision.minutes*60);assert.ok(work>=total*.25,`${minutes}/${place} lacks main work`);assert.ok(p.steps.every(s=>s.seconds>0));
  validate({...initial,coach:{profile,ready:{date:dayKey(new Date(now)),answers:{...daily,minutes:String(minutes),place}}},active:{id:'test',started:now,elapsed:0,paused:true,steps:p.steps,decision:p.decision,skipped:[]}});
 }
 for(const minutes of ['30','45','60'])assert.ok(choosePlan(profile,{...daily,minutes},history,{},now).decision.minutes>20);
 assert.equal(choosePlan(profile,daily,[],{},now).decision.minutes,25);
});
test('Manual minutes validation accepts 37 and legacy 15; rejects malformed/out of range / زمان دستی',()=>{
 const f={...newFlow('daily'),cursor:4,answers:{symptoms:'no',pain:'no',sleep:'ok',energy:'good'}};
 for(const value of ['37','15','120'])assert.equal(answerFlow(f,value).answers.minutes,value);
 for(const value of ['4','121','30.5','NaN','Infinity',''])assert.throws(()=>answerFlow(f,value));
});
test('Short legacy history regression retains meaningful work; normal strength is balanced / بخش اصلی واقعی',()=>{
 for(const planned of [5,6,7,8,9]){const p=choosePlan(profile,daily,[{...row,planned}],{},now);assert.ok(p.steps.filter(s=>s.phase==='work'&&s.exercise).reduce((n,s)=>n+s.seconds,0)>=120);}
 for(const push of ['wall','incline','knee','regular']){const p=choosePlan({...profile,push},{...daily,support:'counter'},[],{},now),work=p.steps.filter(s=>s.phase==='work'&&s.exercise);assert.ok(work.some(s=>s.exercise==='push-'+push));assert.ok(work.some(s=>s.exercise==='squat-free'));assert.ok(work.some(s=>s.exercise==='bridge'));assert.ok(work.some(s=>['heel-slide','bird-dog'].includes(s.exercise)));}
 for(const bad of [{pain:'yes'},{symptoms:'yes'}])assert.equal(choosePlan(profile,{...daily,...bad},history,{},now).steps.length,0);
 assert.equal(choosePlan({},daily,history,{},now).steps.length,0);
});
test('Draft exit is transactional across profile/history/active plan / خروج بدون تغییر داده',()=>{
 const base={profile,ready:{date:dayKey(new Date(now)),answers:daily}};
 const flow={...newFlow('intake'),answers:{...profile},baseline:{...profile}};
 assert.equal(flowChanged(flow),false);
 const changed=answerFlow(flow,'no');assert.equal(flowChanged(changed),true);
 const state={...initial,coach:{...base,flow:changed},sessions:history};const snapshot=JSON.stringify({profile:state.coach.profile,ready:state.coach.ready,sessions:state.sessions,active:state.active});
 for(const save of [false,true]){const next={...state,coach:leaveFlow(state.coach,save)};validate(next);assert.equal(JSON.stringify({profile:next.coach.profile,ready:next.coach.ready,sessions:next.sessions,active:next.active}),snapshot);assert.equal(!!next.coach.draft,save);}
 assert.ok(completeAnswers('intake',profile));
});
test('Both locations select history-aware sessions and block clock at transition / مکث تغییر مکان',()=>{
 const mixedHistory=[{...row,mode:'walk'},...history];
 const p=choosePlan(profile,{...daily,place:'both'},mixedHistory,{},now);
 const i=p.steps.findIndex(s=>s.transition);assert.ok(i>0);
 const boundary=p.steps.slice(0,i).reduce((n,s)=>n+s.seconds,0);
 const a={id:'mixed',started:now,elapsed:0,paused:false,steps:p.steps,decision:p.decision,skipped:[]};
 assert.equal(elapsed(a,now+1e8),boundary);assert.equal(actualSeconds(a,now+1e8),boundary);
 assert.equal(elapsed({...a,elapsed:boundary,started:now+1e8,transitions:[i]},now+1e8+1000),boundary+1);
 assert.equal(p.steps[i].phase,'warmup');assert.equal(p.steps[i].location,'outside');assert.ok(p.steps.filter(s=>s.exercise?.startsWith('push')).every(s=>s.location==='inside'));
 const outside=choosePlan(profile,{...daily,place:'both'},history,{},now);assert.ok(outside.steps.some(s=>s.location==='outside')&&outside.steps.some(s=>s.location==='inside'));const recovering=choosePlan(profile,{...daily,place:'both'},[{...row,at:now-3600000}],{},now);assert.equal(recovering.program.kind,'recovery');
});
test('Reminders: one fixed followup, quiet hours, snooze, skip, completion and recovery / منطق یادآور',()=>{
 const s={...initial,onboard:true,reminders:{...initial.reminders,enabled:true,hour:18,minute:0,prep:true,workEndHour:17}};
 const date=dayKey(new Date(now));
 const today=x=>reminderEvents(x,now).filter(e=>e.date===date);
 assert.equal(today(s).filter(e=>e.kind==='followup').length,1);assert.equal(today(s).length,3);
 const snoozed=reminderAction(s,'snooze','id',date,now);assert.equal(today(snoozed).filter(e=>e.kind==='followup').length,0);assert.equal(today(snoozed)[0].at,now+900000);
 assert.deepEqual(reminderAction(snoozed,'snooze','id',date,now),snoozed);
 assert.equal(today(reminderAction(s,'skip','skip',date,now)).length,0);
 assert.equal(today({...s,sessions:[{...row,date}]}).length,0);
 assert.equal(today({...s,reminders:{...s.reminders,quietStart:0,quietEnd:23}}).length,0);
 const yesterday={...row,date:dayKey(new Date(now-86400000)),at:now-86400000,recovery:undefined};assert.ok(today({...s,sessions:[yesterday]}).some(e=>e.kind==='recovery'));
});
test('Long availability never creates unlimited strength sets / زمان بیشتر ست نامحدود نمی‌سازد',()=>{
 const p=choosePlan(profile,{...daily,minutes:'120'},history.map(x=>({...x,planned:110})),{},now);
 for(const id of ['squat-free','push-knee','bridge','heel-slide','bird-dog'])assert.ok(p.steps.filter(s=>s.phase==='work'&&s.exercise===id).length<=3);
 assert.ok(p.decision.minutes>20);assert.ok(!p.steps.some(s=>s.phase==='work'&&s.exercise==='march'),'Do not fill spare minutes with arbitrary extra work');
});
test('Quick start preserves readiness, drafts, completed days and warmup / شروع آسان ایمن',()=>{
 const s={...initial,onboard:true,coach:{profile,ready:{date:dayKey(new Date(now)),answers:daily}}};
 const next=quickStart(s,now);assert.ok(next.active);assert.equal(next.active.steps[0].phase,'warmup');assert.equal(next.active.elapsed,0);
 assert.equal(quickStart(next,now),next);
 for(const patch of [{coach:{profile}},{coach:{...s.coach,flow:newFlow('intake')}},{sessions:[{...row,date:dayKey(new Date(now))}]},{coach:{...s.coach,ready:{...s.coach.ready,answers:{...daily,pain:'yes'}}}}]){const state={...s,...patch};assert.equal(quickStart(state,now),state);}
});
test('Saved reassessment survives cancelling a separate daily check / حفظ پیش‌نویس ارزیابی',()=>{
 const draft=answerFlow({...newFlow('intake'),baseline:profile},'yes');
 const coach={profile,draft,flow:newFlow('daily'),ready:{date:dayKey(new Date(now)),answers:daily}};
 const next=leaveFlow(coach);assert.deepEqual(next.draft,draft);assert.deepEqual(next.profile,profile);assert.deepEqual(next.ready,coach.ready);validate({...initial,coach:next});
});
