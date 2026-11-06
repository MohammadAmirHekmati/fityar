import {trainingPlan} from './trainingPlan.ts';
import {measuredLoad} from './trainingHistory.ts';
import {bi, dayKey, elapsed, actualSeconds} from './core.ts';
import type {Session, Step, Decision, Text, Active, Program, MuscleGroup, StopReason} from './core';
export type Answers=Record<string,string>;
export type FlowKind='intake'|'daily'|'post'|'recovery'|'adapt'|'stop';
export interface Flow {post?:Answers;kind:FlowKind;cursor:number;answers:Answers;baseline?:Answers;target?:string;date:string}
export interface CoachState {profile:Answers;flow?:Flow;draft?:Flow;ready?:{date:string;answers:Answers};feedback?:Record<string,{effort:number;pain:boolean;at:number}[]>}
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
 q('minutes','امروز چقدر وقت داری؟','How much time do you have today?',[['5','۵ دقیقه','5 minutes'],['10','۱۰ دقیقه','10 minutes'],['20','۲۰ دقیقه','20 minutes'],['30','۳۰ دقیقه','30 minutes'],['45','۴۵ دقیقه','45 minutes'],['60','۶۰ دقیقه','60 minutes']],bi('این سقف زمان است؛ وقت بیشتر تمرین را به‌زور طولانی‌تر نمی‌کند. مقدار دلخواه: ۵ تا ۱۲۰ دقیقه.','This is a time ceiling; extra free time does not force extra training. Custom: 5–120 minutes.')),
 q('place','برای تمرین به کجا دسترسی داری؟','Where can you exercise?',[['inside','داخل خانه','Indoors'],['outside','بیرون، مسیر امن','Outside, on a safe route'],['both','هر دو؛ خانه و بیرون','Both indoors and outside']]),
 q('support','چه تکیه‌گاهی در دسترس است؟','What stable support is available?',[['none','هیچ‌کدام','None'],['wall','دیوار','Wall'],['chair','دیوار و صندلی ثابت','Wall and stable chair'],['counter','دیوار و سطح بلند ثابت','Wall and fixed raised surface']],bi('صندلی چرخ‌دار، میز لق و وسایل لغزنده مناسب نیستند.','Do not use wheeled chairs, unstable tables or slippery supports.'))],
 post:[q('effort','این جلسه چقدر سخت بود؟','How hard was this session?',[['3','راحت — ۳ از ۱۰','Easy — 3 out of 10'],['5','متوسط — ۵ از ۱۰','Moderate — 5 out of 10'],['8','سخت — ۸ از ۱۰','Hard — 8 out of 10']]),q('talk','می‌توانستی یک جمله کامل بگویی؟','Could you speak a full sentence?',[['yes','بله','Yes'],['no','نه','No']]),q('pain','در طول جلسه درد داشتی؟','Did you have pain during the session?',[['no','نه','No'],['yes','بله','Yes']]),q('group','کدام بخش بیشتر نیاز به سبک‌تر شدن دارد؟','Which part needs to be easier next time?',[['none','هیچ‌کدام','None'],['push','دست و سینه','Arms and chest'],['legs','پا','Legs'],['core','میان‌تنه','Core'],['back','پشت و کتف','Back and shoulder blades'],['cardio','راه رفتن یا هوازی','Walking or cardio']])],
 recovery:[q('recovery','بعد از جلسه قبل چطور هستی؟','How do you feel after your last session?',[['2','راحت و سرحال','Comfortable and recovered'],['5','کمی کوفتگی یا خستگی','Some soreness or fatigue'],['8','درد یا خستگی زیاد','Pain or substantial fatigue']])],
 stop:[q('reason','علت پایان یا نوع این ثبت چه بود؟','What happened in this session?',[
 ['time','وقت کم آوردم؛ مشکل بدنی نداشتم','Ran out of time; no physical difficulty'],
 ['test','فقط اپ را امتحان کردم؛ تمرین نکردم','Only tested the app; did not exercise'],
 ['accidental','اشتباهی تمام کردم یا منصرف شدم','Ended accidentally or changed my mind'],
 ['fatigue','به خاطر خستگی یا سختی زیاد','Fatigue or excessive difficulty'],
 ['pain','به خاطر درد یا علائم غیرعادی','Pain or unusual symptoms'],
 ['other','علت دیگر یا هنوز مطمئن نیستم','Other reason or unsure']]),
 q('activity','در آن جلسه واقعاً چه مقدار تمرین انجام شد؟','What did you actually do in that session?',[
 ['none','هیچ تمرینی انجام ندادم','No exercise'],['warmup','فقط گرم‌کردن؛ وارد ست‌های اصلی نشدم','Warm-up only; no main sets'],['main','بخشی از تمرین اصلی را انجام دادم','Some main work'],['unknown','دقیق یادم نیست','I do not remember']])],
 adapt:[q('reason','چه چیزی امروز مناسب نیست؟','What does not suit you today?',[['pain','درد یا ناخوشی','Pain or illness'],['time','وقت کمتر دارم','Less time'],['equipment','تکیه‌گاه ندارم','No support available'],['unfamiliar','حرکت‌ها را نمی‌شناسم','Unfamiliar movements']])]
};
export const flowQuestions=(f:Flow)=>f.kind==='stop'&&(f.target==='active'||f.answers.reason==='test')?questions.stop.slice(0,1):questions[f.kind];
export const newFlow=(kind:FlowKind,target?:string):Flow=>({kind,cursor:0,answers:{},date:dayKey(),...(target?{target}:{})});
export const validAnswer=(q:Question,value:string)=>q.key==='minutes'?/^\d+$/.test(value)&&Number(value)>=5&&Number(value)<=120:q.options.some(o=>o.id===value);
export const flowChanged=(f:Flow)=>JSON.stringify(Object.entries(f.answers).sort())!==JSON.stringify(Object.entries(f.baseline??{}).sort());
export function leaveFlow(c:CoachState,saveDraft=false):CoachState{return {...c,flow:undefined,draft:saveDraft?c.flow:c.draft};}
export function answerFlow(flow:Flow,value:string):Flow {
 const list=flowQuestions(flow),question=list[flow.cursor];
 if(!question||!validAnswer(question,value))throw Error('Invalid answer');
 const answers=Object.fromEntries(list.slice(0,flow.cursor).filter(x=>flow.answers[x.key]!==undefined).map(x=>[x.key,flow.answers[x.key]]));
 answers[question.key]=value;
 return {...flow,answers,cursor:flow.cursor+1};
}
export function completeAnswers(kind:FlowKind,a:Answers){return questions[kind].every(q=>validAnswer(q,a[q.key]));}
export function validateCoach(c:unknown):boolean {
 if(!c||typeof c!=='object')return false;
 const x=c as CoachState,answers=(a:unknown)=>!!a&&typeof a==='object'&&!Array.isArray(a)&&Object.entries(a).length<=30&&Object.values(a).every(v=>typeof v==='string'&&v.length<100);
 if(!answers(x.profile))return false;
 const validAnswers=(kind:FlowKind,a:Answers)=>Object.entries(a).every(([key,value])=>questions[kind].some(q=>q.key===key&&validAnswer(q,value)));
 if(!validAnswers('intake',x.profile))return false;
 if(x.flow){const f=x.flow;if(!questions[f.kind]||!Number.isInteger(f.cursor)||f.cursor<0||f.cursor>flowQuestions(f).length||!answers(f.answers)||typeof f.date!=='string'||(f.target!==undefined&&typeof f.target!=='string'))return false;}
 if(x.flow&&(!validAnswers(x.flow.kind,x.flow.answers)||flowQuestions(x.flow).slice(0,x.flow.cursor).some(q=>x.flow!.answers[q.key]===undefined)))return false;
 if(x.flow?.post&&(!answers(x.flow.post)||!completeAnswers('post',x.flow.post)))return false;
 if(x.flow?.baseline&&(!answers(x.flow.baseline)||!validAnswers(x.flow.kind,x.flow.baseline)))return false;
 if(x.draft&&!validateCoach({...x,flow:x.draft,draft:undefined}))return false;
 if(x.ready&&(!answers(x.ready.answers)||typeof x.ready.date!=='string'||!completeAnswers('daily',x.ready.answers)))return false;
 if(x.feedback&&Object.entries(x.feedback).some(([key,rows])=>!['push','legs','core','back','cardio'].includes(key)||!Array.isArray(rows)||rows.length>10000||rows.some(r=>!Number.isFinite(r.at)||!Number.isFinite(r.effort)||r.effort<1||r.effort>10||typeof r.pain!=='boolean')))return false;
 return true;
}
export interface CoachPlan {program?:Program;name?:Text;weekly?:Text;nextMain?:Text;decision:Decision;steps:Step[];reps:Record<string,number>}
export function performedGroups(active:Active,now:number):Movement['group'][] {
 return Object.entries(measuredLoad(active,movements,now).groups).filter(([,seconds])=>seconds>0).map(([group])=>group as MuscleGroup);
}
export function recordSession(active:Active,answers:Answers,at:number,stopReason?:StopReason):Session {
 const seconds=actualSeconds(active,at),duration=active.steps.reduce((n,x)=>n+x.seconds,0);
 return {id:String(at),date:dayKey(new Date(at)),at,mode:active.decision.mode,minutes:Math.round(seconds/6)/10,planned:duration/60,
 effort:Number(answers.effort),pain:answers.pain==='yes'||stopReason==='pain',talk:answers.talk==='yes',
 status:active.skipped.length||elapsed(active,at)<duration?'partial':'complete',reason:active.decision.reason,before:active.before,
 stopReason,activity:stopReason==='test'?'none':undefined,load:performedLoad(active,at),program:active.program};
}
export function choosePlan(profile:Answers,a:Answers,history:Session[],feedback:CoachState['feedback']={},now=Date.now()):CoachPlan {
 const stop=(reason:Text,state:Decision['state']='rest'):CoachPlan=>({decision:{state,reason,mode:'home',minutes:0},steps:[],reps:{}});
 if(a.symptoms==='yes')return stop(bi('تمرین نکن. این علائم نیاز به بررسی فوری دارند؛ با اورژانس محلی تماس بگیر.','Do not exercise. These symptoms need urgent assessment; contact local emergency services.'),'stop');
 if(profile.adult!=='yes'||profile.restriction!=='no')return stop(bi('این برنامه عمومی برای بزرگسال بدون محدودیت فعال است. درباره فعالیت مناسب با متخصص هماهنگ کن.','This general program is for adults without active restrictions. Discuss suitable activity with a professional.'));
 if(!completeAnswers('intake',profile)||!completeAnswers('daily',a))return stop(bi('ابتدا سؤال‌های باقی‌مانده را پاسخ بده.','Answer the remaining questions first.'));
 if(a.pain!=='no')return stop(bi('امروز با درد یا بیماری تمرین نکن. اگر ادامه داشت، ارزیابی بگیر.','Do not train through pain or illness. Seek assessment if it persists.'));
 return trainingPlan(profile,a,history,feedback,movements,now);
}

export interface Movement {name:Text;group:MuscleGroup;start:Text;end:Text;avoid:Text}
const m=(name:Text,group:Movement['group'],start:Text,end:Text,avoid:Text):Movement=>({name,group,start,end,avoid});
export const performedLoad=(active:Active,now:number)=>measuredLoad(active,movements,now);
export const movements:Record<string,Movement>={
 'back-squeeze':m(bi('جمع‌کردن آرام کتف‌ها','Gentle shoulder-blade squeeze'),'back',bi('صاف بایست، آرنج‌ها کنار بدن و کمی خم؛ شانه‌ها پایین.','Stand tall, elbows beside the body and slightly bent; shoulders down.'),bi('کتف‌ها را آرام به هم نزدیک کن، ۲ ثانیه نگه دار و رها کن. این تمرین کنترل پشت است، نه جایگزین پارویی با مقاومت.','Gently bring shoulder blades together, hold 2 seconds, then release. This trains back control, not a replacement for resisted rows.'),bi('کمر را گود نکن؛ گردن و شانه را فشار نده.','Do not arch the back or strain neck and shoulders.')),
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
