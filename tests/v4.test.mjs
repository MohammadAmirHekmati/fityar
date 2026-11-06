import test from 'node:test';
import assert from 'node:assert/strict';
import {choosePlan,recordSession,performedLoad,newFlow,answerFlow,flowQuestions} from '../src/coach.ts';

import {correctSession,exposure,trainingEvidence} from '../src/trainingHistory.ts';
import {initial,validate} from '../src/model.ts';
import {dayKey} from '../src/core.ts';
import {quickStart} from '../src/quickStart.ts';
const now=new Date('2026-11-06T12:00:00').getTime();
const profile={adult:'yes',restriction:'no',push:'knee',pushReps:'6',legs:'free',core:'yes',cardio:'20',run:'yes'};
const daily={symptoms:'no',pain:'no',sleep:'ok',energy:'good',minutes:'30',place:'inside',support:'none'};
const short={id:'previous',at:now-3600000,date:'2026-11-06',mode:'home',minutes:2,planned:5,status:'partial',effort:3,pain:false,talk:true,recovery:2,reason:{fa:'آزمون ساختگی','en':'Synthetic test'}};

test('A nonphysical interruption must not trap a capable user in two one-minute movements / توقف غیربدنی نباید برنامه را قفل کند',()=>{
 const p=choosePlan(profile,daily,[{...short,stopReason:'time'}],{},now);
 console.log('Reproduction:',p.decision.minutes,p.steps.filter(x=>x.phase==='work'&&x.exercise).map(x=>[x.exercise,x.seconds]));
 assert.equal(p.decision.mode,'strength');
 assert.ok(p.decision.minutes>=20&&p.decision.minutes<=30);
 assert.ok(new Set(p.steps.filter(x=>x.phase==='work'&&x.exercise).map(x=>x.exercise)).size>=5);
});
const post={effort:'3',talk:'yes',pain:'no',group:'none'};
const normal=()=>choosePlan(profile,daily,[],{},now);
const activeFor=(p,elapsed)=>({id:'active',steps:p.steps,decision:p.decision,program:p.program,elapsed,started:now,paused:true,skipped:[]});

test('Unknown legacy partial asks a correction; correction preserves the record / اصلاح صادقانه سابقه قدیمی',()=>{
 assert.equal(choosePlan(profile,daily,[short],{},now).steps.length,0);
 for(const why of ['time','accidental','test']){
  const corrected=correctSession(short,why,'warmup');
  assert.equal(corrected.status,'partial');assert.equal(corrected.minutes,2);assert.equal(corrected.planned,5);
  assert.equal(choosePlan(profile,daily,[corrected],{},now).decision.mode,'strength');
  validate({...initial,onboard:true,coach:{profile},sessions:[corrected]});
 }
});

test('Actual phases and partially skipped work are retained; planned time is not load / ثبت مرحله و زمان واقعی',()=>{
 const p=normal(),a=activeFor(p,120);
 assert.equal(performedLoad(a,now).work,0);
 const early=recordSession(a,post,now,'time');assert.equal(early.minutes,2);assert.equal(early.status,'partial');
 assert.equal(choosePlan(profile,daily,[early],{},now).program.kind,'strength');
 const index=p.steps.findIndex(x=>x.phase==='work'&&x.exercise==='squat-free');
 const end=p.steps.slice(0,index+1).reduce((n,x)=>n+x.seconds,0);
 const skipped={...a,elapsed:end,skipped:[index],stepSeconds:{[index]:20},skippedSeconds:p.steps[index].seconds-20};
 assert.equal(performedLoad(skipped,now).groups.legs,20);
 assert.equal(performedLoad(skipped,now).work,20);
 validate({...initial,active:skipped});
});

test('Testing the app does not create progress, fake completion or erase pain / آزمایش اپ سابقه تمرین نیست',()=>{
 const p=normal(),record=recordSession(activeFor(p,120),post,now,'test');
 assert.equal(record.status,'partial');assert.equal(exposure(record).seconds,0);
 assert.equal(trainingEvidence([record],now).strength.length,0);
 const state={...initial,onboard:true,sessions:[record],coach:{profile,ready:{date:dayKey(new Date(now)),answers:daily}}};
 assert.ok(quickStart(state,now).active);
 assert.equal(choosePlan(profile,daily,[{...record,pain:true}],{},now).steps.length,0);
 assert.equal(correctSession({...record,pain:true},'test').pain,true);
});

