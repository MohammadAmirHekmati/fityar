import test from 'node:test';
import assert from 'node:assert/strict';
import {initial,validate} from '../src/model.ts';
import {newFlow,answerFlow,flowQuestions} from '../src/coach.ts';
import {beginFeedback,commitFeedback,recoverFeedback,durableTransition} from '../src/sessionLifecycle.ts';
const at=1793980000000;
const active={id:'stable-workout',started:at,elapsed:120,paused:true,steps:[{title:{fa:'حرکت','en':'Move'},seconds:300,exercise:'march',phase:'work'}],skipped:[],decision:{state:'hold',mode:'home',minutes:5,reason:{fa:'آزمون','en':'Test'}}};
const state=()=>({...initial,active,coach:{profile:{}}});
const answer=(s,values)=>{for(const v of values)s={...s,coach:{...s.coach,flow:answerFlow(s.coach.flow,v)}};return s;};
test('One final save, stable ID, JSON restart and duplicate confirmation / ثبت یک‌باره و بازیابی',()=>{
 let s=beginFeedback(state(),at+1000);assert.equal(s.active.paused,true);assert.equal(flowQuestions(s.coach.flow).length,5);
 s=answer(s,['3','yes','no','none','time']);validate(s);
 s=recoverFeedback(validate(JSON.parse(JSON.stringify(s))));assert.equal(s.coach.flow.cursor,5);
 const args=s.coach.flow.answers;const saved=commitFeedback(s,'stable-workout',args);
 assert.equal(saved.sessions.length,1);assert.equal(saved.active,null);assert.equal(saved.sessions[0].status,'partial');
 assert.equal(saved.coach.lastSaved,'stable-workout');assert.equal(commitFeedback(saved,'stable-workout',args),saved);
 assert.equal(validate(JSON.parse(JSON.stringify(saved))).sessions.length,1);
});
test('Natural completion is complete; skipped completion remains partial / پایان طبیعی و رد مرحله',()=>{
 for(const skipped of [[],[0]]){
  let s=beginFeedback({...state(),active:{...active,elapsed:300,skipped}},at+1000);
  s=answer(s,['5','yes','no','none',...(skipped.length?['other']:[])]);
  const saved=commitFeedback(s,'stable-workout',s.coach.flow.answers);
  assert.equal(saved.sessions[0].status,skipped.length?'partial':'complete');
 }
});
test('Old post/stop drafts survive upgrade, missing context never silently clears / بازیابی نسخه قبل',()=>{
 const post={effort:'3',talk:'yes',pain:'no',group:'none'};
 for(const flow of [{...newFlow('post'),cursor:4,answers:post},{...newFlow('stop','active'),post,answers:{reason:'time'},cursor:1}]){
  const s=recoverFeedback({...state(),coach:{profile:{},flow}});assert.ok(s.active.endedAt);assert.equal(s.coach.flow.answers.effort,'3');validate(s);
 }
 assert.throws(()=>commitFeedback(state(),'missing',post));
});
test('Failed durable write keeps pending session; retry commits once / خطای ذخیره بدون موفقیت کاذب',()=>{
 let s=answer(beginFeedback(state(),at+1000),['3','yes','no','none','time']);
 const change=old=>commitFeedback(old,'stable-workout',s.coach.flow.answers);
 assert.throws(()=>durableTransition(s,change,()=>{throw Error('disk full');}));assert.equal(s.sessions.length,0);assert.ok(s.active.endedAt);
 let persisted;const saved=durableTransition(s,change,next=>{persisted=JSON.stringify(next);});assert.equal(JSON.parse(persisted).sessions.length,1);assert.equal(saved.active,null);
});
