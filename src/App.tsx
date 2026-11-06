import ReminderSettings from './ReminderSettings';
import FoodGuide from "./FoodGuide";
import Coach from "./GuidedCoach";
import Illustration from "./Illustration";
import {SafeAreaProvider,useSafeAreaInsets} from 'react-native-safe-area-context';
import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  Alert,
  AppState,
  Linking,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import Svg, { Polyline } from "react-native-svg";
import * as DocumentPicker from "expo-document-picker";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import {
  allowed,
  actualSeconds,
  bi,
  Check,
  dayKey,
  decide,
  elapsed,
  exercises,
  foodAdvice,
  foods,
  Mode,
  movementLevel,
  names,
  normalize,
  numericText,
  plan,
  Session,
} from "./core";
import { initial, load, save, State, validate } from "./storage";
import { syncNotifications,listenResponses,clearResponse } from "./reminders";
import {reminderAction} from './reminderPlan';
import {syncWidget,syncAudio} from './widget';

export default function App(){return <SafeAreaProvider><Main/></SafeAreaProvider>;}
function Main() {
  const insets=useSafeAreaInsets();
  const [s, setS] = useState<State>(() => load());
  const scrollRef=useRef<React.ComponentRef<typeof ScrollView>>(null);
  const resetScroll=useCallback(()=>scrollRef.current?.scrollTo({y:0,animated:false}),[]);
  const latestState=useRef(s);
  useEffect(()=>{latestState.current=s;},[s]);
  const [page, setPage] = useState("today"),
    [tick, setTick] = useState(() => Date.now()),
    [notice, setNotice] = useState("");
  const hasActive=s.active!==null;
  useEffect(()=>{scrollRef.current?.scrollTo({y:0,animated:false});},[page,hasActive,s.coach?.flow?.cursor,s.coach?.flow?.kind]);
  const [check, C] = useState<Check>({
    minutes: 20,
    sleep: 7,
    energy: 3,
    pain: false,
    symptoms: false,
    outside: false,
    mode: "strength",
  });
  const [effort, E] = useState(5),
    [talk, T] = useState(true),
    [pain, P] = useState(false),
    [actual, A] = useState("");
  const [query, Q] = useState(""),
    [portion, SP] = useState(1),
    [hungry, H] = useState(true),
    [near, N] = useState(false),
    [foodTab, FT] = useState("all"),
    [unknownNote, UN] = useState("");
  const [weight, W] = useState(""),
    [waist, WA] = useState(""),
    [exercise, SE] = useState("squat");
  const [movementEffort, ME] = useState(5), [movementPain, MP] = useState(false);
  const fa = s.lang === "fa",
    t = (f: string, e: string) => (fa ? f : e);
  const colors = s.dark
    ? {
        bg: "#101b22",
        card: "#1b2b33",
        ink: "#edf5f3",
        muted: "#9fb4b9",
        accent: "#b9ec85",
        border: "#31454c",
      }
    : {
        bg: "#f3f6f1",
        card: "#ffffff",
        ink: "#16372e",
        muted: "#59736b",
        accent: "#b9df7b",
        border: "#d8e2d5",
      };
  const update = (patch: Partial<State>) => setS((v) => ({ ...v, ...patch }));
  useEffect(() => {
    try {
      save(s);
    } catch {
      queueMicrotask(() => setNotice(
        s.lang === "fa" ? "ذخیره انجام نشد؛ بکاپ بگیر." : "Saving failed; export a backup.",
      ));
    }
  }, [s]);
  useEffect(() => {
    syncWidget(s);
    syncAudio(s);
    syncNotifications(s).catch(() =>
      setNotice(
        s.lang === "fa" ? "اعلان تنظیم نشد؛ مجوز و باتری را بررسی کن." : "Notifications could not be set; check permission and battery settings.",
      ),
    );
  }, [s]);
  useEffect(()=>{
    const open=()=>setPage('today');
    const link=Linking.addEventListener('url',e=>{if(e.url.startsWith('fityar://today'))open();});
    Linking.getInitialURL().then(url=>{if(url?.startsWith('fityar://today'))open();});
    const stop=listenResponses(response=>{
      const request=response.notification.request;
      const action=response.actionIdentifier==='snooze'?'snooze':response.actionIdentifier==='skip'?'skip':'start';
      const date=String(request.content.data?.date??dayKey());
      const id=`${request.identifier}-${response.notification.date}-${action}`;
      setS(old=>reminderAction(old,action,id,date));
      open();clearResponse().catch(()=>{});
    });
    return()=>{link.remove();stop();};
  },[]);
  useEffect(() => {
    const id = setInterval(() => setTick(Date.now()), 1000);
    const sub = AppState.addEventListener("change", (state) => {setTick(Date.now());if(state==='active'){syncWidget(latestState.current);syncAudio(latestState.current);syncNotifications(latestState.current).catch(()=>{});}});
    return () => {
      clearInterval(id);
      sub.remove();
    };
  }, []);
  const d = decide(check, s.sessions, tick),
    active = s.active,
    seconds = active ? elapsed(active, tick) : 0,
    total = active?.steps.reduce((a, b) => a + b.seconds, 0) ?? 0;
  let cumulative = 0;
  const stepIndex =
    active?.steps.findIndex((x) => {
      cumulative += x.seconds;
      return seconds < cumulative;
    }) ?? -1;
  useEffect(()=>{resetScroll();},[stepIndex,resetScroll]);
  const step = active?.steps[stepIndex],
    remaining = Math.max(0, cumulative - seconds);
  const txt = (value: string, size = 15, muted = false) => (
    <Text
      style={{
        color: muted ? colors.muted : colors.ink,
        fontSize: size,
        lineHeight: size * 1.55,
        textAlign: fa ? "right" : "left",
        writingDirection: fa ? "rtl" : "ltr",
      }}
    >
      {value}
    </Text>
  );
  const button = (label: string, fn: () => void, secondary = false) => (
    <Pressable
      accessibilityRole="button"
      onPress={fn}
      style={[
        styles.button,
        {
          backgroundColor: secondary ? colors.card : colors.accent,
          borderColor: colors.border,
          borderWidth: secondary ? 1 : 0,
        },
      ]}
    >
      <Text
        style={{
          color: secondary ? colors.ink : "#183320",
          fontWeight: "700",
          textAlign: "center",
          fontSize: 14,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
  const card = (title: string, children: React.ReactNode) => (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      {txt(title, 20)}
      {children}
    </View>
  );
  const field = (
    label: string,
    value: string,
    onChange: (v: string) => void,
    numeric = false,
  ) => (
    <View style={{ gap: 6, marginVertical: 6 }}>
      {txt(label, 13, true)}
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={v=>onChange(numeric?numericText(v):v)}
        keyboardType={numeric ? "numeric" : "default"}
        style={[
          styles.input,
          {
            color: colors.ink,
            borderColor: colors.border,
            textAlign: fa ? "right" : "left",
          },
        ]}
      />
    </View>
  );
  const toggle = (
    label: string,
    value: boolean,
    onChange: (v: boolean) => void,
  ) => (
    <View style={[styles.row, { flexDirection: fa ? "row-reverse" : "row" }]}>
      <View style={{ flex: 1 }}>{txt(label, 14)}</View>
      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={onChange}
        trackColor={{ true: "#6b9e50", false: "#63757b" }}
      />
    </View>
  );
  const chips = (
    items: { id: string; label: string }[],
    value: string,
    fn: (v: string) => void,
  ) => (
    <View style={[styles.wrap, { flexDirection: fa ? "row-reverse" : "row" }]}>
      {items.map((x) => (
        <Pressable
          key={x.id}
          onPress={() => fn(x.id)}
          style={[
            styles.chip,
            {
              backgroundColor: value === x.id ? colors.accent : colors.bg,
              borderColor: colors.border,
            },
          ]}
        >
          <Text
            style={{
              color: value === x.id ? "#183320" : colors.ink,
              fontSize: 13,
            }}
          >
            {x.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
  const scale = (
    label: string,
    value: number,
    fn: (v: number) => void,
    max = 5,
  ) => (
    <View>
      {txt(label, 14)}
      {chips(
        Array.from({ length: max }, (_, i) => ({
          id: String(i + 1),
          label: String(i + 1),
        })),
        String(value),
        (v) => fn(Number(v)),
      )}
    </View>
  );
  const date = (v: string) =>
    new Date(v + "T12:00:00").toLocaleDateString(fa ? "fa-IR" : "en-US", {
      month: "short",
      day: "numeric",
    });
  const confirm = (title: string, body: string, fn: () => void) =>
    Alert.alert(title, body, [
      { text: t("لغو", "Cancel"), style: "cancel" },
      { text: t("تأیید", "Confirm"), onPress: fn },
    ]);
  const finish = (status: "complete" | "partial") => {
    if (!active) return;
    const mins = actual ? Number(actual) : actualSeconds(active, tick) / 60;
    if (!Number.isFinite(mins) || mins <= 0 || mins > 300) {
      setNotice(t("مدت معتبر وارد کن.", "Enter a valid duration."));
      return;
    }
    const x: Session = {
      id: String(tick),
      date: dayKey(),
      at: tick,
      mode: active.decision.mode,
      minutes: Math.round(mins * 10) / 10,
      planned: active.decision.minutes,
      effort,
      talk,
      pain,
      status: active.skipped.length || (total > 0 && seconds < total && !actual) ? "partial" : status,
      reason: active.decision.reason,
      before: active.before,
    };
    update({ sessions: [x, ...s.sessions], active: null, movementRatings: x.mode==='run'?{...s.movementRatings,run:[...(s.movementRatings?.run??[]),{at:tick,effort,pain}]}:s.movementRatings });
    A("");
    setNotice(
      t("ثبت شد؛ فردا ریکاوری را ثبت کن.", "Saved; record recovery tomorrow."),
    );
  };
  async function exportData(summary = false) {
    try {
      const file = new File(
        Paths.cache,
        summary ? "fityar-summary.txt" : "fityar-backup.json",
      );
      file.write(
        summary
          ? `${t("خلاصه فیت‌یار", "FitYar summary")}\n${s.sessions.map((x) => `${x.date} | ${names[x.mode][s.lang]} | ${x.minutes} min | ${x.effort}/10`).join("\n")}\n${s.measures.map((x) => `${x.date}: ${x.weight} kg / ${x.waist} cm`).join("\n")}`
          : JSON.stringify(s),
      );
      await Sharing.shareAsync(file.uri, {
        mimeType: summary ? "text/plain" : "application/json",
      });
    } catch {
      setNotice(t("خروجی انجام نشد.", "Export failed."));
    }
  }
  async function restore() {
    try {
      const picked = await DocumentPicker.getDocumentAsync({
        type: "application/json",
        copyToCacheDirectory: true,
      });
      if (picked.canceled) return;
      const file = new File(picked.assets[0].uri);
      if (file.size > 5e6) throw Error();
      const restored = validate(JSON.parse(await file.text()));
      confirm(
        t("بازیابی بکاپ", "Restore backup"),
        t(
          "داده فعلی جایگزین می‌شود. ابتدا بکاپ بگیر.",
          "Current data will be replaced. Export a backup first.",
        ),
        () => setS(restored),
      );
    } catch {
      setNotice(
        t(
          "بکاپ معتبر نیست؛ داده تغییر نکرد.",
          "Invalid backup; data is unchanged.",
        ),
      );
    }
  }
  const illustration = (id:string) => <Illustration id={id} fa={fa} accent={colors.accent} muted={colors.muted} border={colors.border}/>;
  const tabs = [
    ["today", "امروز", "Today"],
    ["train", "حرکت‌ها", "Library"],
    ["food", "غذا", "Food"],
    ["trend", "روند", "Progress"],
    ["settings", "تنظیمات", "Settings"],
  ];
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.bg,
        paddingTop: insets.top,
        paddingBottom:s.onboard?0:insets.bottom,
      }}
    >
      <StatusBar barStyle={s.dark ? "light-content" : "dark-content"} />
      <View
        style={[styles.header, { flexDirection: fa ? "row-reverse" : "row" }]}
      >
        <View>
          {txt(t("فیت‌یار", "FitYar"), 27)}
          {txt(
            t("قدم‌های کوچک، پیشرفت پایدار", "Small steps. Lasting progress."),
            12,
            true,
          )}
        </View>
        {button(
          fa ? "EN" : "فا",
          () => update({ lang: fa ? "en" : "fa" }),
          true,
        )}
      </View>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ padding: 18, paddingBottom: 35, gap: 15 }}
        keyboardShouldPersistTaps="handled"
      >
        {!!notice && (
          <Pressable
            onPress={() => setNotice("")}
            style={[styles.card, { backgroundColor: colors.accent }]}
          >
            <Text
              style={{ color: "#183320", textAlign: fa ? "right" : "left" }}
            >
              {notice} ×
            </Text>
          </Pressable>
        )}
        {!s.onboard || page === "today" ? (
          <Coach s={s} update={update}/>
        ) : (
          <>
            {page === "train" && <Coach s={s} update={update} library onNavigate={resetScroll}/>}
            {page === "legacytoday" && (
              <>
                {card(
                  t("امروز، با توجه به حال تو", "Today, based on how you feel"),
                  <>
                    {txt(date(dayKey()), 14, true)}
                    {txt(
                      t(
                        "یک جلسه راحت، یک قدم جلوتر",
                        "A comfortable session. A step forward.",
                      ),
                      25,
                    )}
                    {button(
                      active
                        ? t("ادامه جلسه", "Resume session")
                        : t("بررسی آمادگی", "Check readiness"),
                      () => setPage("today"),
                    )}
                  </>,
                )}
                {s.sessions
                  .filter(
                    (x) =>
                      x.status !== "missed" &&
                      x.recovery === undefined &&
                      x.date !== dayKey(),
                  )
                  .slice(0, 3)
                  .map((x) => (
                    <View key={x.id}>
                      {card(
                        t("ریکاوری روز بعد", "Next-day recovery"),
                        <>
                          {txt(`${date(x.date)} · ${names[x.mode][s.lang]}`)}
                          {scale(
                            t(
                              "خستگی یا درد عضلانی: ۱ کم، ۱۰ زیاد",
                              "Fatigue or soreness: 1 low, 10 high",
                            ),
                            0,
                            (v) =>
                              update({
                                sessions: s.sessions.map((y) =>
                                  y.id === x.id ? { ...y, recovery: v } : y,
                                ),
                              }),
                            10,
                          )}
                        </>,
                      )}
                    </View>
                  ))}
                {card(
                  t("عادت‌های کوچک", "Small habits"),
                  <>
                    {[
                      [
                        "protein",
                        "یک وعده پروتئینی",
                        "A protein-containing meal",
                      ],
                      ["tea", "انتخاب آگاهانه قند چای", "Mindful tea sugar"],
                      ["snack", "جداکردن سهم تنقلات", "Portioned snack"],
                      [
                        "night",
                        "میان‌وعده برای گرسنگی شب",
                        "Prepared evening snack",
                      ],
                      ["move", "بلندشدن از پشت میز", "A movement break"],
                    ].map(([id, f, e]) => (
                      <View key={id}>
                        {toggle(
                          t(f, e),
                          (s.habits[dayKey()] ?? []).includes(id),
                          (v) =>
                            update({
                              habits: {
                                ...s.habits,
                                [dayKey()]: v
                                  ? [...(s.habits[dayKey()] ?? []), id]
                                  : (s.habits[dayKey()] ?? []).filter(
                                      (x) => x !== id,
                                    ),
                              },
                            }),
                        )}
                      </View>
                    ))}
                  </>,
                )}
                {card(
                  t("ثبت نشده ≠ انجام نشد", "Unrecorded ≠ not done"),
                  <>
                    {txt(
                      t(
                        "نبود ثبت به معنی شکست نیست. نوع فعالیت بیرون اپ را اینجا انتخاب و ثبت کن.",
                        "Missing data is not failure. Choose and log the external activity here.",
                      ),
                      14,
                      true,
                    )}
                    {chips(Object.entries(names).map(([id,v])=>({id,label:v[s.lang]})),check.mode,(v)=>C({...check,mode:v as Mode}))}
                    {button(
                      t("ثبت تمرین بیرون اپ", "Log external exercise"),
                      () => {
                        update({
                          active: {
                            started: tick,
                            elapsed: 0,
                            paused: true,
                            steps: [],
                            skipped: [],
                            decision: {
                              state: "hold",
                              reason: bi(
                                "تمرین بیرون اپ؛ گزارش کاربر",
                                "External exercise; self-reported",
                              ),
                              minutes: 20,
                              mode: check.mode,
                            },
                          },
                        });
                        setPage("legacytrain");
                      },
                      true,
                    )}
                    {button(
                      t("امروز انجام نشد", "Mark today as not done"),
                      () =>
                        update({
                          sessions: [
                            {
                              id: String(tick),
                              date: dayKey(),
                              at: tick,
                              mode: check.mode,
                              minutes: 0,
                              planned: 0,
                              effort: 0,
                              talk: true,
                              pain: false,
                              status: "missed",
                              reason: bi(
                                "ثبت دستی انجام نشدن",
                                "Manually marked not done",
                              ),
                            },
                            ...s.sessions,
                          ],
                        }),
                      true,
                    )}
                  </>,
                )}
              </>
            )}
            {page === "legacytrain" && (
              <>
                {active ? (
                  <>
                    {card(
                      t("جلسه جاری", "Current session"),
                      <>
                        {txt(
                          step?.title[s.lang] ??
                            t(
                              "نتیجه واقعی را ثبت کن",
                              "Log your actual result",
                            ),
                          23,
                        )}
                        {txt(
                          `${Math.floor(remaining / 60)}:${String(Math.floor(remaining % 60)).padStart(2, "0")}`,
                          50,
                        )}
                        {txt(
                          `${Math.floor(seconds / 60)} / ${Math.round(total / 60)} ${t("دقیقه", "minutes")}`,
                          13,
                          true,
                        )}
                        {button(
                          active.paused
                            ? t("ادامه", "Continue")
                            : t("توقف موقت", "Pause"),
                          () =>
                            update({
                              active: {
                                ...active,
                                elapsed: seconds,
                                started: tick,
                                paused: !active.paused,
                              },
                            }),
                        )}
                        {step &&
                          button(
                            t("عبور (ثبت ناتمام)", "Skip (record as partial)"),
                            () =>
                              update({
                                active: {
                                  ...active,
                                  elapsed: cumulative,
                                  started: tick,
                                  skipped: [...active.skipped, stepIndex],
                                  skippedSeconds: (active.skippedSeconds ?? 0) + remaining,
                                },
                              }),
                            true,
                          )}
                        {step?.note && txt(step.note[s.lang],14,true)}
                        {step?.exercise && (
                          <>
                            {illustration(step.exercise)}
                            {txt(
                              exercises.find((x) => x.id === step.exercise)
                                ?.cue[s.lang] ?? "",
                            )}
                          </>
                        )}
                        {txt(
                          t(
                            "بعد از تکرارها، باقی زمان بخش را استراحت کن. با درد یا علائم مهم توقف کن.",
                            "After your repetitions, rest for the remaining interval. Stop for pain or concerning symptoms.",
                          ),
                          13,
                          true,
                        )}
                      </>,
                    )}
                    {card(
                      t("نتیجه واقعی", "Actual result"),
                      <>
                        {field(
                          t(
                            "دقیقه واقعی (خالی: تایمر)",
                            "Actual minutes (blank: timer)",
                          ),
                          actual,
                          A,
                          true,
                        )}
                        {scale(
                          t("سختی ۱ تا ۱۰", "Effort 1 to 10"),
                          effort,
                          E,
                          10,
                        )}
                        {toggle(
                          t(
                            "می‌توانستم صحبت کنم",
                            "I could hold a conversation",
                          ),
                          talk,
                          T,
                        )}
                        {toggle(
                          t("درد یا علائم داشتم", "I had pain or symptoms"),
                          pain,
                          P,
                        )}
                        {pain &&
                          txt(
                            t(
                              "توقف کن؛ درد سینه یا علائم شدید نیاز به کمک فوری دارد.",
                              "Stop; chest pain or severe symptoms require urgent help.",
                            ),
                          )}
                        {button(t("ثبت کامل", "Save complete"), () =>
                          finish("complete"),
                        )}
                        {button(
                          t("ثبت نیمه‌کامل", "Save partial"),
                          () => finish("partial"),
                          true,
                        )}
                      </>,
                    )}
                  </>
                ) : (
                  card(
                    t("پیش از تمرین", "Before your session"),
                    <>
                      {chips(
                        Object.entries(names).map(([id, v]) => ({
                          id,
                          label: v[s.lang],
                        })),
                        check.mode,
                        (v) => C({ ...check, mode: v as Mode }),
                      )}
                      {field(
                        t(
                          "زمان آزاد (۵ تا ۶۰ دقیقه)",
                          "Available time (5–60 minutes)",
                        ),
                        String(check.minutes),
                        (v) =>
                          C({
                            ...check,
                            minutes: Number(v) || 0,
                          }),
                        true,
                      )}
                      {field(
                        t("ساعت خواب", "Hours of sleep"),
                        String(check.sleep),
                        (v) =>
                          C({
                            ...check,
                            sleep: Math.min(24, Math.max(0, Number(v) || 0)),
                          }),
                        true,
                      )}
                      {scale(
                        t("انرژی: ۱ کم تا ۵ زیاد", "Energy: 1 low to 5 high"),
                        check.energy,
                        (v) => C({ ...check, energy: v }),
                      )}
                      {toggle(t("بیرون خانه", "Outdoors"), check.outside, (v) =>
                        C({ ...check, outside: v }),
                      )}
                      {toggle(
                        t("درد یا آسیب فعلی", "Current pain or injury"),
                        check.pain,
                        (v) => C({ ...check, pain: v }),
                      )}
                      {toggle(
                        t(
                          "درد سینه، غش یا تنگی نفس شدید/غیرعادی",
                          "Chest pain, fainting, severe/unusual breathlessness",
                        ),
                        check.symptoms,
                        (v) => C({ ...check, symptoms: v }),
                      )}
                      {txt(d.reason[s.lang])}
                      {d.minutes > 0 && (
                        <>
                          {txt(
                            `${names[d.mode][s.lang]} · ${d.minutes} ${t("دقیقه", "minutes")}`,
                            22,
                          )}
                          {button(t("شروع", "Start"), () =>
                            update({
                              active: {
                                started: tick,
                                elapsed: 0,
                                paused: false,
                                steps: plan(d,s.movementRatings),
                                before: {...check},
                                decision: d,
                                skipped: [],
                              },
                            }),
                          )}
                        </>
                      )}
                    </>,
                  )
                )}
                {card(
                  t("کتابخانه حرکت", "Movement library"),
                  <>
                    {chips(
                      exercises.map((x) => ({
                        id: x.id,
                        label: x.name[s.lang],
                      })),
                      exercise,
                      SE,
                    )}
                    {illustration(exercise)}
                    {txt(movementLevel(exercise,s.movementRatings).reason[s.lang],14,true)}
                    {scale(t('سختی همین حرکت (ثبت اختیاری)','Effort for this movement (optional)'),movementEffort,ME,10)}
                    {toggle(t('در همین حرکت درد داشتم','Pain during this movement'),movementPain,MP)}
                    {button(t('ثبت توان همین حرکت','Save movement feedback'),()=>{update({movementRatings:{...s.movementRatings,[exercise]:[...(s.movementRatings?.[exercise]??[]),{at:tick,effort:movementEffort,pain:movementPain}]}});setNotice(t('توان این حرکت مستقل ثبت شد.','This movement was recorded independently.'));},true)}
                    {txt(exercises.find((x) => x.id === exercise)!.cue[s.lang])}
                    {txt(
                      t("خطای رایج: ", "Common mistake: ") +
                        exercises.find((x) => x.id === exercise)!.error[s.lang],
                      14,
                      true,
                    )}
                    {txt(
                      t("جایگزین: ", "Alternative: ") +
                        exercises.find((x) => x.id === exercise)!.alt[s.lang],
                      14,
                      true,
                    )}
                    {txt(
                      t(
                        "تصویر شماتیک است؛ نکات متن را ملاک قرار بده.",
                        "Schematic illustration; follow the written cues.",
                      ),
                      12,
                      true,
                    )}
                  </>,
                )}
              </>
            )}
            {page === "food" && <FoodGuide s={s} update={update} onNavigate={resetScroll} advanced={()=>setPage("legacyfood")}/>}
            {page === "legacyfood" && (
              <>
                {card(
                  t("چی بخورم؟", "Food choices"),
                  <>
                    {txt(
                      t(
                        "پیشنهاد عمومی؛ بدون کالری‌سنجی ساختگی.",
                        "General guidance; no invented calorie counts.",
                      ),
                      14,
                      true,
                    )}
                    {field(
                      t("جستجوی غذا یا نام دیگر", "Search food or alias"),
                      query,
                      Q,
                    )}
                    {chips(
                      [
                        { id: "all", label: t("همه", "All") },
                        { id: "favorite", label: t("علاقه‌مندی", "Favorites") },
                        { id: "recent", label: t("اخیر", "Recent") },
                      ],
                      foodTab,
                      FT,
                    )}
                    {chips(
                      [0.5, 1, 2].map((x) => ({
                        id: String(x),
                        label: `${x} ${t("سهم", "portion")}`,
                      })),
                      String(portion),
                      (v) => SP(Number(v)),
                    )}
                    {toggle(
                      t("گرسنه‌ام (خاموش: هوس)", "Hungry (off: craving)"),
                      hungry,
                      H,
                    )}
                    {toggle(t("نزدیک تمرین", "Near a workout"), near, N)}
                    {txt(
                      t(
                        "حساسیت و مواد موجود در تنظیمات. ترکیب خورشت و خوراک بسته‌بندی متغیر است؛ برچسب را بررسی کن.",
                        "Set allergies and available ingredients in Settings. Stew and packaged recipes vary; check labels.",
                      ),
                      13,
                      true,
                    )}
                  </>,
                )}
                {foods
                  .filter(
                    (f) =>
                      allowed(f, s.allergies, s.vegetarian) &&
                      normalize(
                        f.name.fa + " " + f.name.en + " " + f.aliases,
                      ).includes(normalize(query)) &&
                      (foodTab !== "favorite" || s.favorites.includes(f.id)) &&
                      (foodTab !== "recent" ||
                        s.meals.some((m) => m.food === f.id)),
                  )
                  .map((f) => (
                    <View key={f.id}>
                      {card(
                        f.name[s.lang],
                        <>
                          {txt(f.portion[s.lang], 13, true)}
                          {txt(foodAdvice(f, portion, hungry, near)[s.lang])}
                          <View style={styles.row}>
                            {button(t("ثبت امروز", "Log today"), () => {
                              update({
                                meals: [
                                  {
                                    id: String(tick),
                                    date: dayKey(),
                                    food: f.id,
                                    portion,
                                  },
                                  ...s.meals,
                                ],
                              });
                              setNotice(t("ثبت شد.", "Logged."));
                            })}
                            {button(
                              s.favorites.includes(f.id) ? "★" : "☆",
                              () =>
                                update({
                                  favorites: s.favorites.includes(f.id)
                                    ? s.favorites.filter((x) => x !== f.id)
                                    : [...s.favorites, f.id],
                                }),
                              true,
                            )}
                          </View>
                          {hungry &&
                            ["snack", "sweet"].includes(f.group) &&
                            txt(
                              t("از مواد موجود: ", "Available alternatives: ") +
                                (foods
                                  .filter(
                                    (x) =>
                                      s.available.includes(x.id) &&
                                      allowed(x, s.allergies, s.vegetarian) &&
                                      ["protein", "fruit"].includes(x.group),
                                  )
                                  .map((x) => x.name[s.lang])
                                  .join("، ") ||
                                  t(
                                    "ابتدا مواد موجود را انتخاب کن.",
                                    "Select ingredients first.",
                                  )),
                              14,
                              true,
                            )}
                        </>,
                      )}
                    </View>
                  ))}
                {query &&
                  !foods.some((f) =>
                    normalize(
                      f.name.fa + " " + f.name.en + " " + f.aliases,
                    ).includes(normalize(query)),
                  ) &&
                  card(
                    t("اطلاعات کافی نداریم", "Not enough information"),
                    <>
                      {txt(
                        t(
                          "مواد اولیه، گروه خوراک و اندازه سهم روی برچسب چیست؟ بدون اطلاعات، ارزش غذایی حدس نمی‌زنیم.",
                          "What are the ingredients, food category and labeled portion? We will not guess nutrients without information.",
                        ),
                      )}
                      {field(
                        t(
                          "دسته و برچسب (یادداشت موقت)",
                          "Category and label (temporary note)",
                        ),
                        unknownNote,
                        UN,
                      )}
                    </>,
                  )}
                {card(
                  t("ثبت‌های امروز", "Today’s food log"),
                  <>
                    {s.meals
                      .filter((x) => x.date === dayKey())
                      .map((m) => (
                        <View key={m.id} style={styles.row}>
                          <View style={{ flex: 1 }}>
                            {txt(
                              `${foods.find((x) => x.id === m.food)?.name[s.lang] ?? m.food} · ${m.portion}`,
                            )}
                          </View>
                          {button(
                            t("حذف", "Remove"),
                            () =>
                              update({
                                meals: s.meals.filter((x) => x.id !== m.id),
                              }),
                            true,
                          )}
                        </View>
                      ))}
                  </>,
                )}
              </>
            )}
            {page === "trend" && (
              <>
                {card(
                  t("روند، نه قضاوت روزانه", "Trends, not daily judgment"),
                  <>
                    {txt(
                      t(
                        "وزن در شرایط مشابه؛ دور شکم هفته‌ای یک بار. یک عدد باعث کاهش خودکار غذا نمی‌شود.",
                        "Weight under similar conditions; waist weekly. One reading never reduces food automatically.",
                      ),
                      14,
                      true,
                    )}
                    {field(t("وزن (کیلوگرم)", "Weight (kg)"), weight, W, true)}
                    {field(
                      t("دور شکم (سانتی‌متر)", "Waist (cm)"),
                      waist,
                      WA,
                      true,
                    )}
                    {button(t("ثبت اندازه‌ها", "Save measurements"), () => {
                      const w = Number(weight),
                        a = Number(waist);
                      if (!Number.isFinite(w) || !Number.isFinite(a) || w < 25 || w > 350 || a < 35 || a > 250) {
                        setNotice(
                          t(
                            "اندازه معتبر وارد کن.",
                            "Enter valid measurements.",
                          ),
                        );
                        return;
                      }
                      update({
                        measures: [
                          ...s.measures.filter((x) => x.date !== dayKey()),
                          { date: dayKey(), weight: w, waist: a },
                        ],
                      });
                      W("");
                      WA("");
                    })}
                    {s.measures.length > 0 && (
                      <>
                        {txt(
                          t(
                            "میانگین ۷ ثبت اخیر: ",
                            "Last 7 readings average: ",
                          ) +
                            (
                              s.measures
                                .slice(-7)
                                .reduce((a, x) => a + x.weight, 0) /
                              s.measures.slice(-7).length
                            ).toFixed(1) +
                            " kg",
                          23,
                        )}
                        <Svg height="100" width="100%" viewBox="0 0 300 100">
                          <Polyline
                            points={s.measures
                              .slice(-14)
                              .map(
                                (x, i, arr) =>
                                  `${10 + (i * 280) / Math.max(1, arr.length - 1)},${85 - ((x.weight - Math.min(...arr.map((y) => y.weight))) * 65) / Math.max(1, Math.max(...arr.map((y) => y.weight)) - Math.min(...arr.map((y) => y.weight)))}`,
                              )
                              .join(" ")}
                            stroke={colors.accent}
                            strokeWidth="4"
                            fill="none"
                          />
                        </Svg>
                        {txt(
                          t(
                            "نمودار تغییرات وزن با محور فشرده",
                            "Weight changes on a compressed scale",
                          ),
                          12,
                          true,
                        )}
                      </>
                    )}
                  </>,
                )}
                {card(
                  t("بررسی هفتگی", "Weekly review"),
                  <>
                    {txt(
                      `${s.sessions.filter((x) => tick - x.at < 7 * 86400000 && x.status !== "missed").length} ${t("جلسه در ۷ روز", "sessions in 7 days")}`,
                      24,
                    )}
                    {txt(
                      t(
                        "انرژی و ریکاوری مهم‌اند. جبران دوبرابر نداریم. ورزش اثر سیگار را خنثی نمی‌کند.",
                        "Energy and recovery matter. No doubling up. Exercise does not cancel smoking risks.",
                      ),
                      14,
                      true,
                    )}
                  </>,
                )}
                {s.sessions.map((x) => (
                  <View key={x.id}>
                    {card(
                      `${date(x.date)} · ${names[x.mode][s.lang]}`,
                      <>
                        {txt(
                          `${x.minutes} ${t("دقیقه", "min")} · ${x.effort}/10 · ${x.status === "complete" ? t("کامل", "complete") : x.status === "partial" ? t("نیمه‌کامل", "partial") : t("انجام نشد", "not done")}`,
                        )}
                        {txt(x.reason[s.lang], 13, true)}
                        {x.before&&txt(`${t('پیش از جلسه: خواب','Before: sleep')} ${x.before.sleep} h · ${t('انرژی','energy')} ${x.before.energy}/5`,13,true)}
                        {txt(
                          t("ریکاوری: ", "Recovery: ") +
                            (x.recovery ?? t("ثبت نشده", "unrecorded")),
                          13,
                          true,
                        )}
                        {button(
                          t("حذف ثبت اشتباه", "Delete incorrect entry"),
                          () =>
                            confirm(
                              t("حذف ثبت", "Delete entry"),
                              t(
                                "برای اصلاح، پس از حذف دوباره ثبت کن.",
                                "To correct it, delete and log again.",
                              ),
                              () =>
                                update({
                                  sessions: s.sessions.filter(
                                    (y) => y.id !== x.id,
                                  ),
                                }),
                            ),
                          true,
                        )}
                      </>,
                    )}
                  </View>
                ))}
              </>
            )}
            {page === "settings" && <>{button(t("ثبت فعالیت و عادت‌ها", "Activity and habit logs"),()=>setPage("legacytoday"),true)}</>}
            {page === "settings" && (
              <>
                {card(
                  t("ظاهر و غذا", "Appearance and food"),
                  <>
                    {toggle(t("تم تاریک", "Dark theme"), s.dark, (v) =>
                      update({ dark: v }),
                    )}
                    {toggle(
                      t("گیاه‌خواری بدون گوشت", "Vegetarian (no meat)"),
                      s.vegetarian,
                      (v) => update({ vegetarian: v }),
                    )}
                    {txt(t("حساسیت غذایی", "Food allergies"), 17)}
                    {[
                      ["dairy", "لبنیات", "Dairy"],
                      ["egg", "تخم‌مرغ", "Egg"],
                      ["gluten", "گلوتن", "Gluten"],
                    ].map(([id, f, e]) => (
                      <View key={id}>
                        {toggle(t(f, e), s.allergies.includes(id), (v) =>
                          update({
                            allergies: v
                              ? [...s.allergies, id]
                              : s.allergies.filter((x) => x !== id),
                          }),
                        )}
                      </View>
                    ))}
                    {txt(
                      t(
                        "فیلتر جامع نیست؛ برای حساسیت‌های دیگر تمام برچسب‌ها را بررسی کن.",
                        "The filter is not exhaustive; check all labels for other allergies.",
                      ),
                      13,
                      true,
                    )}
                    {txt(
                      t("مواد موجود برای جایگزین", "Available ingredients"),
                      17,
                    )}
                    {foods.map((f) => (
                      <View key={f.id}>
                        {toggle(
                          f.name[s.lang],
                          s.available.includes(f.id),
                          (v) =>
                            update({
                              available: v
                                ? [...s.available, f.id]
                                : s.available.filter((x) => x !== f.id),
                            }),
                        )}
                      </View>
                    ))}
                  </>,
                )}
                <ReminderSettings s={s} update={update}/>
                {card(
                  t("داده‌های تو", "Your data"),
                  <>
                    {txt(
                      t(
                        "داده سلامت محلی است. حذف اپ ممکن است داده را پاک کند. بکاپ خصوصی است؛ امن نگه دار. آپلود خودکار نداریم.",
                        "Health data is local. Uninstalling may erase it. Backups are private; keep them secure. No automatic uploads.",
                      ),
                      14,
                      true,
                    )}
                    {button(t("خروجی بکاپ", "Export backup"), () =>
                      exportData(),
                    )}
                    {button(t("بازیابی بکاپ", "Restore backup"), restore, true)}
                    {button(
                      t("خلاصه برای مربی", "Summary for a coach"),
                      () => exportData(true),
                      true,
                    )}
                    {button(
                      t("حذف همه داده‌ها", "Delete all data"),
                      () =>
                        confirm(
                          t("حذف همه داده‌ها", "Delete all data"),
                          t(
                            "بدون بکاپ برگشت‌پذیر نیست.",
                            "Cannot be undone without a backup.",
                          ),
                          () => setS({ ...initial, lang: s.lang }),
                        ),
                      true,
                    )}
                  </>,
                )}
                {card(
                  t("درباره قواعد", "About the rules"),
                  <>
                    {txt(
                      t(
                        "افزایش پس از چند جلسه راحت و ریکاوری کامل ثبت‌شده؛ حجم و شدت همزمان زیاد نمی‌شوند. وعده چربی‌سوزی موضعی یا درمان نداریم.",
                        "Progression follows comfortable sessions and complete recovery data; volume and intensity never increase together. No promises of spot fat loss or treatment.",
                      ),
                      14,
                    )}
                    {button(
                      "CDC · " + t("شدت فعالیت", "Activity intensity"),
                      () => {
                        Linking.openURL(
                          "https://www.cdc.gov/physical-activity-basics/measuring/index.html",
                        );
                      },
                      true,
                    )}
                    {button(
                      "NHS · " + t("تمرین قدرتی", "Strength exercises"),
                      () => {
                        Linking.openURL(
                          "https://www.nhs.uk/live-well/exercise/strength-exercises/",
                        );
                      },
                      true,
                    )}
                    {button(
                      "NHS · " + t("تغذیه متعادل", "Balanced diet"),
                      () => {
                        Linking.openURL(
                          "https://www.nhs.uk/live-well/eat-well/how-to-eat-a-balanced-diet/eating-a-balanced-diet/",
                        );
                      },
                      true,
                    )}
                    {txt(
                      "FitYar 1.0.0 · " +
                        t("آفلاین و مستقل", "Offline and independent"),
                      12,
                      true,
                    )}
                  </>,
                )}
              </>
            )}
          </>
        )}
      </ScrollView>
      {s.onboard && (
        <View
          style={[
            styles.nav,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            paddingBottom: Math.max(insets.bottom,10),
              flexDirection: fa ? "row-reverse" : "row",
            },
          ]}
        >
          {tabs.map(([id, f, e]) => (
            <Pressable
              key={id}
              onPress={() => setPage(id)}
              style={{ flex: 1, paddingVertical: 16 }}
            >
              <Text
                style={{
                  color: page === id ? colors.accent : colors.muted,
                  textAlign: "center",
                  fontWeight: page === id ? "800" : "400",
                  fontSize: 12,
                }}
              >
                {t(f, e)}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "space-between",
    gap: 20,
  },
  card: { borderRadius: 22, padding: 19, borderWidth: 1, gap: 10 },
  button: {
    paddingVertical: 13,
    paddingHorizontal: 17,
    borderRadius: 13,
    marginVertical: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    minHeight: 48,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    justifyContent: "space-between",
    marginVertical: 4,
  },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginVertical: 8 },
  chip: {
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  nav: { borderTopWidth: 1, paddingBottom: 24, flexDirection: "row" },
});
