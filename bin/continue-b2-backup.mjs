#!/usr/bin/env node
// Thin entry point: all logic lives in @backblaze-labs/agent-backup-core.
// Usage:
//   continue-b2-backup            run as a daemon (auto-restore + back up now + scheduled)
//   continue-b2-backup --once     run a single backup and exit (for cron/CI)
//   continue-b2-backup --install  install an OS service that runs the daemon at login
//   continue-b2-backup --help     show usage
// Config (B2 credentials) comes from env vars or ~/.config/continue-b2-backup/config.json.
import { runCli } from "@backblaze-labs/agent-backup-core";
import { continueAdapter } from "../dist/index.mjs";

runCli(continueAdapter).catch((err) => {
  console.error(`continue-b2-backup: ${err?.message ?? err}`);
  process.exit(1);
});
