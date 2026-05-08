// Pure helpers for the version-mismatch banner + WS card-version probe
// + URL trust-boundary guard. Localisation goes through `translate(ctx)`
// so the module owns no hidden language state.

import { html, nothing, type TemplateResult } from "lit";

import type { HomeAssistant } from "./types";
import { CARD_VERSION } from "./const";
import { translate, type TranslateContext } from "./localize/localize";

/**
 * Trust-boundary guard for URIs that the card renders into ``href``
 * attributes. Lit's ``${}`` interpolation is safe against tag /
 * attribute injection but does NOT block ``javascript:`` or ``data:``
 * URIs — a compromised upstream feed could otherwise execute arbitrary
 * JS in HA's frontend origin when the user clicks the link.
 *
 * Allowlist HTTP/HTTPS only; everything else collapses to an empty
 * string and the call site's nullish-or-empty gate keeps the link off.
 *
 * Apply to upstream-supplied URIs (alert deep-links if/when added) AND
 * to self-built URLs (maps deeplink) — defensive against a future
 * contributor wiring an upstream attribute through a previously
 * literal-only path. Accepts ``unknown`` so the helper doubles as a
 * runtime type-narrow for upstream payload shapes.
 */
export function safeHttpsUri(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return /^https?:\/\//i.test(raw) ? raw : "";
}

/**
 * Probe the backend's card-version WebSocket command. Returns the
 * server-reported version when it differs from CARD_VERSION (i.e.
 * banner should appear), or null otherwise. Silent on transport error
 * — older HA installs without the handler simply don't surface a
 * mismatch, which is correct (cache-buster URL still applies).
 */
export async function checkCardVersionWS(
  hass: HomeAssistant | undefined,
): Promise<string | null> {
  if (!hass?.callWS) return null;
  try {
    const r = await hass.callWS<{ version?: string }>({
      type: "linz_linien_austria/card_version",
    });
    if (r?.version && r.version !== CARD_VERSION) return r.version;
  } catch {
    // Silent: older backend without the WS handler.
  }
  return null;
}

/**
 * Best-effort cache-storage wipe followed by a hard reload. The reload
 * picks up the freshly-cached JS bundle so the version-mismatch banner
 * clears on next mount. Stamps a sessionStorage flag BEFORE reloading
 * so the next mount can detect a stuck-reload loop (Service Worker /
 * CDN refusing to invalidate) and short-circuit instead of looping the
 * banner forever — see `wasReloadAttemptedFor` below.
 */
export function reloadAfterCacheWipe(forVersion?: string | null): void {
  try {
    window.caches?.keys?.().then((keys) => {
      keys.forEach((k) => window.caches?.delete?.(k));
    });
  } catch {
    // best-effort cache wipe
  }
  if (forVersion) {
    try {
      window.sessionStorage?.setItem(
        `linz-reload-attempted-${forVersion}`,
        "1",
      );
    } catch {
      // sessionStorage may be disabled (Safari private mode etc.) —
      // fall through; worst case the user gets the regular reload
      // banner twice instead of the stuck-state branch.
    }
  }
  window.location.reload();
}

/**
 * Did the user already click reload for this exact mismatch in the
 * current tab session? When true, the banner should switch from
 * "Reload" to a stuck-state message (caches/Service Worker/CDN won't
 * invalidate; reloading again will just loop). sessionStorage survives
 * page reloads in the same tab but clears when the tab closes, which
 * is the right scope: after closing and reopening, the user gets a
 * fresh reload attempt.
 */
export function wasReloadAttemptedFor(version: string | null): boolean {
  if (!version) return false;
  try {
    return (
      window.sessionStorage?.getItem(`linz-reload-attempted-${version}`) ===
      "1"
    );
  } catch {
    return false;
  }
}

/**
 * Render the version-mismatch banner. Returns the lit `nothing` sentinel
 * when there is no mismatch so call sites can splat it unconditionally
 * into their template.
 */
export function renderVersionBanner(
  mismatch: string | null,
  ctx: TranslateContext,
): TemplateResult | typeof nothing {
  if (!mismatch) return nothing;
  // Stuck-reload anti-loop: if the user already clicked reload for this
  // exact mismatch in the current tab session and the mismatch is STILL
  // present, the cache invalidation didn't take effect (Service Worker,
  // aggressive CDN, or a browser ignoring the versioned URL). Surface a
  // "stuck" state instead of a second reload button so the banner can't
  // loop indefinitely.
  if (wasReloadAttemptedFor(mismatch)) {
    return html`
      <div class="version-notice" role="alert" aria-live="assertive">
        <span>${translate("common.version_reload_stuck", ctx)}</span>
      </div>
    `;
  }
  return html`
    <div class="version-notice" role="alert" aria-live="assertive">
      <span>${translate("common.version_update", ctx, { v: mismatch })}</span>
      <button
        class="version-reload-btn"
        type="button"
        @click=${() => reloadAfterCacheWipe(mismatch)}
      >
        ${translate("common.version_reload", ctx)}
      </button>
    </div>
  `;
}
