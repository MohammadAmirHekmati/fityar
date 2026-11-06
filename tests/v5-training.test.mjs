import test from 'node:test';
import assert from 'node:assert/strict';
import {choosePlan,movements} from '../src/coach.ts';
import {targets,alternatives} from '../src/exerciseInfo.ts';
import {artIds,movementSvg} from '../src/movementArt.ts';
const profile={adult:'yes',restriction:'no',push:'knee',pushReps:'6',legs:'free',core:'yes',cardio:'20',run:'no'};
const daily={symptoms:'no',pain:'no',sleep:'ok',energy:'good',minutes:'30',place:'inside',support:'none'};
test('Independent ability gates planks; chest/core remain balanced with legs/back / توان مستقل و تعادل',()=>{
 const base=choosePlan(profile,daily,[],{},Date.now());assert.ok(!base.steps.some(x=>x.exercise?.includes('plank')));
 for(const level of ['knee','full']){
  const p=choosePlan(profile,daily,[],{},Date.now(),{dynamic:'dead-bug',plank:level,side:level});
  const work=p.steps.filter(x=>x.phase==='work'&&x.exercise);
  assert.ok(work.some(x=>x.exercise==='dead-bug'));assert.ok(work.some(x=>x.exercise==='side-plank-'+level));
  for(const target of ['chest','abs','obliques','legs','back'])assert.ok(work.some(x=>targets(x.exercise).includes(target)));
  assert.equal(work.length,12);assert.equal(p.decision.minutes,25);
  assert.equal(work.find(x=>x.exercise==='side-plank-'+level).seconds,25);
 }
});
test('Swaps cannot bypass reported ability, equipment or pain / تعویض بدون دورزدن توان و درد',()=>{
 assert.ok(!alternatives('push-knee',profile,daily).includes('push-regular'));
 assert.ok(!alternatives('heel-slide',profile,daily,{}).some(x=>x.includes('plank')));
 const p=choosePlan(profile,daily,[],{},Date.now(),{}, {'push-knee':'push-regular'});assert.ok(!p.steps.some(x=>x.exercise==='push-regular'));
 assert.equal(choosePlan(profile,{...daily,pain:'yes'},[],{},Date.now(),{plank:'full'}).steps.length,0);
});
test('Every movement has original diagrams, bilingual instructions and muscle targets / راهنما و هدف هر حرکت',()=>{
 assert.deepEqual(artIds.sort(),Object.keys(movements).sort());
 for(const id of Object.keys(movements)){assert.ok(targets(id).length);assert.ok(movementSvg(id,0));assert.ok(movementSvg(id,1));}
});
