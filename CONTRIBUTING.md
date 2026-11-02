# Contributing to Linz Linien Austria

Thanks for taking a look. This repo is a Home Assistant integration with a Lovelace card. Everything you need to work on it is on this page, and the gate in *Verification gate* has to pass before a change lands.

## Quick start

```bash
git clone https://github.com/rolandzeiner/linz-linien-austria.git
cd linz-linien-austria
uv venv --python 3.14 && source .venv/bin/activate
uv pip install -r requirements_test.txt pre-commit
pre-commit install
npm ci && npm run build
```

Before a PR, run the gate in *Verification gate*. It is what CI runs, so failing locally only costs you a push.

## Branching and releases

- Work on `dev`; PRs target `dev`. Nothing is committed or force-pushed to `main`.
- For anything bigger than a fix, open an issue first so the shape is agreed before the code is written.
- Conventional commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`. A subject line, then bullets that say what changed and why.
- The built bundle is committed and travels with the `src/` change that produced it: users install through the Marketplace and never run `npm`, and CI fails when the committed bundle differs from a fresh build by a byte.
- Releases are the maintainer's: a `dev → main` PR, squash-merged, then a tag from `main`. Publishing the release runs `release.yml`, which attaches `linz_linien_austria.zip`, a flat archive of `custom_components/linz_linien_austria/`. `hacs.json` sets `zip_release`, so the Marketplace downloads that file, and a release without it can't be installed. If the job fails, `gh workflow run release.yml -f tag=vX.Y.Z` re-runs it against the existing tag.
- Contributions are accepted under the repo's MIT licence.

## Python environment

- The project uses [`uv`](https://docs.astral.sh/uv/) for Python environments, the same tool CI installs with (`astral-sh/setup-uv` and `uv pip install --system`), so a gate that passes locally resolves what CI resolves. Plain `python -m venv` and `pip` work too.
- `3.14` is the CI interpreter and what `pytest-homeassistant-custom-component` requires. It is deliberately not the support floor; see *Two Python versions*.
- `pre-commit install` runs ruff, ruff-format, mypy and `vp check` on every commit, plus the whitespace hooks, from which the built bundle is excluded (see *Card toolchain*).
- A venv built months ago drifts from `requirements_test.txt`. Re-run `uv pip install -U -r requirements_test.txt` after a pin bump and whenever you come back to the repo; the `-U` is what moves a floating range such as PHACC's.
- `requirements_test.txt` carries its own rules in its header comment: PHACC governs the test stack, and nothing it pins is declared again.
- `custom_components/linz_linien_austria/_dev_fixture.py` is gitignored and the `no-dev-fixture` CI job fails if it ever lands. It injects synthetic data for local card work.

## Two Python versions

Every change has to respect both, and conflating them has shipped a broken release in this portfolio.

| Axis | Version | Where it is declared |
|---|---|---|
| **Runtime**: what we develop and test on | 3.14 | `validate.yml` `tests` job, your local venv |
| **Floor**: the oldest Python we must still run on | 3.12 | `pyproject.toml` `[tool.ruff] target-version`, the `compile-floor-python` CI job |

The floor is whatever `hacs.json`'s `homeassistant` value requires. HA 2025.1.0 declares `REQUIRED_PYTHON_VER = (3, 12, …)`, which you can check rather than remember:

```bash
gh api "repos/home-assistant/core/contents/homeassistant/const.py?ref=2025.1.0" \
  --jq .content | base64 -d | grep REQUIRED_PYTHON_VER
