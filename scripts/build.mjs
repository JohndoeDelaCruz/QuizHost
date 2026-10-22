import { build as viteBuild } from "vite";
import { build } from "esbuild";
await viteBuild();
await build({
  entryPoints: ["server/index.ts", "server/cli.ts"],
  outdir: "dist/server",
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node22",
  packages: "external",
  sourcemap: true,
});
