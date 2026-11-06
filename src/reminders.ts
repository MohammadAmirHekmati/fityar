import { AndroidImportance } from "expo-notifications";
import * as N from "expo-notifications";
import { State } from "./storage";
import { dayKey, elapsed, quietHour } from "./core";
N.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});
export async function permission() {
  await N.setNotificationChannelAsync("fitness", {
    name: "FitYar / فیت‌یار",
    importance: AndroidImportance.DEFAULT,
    vibrationPattern: [0, 200],
  });
  return (await N.requestPermissionsAsync()).granted;
}
let queue: Promise<void> = Promise.resolve();
let generation = 0;
export function syncNotifications(s: State) {
  const current = ++generation;
  queue = queue.catch(() => {}).then(async () => {
    if(current === generation) await applyNotifications(s);
  });
  return queue;
}
async function applyNotifications(s: State) {
  if(!s.onboard){await N.cancelAllScheduledNotificationsAsync();return;}
  const scheduled=await N.getAllScheduledNotificationsAsync();
  for(const request of scheduled)if(!['snooze','test'].includes(String(request.content.data?.kind)))await N.cancelScheduledNotificationAsync(request.identifier);
  if(!(await N.getPermissionsAsync()).granted) return;
  await N.setNotificationChannelAsync('fitness', {name:'FitYar / فیت‌یار',importance:AndroidImportance.DEFAULT});
  const fa = s.lang === "fa";
  const r = s.reminders;
  const quiet = (h: number) => quietHour(h,r.quietStart,r.quietEnd);
  const schedule = async (date: Date, title: string, body: string) => {
    if (date.getTime() > Date.now() && !quiet(date.getHours()))
      await N.scheduleNotificationAsync({
        content: { title, body, sound: "default" },
        trigger: {
          type: N.SchedulableTriggerInputTypes.DATE,
          date,
          channelId: "fitness",
        },
      });
  };
  if (r.enabled) {
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      d.setHours(r.hour, r.minute, 0, 0);
      if (!s.sessions.some((x) => x.date === dayKey(d)))
        await schedule(
          d,
          fa ? "زمان حرکت" : "Time to move",
          fa
            ? "انرژی و ریکاوری امروز را بررسی کن."
            : "Check your energy and recovery today.",
        );
      if (r.move && !(s.habits[dayKey(d)] ?? []).includes('move')) {
        const m = new Date(d);
        m.setHours(12, 0);
        await schedule(
          m,
          fa ? "استراحت از نشستن" : "A break from sitting",
          fa
            ? "اگر می‌توانی کمی راه برو."
            : "Take a short walk if comfortable.",
        );
      }
      if (r.water) {
        const w = new Date(d);
        w.setHours(15, 0);
        await schedule(
          w,
          fa ? "یادآور آب" : "Water reminder",
          fa
            ? "متناسب با تشنگی و نیازت آب بنوش."
            : "Drink according to thirst and your needs.",
        );
      }
    }
  }
  if (s.active && !s.active.paused) {
    const a = s.active;
    let end = 0;
    for (const step of a.steps) {
      end += step.seconds;
      const remaining = end - elapsed(a);
      if (remaining > 0)
        await schedule(
          new Date(Date.now() + remaining * 1000),
          fa ? "پایان بخش تمرین" : "Workout interval ended",
          step.title[s.lang],
        );
    }
  }
}
export async function testNotification(lang: string, seconds = 5, reminders?:State['reminders']) {
  if(seconds>5&&reminders&&quietHour(new Date(Date.now()+seconds*1000).getHours(),reminders.quietStart,reminders.quietEnd))return false;
  return N.scheduleNotificationAsync({
    identifier:seconds>5?'fityar-snooze':'fityar-test',
    content: {
      data:{kind:seconds>5?'snooze':'test'},
      title: "FitYar / فیت‌یار",
      body:
        lang === "fa"
          ? "یادآور حرکت؛ وضعیتت را بررسی کن."
          : "Movement reminder; check how you feel.",
      sound: "default",
    },
    trigger: {
      type: N.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds,
      channelId: "fitness",
    },
  });
}

