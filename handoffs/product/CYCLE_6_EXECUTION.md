# 🎯 CYCLE 6 EXECUTION — Phase 2 Implementation (05:04 AM)

**Timeline:** 2–3 hours  
**Goal:** Ship 3 concrete coding tasks (not docs)  
**Scope:** Phase 2 foundational work  
**Build Target:** Zero errors, all tests pass

---

## TOP 3 SHIPPABLE CODING TASKS

### 1️⃣ TASK-020a: `usePresence()` React Hook (Frontend)

**Owner:** Frontend Engineer  
**Priority:** CRITICAL (unblocks live agent updates)  
**Timeline:** 45 minutes  
**File Target:** `hooks/usePresence.ts` (create new)

**What to Build:**
A React hook that subscribes to the `/api/stream` SSE endpoint and emits presence events.

**Function Signature:**
```typescript
export function usePresence() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Subscribe to SSE on mount
  useEffect(() => {
    const eventSource = new EventSource("/api/stream");
    
    eventSource.onopen = () => setConnected(true);
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "agent_status") {
        // Update agent status
        setAgents(prev => updateAgentStatus(prev, data));
      }
    };
    eventSource.onerror = () => {
      setConnected(false);
      setError("Lost connection to presence stream");
    };
    
    return () => eventSource.close();
  }, []);
  
  return { agents, connected, error };
}
```

**Acceptance Criteria:**
- [ ] Hook connects to `/api/stream` on mount
- [ ] Parses incoming SSE messages as JSON
- [ ] Updates agent list when `type === "agent_status"`
- [ ] Closes connection on unmount (no memory leaks)
- [ ] Provides `connected` status for UI feedback
- [ ] Provides `error` field for error handling
- **Test:** `npm run build` succeeds, hook exports cleanly

**Commands:**
```bash
# Create hook file
cat > hooks/usePresence.ts << 'EOF'
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
            const updated = prev.map((a) =>
              a.id === data.agent.id ? { ...a, ...data.agent } : a
            );
            return updated.length > prev.length
              ? [...updated, data.agent]
              : updated;
          });
        }
      } catch (err) {
        console.error("Failed to parse presence event:", err);
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
EOF

# Verify build
npm run build
```

**Sign-Off:** ✅ Build succeeds, no TypeScript errors

---

### 2️⃣ TASK-020b: Real SSE Stream Handler (Backend)

**Owner:** Backend Engineer  
**Priority:** CRITICAL (provides live data)  
**Timeline:** 45 minutes  
**File Target:** `app/api/stream/route.ts` (enhance existing)

**What to Build:**
Replace stub SSE endpoint with real presence stream that broadcasts agent status changes.

**Current State (Stub):**
```typescript
// Currently: heartbeat-only, no real data
controller.enqueue(encoder.encode('data: {"type":"heartbeat"}\n\n'));
```

**Enhanced Implementation:**
```typescript
export async function GET(request: NextRequest) {
  // 1. Fetch initial agent list
  const agents = await listAgents();
  
  // 2. Create SSE stream
  const stream = new ReadableStream({
    async start(controller) {
      // Send initial agent state
      agents.forEach(agent => {
        controller.enqueue(encoder.encode(
          `data: ${JSON.stringify({ type: "agent_status", agent })}\n\n`
        ));
      });
      
      // Keep-alive heartbeat every 30 seconds
      const interval = setInterval(() => {
        controller.enqueue(encoder.encode(
          `data: ${JSON.stringify({ type: "heartbeat" })}\n\n`
        ));
      }, 30000);
      
      // Cleanup on client disconnect
      request.signal.addEventListener("abort", () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });
  
  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
```

**Acceptance Criteria:**
- [ ] Fetches initial agent list on client connect
- [ ] Sends each agent as `{"type": "agent_status", "agent": {...}}`
- [ ] Includes 30-second heartbeat to keep connection alive
- [ ] Closes stream cleanly on client disconnect
- [ ] No memory leaks (verified via Chrome DevTools)
- **Test:** `curl http://localhost:3000/api/stream` receives events

**Commands:**
```bash
# Edit app/api/stream/route.ts
# Replace the start() function with real agent streaming

# Verify
npm run build

# Test locally
npm run dev &
sleep 2
# In another terminal:
curl -N http://localhost:3000/api/stream | head -10
# Should see: data: {"type":"agent_status",...}
```

**Sign-Off:** ✅ Build succeeds, curl test shows real events

---

### 3️⃣ TASK-021a: Session Filter UI Component (Frontend)

