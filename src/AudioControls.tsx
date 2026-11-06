import React from 'react';
import {View,Text,Pressable,Switch} from 'react-native';
import type {State} from './model';
import {testAudio} from './widget';
export default function AudioControls({s,update}:{s:State;update:(p:Partial<State>)=>void}){
 const a=s.audio??{enabled:true,volume:60,vibrate:false},fa=s.lang==='fa',t=(f:string,e:string)=>fa?f:e,ink=s.dark?'#edf5f3':'#16372e';
 const text=(v:string)=><Text style={{fontSize:16,color:ink,textAlign:fa?'right':'left',lineHeight:24}}>{v}</Text>;
 const set=(v:Partial<typeof a>)=>update({audio:{...a,...v}});
 return <View style={{gap:10}}>{text(t('صدای حین تمرین (جدا از یادآورها)','Workout audio (separate from reminders)'))}<Switch accessibilityLabel="Workout sound" value={a.enabled} onValueChange={enabled=>set({enabled})}/>{text(t('بلندی نسبت به صدای رسانه دستگاه:','Level relative to device media volume:'))}<View style={{flexDirection:'row',gap:8}}>{[30,60,100].map(volume=><Pressable accessibilityRole="button" key={volume} onPress={()=>set({volume})} style={{padding:14,borderWidth:1,borderColor:'#83a196'}}>{text(`${a.volume===volume?'✓ ':''}${volume}%`)}</Pressable>)}</View>{text(t('لرزش مکمل','Supplementary vibration'))}<Switch accessibilityLabel="Workout vibration" value={a.vibrate} onValueChange={vibrate=>set({vibrate})}/>{!s.active&&<Pressable accessibilityRole="button" onPress={()=>testAudio(a.volume)} style={{padding:16,borderWidth:1,borderColor:'#83a196',borderRadius:12}}>{text(t('آزمایش صدا','Test workout sound'))}</Pressable>}{text(t('صدای رسانه را روی دستگاه تنظیم کن. بی‌صدا و مزاحم نشوید رعایت می‌شوند. بوق شمارش فقط برای بازه زمان‌دار است؛ پایان زمان به معنی انجام همه تکرارها نیست.','Adjust media volume on your device. Silent mode and Do Not Disturb are respected. Countdown beeps apply only to timed intervals; a finished window does not prove repetitions were completed.'))}</View>;
}
