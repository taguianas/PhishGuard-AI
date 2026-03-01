"""
PhishGuard — Full End-to-End Test Suite
========================================
Tests every layer of the stack in order:
  1. Service health checks
  2. ML service — predictions
  3. Backend — unauthenticated (401 enforcement)
  4. Backend — authenticated (direct with JWT)
  5. Frontend — auth flow (register / login / session / sign-out)
  6. Frontend — authenticated proxy routes
  7. Frontend — route protection (unauthenticated redirects)
  8. Data isolation between two users

Run with:  python tests/e2e_test.py
"""

import json
import sys
import time
import uuid
import requests
from typing import Optional

# ── Endpoints ─────────────────────────────────────────────────────────────────
ML       = "http://localhost:8000"
BACKEND  = "http://localhost:4000"
FRONTEND = "http://localhost:3000"

# ── ANSI colours ──────────────────────────────────────────────────────────────
GREEN  = "\033[92m"
RED    = "\033[91m"
YELLOW = "\033[93m"
CYAN   = "\033[96m"
BOLD   = "\033[1m"
DIM    = "\033[2m"
RESET  = "\033[0m"

# ── Test state ─────────────────────────────────────────────────────────────────
passed = 0
failed = 0
skipped = 0
results = []

def _status(ok: bool, label: str, detail: str = "", skip: bool = False):
    global passed, failed, skipped
    if skip:
        skipped += 1
        icon = f"{YELLOW}SKIP{RESET}"
    elif ok:
        passed += 1
        icon = f"{GREEN}PASS{RESET}"
    else:
        failed += 1
        icon = f"{RED}FAIL{RESET}"
    suffix = f"  {DIM}{detail}{RESET}" if detail else ""
    print(f"  [{icon}] {label}{suffix}")
    results.append((ok, label, detail, skip))

def section(title: str):
    print(f"\n{BOLD}{CYAN}{'-'*60}{RESET}")
    print(f"{BOLD}{CYAN}  {title}{RESET}")
    print(f"{BOLD}{CYAN}{'-'*60}{RESET}")

def check(name: str, condition: bool, detail: str = "", skip: bool = False):
    _status(condition, name, detail, skip)
    return condition

# ── Helpers ────────────────────────────────────────────────────────────────────

def service_up(url: str, timeout: int = 3) -> bool:
    try:
        requests.get(url, timeout=timeout)
        return True
    except Exception:
        return False

def frontend_session(email: str, password: str) -> Optional[requests.Session]:
    """Sign in and return an authenticated requests.Session, or None on failure."""
    s = requests.Session()
    try:
        csrf = s.get(f"{FRONTEND}/api/auth/csrf", timeout=5).json()["csrfToken"]
        s.post(f"{FRONTEND}/api/auth/callback/credentials",
               data={"csrfToken": csrf, "email": email, "password": password,
                     "redirect": "false", "json": "true"},
               allow_redirects=True, timeout=10)
        sess = s.get(f"{FRONTEND}/api/auth/session", timeout=5).json()
        if sess.get("user"):
            return s
    except Exception:
        pass
    return None

# ══════════════════════════════════════════════════════════════════════════════
# 1. HEALTH CHECKS
# ══════════════════════════════════════════════════════════════════════════════
section("1. Service Health Checks")

ml_up = service_up(f"{ML}/health")
be_up = service_up(f"{BACKEND}/api/history/stats")   # any auth-gated route -> 401 = up
fe_up = service_up(f"{FRONTEND}/api/auth/csrf")

check("ML service reachable   (localhost:8000)", ml_up,
      skip=not ml_up)
check("Backend reachable      (localhost:4000)", be_up,
      skip=not be_up)
check("Frontend reachable     (localhost:3000)", fe_up,
      skip=not fe_up)

if ml_up:
    r = requests.get(f"{ML}/health", timeout=5)
    data = r.json()
    check("ML /health -> 200 + model_loaded=true",
          r.status_code == 200 and data.get("model_loaded") is True,
          f"model_loaded={data.get('model_loaded')}")

