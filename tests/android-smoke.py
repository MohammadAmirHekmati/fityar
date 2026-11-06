"""V1 -> V2 upgrade and guided acceptance, synthetic data only."""
import os,re,subprocess,time,xml.etree.ElementTree as ET,urllib.request,glob,sys,wave,array
APP='com.mohammadamirhekmati.fityar'
os.makedirs('screenshots',exist_ok=True)
def adb(*args): return subprocess.check_output(['adb',*args],text=True,timeout=35)
def tree():
    result=adb('shell','am','instrument','-w','-e','class','fityar.test.Dump','fityar.acceptance.test/androidx.test.runner.AndroidJUnitRunner')
    assert 'OK (1 test)' in result,result
    return ET.fromstring(adb('shell','cat','/sdcard/Android/data/fityar.acceptance/files/window.xml'))
def center(n):
    a=list(map(int,re.findall(r'\d+',n.attrib['bounds'])))
    return str((a[0]+a[2])//2),str((a[1]+a[3])//2)
def shot(name):
    with open('screenshots/'+name+'.png','wb') as f:subprocess.run(['adb','exec-out','screencap','-p'],stdout=f,check=True)
def on_error(kind,value,trace):
    try:
        shot('failure')
        with open('screenshots/failure.xml','w') as f:f.write(ET.tostring(tree(),encoding='unicode'))
    finally:sys.__excepthook__(kind,value,trace)
sys.excepthook=on_error

def visible(node,root,label):
    box=list(map(int,re.findall(r'\d+',node.attrib.get('bounds',''))))
    if len(box)!=4 or box[2]<=box[0] or box[3]<=box[1]:return False
    nav=['Today','Library','Train','Food','Progress','Settings','امروز','حرکت‌ها','غذا','روند','تنظیمات']
    if label in nav+['EN','فا']:return True
    bottom=max([int(re.findall(r'\d+',n.attrib.get('bounds','[0,0][0,0]'))[-1]) for n in root.iter('node')])
    navtop=[]
    for n in root.iter('node'):
        if n.attrib.get('text') in nav or n.attrib.get('content-desc') in nav:
            b=list(map(int,re.findall(r'\d+',n.attrib['bounds'])))
            if b[1]>bottom*.7:navtop.append(b[1] if n.attrib.get('clickable')=='true' else b[1]-50)
    return box[3]<=min(navtop,default=bottom)
def click(label,scroll=True,before=None):
    for _ in range(28 if scroll else 2):
        root=tree()
        matches=[n for n in root.iter('node') if (n.attrib.get('text','').removeprefix('✓ ').casefold()==label.removeprefix('✓ ').casefold() or n.attrib.get('content-desc','').removeprefix('✓ ').casefold()==label.removeprefix('✓ ').casefold()) and visible(n,root,label)]
        matches.sort(key=lambda n:n.attrib.get('clickable')!='true')
        if matches:
            if before:before()
            adb('shell','input','tap',*center(matches[0]));time.sleep(1.2);return
        if scroll:
            start,end=('1300','850') if _<14 else ('850','1300')
            adb('shell','input','swipe','300',start,'300',end,'350');time.sleep(.8)
    shot('missing-'+re.sub(r'[^a-zA-Z0-9]','_',label))
    raise AssertionError('Missing control: '+label)
def has(text):return any(text.casefold() in n.attrib.get('text','').casefold() or text.casefold() in n.attrib.get('content-desc','').casefold() for n in tree().iter('node'))
def seek(text):
    for _ in range(12):
        if has(text):return True
        adb('shell','input','swipe','300','1450','300','600','350');time.sleep(.5)
    return False

def pause_timer():
    click('Pause');assert has('Resume'),'Pause failed'

def launch():
    adb('shell','monkey','-p',APP,'1');time.sleep(7)
    if any('inputmethod' in n.attrib.get('package','') for n in tree().iter('node')):
        adb('shell','input','keyevent','4');time.sleep(.5)
def enter(label,value):
    for _ in range(12):
        root=tree()
        edits=[n for n in root.iter('node') if n.attrib.get('class')=='android.widget.EditText' and n.attrib.get('content-desc')==label and visible(n,root,label)]
        if edits:
            adb('shell','input','tap',*center(edits[0]));adb('shell','input','keyevent','123');adb('shell','input','keyevent',*(['67']*40));adb('shell','input','text',value);adb('shell','input','keyevent','4');time.sleep(.5);return
        adb('shell','input','swipe','300','1450','300','600','350');time.sleep(.5)
    raise AssertionError('Missing input: '+label)
def answers(values):
    for v in values:click(v,True)
    click('Confirm and continue',True)
def capture_audio(name,seconds):
    return subprocess.Popen(['ffmpeg','-hide_banner','-loglevel','error','-y','-f','pulse','-i','fityar_test.monitor','-t',str(seconds),'-ac','1','-ar','16000','screenshots/'+name+'.wav'])

def audio_peak(name):
    with wave.open('screenshots/'+name+'.wav','rb') as f:
        samples=array.array('h',f.readframes(f.getnframes()))
    return max((abs(x) for x in samples),default=0)

# UIAutomator helper disables idle waiting so live countdowns cannot return stale trees.
for pattern in ['**/acceptance-debug.apk','**/acceptance-debug-androidTest.apk']:
    paths=glob.glob(pattern,recursive=True);assert paths,pattern;adb('install','-r',paths[0])
urllib.request.urlretrieve('https://github.com/MohammadAmirHekmati/fityar/releases/download/v1.1.0-preview.12/fityar.apk','previous.apk')
adb('shell','settings','put','system','sound_effects_enabled','0')
adb('shell','settings','put','system','lockscreen_sounds_enabled','0')
adb('shell','cmd','media_session','volume','--stream','3','--set','10')
adb('install','-r','previous.apk');launch();click('EN');click('Get started')
answers(['Yes','No','Knee push-up','6–10','Squat without a chair','Yes, getting down and up is comfortable','20 minutes or more','No or unsure'])
click('Progress');enter('Weight (kg)','70');enter('Waist (cm)','90');click('Save measurements')
click('Settings');click('Activity and habit logs');click('Mark today as not done')
click('Food');click('Browse, favorites and logs');enter('Search food or alias','Rice');click('Log today')
click('Today');click('My plan today');answers(['No','No, I feel well','Enough and acceptable','Good','20 minutes','Indoors','None']);shot('01-v2-ready')
adb('shell','am','force-stop',APP);adb('shell','svc','wifi','disable');adb('shell','svc','data','disable');adb('install','-r','fityar.apk');launch()
assert 'versionCode=3' in adb('shell','dumpsys','package',APP)
assert seek('Knee push-up'),'Guided profile or ready plan lost on upgrade';shot('02-upgraded-plan')
click('Progress');click('Last 7 readings average: 70.0 kg');click('Manually marked not done');shot('03-retained-data')
click('Food');click('Browse, favorites and logs');enter('Search food or alias','Rice');click('Today’s food log');assert has('Rice · 1'),'Food record lost on upgrade'
click('Today');click('Edit ability and restrictions');click('Exit check');assert has('My plan today'),'Unchanged reassessment did not exit'
click('Edit ability and restrictions');click('No');click('Exit check');click('Discard changes');assert seek('Knee push-up'),'Discard changed prior profile'
click('Edit ability and restrictions');click('No');click('Exit check');click('Save for later');assert seek('Knee push-up');click('Edit today’s answers');click('Exit check');click('Resume saved draft');click('Exit check');click('Discard changes');shot('04-cancel-preserves-plan')
click('Edit today’s answers')
for label in ['No','No, I feel well','Enough and acceptable','Good']:click(label)
shot('05-duration-options');enter('Custom minutes','121');click('Use custom time');assert has('Enter a whole number');click('OK')
enter('Custom minutes','37');click('Use custom time');click('Both indoors and outside');click('None');click('Confirm and continue');shot('06-custom-both-preview')
assert seek('Knee push-up');assert seek('Today’s main work')
if os.environ.get('FITYAR_AUDIO_TEST')=='1':
    baseline=capture_audio('audio-baseline',2);baseline.wait(timeout=10)
    recording=[]
    def start_capture():
        recording.append(capture_audio('audio-test-tone',4));time.sleep(.5)
    click('Test workout sound',before=start_capture);recording[0].wait(timeout=10)
    assert audio_peak('audio-test-tone')>max(100,audio_peak('audio-baseline')*3),'Workout test produced no measurable audio'
else:click('Test workout sound')
time.sleep(2)
click('Start plan');time.sleep(2);shot('07-active-warmup');pause_timer();shot('08-paused')
for _ in range(4):click('Skip this step')
assert has('Free squat'),'Warmup skip unexpectedly ended the whole session';shot('09-main-work')
click('Resume');time.sleep(2);adb('shell','input','keyevent','3');time.sleep(3)
assert 'WorkoutAudioService' in adb('shell','dumpsys','activity','services',APP),'Native audio service not running in background'
background_capture=capture_audio('audio-screen-off',50) if os.environ.get('FITYAR_AUDIO_TEST')=='1' else None
adb('shell','input','keyevent','26');time.sleep(50)
if background_capture:
    background_capture.wait(timeout=10)
    assert audio_peak('audio-screen-off')>100,'No measurable workout audio with screen off'
background_logs=adb('logcat','-d','-s','FitYarAudio:I')
assert re.search(r'boundary [56]\b',background_logs),'No timer boundary while screen was off'
adb('shell','input','keyevent','26');adb('shell','input','keyevent','82');shot('10-background');launch();pause_timer()
for _ in range(12):
    if any(n.attrib.get('text')=='Knee push-up' for n in tree().iter('node')):break
    click('Skip this step')
assert seek('Knee push-up');shot('11-push-set')
adb('shell','am','force-stop',APP);launch();assert has('Resume'),'Paused session lost'
click('Finish early and record');answers(['Moderate — 5 out of 10','Yes','No','None']);assert has('Today’s session is saved');shot('12-saved-partial')
click('Settings');adb('shell','pm','grant',APP,'android.permission.POST_NOTIFICATIONS');adb('shell','appops','set',APP,'SCHEDULE_EXACT_ALARM','allow')
# Make the quiet interval empty for the explicit delivery test, independent of runner timezone.
enter('Quiet hours start (0–23)','8');enter('Quiet hours end (0–23)','8')
click('Test notification in 5 seconds');adb('shell','input','keyevent','3');time.sleep(8)
assert 'Movement reminder; check how you feel.' in adb('shell','dumpsys','notification','--noredact'),'Test notification missing'
adb('shell','cmd','statusbar','expand-notifications');time.sleep(2);shot('13-notification');adb('shell','input','keyevent','4');launch()
click('Settings');click('Add home screen widget');time.sleep(2);shot('14-widget-pin')
# Launcher confirmation differs by Android launcher, use visible wording only.
if has('Add automatically'):click('Add automatically')
elif has('Add to home screen'):click('Add to home screen')
elif has('Add widget'):click('Add widget')
adb('shell','input','keyevent','3');time.sleep(2);shot('15-widget-home')
assert 'FitYarWidget' in adb('shell','dumpsys','appwidget'),'Widget provider not registered'
adb('shell','am','start','-W','-a','android.intent.action.VIEW','-d','fityar://today',APP);time.sleep(3);assert has('My plan today'),'Widget deep link failed'
click('فا');click('برنامه امروز من')
for label in ['نه','نه، حالم خوب است','کافی و قابل قبول','معمولی','۳۰ دقیقه','هر دو؛ خانه و بیرون','هیچ‌کدام']:click(label)
click('تأیید و ادامه');shot('16-persian-plan')
adb('shell','settings','put','system','font_scale','1.3');adb('shell','wm','size','960x1600');adb('shell','am','force-stop',APP);launch();shot('17-compact-persian');click('EN');shot('18-compact-english')
adb('shell','settings','put','system','font_scale','1.0');adb('shell','wm','size','reset')
logs=adb('logcat','-d','-s','AndroidRuntime:E','ReactNativeJS:E','FitYarAudio:I')
with open('screenshots/runtime.txt','w') as f:f.write(logs)
assert 'FATAL EXCEPTION' not in logs and 'TypeError' not in logs,logs
assert 'boundary' in logs,'No native audio boundary executed'
assert len(re.findall(r'boundary 4\b',logs))==1,'Audio boundary repeated across resume/foreground'
print('V2 upgrade, transactional drafts, custom time, both access, workout, native audio service, notifications and widget registration passed / پذیرش نسخه سوم')

if os.environ.get('FITYAR_AUDIO_TEST')=='1':
    exec(compile(open('tests/android-extended.py',encoding='utf-8-sig').read(),'tests/android-extended.py','exec'))
