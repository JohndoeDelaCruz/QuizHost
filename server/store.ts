import initSqlJs, { type Database } from "sql.js";
import { createRequire } from "node:module";
import {
  mkdirSync,
  existsSync,
  readFileSync,
  writeFileSync,
  renameSync,
} from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { Quiz, Result } from "../shared/types";

const require = createRequire(import.meta.url);
export class Store {
  constructor(
    private db: Database,
    private file: string,
  ) {}
  static async open(directory: string) {
    mkdirSync(directory, { recursive: true });
    const wasm = require.resolve("sql.js/dist/sql-wasm.wasm");
    const SQL = await initSqlJs({
      wasmBinary: Uint8Array.from(readFileSync(wasm)).buffer,
    });
    const file = path.join(directory, "quizhost.sqlite");
    const db = existsSync(file)
      ? new SQL.Database(readFileSync(file))
      : new SQL.Database();
    db.run(
      "CREATE TABLE IF NOT EXISTS quizzes (id TEXT PRIMARY KEY, body TEXT NOT NULL); CREATE TABLE IF NOT EXISTS results (id TEXT PRIMARY KEY, body TEXT NOT NULL)",
    );
    const store = new Store(db, file);
    if (!store.quizzes().length && !existsSync(file))
      store.saveQuiz(sampleQuiz());
    store.flush();
    return store;
  }
  private rows<T>(table: "quizzes" | "results"): T[] {
    return (this.db.exec(`SELECT body FROM ${table}`)[0]?.values ?? []).map(
      (row) => JSON.parse(String(row[0])) as T,
    );
  }
  quizzes() {
    return this.rows<Quiz>("quizzes").sort((a, b) =>
      b.updatedAt.localeCompare(a.updatedAt),
    );
  }
  quiz(id: string) {
    return this.quizzes().find((q) => q.id === id);
  }
  saveQuiz(quiz: Quiz) {
    this.db.run("INSERT OR REPLACE INTO quizzes VALUES (?, ?)", [
      quiz.id,
      JSON.stringify(quiz),
    ]);
    this.flush();
    return quiz;
  }
  deleteQuiz(id: string) {
    this.db.run("DELETE FROM quizzes WHERE id = ?", [id]);
    this.flush();
  }
  results() {
    return this.rows<Result>("results").sort((a, b) =>
      b.finishedAt.localeCompare(a.finishedAt),
    );
  }
  saveResult(result: Result) {
    this.db.run("INSERT OR REPLACE INTO results VALUES (?, ?)", [
      result.id,
      JSON.stringify(result),
    ]);
    this.flush();
  }
  flush() {
    const temp = this.file + ".tmp";
    writeFileSync(temp, this.db.export());
    renameSync(temp, this.file);
  }
  close() {
    this.flush();
    this.db.close();
  }
}
function sampleQuiz(): Quiz {
  return {
    id: randomUUID(),
    title: "A little bit of everything",
    description:
      "A ready-to-play warm-up for curious minds. Science, geography, and a little everyday magic.",
    updatedAt: new Date().toISOString(),
    questions: [
      [
        "Which planet is known as the Red Planet?",
        ["Venus", "Mars", "Jupiter", "Saturn"],
        1,
      ],
      [
        "What do plants absorb from the atmosphere?",
        ["Oxygen", "Nitrogen", "Carbon dioxide", "Helium"],
        2,
      ],
      [
        "How many sides does a hexagon have?",
        ["Five", "Six", "Seven", "Eight"],
        1,
      ],
      [
        "Which is the largest ocean on Earth?",
        ["Atlantic", "Indian", "Arctic", "Pacific"],
        3,
      ],
      [
        "At sea level, water boils at what temperature?",
        ["50°C", "75°C", "100°C", "150°C"],
        2,
      ],
      [
        "Which organ pumps blood around the body?",
        ["Lungs", "Brain", "Heart", "Liver"],
        2,
      ],
    ].map(([prompt, options, correctIndex]) => ({
      id: randomUUID(),
      prompt: prompt as string,
      options: options as string[],
      correctIndex: correctIndex as number,
      seconds: 20,
      points: 100,
    })),
  };
}
