"""Extended acceptance uses synthetic history only, after the genuine upgrade/UI checks.
It refuses physical devices. No test entry points are added to the shipped app.
"""
import copy,json,sqlite3,tempfile,datetime
assert adb('shell','getprop','ro.kernel.qemu').strip()=='1','Synthetic fixtures are emulator-only'
adb('root');adb('wait-for-device')
DB=f'/data/user/0/{APP}/files/SQLite/fityar.db'
PREF=f'/data/user/0/{APP}/shared_prefs/expo.modules.notifications.SharedPreferencesNotificationsStore.xml'
def device_now():return int(adb('shell','date','+%s').strip())*1000
def date_of(ms):return datetime.datetime.fromtimestamp(ms/1000,datetime.timezone.utc).strftime('%Y-%m-%d')
def snapshot(change=None):
    if change:adb('shell','am','force-stop',APP)
    with tempfile.TemporaryDirectory() as folder:
        local=folder+'/fityar.db'
        adb('pull',DB,local)
        for suffix in ['-wal']:
            if adb('shell','sh','-c',f'"test -f {DB+suffix} && echo yes || true"').strip()=='yes':adb('pull',DB+suffix,local+suffix)
        con=sqlite3.connect(local);state=json.loads(con.execute('SELECT data FROM state WHERE id=1').fetchone()[0])
        if change:
            change(state)
            con.execute('UPDATE state SET data=? WHERE id=1',(json.dumps(state,ensure_ascii=False),));con.commit();con.execute('PRAGMA wal_checkpoint(TRUNCATE)')
        con.close()
        if change:
            owner=adb('shell','stat','-c','%u',DB).strip()
            adb('push',local,'/data/local/tmp/fityar-fixture.db')
            adb('shell','cp','/data/local/tmp/fityar-fixture.db',DB)
            adb('shell','rm','-f',DB+'-wal',DB+'-shm')
            assert adb('shell','stat','-c','%u',DB).strip()==owner
    return state

def schedules():
    xml=adb('shell','cat',PREF)
    return [n.attrib.get('name','') for n in ET.fromstring(xml)]

def fixture(s):
    now=device_now();s['lang']='en';s['active']=None;s['reminders'].update(enabled=False,days={},quietStart=8,quietEnd=8)
    s['coach'].pop('flow',None);s['coach'].pop('draft',None);s['coach']['profile']['run']='yes'
    s['coach']['ready']={'date':date_of(now),'answers':{'symptoms':'no','pain':'no','sleep':'ok','energy':'good','minutes':'45','place':'both','support':'none'}}
    s['sessions']=[{'id':'synthetic-'+str(i),'date':date_of(now-days*86400000),'at':now-days*86400000,'mode':mode,'minutes':40,'planned':40,'effort':3,'talk':True,'pain':False,'status':'complete','recovery':2,'reason':{'fa':'داده آزمون ساختگی','en':'Synthetic acceptance fixture'}} for i,(days,mode) in enumerate([(3,'walk'),(5,'strength'),(7,'strength'),(9,'walk')])]
    s['coach']['feedback']={}
snapshot(fixture);launch();assert seek('Indoors + outside'),'Eligible mixed session missing';shot('19-mixed-preview')
click('Start plan');pause_timer();active=snapshot()['active']
transition=next(i for i,x in enumerate(active['steps']) if x.get('transition'))
boundary=sum(x['seconds'] for x in active['steps'][:transition])
assert all(x.get('location')=='outside' for x in active['steps'] if x.get('exercise')=='jog')
assert all(x.get('location')=='inside' for x in active['steps'] if x.get('exercise','').startswith('push'))
def at_transition(s):s['active'].update(elapsed=boundary,started=device_now()-1200000,paused=False)
snapshot(at_transition);launch();assert seek('Ready; continue at next location');assert has('300 seconds');time.sleep(6);assert has('300 seconds'),'Location transfer auto-started';shot('20-manual-transition')
click('Ready; continue at next location');pause_timer();assert has('Location: outside');shot('21-outdoor-warmup')
a=snapshot()['active'];assert transition in a['transitions'];assert boundary<=a['elapsed']<boundary+40,'Transfer time counted as exercise'
click('Finish early and record');answers(['Moderate — 5 out of 10','Yes','No','None'])
assert snapshot()['sessions'][0]['status']=='partial'
# A real launcher widget opens the actual warm-up when same-day readiness is valid.
def widget_ready(s):
    s['active']=None;s['sessions']=[];s['coach'].pop('flow',None)
    s['coach']['ready']={'date':date_of(device_now()),'answers':{'symptoms':'no','pain':'no','sleep':'ok','energy':'good','minutes':'30','place':'inside','support':'none'}}
