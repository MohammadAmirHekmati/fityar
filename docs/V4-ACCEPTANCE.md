# Interrupted sessions / جلسه‌های نیمه‌تمام

## Root cause / علت

The previous planner treated every partial session as low ability, capped it at five minutes, then inherited the previous planned duration. With two minutes of warm-up and one minute of cool-down, this produced exactly one minute marching and one minute step-touch. The 45 passing tests did not cover a nonphysical interruption followed by a normal main session; some asserted the inherited duration ceiling itself. The new regression failed against that implementation before the change.

برنامه‌ساز قبلی هر جلسه نیمه‌تمام را کم‌توانی فرض می‌کرد، سقف پنج‌دقیقه‌ای می‌گذاشت و زمان برنامه قبلی را به ارث می‌برد. پس از گرم‌کردن و سردکردن دقیقاً دو حرکت یک‌دقیقه‌ای می‌ماند. ۴۵ تست قبلی مسیر توقف غیربدنی و بازگشت به برنامه اصلی را پوشش نمی‌دادند؛ بعضی خودِ سقف ارثی را تأیید می‌کردند. تست رگرسیون جدید ابتدا روی همان منطق شکست خورد.

## Reviewed synthetic prescriptions / برنامه‌های ساختگی بازبینی‌شده

Adult, no reported restriction or symptoms, comfortable floor work/free squat, knee or regular push-ups 6–10, comfortable walking 20 minutes. These are examples, not a prescription for every user.

نمونه‌ها برای فرد بالغ بدون علائم یا محدودیت گزارش‌شده، اسکوات آزاد و تمرین زمین راحت، توان ۶–۱۰ شنا زانو یا معمولی و ۲۰ دقیقه راه‌رفتن راحت هستند؛ نسخه عمومی برای همه نیستند.

| Scenario / حالت | Output / خروجی |
|---|---|
| Previous 2 actual / 5 planned minutes, stopped for time; 30 available / توقف به علت وقت | 25 minutes: 5 warm-up, 18 sets/rests, 2 cool-down / ۲۵ دقیقه |
| 20 minutes available / ۲۰ دقیقه وقت | 20 minutes; same six movements, 2 sets, 45-second windows and 20-second rests / شش حرکت و دو ست |
| Unknown legacy stop / علت قدیمی نامعلوم | Clarify reason and actual activity before prescribing / ابتدا سؤال روشن‌کننده |
| Actual fatigue, recovery 5 / خستگی واقعی | Labeled recovery day, optional comfortable movement up to 10 minutes / روز ریکاوری مشخص |
| Both locations, 45 available / خانه و بیرون | 25 strength + 20 walking, manual location transition / قدرتی و پیاده‌روی با توقف جابه‌جایی |
| Outside, 30 available / بیرون | 20-minute walking template based on reported comfort / پیاده‌روی متناسب توان |

The foundation strength template contains free squat 2×8, reported push-up variant 2×4, bridge 2×8, gentle shoulder-blade squeeze 2×8, bird dog 2×6 total, calf raise 2×8. The 25-minute template has 45-second work windows and 45-second rests. B alternates order and heel slides for core. Progress needs meaningful completed, easy, recovered sessions and elapsed weeks; a break returns to foundation volume. No automatic push-up variant upgrade.

قالب پایه: اسکوات ۲×۸، نوع شنای گزارش‌شده ۲×۴، پل باسن ۲×۸، جمع‌کردن آرام کتف ۲×۸، دست‌وپای مخالف ۲×۶ مجموع و ساق ۲×۸. در قالب ۲۵دقیقه‌ای پنجره حرکت و استراحت هرکدام ۴۵ ثانیه است. قالب B ترتیب و حرکت میان‌تنه را تغییر می‌دهد. پیشرفت به جلسه مؤثر کامل، راحت، ریکاوری‌شده و گذشت هفته‌ها وابسته است؛ نوع شنا خودکار سخت‌تر نمی‌شود.

## Evidence and limits / شواهد و محدودیت

- [CDC adult activity](https://www.cdc.gov/physical-activity-basics/guidelines/adults.html): aerobic activity and at least two strength days covering major muscle groups / هوازی و حداقل دو روز قدرتی.
- [AHA resistance training statement](https://pmc.ncbi.nlm.nih.gov/articles/PMC11209834/): gradual resistance training, sets and recovery / تمرین مقاومتی تدریجی، ست و ریکاوری.
- [NHS strength exercises](https://www.nhs.uk/live-well/exercise/strength-exercises/): accessible movement instructions / آموزش حرکت‌های ساده.
- [NHS shoulder exercises](https://www.fhft.nhs.uk/patients-and-visitors/patient-information-library/shoulder-stabilisation): gentle shoulder-blade control / کنترل آرام کتف.

Exact time thresholds and progression gates are conservative app heuristics, not clinically validated prescriptions. Shoulder-blade squeezes train control and are explicitly not a substitute for resisted rows. Timer exposure tracks phase/group/time, not completed reps or physical form. Legacy records without phase data use actual minutes with an explicit conservative approximation, never planned duration. Test-only corrections preserve the original status/time and do not erase pain flags. Existing data format remains additive and compatible.

آستانه‌های دقیق و قواعد پیشرفت، منطق محافظه‌کارانه اپ هستند و اعتبارسنجی بالینی ندارند. جمع‌کردن کتف جای پارویی مقاومتی نیست. تایمر تعداد تکرار یا فرم واقعی را تشخیص نمی‌دهد. داده قدیمی بدون جزئیات با زمان واقعی و تخمین محافظه‌کارانه ارزیابی می‌شود، نه زمان برنامه‌ریزی‌شده. اصلاح ثبت آزمایشی وضعیت و زمان اصلی را نگه می‌دارد و درد را پاک نمی‌کند. ساختار داده فقط فیلد اختیاری گرفته است.

## Validation / بررسی

Local: typecheck, lint, and 54 unit/regression tests. Native acceptance is pending: same-key v1.2.0 upgrade, preserved history, unknown stop clarification, normal 25-minute session, test-only repeat, fatigue/recovery and pain gates, Persian layout and new movement illustration. Existing unrelated audio/widget acceptance remains documented in V3-ACCEPTANCE.md; it is not rerun for this planner-only change.

محلی: بررسی نوع، lint و ۵۴ تست واحد و رگرسیون. پذیرش اندروید هنوز در انتظار اجراست: ارتقای هم‌امضا، حفظ سابقه، اصلاح توقف قدیمی، برنامه اصلی، ثبت آزمایشی، ریکاوری و درد، نمای فارسی و تصویر حرکت. پذیرش صوت و ویجت قبلی در گزارش نسخه سوم باقی می‌ماند و برای این تغییر برنامه‌ساز تکرار نمی‌شود.
