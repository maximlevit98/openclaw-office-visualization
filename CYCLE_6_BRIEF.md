# 🚀 CYCLE 6 EXECUTION BRIEF

**Time:** 2026-02-21 05:04 (Europe/Moscow)  
**Goal:** Ship 3 concrete coding tasks for Phase 2  
**Timeline:** 2–3 hours  
**Status:** 🎯 Ready to start NOW

---

## THE SITUATION

✅ Phase 1 approved by producer (commit 1ab6a05, 04:10 AM)  
✅ All 7 MVP acceptance criteria verified  
✅ Build: 481ms | Tests: 48/48 passing | TypeScript: clean  
🚀 **Phase 2: Ready to start immediately**

---

## TOP 3 TASKS (THIS CYCLE)

### 1. Backend: Real SSE Stream Handler (45 min)
**File:** `app/api/stream/route.ts`  
**What:** Replace heartbeat stub with real agent presence events  
**Owner:** Backend Engineer  
**Start:** Now  

### 2. Frontend: usePresence() Hook (45 min)
**File:** `hooks/usePresence.ts` (create new)  
**What:** React hook that subscribes to SSE stream  
**Owner:** Frontend Engineer  
**Start:** Now (no dependency on Task 1)

### 3. Frontend: Session Filters UI (45 min)
**File:** `components/SessionFilter.tsx` (create new)  
**What:** Checkbox filters for sidebar (kind, status, search)  
**Owner:** Frontend Engineer  
**Start:** Now (parallel to Task 2)

---

## EXECUTION GUIDE

**See:** `handoffs/product/CYCLE_6_EXECUTION.md`

For each task:
- ✅ Detailed implementation with copy/paste code
- ✅ Acceptance criteria checklist
- ✅ Test commands
- ✅ Git commit messages

---

## QUICK START COMMANDS

### Backend (45 min)
```bash
# Edit app/api/stream/route.ts
# Follow CYCLE_6_EXECUTION.md TASK-020b section
# Replace heartbeat stub with real agent streaming

npm run build                           # Verify build
curl http://localhost:3000/api/stream  # Test stream
git commit -m "feat: real SSE stream with agent presence"
```

### Frontend Hook (45 min)
```bash
# Create hooks/usePresence.ts
# Follow CYCLE_6_EXECUTION.md TASK-020a section

npm run build                           # Verify build
git commit -m "feat: add usePresence hook"
```

### Frontend Filters (45 min)
```bash
# Create components/SessionFilter.tsx
# Follow CYCLE_6_EXECUTION.md TASK-021a section

npm run build                           # Verify build
git commit -m "feat: add session filters UI"
```

---

## WHAT'S NOT NEEDED

❌ More docs  
❌ Specs or design documents  
❌ Meeting discussions  
❌ Code reviews before commit (commit early, review after)

Just: **Write code. Test. Commit. Move forward.**

---

## SUCCESS CRITERIA

✅ All 3 tasks completed + committed  
✅ Build succeeds (<500ms)  
✅ Tests pass (≥48)  
✅ No regressions  
✅ Clean git history

---

## TIMELINE

| Time | What |
|------|------|
| 05:04 | This brief + teams start coding |
| 05:45 | Backend finishes SSE handler + tests |
| 06:30 | Frontend finishes hook + filters + tests |
| 06:45 | Product reviews + verifies no regressions |
| 07:00 | Phase 2 exit gate ready |
| 07:15 | Phase 3 planning (optional) |

**Total:** 2–2.5 hours to Phase 2 exit

---

## BLOCKERS

🟢 **NONE.** All dependencies available. Code is ready to write.

---

## NEXT STEPS (IN ORDER)

1. **Backend Engineer:** Open CYCLE_6_EXECUTION.md → TASK-020b → Start coding
2. **Frontend Engineer:** Open CYCLE_6_EXECUTION.md → TASK-020a + TASK-021a → Start coding
3. **QA/Tester:** Standby. Once code is committed, run smoke tests
4. **Product:** Review commits + verify no regressions

---

## KEY FILES

📋 **Detailed guide:** `handoffs/product/CYCLE_6_EXECUTION.md`  
📋 **Task status:** `handoffs/product/task-board.md`  
📋 **Cycle status:** `handoffs/product/cycle-summary.md`

---

## SHIPPING MENTALITY

- ✅ Ship early, ship often
- ✅ Code now, document later
- ✅ Test as you go
- ✅ Commit frequently
- ✅ Keep it simple (no over-engineering)

---

**Ready?**

→ Open `handoffs/product/CYCLE_6_EXECUTION.md`  
→ Pick your task  
→ Start coding NOW

**🚀 GO FAST.**
