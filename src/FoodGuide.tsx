import React,{useState,useEffect} from 'react';
import {View,Text,Pressable,TextInput} from 'react-native';
import {allowed,dayKey,foodAdvice,foods,normalize} from './core';
import type {State} from './model';
export default function FoodGuide({s,update,advanced,onNavigate}:{s:State;update:(p:Partial<State>)=>void;advanced:()=>void;onNavigate:()=>void}){
 const [step,go]=useState(0),[hungry,H]=useState(true),[near,N]=useState(false),[selected,S]=useState(''),[portion,P]=useState(1),[query,Q]=useState('');
 useEffect(()=>onNavigate(),[step,onNavigate]);
 const fa=s.lang==='fa',t=(a:string,b:string)=>fa?a:b,ink=s.dark?'#edf5f3':'#16372e',card=s.dark?'#1b2b33':'white';
 const txt=(value:string,size=18)=><Text style={{color:ink,fontSize:size,lineHeight:size*1.5,textAlign:fa?'right':'left'}}>{value}</Text>;
 const btn=(value:string,onPress:()=>void)=><Pressable accessibilityRole="button" onPress={onPress} style={{padding:16,minHeight:52,borderRadius:15,borderWidth:1,borderColor:'#71918b'}}>{txt(value)}</Pressable>;
 const food=foods.find(f=>f.id===selected);
 return <View style={{backgroundColor:card,borderRadius:24,padding:20,gap:16}}>
 {txt(t('انتخاب غذای امروز','Today’s food choice'),27)}
 {step===0&&<>{txt(t('الان گرسنه‌ای یا بیشتر هوس داری؟','Are you hungry, or is this more of a craving?'))}{btn(t('گرسنه‌ام','I am hungry'),()=>{H(true);go(1);})}{btn(t('بیشتر هوس است','More of a craving'),()=>{H(false);go(1);})}{btn(t('فهرست، علاقه‌مندی‌ها و ثبت‌ها','Browse, favorites and logs'),advanced)}</>}
 {step===1&&<>{txt(t('به زمان تمرین نزدیک هستی؟','Is it close to your workout?'))}{btn(t('بله','Yes'),()=>{N(true);go(2);})}{btn(t('نه','No'),()=>{N(false);go(2);})}</>}
 {step===2&&<>{txt(t('چه غذایی در نظر داری؟','Which food are you considering?'))}<TextInput accessibilityLabel={t('جستجوی غذا','Search food')} placeholder={t('نام غذا','Food name')} placeholderTextColor={ink} value={query} onChangeText={Q} style={{color:ink,borderColor:'#71918b',borderWidth:1,borderRadius:12,padding:15,fontSize:17,textAlign:fa?'right':'left'}}/>{foods.filter(f=>allowed(f,s.allergies,s.vegetarian)&&normalize(f.name.fa+f.name.en+f.aliases).includes(normalize(query))).map(f=><View key={f.id}>{btn(f.name[s.lang],()=>{S(f.id);go(3);})}</View>)}{txt(t('حساسیت‌ها در تنظیمات اعمال می‌شوند. اگر غذا پیدا نشد، ترکیب یا ارزش غذایی آن را حدس نمی‌زنیم.','Allergies from Settings are applied. For unlisted foods, we do not guess ingredients or nutrition.'),14)}</>}
 {step===3&&food&&<>{txt(food.name[s.lang],24)}{txt(food.portion[s.lang])}{txt(t('چه مقدار در نظر داری؟','How much are you considering?'))}{[.5,1,2].map(p=><View key={p}>{btn(`${p} ${t('سهم','portion')}`,()=>{P(p);go(4);})}</View>)}</>}
 {step===4&&food&&<>{txt(food.name[s.lang],24)}{txt(foodAdvice(food,portion,hungry,near)[s.lang])}{hungry&&['snack','sweet'].includes(food.group)&&txt(t('جایگزین‌های موجود: ','Available alternatives: ')+(foods.filter(f=>s.available.includes(f.id)&&allowed(f,s.allergies,s.vegetarian)&&['protein','fruit'].includes(f.group)).map(f=>f.name[s.lang]).join('، ')||t('مواد موجود را در تنظیمات مشخص کن.','Choose available ingredients in Settings.')))}{<Pressable accessibilityRole="button" style={{padding:16,minHeight:52,backgroundColor:'#b9ec85',borderRadius:15}} onPress={()=>{update({meals:[{id:String(Date.now()),date:dayKey(),food:food.id,portion},...s.meals]});go(5);}}><Text style={{fontSize:18,color:'#16372e',textAlign:'center'}}>{t('ثبت این انتخاب','Log this choice')}</Text></Pressable>}</>}
 {step===5&&<>{txt(t('ثبت شد.','Logged.'))}{btn(t('انتخاب بعدی','Next choice'),()=>go(0))}{btn(t('دیدن ثبت‌ها','View logs'),advanced)}</>}
 {step>0&&step<5&&btn(t('برگشت','Back'),()=>go(step-1))}
 </View>;
}