# ══════════════════════════════════════════════════════════════════════════════
# 2. ML SERVICE — PREDICTIONS
# ══════════════════════════════════════════════════════════════════════════════
section("2. ML Service — URL Predictions")

if ml_up:
    # Phishing URL
    r = requests.post(f"{ML}/predict",
                      json={"url": "http://paypa1-security-update.com/login"},
                      timeout=10)
    check("POST /predict (phishing URL) -> 200",
          r.status_code == 200,
          f"status={r.status_code}")
    if r.status_code == 200:
        d = r.json()
        check("  prediction field present", "prediction" in d, str(d.get("prediction")))
        check("  probability is float 0-1",
              isinstance(d.get("probability"), float) and 0 <= d["probability"] <= 1,
              f"prob={d.get('probability')}")
        check("  features dict present", isinstance(d.get("features"), dict))
        check("  phishing URL classified as Phishing (or high prob)",
              d.get("prediction") == "Phishing" or d.get("probability", 0) >= 0.4,
              f"prediction={d.get('prediction')} prob={d.get('probability')}")

    # Legitimate URL
    r2 = requests.post(f"{ML}/predict",
                       json={"url": "https://www.google.com"},
                       timeout=10)
    check("POST /predict (legit URL) -> 200",
          r2.status_code == 200,
          f"status={r2.status_code}")
    if r2.status_code == 200:
        d2 = r2.json()
        check("  legit URL classified as Legitimate (or low prob)",
              d2.get("prediction") == "Legitimate" or d2.get("probability", 1) <= 0.6,
              f"prediction={d2.get('prediction')} prob={d2.get('probability')}")

    # Invalid URL validation
    r3 = requests.post(f"{ML}/predict",
                       json={"url": "not-a-url"},
                       timeout=5)
    check("POST /predict (invalid URL) -> 422",
          r3.status_code == 422,
          f"status={r3.status_code}")
else:
    for label in ["POST /predict (phishing URL) -> 200",
                  "POST /predict (legit URL) -> 200",
                  "POST /predict (invalid URL) -> 422"]:
        check(label, False, skip=True)

# ══════════════════════════════════════════════════════════════════════════════
# 3. BACKEND — UNAUTHENTICATED (401 ENFORCEMENT)
# ══════════════════════════════════════════════════════════════════════════════
section("3. Backend — 401 Without Auth Token")

if be_up:
    endpoints_401 = [
        ("POST", f"{BACKEND}/api/url/analyze",   {"url": "https://google.com"}),
        ("POST", f"{BACKEND}/api/email/analyze", {"email_text": "Hello"}),
        ("GET",  f"{BACKEND}/api/history",       None),
        ("GET",  f"{BACKEND}/api/history/stats", None),
    ]
    for method, url, body in endpoints_401:
        path = url.replace(BACKEND, "")
        if method == "POST":
            r = requests.post(url, json=body, timeout=5)
        else:
            r = requests.get(url, timeout=5)
        check(f"{method} {path} without token -> 401",
              r.status_code == 401,
              f"got {r.status_code}")
else:
    for label in ["POST /api/url/analyze -> 401",
                  "POST /api/email/analyze -> 401",
                  "GET  /api/history -> 401",
                  "GET  /api/history/stats -> 401"]:
        check(label, False, skip=True)

# ══════════════════════════════════════════════════════════════════════════════
# 4. FRONTEND — AUTH FLOW
# ══════════════════════════════════════════════════════════════════════════════
section("4. Frontend — Auth Flow (Register / Login / Sign-out)")

# Use unique emails so repeated test runs don't collide
uid = uuid.uuid4().hex[:8]
TEST_EMAIL    = f"e2etest_{uid}@phishguard.test"
TEST_PASSWORD = "TestPass99!"
TEST_NAME     = "E2E Tester"

USER2_EMAIL    = f"e2etest2_{uid}@phishguard.test"
USER2_PASSWORD = "TestPass99!"
USER2_NAME     = "E2E Tester 2"

authed_session: Optional[requests.Session] = None
user1_id: Optional[str] = None

