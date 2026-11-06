import {bi} from './core.ts';
import type {Text} from './core';
import type {Answers} from './coach';
export const targetLabels={chest:bi('سینه و پشت بازو','Chest and triceps'),abs:bi('شکم و میان‌تنه','Abdominals and core'),obliques:bi('پهلو؛ عضلات مایل شکم','Obliques; side core'),legs:bi('پا و باسن','Legs and glutes'),back:bi('پشت و کنترل کتف','Back and shoulder-blade control'),cardio:bi('قلب و تنفس','Aerobic conditioning')};
export type Target=keyof typeof targetLabels;
export function targets(id:string):Target[]{
 if(id.startsWith('push-'))return ['chest','abs'];
 if(id.startsWith('side-plank'))return ['obliques','abs'];
 if(id.startsWith('plank'))return ['abs','back'];
 if(id==='dead-bug')return ['abs','obliques'];
 if(id==='heel-slide')return ['abs'];
 if(id==='bird-dog')return ['abs','obliques','back'];
 if(id==='back-squeeze')return ['back'];
 if(['bridge','calf','side-leg','squat-free','squat-chair'].includes(id))return ['legs'];
 return ['cardio'];
}
export const targetText=(id:string,lang:'fa'|'en')=>targets(id).map(x=>targetLabels[x][lang]).join(' · ');
export const held=(id:string)=>id.includes('plank');
export const sideHold=(id:string)=>id.startsWith('side-plank');
export function alternatives(id:string,profile:Answers,a:Answers,skills:Answers={}):string[]{
 const floor=profile.core==='yes',pushes=['push-wall','push-incline','push-knee','push-regular'];
 if(id.startsWith('push-'))return pushes.filter((x,i)=>i<=pushes.indexOf('push-'+profile.push)&&(x==='push-wall'?a.support!=='none':x==='push-incline'?a.support==='counter':floor));
 if(targets(id).includes('abs')&&!id.startsWith('push-'))return !floor?[]:['heel-slide','bird-dog',...(skills.dynamic==='dead-bug'?['dead-bug']:[]),...(['knee','full'].includes(skills.plank)?['plank-knee']:[]),...(skills.plank==='full'?['plank-full']:[]),...(['knee','full'].includes(skills.side)?['side-plank-knee']:[]),...(skills.side==='full'?['side-plank-full']:[])];
 if(id.startsWith('squat'))return [...(profile.legs==='free'?['squat-free']:[]),...(a.support==='chair'?['squat-chair']:[])];
 return [id];
}
export function level(id:string):Text{return id.endsWith('full')||id==='push-regular'?bi('سطح بالاتر؛ فقط با توان مستقل گزارش‌شده','Higher level; independently reported ability required'):id==='dead-bug'?bi('کنترل پویا؛ دامنه متناسب فرم','Dynamic control; range limited by form'):bi('پایه یا قابل ساده‌سازی','Foundation or adaptable');}
export const noSpotLoss=bi('این حرکت‌ها عضلات هدف را تقویت می‌کنند؛ کاهش چربی شکم و پهلو موضعی نیست و به الگوی کلی فعالیت، تغذیه و زمان وابسته است.','These exercises strengthen the target muscles; belly or side fat cannot be selectively reduced. Fat loss depends on overall activity, nutrition and time.');