**Owner:** Frontend Engineer  
**Priority:** IMPORTANT (Phase 2 polish)  
**Timeline:** 45 minutes  
**File Target:** `components/SessionFilter.tsx` (create new)

**What to Build:**
A filter UI for session sidebar: filter by kind (main/background), status (active/idle/offline).

**Component Signature:**
```typescript
interface SessionFilterProps {
  filters: SessionFilters;
  onFiltersChange: (filters: SessionFilters) => void;
}

interface SessionFilters {
  kinds: string[];       // ["main", "background"]
  statuses: string[];    // ["active", "idle", "offline"]
  searchText: string;    // text search in session labels
}

export function SessionFilter(props: SessionFilterProps) {
  // Render checkbox groups + text input
  // Call onFiltersChange when user updates filters
}
```

**UI Layout:**
```
┌─────────────────────┐
│ Session Filters     │
├─────────────────────┤
│ 🔍 Search...        │  [text input]
├─────────────────────┤
│ Kind                │
│  ☑ Main (3)         │  [checkbox]
│  ☐ Background (1)   │  [checkbox]
├─────────────────────┤
│ Status              │
│  ☑ Active (2)       │  [checkbox]
│  ☑ Idle (1)         │  [checkbox]
│  ☐ Offline (1)      │  [checkbox]
├─────────────────────┤
│ [Clear All] [Apply] │  [buttons]
└─────────────────────┘
```

**Acceptance Criteria:**
- [ ] Renders checkboxes for session kinds (main/background/etc)
- [ ] Renders checkboxes for session statuses (active/idle/offline)
- [ ] Text input for session name search
- [ ] Calls `onFiltersChange` when any filter changes
- [ ] Shows count in checkbox labels (e.g., "Main (3)")
- [ ] "Clear All" button resets filters
- **Test:** `npm run build` succeeds, no TS errors

**Commands:**
```bash
# Create filter component
cat > components/SessionFilter.tsx << 'EOF'
"use client";

import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from "@/lib/design-tokens";

export interface SessionFilters {
  kinds: string[];
  statuses: string[];
  searchText: string;
}

interface SessionFilterProps {
  filters: SessionFilters;
  onFiltersChange: (filters: SessionFilters) => void;
  availableKinds: string[];
  availableStatuses: string[];
}

export function SessionFilter({
  filters,
  onFiltersChange,
  availableKinds = [],
  availableStatuses = [],
}: SessionFilterProps) {
  const handleSearchChange = (text: string) => {
    onFiltersChange({ ...filters, searchText: text });
  };

  const handleKindToggle = (kind: string) => {
    const updated = filters.kinds.includes(kind)
      ? filters.kinds.filter((k) => k !== kind)
      : [...filters.kinds, kind];
    onFiltersChange({ ...filters, kinds: updated });
  };

  const handleStatusToggle = (status: string) => {
    const updated = filters.statuses.includes(status)
      ? filters.statuses.filter((s) => s !== status)
      : [...filters.statuses, status];
    onFiltersChange({ ...filters, statuses: updated });
  };

  const handleClearAll = () => {
    onFiltersChange({ kinds: [], statuses: [], searchText: "" });
  };

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>Filters</h3>

      {/* Search */}
      <input
        type="text"
        placeholder="Search sessions..."
        value={filters.searchText}
        onChange={(e) => handleSearchChange(e.target.value)}
        style={styles.input}
      />

      {/* Kinds */}
      <div style={styles.section}>
        <label style={styles.sectionTitle}>Kind</label>
        {availableKinds.map((kind) => (
          <label key={kind} style={styles.checkbox}>
            <input
              type="checkbox"
              checked={filters.kinds.includes(kind)}
              onChange={() => handleKindToggle(kind)}
            />
            {kind}
          </label>
        ))}
      </div>

      {/* Statuses */}
      <div style={styles.section}>
        <label style={styles.sectionTitle}>Status</label>
        {availableStatuses.map((status) => (
          <label key={status} style={styles.checkbox}>
            <input
              type="checkbox"
              checked={filters.statuses.includes(status)}
              onChange={() => handleStatusToggle(status)}
            />
            {status}
          </label>
        ))}
      </div>

      {/* Actions */}
      <button onClick={handleClearAll} style={styles.button}>
        Clear All
      </button>
    </div>
  );
}

const styles = {
  container: {
    padding: SPACING.md,
    borderTop: `1px solid ${COLORS.border.subtle}`,
  } as React.CSSProperties,
  title: {
    ...TYPOGRAPHY.sm,
    fontWeight: 600,
    marginBottom: SPACING.xs,
  } as React.CSSProperties,
  input: {
    width: "100%",
    padding: SPACING.xs,
    border: `1px solid ${COLORS.border.default}`,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.md,
  } as React.CSSProperties,
  section: {
    marginBottom: SPACING.md,
  } as React.CSSProperties,
  sectionTitle: {
    ...TYPOGRAPHY.xs,
    fontWeight: 600,
    color: COLORS.text.secondary,
    display: "block",
    marginBottom: SPACING.xs,
  } as React.CSSProperties,
  checkbox: {
    display: "flex",
    alignItems: "center",
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
    cursor: "pointer",
  } as React.CSSProperties,
  button: {
    width: "100%",
    padding: SPACING.sm,
    backgroundColor: COLORS.surface.tertiary,
    border: `1px solid ${COLORS.border.subtle}`,
    borderRadius: RADIUS.sm,
    cursor: "pointer",
    ...TYPOGRAPHY.sm,
  } as React.CSSProperties,
};
EOF

# Verify
npm run build
```