if fe_up:
    # 4a. Register — valid new user
    r = requests.post(f"{FRONTEND}/api/auth/register",
                      json={"name": TEST_NAME, "email": TEST_EMAIL,
                            "password": TEST_PASSWORD},
                      headers={"Content-Type": "application/json"}, timeout=10)
    check("Register new user -> 201",
          r.status_code == 201,
          f"status={r.status_code} body={r.text[:100]}")

    # 4b. Register — duplicate email -> 409
    r = requests.post(f"{FRONTEND}/api/auth/register",
                      json={"name": TEST_NAME, "email": TEST_EMAIL,
                            "password": TEST_PASSWORD},
                      headers={"Content-Type": "application/json"}, timeout=10)
    check("Register duplicate email -> 409",
          r.status_code == 409,
          f"status={r.status_code}")

    # 4c. Register — short password -> 400
    r = requests.post(f"{FRONTEND}/api/auth/register",
                      json={"email": TEST_EMAIL, "password": "short"},
                      headers={"Content-Type": "application/json"}, timeout=10)
    check("Register short password -> 400",
          r.status_code == 400,
          f"status={r.status_code}")

    # 4d. Register — missing email -> 400
    r = requests.post(f"{FRONTEND}/api/auth/register",
                      json={"password": TEST_PASSWORD},
                      headers={"Content-Type": "application/json"}, timeout=10)
    check("Register missing email -> 400",
          r.status_code == 400,
          f"status={r.status_code}")

    # 4e. Login — valid credentials
    s = requests.Session()
    csrf = s.get(f"{FRONTEND}/api/auth/csrf", timeout=5).json()["csrfToken"]
    check("GET /api/auth/csrf returns token",
          bool(csrf),
          f"token={csrf[:12]}...")

    login = s.post(f"{FRONTEND}/api/auth/callback/credentials",
                   data={"csrfToken": csrf, "email": TEST_EMAIL,
                         "password": TEST_PASSWORD,
                         "redirect": "false", "json": "true"},
                   allow_redirects=True, timeout=10)
    check("Login with valid credentials -> 200",
          login.status_code == 200,
          f"status={login.status_code}")

    # Session cookie should be set
    cookie_names = list(s.cookies.keys())
    has_session_cookie = any(
        "session-token" in name or "authjs" in name
        for name in cookie_names
    )
    check("Session cookie set after login",
          has_session_cookie,
          f"cookies={cookie_names}")

    # 4f. GET /api/auth/session — returns user object
    sess = s.get(f"{FRONTEND}/api/auth/session", timeout=5).json()
    user_obj = sess.get("user", {})
    check("GET /api/auth/session returns user",
          bool(user_obj.get("email")),
          f"email={user_obj.get('email')}")
    check("  session.user.email matches registered email",
          user_obj.get("email") == TEST_EMAIL,
          f"{user_obj.get('email')} == {TEST_EMAIL}")
    check("  session.user.id present",
          bool(user_obj.get("id")),
          f"id={str(user_obj.get('id', ''))[:8]}...")

    user1_id = user_obj.get("id")
    authed_session = s  # keep for proxy tests

    # 4g. Login — wrong password -> no session
    s_bad = requests.Session()
    csrf2 = s_bad.get(f"{FRONTEND}/api/auth/csrf", timeout=5).json()["csrfToken"]
    s_bad.post(f"{FRONTEND}/api/auth/callback/credentials",
               data={"csrfToken": csrf2, "email": TEST_EMAIL,
                     "password": "wrongpassword",
                     "redirect": "false", "json": "true"},
               allow_redirects=True, timeout=10)
    sess_bad = s_bad.get(f"{FRONTEND}/api/auth/session", timeout=5).json()
    check("Login wrong password -> no session",
          not (sess_bad or {}).get("user"),
          f"session={sess_bad}")

    # 4h. Sign out — session cleared
    signout_csrf = s.get(f"{FRONTEND}/api/auth/csrf", timeout=5).json()["csrfToken"]
    so = s.post(f"{FRONTEND}/api/auth/signout",
                data={"csrfToken": signout_csrf}, allow_redirects=True, timeout=10)
    check("POST /api/auth/signout -> 200",
          so.status_code == 200,
          f"status={so.status_code}")
    sess_after = s.get(f"{FRONTEND}/api/auth/session", timeout=5).json()
    check("Session empty after sign-out",
          not (sess_after or {}).get("user"),
          f"session={sess_after}")

    # Re-authenticate for proxy tests
    authed_session = frontend_session(TEST_EMAIL, TEST_PASSWORD)
    check("Re-authenticate for proxy tests",
          authed_session is not None)
