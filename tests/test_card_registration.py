"""Tests for the Lovelace JS module registrar (`JSModuleRegistration` shape).

Use this template when the integration extracts registration into its own
`card_registration.py` module that exposes a `JSModuleRegistration` class
(Ladestellen-style). For the inline `_async_register_one_card` in
`__init__.py` shape (Wiener-Linien-style), use `test_init_extras.py.template`
instead.

Covers all branches of `JSModuleRegistration` that the integration
lifecycle does not exercise on its own (yaml-mode skip, version
mismatch update, already-registered RuntimeError, unregister paths).
"""
from __future__ import annotations

from types import SimpleNamespace
from typing import Any
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from homeassistant.core import HomeAssistant

from custom_components.linz_linien_austria import card_registration
from custom_components.linz_linien_austria.card_registration import (
    JSMODULES,
    URL_BASE,
    JSModuleRegistration,
)
from custom_components.linz_linien_austria.const import CARD_VERSION


def _make_lovelace(
    *,
    resource_mode: str = "storage",
    loaded: bool = True,
    items: list[dict[str, Any]] | None = None,
) -> SimpleNamespace:
    """Build a fake Lovelace data object with async resource methods."""
    resources = SimpleNamespace(
        loaded=loaded,
        async_items=MagicMock(return_value=items or []),
        async_create_item=AsyncMock(),
        async_update_item=AsyncMock(),
        async_delete_item=AsyncMock(),
    )
    return SimpleNamespace(resource_mode=resource_mode, resources=resources)


def _install_lovelace(hass: HomeAssistant, lovelace: Any) -> None:
    hass.data["lovelace"] = lovelace


# ---------------------------------------------------------------------------
# init
# ---------------------------------------------------------------------------


async def test_init_pulls_lovelace_from_hass_data(hass: HomeAssistant) -> None:
    """Constructor reads `hass.data['lovelace']`."""
    lovelace = _make_lovelace()
    _install_lovelace(hass, lovelace)
    reg = JSModuleRegistration(hass)
    assert reg.lovelace is lovelace


async def test_init_handles_missing_lovelace(hass: HomeAssistant) -> None:
    """No `lovelace` key in `hass.data` is permitted (lovelace not yet loaded)."""
    hass.data.pop("lovelace", None)
    reg = JSModuleRegistration(hass)
    assert reg.lovelace is None


# ---------------------------------------------------------------------------
# async_register — early-exit when http is unavailable
# ---------------------------------------------------------------------------


async def test_async_register_skips_when_http_missing(
    hass: HomeAssistant, caplog: pytest.LogCaptureFixture
) -> None:
    """In test envs `http` may not be loaded — must not crash."""
    _install_lovelace(hass, _make_lovelace())
    reg = JSModuleRegistration(hass)
    # Force the http guard to trigger.
    object.__setattr__(hass, "http", None)
    await reg.async_register()  # must not raise


async def test_async_register_full_flow_in_storage_mode(
    hass: HomeAssistant,
) -> None:
    """End-to-end happy path: storage mode → static path + module registered."""
    lovelace = _make_lovelace(resource_mode="storage", loaded=True, items=[])
    _install_lovelace(hass, lovelace)
    reg = JSModuleRegistration(hass)

    fake_http = SimpleNamespace(async_register_static_paths=AsyncMock())
    object.__setattr__(hass, "http", fake_http)

    await reg.async_register()

    fake_http.async_register_static_paths.assert_awaited_once()
    lovelace.resources.async_create_item.assert_awaited_once()


async def test_async_register_yaml_mode_skips_resource_wait(
    hass: HomeAssistant,
) -> None:
    """YAML mode → static path is registered but resources are not touched."""
    lovelace = _make_lovelace(resource_mode="yaml", items=[])
    _install_lovelace(hass, lovelace)
    reg = JSModuleRegistration(hass)

    fake_http = SimpleNamespace(async_register_static_paths=AsyncMock())
    object.__setattr__(hass, "http", fake_http)

    await reg.async_register()

    fake_http.async_register_static_paths.assert_awaited_once()
    lovelace.resources.async_create_item.assert_not_awaited()


# ---------------------------------------------------------------------------
# _async_register_path
# ---------------------------------------------------------------------------


