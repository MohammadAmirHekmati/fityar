# Durable workout completion / ثبت پایدار جلسه

The reproducible v4 defect is a misleading completion flow: confirming partial-session feedback does not save a session; it opens a second generic stop questionnaire. The pending workout remains active, and there is no durable receipt. Separately, UI state was updated before an effect wrote SQLite, so a failed write could leave apparently saved data only in memory. We cannot establish the exact private phone state or claim a lost `post` field was observed. The standard v4 happy-path test passed because it knew to complete both questionnaires; it did not test a failed database write or restart after final confirmation.

ایراد قابل بازتولید نسخه قبل: تأیید بازخورد جلسه نیمه‌تمام هنوز ثبت انجام نمی‌داد و سؤال عمومی دیگری باز می‌کرد. جلسه باز می‌ماند و رسید پایدار نداشت. همچنین رابط پیش از نوشتن SQLite تغییر می‌کرد؛ شکست ذخیره می‌توانست موفقیت ظاهری ایجاد کند. وضعیت خصوصی گوشی مشخص نیست و گم‌شدن فیلد post اثبات نشده است. تست قبلی هر دو پرسش‌نامه را تکمیل می‌کرد و خطای نوشتن و بازگشایی پس از تأیید را بررسی نمی‌کرد.

The new lifecycle freezes and persists the ended workout, keeps a stable workout ID, collects partial stop reason in the same feedback form, and exposes one final Save session action. A synchronous durable store writes before publishing success. Errors retain pending data; retries and double taps are idempotent. Old active post/stop flows recover on upgrade. A persisted receipt links to chronological history. Manual missing-workout entries are explicitly manual and unverified, never invented completed plans.

مسیر جدید پایان جلسه و شناسه ثابت را حفظ می‌کند؛ علت توقف در همان فرم بازخورد پرسیده می‌شود و فقط یک دکمه نهایی «ثبت جلسه» دارد. نوشتن قطعی قبل از موفقیت رابط انجام می‌شود. خطا داده معلق را نگه می‌دارد و تکرار تأیید رکورد اضافه نمی‌سازد. جریان‌های قدیمی با ارتقا بازیابی می‌شوند. رسید پایدار به سابقه مرتب پیوند دارد. ثبت دستی با برچسب دستی و تکمیل تأییدنشده انجام می‌شود.

## Training content / محتوای تمرین

The official [Home Workout listing](https://play.google.com/store/apps/details?id=homeworkout.homeworkouts.noequipment) was reviewed for muscle-focus, instruction and logging patterns, not installed or benchmarked. No proprietary art, code or branding was copied. Five original illustrated movements were added: dead bug, knee/full forearm plank, knee/full side plank. Existing push-up variants remain. Chest, abdominal, oblique, leg/glute, back and aerobic targets are visible. Core abilities are reported independently; unknown ability keeps foundation choices. A/B templates vary dynamic/held core work without increasing the existing two-set volume or removing legs/back. Safe alternatives respect reported ability, equipment and pain gates.

صفحه رسمی Home Workout برای الگوی نمایش عضلات، آموزش و ثبت بررسی شد؛ نصب و آزمایش خود اپ انجام نشده و رسانه یا کد اختصاصی کپی نشده است. پنج حرکت با تصویرسازی اختصاصی اضافه شد: ددباگ، پلانک زانو/کامل و سایدپلانک زانو/کامل. هدف عضله روشن است و توان میان‌تنه جداگانه پرسیده می‌شود. قالب‌های A/B بدون افزایش بی‌دلیل ست و حذف پا/پشت تنوع دارند. جایگزین‌ها تابع توان، امکانات و نبود درد هستند.

Technique references: [NASM dead bug](https://www.nasm.org/resource-center/exercise-library/dead-bug), [ACE front plank](https://www.acefitness.org/resources/everyone/exercise-library/32/front-plank/), [Queensland core strength](https://hw.qld.gov.au/physical-activity/core-strength-and-posture/). Exact app doses are conservative heuristics, not clinical validation: 6 total dynamic reps, 15-second front holds, or 10 seconds per side plus 5 seconds to switch. Timer exposure is not proof of repetitions or form. No spot-fat-loss claim.

منابع روش حرکت: NASM، ACE و نهاد سلامت کوئینزلند. دوز دقیق اپ قاعده محافظه‌کارانه است، نه نسخه بالینی: ۶ تکرار مجموع، پلانک جلو ۱۵ ثانیه یا سایدپلانک ۱۰ ثانیه هر سمت با ۵ ثانیه جابه‌جایی. تایمر فرم یا تکرار واقعی را تشخیص نمی‌دهد؛ کاهش چربی موضعی وعده داده نمی‌شود.

## Validation / بررسی

Local: 61 tests, typecheck and lint. Native acceptance passed on API 35 x86_64: reproduce old intermediate confirmation, same-key upgrade retaining pending session, injected SQLite write failure and retry, rapid double tap, reopen and exact record count, natural timer end, Persian skip/manual finish, independent core ability, suitable substitution and labeled manual entry. Synthetic emulator fixtures only; no real health records or production testing hooks. Previously successful unrelated audio/widget scenarios are not rerun.

محلی: ۶۱ تست، typecheck و lint. پذیرش اندروید API 35 روی x86_64 موفق شد: بازتولید تأیید میانی قبلی، ارتقای هم‌امضا و حفظ جلسه معلق، خطای SQLite و تلاش مجدد، لمس تکراری، بازگشایی و شمارش دقیق، پایان طبیعی، پایان دستی/رد مرحله فارسی، توان مستقل، جایگزین و ثبت دستی مشخص. فقط داده ساختگی شبیه‌ساز استفاده می‌شود؛ سناریوهای نامرتبط موفق قبلی تکرار نمی‌شوند.


Verified / تأییدشده: [build 20](https://github.com/MohammadAmirHekmati/fityar/actions/runs/42284545298), source `c58d0c10016ab0a28d1baec03511eb36bcbc7cf7`, app 1.4.0 / versionCode 5. APK SHA-256: `cb9206bfb24e1854ed431ab2d3fd94bab760b4100da5028ffe64da7c44517a22`.

Build 19 caught a real visibility issue: a failed write retained the pending workout, but its notice was above the viewport. Build 20 uses a modal error, passed the injected-failure retry and all focused scenarios. The same APK upgraded public v1.3.0-preview.18 without uninstalling and retained the pending workout ID and profile. Tests use synthetic emulator records and a near-end timer fixture; they do not validate real-world exercise form, clinical effectiveness or the user’s handset.

ساخت ۱۹ ایراد واقعی نمایش خطا را آشکار کرد: داده معلق حفظ می‌شد، اما پیام بیرون دید بود. ساخت ۲۰ هشدار واضح دارد و خطای عمدی، تلاش مجدد و همه مسیرهای هدفمند را گذراند. همان بسته بدون حذف نسخه عمومی قبلی نصب شد و شناسه جلسه معلق و پروفایل حفظ شدند. آزمون‌ها داده ساختگی و تایمر نزدیک پایان دارند؛ فرم واقعی حرکت، اثربخشی بالینی یا گوشی کاربر آزموده نشده است.
