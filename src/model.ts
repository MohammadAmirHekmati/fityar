import type { Active, Lang, Session } from "./core";
export interface State {
  version: 1;
  lang: Lang;
  dark: boolean;
  onboard: boolean;
  profile: { age: string; limitations: string };
  sessions: Session[];
  active: Active | null;
  meals: { id: string; date: string; food: string; portion: number }[];
  favorites: string[];
  allergies: string[];
  vegetarian: boolean;
  available: string[];
  habits: Record<string, string[]>;
  measures: { date: string; weight: number; waist: number }[];
  movementRatings?: Record<string, { at: number; effort: number; pain: boolean }[]>;
  reminders: {
    enabled: boolean;
    hour: number;
    minute: number;
    quietStart: number;
    quietEnd: number;
    water: boolean;
    move: boolean;
  };
}
export const initial: State = {
  version: 1,
  lang: "fa",
  dark: true,
  onboard: false,
  profile: { age: "", limitations: "" },
  sessions: [],
  active: null,
  meals: [],
  favorites: [],
  allergies: [],
  vegetarian: false,
  available: [],
  habits: {},
  measures: [],
  reminders: {
    enabled: false,
    hour: 18,
    minute: 0,
    quietStart: 22,
    quietEnd: 8,
    water: false,
    move: false,
  },
};

export function validate(value: unknown): State {
  const fail = () => { throw Error('Invalid backup / بکاپ نامعتبر'); };
  const obj = (x: unknown): x is Record<string, unknown> => !!x && typeof x === 'object' && !Array.isArray(x);
  const num = (x: unknown, min: number, max: number) => typeof x === 'number' && Number.isFinite(x) && x >= min && x <= max;
  const str = (x: unknown) => typeof x === 'string' && x.length < 10000;
  const date = (x: unknown) => typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x) && !Number.isNaN(Date.parse(x));
  const strings = (x: unknown) => Array.isArray(x) && x.length <= 10000 && x.every(str);
  const text = (x: unknown) => obj(x) && str(x.fa) && str(x.en);
  const modes = ['walk','run','strength','home','short'];
  if (!obj(value)) return fail();
  const s = value as unknown as State;
  if(s.version!==1 || !['fa','en'].includes(s.lang) || typeof s.dark!=='boolean' || typeof s.onboard!=='boolean' || typeof s.vegetarian!=='boolean')return fail();
  if(!obj(s.profile)||!str(s.profile.age)||!str(s.profile.limitations))return fail();
  for(const key of ['sessions','meals','measures'] as const)if(!Array.isArray(s[key])||s[key].length>10000)return fail();
  if(!strings(s.favorites)||!strings(s.allergies)||!strings(s.available)||!obj(s.habits)||!Object.entries(s.habits).every(([k,v])=>date(k)&&strings(v)))return fail();
  if(s.sessions.some(x=>!obj(x)||!str(x.id)||!date(x.date)||!num(x.at,0,1e14)||!modes.includes(x.mode)||!num(x.minutes,0,300)||!num(x.planned,0,300)||!num(x.effort,0,10)||typeof x.talk!=='boolean'||typeof x.pain!=='boolean'||!['complete','partial','missed'].includes(x.status)||!text(x.reason)||(x.recovery!==undefined&&!num(x.recovery,1,10))))return fail();
  if(s.meals.some(x=>!obj(x)||!str(x.id)||!date(x.date)||!str(x.food)||!num(x.portion,.1,20)))return fail();
  if(s.measures.some(x=>!obj(x)||!date(x.date)||!num(x.weight,25,350)||!num(x.waist,35,250)))return fail();
  const r=s.reminders;if(!obj(r)||typeof r.enabled!=='boolean'||typeof r.water!=='boolean'||typeof r.move!=='boolean'||![r.hour,r.quietStart,r.quietEnd].every(v=>num(v,0,23)&&Number.isInteger(v))||!num(r.minute,0,59)||!Number.isInteger(r.minute))return fail();
  if(s.movementRatings!==undefined&&(!obj(s.movementRatings)||!Object.entries(s.movementRatings).every(([key,entries])=>['squat','push','lunge','bridge','w','deadbug','side','run'].includes(key)&&Array.isArray(entries)&&entries.every(x=>obj(x)&&num(x.at,0,1e14)&&num(x.effort,1,10)&&typeof x.pain==='boolean'))))return fail();
  const a=s.active;
  if(a!==null){if(!obj(a)||!num(a.started,0,1e14)||!num(a.elapsed,0,1e7)||typeof a.paused!=='boolean'||!Array.isArray(a.steps)||a.steps.length>100||!a.steps.every(x=>obj(x)&&text(x.title)&&num(x.seconds,1,3600))||!Array.isArray(a.skipped)||!a.skipped.every(x=>Number.isInteger(x)&&x>=0&&x<a.steps.length)||!obj(a.decision)||!modes.includes(a.decision.mode)||!num(a.decision.minutes,0,300)||!text(a.decision.reason)||!['stop','rest','return','reduce','hold','progress'].includes(a.decision.state)||(a.skippedSeconds!==undefined&&!num(a.skippedSeconds,0,1e7)))return fail();}
  return s;
}