async def test_register_path_registers_static_path(hass: HomeAssistant) -> None:
    """Happy path: the `www/` directory is registered under URL_BASE."""
    _install_lovelace(hass, _make_lovelace())
    reg = JSModuleRegistration(hass)

    fake_http = SimpleNamespace(async_register_static_paths=AsyncMock())
    object.__setattr__(hass, "http", fake_http)

    await reg._async_register_path()

    fake_http.async_register_static_paths.assert_awaited_once()
    config = fake_http.async_register_static_paths.call_args.args[0][0]
    assert config.url_path == URL_BASE
    assert config.path.endswith("/www")


async def test_register_path_swallows_runtime_error(
    hass: HomeAssistant, caplog: pytest.LogCaptureFixture
) -> None:
    """Re-registering the same path raises RuntimeError; must be swallowed."""
    _install_lovelace(hass, _make_lovelace())
    reg = JSModuleRegistration(hass)

    fake_http = SimpleNamespace(
        async_register_static_paths=AsyncMock(side_effect=RuntimeError("dup"))
    )
    object.__setattr__(hass, "http", fake_http)

    await reg._async_register_path()  # must not raise


# ---------------------------------------------------------------------------
# _async_wait_for_lovelace_resources
# ---------------------------------------------------------------------------


async def test_wait_when_resources_loaded_registers_modules(
    hass: HomeAssistant,
) -> None:
    """When resources are already loaded, modules are registered immediately."""
    lovelace = _make_lovelace(loaded=True, items=[])
    _install_lovelace(hass, lovelace)
    reg = JSModuleRegistration(hass)

    await reg._async_wait_for_lovelace_resources()
    lovelace.resources.async_create_item.assert_awaited_once()


async def test_wait_when_resources_not_loaded_schedules_retry(
    hass: HomeAssistant,
) -> None:
    """When resources aren't loaded, must schedule a retry via async_call_later."""
    lovelace = _make_lovelace(loaded=False)
    _install_lovelace(hass, lovelace)
    reg = JSModuleRegistration(hass)

    with patch(
        "custom_components.linz_linien_austria.card_registration.async_call_later",
    ) as scheduler:
        await reg._async_wait_for_lovelace_resources()
        scheduler.assert_called_once()
        # delay arg, then the callable
        assert (
            scheduler.call_args.args[1]
            == card_registration._LOVELACE_LOAD_RETRY_INTERVAL_S
        )


async def test_wait_caps_retries_and_warns(
    hass: HomeAssistant, caplog: pytest.LogCaptureFixture
) -> None:
    """Retry loop must stop after _LOVELACE_LOAD_RETRY_MAX ticks and warn once.

    The scheduler in production hands the callback to HA's event loop; in
    tests we drive it synchronously by capturing the callable from the
    `async_call_later` mock and re-invoking it until the cap is hit.
    """
    lovelace = _make_lovelace(loaded=False)
    _install_lovelace(hass, lovelace)
    reg = JSModuleRegistration(hass)

    with patch(
        "custom_components.linz_linien_austria.card_registration.async_call_later",
    ) as scheduler:
        await reg._async_wait_for_lovelace_resources()
        # Iterate the captured callback until the cap is hit. The initial
        # call_later (attempts=1) plus N-1 callback invocations bring the
        # in-flight `attempts` counter to N. The N-th invocation reaches
        # the cap and returns WITHOUT scheduling another retry, so the
        # total scheduler-call count plateaus at MAX-1.
        for _ in range(card_registration._LOVELACE_LOAD_RETRY_MAX - 1):
            cb = scheduler.call_args.args[2]
            await cb(0)

    assert (
        scheduler.call_count == card_registration._LOVELACE_LOAD_RETRY_MAX - 1
    )
    assert any(
        "never reported `loaded`" in rec.message for rec in caplog.records
    )


# ---------------------------------------------------------------------------
# _async_register_modules — three branches
# ---------------------------------------------------------------------------


async def test_register_modules_creates_new(hass: HomeAssistant) -> None:
    """No existing resources → create a fresh one with the current version."""
    lovelace = _make_lovelace(items=[])
    _install_lovelace(hass, lovelace)
    reg = JSModuleRegistration(hass)

    await reg._async_register_modules()

    lovelace.resources.async_create_item.assert_awaited_once()
    payload = lovelace.resources.async_create_item.call_args.args[0]
    assert payload["res_type"] == "module"
    expected_url = f"{URL_BASE}/{JSMODULES[0]['filename']}?v={CARD_VERSION}"
    assert payload["url"] == expected_url
    lovelace.resources.async_update_item.assert_not_awaited()