```

Setting `target-version` to the CI interpreter lets `ruff format` emit syntax the floor cannot parse and then stay silent about it; that is how a sibling once shipped a `SyntaxError` with green CI, because every check ran on the newer interpreter. Raise the floor only by changing all three declarations in one commit, plus the README's requirement line and badge.

## Card toolchain

The card lives in `src/` and builds to `custom_components/linz_linien_austria/www/linz-linien-austria-card.js`. Its whole toolchain runs through [Vite+](https://viteplus.dev/) (`vp`), configured in `vite.config.ts`: `vp build` (Vite library mode on Rolldown), `vp test` (Vitest) and `vp check` (Oxfmt, Oxlint and the type-check). The only card `devDependencies` are `vite-plus` and `happy-dom`; Vitest, Rolldown and the type-checker ship inside `vite-plus`, and `typescript` is not installed. `npx vp` runs the copy in `node_modules`; a global `vp` works too.

| Command | What it does |
|---|---|
| `npm run dev` | Watches `src/` and rebuilds the bundle on save, with a sourcemap (`--mode development`). |
| `npm run build` | Production build into `www/`. |
| `npm test` | `vp test run`: the card suites. |
| `npm run check` | `vp check`: Oxfmt, Oxlint and the type-check. `npx vp check --fix` rewrites what it can. |

Node 24.11 or newer (26 works too) and npm 11.

Commit the built bundle. End users install through the Marketplace and never run `npm`, so `custom_components/linz_linien_austria/www/linz-linien-austria-card.js` is tracked. CI asserts the committed bundle matches a fresh build byte for byte; a stale bundle is the infinite reload-banner bug. A dev build writes a `.map` file next to it; it is gitignored.

Things in `vite.config.ts` that fail silently if you change them:

- The banner must be a **legal** comment, `/*! ... */`, with `comments: { legal: true }`. The minifier strips a `//` banner without a word; only the built file's first bytes show it.
- **`minify` lives on `rolldownOptions.output`, with `dropConsole: false`.** Vite's library mode skips whitespace minification for ES output, so `build.minify` alone ships the bundle with its whitespace left in. `dropConsole` is all-or-nothing, and the `console.*` calls here sit in `catch` blocks, where dropping them turns a caught error into a silent one.
- **Dev vs prod comes from `--mode development`** (`npm run dev`). A plain `vp build` is production: minified, no sourcemap.
- **`fmt.embeddedLanguageFormatting` stays `"off"`.** Otherwise Oxfmt reformats Lit `html` and `css` templates and changes the whitespace inside rendered elements, which is a DOM change, not a style change.
- **Decorators are not configured.** Rolldown reads `tsconfig.json` itself and enables Lit's legacy decorators from it. If that ever regresses, class fields overwrite Lit's accessors and reactivity dies while the build stays green; `src/card.test.ts` reads `elementProperties` back off the card and catches it.
- **`lint.plugins` replaces Oxlint's defaults.** It names `typescript`, `unicorn` and `oxc` next to `vitest`; drop one and its rules stop running without a word. The `vitest/*` rules fail a committed `.only` or `.skip`, a test without an assertion, a duplicate title, an `expect` inside an `if` and a bare `toThrow()`, and `reportUnusedDisableDirectives` fails a disable comment that no longer suppresses anything.
- **`lint.options.denyWarnings: true`.** Without it `vp check` exits 0 on warnings, and CI and pre-commit let them through.
- **`codeSplitting: false`.** The card is one file; a dashboard resource can't load a second chunk the bundler decided on. The editor's dynamic import is inlined by it.
- **`emptyOutDir: false`.** Vite empties the output directory before each build by default, and `www/` sits inside the integration package.
- **No `json` option.** `src/localize/localize.ts` namespace-imports the language packs (`import * as de`), which needs Vite's default of named JSON exports; turning them off leaves every lookup empty.

The `vite` override in `package.json` must name the same version as `vite-plus`. It keeps npm from installing upstream Vite next to Vite+'s core. Dependabot bumps `vite-plus` but not the override, and `src/toolchain.test.ts` fails until both match. Bump with `npx --package=vite-plus@<new> vp migrate --no-interactive`, which moves both; `npm install vite-plus@<new>` fails with ERESOLVE.

The build does not type-check. `vp check` is the only thing between a type error and a green build, which is why the gate runs it as its own step. It also catches a backtick inside a Lit `css` or `html` template, comments included, which ends the template early and fails the card at load while the build stays green.

The bundle is excluded from the `end-of-file-fixer` and `trailing-whitespace` hooks: the bundler emits no trailing newline, and a hook that fixes the file after the build leaves it out of sync with a fresh one, which CI asserts byte for byte. `vp check` runs as a local hook on card source; don't switch to Vite+'s own `vp staged` hooks, which take over `core.hooksPath` and silently disable ruff and mypy.

`tsconfig.json`'s `lib` is the card's browser floor: ES2022. That is why a copy is sorted in place rather than with `toSorted()`, and why the ES2023 array methods stay out: the bundle doesn't polyfill them. Raising it is a browser requirement for users; say so in the README's Requirements section in the same commit.

### Trying it in Home Assistant

Copy `custom_components/linz_linien_austria/` into your Home Assistant config's `custom_components/` and restart Home Assistant. After a card change, copy the rebuilt `www/` file the same way and hard-refresh the browser: the resource URL only changes with the version.

## Verification gate

