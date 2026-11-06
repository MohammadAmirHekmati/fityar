import {bi, dayKey} from './core.ts';
import type {Session, Step, Decision, Text} from './core';
export type Answers=Record<string,string>;
export type FlowKind='intake'|'daily'|'post'|'recovery'|'adapt';
export interface Flow {kind:FlowKind;cursor:number;answers:Answers;target?:string;date:string}
export interface CoachState {profile:Answers;flow?:Flow;ready?:{date:string;answers:Answers};feedback?:Record<string,{effort:number;pain:boolean;at:number}[]>}
export interface Question {key:string;title:Text;hint?:Text;options:{id:string;label:Text}[]}
const q=(key:string,fa:string,en:string,options:[string,string,string][],hint?:Text):Question=>({key,title:bi(fa,en),options:options.map(([id,f,e])=>({id,label:bi(f,e)})),hint});
export const questions:Record<FlowKind,Question[]>={
 intake:[
 q('adult','۱۸ سال یا بیشتر داری؟','Are you 18 or older?',[['yes','بله','Yes'],['no','نه','No']],bi('همراه آفلاین، بدون حساب و هوش مصنوعی. پاسخ‌ها فقط روی دستگاه می‌مانند.','Offline, without accounts or AI. Answers stay on this device.')),
 q('restriction','محدودیت پزشکی یا آسیب فعالی داری؟','Do you have an active injury or medical restriction?',[['no','نه','No'],['yes','بله، یا مطمئن نیستم','Yes, or I am unsure']]),
 q('push','کدام شنا را با فرم راحت انجام می‌دهی؟','Which push-up can you do comfortably?',[['unknown','هنوز نمی‌دانم','I do not know yet'],['wall','شنا روی دیوار','Wall push-up'],['incline','شنا روی تکیه‌گاه ثابت','Incline push-up'],['knee','شنا روی زانو','Knee push-up'],['regular','شنا معمولی','Regular push-up']],bi('برای جواب دادن آزمایش نکن؛ تجربه قبلی کافی است.','Do not test yourself now; use your previous experience.')),
 q('pushReps','چند تکرار راحت، با توان چند تکرار بیشتر؟','How many comfortable repetitions, with some left in reserve?',[['unknown','نمی‌دانم','Unsure'],['3','۱ تا ۵','1–5'],['6','۶ تا ۱۰','6–10'],['10','بیش از ۱۰','More than 10']]),
 q('legs','برای نشستن و بلند شدن کدام راحت‌تر است؟','Which squat feels comfortable?',[['unknown','نمی‌دانم','Unsure'],['chair','با صندلی ثابت','Using a stable chair'],['free','اسکوات بدون صندلی','Squat without a chair']]),
 q('core','تمرین روی زمین برایت راحت است؟','Are floor exercises comfortable for you?',[['unknown','هنوز نمی‌دانم','Unsure'],['no','ترجیح می‌دهم ایستاده باشم','I prefer standing'],['yes','بله، دراز کشیدن و بلند شدن راحت است','Yes, getting down and up is comfortable']]),
 q('cardio','معمولاً چقدر راه رفتن راحت است؟','How much walking usually feels comfortable?',[['unknown','نمی‌دانم','Unsure'],['5','حدود ۵ دقیقه','About 5 minutes'],['10','حدود ۱۰ دقیقه','About 10 minutes'],['20','۲۰ دقیقه یا بیشتر','20 minutes or more']]),
 q('run','قبلاً دویدن آرام بدون درد را تجربه کرده‌ای؟','Have you recently jogged comfortably without pain?',[['no','نه یا مطمئن نیستم','No or unsure'],['yes','بله','Yes']])],
 daily:[
 q('symptoms','الان درد قفسه سینه، احساس غش یا تنگی نفس شدید داری؟','Do you have chest pain, feel faint, or have severe breathlessness now?',[['no','نه','No'],['yes','بله','Yes']]),
 q('pain','امروز درد یا بیماری داری؟','Do you have pain or feel ill today?',[['no','نه، حالم خوب است','No, I feel well'],['yes','بله یا مطمئن نیستم','Yes or unsure']]),
 q('sleep','خواب دیشبت چطور بود؟','How was your sleep last night?',[['low','کمتر از ۵ ساعت یا نامناسب','Under 5 hours or poor'],['ok','کافی و قابل قبول','Enough and acceptable']]),
 q('energy','الان چقدر انرژی داری؟','How is your energy now?',[['low','کم','Low'],['ok','معمولی','Okay'],['good','خوب','Good']]),
 q('minutes','امروز چقدر وقت داری؟','How much time do you have today?',[['5','۵ دقیقه','5 minutes'],['10','۱۰ دقیقه','10 minutes'],['15','۱۵ دقیقه','15 minutes'],['20','۲۰ دقیقه','20 minutes']]),
 q('place','کجا می‌خواهی حرکت کنی؟','Where can you move today?',[['inside','داخل خانه','Indoors'],['outside','بیرون، مسیر امن','Outside, on a safe route']]),
 q('support','چه تکیه‌گاهی در دسترس است؟','What stable support is available?',[['none','هیچ‌کدام','None'],['wall','دیوار','Wall'],['chair','دیوار و صندلی ثابت','Wall and stable chair'],['counter','دیوار و سطح بلند ثابت','Wall and fixed raised surface']],bi('صندلی چرخ‌دار، میز لق و وسایل لغزنده مناسب نیستند.','Do not use wheeled chairs, unstable tables or slippery supports.'))],
 post:[q('effort','این جلسه چقدر سخت بود؟','How hard was this session?',[['3','راحت — ۳ از ۱۰','Easy — 3 out of 10'],['5','متوسط — ۵ از ۱۰','Moderate — 5 out of 10'],['8','سخت — ۸ از ۱۰','Hard — 8 out of 10']]),q('talk','می‌توانستی یک جمله کامل بگویی؟','Could you speak a full sentence?',[['yes','بله','Yes'],['no','نه','No']]),q('pain','در طول جلسه درد داشتی؟','Did you have pain during the session?',[['no','نه','No'],['yes','بله','Yes']]),q('group','کدام بخش بیشتر نیاز به سبک‌تر شدن دارد؟','Which part needs to be easier next time?',[['none','هیچ‌کدام','None'],['push','دست و سینه','Arms and chest'],['legs','پا','Legs'],['core','میان‌تنه','Core'],['cardio','راه رفتن یا هوازی','Walking or cardio']])],
 recovery:[q('recovery','بعد از جلسه قبل چطور هستی؟','How do you feel after your last session?',[['2','راحت و سرحال','Comfortable and recovered'],['5','کمی کوفتگی یا خستگی','Some soreness or fatigue'],['8','درد یا خستگی زیاد','Pain or substantial fatigue']])],
 adapt:[q('reason','چه چیزی امروز مناسب نیست؟','What does not suit you today?',[['pain','درد یا ناخوشی','Pain or illness'],['time','وقت کمتر دارم','Less time'],['equipment','تکیه‌گاه ندارم','No support available'],['unfamiliar','حرکت‌ها را نمی‌شناسم','Unfamiliar movements']])]
};
export const newFlow=(kind:FlowKind,target?:string):Flow=>({kind,cursor:0,answers:{},date:dayKey(),...(target?{target}:{})});
export function answerFlow(flow:Flow,value:string):Flow {
 const list=questions[flow.kind],question=list[flow.cursor];
 if(!question?.options.some(o=>o.id===value))throw Error('Invalid answer');
 const answers=Object.fromEntries(list.slice(0,flow.cursor).filter(x=>flow.answers[x.key]!==undefined).map(x=>[x.key,flow.answers[x.key]]));
 answers[question.key]=value;
 return {...flow,answers,cursor:flow.cursor+1};
}
export function completeAnswers(kind:FlowKind,a:Answers){return questions[kind].every(q=>q.options.some(o=>o.id===a[q.key]));}
export function validateCoach(c:unknown):boolean {
 if(!c||typeof c!=='object')return false;
 const x=c as CoachState,answers=(a:unknown)=>!!a&&typeof a==='object'&&!Array.isArray(a)&&Object.entries(a).length<=30&&Object.values(a).every(v=>typeof v==='string'&&v.length<100);
 if(!answers(x.profile))return false;
 const validAnswers=(kind:FlowKind,a:Answers)=>Object.entries(a).every(([key,value])=>questions[kind].some(q=>q.key===key&&q.options.some(o=>o.id===value)));
 if(!validAnswers('intake',x.profile))return false;
 if(x.flow){const f=x.flow;if(!questions[f.kind]||!Number.isInteger(f.cursor)||f.cursor<0||f.cursor>questions[f.kind].length||!answers(f.answers)||typeof f.date!=='string'||(f.target!==undefined&&typeof f.target!=='string'))return false;}
 if(x.flow&&(!validAnswers(x.flow.kind,x.flow.answers)||questions[x.flow.kind].slice(0,x.flow.cursor).some(q=>x.flow!.answers[q.key]===undefined)))return false;
 if(x.ready&&(!answers(x.ready.answers)||typeof x.ready.date!=='string'||!completeAnswers('daily',x.ready.answers)))return false;
 if(x.feedback&&Object.entries(x.feedback).some(([key,rows])=>!['push','legs','core','cardio'].includes(key)||!Array.isArray(rows)||rows.length>10000||rows.some(r=>!Number.isFinite(r.at)||!Number.isFinite(r.effort)||r.effort<1||r.effort>10||typeof r.pain!=='boolean')))return false;
 return true;
}
export interface CoachPlan {decision:Decision;steps:Step[];reps:Record<string,number>}
export function choosePlan(profile:Answers,a:Answers,history:Session[],feedback:CoachState['feedback']={},now=Date.now()):CoachPlan {
 const stop=(reason:Text,state:Decision['state']='rest'):CoachPlan=>({decision:{state,reason,mode:'home',minutes:0},steps:[],reps:{}});
 if(a.symptoms==='yes')return stop(bi('تمرین نکن. این علائم نیاز به بررسی فوری دارند؛ با اورژانس محلی تماس بگیر.','Do not exercise. These symptoms need urgent assessment; contact local emergency services.'),'stop');
 if(profile.adult!=='yes'||profile.restriction!=='no')return stop(bi('این برنامه عمومی برای بزرگسال بدون محدودیت فعال است. درباره فعالیت مناسب با متخصص هماهنگ کن.','This general program is for adults without active restrictions. Discuss suitable activity with a professional.'));
 if(!completeAnswers('intake',profile)||!completeAnswers('daily',a))return stop(bi('ابتدا سؤال‌های باقی‌مانده را پاسخ بده.','Answer the remaining questions first.'));
 if(a.pain!=='no')return stop(bi('امروز با درد یا بیماری تمرین نکن. اگر ادامه داشت، ارزیابی بگیر.','Do not train through pain or illness. Seek assessment if it persists.'));
 const done=history.filter(x=>x.status!=='missed').sort((x,y)=>y.at-x.at),last=done[0];
 if(last&&(last.pain||(last.recovery??0)>=7)&&last.recovery!==2)return stop(bi('درد یا ریکاوری ضعیف قبلی هنوز رفع نشده؛ ابتدا وضعیت ریکاوری را ثبت کن.','Previous pain or poor recovery is unresolved; update recovery first.'));
 const missingRecovery=last&&last.date!==dayKey(new Date(now))&&last.recovery===undefined;
 if(missingRecovery)return stop(bi('ریکاوری جلسه قبل هنوز مشخص نیست. ابتدا آن را ثبت کن.','Recovery from the previous session is unknown. Record it first.'));
 const recovering=done.some(x=>now-x.at<48*3600000&&x.mode==='strength'),low=a.sleep==='low'||a.energy==='low'||(last?.recovery??0)>=5||last?.talk===false;
 const gentle=low||recovering||a.place==='outside'||profile.legs==='unknown'||a.minutes==='5';
 const hard=(group:string)=>feedback?.[group]?.at(-1)?.effort!>=8;
 const reps:Record<string,number>={};
 const push=profile.push==='unknown'?'wall':profile.push;
 const support=a.support;
 let pushId='push-'+push;
 if((push==='wall'&&support==='none')||(push==='incline'&&support!=='counter'))pushId='';
 let legId=profile.legs==='free'?'squat-free':support==='chair'?'squat-chair':'calf';
 if(hard('legs'))legId=support==='chair'?'squat-chair':'calf';
 const selected=gentle?[a.place==='outside'?'walk':'march','step-touch']: [legId,...(pushId?[pushId]:[]),profile.core==='yes'&&!hard('core')?'bridge':'march'];
 const first=!last||now-last.at>10*86400000;
 const budget=Math.min(Number(a.minutes),first?10:20,low?5:20,gentle?(Number(profile.cardio)||5):20)*60;
 const steps:Step[]=[];
 const run=!first&&!low&&!recovering&&profile.run==='yes'&&profile.cardio==='20'&&a.place==='outside'&&budget>=1200&&done.slice(0,3).length===3&&done.slice(0,3).every(x=>x.effort<=5&&!x.pain&&x.recovery===2)&&!hard('cardio');
 const add=(id:string,seconds:number,n?:number,phase:Step['phase']='work')=>{steps.push({title:movements[id].name,exercise:id,seconds,phase,...(n?{reps:n}:{}),note:bi(n?`${n} تکرار آرام؛ بقیه زمان استراحت. نفس را حبس نکن.`:'با سرعت راحت، بدون فشار.',n?`${n} slow repetitions; rest for the remaining time. Keep breathing.`:'Move comfortably, without strain.')});if(n)reps[id]=n;};
 const warm=budget<=300?120:300,cool=run?300:60;
 if(run)add('walk',warm,undefined,'warmup');
 else if(gentle){add(a.place==='outside'?'walk':'march',warm-30,undefined,'warmup');add('shoulder-roll',30,5,'warmup');}
 else{add('march',180,undefined,'warmup');add('shoulder-roll',60,10,'warmup');add(legId,30,2,'warmup');add(pushId||'march',30,pushId?2:undefined,'warmup');}
 let remaining=budget-warm-cool;
 let i=0;
 while(remaining>=60&&i<20){const id=run?(i%2===0?'jog':'walk'):selected[i%selected.length];const group=movements[id].group;
 const base=group==='push'?Math.max(2,Math.min(6,Number(profile.pushReps)||3)):5;
 const evidence=feedback?.[group]?.slice(-3)??[];
 const progress=evidence.length===3&&evidence.every(x=>!x.pain&&x.effort<=5)&&last?.recovery===2&&!first;
 const n=gentle?undefined:Math.max(2,base+(progress?1:0)-(hard(group)?2:0));
 add(id,run?60:45,n);if(!run)steps.push({title:bi('استراحت','Rest'),seconds:15,phase:'work'});remaining-=60;i++;}
 if(remaining>0)steps.push({title:bi('استراحت و تنفس راحت','Rest and breathe comfortably'),seconds:remaining});
 add('cooldown',cool,undefined,'cooldown');
 const reason=low?bi('خواب، انرژی یا ریکاوری پایین؛ امروز فقط حرکت راحت.','Low sleep, energy or recovery: comfortable movement today.'):recovering?bi('عضلات از جلسه قدرتی قبل در حال ریکاوری‌اند؛ امروز هوازی راحت.','Recovering from recent strength training: easy movement today.'):first?bi('شروع کنترل‌شده بر اساس توان گزارش‌شده؛ چند تکرار ذخیره نگه دار، بدون آزمون بیشینه.','A controlled start based on your reported ability; keep repetitions in reserve, with no maximum test.'):bi('بر اساس زمان، مکان، توان هر گروه و بازخورد جلسه‌های قبل.','Based on time, place, ability in each group and previous feedback.');
 return {decision:{state:first?'return':low?'reduce':'hold',mode:run?'run':gentle?(a.place==='outside'?'walk':'home'):'strength',minutes:steps.reduce((n,s)=>n+s.seconds,0)/60,reason},steps,reps};
}
export interface Movement {name:Text;group:'push'|'legs'|'core'|'cardio';start:Text;end:Text;avoid:Text}
const m=(name:Text,group:Movement['group'],start:Text,end:Text,avoid:Text):Movement=>({name,group,start,end,avoid});
export const movements:Record<string,Movement>={
 jog:m(bi('دویدن خیلی آرام','Very easy jog'),'cardio',bi('بعد از راه رفتن، در مسیر امن و هموار شروع کن.','After walking, start on a safe, level route.'),bi('گام کوتاه و آرام؛ اگر جمله کامل سخت شد راه برو.','Use short, easy strides; walk if full sentences become difficult.'),bi('برای سرعت تلاش نکن؛ با درد یا سرگیجه توقف کن.','Do not chase speed; stop with pain or dizziness.')),
 'push-wall':m(bi('شنا روی دیوار','Wall push-up'),'push',bi('رو به دیوار، کف دست‌ها هم‌ارتفاع شانه، پاها کمی عقب.','Face a wall, hands at shoulder height, feet a little back.'),bi('آرنج‌ها را خم کن، بدن یک‌تکه به دیوار نزدیک شود؛ آرام برگرد.','Bend elbows to bring your straight body toward the wall; press back gently.'),bi('کمر را گود نکن؛ دیوار خشک و دست‌ها ثابت.','Avoid arching your back; keep hands on a dry, stable wall.')),
 'push-incline':m(bi('شنا روی سطح بلند ثابت','Incline push-up'),'push',bi('دست‌ها روی سطح بلند محکم و ثابت؛ بدن از سر تا پاشنه هم‌راستا.','Hands on a fixed raised surface; align head, hips and heels.'),bi('سینه را به سطح نزدیک کن؛ با باز کردن آرنج‌ها برگرد.','Lower chest toward the surface, then press up.'),bi('میز لق، صندلی و سطح لغزنده مناسب نیست.','Do not use unstable tables, chairs or slippery surfaces.')),
 'push-knee':m(bi('شنا روی زانو','Knee push-up'),'push',bi('دست‌ها زیر شانه، زانوها روی زیرانداز؛ سر تا زانو یک خط.','Hands below shoulders, knees on a mat; head to knees in one line.'),bi('با خم کردن آرنج‌ها سینه را پایین ببر؛ به وضعیت شروع برگرد.','Bend elbows to lower your chest, then return to the start.'),bi('لگن عقب نرود و کمر گود نشود.','Do not sit hips back or let the lower back sag.')),
 'push-regular':m(bi('شنا معمولی','Regular push-up'),'push',bi('دست‌ها کمی بازتر از شانه، پنجه‌ها روی زمین؛ بدن صاف.','Hands slightly wider than shoulders, toes on floor; body straight.'),bi('سینه را با کنترل پایین بیاور و زمین را فشار بده تا بالا بیایی.','Lower your chest with control, then press the floor away.'),bi('قبل از افت فرم تمام کن؛ نفس را حبس نکن.','Stop before form breaks down; do not hold your breath.')),
 'squat-chair':m(bi('نشستن و برخاستن از صندلی','Chair squat'),'legs',bi('صندلی محکم بدون چرخ کنار دیوار؛ کف پاها روی زمین.','Use a stable, non-wheeled chair against a wall; feet flat.'),bi('با تمایل کم تنه رو به جلو بلند شو؛ آرام دوباره بنشین.','Lean slightly forward to stand, then sit down slowly.'),bi('خودت را روی صندلی رها نکن؛ زانوها هم‌جهت پنجه.','Do not drop onto the chair; knees follow the toes.')),
 'squat-free':m(bi('اسکوات بدون صندلی','Free squat'),'legs',bi('پاها حدود عرض شانه، وزن روی تمام کف پا.','Feet about shoulder width, weight across the whole foot.'),bi('لگن عقب و پایین، فقط تا عمق راحت؛ سپس بلند شو.','Move hips back and down to a comfortable depth, then stand.'),bi('پاشنه‌ها بلند نشوند؛ زانوها به داخل نریزند.','Keep heels down and knees from collapsing inward.')),
 bridge:m(bi('پل باسن','Glute bridge'),'core',bi('به پشت، زانوها خم و کف پاها روی زمین.','Lie on your back with bent knees and feet flat.'),bi('باسن را تا هم‌راستایی شانه، لگن و زانو بالا ببر؛ آرام پایین بیاور.','Lift hips until shoulders, hips and knees align; lower slowly.'),bi('با گود کردن کمر بالاتر نرو.','Do not lift higher by arching your back.')),
 calf:m(bi('بلند کردن پاشنه','Calf raise'),'legs',bi('صاف بایست؛ اگر تعادل مطمئن نیست، از دیوار کمک بگیر.','Stand tall; use a wall if balance is uncertain.'),bi('پاشنه‌ها را آهسته بالا ببر و پایین بیاور.','Slowly lift both heels, then lower them.'),bi('بدون جهش؛ اگر تعادل نداری انجام نده.','No bouncing; omit if you cannot balance safely.')),
 'heel-slide':m(bi('سر دادن پاشنه','Heel slide'),'core',bi('به پشت، زانوها خم، شکم به‌آرامی سفت.','Lie on your back with bent knees, gently brace your abdomen.'),bi('یک پاشنه را آرام جلو ببر و برگردان؛ سمت دیگر.','Slide one heel away and back; alternate sides.'),bi('کمر و لگن ثابت؛ دامنه بدون درد.','Keep pelvis steady and range pain-free.')),
 'bird-dog':m(bi('دست و پای مخالف','Bird dog'),'core',bi('چهاردست‌وپا، دست زیر شانه و زانو زیر لگن.','On all fours, hands under shoulders and knees under hips.'),bi('دست و پای مخالف را آرام دراز کن و برگردان؛ سمت دیگر.','Extend opposite arm and leg gently, return, and switch.'),bi('لگن نچرخد؛ در صورت دشواری فقط یک اندام را حرکت بده.','Do not twist hips; move only one limb if needed.')),
 'side-leg':m(bi('بالا بردن پا از کنار','Standing side leg raise'),'legs',bi('کنار دیوار بایست و برای تعادل دست بگذار.','Stand beside a wall and hold it for balance.'),bi('یک پا را کمی به کنار ببر و برگردان؛ سمت دیگر.','Lift one leg a little to the side and return; switch sides.'),bi('تنه خم نشود؛ پنجه رو به جلو.','Keep torso upright and toes pointing forward.')),
 'march':m(bi('راه رفتن درجا','March in place'),'cardio',bi('صاف بایست، اطراف پاها خالی باشد.','Stand tall with clear space around your feet.'),bi('پاها را یکی‌یکی کوتاه بالا بیاور؛ دست‌ها راحت حرکت کنند.','Lift feet alternately a little; swing arms comfortably.'),bi('بدون پرش؛ سرعتی که بتوانی جمله بگویی.','No jumping; keep a pace that allows full sentences.')),
 'walk':m(bi('راه رفتن راحت','Easy walking'),'cardio',bi('مسیر هموار و امن انتخاب کن.','Choose a safe, level route.'),bi('با گام کوتاه و سرعت راحت قدم بزن.','Walk with comfortable, short steps.'),bi('با سرگیجه یا درد متوقف شو.','Stop with dizziness or pain.')),
 'step-touch':m(bi('قدم به کنار','Side step and touch'),'cardio',bi('پاها نزدیک هم، زانوها نرم.','Feet close together, knees soft.'),bi('یک قدم به کنار، پای دیگر نزدیک؛ سپس برعکس.','Step sideways, bring the other foot close, then reverse.'),bi('پاها ضربدری نشوند؛ بدون پرش.','Do not cross feet; no jumping.')),
 'shoulder-roll':m(bi('چرخش آرام شانه','Gentle shoulder rolls'),'cardio',bi('صاف بایست یا بنشین؛ دست‌ها آزاد.','Stand or sit upright with arms relaxed.'),bi('شانه‌ها را آرام بالا، عقب و پایین بچرخان.','Gently roll shoulders up, back and down.'),bi('گردن را فشار نده؛ دایره کوچک و راحت.','Do not strain the neck; use small, comfortable circles.')),
 'cooldown':m(bi('آرام کردن و تنفس','Slow down and breathe'),'cardio',bi('سرعت حرکت را کم کن.','Reduce your pace.'),bi('چند قدم آرام، سپس تنفس طبیعی با شانه‌های راحت.','Take slow steps, then breathe normally with relaxed shoulders.'),bi('نفس را حبس نکن؛ با سرگیجه بنشین.','Do not hold your breath; sit down if dizzy.'))
};