snapshot(widget_ready);launch();adb('shell','input','keyevent','3');time.sleep(2)
for direction in [(900,200),(200,900)]:
    for _ in range(4):
        if has('Start with warm-up'):break
        adb('shell','input','swipe',str(direction[0]),'1000',str(direction[1]),'1000','300');time.sleep(.5)
    if has('Start with warm-up'):break
assert has('Start with warm-up'),'Pinned widget did not refresh to ready state';shot('22-ready-widget')
click('Start with warm-up',False);time.sleep(3);assert has('Warm-up');pause_timer();shot('23-widget-start')
# Native notification actions; only the emulator clock is advanced, never the host clock.
adb('shell','settings','put','global','auto_time','0')
noon=datetime.datetime.fromtimestamp(device_now()/1000,datetime.timezone.utc).replace(hour=12,minute=0,second=0,microsecond=0)
adb('shell','cmd','alarm','set-time',str(int(noon.timestamp()*1000)))
def reminder_fixture(s):
    now=device_now();target=(now//60000+2)*60000;d=datetime.datetime.fromtimestamp(target/1000,datetime.timezone.utc)
    s['active']=None;s['coach'].pop('flow',None);s['coach'].pop('ready',None)
    s['reminders'].update(enabled=True,days={},hour=d.hour,minute=d.minute,quietStart=8,quietEnd=8,prep=False,water=False,move=False)
    s['sessions']=[{'id':'synthetic-recovery','date':date_of(now-86400000),'at':now-86400000,'mode':'strength','minutes':8,'planned':14,'effort':6,'talk':True,'pain':False,'status':'partial','reason':{'fa':'داده آزمون ساختگی','en':'Synthetic acceptance fixture'}}]
    return target
reminder_target=[]
snapshot(lambda s:reminder_target.append(reminder_fixture(s)));launch();assert has('Record recovery')
current_date=date_of(device_now());time.sleep(2)
assert sum(current_date+'-followup' in key for key in schedules())==1
adb('shell','input','keyevent','3');adb('shell','cmd','alarm','set-time',str(reminder_target[0]-5000));time.sleep(10)
def notification_action(label):
    adb('shell','cmd','statusbar','expand-notifications');time.sleep(2)
    if not has(label) and has('Expand'):click('Expand',False)
    shot('notification-action-'+re.sub(r'[^a-zA-Z0-9]','_',label));click(label,False);time.sleep(3)
notification_action('Snooze 15 min')
state=snapshot();ledger=state['reminders']['days'][current_date]
assert ledger['snoozes']==1 and 850000<ledger['snoozeUntil']-device_now()<=900000
assert any(current_date+'-recovery' in key for key in schedules())
assert not any(current_date+'-followup' in key for key in schedules())
adb('shell','input','keyevent','3');adb('shell','cmd','alarm','set-time',str(ledger['snoozeUntil']-5000));time.sleep(10)
notification_action("Can't today")
assert snapshot()['reminders']['days'][current_date]['skip']
assert not any(current_date in key for key in schedules()),'Skip left a scheduled reminder today'
shot('24-reminder-skipped')
# Quiet hours suppress real native scheduling, not just pure planner output.
def quiet_fixture(s):
    reminder_fixture(s);s['reminders'].update(quietStart=0,quietEnd=23)
snapshot(quiet_fixture);launch();time.sleep(3)
assert not any(date_of(device_now()) in key for key in schedules()),'Quiet hours leaked an alarm'
# Start notification and saving a partial session cancel the remaining same-day reminders.
start_target=[]
def start_fixture(s):
    target=reminder_fixture(s);s['sessions']=[]
    s['coach']['ready']={'date':date_of(device_now()),'answers':{'symptoms':'no','pain':'no','sleep':'ok','energy':'good','minutes':'30','place':'inside','support':'none'}}
    start_target.append(target)
snapshot(start_fixture);launch();adb('shell','input','keyevent','3');adb('shell','cmd','alarm','set-time',str(start_target[0]-5000));time.sleep(10)
notification_action('Start');assert has('Warm-up');pause_timer();shot('25-notification-start')
assert any(date_of(device_now())+'-partial' in key for key in schedules())
click('Finish early and record');answers(['Moderate — 5 out of 10','Yes','No','None']);time.sleep(3)
assert not any(date_of(device_now()) in key for key in schedules()),'Saved session left reminders scheduled today'
shot('26-completion-cancels-reminders')
logs=adb('logcat','-d','-s','AndroidRuntime:E','ReactNativeJS:E')
assert 'FATAL EXCEPTION' not in logs and 'TypeError' not in logs,logs
print('Mixed transition, real widget start, native snooze/skip/start, quiet hours and completion cancellation passed / پذیرش گسترده موفق')
