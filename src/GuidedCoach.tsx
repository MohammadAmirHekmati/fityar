import React,{useEffect,useState} from 'react';
import {View,Text,Pressable,BackHandler} from 'react-native';
import type {State} from './model';
import {actualSeconds,dayKey,elapsed,names} from './core';
import {answerFlow,choosePlan,completeAnswers,movements,newFlow,questions} from './coach';
import type {CoachState,FlowKind} from './coach';
import MovementView from './MovementView';
const emptyCoach:CoachState={profile:{}};
type Props={s:State;update:(patch:Partial<State>)=>void;library?:boolean;onNavigate?:()=>void};
export default function Coach({s,update,library=false,onNavigate}:Props){
 const [now,setNow]=useState(()=>Date.now()),[selected,select]=useState(''),[expanded,expand]=useState(false);
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
 useEffect(()=>{const listener=BackHandler.addEventListener('hardwareBackPress',()=>{if(f&&f.cursor>0){update({coach:{...c,flow:{...f,cursor:f.cursor-1}}});return true;}return false;});return()=>listener.remove();},[c,f,update]);
 const last=s.sessions.filter(x=>x.status!=='missed').sort((a,b)=>b.at-a.at)[0];
 const finishFlow=()=>{
  if(!f)return;
  if(f.kind==='intake'){update({onboard:true,coach:{...c,profile:f.answers,flow:undefined,ready:undefined}});return;}
  if(f.kind==='daily'){patch({ready:{date:dayKey(),answers:f.answers},flow:undefined});return;}
  if(f.kind==='recovery'){update({sessions:s.sessions.map(x=>x.id===f.target?{...x,recovery:Number(f.answers.recovery)}:x),coach:{...c,flow:undefined,ready:undefined}});return;}
  if(f.kind==='adapt'){
   const a={...c.ready!.answers},reason=f.answers.reason;
   if(reason==='pain')a.pain='yes';if(reason==='time')a.minutes='5';if(reason==='equipment')a.support='none';if(reason==='unfamiliar'){a.energy='low';a.place='inside';}
   patch({ready:{date:dayKey(),answers:a},flow:undefined});return;
  }
  if(f.kind==='post'&&s.active){
   const active=s.active,at=now,effort=Number(f.answers.effort),pain=f.answers.pain==='yes',talk=f.answers.talk==='yes';
   const seconds=actualSeconds(active,at),duration=active.steps.reduce((n,x)=>n+x.seconds,0);
   const record={id:String(at),date:dayKey(),at,mode:active.decision.mode,minutes:Math.round(seconds/6)/10,planned:duration/60,effort,pain,talk,status:(active.skipped.length||elapsed(active,at)<duration?'partial':'complete') as 'partial'|'complete',reason:active.decision.reason,before:active.before};
   const groups=[...new Set(active.steps.map(x=>movements[x.exercise??'']?.group).filter(Boolean))];
   const feedback={...c.feedback};for(const g of groups){feedback[g]=[...(feedback[g]??[]),{at,effort:f.answers.group===g?8:effort,pain}];}
   update({sessions:[record,...s.sessions],active:null,coach:{...c,flow:undefined,ready:undefined,feedback}});
  }
 };
 if(library)return box(<>{txt(t('کتابخانه حرکت‌ها','Movement library'),26)}{txt(t('هر حرکت روش و تصویر خودش را دارد. توان یک حرکت به بقیه تعمیم داده نمی‌شود.','Each movement has its own instructions and images. Ability in one does not imply ability in others.'),15,muted)}{selected?<>{button(t('بازگشت به فهرست','Back to list'),()=>select(''),true)}{txt(movements[selected].name[s.lang],24)}<MovementView id={selected} lang={s.lang} ink={ink} details/></>:Object.entries(movements).map(([id,m])=><View key={id}>{button(m.name[s.lang],()=>select(id),true)}</View>)}</>);
 if(f){
  if(f.kind==='daily'&&f.date!==dayKey())return box(<>{txt(t('این بررسی برای روز دیگری بود؛ حال امروز را دوباره بررسی کنیم.','This check was for a different day; let’s check how you feel today.'))}{button(t('بررسی امروز','Check today'),()=>begin('daily'))}</>);
  const list=questions[f.kind],q=list[f.cursor];
  const safety=f.kind==='daily'&&(f.answers.symptoms==='yes'||f.answers.pain==='yes');
  if(safety)return box(<>{txt(t('امروز اول مراقبت','Care comes first today'),26)}{txt(f.answers.symptoms==='yes'?t('تمرین نکن. درد قفسه سینه، احساس غش یا تنگی نفس شدید نیاز به بررسی فوری دارد؛ با اورژانس محلی تماس بگیر.','Do not exercise. Chest pain, feeling faint or severe breathlessness needs urgent assessment; contact local emergency services.'):t('با درد یا بیماری تمرین نکن. اگر ادامه داشت، ارزیابی حرفه‌ای بگیر.','Do not train through pain or illness. Seek assessment if it persists.'))}{button(t('اصلاح پاسخ','Edit answer'),back,true)}{button(t('بستن بررسی','Close check'),()=>patch({flow:undefined,ready:undefined}),true)}</>);
  return box(<>{txt(t('قدم به قدم','One step at a time'),15,muted)}{txt(`${Math.min(f.cursor+1,list.length)} / ${list.length}`,15,muted)}
   {q?<>{txt(q.title[s.lang],25)}{q.hint&&txt(q.hint[s.lang],15,muted)}{q.options.map(o=><View key={o.id}>{button((f.answers[q.key]===o.id?'✓ ':'')+o.label[s.lang],()=>patch({flow:answerFlow(f,o.id)}),true)}</View>)}</>:<>{txt(t('پاسخ‌ها آماده‌اند','Your answers are ready'),25)}{list.map(q=><View key={q.key}>{txt(q.title[s.lang],14,muted)}{txt(q.options.find(o=>o.id===f.answers[q.key])?.label[s.lang]??'—')}</View>)}{button(t('تأیید و ادامه','Confirm and continue'),finishFlow)}</>}
   {f.cursor>0&&button(t('برگشت و ویرایش','Back and edit'),back,true)}
   {txt(t('پیشرفت ذخیره می‌شود؛ می‌توانی برنامه را ببندی و بعد ادامه بدهی.','Progress is saved; you can close the app and continue later.'),13,muted)}
  </>);
 }
 if(s.active){
  const a=s.active,seconds=elapsed(a,now),total=a.steps.reduce((n,x)=>n+x.seconds,0);
  const ends=a.steps.map((_,i)=>a.steps.slice(0,i+1).reduce((n,x)=>n+x.seconds,0));
  const index=ends.findIndex(end=>seconds<end),end=ends[index]??total,step=a.steps[index];
  const pause=()=>update({active:{...a,elapsed:seconds,started:now,paused:!a.paused}});
  const result=()=>update({active:{...a,elapsed:seconds,started:now,paused:true},coach:{...c,flow:newFlow('post')}});
  return box(<>{txt(t('جلسه امروز','Today’s session'),15,muted)}{txt(step?(step.phase==='warmup'?t('گرم‌کردن','Warm-up'):step.phase==='cooldown'?t('سردکردن','Cool-down'):t('تمرین','Exercise')):t('جلسه تمام شد','Session finished'),24)}
   {step?<>{txt(step.title[s.lang],27)}{txt(`${Math.max(0,Math.ceil(end-seconds))} ${t('ثانیه','seconds')}`,34)}{txt(`${index+1} / ${a.steps.length}`,14,muted)}{step.note&&txt(step.note[s.lang])}
   {button(a.paused?t('ادامه','Resume'):t('مکث','Pause'),pause)}
   {button(t('رد کردن این مرحله','Skip this step'),()=>update({active:{...a,elapsed:end,started:now,skipped:[...a.skipped,index],skippedSeconds:(a.skippedSeconds??0)+Math.max(0,end-seconds)}}),true)}
   {button(t('پایان زودتر و ثبت نتیجه','Finish early and record'),result,true)}
   {step.exercise&&<MovementView id={step.exercise} lang={s.lang} ink={ink}/>}</>:<>{txt(t('حالا چند سؤال کوتاه برای برنامه بعدی.','A few short questions to guide your next session.'))}{button(t('ثبت نتیجه','Record result'),result)}</>}
   {txt(t('با درد، سرگیجه یا علائم غیرعادی توقف کن؛ برای علائم شدید کمک فوری بگیر.','Stop with pain, dizziness or unusual symptoms; seek urgent help for severe symptoms.'),14,muted)}
   {txt(`${Math.floor(Math.min(seconds,total)/60)} / ${Math.round(total/60)} ${t('دقیقه','minutes')}`,14,muted)}
  </>);
 }
 if(!completeAnswers('intake',c.profile))return box(<>{txt(t('برنامه‌ای متناسب با تو','A plan that fits you'),28)}{txt(t('یک بار با چند پاسخ کوتاه شروع می‌کنیم. پس از آن فقط حال امروز و ریکاوری را می‌پرسیم.','Start with a few short answers, once. After that, we ask about today and your recovery.'))}{button(t('شروع آشنایی','Get started'),()=>begin('intake'))}</>);
 if(last&&last.date!==dayKey()&&last.recovery===undefined)return box(<>{txt(t('اول، حال بعد از جلسه قبل','First, recovery from your last session'),25)}{button(t('ثبت ریکاوری','Record recovery'),()=>begin('recovery',last.id))}</>);
 const ready=c.ready?.date===dayKey()?c.ready:undefined;
 const plan=ready?choosePlan(c.profile,ready.answers,s.sessions,c.feedback,now):undefined;
 return box(<>{txt(t('امروز','Today'),15,muted)}{txt(t('برنامه امروز من','My plan today'),29)}
  {!plan?<>{txt(last?.date===dayKey()?t('جلسه امروز ثبت شد. دفعه بعد بازخوردت را در نظر می‌گیرم.','Today’s session is saved. Your feedback will guide the next plan.'):t('چند سؤال کوتاه، سپس برنامه آماده است.','A few short questions, then your plan is ready.'))}{button(t('برنامه امروز من','My plan today'),()=>begin('daily'))}</>:<>
   {txt(names[plan.decision.mode][s.lang],24)}{txt(plan.decision.reason[s.lang])}
   {!!plan.steps.length&&<>{txt(`${plan.decision.minutes} ${t('دقیقه، با گرم‌کردن و سردکردن','minutes, including warm-up and cool-down')}`,19)}{txt([...new Set(plan.steps.filter(x=>x.exercise).map(x=>x.title[s.lang]))].join(' • '),16,muted)}
   {button(t('شروع برنامه','Start plan'),()=>update({active:{started:now,elapsed:0,paused:false,steps:plan.steps,decision:plan.decision,skipped:[]}}))}
   {button(t('امروز مناسبم نیست','This does not suit me today'),()=>begin('adapt'),true)}
   {button(expanded?t('بستن جزئیات','Hide details'):t('مراحل و مقدارها','Steps and doses'),()=>expand(!expanded),true)}
   {expanded&&plan.steps.map((x,i)=><View key={i}>{txt(`${i+1}. ${x.title[s.lang]} · ${x.seconds} ${t('ثانیه','sec')}${x.reps?` · ${x.reps} ${t('تکرار','reps')}`:''}`,16)}</View>)}
   </>}
   {button(t('اصلاح حال امروز','Edit today’s answers'),()=>patch({flow:{...newFlow('daily'),answers:ready!.answers},ready:undefined}),true)}
   {last&&button(t('به‌روزرسانی ریکاوری','Update recovery'),()=>begin('recovery',last.id),true)}
  </>}
  {button(t('ویرایش توان و محدودیت‌ها','Edit ability and restrictions'),()=>patch({flow:{...newFlow('intake'),answers:c.profile}}),true)}
 </>);
}
