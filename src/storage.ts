import * as SQLite from "expo-sqlite";
import {initial, State, validate} from "./model";
export {initial, State, validate} from "./model";
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

