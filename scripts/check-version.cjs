const fs = require("fs");
const path = require("path");

const version = process.argv[2];
const previousVersion = process.argv[3];
if (!version) {
  throw new Error("usage: node scripts/check-version.cjs <version> [previous-version]");
}

const packageJson = require("../package.json");
const packageLock = require("../package-lock.json");
const tauriConf = require("../src-tauri/tauri.conf.json");
const cargoToml = fs.readFileSync("src-tauri/Cargo.toml", "utf8");
const cargoLock = fs.readFileSync("src-tauri/Cargo.lock", "utf8");

const checks = [
  ["package.json", packageJson.version],
  ["package-lock.json", packageLock.version],
  ["package-lock.json packages root", packageLock.packages[""].version],
  ["src-tauri/tauri.conf.json", tauriConf.version],
  ["src-tauri/Cargo.toml", cargoToml.match(/^version = "([^"]+)"/m)?.[1]],
  [
    "src-tauri/Cargo.lock omp-switch",
    cargoLock.match(/\[\[package\]\]\r?\nname = "omp-switch"\r?\nversion = "([^"]+)"/)?.[1],
  ],
];

const mismatches = checks.filter(([, actual]) => actual !== version);
if (mismatches.length) {
  for (const [name, actual] of mismatches) {
    console.error(`${name}: expected ${version}, got ${actual ?? "missing"}`);
  }
  process.exit(1);
}

const textExtensions = new Set([
  ".cjs",
  ".css",
  ".html",
  ".json",
  ".lock",
  ".md",
  ".ps1",
  ".rs",
  ".toml",
  ".ts",
  ".tsx",
  ".yml",
  ".yaml",
]);

const ignoreDirs = new Set([".git", ".opencode/node_modules", "dist", "node_modules", "playwright-report", "src-tauri/target"]);

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    const normalized = fullPath.replaceAll("\\", "/");
    if ([...ignoreDirs].some((ignored) => normalized === ignored || normalized.startsWith(`${ignored}/`))) continue;
    if (entry.isDirectory()) {
      yield* walk(fullPath);
    } else if (textExtensions.has(path.extname(entry.name))) {
      yield fullPath;
    }
  }
}

const staleProjectVersions = [];

if (previousVersion) {
  const escaped = previousVersion.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const previousPattern = new RegExp(`\\b[vV]?${escaped}\\b`, "g");
  for (const file of walk(".")) {
    const rel = file.replaceAll("\\", "/").replace(/^\.\//, "");
    if (rel === "package-lock.json" || rel === "src-tauri/Cargo.lock") continue;
    const content = fs.readFileSync(file, "utf8");
    for (const match of content.matchAll(previousPattern)) {
      staleProjectVersions.push(`${rel}: ${match[0]}`);
    }
  }
}

if (staleProjectVersions.length) {
  console.error("stale version references found:");
  for (const item of staleProjectVersions) console.error(item);
  process.exit(1);
}

console.log(previousVersion ? `version ok ${version}; no stale ${previousVersion}` : `version ok ${version}`);
