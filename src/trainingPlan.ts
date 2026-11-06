import {alternatives,held,sideHold} from './exerciseInfo.ts';
import {bi} from './core.ts';
import type {Session,Step,Text,Program} from './core';
import type {Answers,CoachPlan,CoachState,Movement} from './coach';
import {clarificationNeeded,recoveryNeeded,trainingEvidence,exposure} from './trainingHistory.ts';

// Fixed sessions, not a loop filling the user's free minutes. Stage advances only
// after recovered, completed, meaningful work and elapsed training weeks.
export function trainingPlan(profile:Answers,a:Answers,history:Session[],feedback:CoachState['feedback'],moves:Record<string,Movement>,now:number,skills:Answers={},swaps:Record<string,string>={}):CoachPlan {
 const e=trainingEvidence(history,now),available=Number(a.minutes),floor=profile.core==='yes';
 const variant=e.strength.length%2?'B':'A';
 const week=Math.min(4,e.weeks),reps:Record<string,number>={};
 const templateName=bi(`قدرتی ${variant} · هفته ${week}`,`Strength ${variant} · week ${week}`);
 const strengthNext=bi(`برنامه اصلی بعدی: قدرتی ${variant}، حرکت‌ها و ست‌های متناسب توان و تکیه‌گاه در دسترس؛ پس از ریکاوری و بررسی همان روز.`,`Next main session: Strength ${variant}, movements and sets matched to reported ability and available support, after recovery and that day's check.`);
 const weekly=bi('الگوی هفته: ۲ روز قدرتی غیرپیاپی؛ بین آن‌ها پیاده‌روی متناسب توان یا استراحت. هفته ۱ آشنایی؛ هفته ۲ تثبیت؛ هفته ۳ و ۴ فقط با سابقه راحت و ریکاوری، یک گام پیشرفت.','Weekly pattern: 2 nonconsecutive strength days; comfortable walking or rest between them. Week 1 familiarization, week 2 consistency; weeks 3–4 progress one step only with easy completed work and recovery.');
 const result=(steps:Step[],reason:Text,kind:Program['kind'],name:Text,mode:'strength'|'home'|'walk'|'run',state:'hold'|'reduce'|'rest'|'progress'='hold'):CoachPlan=>({
  steps,reps,decision:{state,mode,reason,minutes:steps.reduce((n,x)=>n+x.seconds,0)/60},program:{id:`${kind}-${variant}`,week,kind},name,weekly,nextMain:strengthNext,
 });
 const blocked=(reason:Text)=>result([],reason,'recovery',bi('ابتدا روشن‌کردن وضعیت قبلی','Clarify the previous session first'),'home','rest');
 if(e.unresolvedPain)return blocked(bi('درد یا ریکاوری نامناسب قبلی هنوز رفع نشده است. ریکاوری همان جلسه را ثبت یا پاسخ اشتباه را اصلاح کن؛ با درد تمرین نکن.','Previous pain or poor recovery is unresolved. Update that session’s recovery or correct an incorrect answer; do not exercise through pain.'));
 if(clarificationNeeded(history,now))return blocked(bi('علت توقف جلسه قبلی مشخص نیست؛ ناتمام‌بودن به‌تنهایی نشانه ضعف نیست. علت و بخش واقعاً انجام‌شده را مشخص کن.','The previous stop reason is unknown; partial completion alone is not low ability. Clarify why it stopped and what you actually did.'));
 if(recoveryNeeded(history,now))return blocked(bi('برای فعالیت واقعاً ثبت‌شده قبلی، وضعیت ریکاوری لازم است. این محدودیت از زمان برنامه‌ریزی‌شده ساخته نشده است.','Recovery is needed for the activity actually recorded previously, not its planned duration.'));
 const outdoor=a.place==='outside',both=a.place==='both';
 const step=(id:string,seconds:number,phase:Step['phase']='work',n?:number,location:Step['location']=outdoor?'outside':'inside'):Step=>({exercise:id,title:moves[id].name,seconds,phase,location,...(n?{reps:n}:{}),note:bi(n?`${n} تکرار آرام با چند تکرار ذخیره؛ زمان باقی‌مانده استراحت. در حرکات یک‌طرفه تعداد کل، نصف هر سمت است.`:'با سرعت راحت و امکان گفتن یک جمله؛ تایمر تعداد تکرار انجام‌شده را تشخیص نمی‌دهد.',n?`${n} controlled reps with some in reserve; rest for the remaining window. For alternating moves, this is the total, half per side.`:'Keep a comfortable pace and full sentences; the timer does not detect completed repetitions.')});
 const recoveryReasons:Text[]=[];
 if(a.sleep==='low')recoveryReasons.push(bi('خواب کم یا نامناسب امروز','Today’s short or poor sleep'));
 if(a.energy==='low')recoveryReasons.push(bi('انرژی کم امروز','Today’s low energy'));
 if(e.fatigue)recoveryReasons.push(bi('خستگی واقعی یا سختی ثبت‌شده قبلی هنوز بهبود نیافته','Recorded fatigue or high exertion has not recovered'));
 if(e.loaded.length)recoveryReasons.push(bi('ست‌های قدرتی واقعاً انجام‌شده در ۴۸ ساعت اخیر؛ به همان عضلات فرصت ریکاوری بده','Actual strength-set exposure in the last 48 hours; allow those muscles to recover'));
 const cardioComfort=Number(profile.cardio)||5;
 if(recoveryReasons.length){
  const minutes=Math.min(available,cardioComfort,10),warm=Math.min(120,minutes*60*.3),cool=60;
  const steps=[step(outdoor?'walk':'march',warm,'warmup'),step(outdoor?'walk':'step-touch',minutes*60-warm-cool),step('cooldown',cool,'cooldown')];
  return result(steps,bi(recoveryReasons.map(x=>x.fa).join('؛ ')+'؛ این روز ریکاوری است. حرکت راحت اختیاری است و می‌توانی استراحت کنی.',recoveryReasons.map(x=>x.en).join('; ')+'. This is a recovery day. Comfortable movement is optional; rest is also an option.'),'recovery',bi('روز ریکاوری','Recovery day'),outdoor?'walk':'home','reduce');
 }
 if(available<10){
  const total=available*60,warm=Math.min(120,total*.3);
  return result([step(outdoor?'walk':'march',warm,'warmup'),step(outdoor?'walk':'step-touch',total-warm-60),step('cooldown',60,'cooldown')],bi('وقت اعلام‌شده کمتر از ۱۰ دقیقه است؛ این یک فرصت کوتاه حرکت است. برای برنامه اصلی، زمان روز را اصلاح کن.','Declared availability is under 10 minutes: this is a short movement break. Edit today’s time for a main session.'),'short',bi('فرصت کوتاه حرکت','Short movement break'),outdoor?'walk':'home');
 }
 const recentCardio=e.completed.filter(s=>exposure(s).groups.cardio>=600);
 const canRun=profile.run==='yes'&&profile.cardio==='20'&&recentCardio.length>=2;
 const cardio=(minutes:number,mixed=false):Step[]=>{
  const run=canRun&&minutes>=20;
  const warm=run?300:120,cool=run?300:120;
  const first=step(outdoor||mixed?'walk':'march',warm,'warmup',undefined,outdoor||mixed?'outside':'inside');
  if(mixed){first.transition=true;first.note=bi('پس از رسیدن به مسیر امن، ادامه را بزن؛ زمان جابه‌جایی تمرین حساب نمی‌شود.','Press continue once on a safe route; transfer time is not exercise time.');}
  const out=[first];let remaining=minutes*60-warm-cool;
  if(run){while(remaining>=150){out.push(step('jog',60,'work',undefined,'outside'),step('walk',90,'work',undefined,'outside'));remaining-=150;}}
  if(remaining>0)out.push(step(outdoor||mixed?'walk':'step-touch',remaining,'work',undefined,outdoor||mixed?'outside':'inside'));
  out.push(step('cooldown',cool,'cooldown',undefined,outdoor||mixed?'outside':'inside'));return out;
 };
 if(outdoor){
  const minutes=Math.min(available,cardioComfort,canRun?25:20);
  return result(cardio(minutes),bi('قالب هوازی متناسب توان راه‌رفتن گزارش‌شده؛ دویدن فقط با تجربه و سابقه هوازی راحت و ریکاوری. جلسه کوتاه قبلی سقف این برنامه نیست.','Aerobic template uses reported walking comfort; jogging requires experience and recovered easy cardio history. A previous short plan does not cap this session.'),'cardio',canRun&&minutes>=20?bi('هوازی راه‌رفتن / دویدن','Walk–run session'):bi('جلسه پیاده‌روی','Walking session'),canRun&&minutes>=20?'run':'walk');
 }
 let push=profile.push==='unknown'?'wall':profile.push;
 if(!floor&&['knee','regular'].includes(push))push='wall';
 const support=a.support;
 const pushId=push==='wall'&&support==='none'||push==='incline'&&support!=='counter'?'':'push-'+push;
 const legs=profile.legs==='free'?'squat-free':support==='chair'?'squat-chair':'calf';
 const front=variant==='A'?(skills.dynamic==='dead-bug'?'dead-bug':'heel-slide'):['knee','full'].includes(skills.plank)?'plank-'+skills.plank:'bird-dog';
 const side=['knee','full'].includes(skills.side)?'side-plank-'+skills.side:front==='bird-dog'?'heel-slide':'bird-dog';
 const selected=[legs,...(pushId?[pushId]:[]),...(floor?['bridge','back-squeeze',front,side]:['back-squeeze','calf'])];
 const ids=selected.map(id=>swaps[id]&&alternatives(id,profile,a,skills).includes(swaps[id])?swaps[id]:id).filter((id,i,arr)=>arr.indexOf(id)===i);
 if(variant==='B')ids.reverse();
 const capable=profile.legs==='free'&&profile.push!=='unknown'&&profile.pushReps!=='unknown'&&floor&&!!pushId;
 const mixed=both&&capable&&available>=30&&cardioComfort>=10;
 const strengthBudget=mixed?Math.min(26,available-10):Math.min(available,capable?(e.stage===2?38:26):18);
 const warm=strengthBudget<15?120:300,cool=strengthBudget<15?60:120;
 const sets=capable&&strengthBudget>=20?(e.stage===2&&strengthBudget>=34?3:2):1;
 const workSeconds=strengthBudget<20?40:45;
 const restSeconds=Math.max(15,Math.min(45,Math.floor((strengthBudget*60-warm-cool)/(ids.length*sets)-workSeconds)));
 const steps:Step[]=warm===120?[step('march',90,'warmup'),step('shoulder-roll',30,'warmup',4)]:[step('march',180,'warmup'),step('shoulder-roll',60,'warmup',8),step(legs,30,'warmup',2),step(pushId||'back-squeeze',30,'warmup',2)];
 for(let set=0;set<sets;set++)for(const id of ids){
  const group=moves[id].group,hard=(feedback?.[group]?.at(-1)?.effort??0)>=8;
  let n=group==='push'?Math.max(2,Math.min(6,(Number(profile.pushReps)||3)-2)):['bird-dog','heel-slide','dead-bug'].includes(id)?6:8;
  if(e.stage===1&&!hard)n+=group==='push'?1:2;
  if(hard)n=Math.max(2,n-2);
  const seconds=held(id)?(sideHold(id)?25:15):workSeconds;
  const movement=step(id,seconds,'work',held(id)?undefined:n,'inside');
  if(held(id))movement.note=sideHold(id)?bi('۱۰ ثانیه هر سمت؛ ۵ ثانیه برای تغییر سمت. با افت فرم زودتر استراحت کن.','10 seconds per side; 5 seconds to switch. Rest early if form changes.'):bi('۱۵ ثانیه با تنفس طبیعی؛ با افت فرم زودتر استراحت کن.','15 seconds with normal breathing; rest early if form changes.');
  else reps[id]=n;
  steps.push(movement,{title:bi('استراحت بین ست‌ها','Rest between sets'),seconds:restSeconds+workSeconds-seconds,phase:'work',location:'inside'});
 }
 steps.push(step('cooldown',cool,'cooldown',undefined,'inside'));
 if(mixed){const spare=Math.min(cardioComfort,Math.floor(available-steps.reduce((n,x)=>n+x.seconds,0)/60),20);steps.push(...cardio(spare,true));}
 const reason=bi(`قالب ${variant}: ${sets} ست هدفمند از حرکت‌های سازگار با توان و امکانات امروز، با استراحت مشخص. مرحله ${e.stage+1} با ${e.strength.length} جلسه قدرتی مؤثر و ریکاوری‌شده تعیین شده؛ سقف جلسه کوتاه قبلی ارث نمی‌رسد.`,
  `Template ${variant}: ${sets} structured sets of movements matched to today’s ability and support, with explicit rests. Stage ${e.stage+1} is based on ${e.strength.length} meaningful recovered strength sessions; previous short planned durations are not inherited.`);
 return result(steps,reason,mixed?'mixed':strengthBudget<20?'short':'strength',strengthBudget<20?bi('قالب قدرتی کوتاه متناسب وقت یا توان','Compact strength template for time or ability'):templateName,'strength',e.stage?'progress':'hold');
}
