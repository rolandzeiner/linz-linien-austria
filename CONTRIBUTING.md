# Contributing

## Dev setup

Uses [`uv`](https://docs.astral.sh/uv/) — the same tool CI installs deps with.

1. `uv venv --python 3.14 && source .venv/bin/activate`
2. `uv pip install -r requirements_test.txt pre-commit`
3. `pre-commit install`
4. `npm ci && npm run build` (Lovelace card bundle)

## Branching & releases

- Work on `dev`. PRs target `dev`.
- Releases are tagged from `main` after merging `dev → main`.
- Conventional commits (`feat:`, `fix:`, `chore:`, `docs:`).

## Card-version sync

`manifest.json` `version` is the single source of truth. `INTEGRATION_VERSION` reads it at import time and `const.py` aliases `CARD_VERSION = INTEGRATION_VERSION`, so the Python side propagates automatically. The TS bundle does not — bump `src/const.ts CARD_VERSION` to match in the same commit and run `npm run build`. `tests/test_card_version.py` locks all three together.

## Tooling & config

- `pyproject.toml` — source of truth for ruff (target-version, line-length), mypy (strict, ignore_missing_imports, files) and coverage config. Change rules here, not in CI flags.
  - **`target-version` tracks the oldest Python we support, never the one CI runs.** `hacs.json` promises HA ≥ 2025.1.0, which runs on Python 3.12, so `target-version = "py312"` — even though the venv and CI are on 3.14. Pointing it at the CI interpreter lets ruff rewrite code into syntax our users cannot parse and then stay silent about it; that is how wiener-linien-austria v1.7.1 shipped a SyntaxError. The `compile-floor-python` CI job byte-compiles the shipped package on 3.12 as an independent backstop. Raise all three together or not at all.
- `pytest.ini` — pytest config and the **`--cov-fail-under=90` coverage gate**. `pytest tests/` automatically runs with coverage; CI fails fast if a new commit drops coverage below the gate.
- `ATTRIBUTION` — canonical data-source statement and licence terms; matches the `attribution` attribute every sensor emits. Update when the upstream API or licence wording changes (and keep `const.ATTRIBUTION` in sync).

## Module map (Python side)

- `api.py` — EFA HTTP client. JSON-only, single source of truth for `_common_headers` (which delegates to `http.py::base_request_headers`).
- `coordinator.py` — `DataUpdateCoordinator` subclass with realtime-aware sort, exponential backoff on consecutive failures, and per-stop alerts slice.
- `alerts.py` — XML_ADDINFO_REQUEST fetcher + 5-min domain-wide refresh task with refcounted lifecycle.
- `rate_limit.py` — lock-serialised 15 s domain-wide cooldown shared between the coordinator's departure polls and the alerts refresh.
- `http.py` — single source of truth for outbound headers (User-Agent, Accept, Accept-Encoding: gzip). Every new HTTP call site MUST go through `base_request_headers`.
- `card_registration.py` — Lovelace JS module + `?v=` cache-busting.
- `config_flow.py`, `sensor.py`, `diagnostics.py`, `__init__.py` — standard HA platform pieces.

## CI guards

- `validate-card` job runs a Perl-based grep that fails the build if any backtick appears inside a Lit `css\`...\`` or `html\`...\`` template body — those terminate the literal early and silently break the card. Use single quotes / double quotes / word descriptions in CSS comments.
- `tests/test_user_agent.py` parametrises every outbound call site and asserts both `User-Agent` and `Accept-Encoding: gzip`. Adding a new HTTP call? Add it to the parametrize table.

View per-file coverage locally:

```bash
pytest tests/ --cov-report=term-missing
```

## Local iteration against a live HA box

`./scripts/dev-push.sh` rsyncs to your dev container. See script header for prerequisites (SSH access to the box, sudo NOPASSWD for rsync). The script runs `npm run build` automatically before pushing so direct invocation is always safe; pass `--no-build` for Python-only iteration. `npm run build:push` chains build + dev-push (quiet) for tight card-iteration loops.

## Verification gate (must pass before pushing)

- `pytest tests/ -v`
- `mypy --strict --ignore-missing-imports custom_components/linz_linien_austria`
- `ruff check .`
- `ruff format --check .` (separate from `ruff check`, which never inspects formatting — CI runs both, so skipping this one turns the job red on style alone)
- `uv run --python 3.12 --no-project python -m compileall -q custom_components/linz_linien_austria` (mirrors the `compile-floor-python` CI job; the local venv is on 3.14, so this is the only local check that would catch syntax our oldest supported users cannot parse — see `target-version` above)
- `npx tsc --noEmit` (Rollup's TS plugin is more permissive than tsc strict; this surfaces TS regressions before the bundle hides them)
- `npm run build` (rebuilds the card bundle from `src/`; `npm run dev` for watch mode)
- `node -c custom_components/linz_linien_austria/www/linz-linien-austria-card.js`

## Fair-use note

Please don't drop the `User-Agent` constant or the `Accept-Encoding: gzip` header on outbound requests, and please don't lower the `MIN_POLL_SECONDS` or `DOMAIN_COOLDOWN_SECONDS` floors without thinking carefully about the multi-stop install case. The conservative defaults are what keep this integration unobtrusive on LINZ AG's side.
