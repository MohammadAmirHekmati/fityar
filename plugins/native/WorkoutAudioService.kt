package com.mohammadamirhekmati.fityar
import android.app.*
import android.content.*
import android.media.*
import android.os.*
import org.json.JSONObject
import kotlin.math.*

// Offline audio is driven by a native foreground service, never by JS intervals.
class WorkoutAudioService:Service(){
 private val handler=Handler(Looper.getMainLooper())
 private var state=JSONObject()
 private var tone:ToneGenerator?=null
 private var focus:AudioFocusRequest?=null
 private var wake:PowerManager.WakeLock?=null
 private var lastIndex=-2
 private var lastCount=-1
 private var session=""
 private var muted=false
 private val runner=object:Runnable{override fun run(){tick();handler.postDelayed(this,200)}}
 override fun onBind(intent:Intent?)=null
 override fun onCreate(){super.onCreate();val manager=getSystemService(NotificationManager::class.java);manager.createNotificationChannel(NotificationChannel("workout-audio","Workout timer / صدای تمرین",NotificationManager.IMPORTANCE_LOW).apply{setSound(null,null);enableVibration(false)})}
 override fun onStartCommand(intent:Intent?,flags:Int,startId:Int):Int{
  if(intent?.action=="mute"){muted=true;getSharedPreferences("workout_audio",MODE_PRIVATE).edit().putBoolean("muted",true).apply();stopSelf();return START_NOT_STICKY}
  if(intent?.action=="test"){startForeground(812,notification("Sound test / آزمایش صدا"));play(ToneGenerator.TONE_PROP_ACK,500,intent.getIntExtra("volume",60));handler.postDelayed({stopSelf()},900);return START_NOT_STICKY}
  state=JSONObject(intent?.getStringExtra("state")?:"{}")
  val id=state.optString("id")
  if(session!=id){session=id;lastIndex=-2;lastCount=-1;muted=false;getSharedPreferences("workout_audio",MODE_PRIVATE).edit().putBoolean("muted",false).apply()}
  if(!state.optBoolean("enabled",true)||state.optBoolean("paused",true)){stopSelf();return START_NOT_STICKY}
  startForeground(812,notification(if(state.optBoolean("fa"))"تایمر تمرین فعال است" else "Workout timer running"))
  if(wake==null){wake=(getSystemService(POWER_SERVICE) as PowerManager).newWakeLock(PowerManager.PARTIAL_WAKE_LOCK,"FitYar:WorkoutAudio");wake?.acquire(3*60*60*1000L)}
  handler.removeCallbacks(runner);runner.run();return START_NOT_STICKY
 }
 private fun notification(text:String):Notification{
  val open=PendingIntent.getActivity(this,1,Intent(this,MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP),PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
  val stop=PendingIntent.getService(this,2,Intent(this,WorkoutAudioService::class.java).setAction("mute"),PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
  return Notification.Builder(this,"workout-audio").setSmallIcon(android.R.drawable.ic_media_play).setContentTitle("FitYar").setContentText(text).setContentIntent(open).setOngoing(true).addAction(Notification.Action.Builder(null,"Mute / بی‌صدا",stop).build()).build()
 }
 private fun tick(){
  val steps=state.optJSONArray("steps")?:return
  val seconds=state.optDouble("elapsed")+max(0.0,(System.currentTimeMillis()-state.optDouble("started"))/1000)
  val acknowledged=state.optJSONArray("transitions")
  var end=0.0;var index=steps.length();var remaining=0
  for(i in 0 until steps.length()){
   val step=steps.getJSONObject(i)
   if(step.optBoolean("transition")&&(0 until (acknowledged?.length()?:0)).none{acknowledged!!.getInt(it)==i}){
    if(seconds>=end){stopSelf();return}
   }
   end+=step.getDouble("seconds")
   if(seconds<end){index=i;remaining=ceil(end-seconds).toInt();break}
  }
  val prefs=getSharedPreferences("workout_audio",MODE_PRIVATE)
  val key="$session:$index"
  val step=if(index<steps.length())steps.getJSONObject(index)else null
  if(lastIndex!=index){
   // Store before playback: recreation/resume cannot repeat a boundary, and only the current event plays.
   if(prefs.getString("event","")!=key){
    prefs.edit().putString("event",key).apply()
    val sound=if(step==null)ToneGenerator.TONE_CDMA_ALERT_CALL_GUARD else if(!step.has("exercise"))ToneGenerator.TONE_PROP_BEEP2 else ToneGenerator.TONE_PROP_ACK
    play(sound,if(step==null)700 else 280,state.optInt("volume",60))
    android.util.Log.i("FitYarAudio","boundary $index")
   }
   lastIndex=index;lastCount=-1
  }
  if(step==null){handler.postDelayed({stopSelf()},850);return}
  // Rep windows are not rep counters: no countdown or claim that repetitions were completed.
  if(!step.has("reps")&&remaining in 1..3&&remaining!=lastCount){
   val countKey="$key:$remaining"
   if(prefs.getString("count","")!=countKey){prefs.edit().putString("count",countKey).apply();play(ToneGenerator.TONE_PROP_BEEP,90,state.optInt("volume",60))}
   lastCount=remaining
  }
 }
 private fun play(kind:Int,duration:Int,volume:Int){
  val audio=getSystemService(AUDIO_SERVICE) as AudioManager
  val manager=getSystemService(NotificationManager::class.java)
  if(muted||audio.ringerMode!=AudioManager.RINGER_MODE_NORMAL||manager.currentInterruptionFilter!=NotificationManager.INTERRUPTION_FILTER_ALL||audio.getStreamVolume(AudioManager.STREAM_MUSIC)==0)return
  tone?.release();focus?.let{audio.abandonAudioFocusRequest(it)}
  val request=AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK).setAudioAttributes(AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_MEDIA).setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION).build()).setOnAudioFocusChangeListener{change->if(change<0)tone?.stopTone()}.build()
  focus=request
  if(audio.requestAudioFocus(request)!=AudioManager.AUDIOFOCUS_REQUEST_GRANTED)return
  tone=ToneGenerator(AudioManager.STREAM_MUSIC,volume.coerceIn(0,100));tone?.startTone(kind,duration)
  if(state.optBoolean("vibrate",false)){val v=getSystemService(VIBRATOR_SERVICE) as Vibrator;v.vibrate(VibrationEffect.createOneShot(100,VibrationEffect.DEFAULT_AMPLITUDE))}
  handler.postDelayed({tone?.stopTone();audio.abandonAudioFocusRequest(request)},duration.toLong()+20)
 }
 override fun onDestroy(){handler.removeCallbacksAndMessages(null);tone?.release();focus?.let{(getSystemService(AUDIO_SERVICE) as AudioManager).abandonAudioFocusRequest(it)};wake?.let{if(it.isHeld)it.release()};super.onDestroy()}
}