```bash
# Python
pytest tests/ -v
mypy --strict --ignore-missing-imports custom_components/linz_linien_austria
ruff check .
ruff format --check .                     # separate: `ruff check` never inspects formatting

# The oldest Python we support, derived from pyproject.toml, never hardcoded
FLOOR=$(sed -n 's/^target-version = "py3\([0-9]*\)"/3.\1/p' pyproject.toml)
uv run --python "$FLOOR" --no-project python -m compileall -q custom_components/linz_linien_austria

# Card
npx vp check                              # format, lint and the only type-check
npm test                                  # vp test run
npm run build                             # commit the rebuilt bundle with the src/ change
git diff --exit-code -- custom_components/linz_linien_austria/www/*.js
node -c custom_components/linz_linien_austria/www/linz-linien-austria-card.js
```

CI runs the same checks plus hassfest, HACS validation, `npm audit --omit=dev --audit-level=high`, a check that the committed bundle matches a fresh build, the dev-fixture guard and CodeQL. Failing locally only costs you a push.

Two of these are easy to skip and expensive to skip:

- **`ruff format --check`** is separate from `ruff check`, which never inspects formatting. Without it the formatter drifts silently until someone runs it.
- **`npx vp check`** is the only type-check anywhere. The build strips types without checking them, so a type error builds cleanly all the way to a shipped bundle.

**Keep `--no-project`** on the `compileall` line. Without it `uv` treats the repo root as a project, finds no `requires-python`, and rebuilds `.venv` on the floor interpreter, taking every tool in it along. Recover with `uv venv --clear --python 3.14 && uv pip install -r requirements_test.txt pre-commit`.

## Tests

**Python.** `pytest tests/` runs on `pytest-homeassistant-custom-component`. `tests/conftest.py` holds what a new test starts from: `make_response_cm()` stands in for an aiohttp response, and four autouse fixtures are on in every test (`auto_enable_custom_integrations`, `mock_aiohttp_session`, `_collapse_domain_cooldown` and `no_deprecated_ha_api`). `test_api_client.py` is an AST guard: it fails on any Home Assistant or `const.py` import in `api.py`, `parser.py` or `text.py`, and allows only `api → parser → text` between them. `test_user_agent.py` parametrises every outbound call site. `test_sensor.py` pins the sensor's attribute dict, which the card and user templates read: every key the card or the README promises is asserted there. The harness traps that cost an afternoon:

- The autouse `no_deprecated_ha_api` fixture fails any test that trips Home Assistant's deprecation channel, in both of HA's message shapes. A test that exercises a deprecated API on purpose takes `@pytest.mark.allow_deprecated_ha_api`; don't weaken the fixture.
- `_collapse_domain_cooldown` zeroes the 15 s domain cooldown, or a test that fetches twice sits it out in wall clock. A test of the cooldown arithmetic itself opts out with `@pytest.mark.real_domain_cooldown`.
- Unknown markers fail the run (`strict_markers`), a hung fixture fails after 15 s, and a `DeprecationWarning` reached through our own code is an error (`pytest.ini` says which libraries are exempt and how to add one).

**Card.** The suites sit beside the sources as `src/**/*.test.ts` and import from `vite-plus/test`, not `vitest`. `helpers.test.ts` runs in plain Node and covers the pure helpers: config defaults, translation lookup, the mode-of-transport tables and the accent-text contrast clamp on hex input. Anything that needs a DOM opts in with a `@vitest-environment happy-dom` line in the file's leading comment: `card.test.ts` mounts the card and the editor (registration, the decorator check, the config contract, the stub config, the empty states, the onward-stops panel, the language handling); `card-render.test.ts` snapshots the rendered markup across header, maps link, the line, direction and walk-time filters, hero, list cap, alerts and the empty states; `editor.test.ts` covers the editor's line chips, per-line rows and `ha-form` wiring (missing-entity warning, label fallback, saving without defaults); `color.test.ts` covers the colour input that needs CSSOM (`rgb()` and rejected values). `grid-cell.test.ts` checks the CSS text of the grid-cell rules, and `toolchain.test.ts` pins the `vite` override named in *Card toolchain*.

- The HA components the card and editor host (`ha-card`, `ha-form`, `ha-icon`, `ha-alert`) are deliberately never defined in tests. An undefined element is inert, Lit renders straight through it, and not stubbing them is what keeps this layer free of a test harness.
- happy-dom lays nothing out and does not convert named or `hsl()` colours to `rgb()` the way a browser does; `color.test.ts` says which inputs it can and cannot cover.

