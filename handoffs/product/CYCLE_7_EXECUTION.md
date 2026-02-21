# 🎯 CYCLE 7 EXECUTION — Phase 2 Final Push (06:04 AM)

**Previous Status:** TASK-020b (SSE stream) ✅ SHIPPED  
**Current Goal:** Complete remaining 2 tasks → Phase 2 EXIT GATE  
**Timeline:** 30–45 minutes  
**Build:** 511ms ✅ | No blockers

---

## STATUS UPDATE

### ✅ TASK-020b: Real SSE Stream
- **Status:** COMPLETE & COMMITTED
- **Commit:** 4aea0a2 "feat: real SSE stream with agent presence"
- **What Ships:** 
  - Fetches initial agent list on client connect
  - Broadcasts agent_status events (real data)
  - 30-second heartbeat + proper cleanup
  - Error handling + logging
- **Verified:** Build 511ms, zero TypeScript errors

### 🟡 TASK-020a: usePresence() Hook
- **Status:** NOT STARTED
- **Owner:** Frontend Engineer
- **Time:** 20 minutes
- **File:** Create `hooks/usePresence.ts`
- **What:** React hook that subscribes to `/api/stream` SSE
  - Connect to EventSource("/api/stream")
  - Parse incoming JSON events
  - Update agent list when type === "agent_status"
  - Close on unmount
  - Provide `connected` + `error` status

**Code Template (Copy & Paste):**
```typescript
"use client";
import { useEffect, useState } from "react";
import { Agent } from "@/lib/types";

export function usePresence() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const eventSource = new EventSource("/api/stream");

    eventSource.onopen = () => {
      setConnected(true);
      setError(null);
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "agent_status" && data.agent) {
          setAgents((prev) => {
            const idx = prev.findIndex((a) => a.id === data.agent.id);
            if (idx >= 0) {
              const updated = [...prev];
              updated[idx] = { ...updated[idx], ...data.agent };
              return updated;
            }
            return [...prev, data.agent];
          });
        }
      } catch (err) {
        console.error("Failed to parse stream event:", err);
      }
    };

    eventSource.onerror = () => {
      setConnected(false);
      setError("Connection lost");
      eventSource.close();
    };

    return () => eventSource.close();
  }, []);

  return { agents, connected, error };
}
```

**Acceptance:**
- [ ] Hook connects to EventSource("/api/stream")
- [ ] Parses JSON events from stream
- [ ] Updates agents on type === "agent_status"
- [ ] Closes connection on unmount
- [ ] Returns { agents, connected, error }
- [ ] Build succeeds: `npm run build`

### 🟡 TASK-021a: Session Filter
- **Status:** PARTIAL (SessionSearch component exists)
- **Owner:** Frontend Engineer
- **Time:** 15–20 minutes
- **What Exists:**
  - `components/SessionSearch.tsx` — text search for sessions
- **What's Needed:**
  - Wire SessionSearch into Sidebar component
  - OR: Extend SessionSearch to include checkbox filters (kind, status)
  - OR: Create minimal filter UI component
- **Quick Option (RECOMMENDED):**
  - Edit `components/Sidebar.tsx` to import + use SessionSearch
  - Show filtered results based on search query
  - Takes ~10 minutes

**Integration Instructions:**
```typescript
// In components/Sidebar.tsx:
import { SessionSearch } from "./SessionSearch";

// Add to Sidebar component render:
<SessionSearch 
  sessions={sessions} 
  selectedSession={selectedSession}
  onSelect={onSelectSession}
/>

// Use filtered sessions in list rendering
```

**Acceptance:**
- [ ] SessionSearch component is used in Sidebar
- [ ] Search filters sessions by label/key
- [ ] Selected session still works
- [ ] Build succeeds
- [ ] No console errors

---

## EXECUTION CHECKLIST

### Frontend Engineer (35–45 min total)

**Step 1: Create usePresence hook (20 min)**
```bash
# 1. Create file
cat > hooks/usePresence.ts << 'EOF'
[paste template from above]
EOF

# 2. Verify build
npm run build

# 3. Stage + commit
git add hooks/usePresence.ts
git commit -m "feat: add usePresence hook for real-time agent updates (TASK-020a)"
```

**Step 2: Integrate SessionSearch into Sidebar (15 min)**
```bash
# 1. Edit components/Sidebar.tsx
# Add import: import { SessionSearch } from "./SessionSearch";
# Add component to render method

# 2. Verify build
npm run build

# 3. Stage + commit
git add components/Sidebar.tsx components/SessionSearch.tsx
git commit -m "feat: add session search filtering (TASK-021a)"
```

### QA/Tester (optional, 5 min)
```bash
# After commits:
npm run dev
# Verify in browser:
# 1. Sidebar shows SessionSearch input
# 2. Typing filters sessions
# 3. Agent list still appears
# 4. No console errors
```

### Product (5 min)
```bash
# Review commits + verify:
# 1. Build succeeds (<520ms)
# 2. No new TypeScript errors
# 3. Only expected files modified
# 4. Commit messages clear

# If all pass: Phase 2 GATE READY
```

---

## PHASE 2 EXIT GATE (When All Done)

✅ TASK-020b shipped (SSE stream)  
✅ TASK-020a shipped (usePresence hook)  
✅ TASK-021a shipped (SessionSearch integration)  
✅ Build clean (<520ms)  
✅ No regressions  
✅ Git history clear  

→ **Phase 2 COMPLETE. Unblock Phase 3.**

---

## TIMELINE

| Time | What |
|------|------|
| 06:04 | This plan + frontend starts hook |
| 06:20 | Hook done + committed |
| 06:35 | SessionSearch integration done + committed |
| 06:40 | QA spot check (optional) |
| 06:45 | Product approves Phase 2 gate |

**Total:** 40 minutes

---

## KEYS TO SUCCESS

✅ **Don't over-engineer:** Hook is 30 lines, not complex  
✅ **SessionSearch already exists:** Just wire it in, don't rebuild  
✅ **Commit after each task:** Don't wait til end  
✅ **Verify build each time:** Catch issues early  
✅ **Keep going:** Phase 2 is in reach

---

## IF STUCK

**Hook won't connect to SSE:**
```
VERIFY: /api/stream is running (was just committed)
TEST: curl -N http://localhost:3000/api/stream (should show JSON events)
```

**SessionSearch not filtering:**
```
CHECK: Make sure onSelect callback is passed to SessionSearch
VERIFY: Search input is receiving onChange events
```

**Build fails:**
```
ERROR: Check TypeScript errors (npm run build shows them)
FIX: Usually missing import or type issue
```

---

## SUCCESS LOOKS LIKE

```bash
$ git log --oneline -3
abc1234 feat: add session search filtering (TASK-021a)
def5678 feat: add usePresence hook for real-time agent updates (TASK-020a)
4aea0a2 feat: real SSE stream with agent presence (TASK-020b)

$ npm run build
✓ Compiled successfully in 512ms
✓ Generating static pages (8/8)

[Browser] Sidebar shows search input + agent list updates in real-time
```

---

**Ready? Start with Step 1 above. You've got 40 minutes. 🚀**
