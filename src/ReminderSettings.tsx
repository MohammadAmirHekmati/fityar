import React,{useState} from 'react';
import {View,Text,TextInput,Pressable,Switch,Alert} from 'react-native';
import type {State} from './model';
import {dayKey,numericText} from './core';
import {permission,testNotification} from './reminders';
import {reminderAction} from './reminderPlan';
import {pinWidget} from './widget';
export default function ReminderSettings({s,update}:{s:State;update:(p:Partial<State>)=>void}){
 const r=s.reminders,fa=s.lang==='fa',t=(f:string,e:string)=>fa?f:e,ink=s.dark?'#edf5f3':'#16372e';
 const time=(h:number,m:number)=>`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
 const [work,W]=useState(time(r.workEndHour??17,r.workEndMinute??0)),[exercise,E]=useState(time(r.hour,r.minute));
 const text=(v:string)=><Text style={{color:ink,fontSize:17,lineHeight:26,textAlign:fa?'right':'left'}}>{v}</Text>;
 const button=(v:string,fn:()=>void)=><Pressable accessibilityRole="button" onPress={fn} style={{padding:16,minHeight:52,borderWidth:1,borderColor:'#83a196',borderRadius:12}}>{text(v)}</Pressable>;
 const toggle=(label:string,value:boolean,onValueChange:(v:boolean)=>void)=><View>{text(label)}<Switch accessibilityLabel={label} value={value} onValueChange={onValueChange}/></View>;
 const set=(p:Partial<State['reminders']>)=>update({reminders:{...r,...p}});
 const parse=(v:string)=>/^([01]?\d|2[0-3]):[0-5]\d$/.test(v)?v.split(':').map(Number):null;
 const field=(label:string,value:string,onChangeText:(v:string)=>void)=><View>{text(label)}<TextInput accessibilityLabel={label} value={value} onChangeText={v=>onChangeText(numericText(v))} style={{color:ink,padding:14,fontSize:20,borderWidth:1,borderColor:'#83a196',borderRadius:12}}/></View>;
 return <View style={{gap:16}}>
 {text(t('یادآورها و ویجت','Reminders and widget'))}
 {field(t('معمولاً چه ساعتی کارت تمام می‌شود؟ (HH:MM)','When does work usually end? (HH:MM)'),work,W)}
 {field(t('چه ساعتی برای تمرین مناسب است؟ (HH:MM)','What time suits exercise? (HH:MM)'),exercise,E)}
 {button(t('ذخیره برنامه یادآوری','Save reminder schedule'),async()=>{const w=parse(work),e=parse(exercise);if(!w||!e){Alert.alert(t('زمان معتبر مثل ۱۸:۳۰ وارد کن','Enter a time such as 18:30'));return;}const granted=await permission();set({workEndHour:w[0],workEndMinute:w[1],hour:e[0],minute:e[1],enabled:granted});Alert.alert(granted?t('برنامه ذخیره شد','Schedule saved'):t('ذخیره شد؛ مجوز اعلان داده نشد','Saved; notification permission was denied'));})}
 {text(t(`خلاصه: آمادگی اختیاری ساعت ${time(r.workEndHour??17,r.workEndMinute??0)}، تمرین ${time(r.hour,r.minute)}، فقط یک پیگیری بی‌پاسخ پس از ۴۵ دقیقه.`,`Summary: optional preparation at ${time(r.workEndHour??17,r.workEndMinute??0)}, exercise at ${time(r.hour,r.minute)}, at most one unanswered follow-up after 45 minutes.`))}
 {text(t('پایان کار از ساعت اعلامی تو می‌آید؛ تشخیص خودکار نیست.','Work end uses your declared time; it is not detected automatically.'))}
 {toggle(t('یادآورها فعال','Reminders enabled'),r.enabled,async v=>{if(!v||await permission())set({enabled:v});})}
 {toggle(t('آماده کردن کفش و لباس پس از کار','Prepare shoes and clothes after work'),r.prep??false,v=>set({prep:v}))}
 {toggle(t('اجازه صدا و لرزش متمایز یادآور','Allow distinct reminder sound and vibration'),r.strong??false,async v=>{if(!v||await permission())set({strong:v});})}
 {field(t('شروع سکوت (۰ تا ۲۳)','Quiet hours start (0–23)'),String(r.quietStart),v=>{if(/^\d{1,2}$/.test(v)&&Number(v)<=23)set({quietStart:Number(v)});})}
 {field(t('پایان سکوت (۰ تا ۲۳)','Quiet hours end (0–23)'),String(r.quietEnd),v=>{if(/^\d{1,2}$/.test(v)&&Number(v)<=23)set({quietEnd:Number(v)});})}
 {button(t('آزمون اعلان ۵ ثانیه','Test notification in 5 seconds'),async()=>{if(await permission()){const result=await testNotification(s.lang,5,r);if(result===false)Alert.alert(t('اکنون ساعات سکوت است','Quiet hours are active'));}})}
 <Pressable accessibilityRole="button" style={{padding:16}} onPress={()=>update({reminders:reminderAction(s,'snooze',String(Date.now()),dayKey()).reminders})}>{text(t('تعویق ۱۵ دقیقه','Snooze 15 minutes'))}</Pressable>
 <Pressable accessibilityRole="button" style={{padding:16}} onPress={()=>update({reminders:reminderAction(s,'skip',String(Date.now()),dayKey()).reminders})}>{text(t('امروز نمی‌توانم','Cannot today'))}</Pressable>
 {(r.days?.[dayKey()]?.snoozes??0)>=3&&<>{text(t('چند بار عقب افتاد؛ زمان دیگری مناسب‌تر است؟ ساعت بالا را ویرایش و ذخیره کن.','Several snoozes: would another time suit you? Edit and save the time above.'))}{button(t('پیشنهاد ۳۰ دقیقه دیرتر','Suggest 30 minutes later'),()=>{const minutes=(r.hour*60+r.minute+30)%1440;E(time(Math.floor(minutes/60),minutes%60));})}</>}
 {button(t('افزودن ویجت به صفحه اصلی','Add home screen widget'),async()=>{if(!await pinWidget())Alert.alert(t('از فهرست ویجت‌های صفحه اصلی، FitYar را اضافه کن.','Add FitYar from your launcher’s widget list.'));})}
 {text(t('دکمه‌های اعلان برنامه را برای انجام کار باز می‌کنند. پس از ثبت جلسه، یادآوری آن لغو می‌شود. اعلان‌ها ۷ روز آینده‌اند؛ محدودیت باتری، حالت مزاحم نشوید و توقف اجباری می‌توانند مانع تحویل شوند.','Notification actions open the app to apply your choice. Saving a session cancels its reminders. Schedules cover 7 days; battery restrictions, Do Not Disturb, and force-stop can prevent delivery.'))}
 </View>;
}
