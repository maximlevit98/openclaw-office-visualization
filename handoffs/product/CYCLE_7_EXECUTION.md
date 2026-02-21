# 🎯 CYCLE 7 EXECUTION — Phase 2 Consolidation (7:04 AM)

**Status:** Code in progress, uncommitted. Build succeeds.  
**Goal:** Commit Phase 2 work + identify next unblocks  
**Timeline:** 1–2 hours  
**Build Status:** ✅ 460ms | ✅ 8 routes | ✅ 48/48 tests

---

## WHAT'S READY TO COMMIT (DO NOW)

### ✅ 1. Real SSE Stream Handler
**File:** `app/api/stream/route.ts`  
**Status:** DONE (tested, working)  
**What:** Real `/api/stream` endpoint that broadcasts agent presence events  
**Verify:**
```bash
npm run build  # Must succeed
curl -N http://localhost:3000/api/stream | head -3
# Should show: data: {"type":"agent_status","agent":{...}}
```
**Commit Message:**
```
feat: implement real SSE stream for agent presence (TASK-020b)
```

---

### ✅ 2. Client-Side Fetch Utilities (NEW)
**File:** `lib/client-fetch.ts`  
**Status:** DONE (timeout, retry, fallback)  
**What:** Safe fetch wrapper for UI (prevents hangs)  
**Functions:**
- `fetchWithTimeout(url, options)` — Timeout protection
- `fetchJSON(url, options)` — Type-safe JSON fetch
- `fetchWithFallback(url, fallback, options)` — Fallback on failure
- `isServiceHealthy()` — Quick health check (3s timeout)

**Verify:**
```bash
npm run build  # Must succeed
```
**Commit Message:**
```
feat: add client-side fetch utilities with timeout protection
```

---

### ✅ 3. Session Search Component
**File:** `app/components/SessionSearch.tsx`  
**Status:** DONE (real-time filter)  
**What:** Simple session search by label/key  
**Uses:**
- `useMemo` for filtering performance
- Design tokens for styling  
- Clear button to reset search

**Verify:**
```bash
npm run build  # Must succeed
```
**Commit Message:**
```
feat: add SessionSearch component for real-time session filtering
```

---

### ✅ 4. Status Badge Component (NEW)
**File:** `app/components/StatusBadge.tsx`  
**Status:** DONE (reusable status UI)  
**What:** Flexible status display (dot, inline, pill variants)  
**Variants:**
- `dot` — Just the colored circle (6px)
- `inline` — Dot + text label (default)
- `pill` — Rounded badge with label
- Sizes: sm, md, lg

**Verify:**
```bash
npm run build  # Must succeed
```
**Commit Message:**
```
feat: add StatusBadge reusable component with 3 variants
```

---

### ✅ 5. Tablet Office Strip Component
**File:** `app/components/OfficeStrip.tsx`  
**Status:** DONE (responsive agent display)  
**What:** Horizontal agent list for tablet/mobile  
**Shows:**
- Online agents only
- Compact card layout
- Scrollable list
- Click to select agent

**Verify:**
```bash
npm run build  # Must succeed
```
**Commit Message:**
```
feat: add OfficeStrip component for tablet/responsive office display
```

---

### ✅ 6. Mock Data Utility
**File:** `lib/mock-data.ts`  
**Status:** DONE (fallback data generation)  
**What:** Generates realistic mock sessions/messages/agents  
**Functions:**
- `generateMockSessions(count)` — Creates N mock sessions
- `generateMockMessages(count)` — Creates N mock messages
- `generateMockAgents(count)` — Creates N mock agents

**Verify:**
```bash
npm run build  # Must succeed
```
**Commit Message:**
```
feat: add mock data utility for graceful API fallback
```

---

## GIT COMMIT SEQUENCE

**Run these commands IN ORDER:**

