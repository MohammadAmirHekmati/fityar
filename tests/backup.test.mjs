import test from 'node:test';
import assert from 'node:assert/strict';
import {initial,validate} from '../src/model.ts';
import {actualSeconds,quietHour,numericText} from '../src/core.ts';
test('Persian numeric input / ورودی عدد فارسی',()=>assert.equal(numericText('۷۳٫۵'),'73.5'));
test('Quiet hours cross midnight / ساعات سکوت نیمه‌شب',()=>{assert.equal(quietHour(23,22,8),true);assert.equal(quietHour(7,22,8),true);assert.equal(quietHour(12,22,8),false);assert.equal(quietHour(12,8,17),true);assert.equal(quietHour(12,8,8),false);});
test('Backup roundtrip / بازیابی بکاپ',()=>assert.deepEqual(validate(JSON.parse(JSON.stringify(initial))),initial));
test('Reject malformed nested backup without mutation / رد بکاپ خراب',()=>{for(const patch of [{reminders:{...initial.reminders,hour:99}},{meals:[{id:'x',date:'invalid',portion:1}]},{sessions:[{id:'x'}]},{habits:{today:'bad'}},{active:{started:0}},{profile:{age:null,limitations:''}},{movementRatings:{push:[{at:0,effort:99,pain:false}]}}])assert.throws(()=>validate({...initial,...patch}));assert.equal(initial.sessions.length,0);});
test('Skipped time is not performed time / زمان عبور انجام‌شده نیست',()=>assert.equal(actualSeconds({steps:[{seconds:100}],started:0,elapsed:100,paused:true,skipped:[0],skippedSeconds:70},200000),30));
