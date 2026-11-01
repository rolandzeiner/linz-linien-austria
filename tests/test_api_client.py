"""Transport-layer tests for ``api._get_json``.

The coordinator's whole translated-``UpdateFailed`` matrix depends on
``_get_json`` mapping raw aiohttp failures onto the integration's own
``Efa*Error`` hierarchy. These tests pin that mapping directly, driving a
fake session so no real socket is opened.
"""

from __future__ import annotations

import ast
from pathlib import Path
from types import TracebackType
from typing import Any, Self
from unittest.mock import MagicMock

import aiohttp
import pytest

from custom_components.linz_linien_austria import api, parser, text
from custom_components.linz_linien_austria.api import (
    EfaApiError,
    EfaConnectionError,
    EfaHttpError,
    EfaPayloadError,
    EfaTimeoutError,
    _get_json,
)

# What each HA-free module may import from the package. Nothing else: const.py
# imports Home Assistant for its User-Agent, so `from .const import …` would
# pull HA back in through the side door.
_ALLOWED_RELATIVE: dict[str, set[str]] = {
    "api": {"parser"},
    "parser": {"text"},
    "text": set(),
}


@pytest.mark.parametrize("module", [api, parser, text], ids=lambda m: m.__name__)
def test_transport_modules_stay_free_of_home_assistant(module: Any) -> None:
    """api.py, parser.py and text.py import no Home Assistant, no const.py."""
    name = module.__name__.rsplit(".", 1)[-1]
    tree = ast.parse(Path(module.__file__).read_text(encoding="utf-8"))
    offenders: list[str] = []
    for node in ast.walk(tree):
        if isinstance(node, ast.ImportFrom):
            target = node.module or ""
            if node.level > 0 and target not in _ALLOWED_RELATIVE[name]:
                offenders.append(f"from .{target}")
            elif target.startswith("homeassistant"):
                offenders.append(f"from {target}")
        elif isinstance(node, ast.Import):
            offenders += [
                a.name for a in node.names if a.name.startswith("homeassistant")
            ]
    assert offenders == []


class _FakeResponse:
    """Stands in for the aiohttp response context manager.

    ``enter_exc`` fires on ``__aenter__`` (before/around the request),
    ``rfs_exc`` on ``raise_for_status``, ``json_exc`` on ``json``. When
    none are set, ``json`` returns ``json_data``.
    """

    def __init__(
        self,
        *,
        enter_exc: BaseException | None = None,
        rfs_exc: BaseException | None = None,
        json_exc: BaseException | None = None,
        json_data: Any = None,
    ) -> None:
        self._enter_exc = enter_exc
        self._rfs_exc = rfs_exc
        self._json_exc = json_exc
        self._json_data = json_data

    async def __aenter__(self) -> Self:
        if self._enter_exc is not None:
            raise self._enter_exc
        return self

    async def __aexit__(
        self,
        exc_type: type[BaseException] | None,
        exc: BaseException | None,
        tb: TracebackType | None,
    ) -> bool:
        return False

    def raise_for_status(self) -> None:
        if self._rfs_exc is not None:
            raise self._rfs_exc

    async def json(self, content_type: Any = None) -> Any:
        if self._json_exc is not None:
            raise self._json_exc
        return self._json_data


class _FakeSession:
    def __init__(self, response: _FakeResponse) -> None:
        self._response = response

    def get(self, *args: Any, **kwargs: Any) -> _FakeResponse:
        return self._response


def _client_response_error(status: int, message: str) -> aiohttp.ClientResponseError:
    return aiohttp.ClientResponseError(MagicMock(), (), status=status, message=message)


async def test_timeout_maps_to_efa_timeout() -> None:
    session = _FakeSession(_FakeResponse(enter_exc=TimeoutError("slow")))
    with pytest.raises(EfaTimeoutError):
        await _get_json(session, "http://x", {}, "UA")  # type: ignore[arg-type]


async def test_http_error_maps_to_efa_http_error() -> None:
    session = _FakeSession(
        _FakeResponse(rfs_exc=_client_response_error(503, "Service Unavailable"))
    )
    with pytest.raises(EfaHttpError) as excinfo:
        await _get_json(session, "http://x", {}, "UA")  # type: ignore[arg-type]
    assert excinfo.value.status == 503
    assert excinfo.value.reason == "Service Unavailable"


async def test_connection_error_maps_to_efa_connection_error() -> None:
    session = _FakeSession(
        _FakeResponse(enter_exc=aiohttp.ClientConnectionError("no route"))
    )
    with pytest.raises(EfaConnectionError) as excinfo:
        await _get_json(session, "http://x", {}, "UA")  # type: ignore[arg-type]
    # The HTTP + timeout subclasses must NOT swallow a plain connection error.
    assert not isinstance(excinfo.value, (EfaHttpError, EfaTimeoutError))
    assert isinstance(excinfo.value, EfaApiError)
    assert (excinfo.value.error_type, excinfo.value.error) == (
        "ClientConnectionError",
        "no route",
    )
    # The log line reads as it always has.
    assert str(excinfo.value) == "connection error: no route"


async def test_invalid_json_maps_to_efa_payload_error() -> None:
    session = _FakeSession(_FakeResponse(json_exc=ValueError("bad json")))
    with pytest.raises(EfaPayloadError):
        await _get_json(session, "http://x", {}, "UA")  # type: ignore[arg-type]


async def test_non_dict_body_maps_to_efa_payload_error() -> None:
    session = _FakeSession(_FakeResponse(json_data=["not", "a", "dict"]))
    with pytest.raises(EfaPayloadError):
        await _get_json(session, "http://x", {}, "UA")  # type: ignore[arg-type]


async def test_dict_body_returned_verbatim() -> None:
    session = _FakeSession(_FakeResponse(json_data={"ok": True}))
    assert await _get_json(session, "http://x", {}, "UA") == {"ok": True}  # type: ignore[arg-type]


async def test_requests_carry_the_user_agent_they_are_given() -> None:
    session = MagicMock()
    session.get = MagicMock(return_value=_FakeResponse(json_data={}))
    await api.fetch_addinfo(session, user_agent="UA/9")
    args, kwargs = session.get.call_args
    assert args == (f"{api.API_BASE_URL}{api.ADDINFO_ENDPOINT}",)
    assert kwargs["params"] == {
        "outputFormat": "JSON",
        "filterPublicationStatus": "current",
    }
    assert kwargs["headers"] == {"User-Agent": "UA/9", "Accept": "application/json"}