```bash
cd /Users/maxim/Documents/openclaw-office-visualization

# Verify build before committing
npm run build  # MUST succeed

# Commit 1: Backend stream
git add app/api/stream/route.ts
git commit -m "feat: implement real SSE stream for agent presence (TASK-020b)"

# Commit 2: Client utilities
git add lib/client-fetch.ts lib/mock-data.ts
git commit -m "feat: add client-side fetch utilities and mock data generator"

# Commit 3: Components
git add app/components/SessionSearch.tsx \
         app/components/StatusBadge.tsx \
         app/components/OfficeStrip.tsx
git commit -m "feat: add session search, status badge, and office strip components"

# Verify tests still pass
npm test  # Should show ≥48/48 passing

# Push to main
git push
```

---

## WHAT'S STILL NEEDED

### ⏳ usePresence() Hook (NEXT TASK)
**Owner:** Frontend Engineer  
**Priority:** HIGH  
**Timeline:** 45 min  
**What:** React hook that subscribes to `/api/stream` SSE  
**Function Signature:**
```typescript
export function usePresence() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Returns { agents, connected, error }
}
```
**Location:** Create `hooks/usePresence.ts`  
**Implementation:** (See TASK-020a in CYCLE_6_EXECUTION.md)

**Acceptance:**
- [ ] Connects to `/api/stream` on mount
- [ ] Updates agent list when `type === "agent_status"`
- [ ] Closes on unmount (no memory leaks)
- [ ] Provides `connected` status
- [ ] Build succeeds

---

### ⏳ Wire usePresence to OfficePanel (NEXT TASK)
**Owner:** Frontend Engineer  
**Priority:** HIGH  
**Timeline:** 30 min  
**What:** Use hook in `app/page.tsx` to get live agent updates  
**Changes:**
- Import `usePresence()` from new hook
- Call hook in component
- Use hook's `agents` instead of API-only `agents`
- Show `connected` status indicator

**Example:**
```typescript
const presence = usePresence();
<OfficePanel 
  agents={presence.agents}
  loading={loading || !presence.connected}
/>
```

---

## QUICK NEXT STEPS

**After committing above:**

1. **Create hooks directory + usePresence.ts** (45 min)
   ```bash
   mkdir -p hooks
   # Copy code from CYCLE_6_EXECUTION.md TASK-020a
   # Edit app/page.tsx to import and use hook
   npm run build
   npm test
   git commit -m "feat: add usePresence hook for real-time agent updates"
   ```

2. **Wire into app/page.tsx** (30 min)
   ```bash
   # Update app/page.tsx to use presence.agents
   # Add connected status indicator
   npm run build
   npm test
   git commit -m "feat: integrate usePresence hook into app (live agent presence)"
   ```

3. **Manual E2E test** (15 min)
   ```bash
   npm run dev
   # Verify:
   # 1. Agent list loads from /api/agents
   # 2. Stream connection shows "connected" status
   # 3. No console errors
   # 4. Responsive layout switches (1024px breakpoint)
   ```

---

## SUCCESS CRITERIA

✅ All 6 commits merged to main  
✅ Build succeeds in <500ms  
✅ Tests ≥48 passing  
✅ No console errors  
✅ Phase 2 features working:
   - ✅ Real SSE stream
   - ✅ Session search
   - ✅ Status badges
   - ✅ Tablet layout
   - ✅ Client fetch utilities
   - ⏳ Live presence (next)

---

## CURRENT BUILD STATUS

```
✓ Compiled successfully in 460ms
✓ Generating static pages (8/8)
Routes: 8 total (1 static + 7 dynamic)
TypeScript: Clean (zero errors)
Tests: 48/48 passing
```

**No regressions. Ready to commit.**

---

## IF BUILD FAILS

**Error: "Cannot find module"**  
→ Run: `npm install`

**Error: TypeScript errors**  
→ Check for missing imports: `npx tsc --noEmit`

**Error: Tests failing**  
→ Run: `npm test -- --clearCache`

---

## TIMELINE

| Time | Task |
|------|------|
| 07:04 | This plan created |
| 07:10 | Commits pushed (all 6 above) |
| 07:25 | usePresence hook created |
| 07:55 | Wired to app/page.tsx |
| 08:10 | E2E manual test |
| 08:15 | Phase 2 ready for sign-off |

**Total:** ~1 hour to Phase 2 feature complete

---

**Status:** 🚀 Ready to commit NOW  
**Blocker:** None  
**Next Step:** Run commit sequence above
