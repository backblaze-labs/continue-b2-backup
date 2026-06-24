# continue-b2-backup

**Encrypted, incremental, off-site backups for your AI coding agent — powered by [Backblaze B2 cloud storage](https://blze.ai/storage).**

Incremental, **encrypted** backup of your [Continue](https://continue.dev) chat sessions and config to [Backblaze B2](https://www.backblaze.com/cloud-storage).

Built on [`@backblaze-labs/agent-backup-core`](https://github.com/backblaze-labs/agent-backup-core).

## Why

Continue stores every chat session as JSON under `~/.continue/sessions/`, on your machine only — Continue Hub syncs *assistant definitions* down to the IDE but never backs up your local sessions. This mirrors them (and your config) to B2 on a schedule.

## Install & configure

```bash
npm install -g @backblaze-labs/continue-b2-backup
export B2_KEY_ID=004... B2_APPLICATION_KEY=K004... B2_BUCKET=my-continue-backups
export B2_ENCRYPTION_KEY="a long random passphrase"
```

Or `~/.config/continue-b2-backup/config.json`. Optional: `B2_REGION`, `B2_PREFIX`, `B2_SCHEDULE`, `B2_KEEP_SNAPSHOTS`, `CONTINUE_GLOBAL_DIR`.

## Run

```bash
continue-b2-backup            # daemon: auto-restore on first run, back up now, then on schedule
continue-b2-backup --once     # single backup then exit
continue-b2-backup --install  # install an OS service (launchd / systemd / Task Scheduler)
continue-b2-backup --help     # usage
```

## What gets backed up

Mirrors `~/.continue` (or `CONTINUE_GLOBAL_DIR`):

- **Included:** `sessions/*.json` (chat history — the main user data), `config.yaml`/`config.json`/`config.ts`, `prompts/`, and `assistants/`/`agents/` definitions.
- **Excluded:** `index/` (codebase embeddings + `index.sqlite` — large and regenerable), `dev_data/` (usage telemetry + `devdata.sqlite`), `logs/`, `.utils/`. Excluding these also means there's no live SQLite database to snapshot.

## Security

Set `B2_ENCRYPTION_KEY` (separate from your B2 credentials) — `config.yaml` can contain inline API keys and is included (encrypted) so restores work. `~/.continue/.env` (the recommended plaintext secrets store) is **excluded** and never shipped to B2.

## FAQ

**How do I get Backblaze B2 credentials?**

Create a free [Backblaze B2](https://blze.ai/storage) account, make a bucket, then create an Application Key. Use the keyID and applicationKey as `B2_KEY_ID` and `B2_APPLICATION_KEY`, and the bucket name as `B2_BUCKET`.

**Is my data encrypted?**

Yes — AES-256-GCM at rest. Set `B2_ENCRYPTION_KEY` to a long random passphrase. If you don't, it falls back to deriving a key from your B2 application key and prints a warning; setting a dedicated key means a leaked bucket credential can't decrypt your backups.

**How often does it back up, and can I change the schedule?**

By default it backs up immediately on start and then daily. Set `B2_SCHEDULE` to `daily`, `weekly`, or any cron expression.

**Does it re-upload everything each time?**

No. Backups are incremental — only files that changed since the last run are uploaded (SHA-256 diffing); unchanged files are carried forward server-side, so each snapshot still restores on its own.

**How do I restore Continue on a new machine?**

Install and run `continue-b2-backup` on the new machine. If local state is empty and snapshots exist in your bucket, it auto-restores the latest snapshot on first run. (You can also point it at a fresh bucket prefix to keep machines separate.)

**How many snapshots are kept?**

The 10 most recent by default; older ones are pruned. Change with `B2_KEEP_SNAPSHOTS`.

**How do I run it automatically in the background?**

`continue-b2-backup --install` writes an OS service (launchd on macOS, systemd user unit on Linux, Task Scheduler on Windows). Because a background service can't see your shell's exported variables, put your credentials in `~/.config/continue-b2-backup/config.json` (chmod 600) before activating it.

**Can I back up several machines to one bucket?**

Yes — give each machine a distinct `B2_PREFIX` so their snapshots don't mix.

**How do I check it's actually working?**

Run `continue-b2-backup --once` and watch the output; it logs what it uploaded and the snapshot id. You can also browse the bucket in the B2 web UI.

**How much does this cost?**

Only your Backblaze B2 storage, which is priced per GB-month — see [blze.ai/storage](https://blze.ai/storage). The tool itself is free and open source (MIT).

**Doesn't Continue Hub already back up my config?**

Continue Hub syncs *assistant definitions* down to your IDE; it does not back up your local chat sessions. Those live only in `~/.continue/sessions/` — which is exactly what this tool protects.

**Why is the `index/` directory excluded?**

It holds your codebase embeddings (LanceDB) and the index SQLite DB — large and fully regenerable. Excluding it keeps backups small and also avoids snapshotting a live database; `dev_data/` telemetry is excluded for the same reasons.

**Are my API keys backed up?**

`config.yaml` is included (encrypted) since it may contain inline keys and is needed to restore. The recommended `~/.continue/.env` secrets file is excluded and never shipped to B2.

## Learn more

- [Backblaze B2 Cloud Storage](https://blze.ai/storage) — affordable, S3-compatible object storage
- [agent-backup-core](https://github.com/backblaze-labs/agent-backup-core) — the shared backup engine powering this tool

## License

MIT
