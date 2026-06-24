import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { shouldInclude } from "@backblaze-labs/agent-backup-core";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { continueAdapter, continueRoot } from "./adapter.js";

describe("continueRoot", () => {
  it("defaults to ~/.continue and honors CONTINUE_GLOBAL_DIR", () => {
    expect(continueRoot({} as NodeJS.ProcessEnv)).toBe(path.join(os.homedir(), ".continue"));
    expect(continueRoot({ CONTINUE_GLOBAL_DIR: "/custom/cont" } as NodeJS.ProcessEnv)).toBe("/custom/cont");
  });
});

describe("continueAdapter.resolveRoots", () => {
  let dir: string;
  beforeEach(async () => {
    dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "cont-"));
  });
  afterEach(async () => {
    await fs.promises.rm(dir, { recursive: true, force: true });
  });

  it("returns the global dir when it exists", () => {
    expect(continueAdapter.resolveRoots({ CONTINUE_GLOBAL_DIR: dir } as NodeJS.ProcessEnv)).toEqual([
      { label: "home", dir },
    ]);
  });

  it("returns nothing when the dir is absent", () => {
    expect(
      continueAdapter.resolveRoots({ CONTINUE_GLOBAL_DIR: path.join(dir, "nope") } as NodeJS.ProcessEnv),
    ).toEqual([]);
  });
});

describe("continueAdapter include/exclude patterns", () => {
  const patterns = {
    include: continueAdapter.include,
    exclude: continueAdapter.exclude,
    secretExclude: continueAdapter.secretExclude,
  };

  it("includes sessions and config", () => {
    for (const p of [
      "home/sessions/3f9a-uuid.json",
      "home/sessions/sessions.json",
      "home/config.yaml",
      "home/config.json",
      "home/prompts/my.prompt",
      "home/assistants/a.yaml",
      "home/agents/b.yaml",
    ]) {
      expect(shouldInclude(p, patterns)).toBe(true);
    }
  });

  it("excludes the large index, telemetry, and the .env secret", () => {
    for (const p of [
      "home/index/lancedb/data.lance",
      "home/index/index.sqlite",
      "home/dev_data/devdata.sqlite",
      "home/dev_data/events.jsonl",
      "home/logs/core.log",
      "home/.utils/x",
      "home/.env",
    ]) {
      expect(shouldInclude(p, patterns)).toBe(false);
    }
  });
});
