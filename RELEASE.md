# FitYar 1.2 preview / پیش‌نمایش فیت‌یار ۱.۲

فارسی: زمان‌های ۱۰، ۲۰، ۳۰، ۴۵ و ۶۰ دقیقه و ورودی دستی ۵ تا ۱۲۰ دقیقه اضافه شده‌اند. زمان در دسترس سقف است؛ برنامه با سابقه و ریکاوری به‌آرامی رشد می‌کند. دسترسی خانه/بیرون/هر دو و توقف دستی بین مکان‌ها، پیش‌نویس ارزیابی با خروج امن، پیش‌نمایش بخش اصلی و الگوهای متوازن‌تر قدرتی اضافه شده‌اند. داده و امضای نصب قبلی حفظ می‌شوند.

English: Added 10/20/30/45/60-minute choices and validated 5–120-minute custom availability. Availability is a ceiling; training grows gradually from history and recovery. Added indoor/outdoor/both access, manual location transitions, transactional assessment drafts, main-work previews and more balanced strength patterns. Existing data and signing identity are preserved.

فارسی: صدای آفلاین تمرین از یادآور جداست و سرویس بومی اندروید آن را اجرا می‌کند؛ شروع، استراحت، پایان و شمارش کوتاه بازه‌ها نشانه جدا دارند. شمارش برای پنجره تکرار پخش نمی‌شود. تنظیم صدا، بی‌صدا، لرزش اختیاری و آزمایش صدا وجود دارد. صدای رسانه، بی‌صدا و مزاحم نشوید دستگاه رعایت می‌شوند. تایمر به معنی شمردن خودکار تکرارها نیست.

English: Offline workout tones run through a native Android service independently of daily reminders, with start/rest/end cues and short timed-interval countdowns. Rep windows do not emit countdowns or claim reps were completed. Includes mute, volume, optional vibration and a sound test; respects device media volume, silent mode and DND.

فارسی: ساعت پایان کار و زمان مناسب تمرین، خلاصه قابل‌ویرایش یادآوری می‌سازند. اعلان دارای شروع/تعویق/امروز نمی‌توانم، یک پیگیری بی‌پاسخ، ساعات سکوت و لغو پس از ثبت جلسه است. آماده‌کردن لباس و صدای متمایز اختیاری‌اند. ویجت واقعی صفحه اصلی وضعیت محلی را نشان می‌دهد و برنامه را باز می‌کند. پایان کار از زمان اعلامی کاربر است، نه تشخیص خودکار. دکمه اعلان برنامه را برای اجرای انتخاب باز می‌کند.

English: Declared work-end and preferred exercise time generate an editable reminder summary. Notifications offer start/snooze/cannot-today, one unanswered follow-up, quiet hours and cancellation after recording a session. Preparation and distinct reminder sound are optional. A native home-screen widget reflects local state and opens the plan. Work-end is user-declared, not detected; notification actions open the app to apply the choice.

فارسی: رفع مسیر کم‌محتوا: قبلاً جلسه ۶ تا ۹ دقیقه‌ای پنج دقیقه گرم‌کردن داشت. سهم بخش اصلی اصلاح و هوازی راحت پیوسته شده است. علت دقیق تجربه گزارش‌شده روی گوشی بدون داده آن جلسه قطعی نیست. برنامه کوتاه و ریکاوری برچسب روشن دارند؛ داده ناقص به برنامه پیشرفته تبدیل نمی‌شود.

English: Fixed a sparse-work path: 6–9-minute sessions previously allocated five minutes to warm-up. Main-work allocation is corrected and easy cardio is continuous. The exact cause of the reported phone session cannot be established without that session’s data. Short-start and recovery plans are labeled; incomplete data never grants advanced capability.

Validation / اعتبارسنجی: local unit matrices cover all 116 supported minute values, both locations, transitions, draft cancellation, upgrade-compatible backups and reminder rules. 45 pure tests, TypeScript and lint passed. Basic native acceptance and captured foreground/screen-off audio passed in verification run 11; independent extended acceptance passed in run 12. [Detailed validation](https://github.com/MohammadAmirHekmati/fityar/blob/main/docs/V3-ACCEPTANCE.md). Physical-phone audio routing, calls, Bluetooth/music coexistence and vendor battery behavior require real-device testing. Force-stop and OS restrictions can prevent cues/reminders; no DND bypass is used.

اعتبارسنجی: ۴۵ تست، بررسی نوع و lint موفق بودند. آزمون پایه و ضبط صدای فعال/صفحه‌خاموش در اجرای ۱۱ و آزمون مستقل گسترده در اجرای ۱۲ موفق شدند. [گزارش بررسی](https://github.com/MohammadAmirHekmati/fityar/blob/main/docs/V3-ACCEPTANCE.md). بلوتوث، تماس و محدودیت باتری سازندگان هنوز روی گوشی واقعی آزمایش نشده‌اند.
