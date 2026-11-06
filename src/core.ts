export type Lang = "fa" | "en";
export type Text = { fa: string; en: string };
export const bi = (fa: string, en: string): Text => ({ fa, en });
export const numericText = (value:string) => value.replace(/[۰-۹]/g,x=>String(x.charCodeAt(0)-1776)).replace(/[٠-٩]/g,x=>String(x.charCodeAt(0)-1632)).replace(/٫/g,'.');
export const quietHour=(hour:number,start:number,end:number)=>start===end?false:start>end?hour>=start||hour<end:hour>=start&&hour<end;
export const dayKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export type Mode = "walk" | "run" | "strength" | "home" | "short";
export type StopReason = 'time'|'test'|'accidental'|'fatigue'|'pain'|'other';
export type MuscleGroup = 'push'|'legs'|'core'|'back'|'cardio';
export interface Workload {warmup:number;work:number;cooldown:number;rest:number;groups:Record<MuscleGroup,number>;source:'timer'}
export interface Program {id:string;week:number;kind:'strength'|'cardio'|'mixed'|'recovery'|'short'}
export interface Session {
  stopReason?:StopReason;
  activity?:'none'|'warmup'|'main'|'unknown';
  load?:Workload;
  program?:Program;
  before?: Check;
  id: string;
  date: string;
  at: number;
  mode: Mode;
  minutes: number;
  planned: number;
  effort: number;
  talk: boolean;
  pain: boolean;
  status: "complete" | "partial" | "missed";
  recovery?: number;
  reason: Text;
}
export interface Check {
  minutes: number;
  sleep: number;
  energy: number;
  pain: boolean;
  symptoms: boolean;
  outside: boolean;
  mode: Mode;
}
export interface Decision {
  state: "stop" | "rest" | "return" | "reduce" | "hold" | "progress";
  reason: Text;
  minutes: number;
  mode: Mode;
}
export function decide(
  c: Check,
  history: Session[],
  now = Date.now(),
): Decision {
  const result = (
    state: Decision["state"],
    reason: Text,
    minutes = 0,
    mode = c.mode,
  ): Decision => ({ state, reason, minutes, mode });
  if (c.symptoms)
    return result(
      "stop",
      bi(
        "تمرین را متوقف کن. درد قفسه سینه، غش یا تنگی نفس شدید نیاز به ارزیابی فوری دارد؛ با اورژانس محلی تماس بگیر.",
        "Stop exercise. Chest pain, fainting or severe breathlessness needs urgent assessment; contact local emergency services.",
      ),
    );
  if(![c.minutes,c.sleep,c.energy].every(Number.isFinite)||typeof c.pain!=='boolean'||typeof c.symptoms!=='boolean'||typeof c.outside!=='boolean')return result('rest',bi('اطلاعات آمادگی کامل نیست؛ ابتدا آن را تکمیل کن.','Readiness data is incomplete; complete it before planning.'));
  if(c.minutes<5||c.minutes>60||c.sleep<0||c.sleep>24||c.energy<1||c.energy>5)return result('rest',bi('زمان ۵ تا ۶۰ دقیقه و مقدار معتبر خواب و انرژی وارد کن.','Enter 5–60 minutes and valid sleep and energy values.'));
  if (c.pain)
    return result(
      "rest",
      bi(
        "با درد تمرین نکن؛ اگر ادامه دارد، ارزیابی حرفه‌ای بگیر.",
        "Do not train through pain; seek professional assessment if it persists.",
      ),
    );
  const done = history
    .filter((s) => s.status !== "missed")
    .sort((a, b) => b.at - a.at);
  const last = done[0];
  const gap = last ? (now - last.at) / 86400000 : Infinity;
  if (last && (last.pain || (last.recovery ?? 0) >= 7))
    return result(
      "rest",
      bi(
        "درد یا ریکاوری ضعیف جلسه قبل؛ ابتدا ریکاوری را بررسی کن.",
        "Previous pain or poor recovery: review recovery first.",
      ),
    );
  if (c.energy <= 2 || c.sleep < 5)
    return result(
      "reduce",
      bi(
        "خواب یا انرژی پایین است؛ فقط حرکت سبک، در صورت احساس راحتی.",
        "Low sleep or energy: gentle movement only if comfortable.",
      ),
      Math.min(10, c.minutes),
      c.outside ? "walk" : "home",
    );
  if (
    (last && gap < 1) ||
    (c.mode === "strength" &&
      done.some((s) => s.mode === "strength" && now - s.at < 48 * 3600000))
  )
    return result(
      "rest",
      bi(
        "فاصله ریکاوری کافی نیست؛ امروز استراحت یا حرکت راحت انتخاب کن.",
        "Allow recovery between sessions; choose rest or comfortable movement today.",
      ),
    );
  const mode =
    !c.outside && (c.mode === "run" || c.mode === "walk") ? "home" : c.mode;
  if (!last || gap > 10)
    return result(
      "return",
      bi(
        "شروع یا بازگشت: جلسه سبک برای شناخت توان فعلی، بدون آزمون بیشینه.",
        "Start or return: a gentle calibration, without a maximum effort test.",
      ),
      Math.min(15, c.minutes),
      mode === "run" ? "walk" : mode,
    );
  const recent = done.filter((s) => s.mode === mode).slice(0, 3);
  const base = recent[0]?.planned ?? 15;
  if (recent.some((s) => s.effort >= 8 || !s.talk || s.status === "partial"))
    return result(
      "reduce",
      bi(
        "سختی بالا یا ناتمام ماندن؛ حجم کمتر و شدت راحت.",
        "High effort or an unfinished session: reduce volume and keep an easy intensity.",
      ),
      Math.min(c.minutes, Math.max(8, Math.floor(base * 0.8))),
      mode,
    );
  if (
    recent.length === 3 &&
    recent.every(
      (s) =>
        s.status === "complete" &&
        s.effort <= 5 &&
        s.talk &&
        !s.pain &&
        s.recovery !== undefined &&
        s.recovery <= 3,
    )
  )
    return result(
      "progress",
      bi(
        "سه جلسه راحت با ریکاوری ثبت‌شده؛ فقط زمان اندکی افزایش می‌یابد، شدت ثابت است.",
        "Three comfortable sessions with recorded recovery: a small duration increase only; intensity stays unchanged.",
      ),
      Math.min(c.minutes, base + 1, 35),
      mode,
    );
  return result(
    "hold",
    bi(
      "فعلاً حفظ سطح؛ برای افزایش، چند جلسه راحت و داده کامل ریکاوری لازم است.",
      "Hold this level; progression needs several comfortable sessions and complete recovery data.",
    ),
    Math.min(c.minutes, base),
    mode,
  );
}
export interface Step {
  location?: 'inside'|'outside';
  transition?: boolean;
  phase?: 'warmup'|'work'|'cooldown';
  reps?: number;
  title: Text;
  seconds: number;
  exercise?: string;
  note?: Text;
}
export const names: Record<Mode, Text> = {
  walk: bi("پیاده‌روی راحت", "Easy walk"),
  run: bi("دویدن و راه‌رفتن", "Run–walk"),
  strength: bi("قدرتی کل بدن", "Full-body strength"),
  home: bi("هوازی کم‌ضربه", "Low-impact cardio"),
  short: bi("جلسه کوتاه", "Short session"),
};
export type Ratings = Record<string, {at:number;effort:number;pain:boolean}[]>;
export function movementLevel(id:string,ratings:Ratings = {}): {level:'calibrate'|'easy'|'hold'|'reduce'|'stop';reason:Text} {
 const recent=(ratings[id]??[]).slice(-3);
 if(!recent.length)return {level:'calibrate',reason:bi('توان این حرکت هنوز ثبت نشده؛ با نسخه آسان و چند تکرار ذخیره شروع کن.','This movement is uncalibrated; start with the easy version and several repetitions in reserve.')};
 if(recent.at(-1)!.pain)return {level:'stop',reason:bi('در آخرین ثبت درد داشتی؛ این حرکت را کنار بگذار و در صورت تداوم درد ارزیابی بگیر.','Pain was recorded last time; omit this movement and seek assessment if pain persists.')};
 if(recent.some(x=>x.effort>=8))return {level:'reduce',reason:bi('این حرکت دشوار بوده؛ از جایگزین آسان‌تر و دامنه کمتر استفاده کن.','This movement was difficult; use the easier alternative and a smaller range.')};
 if(recent.length===3&&recent.every(x=>x.effort<=5&&!x.pain))return {level:'easy',reason:bi('سه ثبت راحت؛ سطح فعلی مناسب است. افزایش کلی فقط با ریکاوری کامل بررسی می‌شود.','Three comfortable records; the current level fits. Overall progression still requires complete recovery.')};
 return {level:'hold',reason:bi('سطح این حرکت را نگه دار؛ توان حرکات دیگر معیار آن نیست.','Hold this movement level; ability in other movements is not used to infer it.')};
}
export function plan(d: Decision, ratings:Ratings = {}): Step[] {
  if (d.minutes <= 0) return [];
  const warm = Math.min(300, Math.floor((d.minutes * 60) / 4));
  const middle = d.minutes * 60 - warm * 2;
  const steps: Step[] = [
    {
      title: bi(
        "گرم‌کردن: راه‌رفتن آرام و حرکت نرم مفاصل",
        "Warm up: easy walking and gentle joint movements",
      ),
      seconds: warm,
    },
  ];
  if (d.mode === "run") {
    let remaining = middle;
    let run = true;
    while (remaining > 0) {
      const seconds = Math.min(120, remaining);
      steps.push({
        title: run
          ? bi(
              "دویدن آسان؛ بتوانی صحبت کنی",
              "Easy jog; keep conversation possible",
            )
          : bi("راه‌رفتن و بازیابی نفس", "Walk and recover your breath"),
        seconds,
      });
      remaining -= seconds;
      run = !run;
    }
  } else if (d.mode === "strength") {
    const ids = ["squat", "push", "lunge", "bridge", "w", "deadbug", "side"];
    ids.forEach((id) => {
      const level=movementLevel(id,ratings);
      steps.push({
        title: level.level==='stop'?bi('استراحت؛ حرکت دردناک حذف شد','Rest; painful movement omitted'):exercises.find((e) => e.id === id)!.name,
        seconds: Math.floor(middle / ids.length),
        exercise: level.level==='stop'?undefined:id,
        note:level.reason,
      });
    });
  } else
    steps.push({
      title:
        d.mode === "home" || d.mode === "short"
          ? bi(
              "قدم‌زدن درجا؛ بدون پرش، سرعت راحت",
              "March in place; no jumping, comfortable pace",
            )
          : names.walk,
      seconds: middle,
    });
  steps.push({
    title: bi(
      "سردکردن: آرام‌تر حرکت کن و عادی نفس بکش",
      "Cool down: slow movement and natural breathing",
    ),
    seconds: warm,
  });
  return steps;
}
export interface Active {
  stepSeconds?:Record<number,number>;
  program?:Program;
  id?:string;
  transitions?: number[];
  before?: Check;
  started: number;
  elapsed: number;
  paused: boolean;
  steps: Step[];
  decision: Decision;
  skipped: number[];
  skippedSeconds?: number;
}
export function actualSeconds(a: Active, now = Date.now()) {
  const duration = a.steps.reduce((sum, step) => sum + step.seconds, 0);
  return Math.max(0, Math.min(duration, elapsed(a, now)) - (a.skippedSeconds ?? 0));
}
export function elapsed(a: Active, now = Date.now()) {
  const raw=Math.max(0, a.elapsed + (a.paused ? 0 : (now - a.started) / 1000));
  let start=0;
  for(let i=0;i<(a.steps?.length??0);i++){
    if(a.steps[i].transition&&!a.transitions?.includes(i))return Math.min(raw,start);
    start+=a.steps[i].seconds;
  }
  return raw;
}
export const exercises = [
  {
    id: "squat",
    name: bi("اسکوات کم‌عمق", "Shallow squat"),
    cue: bi(
      "پاها به عرض لگن؛ لگن عقب و پایین، زانو هم‌جهت پنجه. با بازدم بلند شو. ۶–۸ تکرار آرام، سپس استراحت.",
      "Feet hip-width; hips back and down, knees follow toes. Exhale as you stand. 6–8 slow repetitions, then rest.",
    ),
    error: bi(
      "پاشنه را بلند نکن؛ عمق را به زور بیشتر نکن.",
      "Keep heels down; do not force depth.",
    ),
    alt: bi(
      "دامنه کمتر یا نشستن و برخاستن از صندلی محکم",
      "Smaller range or sit-to-stand from a stable chair",
    ),
  },
  {
    id: "push",
    name: bi("شنا روی دیوار", "Wall push-up"),
    cue: bi(
      "دست‌ها روی دیوار هم‌سطح سینه؛ بدن یک خط. آرنج‌ها را خم کن و با بازدم دور شو. ۵–۸ تکرار با چند تکرار ذخیره.",
      "Hands on wall at chest height; body in one line. Bend elbows, exhale as you push away. 5–8 reps, leaving several in reserve.",
    ),
    error: bi(
      "کمر را گود نکن و شانه‌ها را بالا نبر.",
      "Avoid arching your back or shrugging.",
    ),
    alt: bi("نزدیک‌تر به دیوار بایست", "Stand closer to the wall"),
  },
  {
    id: "lunge",
    name: bi("لانج عقب کوتاه", "Short reverse lunge"),
    cue: bi(
      "یک قدم کوتاه عقب؛ هر دو زانو کمی خم، تنه صاف. با بازدم برگرد. هر پا ۴–۶ تکرار؛ برای تعادل کنار دیوار.",
      "Step back; bend both knees slightly, torso upright. Exhale to return. 4–6 each side; stay near a wall for balance.",
    ),
    error: bi(
      "زانو را به داخل نریز؛ دامنه بدون درد.",
      "Avoid knees collapsing inward; use a pain-free range.",
    ),
    alt: bi("اسکوات کم‌عمق", "Shallow squat"),
  },
  {
    id: "bridge",
    name: bi("پل باسن", "Glute bridge"),
    cue: bi(
      "طاق‌باز، زانو خم و کف پا روی زمین. با بازدم لگن را تا امتداد تنه بالا ببر. ۶–۸ تکرار.",
      "Lie on your back, knees bent, feet flat. Exhale and lift hips into line with torso. 6–8 reps.",
    ),
    error: bi(
      "کمر را بیش از حد قوس نده؛ گردن آرام.",
      "Do not overarch the back; relax the neck.",
    ),
    alt: bi("بالا بردن کمتر لگن", "A smaller hip lift"),
  },
  {
    id: "w",
    name: bi("W خوابیده", "Prone W"),
    cue: bi(
      "روی شکم؛ آرنج‌ها شکل W. کتف‌ها آرام عقب، دست‌ها کمی بالا؛ گردن خنثی. ۶ تکرار با تنفس عادی.",
      "Lie face down, elbows in a W. Gently draw shoulder blades back, lift hands slightly, neck neutral. 6 reps, breathe normally.",
    ),
    error: bi(
      "سر را بالا نبر و کمر را قوس نده.",
      "Do not lift your chin or arch the lower back.",
    ),
    alt: bi(
      "جمع‌کردن ملایم کتف‌ها در حالت ایستاده",
      "Gentle standing shoulder-blade squeeze",
    ),
  },
  {
    id: "deadbug",
    name: bi("ددباگ ساده", "Easy dead bug"),
    cue: bi(
      "طاق‌باز، شکم آرام سفت؛ یک پاشنه را آرام دور کن و برگردان. هر سمت ۵ تکرار؛ هنگام دورکردن بازدم.",
      "Lie on your back, gently brace. Slowly slide one heel away and return. 5 each side; exhale as it moves away.",
    ),
    error: bi(
      "کمر را از زمین جدا نکن؛ نفس را نگه ندار.",
      "Avoid lifting the lower back; do not hold your breath.",
    ),
    alt: bi("لغزش کوتاه‌تر پاشنه", "Shorter heel slide"),
  },
  {
    id: "side",
    name: bi("پلانک بغل روی زانو", "Knee side plank"),
    cue: bi(
      "پهلو، آرنج زیر شانه، زانوها خم؛ لگن کمی بالا. هر سمت ۱۰–۱۵ ثانیه، تنفس عادی؛ سپس استراحت.",
      "On your side, elbow under shoulder, knees bent; lift hips slightly. 10–15 seconds each side, breathe normally, then rest.",
    ),
    error: bi(
      "روی شانه فرو نریز؛ با درد توقف کن.",
      "Do not sink into the shoulder; stop for pain.",
    ),
    alt: bi(
      "به پهلو بمان و شکم را آرام سفت کن",
      "Stay side-lying and gently brace",
    ),
  },
];
export type Food = {
  id: string;
  name: Text;
  aliases: string;
  group: "meal" | "protein" | "fruit" | "snack" | "sweet";
  portion: Text;
  allergens: string[];
  vegetarian: boolean;
};
export const foods: Food[] = [
  [
    "rice",
    "برنج",
    "Rice",
    "پلو چلو rice polo",
    "meal",
    "نصف پیمانه پخته",
    "½ cup cooked",
    [],
    true,
  ],
  [
    "stew",
    "خورشت",
    "Stew",
    "قورمه قیمه خورش stew ghormeh gheimeh",
    "meal",
    "یک ملاقه؛ مواد اولیه را بررسی کن",
    "1 ladle; check ingredients",
    ["unknown"],
    false,
  ],
  [
    "bread",
    "نان",
    "Bread",
    "سنگک لواش بربری bread toast",
    "meal",
    "یک کف دست؛ ضخامت مهم است",
    "1 palm-sized piece; thickness varies",
    ["gluten"],
    true,
  ],
  [
    "egg",
    "تخم‌مرغ",
    "Egg",
    "تخم مرغ egg omelet",
    "protein",
    "یک عدد",
    "1 egg",
    ["egg"],
    true,
  ],
  [
    "chicken",
    "مرغ",
    "Chicken",
    "جوجه chicken poultry",
    "protein",
    "یک کف دست پخته",
    "1 palm-sized cooked piece",
    [],
    false,
  ],
  [
    "yogurt",
    "ماست",
    "Yogurt",
    "ماست yogurt yoghurt",
    "protein",
    "یک کاسه کوچک ساده",
    "1 small bowl, plain",
    ["dairy"],
    true,
  ],
  [
    "fruit",
    "میوه",
    "Fruit",
    "سیب موز پرتقال apple banana orange fruit",
    "fruit",
    "یک عدد متوسط",
    "1 medium fruit",
    [],
    true,
  ],
  [
    "chips",
    "چیپس",
    "Chips",
    "crisps chips چیپس",
    "snack",
    "یک کاسه کوچک، نه بسته کامل",
    "1 small bowl, not a whole bag",
    ["unknown"],
    true,
  ],
  [
    "puffs",
    "پفک",
    "Cheese puffs",
    "پفک اسنک puffs snack",
    "snack",
    "یک کاسه کوچک",
    "1 small bowl",
    ["dairy", "unknown"],
    true,
  ],
  [
    "sausage",
    "سوسیس",
    "Sausage",
    "کالباس sausage hotdog",
    "snack",
    "یک عدد کوچک؛ برچسب را بررسی کن",
    "1 small piece; check label",
    ["unknown"],
    false,
  ],
  [
    "sugar",
    "قند",
    "Sugar cube",
    "قند شکر sugar cube",
    "sweet",
    "یک حبه کوچک",
    "1 small cube",
    [],
    true,
  ],
  [
    "candy",
    "نبات",
    "Rock candy",
    "نبات rock candy",
    "sweet",
    "یک تکه کوچک",
    "1 small piece",
    [],
    true,
  ],
  [
    "beans",
    "عدس و لوبیا",
    "Lentils and beans",
    "عدسی حبوبات beans lentils",
    "protein",
    "نصف پیمانه پخته",
    "½ cup cooked",
    [],
    true,
  ],
].map(([id, fa, en, aliases, group, pfa, pen, allergens, vegetarian]) => ({
  id,
  name: bi(fa as string, en as string),
  aliases,
  group,
  portion: bi(pfa as string, pen as string),
  allergens,
  vegetarian,
})) as Food[];
export const normalize = (s: string) =>
  s
    .toLowerCase()
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/‌/g, " ")
    .trim();