else:
    for label in ["Register new user -> 201", "Register duplicate email -> 409",
                  "Register short password -> 400", "Register missing email -> 400",
                  "Login with valid credentials -> 200", "Session cookie set after login",
                  "GET /api/auth/session returns user", "Login wrong password -> no session",
                  "POST /api/auth/signout -> 200", "Session empty after sign-out"]:
        check(label, False, skip=True)

# ══════════════════════════════════════════════════════════════════════════════
# 5. FRONTEND — AUTHENTICATED PROXY ROUTES
# ══════════════════════════════════════════════════════════════════════════════
section("5. Frontend — Authenticated Proxy Routes")

if fe_up and authed_session:
    s = authed_session

    # 5a. URL analyze proxy
    r = s.post(f"{FRONTEND}/api/analyze/url",
               json={"url": "http://paypa1.com/login"},
               headers={"Content-Type": "application/json"}, timeout=30)
    check("POST /api/analyze/url -> 200",
          r.status_code == 200,
          f"status={r.status_code}")
    if r.status_code == 200:
        try:
            d = r.json()
            check("  response has risk_score",
                  isinstance(d.get("risk_score"), (int, float)),
                  f"risk_score={d.get('risk_score')}")
            check("  response has classification",
                  d.get("classification") in ("Low Risk", "Medium Risk", "High Risk"),
                  f"classification={d.get('classification')}")
            check("  response has reasons list",
                  isinstance(d.get("reasons"), list),
                  f"reasons count={len(d.get('reasons', []))}")
        except Exception as e:
            check("  response is valid JSON", False, str(e))

    # 5b. URL analyze — invalid URL -> 400
    r_bad = s.post(f"{FRONTEND}/api/analyze/url",
                   json={"url": "not-a-url"},
                   headers={"Content-Type": "application/json"}, timeout=10)
    check("POST /api/analyze/url (bad URL) -> 400",
          r_bad.status_code == 400,
          f"status={r_bad.status_code}")

    # 5c. Email analyze proxy
    phishing_email = (
        "URGENT: Your bank account has been suspended!\n"
        "Click here immediately: http://bank-login.secure-update.tk/verify\n"
        "Provide your credentials to restore access. Limited time offer!\n"
        "Winner! You have been selected. Claim your prize now. Act fast!"
    )
    r = s.post(f"{FRONTEND}/api/analyze/email",
               json={"email_text": phishing_email, "sender_domain": "secure-update.tk"},
               headers={"Content-Type": "application/json"}, timeout=30)
    check("POST /api/analyze/email -> 200",
          r.status_code == 200,
          f"status={r.status_code}")
    if r.status_code == 200:
        try:
            d = r.json()
            check("  response has risk_score",
                  isinstance(d.get("risk_score"), (int, float)),
                  f"risk_score={d.get('risk_score')}")
            check("  response has classification",
                  d.get("classification") in ("Low Risk", "Medium Risk", "High Risk"),
                  f"classification={d.get('classification')}")
            check("  phishing email has non-zero score",
                  d.get("risk_score", 0) > 0,
                  f"score={d.get('risk_score')}")
        except Exception as e:
            check("  response is valid JSON", False, str(e))

    # 5d. Email analyze — empty body -> 400
    r_empty = s.post(f"{FRONTEND}/api/analyze/email",
                     json={"email_text": ""},
                     headers={"Content-Type": "application/json"}, timeout=10)
    check("POST /api/analyze/email (empty) -> 400",
          r_empty.status_code == 400,
          f"status={r_empty.status_code}")

    # 5e. History proxy
    r = s.get(f"{FRONTEND}/api/analyze/history", timeout=10)
    check("GET /api/analyze/history -> 200",
          r.status_code == 200,
          f"status={r.status_code}")
    if r.status_code == 200:
        try:
            d = r.json()
            check("  history response is list",
                  isinstance(d, list),
                  f"type={type(d).__name__} len={len(d)}")
        except Exception as e:
            check("  history is valid JSON", False, str(e))

    # 5f. Stats proxy
    r = s.get(f"{FRONTEND}/api/analyze/history?type=stats", timeout=10)
    check("GET /api/analyze/history?type=stats -> 200",
          r.status_code == 200,
          f"status={r.status_code}")
    if r.status_code == 200:
        try:
            d = r.json()
            check("  stats has total_scans",
                  "total_scans" in d,
                  f"keys={list(d.keys())}")
        except Exception as e:
            check("  stats is valid JSON", False, str(e))

