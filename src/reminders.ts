import {AndroidImportance} from 'expo-notifications';
import * as N from 'expo-notifications';
import type {State} from './model';
import {quietHour} from './core';
import {reminderEvents} from './reminderPlan';
export {requestExactAlarmPermissionsAsync} from 'expo-notifications';
N.setNotificationHandler({handleNotification:async n=>({shouldPlaySound:!!n.request.content.sound,shouldSetBadge:false,shouldShowBanner:true,shouldShowList:true})});
async function channels(){
 await N.setNotificationChannelAsync('fitness-gentle',{name:'Quiet reminders / یادآور آرام',importance:AndroidImportance.DEFAULT,sound:null,enableVibrate:false});
 await N.setNotificationChannelAsync('fitness-strong',{name:'Sound and vibration / صدا و لرزش',importance:AndroidImportance.HIGH,sound:'default',enableVibrate:true,vibrationPattern:[0,250,150,250],bypassDnd:false});
}
export async function permission(){await channels();return (await N.requestPermissionsAsync()).granted;}
let queue:Promise<void>=Promise.resolve(),generation=0;
export function syncNotifications(s:State){const current=++generation;queue=queue.catch(()=>{}).then(async()=>{if(current===generation)await apply(s);});return queue;}
async function apply(s:State){
 const scheduled=await N.getAllScheduledNotificationsAsync();
 for(const n of scheduled)if(n.identifier!=='fityar-test')await N.cancelScheduledNotificationAsync(n.identifier);
 if(!s.onboard||!(await N.getPermissionsAsync()).granted)return;
 await channels();
 const fa=s.lang==='fa',t=(f:string,e:string)=>fa?f:e;
 await N.setNotificationCategoryAsync('fitness-actions',[
  {identifier:'start',buttonTitle:t('شروع','Start'),options:{opensAppToForeground:true}},
  {identifier:'snooze',buttonTitle:t('۱۵ دقیقه بعد','Snooze 15 min'),options:{opensAppToForeground:true}},
  {identifier:'skip',buttonTitle:t('امروز نمی‌توانم',"Can't today"),options:{opensAppToForeground:true}},
 ]);
 const schedule=async(id:string,at:number,body:string,data:Record<string,string>,actions=true)=>{
  if(at<=Date.now()||quietHour(new Date(at).getHours(),s.reminders.quietStart,s.reminders.quietEnd))return;
  await N.scheduleNotificationAsync({identifier:id,content:{title:'FitYar / فیت‌یار',body,data,categoryIdentifier:actions?'fitness-actions':undefined,sound:s.reminders.strong?'default':false},trigger:{type:N.SchedulableTriggerInputTypes.DATE,date:new Date(at),channelId:s.reminders.strong?'fitness-strong':'fitness-gentle'}});
 };
 const bodies={exercise:t('وقت تمرین انتخابی تو؛ حال امروز را بررسی کن.','Your chosen exercise time; check how you feel.'),followup:t('یک پیگیری کوتاه؛ شروع، تعویق یا امروز نمی‌توانم.','One follow-up: start, snooze, or skip today.'),prep:t('طبق ساعت پایان کار اعلام‌شده، کفش و لباس را آماده کن.','At your declared work-end time, prepare shoes and clothes.'),partial:t('جلسه باز مانده؛ ادامه بده یا همان مقدار انجام‌شده را ثبت کن.','An open session: resume or record only what you did.'),recovery:t('ریکاوری جلسه قبل را ثبت کن.','Record recovery from your last session.'),water:t('طبق تشنگی آب بنوش.','Drink according to thirst.'),move:t('اگر راحتی کمی راه برو.','Take a comfortable movement break.')};
 for(const e of reminderEvents(s))await schedule(e.id,e.at,bodies[e.kind],{kind:e.kind,date:e.date},!['water','move','prep'].includes(e.kind));
 // Clear obsolete delivered reminders too, including snoozes after a saved session.
 for(const n of await N.getPresentedNotificationsAsync()){
  const date=String(n.request.content.data?.date??'');
  if(n.request.content.data?.kind&&(!s.reminders.enabled||s.sessions.some(x=>x.date===date)||s.reminders.days?.[date]?.skip))await N.dismissNotificationAsync(n.request.identifier);
 }

}
export async function testNotification(lang:string,seconds=5,reminders?:State['reminders']){
 await channels();
 if(reminders&&quietHour(new Date(Date.now()+seconds*1000).getHours(),reminders.quietStart,reminders.quietEnd))return false;
 return N.scheduleNotificationAsync({identifier:'fityar-test',content:{title:'FitYar / فیت‌یار',body:lang==='fa'?'یادآور حرکت؛ وضعیتت را بررسی کن.':'Movement reminder; check how you feel.',data:{kind:'test'},sound:reminders?.strong?'default':false},trigger:{type:N.SchedulableTriggerInputTypes.TIME_INTERVAL,seconds,channelId:reminders?.strong?'fitness-strong':'fitness-gentle'}});
}
export function listenResponses(handler:(response:N.NotificationResponse)=>void){
 const sub=N.addNotificationResponseReceivedListener(handler);
 N.getLastNotificationResponseAsync().then(r=>{if(r)handler(r);}).catch(()=>{});
 return()=>sub.remove();
}
export async function clearResponse(){await N.clearLastNotificationResponseAsync();}
