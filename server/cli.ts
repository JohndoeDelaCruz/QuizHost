import path from "node:path";
import { startServer } from "./index";
const server = await startServer({
  dataDir: process.env.QUIZHOST_DATA_DIR ?? path.resolve("data"),
  staticDir: path.resolve("dist/client"),
  port: Number(process.env.PORT ?? 3210),
});
console.log(
  `QuizHost is running.\nTeacher (keep private): ${server.hostURL}\nStudent on this laptop: ${server.joinURL}\nStudents on phones: use the Wi-Fi address shown under Setup.\nPress Ctrl+C to stop.`,
);
let stopping = false;
async function stop() {
  if (stopping) return;
  stopping = true;
  await server.close();
  process.exit(0);
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
