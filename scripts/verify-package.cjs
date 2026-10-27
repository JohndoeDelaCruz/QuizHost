const asar = require("@electron/asar");
const path = require("node:path");
const fs = require("node:fs");
const crypto = require("node:crypto");
const archive = path.resolve("release/win-unpacked/resources/app.asar");
const files = asar
  .listPackage(archive)
  .map((file) => file.split(path.sep).join("/"));
const required = [
  "/electron/main.cjs",
  "/dist/server/index.js",
  "/dist/client/index.html",
  "/node_modules/express/index.js",
  "/node_modules/socket.io/dist/index.js",
  "/node_modules/sql.js/dist/sql-wasm.wasm",
];
for (const file of required) {
  if (!files.includes(file)) throw new Error("Missing packaged file: " + file);
  console.log("Present: " + file);
}
const hash = (buffer) =>
  crypto.createHash("sha256").update(buffer).digest("hex");
const readArchive = (file) =>
  asar.extractFile(archive, file.split("/").join(path.sep));
const expectedVersion = JSON.parse(
  fs.readFileSync("package.json", "utf8"),
).version;
if (
  JSON.parse(readArchive("package.json").toString("utf8")).version !==
  expectedVersion
)
  throw new Error("Packaged application version is stale.");
const wasm = readArchive("node_modules/sql.js/dist/sql-wasm.wasm");
if (
  hash(wasm) !== hash(fs.readFileSync("node_modules/sql.js/dist/sql-wasm.wasm"))
)
  throw new Error(
    "Packaged SQLite runtime does not match the installed dependency.",
  );
if (
  hash(readArchive("dist/server/index.js")) !==
  hash(fs.readFileSync("dist/server/index.js"))
)
  throw new Error("Packaged server is stale.");
if (
  hash(readArchive("electron/main.cjs")) !==
  hash(fs.readFileSync("electron/main.cjs"))
)
  throw new Error("Packaged desktop entry point is stale.");
for (const file of fs.readdirSync("dist/client/assets")) {
  if (
    hash(readArchive("dist/client/assets/" + file)) !==
    hash(fs.readFileSync("dist/client/assets/" + file))
  )
    throw new Error("Packaged frontend is stale: " + file);
}
for (const file of fs
  .readdirSync("client/public/avatars")
  .filter((file) => file.endsWith(".png"))) {
  if (
    hash(readArchive("dist/client/avatars/" + file)) !==
    hash(fs.readFileSync("client/public/avatars/" + file))
  )
    throw new Error("Packaged avatar is missing or stale: " + file);
}
for (const file of fs.readdirSync("client/public/audio").filter((file) => /\.(mp3|ogg)$/.test(file))) {
  if (hash(readArchive("dist/client/audio/" + file)) !== hash(fs.readFileSync("client/public/audio/" + file)))
    throw new Error("Packaged audio is missing or stale: " + file);
}
for (const file of fs.readdirSync("client/public/art")) {
  if (hash(readArchive("dist/client/art/" + file)) !== hash(fs.readFileSync("client/public/art/" + file)))
    throw new Error("Packaged artwork is missing or stale: " + file);
}
if (
  hash(readArchive("dist/client/index.html")) !==
  hash(fs.readFileSync("dist/client/index.html"))
)
  throw new Error("Packaged frontend HTML is stale.");
if (
  hash(readArchive("dist/client/favicon.svg")) !==
  hash(fs.readFileSync("client/public/favicon.svg"))
)
  throw new Error("Packaged browser icon is stale.");
if (
  hash(fs.readFileSync("release/win-unpacked/resources/icon.ico")) !==
  hash(fs.readFileSync("assets/icon.ico"))
)
  throw new Error("Packaged window icon is stale.");
console.log("Packaged runtime, entry points, and compiled server verified.");
