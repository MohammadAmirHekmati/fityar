"""V1 -> V2 upgrade and guided acceptance, synthetic data only."""
import os,re,subprocess,time,xml.etree.ElementTree as ET,urllib.request
APP='com.mohammadamirhekmati.fityar'
os.makedirs('screenshots',exist_ok=True)
def adb(*args): return subprocess.check_output(['adb',*args],text=True,timeout=35)
def tree():
    adb('shell','uiautomator','dump','/sdcard/window.xml')
    return ET.fromstring(adb('shell','cat','/sdcard/window.xml'))
def center(n):
    a=list(map(int,re.findall(r'\d+',n.attrib['bounds'])))
    return str((a[0]+a[2])//2),str((a[1]+a[3])//2)
def shot(name):
    with open('screenshots/'+name+'.png','wb') as f:subprocess.run(['adb','exec-out','screencap','-p'],stdout=f,check=True)
def click(label,scroll=False):
    for _ in range(12 if scroll else 2):
        matches=[n for n in tree().iter('node') if n.attrib.get('text')==label or n.attrib.get('content-desc')==label]
        matches.sort(key=lambda n:n.attrib.get('clickable')!='true')
        if matches:
            adb('shell','input','tap',*center(matches[0]));time.sleep(1.2);return
        if scroll:adb('shell','input','swipe','300','1450','300','600','350');time.sleep(.6)
    shot('missing-'+re.sub(r'[^a-zA-Z0-9]','_',label))
    raise AssertionError('Missing control: '+label)
def has(text):return any(text in n.attrib.get('text','') for n in tree().iter('node'))
def launch():adb('shell','monkey','-p',APP,'1');time.sleep(7)
def enter(label,value):
    for _ in range(12):
        edits=[n for n in tree().iter('node') if n.attrib.get('class')=='android.widget.EditText' and n.attrib.get('content-desc')==label]
        if edits:
            adb('shell','input','tap',*center(edits[0]));adb('shell','input','text',value);adb('shell','input','keyevent','4');time.sleep(.5);return
        adb('shell','input','swipe','300','1450','300','600','350');time.sleep(.5)
    raise AssertionError('Missing input: '+label)
def answers(values):
    for v in values:click(v,True)
    click('Confirm and continue',True)
# Install the actually released v1, populate its own UI, then upgrade without clearing data.
urllib.request.urlretrieve('https://github.com/MohammadAmirHekmati/fityar/releases/download/v1.0.0-preview.7/fityar.apk','previous.apk')
adb('install','-r','previous.apk');launch();click('EN')
enter('Age (18 or older)','30');click('Begin',True)
click('Progress');enter('Weight (kg)','70');enter('Waist (cm)','90');click('Save measurements',True)
click('Food');click('Log today',True)
click('Today');click('Mark today as not done',True);shot('01-v1-data')
adb('shell','am','force-stop',APP);adb('shell','svc','wifi','disable');adb('shell','svc','data','disable');adb('install','-r','fityar.apk');launch();shot('02-upgraded')
assert 'versionCode=2' in adb('shell','dumpsys','package',APP),'Wrong versionCode'
click('Progress');click('Last 7 readings average: 70.0 kg',True);shot('03-retained-measurement');click('Manually marked not done',True);shot('03-retained-history')
click('Food');click('Browse, favorites and logs');enter('Search food or alias','Rice');click('Today’s food log',True);assert has('Rice · 1'),'V1 food missing';shot('04-retained-food')
click('Today');click('Get started');click('Yes');click('No');shot('05-question-en')
# Question cursor persists across force-stop, and back/edit works.
adb('shell','am','force-stop',APP);launch();assert has('Which push-up'),'Question did not persist'
click('Back and edit');click('✓ No');click('Knee push-up');click('6–10');click('Squat without a chair');click('Yes, getting down and up is comfortable');click('20 minutes or more');click('No or unsure');click('Confirm and continue',True)
click('My plan today');answers(['No','No, I feel well','Enough and acceptable','Good','10 minutes','Indoors','None']);shot('06-plan-en')
assert has('Knee push-up'),'Reported knee push-up not selected'
click('This does not suit me today',True);answers(['No support available']);assert has('Knee push-up')
click('Start plan');time.sleep(2);shot('07-warmup-en')
# A moving timer may prevent UIAutomator idling. Freeze by tapping the visible Pause control if needed.
click('Pause',True);shot('08-paused-warmup')
for _ in range(4):click('Skip this step',True)
shot('08-strength-stage')
for _ in range(2):click('Skip this step',True)
shot('08-knee-work-stage')
adb('shell','am','force-stop',APP);launch();assert has('Resume'),'Paused session did not persist'
click('Finish early and record',True);answers(['Moderate — 5 out of 10','Yes','No','None']);shot('09-result-en')
assert has('Today’s session is saved'),'Result not saved'
click('My plan today');answers(['No','No, I feel well','Enough and acceptable','Good','10 minutes','Indoors','None'])
click('Update recovery',True);answers(['Pain or substantial fatigue']);shot('09-recovery-answer')
click('My plan today');answers(['No','No, I feel well','Enough and acceptable','Good','10 minutes','Indoors','None']);assert has('Previous pain or poor recovery is unresolved'),'Poor recovery did not block exercise';shot('09-recovery-block')
click('Update recovery',True);answers(['Comfortable and recovered'])
# Persian full check -> plan -> guided session -> result, with same retained profile.
click('فا');click('برنامه امروز من');
for label in ['نه','نه، حالم خوب است','کافی و قابل قبول','معمولی','۵ دقیقه','داخل خانه','هیچ‌کدام']:click(label,True)
shot('10-questions-fa');click('تأیید و ادامه',True);shot('11-plan-fa');click('شروع برنامه');click('مکث',True);shot('12-session-fa');click('پایان زودتر و ثبت نتیجه',True)
for label in ['راحت — ۳ از ۱۰','بله','نه','هیچ‌کدام']:click(label,True)
click('تأیید و ادامه',True);shot('13-result-fa')
click('EN');click('Library');click('Knee push-up',True);shot('14-knee-teaching')
click('Settings');adb('shell','pm','grant',APP,'android.permission.POST_NOTIFICATIONS');adb('shell','appops','set',APP,'SCHEDULE_EXACT_ALARM','allow');click('Test notification in 5 seconds',True);adb('shell','input','keyevent','3')
for _ in range(12):
    time.sleep(5);dump=adb('shell','dumpsys','notification','--noredact')
    if 'Movement reminder; check how you feel.' in dump:break
assert 'Movement reminder; check how you feel.' in dump,'Background test notification missing'
adb('shell','cmd','statusbar','expand-notifications');shot('15-notification');adb('shell','input','keyevent','4');launch()
# Compact viewport and large text: exercise navigation and capture real native screens.
adb('shell','settings','put','system','font_scale','1.3');adb('shell','wm','size','960x1600');adb('shell','am','force-stop',APP);launch();click('Library');shot('16-compact-large-font');click('Settings');click('Today');shot('17-compact-today');click('فا');shot('18-compact-persian')
adb('shell','settings','put','system','font_scale','1.0');adb('shell','wm','size','reset')
logs=adb('logcat','-d','-s','AndroidRuntime:E','ReactNativeJS:E')
with open('screenshots/runtime.txt','w') as f:f.write(logs)
assert 'FATAL EXCEPTION' not in logs and 'TypeError' not in logs,logs
print('Upgrade, guided fa/en, persistence and notification passed / ارتقا و مسیر مرحله‌ای موفق')
