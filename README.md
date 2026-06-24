# continue-b2-backup

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

## License

MIT
