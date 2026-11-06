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

Local: 61 tests, typecheck and lint. Native acceptance pending: reproduce old intermediate confirmation, same-key upgrade retaining pending session, injected SQLite write failure and retry, rapid double tap, reopen and exact record count, natural timer end, Persian skip/manual finish, independent core ability, suitable substitution and labeled manual entry. Synthetic emulator fixtures only; no real health records or production testing hooks. Previously successful unrelated audio/widget scenarios are not rerun.

محلی: ۶۱ تست، typecheck و lint. پذیرش اندروید در انتظار اجرا: بازتولید تأیید میانی قبلی، ارتقای هم‌امضا و حفظ جلسه معلق، خطای SQLite و تلاش مجدد، لمس تکراری، بازگشایی و شمارش دقیق، پایان طبیعی، پایان دستی/رد مرحله فارسی، توان مستقل، جایگزین و ثبت دستی مشخص. فقط داده ساختگی شبیه‌ساز استفاده می‌شود؛ سناریوهای نامرتبط موفق قبلی تکرار نمی‌شوند.
