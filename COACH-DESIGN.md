# Guided offline planning / برنامه‌ریزی آفلاین مرحله‌ای

The guided flow uses deterministic local rules, not AI or a conversation model. Answers, current question, draft readiness, timed steps and feedback persist in the existing SQLite state. Version 1 backups remain readable; the optional `coach` field is validated on restore. VersionCode 2 uses the existing signing secrets and package name.

مسیر مرحله‌ای از قواعد قطعی محلی استفاده می‌کند، نه هوش مصنوعی. پاسخ‌ها، سؤال جاری، آمادگی، تایمر و بازخورد در همان SQLite ذخیره می‌شوند. بکاپ نسخه قبلی قابل خواندن است؛ بخش جدید هنگام بازیابی بررسی می‌شود. کد نسخه ۲ با نام بسته و امضای قبلی ساخته می‌شود.

## Rules and limits / قواعد و محدودیت‌ها

Safety overrides readiness. Missing answers and unknown next-day recovery never imply readiness. Once-only capability questions distinguish four push-up variants, leg ability, floor tolerance and walking/running experience. Unsupported incline/wall variants are omitted. Each group has separate feedback; hard feedback reduces that group's dose. A first session is capped at ten minutes, with low repetitions and no maximum test. Three easy recovered records can add one repetition; they never automatically promote push-up variants. Short, low-energy or recovering days use comfortable movement. Running additionally requires reported experience, 20-minute walking tolerance, three easy recovered sessions and 20 minutes available outdoors. These are conservative product heuristics, not a clinically validated prescription.

ایمنی مقدم است؛ پاسخ ناقص و ریکاوری نامعلوم آمادگی محسوب نمی‌شوند. توان شنا، پا، تحمل تمرین روی زمین و سابقه هوازی جدا هستند. تکیه‌گاه نامناسب باعث حذف حرکت می‌شود. بازخورد دشواری هر گروه مقدار همان گروه را کم می‌کند. شروع حداکثر ده دقیقه، بدون آزمون بیشینه است. افزایش یک تکرار فقط با شواهد راحت و ریکاوری انجام می‌شود؛ نوع شنا خودکار سخت‌تر نمی‌شود. دویدن شرایط سخت‌گیرانه‌تری دارد. این‌ها قواعد محافظه‌کارانه محصول‌اند، نه نسخه بالینی تأییدشده.

## Teaching sources / منابع آموزشی

- [NHS strength exercises](https://www.nhs.uk/live-well/exercise/strength-exercises/): stable chair, sit-to-stand, calf/side leg raises, wall press-ups. / صندلی ثابت و حرکات قدرتی ساده.
- [ACE bent-knee push-up](https://www.acefitness.org/resources/everyone/exercise-library/13/bent-knee-push-up/): hands, knee support and aligned torso. / وضعیت دست، زانو و تنه.
- [AHA warm-up and cool-down](https://www.heart.org/en/healthy-living/exercise-and-physical-activity/fitness-basics/warm-up-cool-down): gradual, activity-specific preparation; 5–10 minutes before moderate/vigorous aerobic work. / آماده‌سازی تدریجی متناسب با فعالیت.
- [NHS warm-up](https://www.nhs.uk/live-well/exercise/how-to-warm-up-before-exercising/): marching and gentle shoulder movement. Our schedule is not a reproduction of its six-minute routine. / راه رفتن درجا و حرکت آرام شانه؛ زمان‌بندی اپ بازتولید برنامه شش‌دقیقه‌ای منبع نیست.
- [NHS Couch to 5K](https://www.nhs.uk/better-health/get-active/get-running-with-couch-to-5k/): gradual run/walk approach, recovery days and seeking advice for health concerns. The app does not claim to implement that program. / رویکرد تدریجی دویدن و راه رفتن؛ اپ ادعای اجرای آن برنامه را ندارد.
- [AAOS spine conditioning](https://orthoinfo.aaos.org/en/recovery/spine-conditioning-program/): controlled floor/core movement and pain-free limits. / کنترل حرکت و محدودیت بدون درد.

Every guided active plan has named warm-up steps, written method, time/repetitions, movement-specific illustration and timer, followed by work and cool-down. Strength preparation includes marching, shoulder rolls and two gentle rehearsal repetitions of the chosen leg/push movement. Five-minute sessions are gentle movement breaks only, with gradual entry and exit; they do not squeeze a vigorous workout into a short warm-up. Run/walk sessions reserve five minutes each for walking warm-up and cool-down. All durations count against the stated time budget. Stop with pain or unusual symptoms.

هر برنامه فعال مرحله گرم‌کردن با نام، روش، زمان یا تکرار، تصویر و تایمر دارد. قدرتی شامل راه رفتن درجا، شانه و دو تکرار تمرینی آرام از حرکت منتخب است. جلسه پنج‌دقیقه‌ای فقط وقفه حرکتی آرام است، نه تمرین شدید با گرم‌کردن کوتاه. دویدن پنج دقیقه ورود و پنج دقیقه خروج آرام دارد. همه زمان‌ها در بودجه کل حساب می‌شوند.
