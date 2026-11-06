"""Focused v3 upgrade and interrupted-session regression; synthetic emulator only."""
from pathlib import Path
exec(compile(Path('tests/android-smoke.py').read_text(encoding='utf-8-sig').split('# UIAutomator helper')[0], 'ui-helpers', 'exec'))

def failure(kind,value,trace):
    try:
        shot('failure')
        Path('screenshots/failure.xml').write_text(ET.tostring(tree(),encoding='unicode'))
        Path('screenshots/runtime.txt').write_text(adb('logcat','-d'))
    finally:sys.__excepthook__(kind,value,trace)
sys.excepthook=failure
assert adb('shell','getprop','ro.kernel.qemu').strip()=='1'
for pattern in ['**/acceptance-debug.apk','**/acceptance-debug-androidTest.apk']:
    paths=glob.glob(pattern,recursive=True);assert paths;adb('install','-r',paths[0])
urllib.request.urlretrieve('https://github.com/MohammadAmirHekmati/fityar/releases/download/v1.2.0-preview.16/fityar.apk','previous.apk')
adb('install','-r','previous.apk');launch();click('EN');click('Get started')
answers(['Yes','No','Knee push-up','6–10','Squat without a chair','Yes, getting down and up is comfortable','20 minutes or more','No or unsure'])
click('My plan today');answers(['No','No, I feel well','Enough and acceptable','Good','30 minutes','Indoors','None'])
click('Start plan');pause_timer();click('Finish early and record');answers(['Easy — 3 out of 10','Yes','No','None'])
exec(compile(Path('tests/android-extended.py').read_text(encoding='utf-8-sig').split('def schedules():')[0], 'emulator-storage', 'exec'))

def legacy(s):
    # Exact reported chain; no real health records. The preceding record was made through v3 UI.
    s['sessions'][0].update(minutes=2,planned=5,mode='home',recovery=2)
    s['reminders']['enabled']=False
snapshot(legacy);before=snapshot()
adb('install','-r','fityar.apk');launch()
assert 'versionCode=4' in adb('shell','dumpsys','package',APP)
assert snapshot()['sessions']==before['sessions']
assert snapshot()['coach']['profile']==before['coach']['profile']
assert seek('Clarify previous stop');shot('v4-01-legacy-clarification')
click('Clarify previous stop');answers(['Ran out of time; no physical difficulty','Warm-up only; no main sets'])
row=snapshot()['sessions'][0];assert row['status']=='partial' and row['minutes']==2 and row['planned']==5 and row['stopReason']=='time'
click('My plan today');answers(['No','No, I feel well','Enough and acceptable','Good','30 minutes','Indoors','None'])
assert seek('25 minutes, including warm-up and cool-down');shot('v4-02-main-plan')
assert seek('Knee push-up · 2 sets');assert seek('Bird dog');shot('v4-03-main-sets')
click('Start plan');pause_timer();a=snapshot()['active']
assert a['program']['kind']=='strength'
work=[x for x in a['steps'] if x['phase']=='work' and x.get('exercise')]
assert len(work)==12 and len(set(x['exercise'] for x in work))==6
click('Finish early and record');answers(['Easy — 3 out of 10','Yes','No','None'])
answers(['Only tested the app; did not exercise'])
row=snapshot()['sessions'][0];assert row['status']=='partial' and row['stopReason']=='test' and row['load']['work']==0
click('My plan today');answers(['No','No, I feel well','Enough and acceptable','Good','30 minutes','Indoors','None'])
assert seek('25 minutes, including warm-up and cool-down');shot('v4-04-after-test')

def fatigued(s):
    now=device_now();s['sessions']=[dict(before['sessions'][0],id='synthetic-fatigue',at=now-3600000,minutes=15,planned=25,mode='strength',stopReason='fatigue',activity='main',effort=8,recovery=5)]
snapshot(fatigued);launch();assert seek('Recovery day');assert seek('Next main session');shot('v4-05-recovery')
def painful(s):s['sessions'][0].update(pain=True,stopReason='pain',recovery=8)
snapshot(painful);launch();assert seek('Record recovery');assert not has('Start plan');shot('v4-06-pain-block')
click('Record recovery');answers(['Comfortable and recovered'])
def recovered(s):s['sessions'][0]['at']=device_now()-3*86400000
snapshot(recovered);launch();click('My plan today');answers(['No','No, I feel well','Enough and acceptable','Good','30 minutes','Indoors','None'])
assert seek('25 minutes, including warm-up and cool-down')
click('فا');shot('v4-07-persian-plan')
click('EN');click('Library');click('Gentle shoulder-blade squeeze');shot('v4-08-back-guide')
logs=adb('logcat','-d','-s','AndroidRuntime:E','ReactNativeJS:E')
Path('screenshots/runtime.txt').write_text(logs)
assert 'FATAL EXCEPTION' not in logs and 'TypeError' not in logs,logs
print('V4 same-key upgrade, legacy correction, 25-minute main session, test-only repeat, fatigue and pain checks passed / پذیرش هدفمند نسخه چهارم موفق')
