// Enforces stock:1 in the base64-encoded JSON hash (#s/...) on adrionltd.com
(function () {
  const HASH_PREFIX = "#s/";

  function b64ToUtf8(b64) {
    const normalized = (b64 || "").replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "===".slice((normalized.length + 3) % 4);
    return atob(padded);
  }

  function utf8ToB64(str) {
    return btoa(str);
  }

  function parseHashPayload() {
    const { hash } = window.location;
    if (!hash || !hash.startsWith(HASH_PREFIX)) return null;
    const b64 = hash.slice(HASH_PREFIX.length);
    if (!b64) return null;
    try {
      return { obj: JSON.parse(b64ToUtf8(b64)), b64 };
    } catch {
      return null;
    }
  }

  function buildHash(obj) {
    return HASH_PREFIX + utf8ToB64(JSON.stringify(obj));
  }

  // Guard against our own hashchange event re-triggering
  let rewriting = false;

  function rewriteIfNeeded() {
    if (rewriting) return;
    const parsed = parseHashPayload();
    if (!parsed || parsed.obj.stock === 1) return;

    parsed.obj.stock = 1;
    const newHash = buildHash(parsed.obj);
    if (newHash === window.location.hash) return;

    rewriting = true;
    try {
      history.replaceState(null, "", newHash);
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    } finally {
      setTimeout(() => { rewriting = false; }, 0);
    }
  }

  // Runs the rewrite once even if the hash changes many times quickly.
  let scheduled = false;
  function scheduleRewrite() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      rewriteIfNeeded();
    });
  }

  function init() {
    scheduleRewrite();
    window.addEventListener("hashchange", scheduleRewrite, { passive: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