elif not fe_up:
    for label in ["POST /api/analyze/url -> 200", "POST /api/analyze/email -> 200",
                  "GET  /api/analyze/history -> 200", "GET  /api/analyze/history?type=stats -> 200"]:
        check(label, False, skip=True)
else:
    print(f"  {YELLOW}WARN{RESET}  Proxy tests skipped — re-authentication failed")

# ══════════════════════════════════════════════════════════════════════════════
# 6. PROXY ROUTES — UNAUTHENTICATED (should 401)
# ══════════════════════════════════════════════════════════════════════════════
section("6. Proxy Routes — 401 Without Session")

if fe_up:
    anon = requests.Session()  # no session cookie

    r = anon.post(f"{FRONTEND}/api/analyze/url",
                  json={"url": "https://google.com"},
                  headers={"Content-Type": "application/json"},
                  allow_redirects=False, timeout=5)
    check("POST /api/analyze/url unauthenticated -> 401 or redirect",
          r.status_code in (401, 302, 307),
          f"status={r.status_code}")

    r = anon.post(f"{FRONTEND}/api/analyze/email",
                  json={"email_text": "test"},
                  headers={"Content-Type": "application/json"},
                  allow_redirects=False, timeout=5)
    check("POST /api/analyze/email unauthenticated -> 401 or redirect",
          r.status_code in (401, 302, 307),
          f"status={r.status_code}")

    r = anon.get(f"{FRONTEND}/api/analyze/history",
                 allow_redirects=False, timeout=5)
    check("GET  /api/analyze/history unauthenticated -> 401 or redirect",
          r.status_code in (401, 302, 307),
          f"status={r.status_code}")
else:
    for label in ["POST /api/analyze/url unauthenticated",
                  "POST /api/analyze/email unauthenticated",
                  "GET  /api/analyze/history unauthenticated"]:
        check(label, False, skip=True)

# ══════════════════════════════════════════════════════════════════════════════
# 7. ROUTE PROTECTION — PAGE REDIRECTS
# ══════════════════════════════════════════════════════════════════════════════
section("7. Route Protection — Unauthenticated Page Redirects")

if fe_up:
    anon = requests.Session()

    protected_pages = ["/", "/dashboard", "/url-analyzer", "/email-analyzer"]
    for page in protected_pages:
        r = anon.get(f"{FRONTEND}{page}", allow_redirects=False, timeout=5)
        redirected_to_login = (
            r.status_code in (302, 307) and
            "/login" in r.headers.get("location", "")
        )
        check(f"GET {page} unauthenticated -> redirect to /login",
              redirected_to_login,
              f"status={r.status_code} location={r.headers.get('location', 'none')}")

    public_pages = ["/login", "/register"]
    for page in public_pages:
        r = anon.get(f"{FRONTEND}{page}", allow_redirects=True, timeout=5)
        check(f"GET {page} unauthenticated -> 200 (public)",
              r.status_code == 200,
              f"status={r.status_code}")
