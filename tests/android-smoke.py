"""Synthetic emulator acceptance / پذیرش شبیه‌ساز با داده ساختگی."""
import os,re,subprocess,time,xml.etree.ElementTree as ET
APP='com.mohammadamirhekmati.fityar'
os.makedirs('screenshots',exist_ok=True)
def adb(*args): return subprocess.check_output(['adb',*args],text=True)
def tree():
    adb('shell','uiautomator','dump','/sdcard/window.xml')
    return ET.fromstring(adb('shell','cat','/sdcard/window.xml'))
def center(node):
    a=list(map(int,re.findall(r'\d+',node.attrib['bounds'])))
    return str((a[0]+a[2])//2),str((a[1]+a[3])//2)
def click(label,scroll=False):
    for _ in range(8 if scroll else 2):
        for node in tree().iter('node'):
            if node.attrib.get('text')==label or node.attrib.get('content-desc')==label:
                adb('shell','input','tap',*center(node));time.sleep(1);return
        if scroll: adb('shell','input','swipe','300','1450','300','500','400');time.sleep(1)
    raise AssertionError('Missing control: '+label)
def shot(name):
    with open('screenshots/'+name+'.png','wb') as f: subprocess.run(['adb','exec-out','screencap','-p'],stdout=f,check=True)
def launch():
    adb('shell','monkey','-p',APP,'1');time.sleep(8)
adb('install','-r','fityar.apk');launch();shot('01-onboarding-fa');click('EN');shot('02-onboarding-en')
edits=[n for n in tree().iter('node') if n.attrib.get('class')=='android.widget.EditText']
assert edits,'Age input missing'
adb('shell','input','tap',*center(edits[0]));adb('shell','input','text','30');adb('shell','input','keyevent','4');click('Begin',True);shot('03-today-en')
for tab in ['Food','Progress','Settings','Train']:
    click(tab);shot('04-'+tab.lower())
click('Settings');adb('shell','pm','grant',APP,'android.permission.POST_NOTIFICATIONS');click('Test notification in 5 seconds',True);adb('shell','input','keyevent','3');time.sleep(7)
notification_dump=adb('shell','dumpsys','notification','--noredact')
assert 'Movement reminder; check how you feel.' in notification_dump,'Background test notification missing'
adb('shell','cmd','statusbar','expand-notifications');time.sleep(1);shot('04-notification');adb('shell','input','keyevent','4');launch();click('Train')
click('Start',True);shot('05-session');adb('shell','input','keyevent','3');time.sleep(4);adb('shell','am','force-stop',APP);launch();click('Train');shot('06-restored-session')
assert any(n.attrib.get('text')=='Current session' for n in tree().iter('node')),'Session did not persist'
adb('install','-r','fityar.apk');launch();click('Train');assert any(n.attrib.get('text')=='Current session' for n in tree().iter('node')),'Reinstall erased session'
click('فا');shot('07-session-fa')
logs=adb('logcat','-d','-s','AndroidRuntime:E','ReactNativeJS:E')
with open('screenshots/runtime.txt','w') as f:f.write(logs)
assert 'FATAL EXCEPTION' not in logs and 'TypeError' not in logs,logs
print('Emulator smoke passed / آزمون شبیه‌ساز موفق')
