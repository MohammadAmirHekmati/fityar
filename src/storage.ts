import * as SQLite from "expo-sqlite";
import { Active, Lang, Session } from "./core";
export interface State {
  version: 1;
  lang: Lang;
  dark: boolean;
  onboard: boolean;
  profile: { age: string; limitations: string };
  sessions: Session[];
  active: Active | null;
  meals: { id: string; date: string; food: string; portion: number }[];
  favorites: string[];
  allergies: string[];
  vegetarian: boolean;
  available: string[];
  habits: Record<string, string[]>;
  measures: { date: string; weight: number; waist: number }[];
  reminders: {
    enabled: boolean;
    hour: number;
    minute: number;
    quietStart: number;
    quietEnd: number;
    water: boolean;
    move: boolean;
  };
}
export const initial: State = {
  version: 1,
  lang: "fa",
  dark: true,
  onboard: false,
  profile: { age: "", limitations: "" },
  sessions: [],
  active: null,
  meals: [],
  favorites: [],
  allergies: [],
  vegetarian: false,
  available: [],
  habits: {},
  measures: [],
  reminders: {
    enabled: false,
    hour: 18,
    minute: 0,
    quietStart: 22,
    quietEnd: 8,
    water: false,
    move: false,
  },
};
let db: SQLite.SQLiteDatabase;
export function load(): State {
  db = SQLite.openDatabaseSync("fityar.db");
  db.execSync(
    "PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS state (id INTEGER PRIMARY KEY, data TEXT NOT NULL)",
  );
  const row = db.getFirstSync<{ data: string }>(
    "SELECT data FROM state WHERE id=1",
  );
  if (!row) return initial;
  return validate(JSON.parse(row.data));
}
export function save(state: State) {
  db.runSync(
    "INSERT OR REPLACE INTO state (id,data) VALUES (1,?)",
    JSON.stringify(state),
  );
}
export function validate(value: unknown): State {
  const s = value as State;
  if (
    !s ||
    s.version !== 1 ||
    !["fa", "en"].includes(s.lang) ||
    typeof s.dark !== "boolean" ||
    typeof s.onboard !== "boolean" ||
    !s.profile ||
    !Array.isArray(s.sessions) ||
    !Array.isArray(s.meals) ||
    !Array.isArray(s.measures) ||
    !Array.isArray(s.favorites) ||
    !Array.isArray(s.allergies) ||
    !Array.isArray(s.available) ||
    !s.habits ||
    !s.reminders
  )
    throw Error("Invalid backup");
  if (
    s.sessions.some(
      (x) =>
        !x.id ||
        !Number.isFinite(x.at) ||
        !Number.isFinite(x.minutes) ||
        !["walk", "run", "strength", "home", "short"].includes(x.mode) ||
        !["complete", "partial", "missed"].includes(x.status) ||
        !x.reason?.fa ||
        !x.reason?.en,
    )
  )
    throw Error("Invalid sessions");
  if (
    s.measures.some(
      (x) =>
        !/^\d{4}-\d{2}-\d{2}$/.test(x.date) ||
        !Number.isFinite(x.weight) ||
        !Number.isFinite(x.waist),
    )
  )
    throw Error("Invalid measurements");
  if (
    s.active &&
    (!Array.isArray(s.active.steps) ||
      !Number.isFinite(s.active.started) ||
      !Number.isFinite(s.active.elapsed) ||
      !s.active.decision)
  )
    throw Error("Invalid timer");
  return s;
}
