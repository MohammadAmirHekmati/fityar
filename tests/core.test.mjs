import test from "node:test";
import assert from "node:assert/strict";
import {
  decide,
  plan,
  elapsed,
  allowed,
  foods,
  foodAdvice,
  normalize,
  dayKey,
} from "../src/core.ts";
const now = Date.UTC(2026, 0, 20, 12);
const check = {
  minutes: 30,
  sleep: 8,
  energy: 4,
  pain: false,
  symptoms: false,
  outside: true,
  mode: "run",
};
const session = (days, changes = {}) => ({
  id: String(days),
  date: "2026-01-01",
  at: now - days * 86400000,
  mode: "run",
  minutes: 20,
  planned: 20,
  effort: 4,
  talk: true,
  pain: false,
  status: "complete",
  recovery: 2,
  reason: { fa: "آزمایشی", en: "Synthetic" },
  ...changes,
});
test("Safety overrides progress / ایمنی مقدم بر پیشرفت", () =>
  assert.equal(
    decide(
      { ...check, symptoms: true },
      [session(2), session(4), session(6)],
      now,
    ).state,
    "stop",
  ));
test("Pain prevents exercise / درد مانع تمرین", () =>
  assert.equal(decide({ ...check, pain: true }, [], now).minutes, 0));
test("First session calibrates without running / شروع سبک", () => {
  const d = decide(check, [], now);
  assert.equal(d.state, "return");
  assert.equal(d.mode, "walk");
});
test("Incomplete recovery never increases / داده ناقص بدون افزایش", () =>
  assert.equal(
    decide(
      check,
      [session(2), session(4, { recovery: undefined }), session(6)],
      now,
    ).state,
    "hold",
  ));
test("Three easy recovered sessions allow one minute / افزایش محدود", () =>
  assert.equal(
    decide(check, [session(2), session(4), session(6)], now).minutes,
    21,
  ));
test("High effort reduces volume / سختی زیاد کاهش حجم", () =>
  assert.equal(
    decide(check, [session(2, { effort: 9 })], now).state,
    "reduce",
  ));
test("Same-day rest / فاصله ریکاوری", () =>
  assert.equal(decide(check, [session(0.5)], now).state, "rest"));
test("Strength needs 48 hours / ریکاوری قدرتی", () =>
  assert.equal(
    decide(
      { ...check, mode: "strength" },
      [session(1.5, { mode: "strength" })],
      now,
    ).state,
    "rest",
  ));
test("Return after gap / بازگشت پس از وقفه", () =>
  assert.equal(decide(check, [session(14)], now).state, "return"));
test("No double compensation for missed / بدون جبران دوبرابر", () =>
  assert.equal(
    decide(check, [session(1, { status: "missed" }), session(3)], now).minutes,
    20,
  ));
test("Time and location are bounded / محدودیت زمان و مکان", () => {
  const d = decide({ ...check, minutes: 8, outside: false }, [session(2)], now);
  assert.equal(d.mode, "home");
  assert.ok(d.minutes <= 8);
});
test("Timer restores, pauses and clamps clock rollback / بازیابی تایمر", () => {
  const a = { started: 1000, elapsed: 10, paused: false };
  assert.equal(elapsed(a, 11000), 20);
  assert.equal(elapsed({ ...a, paused: true }, 11000), 10);
  assert.equal(elapsed(a, -100000), 0);
});
test("Plan contains warmup and cooldown / گرم و سردکردن", () => {
  for (const mode of ["walk", "run", "strength", "home", "short"]) {
    const p = plan({
      state: "hold",
      reason: { fa: "", en: "" },
      minutes: 20,
      mode,
    });
    assert.ok(p.length >= 3);
    assert.ok(Math.abs(p.reduce((n, x) => n + x.seconds, 0) - 1200) < 7);
  }
});
test("Allergy excludes unknown recipes / حذف ترکیب نامعلوم", () => {
  assert.equal(
    allowed(
      foods.find((f) => f.id === "stew"),
      ["egg"],
      false,
    ),
    false,
  );
  assert.equal(
    allowed(
      foods.find((f) => f.id === "yogurt"),
      ["dairy"],
      false,
    ),
    false,
  );
  assert.equal(
    allowed(
      foods.find((f) => f.id === "chicken"),
      [],
      true,
    ),
    false,
  );
});
test("Bilingual catalog and portion advice / محتوای دوزبانه", () => {
  for (const f of foods) {
    assert.ok(f.name.fa && f.name.en && f.portion.fa && f.portion.en);
    assert.ok(foodAdvice(f, 2, true, true).fa);
  }
  assert.match(
    foodAdvice(
      foods.find((f) => f.id === "chips"),
      2,
      true,
      false,
    ).en,
    /smaller/,
  );
});
test("Persian normalization and local date / نرمال‌سازی و تاریخ محلی", () => {
  assert.equal(normalize("كيك"), "کیک");
  assert.equal(dayKey(new Date(2026, 1, 3, 23, 0)), "2026-02-03");
});
