# Design and validation / طراحی و اعتبارسنجی

Training rules use gradual, relative-intensity progression and major movement patterns, informed by [CDC adult activity guidance](https://www.cdc.gov/physical-activity-basics/guidelines/adults.html) and [NIDDK starting activity guidance](https://www.niddk.nih.gov/health-information/weight-management/tips-get-active/tips-starting-physical-activity). These sources inform general principles; the exact timer/repetition algorithm is a conservative product heuristic, not a validated clinical prescription. A five-minute comfortable-movement break is explicitly distinct from a main strength session. Experienced running retains five-minute walking warm-up and cool-down.

فارسی: پیشرفت تدریجی و الگوهای اصلی حرکت با راهنمای عمومی CDC و NIDDK سنجیده شده‌اند. زمان‌بندی و تعداد تکرار دقیق، قاعده محافظه‌کارانه محصول است و نسخه بالینی اعتبارسنجی‌شده نیست. حرکت راحت پنج‌دقیقه‌ای از جلسه اصلی قدرتی متمایز است. دویدنِ دارای سابقه، پنج دقیقه راه‌رفتن برای گرم و سردکردن دارد.

Implementation references / منابع پیاده‌سازی:
- [Expo SDK 58 notifications](https://docs.expo.dev/versions/v58.0.0/sdk/notifications/)
- [Android native widgets](https://developer.android.com/develop/ui/views/appwidgets)
- [Android audio focus](https://developer.android.com/media/optimize/audio-focus)
- [Android foreground services](https://developer.android.com/develop/background-work/services/fgs/service-types)

Pending release acceptance / پذیرش پیش از انتشار در حال اجرا:
- TypeScript and 43 pure tests passed; lint passed. / بررسی نوع و ۴۳ تست خالص موفق؛ lint موفق.
- Native compilation, actual emulator screenshots and v2 upgrade run pending. / ساخت بومی، تصاویر شبیه‌ساز و ارتقا از نسخه دوم هنوز در حال انجام است.
- No physical phone was available. No claim of tested Bluetooth, incoming calls, music mixing, or OEM background reliability. / گوشی واقعی در دسترس نبود؛ تماس، بلوتوث، موسیقی و محدودیت سازنده تأیید نشده‌اند.
