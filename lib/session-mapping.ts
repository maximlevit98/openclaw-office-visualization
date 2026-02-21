import { Agent, Session } from "./types";

function normalizeForMatch(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Find the most likely session for a given agent by matching id/name/kind.
 */
export function findSessionForAgent(agent: Agent, sessions: Session[]): Session | undefined {
  const needles = [agent.id, agent.name || "", agent.kind || ""]
    .map(normalizeForMatch)
    .filter(Boolean);

  if (needles.length === 0) return undefined;

  return sessions.find((session) => {
    const haystack = normalizeForMatch(
      `${session.key} ${session.label || ""} ${session.kind || ""}`
    );

    return needles.some((needle) => haystack.includes(needle));
  });
}

export function toSearchIndex(...parts: Array<string | undefined>): string {
  return normalizeForMatch(parts.filter(Boolean).join(" "));
}