test('True fatigue and real loaded muscles still produce a labeled recovery day / حفظ ریکاوری واقعی',()=>{
 const p=normal(),row=recordSession(activeFor(p,900),{...post,effort:'8'},now-3600000,'fatigue');
 assert.equal(choosePlan(profile,daily,[row],{},now).steps.length,0,'Ask recovery before interpreting fatigue');
 const recovery=choosePlan(profile,daily,[{...row,recovery:5}],{},now);
 assert.equal(recovery.program.kind,'recovery');assert.ok(recovery.nextMain.fa);assert.ok(recovery.decision.reason.en.includes('fatigue'));
 assert.equal(choosePlan(profile,daily,[{...row,recovery:2}],{},now).program.kind,'recovery','Actual strength still needs spacing');
 for(const patch of [{pain:'yes'},{symptoms:'yes'}])assert.equal(choosePlan(profile,{...daily,...patch},[correctSession(short,'test')],{},now).steps.length,0);
 assert.equal(choosePlan(profile,daily,[{...row,stopReason:'pain',pain:true,recovery:undefined}],{},now).steps.length,0);
});

test('Completed and partial short records never impose a five-minute ceiling over subsequent sessions / بدون حلقه کوتاه‌شدن',()=>{
 let history=[correctSession(short,'time','warmup')];
 for(let i=0;i<4;i++){
  const at=now+i*3*86400000,p=choosePlan(profile,daily,history,{},at);
  assert.ok(p.decision.minutes>=20);assert.equal(p.decision.mode,'strength');
  const row=recordSession({...activeFor(p,p.steps.reduce((n,x)=>n+x.seconds,0)),started:at},post,at);
  history=[{...row,recovery:2},...history];
 }
 for(const planned of [5,9,60,120])assert.equal(choosePlan(profile,daily,[{...short,stopReason:'time',planned}],{},now).decision.minutes,25);
});

test('Templates alternate purposefully; weeks and completed actual work gate progression / پیشرفت بر اساس هفته و بار واقعی',()=>{
 const p=normal(),total=p.steps.reduce((n,x)=>n+x.seconds,0);
 const row=(days,id)=>({...recordSession(activeFor(p,total),post,now-days*86400000),id,recovery:2});
 const first=choosePlan(profile,daily,[row(3,'a')],{},now);
 assert.ok(first.name.en.includes('Strength B'));
 assert.ok(first.steps.some(x=>x.exercise==='heel-slide'&&x.phase==='work'));
 const history=[row(3,'a'),row(7,'b')];const next=choosePlan(profile,daily,history,{},now);
 assert.ok(next.reps['push-knee']>p.reps['push-knee']);
 const stale=choosePlan(profile,daily,[row(40,'old')],{},now);assert.equal(stale.reps['push-knee'],p.reps['push-knee']);
});

test('Capability and available time choose coherent set templates / قالب متناسب توان و وقت',()=>{
 for(const push of ['knee','regular'])for(const minutes of ['20','30','45']){
  const p=choosePlan({...profile,push},{...daily,minutes},[],{},now),work=p.steps.filter(s=>s.phase==='work'&&s.exercise);
  assert.ok(p.decision.minutes>=20&&p.decision.minutes<=Number(minutes));
  assert.equal(new Set(work.map(s=>s.exercise)).size,6);
  assert.equal(work.filter(s=>s.exercise==='push-'+push).length,2);
  assert.ok(work.every(s=>s.reps&&s.reps<=10));
  assert.ok(p.steps.filter(s=>s.phase==='work'&&!s.exercise).every(s=>s.seconds>=20));
 }
 const mixed=choosePlan(profile,{...daily,minutes:'45',place:'both'},[],{},now);
 assert.ok(mixed.steps.some(s=>s.transition));assert.ok(mixed.steps.some(s=>s.location==='outside'&&s.phase==='work'));
 const outside=choosePlan(profile,{...daily,place:'outside'},[],{},now);assert.equal(outside.decision.minutes,20);
});

test('Stop clarification survives saved flow without invalidating prior records / ادامه سؤال علت توقف',()=>{
 let f={...newFlow('stop','active'),post};f=answerFlow(f,'time');
 assert.equal(flowQuestions(f).length,1);
 const a=activeFor(normal(),120);validate({...initial,active:a,coach:{profile,flow:f},sessions:[short]});
 let legacy=newFlow('stop',short.id);legacy=answerFlow(legacy,'time');assert.equal(flowQuestions(legacy).length,2);
 legacy=answerFlow(legacy,'warmup');validate({...initial,coach:{profile,flow:legacy},sessions:[short]});
 assert.throws(()=>validate({...initial,sessions:[{...short,load:{warmup:-1}}]}));
});