async def test_register_modules_updates_when_version_changed(
    hass: HomeAssistant,
) -> None:
    """Existing resource at the same path with an older version → update."""
    stale_url = f"{URL_BASE}/{JSMODULES[0]['filename']}?v=0.0.1-old"
    lovelace = _make_lovelace(items=[{"id": "res-1", "url": stale_url}])
    _install_lovelace(hass, lovelace)
    reg = JSModuleRegistration(hass)

    await reg._async_register_modules()

    lovelace.resources.async_update_item.assert_awaited_once()
    item_id, payload = lovelace.resources.async_update_item.call_args.args
    assert item_id == "res-1"
    assert payload["url"].endswith(f"?v={CARD_VERSION}")
    lovelace.resources.async_create_item.assert_not_awaited()


async def test_register_modules_noop_when_version_matches(
    hass: HomeAssistant,
) -> None:
    """Existing resource at the same path with the same version → no calls."""
    current_url = f"{URL_BASE}/{JSMODULES[0]['filename']}?v={CARD_VERSION}"
    lovelace = _make_lovelace(items=[{"id": "res-1", "url": current_url}])
    _install_lovelace(hass, lovelace)
    reg = JSModuleRegistration(hass)

    await reg._async_register_modules()

    lovelace.resources.async_create_item.assert_not_awaited()
    lovelace.resources.async_update_item.assert_not_awaited()


async def test_register_modules_ignores_resources_outside_url_base(
    hass: HomeAssistant,
) -> None:
    """Resources owned by other integrations must be left alone."""
    other_url = "/other_integration/some-card.js?v=9.9"
    lovelace = _make_lovelace(items=[{"id": "other-1", "url": other_url}])
    _install_lovelace(hass, lovelace)
    reg = JSModuleRegistration(hass)

    await reg._async_register_modules()

    lovelace.resources.async_create_item.assert_awaited_once()  # ours, fresh
    lovelace.resources.async_update_item.assert_not_awaited()


# ---------------------------------------------------------------------------
# URL helpers
# ---------------------------------------------------------------------------


def test_get_path_strips_query() -> None:
    reg = JSModuleRegistration(hass=MagicMock(data={}))
    assert reg._get_path("/foo/bar.js?v=1.2.3") == "/foo/bar.js"
    assert reg._get_path("/foo/bar.js") == "/foo/bar.js"


def test_get_version_parses_v_param() -> None:
    reg = JSModuleRegistration(hass=MagicMock(data={}))
    assert reg._get_version("/foo/bar.js?v=1.2.3") == "1.2.3"
    assert reg._get_version("/foo/bar.js") == "0"
    # Query string present but not v= → fall back to 0.
    assert reg._get_version("/foo/bar.js?other=x") == "0"


# ---------------------------------------------------------------------------
# async_unregister
# ---------------------------------------------------------------------------


async def test_unregister_skips_when_no_lovelace(hass: HomeAssistant) -> None:
    """Lovelace not loaded → unregister is a no-op."""
    hass.data.pop("lovelace", None)
    reg = JSModuleRegistration(hass)
    await reg.async_unregister()  # must not raise


async def test_unregister_skips_yaml_mode(hass: HomeAssistant) -> None:
    """YAML mode owns its resources via files; we must not touch them."""
    lovelace = _make_lovelace(
        resource_mode="yaml",
        items=[{"id": "x", "url": URL_BASE + "/foo.js"}],
    )
    _install_lovelace(hass, lovelace)
    reg = JSModuleRegistration(hass)

    await reg.async_unregister()
    lovelace.resources.async_delete_item.assert_not_awaited()


async def test_unregister_storage_mode_deletes_owned_resources(
    hass: HomeAssistant,
) -> None:
    """Storage mode → delete every resource whose URL starts with our card URL."""
    card_url = f"{URL_BASE}/{JSMODULES[0]['filename']}"
    lovelace = _make_lovelace(
        items=[
            {"id": "ours-1", "url": f"{card_url}?v=1.0"},
            {"id": "ours-2", "url": f"{card_url}?v=2.0"},  # stale duplicate
            {"id": "other", "url": "/other/foo.js"},
        ]
    )
    _install_lovelace(hass, lovelace)
    reg = JSModuleRegistration(hass)

    await reg.async_unregister()

    deleted_ids = sorted(
        c.args[0] for c in lovelace.resources.async_delete_item.call_args_list
    )
    assert deleted_ids == ["ours-1", "ours-2"]
