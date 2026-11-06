import {NativeModules} from 'react-native';
import type {State} from './model';
import {dayKey} from './core';
import {choosePlan} from './coach';
export function syncWidget(s:State){
 const fa=s.lang==='fa',t=(f:string,e:string)=>fa?f:e;
 const done=s.sessions.some(x=>x.date===dayKey());
 const ready=s.coach?.ready?.date===dayKey()&&!s.coach.flow;
 const plan=ready?choosePlan(s.coach!.profile,s.coach!.ready!.answers,s.sessions,s.coach!.feedback):undefined;
 const status=s.active?t('جلسه باز است؛ ادامه یا ثبت مقدار انجام‌شده','Open session: resume or record what you did'):done?t('جلسه امروز ثبت شد','Today’s session is saved'):plan?.steps.length?t(`برنامه آماده: ${plan.decision.minutes} دقیقه با گرم‌کردن`,`Ready: ${plan.decision.minutes} minutes including warm-up`):t('قدم بعدی: بررسی حال امروز و گرم‌کردن','Next: check readiness, then warm up');
 NativeModules.FitYarWidget?.update(dayKey(),status,s.active?t('باز کردن جلسه','Open session'):plan?.steps.length&&!done?t('شروع با گرم‌کردن','Start with warm-up'):t('برنامه امروز','Today’s plan'),fa,!!plan?.steps.length&&!done&&!s.active);
}
export async function pinWidget():Promise<boolean>{return (await NativeModules.FitYarWidget?.pin())??false;}
export function syncAudio(s:State){const a=s.active;NativeModules.FitYarWidget?.audio(JSON.stringify({...a,...(s.audio??{enabled:true,volume:60,vibrate:false}),id:a?.id??'legacy',paused:!a||a.paused,fa:s.lang==='fa'}));}
export function testAudio(volume:number){NativeModules.FitYarWidget?.testAudio(volume);}
export async function audioMuted():Promise<boolean>{return (await NativeModules.FitYarWidget?.audioMuted())??false;}
