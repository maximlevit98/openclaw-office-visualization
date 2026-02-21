# 🚀 NEXT STEPS — Phase 1 Acceptance Testing

**Status:** Code complete. Ready for testing.  
**Blocker:** `GATEWAY_TOKEN` (waiting on ops)  
**Timeline:** 1–2 hours to Phase 1 exit (once token arrives)

---

## FOR OPS / GATEWAY TEAM 🔴 URGENT

**Action:** Provide `GATEWAY_TOKEN`

```bash
# 1. Run this on your machine:
openclaw gateway status

# 2. Copy the GATEWAY_TOKEN value from output

# 3. Send to product@office-viz:
"GATEWAY_TOKEN=<value>"
```

**Impact:** Unblocks all Phase 1 acceptance testing  
**Timeline:** Critical path blocker  
**Why:** Required to authenticate API calls to gateway

---

## FOR QA / TESTER 🟡 READY NOW

**When:** Once ops provides `GATEWAY_TOKEN`

**Action:** Run TASK-012 acceptance test suite

```bash
# 1. Setup (ops will provide token)
cd /Users/maxim/Documents/openclaw-office-visualization
echo "GATEWAY_TOKEN=<token_from_ops>" > .env.local
echo "NEXT_PUBLIC_GATEWAY_URL=http://localhost:7070" >> .env.local

# 2. Verify build still works
npm run build
# Should: "Compiled successfully in ~486ms"

# 3. Start app
npm run dev
# Should: "Ready in X seconds"

# 4. Test 7 MVP criteria
# See: handoffs/product/EXECUTION_PLAN.md (detailed checklist)
# Tests take ~30-45 minutes

# 5. Document results
# See: handoffs/tester/test-report.md (template provided)

# 6. Commit when done
git add handoffs/tester/test-report.md
git commit -m "test: Phase 1 acceptance (all 7 criteria verified)"
git push
```

**7 Criteria to Test:**
1. ✅ Sessions load from API (not mock)
2. ✅ Session selection shows history
3. ✅ Send message works end-to-end
4. ✅ 3+ agents visible
5. ✅ No 401/403 auth errors
6. ✅ Token not in client build (security)
7. ✅ Layout usable on desktop (≥1024px)

**All must PASS to exit Phase 1**

---

## FOR PRODUCT / PRODUCER 🟢 REVIEW READY

**When:** Once QA completes TASK-012

**Action:** Review + sign off Phase 1 exit gate

```
Checklist:
☐ All 7 acceptance criteria passed (QA documented)
☐ test-report.md is signed + dated
☐ Security audit clean (no token exposure)
☐ npm run build succeeds (zero errors)
☐ No console errors in browser

If all ☐: APPROVE Phase 1 → Unblock Phase 2
If any ❌: Debug + re-test that criterion
```

**Timeline:** 15 minutes (review only)

---

## FOR BACKEND / FRONTEND 💚 STANDBY

**Status:** TASK-010 + TASK-011 complete. Code is ready.

**Action:** Wait for Phase 1 sign-off, then start Phase 2

**When Phase 1 passes:**
- TASK-020: Agent office panel with live presence
- TASK-021: Session sidebar filters
- TASK-030: Message validation + rate limiting

**Timeline:** 2–3 hours for Phase 2 (starts after Phase 1 gate)

---

## CRITICAL PATH (Visual)

```
NOW (04:04 Moscow)
│
├─ 🔴 OPS: Provide GATEWAY_TOKEN
│  └─ ~5 minutes
│
├─ QA: Run TASK-012 acceptance tests
│  └─ ~45 minutes (once token arrives)
│
└─ PRODUCT: Sign off Phase 1 gate
   └─ ~15 minutes (once tests pass)
   └─ RESULT: Phase 1 SHIPPED
   
   Total time: ~1 hour (from token arrival)
```

---

## IF TESTS FAIL

**Criterion fails:** Do NOT re-check. Debug & fix.

1. **Find the error:** DevTools console, API logs, curl test
2. **Fix the issue:** Usually config (token, gateway URL) or network
3. **Re-test:** Run that specific criterion again
4. **Document:** "Fixed X, re-tested, now PASSES"

See: handoffs/product/EXECUTION_PLAN.md (IF TESTS FAIL section)

---

## FILES TO READ

**Execution Details:**  
`handoffs/product/EXECUTION_PLAN.md` — Complete test checklist with copy/paste steps

**Current Status:**  
`handoffs/product/cycle-summary.md` — Detailed state report  
`handoffs/product/task-board.md` — Task assignments + acceptance criteria

**Test Results Template:**  
`handoffs/tester/test-report.md` — Where to document results

---

## GIT COMMIT MESSAGE (Final)

```bash
git commit -m "test: Phase 1 acceptance criteria verified (all 7 passed) - ready for Phase 2"
```

---

## EXPECTED TIMELINE

- **04:04** — Docs updated, waiting on GATEWAY_TOKEN
- **~04:10** — Ops provides token
- **04:10–04:55** — QA runs 7 acceptance tests (~45 min)
- **04:55–05:10** — Product reviews + signs off (~15 min)
- **05:10** — Phase 1 SHIPPED ✅

**Target completion:** ~1 hour from now (within Cycle 4)

---

## SUCCESS LOOKS LIKE

✅ All 7 acceptance criteria in test-report.md showing "PASSED"  
✅ No security warnings (token audit clean)  
✅ QA signature + timestamp on test-report.md  
✅ Product approval + sign-off  
✅ Commit pushed to main  
✅ Ready to announce "Phase 1 complete"

---

## READY? WAIT FOR OPS.

Code is complete. Tests are written. Everyone's ready to move.

Just waiting on: `GATEWAY_TOKEN`

🔴 **OPS: Provide GATEWAY_TOKEN** → Everything unblocks in sequence.

---

**Current Status:** 🟢 READY TO SHIP  
**Blocker:** 🔴 Waiting on ops  
**Action Item:** Message ops for token  
**Estimated Ship Time:** Today (2026-02-21 05:00–06:00 Moscow)
