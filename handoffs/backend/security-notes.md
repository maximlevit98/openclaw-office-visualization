# Security Notes — Backend

> Last updated: 2026-02-21 (Cycle 1 — initial draft)

## Token Safety (Non-Negotiable)

The OpenClaw Gateway token is the single most sensitive credential. Rules:

1. **Server-side only.** Token lives in BFF env var (`OPENCLAW_GATEWAY_TOKEN`), never in client bundles, HTML, or API responses.
2. **No token in URLs.** Never pass as query param (logged by proxies/CDNs).
3. **No token in SSE stream.** The SSE endpoint authenticates via session cookie or same-origin; the gateway token is never forwarded.
4. **Build-time check:** CI should grep for token patterns in frontend build output — fail if found.
5. **`.env` in `.gitignore`.** Always.

### How the BFF uses the token

```
Browser ---(cookie/origin)--→ BFF ---(OPENCLAW_GATEWAY_TOKEN)--→ Gateway
```

The browser authenticates to the BFF implicitly (same-origin, tailnet). The BFF injects the token when proxying to Gateway. Two-hop model — browser never sees the token.

---

## Network Security

- **Tailnet-only by default.** BFF listens on `0.0.0.0:3000` but only the Tailscale interface should be routable. No public internet exposure.
- **No TLS at BFF level (MVP).** Tailscale provides encrypted tunnels. If exposed beyond tailnet later, add TLS.
- **CORS:** Not needed in MVP (single origin). If added later, restrict to tailnet hostnames only.

---

## Input Validation

- `/api/sessions/:sessionKey/send` — validate `message` is a non-empty string, max 10,000 chars
- `sessionKey` — alphanumeric + hyphens only, max 128 chars (reject path traversal attempts)
- All query params — sanitize and type-check; reject unexpected fields

---

## Rate Limiting (Post-MVP)

Single-operator MVP doesn't need rate limiting. For multi-user:
- `/send` — 10 req/min per session
- `/api/stream` — 1 concurrent SSE connection per client IP
- Gateway RPC — BFF-level throttle to avoid overwhelming gateway

---

## Logging

- **Do log:** request paths, response codes, gateway connection status, error summaries
- **Do NOT log:** gateway token value, full message bodies (may contain sensitive data), full tool outputs
- Log format: structured JSON to stdout (12-factor style)

---

## Dependency Security

- Pin all npm dependencies (lockfile committed)
- No native gateway SDK exists yet — BFF will use raw WebSocket + HTTP. Validate all gateway responses before forwarding.
- Sanitize any HTML in message text before rendering (frontend responsibility, but BFF should not trust gateway output either)

---

## Threat Model (MVP)

| Threat | Mitigation | Priority |
|---|---|---|
| Token leak to browser | Two-hop BFF architecture, build-time grep | **P0** |
| Public internet exposure | Tailnet-only binding | **P0** |
| XSS via message content | Frontend sanitization + CSP headers from BFF | P1 |
| Gateway impersonation | Validate gateway WS origin on connect | P2 |
| DoS on BFF | Rate limiting (post-MVP) | P3 |
