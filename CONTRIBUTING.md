# Contributing

## Dev setup

1. `python -m venv .venv && source .venv/bin/activate`
2. `pip install -r requirements_test.txt && pip install pre-commit`
3. `pre-commit install`
4. `npm ci && npm run build` (Lovelace card bundle)

## Branching & releases

- Work on `dev`. PRs target `dev`.
- Releases are tagged from `main` after merging `dev → main`.
- Conventional commits (`feat:`, `fix:`, `chore:`, `docs:`).

## Card-version sync

`src/const.ts CARD_VERSION` and `custom_components/linz_linien_austria/const.py CARD_VERSION` must stay byte-identical — `tests/test_card_version.py` enforces it.

## Tooling & config

- `pyproject.toml` — source of truth for ruff (target-version, line-length), mypy (strict, ignore_missing_imports, files) and coverage config. Change rules here, not in CI flags.
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

`./scripts/dev-push.sh` rsyncs to your dev container. See script header for prerequisites (SSH access to the box, sudo NOPASSWD for rsync). The script runs `npm run build` automatically before pushing so direct invocation is always safe; pass `--no-build` for Python-only iteration.

## Verification gate (must pass before pushing)

- `pytest tests/ -v`
- `mypy --strict --ignore-missing-imports custom_components/linz_linien_austria`
- `ruff check .`
- `npm run build` (rebuilds the card bundle from `src/`)
- `node -c custom_components/linz_linien_austria/www/linz-linien-austria-card.js`

## Fair-use note

Please don't drop the `User-Agent` constant or the `Accept-Encoding: gzip` header on outbound requests, and please don't lower the `MIN_POLL_SECONDS` or `DOMAIN_COOLDOWN_SECONDS` floors without thinking carefully about the multi-stop install case. The conservative defaults are what keep this integration unobtrusive on LINZ AG's side.
