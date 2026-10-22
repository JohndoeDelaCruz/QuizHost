const fs = require("node:fs/promises");
const path = require("node:path");
const { runIconsTool } = require("app-builder-lib/out/toolsets/icons");

// Use the icon renderer bundled with electron-builder. No app runtime dependency.
async function main() {
  const root = path.resolve(__dirname, "..");
  const inputFile = path.join(root, "assets/icon.svg");
  const icoDir = path.join(root, "work/icon-build/ico");
  const pngDir = path.join(root, "work/icon-build/png");
  await fs.mkdir(icoDir, { recursive: true });
  await fs.mkdir(pngDir, { recursive: true });
  await runIconsTool({ inputFile, outputFormat: "ico", outDir: icoDir });
  await runIconsTool({ inputFile, outputFormat: "set", outDir: pngDir });
  await fs.copyFile(
    path.join(icoDir, "icon.ico"),
    path.join(root, "assets/icon.ico"),
  );
  await fs.copyFile(
    path.join(pngDir, "512x512.png"),
    path.join(root, "assets/icon.png"),
  );
  await fs.mkdir(path.join(root, "client/public"), { recursive: true });
  await fs.copyFile(inputFile, path.join(root, "client/public/favicon.svg"));
  console.log(
    "Generated Windows icon, 512px preview, and browser favicon from assets/icon.svg.",
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
