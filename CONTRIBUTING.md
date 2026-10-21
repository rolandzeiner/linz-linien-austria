# Contributing

## Dev setup

Uses [`uv`](https://docs.astral.sh/uv/) — the same tool CI installs deps with.

1. `uv venv --python 3.14 && source .venv/bin/activate`
2. `uv pip install -r requirements_test.txt pre-commit`
3. `pre-commit install` (runs ruff, mypy and `vp check` on every commit)
4. `npm ci && npm run build` (Lovelace card bundle; Node ^24.11 or 26+, npm 11+)

## Branching & releases

- Work on `dev`. PRs target `dev`.
- Releases are tagged from `main` after merging `dev → main`.
- Conventional commits (`feat:`, `fix:`, `chore:`, `docs:`).

## Card-version sync

`manifest.json` `version` is the single source of truth. `INTEGRATION_VERSION` reads it at import time and `const.py` aliases `CARD_VERSION = INTEGRATION_VERSION`, so the Python side propagates automatically. The TS bundle does not — bump `src/const.ts CARD_VERSION` to match in the same commit and run `npm run build`. `tests/test_card_version.py` locks all three together.

## Tooling & config

- `vite.config.ts` — the whole card toolchain, run through [Vite+](https://viteplus.dev/) (`vp`): `vp build` (Vite library mode on Rolldown), `vp test` (Vitest), and `vp check` (Oxfmt + Oxlint + type-check). The only card `devDependency` is `vite-plus`. Vitest, Rolldown and the type-checker all ship inside it, and `typescript` is not installed. Five things there fail silently if you change them:
  - The banner must be a **legal** comment — `/*! ... */` — with `comments: { legal: true }`. A `//` banner is stripped by the minifier and nothing tells you; only the built file's first bytes do.
  - **`minify` lives on `rolldownOptions.output`, with `dropConsole: false`.** Vite's library mode skips whitespace minification for ES output, so `build.minify` alone ships the bundle with its whitespace left in. `dropConsole` is all-or-nothing, and most `console.*` calls here sit in `catch` blocks where dropping them turns a caught error into a silent one.
  - **Dev vs prod comes from `--mode development`** (`npm run dev`). A plain `vp build` is production: minified, no sourcemap.
  - **`fmt.embeddedLanguageFormatting` stays `"off"`.** Otherwise Oxfmt reformats Lit `html`/`css` templates and changes the whitespace inside rendered elements, which is a DOM change, not a style change.
  - **Decorators are not configured.** Rolldown reads `tsconfig.json` itself and enables Lit's legacy decorators from it. If that ever regresses, class fields overwrite Lit's accessors and reactivity dies while the build stays green — diff a built bundle's Lit reactive-property list to catch it.
- **The `vite` override in `package.json` must name the same version as `vite-plus`.** It keeps npm from installing upstream Vite next to Vite+'s core. Dependabot bumps `vite-plus` but not the override, and `src/toolchain.test.ts` fails until you bump both.
- **The build does not type-check.** `vp check` is the only thing between a type error and a green build, which is why the gate runs it as its own step.
- `pyproject.toml` — source of truth for ruff (target-version, line-length), mypy (strict, ignore_missing_imports, files) and coverage config. Change rules here, not in CI flags.
  - **`target-version` tracks the oldest Python we support, never the one CI runs.** `hacs.json` promises HA ≥ 2025.1.0, which runs on Python 3.12, so `target-version = "py312"` — even though the venv and CI are on 3.14. Pointing it at the CI interpreter lets ruff rewrite code into syntax our users cannot parse and then stay silent about it; that is how wiener-linien-austria v1.7.1 shipped a SyntaxError. The `compile-floor-python` CI job byte-compiles the shipped package on 3.12 as an independent backstop. Raise all three together or not at all.
- `pytest.ini` — pytest config and the **`--cov-fail-under=90` coverage gate**. `pytest tests/` automatically runs with coverage; CI fails fast if a new commit drops coverage below the gate.
- `ATTRIBUTION` — canonical data-source statement and licence terms; matches the `attribution` attribute every sensor emits. Update when the upstream API or licence wording changes (and keep `const.ATTRIBUTION` in sync).

## Card tests

The card tests live next to the code as `src/**/*.test.ts` and run in plain node through `vp test` (`npm test`). `src/helpers.test.ts` covers the pure helpers: config defaults, translation lookup, the mode-of-transport tables and the accent-text contrast clamp. The render methods have no tests yet; a DOM suite would need `happy-dom`, as in the sibling repos.

## Module map (Python side)

- `api.py` — EFA HTTP transport and request parameters. JSON-only; sends `const.BASE_REQUEST_HEADERS`.
- `parser.py` — pure parsing of the EFA payloads into the shapes the coordinator and the card consume. No network, so it is tested against captured fixtures.
- `text.py` — the HTML decoder shared by the alert and departure-hint parsers.
- `coordinator.py` — `DataUpdateCoordinator` subclass with realtime-aware sort, exponential backoff on consecutive failures, and per-stop alerts slice.
- `alerts.py` — XML_ADDINFO_REQUEST fetcher + 5-min domain-wide refresh task with refcounted lifecycle.
- `rate_limit.py` — lock-serialised 15 s domain-wide cooldown shared between the coordinator's departure polls and the alerts refresh.
- `const.py` — `BASE_REQUEST_HEADERS` is the single source of truth for outbound headers (User-Agent, Accept, Accept-Encoding: gzip). Every new HTTP call site MUST send it.
- `migration.py` — the v1 → v2 line-filter remap, shared by `async_migrate_entry` and the coordinator's self-heal.
- `card_registration.py` — Lovelace JS module + `?v=` cache-busting.
- `config_flow.py`, `sensor.py`, `diagnostics.py`, `__init__.py` — standard HA platform pieces.

## CI guards

- A backtick inside a Lit `css` or `html` template, comments included, ends the template early, and the card then fails at load while the build stays green. `vp check` catches it.
- `tests/test_user_agent.py` parametrises every outbound call site and asserts both `User-Agent` and `Accept-Encoding: gzip`. Adding a new HTTP call? Add it to the parametrize table.

View per-file coverage locally:

```bash
pytest tests/ --cov-report=term-missing
```

## Local iteration against a live HA box

`./scripts/dev-push.sh` rsyncs to your dev container over SSH; it needs SSH access to the box and nothing else. The script runs `npm run build` automatically before pushing so direct invocation is always safe; pass `--no-build` for Python-only iteration. `npm run build:push` chains build + dev-push (quiet) for tight card-iteration loops.

## Verification gate (must pass before pushing)

- `pytest tests/ -v`
- `mypy --strict --ignore-missing-imports custom_components/linz_linien_austria`
- `ruff check .`
- `ruff format --check .` (separate from `ruff check`, which never inspects formatting — CI runs both, so skipping this one turns the job red on style alone)
- `uv run --python 3.12 --no-project python -m compileall -q custom_components/linz_linien_austria` (mirrors the `compile-floor-python` CI job; the local venv is on 3.14, so this is the only local check that would catch syntax our oldest supported users cannot parse — see `target-version` above)
  - **Keep `--no-project`.** Without it `uv` treats the repo root as a workspace, finds no `requires-python` (there is no `[project]` table in `pyproject.toml`), and rebuilds `.venv` at the version you asked for — silently destroying your 3.14 environment and every tool in it. Recover with `uv venv --clear --python 3.14 && uv pip install -r requirements_test.txt`.
- `npx vp check` (format, lint and type-check; the build does not type-check at all)
- `npm test` (card tests, `vp test run`)
- `npm run build` (rebuilds the card bundle from `src/`; `npm run dev` for watch mode)
- `node -c custom_components/linz_linien_austria/www/linz-linien-austria-card.js`

## Fair-use note

Please don't drop the `User-Agent` constant or the `Accept-Encoding: gzip` header on outbound requests, and please don't lower the `MIN_POLL_SECONDS` or `DOMAIN_COOLDOWN_SECONDS` floors without thinking carefully about the multi-stop install case. The conservative defaults are what keep this integration unobtrusive on LINZ AG's side.
