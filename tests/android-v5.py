"""Real UI completion + restart + injected SQLite failure; synthetic emulator only."""
from pathlib import Path
exec(compile(Path('tests/android-smoke.py').read_text(encoding='utf-8-sig').split('# UIAutomator helper')[0], 'ui-helpers', 'exec'))
def failure(kind,value,trace):
    try:
        shot('failure');Path('screenshots/failure.xml').write_text(ET.tostring(tree(),encoding='unicode'));Path('screenshots/runtime.txt').write_text(adb('logcat','-d'))
    finally:sys.__excepthook__(kind,value,trace)
sys.excepthook=failure
assert adb('shell','getprop','ro.kernel.qemu').strip()=='1'
for pattern in ['**/acceptance-debug.apk','**/acceptance-debug-androidTest.apk']:
    paths=glob.glob(pattern,recursive=True);assert paths;adb('install','-r',paths[0])
urllib.request.urlretrieve('https://github.com/MohammadAmirHekmati/fityar/releases/download/v1.3.0-preview.18/fityar.apk','previous.apk')
adb('install','-r','previous.apk');launch();click('EN');click('Get started')
answers(['Yes','No','Knee push-up','6–10','Squat without a chair','Yes, getting down and up is comfortable','20 minutes or more','No or unsure'])
click('My plan today');answers(['No','No, I feel well','Enough and acceptable','Good','30 minutes','Indoors','None'])
click('Start plan');pause_timer();click('Finish early and record');answers(['Easy — 3 out of 10','Yes','No','None'])
exec(compile(Path('tests/android-extended.py').read_text(encoding='utf-8-sig').split('def schedules():')[0], 'emulator-storage', 'exec'))
old=snapshot();assert len(old['sessions'])==0 and old['active'] and old['coach']['flow']['kind']=='stop'
print('REPRO: old Confirm and continue did not save partial session; switched to another generic question flow',flush=True);shot('v5-01-old-confirm-not-saved')
adb('install','-r','fityar.apk');launch();assert 'versionCode=5' in adb('shell','dumpsys','package',APP)
s=snapshot();assert s['active']['id']==old['active']['id'];assert s['coach']['profile']==old['coach']['profile']
click('Ran out of time; no physical difficulty');assert seek('Save session')
adb('shell','am','force-stop',APP);launch();assert seek('Save session');assert snapshot()['coach']['flow']['cursor']==5

def sql_fixture(sql):
    # Test-only fault injection on an emulator DB; no hook or test switch in the app.
    adb('shell','am','force-stop',APP)
    with tempfile.TemporaryDirectory() as folder:
        local=folder+'/fityar.db';adb('pull',DB,local)
        if adb('shell','sh','-c',f'"test -f {DB}-wal && echo yes || true"').strip()=='yes':adb('pull',DB+'-wal',local+'-wal')
        con=sqlite3.connect(local);con.execute(sql);con.commit();con.execute('PRAGMA wal_checkpoint(TRUNCATE)');con.close()
        adb('push',local,'/data/local/tmp/fityar-fixture.db');adb('shell','cp','/data/local/tmp/fityar-fixture.db',DB);adb('shell','rm','-f',DB+'-wal',DB+'-shm')
sql_fixture("CREATE TRIGGER fail_write BEFORE INSERT ON state BEGIN SELECT RAISE(ABORT, 'synthetic storage failure'); END")
launch();click('Save session');assert seek('Saving failed');assert len(snapshot()['sessions'])==0 and snapshot()['active'];shot('v5-02-save-error-retained')
sql_fixture('DROP TRIGGER fail_write');launch();assert seek('Save session')
root=tree();node=next(n for n in root.iter('node') if n.attrib.get('text')=='Save session');x,y=center(node)
adb('shell','input','tap',x,y);adb('shell','input','tap',x,y);time.sleep(2)
adb('shell','am','force-stop',APP);launch();assert seek('Workout saved')
s=snapshot();assert len(s['sessions'])==1 and s['active'] is None and s['sessions'][0]['id']==old['active']['id'] and s['sessions'][0]['status']=='partial';shot('v5-03-durable-receipt')
click('View saved history');assert seek('Saved workout history');shot('v5-04-history');click('Back');click('Back to today')
print('Upgrade, failure retention, retry, double tap and restart passed',flush=True)