export function allowed(f: Food, allergies: string[], vegetarian: boolean) {
  return (
    (!vegetarian || f.vegetarian) &&
    (!allergies.length || !f.allergens.includes("unknown")) &&
    !allergies.some((a) => f.allergens.includes(a))
  );
}
export function foodAdvice(
  f: Food,
  portion: number,
  hungry: boolean,
  nearWorkout: boolean,
): Text {
  if (portion > 1 && ["snack", "sweet"].includes(f.group))
    return bi(
      "سهم کمتر را امتحان کن: یک سهم جدا کن و دوباره گرسنگی را بررسی کن.",
      "Try a smaller serving: plate one portion and reassess your hunger.",
    );
  if (hungry && ["snack", "sweet"].includes(f.group))
    return bi(
      "برای گرسنگی، یک گزینه پروتئینی همراه میوه یا نان ممکن است سیرکننده‌تر باشد؛ از مواد موجود انتخاب کن.",
      "For hunger, protein with fruit or bread may be more filling; choose from what you have.",
    );
  if (nearWorkout)
    return bi(
      "نزدیک تمرین سهم کوچک‌تر و غذای آشنا انتخاب کن؛ راحتی گوارش فردی است.",
      "Near a workout, choose a smaller familiar serving; digestive comfort varies.",
    );
  return bi(
    "این مقدار می‌تواند بخشی از یک الگوی متنوع باشد؛ آرام بخور و سیری را دوباره بررسی کن.",
    "This amount can fit a varied eating pattern; eat slowly and check fullness again.",
  );
}
