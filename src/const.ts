// Must match CARD_VERSION in custom_components/linz_linien_austria/const.py byte-for-byte.
// If they drift the WS check sees a mismatch, shows a reload banner, the reload
// re-serves the same JS, and the banner reappears — infinite loop.
//
// Bump both in the same commit. Every version marker in the repo carries the
// same clean version — pre-releases reuse the eventual release's number and are
// distinguished by the GitHub --prerelease flag, not by a suffix here.
export const CARD_VERSION = "0.7.3";