else:
    for label in ["GET / -> redirect", "GET /dashboard -> redirect",
                  "GET /login -> 200", "GET /register -> 200"]:
        check(label, False, skip=True)

# ══════════════════════════════════════════════════════════════════════════════
# 8. DATA ISOLATION
# ══════════════════════════════════════════════════════════════════════════════
section("8. Data Isolation Between Users")

if fe_up:
    # Register user 2
    r = requests.post(f"{FRONTEND}/api/auth/register",
                      json={"name": USER2_NAME, "email": USER2_EMAIL,
                            "password": USER2_PASSWORD},
                      headers={"Content-Type": "application/json"}, timeout=10)
    check("Register second user -> 201",
          r.status_code == 201,
          f"status={r.status_code}")

    s2 = frontend_session(USER2_EMAIL, USER2_PASSWORD)
    check("User 2 can log in",
          s2 is not None)

    if s2:
        # User 2 should start with zero history
        r = s2.get(f"{FRONTEND}/api/analyze/history?type=stats", timeout=10)
        if r.status_code == 200:
            stats2 = r.json()
            check("User 2 starts with zero scans",
                  stats2.get("total_scans", -1) == 0,
                  f"total_scans={stats2.get('total_scans')}")
        else:
            check("User 2 stats endpoint reachable", False,
                  f"status={r.status_code}")

        # User 1's history should not appear for user 2
        if authed_session:
            r1 = authed_session.get(f"{FRONTEND}/api/analyze/history", timeout=10)
            r2_hist = s2.get(f"{FRONTEND}/api/analyze/history", timeout=10)
            if r1.status_code == 200 and r2_hist.status_code == 200:
                hist1 = r1.json()
                hist2 = r2_hist.json()
                # User 1's history IDs should not appear in User 2's list
                ids1 = {item.get("id") for item in hist1 if item.get("id")}
                ids2 = {item.get("id") for item in hist2 if item.get("id")}
                check("User 1 and User 2 histories are disjoint",
                      len(ids1 & ids2) == 0,
                      f"u1={len(ids1)} items, u2={len(ids2)} items, "
                      f"overlap={len(ids1 & ids2)}")
            else:
                check("History endpoints accessible for isolation check",
                      False,
                      f"u1={r1.status_code} u2={r2_hist.status_code}")
        else:
            check("User 1 history (for isolation check)", False,
                  skip=True)
    else:
        for label in ["User 2 starts with zero scans",
                      "User 1 and User 2 histories are disjoint"]:
            check(label, False, skip=True)
else:
    for label in ["Register second user -> 201", "User 2 can log in",
                  "User 2 starts with zero scans",
                  "User 1 and User 2 histories are disjoint"]:
        check(label, False, skip=True)

# ══════════════════════════════════════════════════════════════════════════════
# SUMMARY
# ══════════════════════════════════════════════════════════════════════════════
total = passed + failed + skipped
print(f"\n{BOLD}{'='*60}{RESET}")
print(f"{BOLD}  Test Results Summary{RESET}")
print(f"{BOLD}{'='*60}{RESET}")
print(f"  {GREEN}Passed : {passed}{RESET}")
print(f"  {RED}Failed : {failed}{RESET}")
if skipped:
    print(f"  {YELLOW}Skipped: {skipped}{RESET}  (service not running)")
print(f"  Total  : {total}")

if failed > 0:
    print(f"\n{RED}{BOLD}  FAILED TESTS:{RESET}")
    for ok, label, detail, skip in results:
        if not ok and not skip:
            print(f"  {RED}  FAIL: {label}{RESET}  {DIM}{detail}{RESET}")

if failed == 0 and skipped == 0:
    print(f"\n{GREEN}{BOLD}  All tests passed!{RESET}")
elif failed == 0:
    print(f"\n{YELLOW}{BOLD}  All reachable services passed (some skipped).{RESET}")
else:
    print(f"\n{RED}{BOLD}  {failed} test(s) failed.{RESET}")

print()
sys.exit(0 if failed == 0 else 1)
