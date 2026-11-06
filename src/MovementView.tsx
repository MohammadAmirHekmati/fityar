import {targetText,level} from './exerciseInfo';
import React,{useState} from 'react';
import {View,Text,Image,Linking,Pressable} from 'react-native';
import {SvgXml} from 'react-native-svg';
import {movements} from './coach';
import {movementSvg} from './movementArt';
import type {Lang} from './core';
export default function MovementView({id,lang,ink='#edf5f3',details=false,compact=false}:{id:string;lang:Lang;ink?:string;details?:boolean;compact?:boolean}){
 const [open,setOpen]=useState(false);
 const m=movements[id];if(!m)return null;const fa=lang==='fa';
 const text=(s:string)=><Text style={{color:ink,fontSize:16,lineHeight:25,textAlign:fa?'right':'left',writingDirection:fa?'rtl':'ltr'}}>{s}</Text>;
 if(compact)return <View style={{gap:8}}>{text((fa?'عضلات هدف: ':'Targets: ')+targetText(id,lang))}
  <View style={{flexDirection:'row',gap:8}}>{[0,1].map(frame=><View key={frame} style={{flex:1}}><SvgXml xml={movementSvg(id,frame)} width="100%" height={130}/>{text(frame===0?(fa?'۱. شروع':'1. Start'):(fa?'۲. حرکت':'2. Move'))}</View>)}</View>
  {text(m.end[lang])}
  <Pressable accessibilityRole="button" onPress={()=>setOpen(!open)} style={{paddingVertical:12,minHeight:48}}>{text(open?(fa?'بستن روش و نکته‌ها':'Hide instructions'):(fa?'تصویرسازی • روش شروع و نکته‌ها':'Illustration • setup and tips'))}</Pressable>
  {open&&<>{text(m.start[lang])}{text(m.avoid[lang])}</>}
 </View>;
 return <View style={{gap:12}}>
 {text((fa?'عضلات هدف: ':'Targets: ')+targetText(id,lang))}{text(level(id)[lang])}
 {text(fa?'تصویرسازی آموزشی • شروع و پایان':'Educational illustration • start and finish')}
 {[0,1].map(frame=><View key={frame} style={{gap:8}}><SvgXml xml={movementSvg(id,frame)} width="100%" height={205}/>{text(`${frame+1}. ${frame===0?m.start[lang]:m.end[lang]}`)}</View>)}
 {text(m.avoid[lang])}
 {details&&id==='push-regular'&&<><Image source={require('../assets/movements/regular.jpg')} style={{width:'100%',height:180}} resizeMode="contain" accessibilityLabel={fa?'عکس واقعی شنا معمولی از پشت':'Real photograph of regular push-up, rear view'}/>{text(fa?'عکس نمونه از پشت؛ مراحل حرکت در تصویرسازی بالا است. عکس: John Severns / US Air Force، مالکیت عمومی در آمریکا، بدون تغییر.':'Rear-view reference photo; see illustrated steps above. Photo: John Severns / US Air Force, US public domain, unchanged.')}<Pressable onPress={()=>Linking.openURL('https://commons.wikimedia.org/wiki/File:Air_Force_pushup.jpg')}>{text(fa?'منبع و مجوز عکس ↗':'Photo source and license ↗')}</Pressable></>}
 </View>;
}
