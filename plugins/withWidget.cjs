/* global __dirname */
const {withAndroidManifest,withMainApplication,withDangerousMod}=require('expo/config-plugins');
const fs=require('fs'),path=require('path');
module.exports=config=>{
 config=withAndroidManifest(config,c=>{const app=c.modResults.manifest.application[0];app.service=app.service||[];if(!app.service.some(s=>s.$['android:name']==='.WorkoutAudioService'))app.service.push({$:{'android:name':'.WorkoutAudioService','android:exported':'false','android:foregroundServiceType':'mediaPlayback'}});app.receiver=app.receiver||[];if(!app.receiver.some(r=>r.$['android:name']==='.FitYarWidget'))app.receiver.push({$: {'android:name':'.FitYarWidget','android:exported':'false'},'intent-filter':[{'action':[{$:{'android:name':'android.appwidget.action.APPWIDGET_UPDATE'}}]}],'meta-data':[{$:{'android:name':'android.appwidget.provider','android:resource':'@xml/fityar_widget_info'}}]});return c;});
 config=withMainApplication(config,c=>{if(!c.modResults.contents.includes('add(FitYarWidgetPackage())'))c.modResults.contents=c.modResults.contents.replace(/PackageList\(this\)\.packages\.apply\s*\{/,m=>m+'\n        add(FitYarWidgetPackage())');if(!c.modResults.contents.includes('add(FitYarWidgetPackage())'))throw Error('Widget package registration failed');return c;});
 return withDangerousMod(config,['android',async c=>{const root=path.join(c.modRequest.platformProjectRoot,'app/src/main');files['java/com/mohammadamirhekmati/fityar/WorkoutAudioService.kt']=fs.readFileSync(path.join(__dirname,'native/WorkoutAudioService.kt'),'utf8');for(const [name,content] of Object.entries(files)){const dest=path.join(root,name);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,content);}return c;}]);
};
const files={
'res/xml/fityar_widget_info.xml':`<appwidget-provider xmlns:android="http://schemas.android.com/apk/res/android" android:minWidth="250dp" android:minHeight="180dp" android:minResizeHeight="180dp" android:updatePeriodMillis="1800000" android:initialLayout="@layout/fityar_widget" android:resizeMode="horizontal|vertical" android:widgetCategory="home_screen"/>`,
'res/layout/fityar_widget.xml':`<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android" android:id="@+id/widget_root" android:layout_width="match_parent" android:layout_height="match_parent" android:orientation="vertical" android:padding="16dp" android:background="#1b2b33"><TextView android:layout_width="match_parent" android:layout_height="wrap_content" android:text="FitYar · فیت‌یار" android:textSize="18sp" android:textColor="#b9ec85"/><TextView android:id="@+id/widget_status" android:layout_width="match_parent" android:layout_height="0dp" android:layout_weight="1" android:textSize="16sp" android:textColor="#ffffff"/><Button android:id="@+id/widget_start" android:layout_width="match_parent" android:layout_height="wrap_content" android:minHeight="48dp" android:text="Open / باز کردن"/></LinearLayout>`,
'java/com/mohammadamirhekmati/fityar/FitYarWidget.kt':`package com.mohammadamirhekmati.fityar
import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.widget.RemoteViews
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.*
import com.facebook.react.uimanager.ViewManager
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
class FitYarWidget:AppWidgetProvider(){
 override fun onUpdate(context:Context,manager:AppWidgetManager,ids:IntArray){ refresh(context) }
 companion object {
  fun refresh(context:Context){
   val prefs=context.getSharedPreferences("fityar_widget",Context.MODE_PRIVATE)
   val fa=prefs.getBoolean("fa",true)
   val today=SimpleDateFormat("yyyy-MM-dd",Locale.US).format(Date())
   val fresh=prefs.getString("date","")==today
   val status=if(fresh)prefs.getString("status","") else if(fa)"حال امروز را بررسی کن" else "Check today’s readiness"
   val action=if(fresh)prefs.getString("action","") else if(fa)"بررسی امروز" else "Check today"
   val manager=AppWidgetManager.getInstance(context)
   for(id in manager.getAppWidgetIds(ComponentName(context,FitYarWidget::class.java))){
    val views=RemoteViews(context.packageName,R.layout.fityar_widget)
    views.setTextViewText(R.id.widget_status,status)
    views.setTextViewText(R.id.widget_start,action)
    views.setInt(R.id.widget_root,"setLayoutDirection",if(fa)1 else 0)
    val intent=Intent(Intent.ACTION_VIEW,Uri.parse(if(fresh&&prefs.getBoolean("start",false))"fityar://today?start=1" else "fityar://today"),context,MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP)
    val pending=PendingIntent.getActivity(context,0,intent,PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    views.setOnClickPendingIntent(R.id.widget_start,pending)
    manager.updateAppWidget(id,views)
   }
  }
 }
}
class FitYarWidgetModule(private val ctx:ReactApplicationContext):ReactContextBaseJavaModule(ctx){
 override fun getName()="FitYarWidget"
 @ReactMethod fun update(date:String,status:String,action:String,fa:Boolean,start:Boolean){ctx.getSharedPreferences("fityar_widget",Context.MODE_PRIVATE).edit().putString("date",date).putString("status",status).putString("action",action).putBoolean("fa",fa).putBoolean("start",start).apply();FitYarWidget.refresh(ctx)}
 @ReactMethod fun audio(state:String){
  val data=org.json.JSONObject(state)
  if(!data.optBoolean("enabled",true))ctx.getSharedPreferences("workout_audio",Context.MODE_PRIVATE).edit().putBoolean("muted",false).apply()
  if(!data.optBoolean("enabled",true)||data.optBoolean("paused",true)){ctx.stopService(Intent(ctx,WorkoutAudioService::class.java));return}
  if(ctx.getSharedPreferences("workout_audio",Context.MODE_PRIVATE).getBoolean("muted",false)&&data.optString("id")==ctx.getSharedPreferences("workout_audio",Context.MODE_PRIVATE).getString("session",""))return
  ctx.getSharedPreferences("workout_audio",Context.MODE_PRIVATE).edit().putString("session",data.optString("id")).apply()
  try{val intent=Intent(ctx,WorkoutAudioService::class.java).putExtra("state",state);if(Build.VERSION.SDK_INT>=26)ctx.startForegroundService(intent)else ctx.startService(intent)}catch(e:IllegalStateException){android.util.Log.w("FitYarAudio","Start requires foreground")}
 }
 @ReactMethod fun testAudio(volume:Int){val intent=Intent(ctx,WorkoutAudioService::class.java).setAction("test").putExtra("volume",volume);if(Build.VERSION.SDK_INT>=26)ctx.startForegroundService(intent)else ctx.startService(intent)}
 @ReactMethod fun pin(promise:Promise){if(Build.VERSION.SDK_INT>=26){val manager=AppWidgetManager.getInstance(ctx);promise.resolve(manager.isRequestPinAppWidgetSupported && manager.requestPinAppWidget(ComponentName(ctx,FitYarWidget::class.java),null,null))}else promise.resolve(false)}
}
class FitYarWidgetPackage:ReactPackage{
 override fun createNativeModules(ctx:ReactApplicationContext):List<NativeModule> = listOf(FitYarWidgetModule(ctx))
 override fun createViewManagers(ctx:ReactApplicationContext):List<ViewManager<*,*>> = emptyList()
}
`};
