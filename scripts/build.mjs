import { mkdir, readFile, rm, writeFile, cp } from "node:fs/promises";
import path from "node:path";
import { build } from "esbuild";

const rootDir = process.cwd();
const distDir = path.join(rootDir, "dist");
const assetsDir = path.join(distDir, "assets");
const publicDir = path.join(rootDir, "public");

await rm(distDir, { recursive: true, force: true });
await mkdir(assetsDir, { recursive: true });
await cp(publicDir, distDir, { recursive: true });

await build({
  entryPoints: [path.join(rootDir, "src", "main.jsx")],
  bundle: true,
  format: "iife",
  platform: "browser",
  jsx: "automatic",
  target: ["chrome109", "edge109", "firefox109", "safari16"],
  minify: true,
  sourcemap: false,
  outdir: assetsDir,
  entryNames: "app",
  assetNames: "[name]"
});

const template = await readFile(path.join(rootDir, "index.html"), "utf8");
const html = template
  .replace(/<script>[\s\S]*?<\/script>/, "")
  .replace(/<script type=\"module\" src=\"\/src\/main\.jsx\"><\/script>/, "")
  .replace("</head>", "  <link rel=\"stylesheet\" href=\"./assets/app.css\" />\n</head>")
  .replace("<div id=\"root\"></div>", "<div id=\"root\"></div>\n    <script src=\"./assets/app.js\"></script>");

await writeFile(path.join(distDir, "index.html"), html, "utf8");
