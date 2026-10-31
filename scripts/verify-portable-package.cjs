const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const asar = require("@electron/asar");
const { getPath7za } = require("app-builder-lib/out/toolsets/7zip");

// Inspect the portable archive without launching QuizHost or touching user data.
async function main() {
  const root = path.resolve(__dirname, "..");
  const version = require("../package.json").version;
  const unpacked = path.join(root, "release/win-unpacked");
  const archive = path.join(unpacked, "resources/app.asar");
  const exe = path.join(root, `release/QuizHost-${version}-Windows.exe`);
  const entries = asar
    .listPackage(archive)
    .map((file) => file.replaceAll("\\", "/").replace(/^\//, ""));
  for (const file of entries) {
    assert.ok(
      !/^(?:data|work|deliverables|outputs|release|\.git)(?:\/|$)/i.test(file),
      `Local directory included: ${file}`,
    );
    assert.ok(
      !/(?:^|\/)PROJECT-CONTEXT\.md$/i.test(file),
      `Internal notes included: ${file}`,
    );
    assert.ok(
      !/(?:^|\/)\.env(?:\.|$)/i.test(file),
      `Environment file included: ${file}`,
    );
  }
  console.log(
    `Audited ${entries.length} entries: no local data, fixtures, environment files or internal project notes.`,
  );
  const packagedVersion = JSON.parse(
    asar.extractFile(archive, "package.json").toString("utf8"),
  ).version;
  assert.equal(packagedVersion, version);
  const frontend = fs
    .readdirSync(path.join(root, "dist/client/assets"))
    .filter((file) => file.endsWith(".js"))
    .map((file) =>
      fs.readFileSync(path.join(root, "dist/client/assets", file), "utf8"),
    )
    .join("\n");
  const games = [
    "Quiz board",
    "Classic",
    "Classic Jr.",
    "Memory",
    "Tic Tac Toe",
    "Four in a Row",
    "Bingo",
    "Snakes & Ladders",
    "Story Dice",
    "Bowling",
    "Soccer",
    "American Football",
    "Adventure Trail",
    "Basketball",
    "Balloon Words",
    "Egg Hunt",
  ];
  for (const name of games)
    assert.ok(frontend.includes(name), `Missing game in frontend: ${name}`);
  assert.ok(frontend.includes(version), "Frontend version is stale.");
  console.log(`Version ${version} and all sixteen game labels verified.`);

  const work = path.join(root, "work");
  fs.mkdirSync(work, { recursive: true });
  const temp = fs.mkdtempSync(path.join(work, "portable-package-check-"));
  const resources = [
    "resources/app.asar",
    "resources/app.asar.unpacked/node_modules/sql.js/dist/sql-wasm.wasm",
    "resources/icon.ico",
  ];
  const hash = (file) =>
    crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
  try {
    const extraction = spawnSync(
      await getPath7za(),
      [
        "x",
        exe,
        ...resources.map((file) => file.split("/").join(path.sep)),
        `-o${temp}`,
        "-y",
      ],
      { encoding: "utf8", windowsHide: true },
    );
    assert.equal(extraction.status, 0, extraction.stdout + extraction.stderr);
    for (const resource of resources) {
      assert.equal(
        hash(path.join(temp, resource)),
        hash(path.join(unpacked, resource)),
        `Portable payload differs: ${resource}`,
      );
      console.log(`Portable payload matches: ${resource}`);
    }
    console.log(
      `Portable EXE verified: ${fs.statSync(exe).size} bytes, SHA-256 ${hash(exe)}`,
    );
  } finally {
    const resolved = path.resolve(temp);
    assert.ok(
      resolved.startsWith(
        path.resolve(work) + path.sep + "portable-package-check-",
      ),
      "Unsafe audit cleanup path.",
    );
    fs.rmSync(resolved, { recursive: true, force: true });
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
