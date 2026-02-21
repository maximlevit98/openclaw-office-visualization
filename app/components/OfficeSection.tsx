"use client";

import React, { useState, useEffect } from "react";
import { Agent } from "@/lib/types";
import { OfficePanel } from "./OfficePanel";
import { OfficeStrip } from "./OfficeStrip";

interface OfficeSectionProps {
  agents: Agent[];
  loading: boolean;
  onAgentClick?: (agentId: string) => void;
}

/**
 * Responsive office section that switches between:
 * - OfficePanel (desktop, ≥1024px): vertical card layout
 * - OfficeStrip (tablet, 768-1023px): horizontal scrollable list
 * - Hidden (mobile, <768px): deferred to future cycle
 */
export function OfficeSection({
  agents,
  loading,
  onAgentClick,
}: OfficeSectionProps) {
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    // Detect viewport on mount and window resize
    const checkTablet = () => {
      setIsTablet(window.innerWidth < 1024);
    };

    checkTablet();
    window.addEventListener("resize", checkTablet);
    return () => window.removeEventListener("resize", checkTablet);
  }, []);

  // On tablet, show OfficeStrip; on desktop, show OfficePanel
  if (isTablet) {
    return (
      <OfficeStrip
        agents={agents}
        loading={loading}
        onAgentClick={onAgentClick}
      />
    );
  }

  return (
    <OfficePanel
      agents={agents}
      loading={loading}
      onAgentClick={onAgentClick}
    />
  );
}
