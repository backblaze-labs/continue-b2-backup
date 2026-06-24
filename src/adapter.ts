import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { BackupAdapter, BackupRoot } from "@backblaze-labs/agent-backup-core";

/**
 * Continue (continue.dev) keeps everything under a single global dir, `~/.continue`
 * (or `%USERPROFILE%\.continue`), overridable via `CONTINUE_GLOBAL_DIR`. The
 * crown jewel is `sessions/<id>.json` (chat history), which is stored only on the
 * machine and backed up nowhere by Continue itself.
 *
 * Verified against github.com/continuedev/continue (core/util/paths.ts,
 * core/util/history.ts) and docs.continue.dev.
 */
export function continueRoot(env: NodeJS.ProcessEnv): string {
  const override = env.CONTINUE_GLOBAL_DIR;
  if (override) return path.isAbsolute(override) ? override : path.resolve(process.cwd(), override);
  return path.join(os.homedir(), ".continue");
}

export const continueAdapter: BackupAdapter = {
  id: "continue",

  resolveRoots(env): BackupRoot[] {
    const dir = continueRoot(env);
    try {
      return fs.statSync(dir).isDirectory() ? [{ label: "home", dir }] : [];
    } catch {
      return [];
    }
  },

  // Chat sessions + user config (the irreplaceable, non-regenerable state).
  include: [
    /^home\/sessions\/[^/]+\.json$/, // per-session history + sessions.json index
    /^home\/config\.(yaml|json|ts)$/, // current + legacy config (may hold inline keys)
    /^home\/prompts\//, // global prompt files
    /^home\/(agents|assistants)\//, // user-authored assistant definitions
  ],

  // Large, regenerable, and telemetry data — and, conveniently, both SQLite DBs
  // (index/index.sqlite, dev_data/devdata.sqlite) live inside these excluded
  // trees, so we never have to snapshot a live WAL database.
  exclude: [
    /^home\/index\//, // codebase index: lancedb embeddings + index.sqlite (largest dir)
    /^home\/dev_data\//, // usage telemetry + devdata.sqlite
    /^home\/logs\//,
    /^home\/\.utils\//,
    /(^|\/)\.DS_Store$/,
    /\.tmp$/,
    /\.lock$/,
  ],

  // Nothing to snapshot — the only SQLite DBs are under excluded dirs.
  sqlite: [],

  // `~/.continue/.env` is the recommended plaintext secrets store; exclude it
  // (config.yaml itself is included — encrypted — for a working restore).
  secretExclude: [/^home\/\.env$/],
};