**Sign-Off:** ✅ Build succeeds, component exports cleanly

---

## EXECUTION CHECKLIST

### Backend Engineer (TASK-020b)
- [ ] Edit `app/api/stream/route.ts`
- [ ] Import `listAgents` from gateway-adapter
- [ ] Implement real agent streaming
- [ ] Test: `curl http://localhost:3000/api/stream | head -5`
- [ ] Run: `npm run build` (succeeds in <500ms)
- [ ] Commit: `feat: real SSE stream with agent presence`

### Frontend Engineer (TASK-020a + TASK-021a)
- [ ] Create `hooks/usePresence.ts` with EventSource subscription
- [ ] Create `components/SessionFilter.tsx` with filter UI
- [ ] Import both in relevant files (OfficePanel for hook, Sidebar for filter)
- [ ] Test: `npm run build` (zero errors)
- [ ] Verify: UI renders without console errors
- [ ] Commit: `feat: add presence hook and session filters (TASK-020a, TASK-021a)`

### QA/Tester
- [ ] Run tests: `npm test`
- [ ] Verify all tests still pass
- [ ] Manual smoke test:
  ```bash
  npm run dev &
  # Open http://localhost:3000
  # Verify: agent statuses update (if presence stream works)
  # Verify: filter UI renders and toggles work
  ```
- [ ] Commit test results if needed

### Product
- [ ] Review 3 commits above
- [ ] Verify: No regressions in build time or test count
- [ ] Approve: Phase 2a ready for Phase 2b + 2c

---

## SUCCESS CRITERIA

✅ All 3 tasks completed + committed  
✅ Build succeeds in <500ms  
✅ Zero TypeScript errors  
✅ Tests: ≥48 passing (no regressions)  
✅ Manual smoke test: No console errors  
✅ Git: 3 clean commits with descriptive messages  

**Estimated Time:** 2–3 hours  
**Estimated Completion:** 07:00–08:00 AM Moscow time

---

## IF YOU GET STUCK

**usePresence hook errors:**
```
SOLUTION: Check EventSource API available in client. Use "use client" directive.
```

**SSE stream not streaming:**
```
SOLUTION: Verify encoder.enqueue() format: "data: {json}\n\n" (exactly 2 newlines)
```

**SessionFilter not exporting:**
```
SOLUTION: Ensure export keyword before function declaration
```

---

## FILES CHECKLIST

After completion, these files should exist/be updated:

```
✅ hooks/usePresence.ts (new, 30–40 lines)
✅ components/SessionFilter.tsx (new, 80–100 lines)
✅ app/api/stream/route.ts (modified, real agent streaming)
✅ app/page.tsx (optionally: wire usePresence to OfficePanel)
```

---

## GIT COMMIT SEQUENCE

```bash
# Commit 1: Backend real stream
git add app/api/stream/route.ts
git commit -m "feat: real SSE stream with agent presence (TASK-020b)"

# Commit 2: Frontend hooks + components
git add hooks/usePresence.ts components/SessionFilter.tsx
git commit -m "feat: add usePresence hook and session filters (TASK-020a, TASK-021a)"

# Verify build + tests
npm run build
npm test

# Push
git push
```

---

**STATUS:** 🚀 Ready to start  
**BLOCKER:** None (all dependencies available)  
**SHIP WINDOW:** Today (2–3 hours)