A change to what the card does comes with a test that fails without it.

### Snapshots

`card-render.test.ts` stores the rendered markup under `src/__snapshots__/`, with Lit's comment markers and the whitespace between tags stripped, so moving a template around does not show up as a change but attribute order and text do. After an intended change to what the card draws, regenerate with `npx vp test run -u`, review the diff, and commit the snapshot with the code.

### Coverage

`pytest.ini` enforces `--cov-fail-under=95` on the package total; `pytest tests/ --cov-report=term-missing` gives the per-file view. The card side has no gate and the provider is not a dependency. To see which branches a change left unexercised, install it for one run at the Vitest version Vite+ bundles:

```bash
V=$(npx vp toolchain vitest | grep -oE 'vitest@[0-9.]+' | head -1 | cut -d@ -f2)
npm i --no-save @vitest/coverage-v8@"$V"
npx vp test run --coverage --coverage.provider=v8 --coverage.reporter=text \
  '--coverage.include=src/**/*.ts' '--coverage.exclude=src/**/*.test.ts'
```

`--no-save` leaves `package.json` and the lockfile alone; the next `npm ci` removes the provider.

## Version sync

`manifest.json` `version` and `src/const.ts` `CARD_VERSION` must match byte for byte. `const.py` derives its value from the manifest at import, so the Python side needs no edit, and `tests/test_card_version.py` enforces the pair. The failure mode: the card's version check sees a mismatch, shows the reload banner, the reload re-serves the same bundle, and the banner comes back, for every user. A bump edits both files, rebuilds the bundle and commits all three together. Neither carries a `-beta` suffix: a pre-release has the final release's number and GitHub's pre-release flag. The README badge reads the latest release tag and needs no edit.

## Dependencies

| Package | Pin | Why |
|---|---|---|
| `ruff`, `mypy` | exact, `requirements_test.txt` | CI runs nightly; a floating linter turns the build red with no code change. The `rev:` in `.pre-commit-config.yaml` must match; check both tools when bumping either. |
| `pytest-homeassistant-custom-component` | `>=` floor with a `<` cap | it tracks HA core; pinning it would freeze the HA version tested against |
| `vite-plus` | exact, `package.json` | it decides what the committed bundle looks like; the `vite` override names the same version |
| `happy-dom` | exact | it decides what the DOM suites see; the siblings keep one version |
| `lit` | caret | maintained, keeps semver |

- **Dependabot's blind spots.** It bumps the `requirements_test.txt` pin and leaves the hook `rev` alone (it is told to); it bumps `vite-plus` and leaves the override alone. The toolchain test catches the second; nothing catches the first except reading both files.
- **Runtime vs dev.** What the build inlines into the bundle is a `dependency`; a build-time tool is a `devDependency` even though the build needs it. CI's `npm audit --omit=dev` only means something because of that split.
- **Adding a dependency.** The bundle loads on every dashboard, so a new runtime dependency is discussed in an issue first; today the card has `lit` alone. Its licence must be compatible with MIT and its notice must survive the build (`comments: { legal: true }` keeps the `@license` comments). Prefer vendoring a few constants with a provenance comment over depending on a package that exports thousands.

## Translations

Adding or changing a user-visible string means touching four files together: `strings.json`, `translations/en.json`, `translations/de.json`, and `icons.json` for a new entity. hassfest checks the keys in CI, and the German copy uses **du**, never **Sie**.

The card's strings live in `src/localize/languages/{de,en}.json`, with `card` and `editor` namespaces. `src/localize/localize.ts` resolves the language from the card config first, then Home Assistant's, then English; a region suffix is dropped (`de-AT` reads the German pack), a missing key falls back to English, and a key missing there renders as the key name so it shows in development. `helpers.test.ts` covers the lookup.

## Home Assistant conventions

