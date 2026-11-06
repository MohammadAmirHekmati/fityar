# FitYar / فیت‌یار

Planner v4: [reviewed examples and regression evidence](docs/V4-ACCEPTANCE.md).
نسخه چهارم برنامه‌ساز: [نمونه‌های بازبینی‌شده و شواهد رگرسیون](docs/V4-ACCEPTANCE.md).

An independent, offline Android fitness and food companion in Persian and English. No AI, account, analytics, or backend. Health records remain in local SQLite; exports occur only on request.

همراه مستقل و آفلاین اندروید برای تمرین و انتخاب غذا، به فارسی و انگلیسی. بدون هوش مصنوعی، حساب، تحلیل‌گر یا سرور. اطلاعات سلامت در SQLite محلی است و خروجی تنها با درخواست کاربر انجام می‌شود.

[Download signed 1.3 preview APK / دانلود APK امضاشده ۱٫۳](https://github.com/MohammadAmirHekmati/fityar/releases/download/v1.3.0-preview.18/fityar.apk) · [Validation / اعتبارسنجی](docs/V4-ACCEPTANCE.md)

## Features / قابلیت‌ها

- Saved, one-question-at-a-time intake and daily check; automatic plans with separately assessed push-up, leg and core ability. Guided warm-up, exercise and cool-down are included in the available time.
- آشنایی و بررسی روزانه تک‌سؤالی با ذخیره پیشرفت؛ برنامه خودکار با توان مستقل شنا، پا و میان‌تنه. گرم‌کردن، تمرین و سردکردن هدایت‌شده در زمان آزاد حساب می‌شوند.
- Seventeen bilingual movement guides with clearly labeled two-frame illustrations; a real-photo supplement with attribution. [Planning rules and sources](COACH-DESIGN.md) · [Media credits](assets/movements/CREDITS.md).
- هفده راهنمای حرکت دوزبانه با تصویرسازی دو مرحله‌ای و برچسب روشن؛ عکس واقعی تکمیلی با ذکر منبع. [قواعد و منابع](COACH-DESIGN.md) · [مجوز رسانه](assets/movements/CREDITS.md).

- Conservative readiness rules, recovery check-ins, explainable decisions, persistent interval timer and external workout logging.
- قواعد محافظه‌کارانه آمادگی، ثبت ریکاوری، دلیل تصمیم، تایمر پایدار و ثبت تمرین بیرون اپ.
- Local bilingual food search, portions, allergies, available alternatives, favorites and recent logs.
- جستجوی محلی دوزبانه غذا، سهم، حساسیت، جایگزین موجود، علاقه‌مندی و ثبت اخیر.
- Weight trend, habits, local notifications, light/dark themes, JSON backup/restore and shareable summaries.
- روند وزن، عادت‌ها، اعلان محلی، تم روشن/تاریک، بکاپ و بازیابی JSON و خلاصه قابل اشتراک.

## Development / توسعه

```sh
npm ci
npm run typecheck
npm test
npx expo prebuild --platform android
```

GitHub Actions builds a signed APK. Signing keys are GitHub Secrets, never repository files. Keep the original signing key for future updates. The generated Android directory is not tracked.

GitHub Actions بسته امضاشده می‌سازد. کلید امضا فقط در Secrets است و وارد مخزن نمی‌شود. کلید اصلی برای آپدیت‌های بعدی حفظ شود. پوشه تولیدشده اندروید در گیت ثبت نمی‌شود.

## Boundaries / محدودیت‌ها

General adult wellness guidance, not diagnosis or treatment. Stop for concerning symptoms. Food portions are qualitative and contain no fabricated nutrient values. Allergy filters are not exhaustive; always inspect ingredients. Schematics supplement written cues and are not clinical movement assessments.

راهنمای عمومی تندرستی بزرگسالان است، نه تشخیص یا درمان. با علائم نگران‌کننده توقف کنید. سهم غذا کیفی است و ارزش غذایی ساختگی ندارد. فیلتر حساسیت جامع نیست؛ مواد اولیه را بررسی کنید. شماتیک‌ها مکمل متن‌اند و ارزیابی بالینی حرکت نیستند.

Notifications cover a rolling 7-day window. Android battery restrictions and force-stop can prevent delivery. The timer uses persisted timestamps, not a continuously running background JavaScript loop. Real-device lock-screen, notification, backup, and upgrade acceptance remain required before a stable release.

Precise daily reminders use the optional Android exact-alarm permission exposed in Settings. Without it, Android can delay scheduled reminders. Workout cues use a separate native foreground audio service. [Expo permission documentation](https://docs.expo.dev/versions/v58.0.0/sdk/notifications/#requestexactalarmpermissionsasync)

یادآور دقیق روزانه از مجوز اختیاری زمان‌بندی دقیق Android در تنظیمات استفاده می‌کند. بدون آن ممکن است یادآور با تأخیر برسد. صدای تمرین با سرویس بومی مستقل اجرا می‌شود. [مستندات مجوز Expo](https://docs.expo.dev/versions/v58.0.0/sdk/notifications/#requestexactalarmpermissionsasync)

اعلان‌ها در پنجره ۷ روزه تنظیم می‌شوند. محدودیت باتری و توقف اجباری ممکن است مانع آن‌ها شود. تایمر از زمان ذخیره‌شده استفاده می‌کند، نه اجرای دائمی جاوااسکریپت در پس‌زمینه. بررسی صفحه قفل، اعلان، بکاپ و ارتقا روی گوشی واقعی پیش از انتشار پایدار لازم است.

## Sources / منابع

- [CDC: activity intensity / شدت فعالیت](https://www.cdc.gov/physical-activity-basics/measuring/index.html)
- [NHS: strength exercises / تمرین قدرتی](https://www.nhs.uk/live-well/exercise/strength-exercises/)
- [NHS: balanced diet / تغذیه متعادل](https://www.nhs.uk/live-well/eat-well/how-to-eat-a-balanced-diet/eating-a-balanced-diet/)
- [AAOS: bridge and modified side plank / پل باسن و پلانک بغل تعدیل‌شده](https://www.orthoinfo.org/bodypart/back/spine-conditioning-program/)

App-specific progression thresholds are conservative product heuristics, not validated medical prescriptions. Tests use synthetic records only.

آستانه‌های پیشرفت، قواعد محافظه‌کارانه محصول‌اند و نسخه پزشکی اعتبارسنجی‌شده نیستند. داده‌های تست کاملاً ساختگی‌اند.