# Near-end clock fixture: real shipped steps, natural timer completion, no synthetic completed record.
base=old['active'];total=sum(x['seconds'] for x in base['steps'])
def near_end(s):
    s['active']=dict(base,id='synthetic-natural',elapsed=total-2,started=device_now(),paused=False,skipped=[])
    s['coach'].pop('flow',None);s['coach'].pop('lastSaved',None)
snapshot(near_end);launch();click('Record result')
for label in ['Moderate — 5 out of 10','Yes','No','None']:click(label)
click('Save session');adb('shell','am','force-stop',APP);launch();assert seek('Workout saved')
s=snapshot();assert len(s['sessions'])==2 and s['sessions'][0]['status']=='complete' and s['active'] is None;shot('v5-05-natural-finish')

# Actual skip and end UI, Persian questions; restart while feedback is pending.
def skipped(s):
    s['lang']='fa';s['active']=dict(base,id='synthetic-skipped',elapsed=15,started=device_now(),paused=True,skipped=[])
    s['coach'].pop('flow',None);s['coach'].pop('lastSaved',None)
snapshot(skipped);launch();click('رد کردن این مرحله');click('پایان زودتر و ثبت نتیجه');click('راحت — ۳ از ۱۰')
adb('shell','am','force-stop',APP);launch()
for label in ['بله','نه','هیچ‌کدام','وقت کم آوردم؛ مشکل بدنی نداشتم']:click(label)
click('ثبت جلسه');adb('shell','am','force-stop',APP);launch();assert seek('جلسه ذخیره شد');shot('v5-06-persian-saved')
s=snapshot();assert len(s['sessions'])==3 and s['sessions'][0]['status']=='partial' and s['active'] is None
assert 'WorkoutAudioService' not in adb('shell','dumpsys','activity','services',APP)
print('Natural completion, Persian skipped finish and audio shutdown passed',flush=True)

def ready(s):
    s['lang']='en';s['coach'].pop('lastSaved',None)
    # Keep valid history, move its synthetic timestamps back to allow recovered exercise.
    for row in s['sessions']:row.update(at=device_now()-4*86400000,date=date_of(device_now()-4*86400000),recovery=2)
    s['coach']['ready']={'date':date_of(device_now()),'answers':{'symptoms':'no','pain':'no','sleep':'ok','energy':'good','minutes':'30','place':'inside','support':'none'}}
snapshot(ready);launch();click('Set independent core ability');answers(['Dead bug, 6 total controlled reps','On knees','Bent knees'])
assert seek('Focus: chest and core');shot('v5-07-focus')
assert seek('Knee side plank; both sides');assert seek('Obliques; side core');shot('v5-08-targets')
click('How to: Knee side plank; both sides');assert seek('Educational illustration');shot('v5-09-side-guide')
click('Replace: Knee side plank; both sides');click('Too difficult');assert seek('Use: Heel slide');click('Use: Heel slide')
click('Start plan');pause_timer();s=snapshot();assert not any(x.get('exercise')=='side-plank-knee' for x in s['active']['steps']);assert any(x.get('exercise')=='plank-knee' for x in s['active']['steps'])
# Leave a pending session intact; no made-up completion for this UI inspection.
click('Finish early and record');assert snapshot()['active']['endedAt'];shot('v5-10-pending')
adb('shell','am','force-stop',APP);launch();assert snapshot()['active']['endedAt']
def lost_fixture(s):
    s['active']=None;s['coach'].pop('flow',None);s['coach'].pop('ready',None);s['coach'].pop('lastSaved',None)
snapshot(lost_fixture);launch();click('Log a missing workout');enter('Actual activity minutes','2');click('3/10');click('Pain: No');click('Full sentence: Yes');click('Save actual activity')
assert seek('Workout saved');assert snapshot()['sessions'][0]['manual'] is True;shot('v5-11-manual-receipt')
logs=adb('logcat','-d','-s','AndroidRuntime:E','ReactNativeJS:E');Path('screenshots/runtime.txt').write_text(logs)
assert 'FATAL EXCEPTION' not in logs and 'TypeError' not in logs,logs
print('V5 targeted acceptance passed / پذیرش هدفمند نسخه پنجم موفق',flush=True)
