import {clarificationNeeded,recoveryNeeded,trainingEvidence,correctSession} from './trainingHistory';
import type {StopReason,Session} from './core';
import AudioControls from './AudioControls';
import React,{useEffect,useState} from 'react';
import {View,Text,Pressable,BackHandler,Alert,TextInput} from 'react-native';
import type {State} from './model';
import {dayKey,elapsed,names,numericText} from './core';
import {answerFlow,choosePlan,completeAnswers,movements,newFlow,flowQuestions,performedGroups,recordSession,validAnswer,flowChanged,leaveFlow} from './coach';
import type {CoachState,FlowKind} from './coach';
import MovementView from './MovementView';
const emptyCoach:CoachState={profile:{}};
type Props={s:State;update:(patch:Partial<State>)=>void;library?:boolean;onNavigate?:()=>void};
export default function Coach({s,update,library=false,onNavigate}:Props){
 const [now,setNow]=useState(()=>Date.now()),[selected,select]=useState(''),[expanded,expand]=useState(false);
 const [custom,setCustom]=useState('');
 useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(timer);},[]);
 useEffect(()=>{onNavigate?.();},[selected,onNavigate]);
 const c:CoachState=s.coach??emptyCoach,f=c.flow,fa=s.lang==='fa',t=(a:string,b:string)=>fa?a:b;
 const ink=s.dark?'#edf5f3':'#16372e',card=s.dark?'#1b2b33':'#ffffff',muted=s.dark?'#b6c7c8':'#4a6560';
 const txt=(value:string,size=17,color=ink)=><Text style={{color,fontSize:size,lineHeight:size*1.5,textAlign:fa?'right':'left',writingDirection:fa?'rtl':'ltr'}}>{value}</Text>;
 const button=(label:string,action:()=>void,secondary=false)=><Pressable accessibilityRole="button" onPress={action} style={{minHeight:52,padding:15,borderRadius:15,borderWidth:1,borderColor:secondary?'#6b8580':'#b9ec85',backgroundColor:secondary?card:'#b9ec85',justifyContent:'center'}}><Text style={{fontSize:17,fontWeight:'600',color:secondary?ink:'#16372e',textAlign:'center'}}>{label}</Text></Pressable>;
 const box=(content:React.ReactNode)=><View style={{padding:20,borderRadius:24,backgroundColor:card,gap:16}}>{content}</View>;
 const patch=(value:Partial<CoachState>)=>update({coach:{...c,...value}});
 const begin=(kind:FlowKind,target?:string)=>patch({flow:newFlow(kind,target)});
 const back=()=>{if(f&&f.cursor>0)patch({flow:{...f,cursor:f.cursor-1}});};
 const exit=()=>{if(!f)return;if(!flowChanged(f)){update({coach:leaveFlow(c)});return;}Alert.alert(t('خروج از بررسی؟','Leave this check?'),t('پاسخ‌های تأییدنشده، برنامه و سابقه قبلی را تغییر نمی‌دهند.','Unconfirmed answers do not change your previous plan or history.'),[{text:t('ادامه بررسی','Continue editing'),style:'cancel'},{text:t('ذخیره برای بعد','Save for later'),onPress:()=>update({coach:leaveFlow(c,true)})},{text:t('کنار گذاشتن تغییرات','Discard changes'),style:'destructive',onPress:()=>update({coach:leaveFlow(c)})}]);};
 useEffect(()=>{const listener=BackHandler.addEventListener('hardwareBackPress',()=>{if(!f)return false;if(f.cursor>0)back();else exit();return true;});return()=>listener.remove();});
 const clarification=clarificationNeeded(s.sessions,now),recovery=recoveryNeeded(s.sessions,now);
 const painRecord=trainingEvidence(s.sessions,now).unresolvedPain;
 const last=s.sessions.filter(x=>x.status!=='missed').sort((a,b)=>b.at-a.at)[0];
 const saveResult=(answers:Record<string,string>,stopReason?:StopReason)=>{
  if(!s.active)return;
  const record=recordSession(s.active,answers,now,stopReason),feedback={...c.feedback};
  if(stopReason!=='test')for(const g of performedGroups(s.active,now))feedback[g]=[...(feedback[g]??[]),{at:now,effort:answers.group===g||stopReason==='fatigue'?8:record.effort,pain:record.pain}];
  update({sessions:[record,...s.sessions],active:null,coach:{...c,flow:undefined,draft:c.draft?.kind==='post'||c.draft?.kind==='stop'?undefined:c.draft,ready:undefined,feedback}});
 };
 const finishFlow=()=>{
  if(!f)return;
  const draft=c.draft?.kind===f.kind?undefined:c.draft;
  if(f.kind==='intake'){update({onboard:true,coach:{...c,profile:f.answers,flow:undefined,draft,ready:undefined}});return;}
  if(f.kind==='daily'){patch({ready:{date:dayKey(),answers:f.answers},flow:undefined,draft});return;}
  if(f.kind==='recovery'){update({sessions:s.sessions.map(x=>x.id===f.target?{...x,recovery:Number(f.answers.recovery)}:x),coach:{...c,flow:undefined,ready:undefined}});return;}
  if(f.kind==='adapt'){
   const a={...c.ready!.answers},reason=f.answers.reason;
   if(reason==='pain')a.pain='yes';if(reason==='time')a.minutes='5';if(reason==='equipment')a.support='none';if(reason==='unfamiliar'){a.energy='low';a.place='inside';}
   patch({ready:{date:dayKey(),answers:a},flow:undefined});return;
  }
  if(f.kind==='post'&&s.active){
   const duration=s.active.steps.reduce((n,x)=>n+x.seconds,0);
   if(s.active.skipped.length||elapsed(s.active,now)<duration){patch({flow:{...newFlow('stop','active'),post:f.answers}});return;}
   saveResult(f.answers);return;
  }
  if(f.kind==='stop'){
   const reason=f.answers.reason as StopReason;
   if(f.target==='active'&&s.active&&f.post){saveResult(f.post,reason);return;}
   update({sessions:s.sessions.map(x=>x.id===f.target?correctSession(x,reason,f.answers.activity as Session['activity']):x),
    coach:{...c,flow:undefined,draft,feedback:reason==='test'?Object.fromEntries(Object.entries(c.feedback??{}).map(([g,rows])=>[g,rows.filter(row=>row.at!==s.sessions.find(x=>x.id===f.target)?.at)])):c.feedback}});
  }
 };
 if(library)return box(<>{txt(t('کتابخانه حرکت‌ها','Movement library'),26)}{txt(t('هر حرکت روش و تصویر خودش را دارد. توان یک حرکت به بقیه تعمیم داده نمی‌شود.','Each movement has its own instructions and images. Ability in one does not imply ability in others.'),15,muted)}{selected?<>{button(t('بازگشت به فهرست','Back to list'),()=>select(''),true)}{txt(movements[selected].name[s.lang],24)}<MovementView id={selected} lang={s.lang} ink={ink} details/></>:Object.entries(movements).map(([id,m])=><View key={id}>{button(m.name[s.lang],()=>select(id),true)}</View>)}</>);
 if(f){
  if(f.kind==='daily'&&f.date!==dayKey())return box(<>{txt(t('این بررسی برای روز دیگری بود؛ حال امروز را دوباره بررسی کنیم.','This check was for a different day; let’s check how you feel today.'))}{button(t('بررسی امروز','Check today'),()=>begin('daily'))}{button(t('خروج از بررسی','Exit check'),exit,true)}</>);
  const list=flowQuestions(f),q=list[f.cursor];
  const safety=f.kind==='daily'&&(f.answers.symptoms==='yes'||f.answers.pain==='yes');
  if(safety)return box(<>{txt(t('امروز اول مراقبت','Care comes first today'),26)}{txt(f.answers.symptoms==='yes'?t('تمرین نکن. درد قفسه سینه، احساس غش یا تنگی نفس شدید نیاز به بررسی فوری دارد؛ با اورژانس محلی تماس بگیر.','Do not exercise. Chest pain, feeling faint or severe breathlessness needs urgent assessment; contact local emergency services.'):t('با درد یا بیماری تمرین نکن. اگر ادامه داشت، ارزیابی حرفه‌ای بگیر.','Do not train through pain or illness. Seek assessment if it persists.'))}{button(t('اصلاح پاسخ','Edit answer'),back,true)}{button(t('بستن بررسی','Close check'),exit,true)}</>);
  return box(<>{txt(t('قدم به قدم','One step at a time'),15,muted)}{txt(`${Math.min(f.cursor+1,list.length)} / ${list.length}`,15,muted)}
   {button(t('خروج از بررسی','Exit check'),exit,true)}
   {q?<>{txt(q.title[s.lang],25)}{q.hint&&txt(q.hint[s.lang],15,muted)}{q.options.map(o=><View key={o.id}>{button((f.answers[q.key]===o.id?'✓ ':'')+o.label[s.lang],()=>patch({flow:answerFlow(f,o.id)}),true)}</View>)}{q.key==='minutes'&&<>{txt(t('زمان دلخواه (۵ تا ۱۲۰ دقیقه)','Custom time (5–120 minutes)'))}<TextInput accessibilityLabel="Custom minutes" keyboardType="number-pad" value={custom} onChangeText={v=>setCustom(numericText(v))} style={{color:ink,borderWidth:1,borderColor:muted,borderRadius:12,padding:15,fontSize:20}}/>{button(t('ثبت زمان دلخواه','Use custom time'),()=>{if(validAnswer(q,custom))patch({flow:answerFlow(f,custom)});else Alert.alert(t('عدد صحیح ۵ تا ۱۲۰ وارد کن','Enter a whole number from 5 to 120'));},true)}</>}</>:<>{txt(t('پاسخ‌ها آماده‌اند','Your answers are ready'),25)}{list.map(q=><View key={q.key}>{txt(q.title[s.lang],14,muted)}{txt(q.options.find(o=>o.id===f.answers[q.key])?.label[s.lang]??f.answers[q.key]??'—')}</View>)}{button(t('تأیید و ادامه','Confirm and continue'),finishFlow)}</>}
   {f.cursor>0&&button(t('برگشت و ویرایش','Back and edit'),back,true)}
   {txt(t('پیشرفت ذخیره می‌شود؛ می‌توانی برنامه را ببندی و بعد ادامه بدهی.','Progress is saved; you can close the app and continue later.'),13,muted)}
  </>);
 }
 if(s.active){
  const a=s.active,seconds=elapsed(a,now),total=a.steps.reduce((n,x)=>n+x.seconds,0);
  const ends=a.steps.map((_,i)=>a.steps.slice(0,i+1).reduce((n,x)=>n+x.seconds,0));
  const index=ends.findIndex(end=>seconds<end),end=ends[index]??total,step=a.steps[index];
  const transition=!!step?.transition&&!a.transitions?.includes(index);
  const pause=()=>update({active:{...a,elapsed:seconds,started:now,paused:transition?false:!a.paused,...(transition?{transitions:[...(a.transitions??[]),index]}:{})}});
  const result=()=>update({active:{...a,elapsed:seconds,started:now,paused:true},coach:{...c,flow:c.draft&&(c.draft.kind==='post'||c.draft.kind==='stop'&&c.draft.target==='active')?c.draft:newFlow('post'),draft:c.draft?.kind==='post'||c.draft?.kind==='stop'&&c.draft.target==='active'?undefined:c.draft}});
  return box(<>{txt(t('جلسه امروز','Today’s session'),15,muted)}{txt(step?(step.phase==='warmup'?t('گرم‌کردن','Warm-up'):step.phase==='cooldown'?t('سردکردن','Cool-down'):t('تمرین','Exercise')):t('جلسه تمام شد','Session finished'),24)}
   {step?<>{txt(step.title[s.lang],27)}{txt(`${Math.max(0,Math.ceil(end-seconds))} ${t('ثانیه','seconds')}`,34)}{txt(`${index+1} / ${a.steps.length}`,14,muted)}{step.note&&txt(step.note[s.lang])}
   {step.phase==='work'&&step.exercise&&txt(`${t('ست / بازه','Set / interval')} ${a.steps.slice(0,index+1).filter(x=>x.phase==='work'&&x.exercise).length} / ${a.steps.filter(x=>x.phase==='work'&&x.exercise).length}`,16,muted)}
   {step.location&&txt(step.location==='inside'?t('مکان: داخل خانه','Location: indoors'):t('مکان: بیرون','Location: outside'),16,muted)}
   {transition&&txt(t('تایمر برای تغییر مکان متوقف است. پس از رسیدن به مسیر امن، گرم‌کردن بعدی را شروع کن.','Timer stopped for a location change. Once on a safe route, start the next warm-up.'))}
   {button(transition?t('آماده‌ام؛ ادامه در مکان بعد','Ready; continue at next location'):a.paused?t('ادامه','Resume'):t('مکث','Pause'),pause)}
   {a.steps[index+1]&&txt(t('بعدی: ','Next: ')+a.steps[index+1].title[s.lang],16,muted)}
   {step.exercise&&<MovementView key={step.exercise} id={step.exercise} lang={s.lang} ink={ink} compact/>}
   {!transition&&button(t('رد کردن این مرحله','Skip this step'),()=>update({active:{...a,elapsed:end,started:now,skipped:[...a.skipped,index],stepSeconds:{...a.stepSeconds,[index]:Math.max(0,seconds-(end-step.seconds))},skippedSeconds:(a.skippedSeconds??0)+Math.max(0,end-seconds)}}),true)}
   <AudioControls s={s} update={update}/>
   {button(t('پایان زودتر و ثبت نتیجه','Finish early and record'),result,true)}
   </>:<>{txt(t('حالا چند سؤال کوتاه برای برنامه بعدی.','A few short questions to guide your next session.'))}{button(t('ثبت نتیجه','Record result'),result)}</>}
   {txt(t('با درد، سرگیجه یا علائم غیرعادی توقف کن؛ برای علائم شدید کمک فوری بگیر.','Stop with pain, dizziness or unusual symptoms; seek urgent help for severe symptoms.'),14,muted)}
   {txt(`${Math.floor(Math.min(seconds,total)/60)} / ${Math.round(total/60)} ${t('دقیقه','minutes')}`,14,muted)}
  </>);
 }
 const resumeDraft=c.draft&&button(t('ادامه پیش‌نویس ذخیره‌شده','Resume saved draft'),()=>patch({flow:c.draft,draft:undefined}),true);
 if(!completeAnswers('intake',c.profile))return box(<>{txt(t('برنامه‌ای متناسب با تو','A plan that fits you'),28)}{txt(t('یک بار با چند پاسخ کوتاه شروع می‌کنیم. پس از آن فقط حال امروز و ریکاوری را می‌پرسیم.','Start with a few short answers, once. After that, we ask about today and your recovery.'))}{resumeDraft}{button(t('شروع آشنایی','Get started'),()=>begin('intake'))}</>);
 const historyControls=<>{s.sessions.filter(x=>x.status!=='missed').slice(0,5).map(x=><View key={x.id}>{button(t('اصلاح علت / آزمایشی بودن ثبت ','Correct reason / test-only record ')+x.date+' · '+x.minutes+' '+t('دقیقه','min'),()=>begin('stop',x.id),true)}</View>)}</>;
 if(clarification&&!painRecord)return box(<>{txt(t('نیمه‌تمام لزوماً یعنی ناتوانی نیست','Partial does not mean unable'),25)}{txt(t('برای این سابقه علت توقف ثبت نشده. یک توضیح کوتاه مانع پیشنهاد اشتباه می‌شود؛ سابقه پاک یا کامل‌شده نمی‌شود.','This record has no stop reason. A short clarification prevents an incorrect recommendation; it will not be deleted or marked complete.'))}{button(t('روشن‌کردن علت توقف','Clarify previous stop'),()=>begin('stop',clarification.id))}{historyControls}</>);
 const recoveryTarget=painRecord??recovery;
 if(recoveryTarget)return box(<>{txt(t('اول، حال بعد از جلسه قبل','First, recovery from your last session'),25)}{txt(t('ریکاوری فعالیت قبلی هنوز مشخص یا مناسب نیست؛ علت توقف با درد و خستگی فرق دارد.','Recovery from previous activity is unknown or unresolved; an interruption is different from pain or fatigue.'))}{button(t('ثبت ریکاوری','Record recovery'),()=>begin('recovery',recoveryTarget.id))}{historyControls}</>);
 const ready=c.ready?.date===dayKey()?c.ready:undefined;
 const plan=ready?choosePlan(c.profile,ready.answers,s.sessions,c.feedback,now):undefined;
 return box(<>{txt(t('امروز','Today'),15,muted)}{txt(t('برنامه امروز من','My plan today'),29)}
  {resumeDraft}
  {!plan?<>{txt(last?.date===dayKey()?t('جلسه امروز ثبت شد. دفعه بعد بازخوردت را در نظر می‌گیرم.','Today’s session is saved. Your feedback will guide the next plan.'):t('چند سؤال کوتاه، سپس برنامه آماده است.','A few short questions, then your plan is ready.'))}{button(t('برنامه امروز من','My plan today'),()=>begin('daily'))}</>:<>
   {txt(plan.name?.[s.lang]??(!plan.steps.length?t('استراحت یا بررسی بیشتر','Rest or further assessment'):plan.decision.state==='return'?t('شروع کوتاه','Short starting session'):plan.decision.mode==='home'?t('حرکت راحت / ریکاوری','Comfortable movement / recovery'):names[plan.decision.mode][s.lang]),24)}{txt(plan.decision.reason[s.lang])}{plan.weekly&&expanded&&txt(plan.weekly[s.lang],15,muted)}{plan.nextMain&&(expanded||plan.program?.kind==='recovery')&&txt(plan.nextMain[s.lang],15,muted)}
   {!!plan.steps.length&&<>{txt(`${plan.decision.minutes} ${t('دقیقه، با گرم‌کردن و سردکردن','minutes, including warm-up and cool-down')}`,19)}{txt([...new Set(plan.steps.filter(x=>x.exercise).map(x=>x.title[s.lang]))].join(' • '),16,muted)}
   {txt(plan.program?.kind==='recovery'?t('حرکت اختیاری روز ریکاوری','Optional recovery movement'):t('تمرین اصلی امروز','Today’s main work'),21)}
   {plan.steps.some(x=>x.transition)&&txt(t('خانه + بیرون؛ برای جابه‌جایی توقف دستی داریم.','Indoors + outside, with a manual pause for moving between locations.'),16,muted)}
   {[...new Set(plan.steps.filter(x=>x.phase==='work'&&x.exercise).map(x=>x.exercise!))].map(id=>{const sets=plan.steps.filter(x=>x.phase==='work'&&x.exercise===id);return <View key={id}>{txt(`${movements[id].name[s.lang]} · ${sets.length} ${t('ست / بازه','sets / intervals')} · ${sets[0].reps?`${sets[0].reps} ${t('تکرار در هر ست','reps per set')}`:`${sets.map(x=>x.seconds).join(' + ')} ${t('ثانیه','seconds')}`}`,16)}</View>;})}
   {txt(t('زمان ست شامل فرصت انجام آرام تکرارهاست؛ بقیه آن استراحت است. تعداد انجام‌شده خودکار شمرده نمی‌شود.','Set windows allow slow repetitions, then rest. Completed repetitions are not counted automatically.'),14,muted)}
   <AudioControls s={s} update={update}/>
   {button(t('شروع برنامه','Start plan'),()=>update({active:{id:String(now),started:now,elapsed:0,paused:false,steps:plan.steps,decision:plan.decision,program:plan.program,skipped:[]}}))}
   {button(t('امروز مناسبم نیست','This does not suit me today'),()=>begin('adapt'),true)}
   {button(expanded?t('بستن جزئیات','Hide details'):t('مراحل و مقدارها','Steps and doses'),()=>expand(!expanded),true)}
   {expanded&&plan.steps.map((x,i)=><View key={i}>{txt(`${i+1}. ${x.title[s.lang]} · ${x.seconds} ${t('ثانیه','sec')}${x.reps?` · ${x.reps} ${t('تکرار','reps')}`:''} · ${x.location==='outside'?t('بیرون','Outside'):t('خانه','Indoors')}${x.transition?t(' — توقف برای تغییر مکان',' — manual location transition'):''}`,16)}</View>)}
   </>}
   {button(t('اصلاح حال امروز','Edit today’s answers'),()=>patch({flow:{...newFlow('daily'),answers:{...ready!.answers},baseline:{...ready!.answers}}}),true)}
   {last&&button(t('به‌روزرسانی ریکاوری','Update recovery'),()=>begin('recovery',last.id),true)}
  </>}
  {historyControls}
  {button(t('ویرایش توان و محدودیت‌ها','Edit ability and restrictions'),()=>patch({flow:{...newFlow('intake'),answers:{...c.profile},baseline:{...c.profile}}}),true)}
 </>);
}
