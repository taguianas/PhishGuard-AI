# PhishGuard : End-to-End Test Report

**Date:** 2026-03-01
**Run command:** `python tests/e2e_test.py`
**Result: 57 passed / 0 failed / 0 skipped**

---

## Services Tested

| Service | URL | Status |
|---------|-----|--------|
| ML Service (FastAPI + XGBoost) | http://localhost:8000 | Running |
| Backend (Express) | http://localhost:4000 | Running |
| Frontend (Next.js) | http://localhost:3000 | Running |

---

## Section 1 : Service Health Checks (4 tests)

Verified all three services are reachable and the ML model is loaded in memory.

| Test | Result |
|------|--------|
| ML service reachable (localhost:8000) | PASS |
| Backend reachable (localhost:4000) | PASS |
| Frontend reachable (localhost:3000) | PASS |
| ML /health -> 200 + model_loaded=true | PASS  model_loaded=True |

---

## Section 2 : ML Service URL Predictions (8 tests)

Confirmed the XGBoost classifier returns correct predictions and well-formed responses.

| Test | Result | Detail |
|------|--------|--------|
| POST /predict (phishing URL) -> 200 | PASS | status=200 |
| prediction field present | PASS | Phishing |
| probability is float 0-1 | PASS | prob=1.0 |
| features dict present | PASS | 20 features |
| phishing URL classified as Phishing | PASS | prediction=Phishing prob=1.0 |
| POST /predict (legit URL) -> 200 | PASS | status=200 |
| legit URL classified as Legitimate | PASS | prediction=Legitimate prob=0.0 |
| POST /predict (invalid URL) -> 422 | PASS | status=422 (Pydantic validation) |

**Observations:** The model shows high confidence (probability 1.0 / 0.0) on test URLs. The phishing test URL (`http://paypa1-security-update.com/login`) and the legitimate URL (`https://www.google.com`) are well-separated in feature space.

---

## Section 3 : Backend 401 Enforcement (4 tests)

Verified every protected backend route returns 401 when called without an Authorization header.

| Test | Result | HTTP Status |
|------|--------|-------------|
| POST /api/url/analyze without token | PASS | 401 |
| POST /api/email/analyze without token | PASS | 401 |
| GET /api/history without token | PASS | 401 |
| GET /api/history/stats without token | PASS | 401 |

---

## Section 4 : Frontend Auth Flow (14 tests)

Full registration, login, session, and sign-out lifecycle.

| Test | Result | Detail |
|------|--------|--------|
| Register new user -> 201 | PASS | `{"ok":true}` |
| Register duplicate email -> 409 | PASS | Conflict detected |
| Register short password -> 400 | PASS | Validation error |
| Register missing email -> 400 | PASS | Validation error |
| GET /api/auth/csrf returns token | PASS | 16-char token prefix verified |
| Login with valid credentials -> 200 | PASS | status=200 |
| Session cookie set after login | PASS | `authjs.session-token` cookie present |
| GET /api/auth/session returns user | PASS | email returned |
| session.user.email matches | PASS | Exact match |
| session.user.id present | PASS | UUID confirmed |
| Login wrong password -> no session | PASS | session=None |
| POST /api/auth/signout -> 200 | PASS | status=200 |
| Session empty after sign-out | PASS | session=None |
| Re-authenticate for proxy tests | PASS | New session established |

**Observations:**
- NextAuth v5 uses `authjs.session-token` as the session cookie name (not the v4 `next-auth.session-token`). Middleware was updated to check both variants.
- Wrong-password login correctly returns a null session (no user object).
- Sign-out correctly clears the session cookie.

---

## Section 5 : Authenticated Proxy Routes (14 tests)

Verified the Next.js proxy API routes correctly forward requests to the backend with a signed JWT, and return structured analysis results.

| Test | Result | Detail |
|------|--------|--------|
| POST /api/analyze/url -> 200 | PASS | status=200 |
| response has risk_score | PASS | risk_score=65 |
| response has classification | PASS | Medium Risk |
| response has reasons list | PASS | 4 reasons |
| POST /api/analyze/url (bad URL) -> 400 | PASS | Validation rejected |
| POST /api/analyze/email -> 200 | PASS | status=200 |
| response has risk_score | PASS | risk_score=35 |
| response has classification | PASS | Medium Risk |
| phishing email has non-zero score | PASS | score=35 |
| POST /api/analyze/email (empty) -> 400 | PASS | Validation rejected |
| GET /api/analyze/history -> 200 | PASS | status=200 |
| history response is list | PASS | type=list, 2 items |
| GET /api/analyze/history?type=stats -> 200 | PASS | status=200 |
| stats has total_scans | PASS | keys: total_scans, high_risk_count, flagged_urls |

**Observations:**
- The proxy uses `getToken()` + `jose SignJWT` to re-sign the NextAuth JWT before forwarding to the backend — the raw client token is never exposed to the browser.
- URL `http://paypa1.com/login` scored 65 (Medium Risk) with 4 detected signals.
- The phishing email scored 35 (Medium Risk) based on heuristics; LLM boost would apply above confidence threshold.

---

## Section 6 : Proxy Routes Unauthenticated (3 tests)

Verified unauthenticated requests to proxy routes are blocked.

| Test | Result | HTTP Status |
|------|--------|-------------|
| POST /api/analyze/url unauthenticated | PASS | 307 (redirect to /login) |
| POST /api/analyze/email unauthenticated | PASS | 307 (redirect to /login) |
| GET /api/analyze/history unauthenticated | PASS | 307 (redirect to /login) |

---

## Section 7 : Route Protection (6 tests)

Verified Next.js middleware redirects unauthenticated users away from protected pages, and leaves public pages accessible.

| Test | Result | Detail |
|------|--------|--------|
| GET / unauthenticated -> redirect to /login | PASS | 307, location=/login |
| GET /dashboard unauthenticated -> redirect | PASS | 307, callbackUrl preserved |
| GET /url-analyzer unauthenticated -> redirect | PASS | 307, callbackUrl preserved |
| GET /email-analyzer unauthenticated -> redirect | PASS | 307, callbackUrl preserved |
| GET /login unauthenticated -> 200 | PASS | Public route accessible |
| GET /register unauthenticated -> 200 | PASS | Public route accessible |

**Observations:** The middleware correctly preserves the original path in `?callbackUrl=` so users are redirected back after login.

---

## Section 8 : Data Isolation (4 tests)

Verified that users can only see their own scan history.

| Test | Result | Detail |
|------|--------|--------|
| Register second user -> 201 | PASS | Fresh account |
| User 2 can log in | PASS | Session established |
| User 2 starts with zero scans | PASS | total_scans=0 |
| User 1 and User 2 histories are disjoint | PASS | u1=2 items, u2=0 items, overlap=0 |

**Implementation:** All scan queries are filtered by `user_id` (stored alongside each scan). User IDs flow from the NextAuth JWT into the backend via the `Authorization: Bearer` header, then stored in `url_scans.user_id` and `email_scans.user_id`.

---

## Summary

```
Passed : 57
Failed : 0
Skipped: 0
Total  : 57
```

All tests passed across all eight test groups. The full stack, ML service, Express backend, and Next.js frontend with authentication is functioning correctly end-to-end.
