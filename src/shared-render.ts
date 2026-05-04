// Pure helpers for the version-mismatch banner + WS card-version probe.
// Localisation goes through `translate(ctx)` so the module owns no
// hidden language state.

import { html, nothing, type TemplateResult } from "lit";

import type { HomeAssistant } from "./types";
import { CARD_VERSION } from "./const";
import { translate, type TranslateContext } from "./localize/localize";

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
 * clears on next mount.
 */
export function reloadAfterCacheWipe(): void {
  try {
    window.caches?.keys?.().then((keys) => {
      keys.forEach((k) => window.caches?.delete?.(k));
    });
  } catch {
    // best-effort cache wipe
  }
  window.location.reload();
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
  return html`
    <div class="version-notice" role="alert" aria-live="assertive">
      <span>${translate("common.version_update", ctx, { v: mismatch })}</span>
      <button
        class="version-reload-btn"
        type="button"
        @click=${reloadAfterCacheWipe}
      >
        ${translate("common.version_reload", ctx)}
      </button>
    </div>
  `;
}