- Every `UpdateFailed` and `ConfigEntryNotReady` carries `translation_domain`, `translation_key` and placeholders; never a bare string. `api.py`'s `EfaApiError` hierarchy maps onto them in the coordinator, and `outage.py` turns a sustained upstream failure into the `upstream_unavailable` Repairs issue.
- Icons live in `icons.json`; `_attr_icon = "mdi:…"` appears nowhere.
- Every platform module sets `PARALLEL_UPDATES = 0`.
- `api.py`, `parser.py` and `text.py` import nothing from Home Assistant or `const.py` (which pulls in HA for the User-Agent); the only imports between them run `api → parser → text`. `api.py` owns the URLs, the request headers and parameters and the `EfaApiError` hierarchy; callers pass in the session and the User-Agent. `tests/test_api_client.py` fails on any other import. Outside `api.py`, catch `EfaApiError`, never `aiohttp`'s errors.
- The `User-Agent` constant goes on every outbound call and no `Accept-Encoding` is pinned (aiohttp's own offer already gets gzip, and setting the header would narrow it). The `MIN_POLL_SECONDS` floor and the domain-wide `DOMAIN_COOLDOWN_SECONDS` are fair use towards LINZ AG: don't lower them without thinking about the multi-stop install. `tests/test_user_agent.py` parametrises every call site; a new HTTP call joins the table.
- `unique_id` formulas are frozen: changing one wipes every existing install.
- `ATTRIBUTION` in `const.py` is the data-source statement every entity emits and the card shows in its footer; the `ATTRIBUTION` file at the repo root carries the full wording. Update both if LINZ AG changes its licence wording.
- Diagnostics redact the fields in `TO_REDACT` in `diagnostics.py`, coordinates and the `Referer` header among them; the set only grows. Test payloads are synthetic: never a real id or credential, not even in a fixture.

## Where things are

| Module | Owns |
|---|---|
| `api.py` | Every request to LINZ AG's EFA: the URLs, headers, parameters and the `EfaApiError` hierarchy. HA-free. |
| `parser.py`, `text.py` | Pure parsing of the EFA payloads into the shapes the coordinator and the card consume, tested against captured fixtures; the HTML decoder the alert and departure-hint parsers share. |
| `coordinator.py` | The poll per stop, with realtime-aware sort, backoff on consecutive failures and the per-stop alerts slice. |
| `alerts.py`, `rate_limit.py` | The XML_ADDINFO notices and their refcounted 5-min domain-wide refresh; the lock-serialised domain cooldown shared by departure polls and the alerts refresh. |
| `outage.py` | Domain-wide outage detection: the `upstream_unavailable` Repairs issue after 10 minutes of upstream-side failures, cleared on the first good answer. |
| `migration.py` | The v1 → v2 line-filter remap, shared by `async_migrate_entry` and the coordinator's self-heal. |
| `sensor.py`, `config_flow.py`, `diagnostics.py`, `card_registration.py`, `__init__.py` | The next-departure sensor, the search → pick → settings flow with its options and reconfigure steps, diagnostics, the Lovelace resource registration for the bundle, and the domain setup. |
| `src/linz-linien-austria-card.ts`, `src/styles.ts` | The card and its styles. |
| `src/editor.ts` | The `ha-form` editor with its line chips and per-line rows. |
| `src/config.ts`, `src/departures.ts` | Config defaults and normalisation; countdowns, the line, direction and walk-time filters, the visible alerts and the maps link. |
| `src/mot.ts`, `src/color.ts` | The mode-of-transport icon and colour tables; the accent-text contrast clamp. |
| `src/shared-render.ts` | The version banner, the WebSocket version check and cache-wipe reload. |
| `src/localize/` | The card strings. |

### Adding a card option

Add the key to `LinzLinienAustriaCardConfig` in `src/types.ts`, its default to `DEFAULTS` in `src/config.ts`, and a field to the schema in `src/editor.ts`, with an `editor.*` label in both language packs. `tidyConfig` strips defaults before the editor saves, so a new default needs no migration; `card.test.ts` and the render snapshots pin what the card does with it.

## Style

- TypeScript strict; the `tsconfig.json` flags are not negotiable, and `vp check` reports no warnings (`denyWarnings`).
- Comments say why, not what; identifiers carry the what.
- The browser floor is ES2022: a copy is sorted in place rather than with `toSorted()`, and no other ES2023 built-in. Imports carry no extension; the bundler resolves them.
- Runtime dependencies are `lit` alone; adding one goes through *Dependencies*.
- Python: `pyproject.toml` is the source of truth for ruff, mypy and coverage; change rules there, never in CI flags or hook args. A rule that is noise in tests goes into `per-file-ignores`, not off.
- German copy uses du.

## Reporting issues

Open an issue with:

- your Home Assistant version and the Linz Linien Austria version
- the diagnostics download: **Settings → Devices & services → Linz Linien Austria** → ⋮ → **Download diagnostics**. Coordinates and the other fields in `TO_REDACT` are redacted before the file is written.
- the steps to reproduce, and the log lines from `custom_components.linz_linien_austria`

A security problem goes through **Report a vulnerability** under the repository's **Security** tab, not a public issue.
