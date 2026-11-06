import React,{useState} from 'react';
import {View,Text,Pressable,TextInput} from 'react-native';
import type {State} from './model';
import {bi,dayKey,names,numericText} from './core';
import type {Session,Mode} from './core';
export type StateUpdate=(change:Partial<State>|((s:State)=>State))=>boolean;
export default function SessionHistory({s,update,close,manual=false}:{s:State;update:StateUpdate;close:()=>void;manual?:boolean}){
 const fa=s.lang==='fa',t=(f:string,e:string)=>fa?f:e,ink=s.dark?'#edf5f3':'#16372e';
 const [date,D]=useState(dayKey()),[minutes,M]=useState(''),[mode,MO]=useState<Mode>('strength'),[effort,E]=useState(''),[pain,P]=useState(''),[talk,T]=useState(''),[error,ERR]=useState(''),[id]=useState(()=>`manual-${Date.now()}`);
 const txt=(v:string)=><Text style={{color:ink,fontSize:17,lineHeight:26,textAlign:fa?'right':'left'}}>{v}</Text>;
 const button=(v:string,fn:()=>void)=><Pressable accessibilityRole="button" onPress={fn} style={{padding:16,borderWidth:1,borderColor:'#6b8580',borderRadius:14,minHeight:52}}>{txt(v)}</Pressable>;
 const field=(label:string,value:string,set:(v:string)=>void)=><View>{txt(label)}<TextInput accessibilityLabel={label} value={value} onChangeText={v=>set(numericText(v))} style={{color:ink,borderColor:'#6b8580',borderWidth:1,padding:15,borderRadius:10}}/></View>;
 const save=()=>{
  const n=Number(minutes),at=new Date(date+'T12:00:00').getTime();
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(at)||dayKey(new Date(at))!==date||date>dayKey()||!Number.isFinite(n)||n<=0||n>300||!effort||!pain||!talk){ERR(t('تاریخ، مدت واقعی و بازخورد معتبر را تکمیل کن.','Complete a valid date, actual duration and feedback.'));return;}
  const row:Session={id,date,at:date===dayKey()?Date.now():at,mode,minutes:n,planned:0,effort:Number(effort),pain:pain==='yes',talk:talk==='yes',status:'partial',manual:true,stopReason:pain==='yes'?'pain':'other',activity:'unknown',reason:bi('ثبت دستی فعالیت واقعی؛ جزئیات ست و برنامه قابل تأیید نیست.','Manually reported activity; sets and planned completion are not verified.')};
  if(update(old=>old.sessions.some(x=>x.id===id)?old:{...old,sessions:[row,...old.sessions],coach:{...(old.coach??{profile:{}}),lastSaved:id}}))close();
 };
 return <View style={{gap:16,padding:20}}>{button(t('بازگشت','Back'),close)}
 {manual?<>{txt(t('ثبت دستی جلسه ازدست‌رفته','Log a missing workout'))}{txt(t('فقط فعالیت واقعاً انجام‌شده را وارد کن. این ثبت دستی است و کامل‌شدن برنامه یا ست‌ها را فرض نمی‌کند. اگر جلسه باز داری، ابتدا نتیجه همان را ثبت کن.','Enter only activity you actually performed. This is a manual report, not proof of completed sets. Save an open session first.'))}
 {field(t('تاریخ (YYYY-MM-DD)','Date (YYYY-MM-DD)'),date,D)}{field(t('دقیقه فعالیت واقعی','Actual activity minutes'),minutes,M)}
 {(['strength','walk','run','home'] as Mode[]).map(m=><View key={m}>{button((mode===m?'✓ ':'')+names[m][s.lang],()=>MO(m))}</View>)}
 {txt(t('سختی جلسه','Effort'))}{['3','5','8'].map(v=><View key={v}>{button((effort===v?'✓ ':'')+v+'/10',()=>E(v))}</View>)}
 {txt(t('درد داشتی؟','Did you have pain?'))}{['no','yes'].map(v=><View key={v}>{button((pain===v?'✓ ':'')+t('درد: ','Pain: ')+(v==='yes'?t('بله','Yes'):t('نه','No')),()=>P(v))}</View>)}
 {txt(t('می‌توانستی جمله کامل بگویی؟','Could you speak a full sentence?'))}{['yes','no'].map(v=><View key={v}>{button((talk===v?'✓ ':'')+t('جمله کامل: ','Full sentence: ')+(v==='yes'?t('بله','Yes'):t('نه','No')),()=>T(v))}</View>)}
 {!!error&&txt(error)}{<Pressable accessibilityRole="button" onPress={save} style={{padding:16,borderWidth:1,borderColor:'#6b8580',borderRadius:14,minHeight:52}}>{txt(t('ثبت فعالیت واقعی','Save actual activity'))}</Pressable>}</>:<>
 {txt(t('سابقه جلسات ذخیره‌شده','Saved workout history'))}{!s.sessions.length&&txt(t('هنوز جلسه‌ای ذخیره نشده.','No saved sessions yet.'))}
 {[...s.sessions].sort((a,b)=>b.at-a.at).map(x=><View key={x.id} style={{gap:8,paddingVertical:14,borderBottomWidth:1,borderColor:'#6b8580'}}>{txt(`${x.date} · ${names[x.mode][s.lang]}`)}{txt(`${x.minutes} ${t('دقیقه واقعی','actual min')} · ${x.manual?t('دستی؛ تکمیل برنامه تأیید نشده','Manual; completion unverified'):x.status==='complete'?t('کامل','Complete'):x.status==='missed'?t('انجام نشده','Not done'):t('نیمه‌تمام','Partial')}`)}{txt(x.stopReason==='test'?t('فقط آزمایش اپ','App test only'):x.reason[s.lang])}</View>)}
 </>}
 </View>;
}
