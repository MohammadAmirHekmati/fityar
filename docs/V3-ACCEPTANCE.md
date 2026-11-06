# Design and validation / طراحی و اعتبارسنجی

Training rules use gradual, relative-intensity progression and major movement patterns, informed by [CDC adult activity guidance](https://www.cdc.gov/physical-activity-basics/guidelines/adults.html) and [NIDDK starting activity guidance](https://www.niddk.nih.gov/health-information/weight-management/tips-get-active/tips-starting-physical-activity). These sources inform general principles; the exact timer/repetition algorithm is a conservative product heuristic, not a validated clinical prescription. A five-minute comfortable-movement break is explicitly distinct from a main strength session. Experienced running retains five-minute walking warm-up and cool-down.

فارسی: پیشرفت تدریجی و الگوهای اصلی حرکت با راهنمای عمومی CDC و NIDDK سنجیده شده‌اند. زمان‌بندی و تعداد تکرار دقیق، قاعده محافظه‌کارانه محصول است و نسخه بالینی اعتبارسنجی‌شده نیست. حرکت راحت پنج‌دقیقه‌ای از جلسه اصلی قدرتی متمایز است. دویدنِ دارای سابقه، پنج دقیقه راه‌رفتن برای گرم و سردکردن دارد.

Implementation references / منابع پیاده‌سازی:
- [Expo SDK 58 notifications](https://docs.expo.dev/versions/v58.0.0/sdk/notifications/)
- [Android native widgets](https://developer.android.com/develop/ui/views/appwidgets)
- [Android audio focus](https://developer.android.com/media/optimize/audio-focus)
- [Android foreground services](https://developer.android.com/develop/background-work/services/fgs/service-types)

Release acceptance / پذیرش انتشار:
- TypeScript and 45 pure tests passed; lint passed. / بررسی نوع و ۴۵ تست خالص موفق؛ lint موفق.
- Signed native compilation passed in build 16. The basic emulator run verified v2 installation followed by an in-place v3 upgrade, retained profile/measurements/food/history, safe draft cancellation, custom time and multi-step main work. Audio output passed in run 11; extended widget and notification-action acceptance passed independently in run 12. / ساخت بومی امضاشده در اجرای ۱۶ موفق شد. آزمون پایه ارتقای درجا از نسخه دوم، حفظ پروفایل و اندازه‌گیری و غذا و سابقه، لغو امن پیش‌نویس، زمان دستی و بخش اصلی چندمرحله‌ای را بررسی کرد. خروجی صوتی در اجرای ۱۱ و پذیرش گسترده ویجت و دکمه‌های اعلان در اجرای مستقل ۱۲ تأیید شدند.
- No physical phone was available. No claim of tested Bluetooth, incoming calls, music mixing, or OEM background reliability. / گوشی واقعی در دسترس نبود؛ تماس، بلوتوث، موسیقی و محدودیت سازنده تأیید نشده‌اند.

Build identity / شناسه ساخت:
- App source: `85cf4469471f69a78d9f129d38ee5d2851fde14f`; build run: `42252707265`; version `1.2.0` / code `3`.
- APK SHA-256: `6b155abc2a174af626e223aff6b60f4a3351f553162db52498a37b5b9110e311`; bytes: `60320851`.

The basic upgrade test enters synthetic records through the UI before upgrading. Extended history scenarios write synthetic SQLite fixtures only after checking that the target is an emulator; no fixture entry points exist in the shipped app. / آزمون ارتقای پایه داده ساختگی را از رابط وارد می‌کند. سناریوهای سابقه گسترده فقط پس از تأیید شبیه‌ساز بودن دستگاه، داده ساختگی SQLite می‌نویسند؛ برنامه منتشرشده ورودی ویژه آزمون ندارد.

## Basic native acceptance / پذیرش بومی پایه

The complete basic suite passed against the signed APK in [verification run 11](https://github.com/MohammadAmirHekmati/fityar/actions/runs/42263946109): genuine v2-to-v3 upgrade, retained records, safe assessment drafts, 37-minute custom availability and validation, both-location access, warm-up/main work/push sets, pause/restore, partial recording, native notification delivery, widget pinning, and Persian/English compact-screen screenshots at 1.3 font scale. The run later stopped in the separate extended suite on an immediate UI assertion; the screenshot and XML already showed the correct outside location. Extended assertions now wait for the UI to settle.

فارسی: مجموعه پایه در اجرای ۱۱ روی همین APK امضاشده موفق شد: ارتقای واقعی از نسخه دوم، حفظ اطلاعات، پیش‌نویس امن، ورودی زمان ۳۷ دقیقه و اعتبارسنجی، دسترسی هر دو مکان، گرم‌کردن و بخش اصلی و ست شنا، مکث و بازیابی، ثبت ناقص، دریافت اعلان واقعی، نصب ویجت و تصاویر فارسی/انگلیسی با صفحه کوچک و فونت ۱٫۳. اجرای کلی سپس در مجموعه گسترده روی بررسی زودهنگام رابط متوقف شد؛ تصویر و XML مکان صحیح بیرون را نشان می‌دادند. بررسی گسترده اکنون برای تثبیت رابط انتظار می‌کشد.

Audio was captured from the emulator PulseAudio output, not a physical microphone. Android media volume was verified at 15/15 and the app at 60. PCM16 peaks: baseline 0; sound test 1529; 50-second screen-off capture 1621. Native boundary 5 occurred while the screen was off; boundary 4 occurred only once across pause/resume. These results demonstrate synthesized output in the emulator, not real-device audibility or Bluetooth/call behavior.

فارسی: صدا از خروجی PulseAudio شبیه‌ساز ضبط شد، نه میکروفن واقعی. صدای رسانه ۱۵ از ۱۵ و تنظیم اپ ۶۰ بود. قله PCM16 برای سکوت مبنا صفر، صدای آزمایشی ۱۵۲۹ و ضبط ۵۰ثانیه‌ای صفحه‌خاموش ۱۶۲۱ بود. مرز مرحله ۵ هنگام خاموشی صفحه اجرا شد و مرز ۴ در مکث/ادامه تکرار نشد. این نتیجه خروجی صوتی شبیه‌ساز را تأیید می‌کند، نه شنیداری گوشی واقعی یا رفتار بلوتوث و تماس.

## Extended native acceptance / پذیرش بومی گسترده

[Verification run 12](https://github.com/MohammadAmirHekmati/fityar/actions/runs/42266610617) passed all extended scenarios against the same APK, with test code `bf79ee5f47ba9ab01b84b55b904172373279993a`. A fresh emulator installation created its profile through the UI, then emulator-only synthetic history exercised an eligible mixed session, the manual location barrier and exclusion of transfer time, real launcher-widget start at warm-up, real notification snooze/skip/start actions, one follow-up, quiet-hour suppression and cancellation after recording a partial session. Android runtime error checks passed. The final widget, notification, transition and bilingual compact-screen screenshots were visually inspected. No production app source changed between the successful basic and extended runs.

فارسی: اجرای ۱۲ همه سناریوهای گسترده را روی همان APK با موفقیت گذراند. پروفایل نصب تازه از رابط ساخته شد؛ سپس سابقه ساختگی مخصوص شبیه‌ساز، جلسه ترکیبی واجد شرایط، توقف دستی تغییر مکان و حذف زمان انتقال از تمرین، شروع واقعی ویجت با گرم‌کردن، دکمه‌های واقعی تعویق/رد/شروع اعلان، یک پیگیری، ساعات سکوت و لغو پس از ثبت جلسه ناقص را بررسی کرد. بررسی خطاهای زمان اجرای اندروید موفق بود. تصاویر ویجت، اعلان، انتقال مکان و رابط دوزبانه در اندازه کوچک بازبینی شدند. کد برنامه میان آزمون پایه و گسترده تغییر نکرد.

Known cosmetic limitation / محدودیت ظاهری شناخته‌شده: Android package metadata reports 1.2.0, while the old About footer still displays 1.0.0. / نسخه بسته اندروید ۱٫۲٫۰ است، اما متن قدیمی پایین صفحه درباره هنوز ۱٫۰٫۰ را نشان می‌دهد.
