import test from 'node:test';
import assert from 'node:assert/strict';
import {initial,validate} from '../src/model.ts';
import {actualSeconds} from '../src/core.ts';
test('Backup roundtrip / بازیابی بکاپ',()=>assert.deepEqual(validate(JSON.parse(JSON.stringify(initial))),initial));
test('Reject malformed nested backup without mutation / رد بکاپ خراب',()=>{for(const patch of [{reminders:{...initial.reminders,hour:99}},{meals:[{id:'x',date:'invalid',portion:1}]},{sessions:[{id:'x'}]},{habits:{today:'bad'}},{active:{started:0}},{profile:{age:null,limitations:''}},{movementRatings:{push:[{at:0,effort:99,pain:false}]}}])assert.throws(()=>validate({...initial,...patch}));assert.equal(initial.sessions.length,0);});
test('Skipped time is not performed time / زمان عبور انجام‌شده نیست',()=>assert.equal(actualSeconds({steps:[{seconds:100}],started:0,elapsed:100,paused:true,skipped:[0],skippedSeconds:70},200000),30));
