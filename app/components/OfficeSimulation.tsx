"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Agent } from "@/lib/types";
import {
  COLORS,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
  getAvatarColor,
  getStatusColor,
} from "@/lib/design-tokens";
import { Locale } from "@/lib/i18n";

interface OfficeSimulationProps {
  agents: Agent[];
  loading: boolean;
  selectedAgentId?: string | null;
  onAgentClick?: (agentId: string) => void;
  locale: Locale;
}

interface ActorState {
  id: string;
  name: string;
  status?: Agent["status"];
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  task: string;
  color: string;
}

interface OfficeZone {
  id: string;
  title: string;
  x: number;
  y: number;
  w: number;
  h: number;
  tone: string;
}

interface Point {
  x: number;
  y: number;
}

const ZONES_BY_LOCALE: Record<Locale, OfficeZone[]> = {
  en: [
    { id: "dev", title: "DEV DESKS", x: 5, y: 10, w: 42, h: 46, tone: "#f7e38c" },
    { id: "review", title: "REVIEW ROOM", x: 52, y: 10, w: 42, h: 30, tone: "#b0f1e3" },
    { id: "server", title: "SERVER RACK", x: 52, y: 44, w: 20, h: 32, tone: "#b8d4ff" },
    { id: "coffee", title: "COFFEE", x: 74, y: 44, w: 20, h: 20, tone: "#ffd8a8" },
    { id: "lounge", title: "LOUNGE", x: 5, y: 60, w: 42, h: 26, tone: "#d5c8ff" },
  ],
  ru: [
    { id: "dev", title: "РАБОЧИЕ СТОЛЫ", x: 5, y: 10, w: 42, h: 46, tone: "#f7e38c" },
    { id: "review", title: "ЗАЛ РЕВЬЮ", x: 52, y: 10, w: 42, h: 30, tone: "#b0f1e3" },
    { id: "server", title: "СЕРВЕРНАЯ", x: 52, y: 44, w: 20, h: 32, tone: "#b8d4ff" },
    { id: "coffee", title: "КОФЕ", x: 74, y: 44, w: 20, h: 20, tone: "#ffd8a8" },
    { id: "lounge", title: "ЛАУНЖ", x: 5, y: 60, w: 42, h: 26, tone: "#d5c8ff" },
  ],
};

const DESK_ANCHORS: Point[] = [
  { x: 14, y: 22 },
  { x: 27, y: 22 },
  { x: 40, y: 22 },
  { x: 14, y: 40 },
  { x: 27, y: 40 },
  { x: 40, y: 40 },
];

const REVIEW_ANCHORS: Point[] = [
  { x: 60, y: 20 },
  { x: 73, y: 20 },
  { x: 86, y: 20 },
  { x: 66, y: 32 },
  { x: 80, y: 32 },
];

const SERVER_ANCHORS: Point[] = [
  { x: 60, y: 52 },
  { x: 66, y: 60 },
];

const COFFEE_ANCHORS: Point[] = [
  { x: 78, y: 50 },
  { x: 90, y: 50 },
  { x: 84, y: 58 },
];

const LOUNGE_ANCHORS: Point[] = [
  { x: 14, y: 70 },
  { x: 28, y: 72 },
  { x: 40, y: 72 },
];

const EXIT_ANCHORS: Point[] = [
  { x: 95, y: 84 },
  { x: 92, y: 90 },
];

const TASKS: Record<Locale, { busy: string[]; online: string[]; idle: string[]; offline: string }> =
  {
    en: {
      busy: ["BUILDING", "DEPLOY", "HOTFIX", "REVIEWING"],
      online: ["CODING", "PAIRING", "DOCS", "SYNC"],
      idle: ["IDLE", "COFFEE", "READING", "PLANNING"],
      offline: "OFFLINE",
    },
    ru: {
      busy: ["СБОРКА", "ДЕПЛОЙ", "ФИКС", "РЕВЬЮ"],
      online: ["КОДИНГ", "ПАРА", "ДОКИ", "СИНК"],
      idle: ["ОЖИДАНИЕ", "КОФЕ", "ЧТЕНИЕ", "ПЛАН"],
      offline: "ОФФЛАЙН",
    },
  };

const TEXT = {
  en: {
    title: "OFFICE SIMULATION",
    agents: "AGENTS",
    active: "ACTIVE",
    spawning: "SPAWNING OFFICE...",
    empty: "NO AGENTS CONNECTED",
  },
  ru: {
    title: "СИМУЛЯЦИЯ ОФИСА",
    agents: "АГЕНТЫ",
    active: "АКТИВНЫ",
    spawning: "ЗАПУСК ОФИСА...",
    empty: "НЕТ ПОДКЛЮЧЕННЫХ АГЕНТОВ",
  },
} as const;

export function OfficeSimulation({
  agents,
  loading,
  selectedAgentId,
  onAgentClick,
  locale,
}: OfficeSimulationProps) {
  const [actors, setActors] = useState<ActorState[]>([]);
  const t = TEXT[locale];
  const zones = ZONES_BY_LOCALE[locale];

  const onlineCount = useMemo(
    () => agents.filter((agent) => agent.status === "online" || agent.status === "busy").length,
    [agents]
  );

  useEffect(() => {
    if (agents.length === 0) {
      setActors([]);
      return;
    }

    setActors((previous) =>
      agents.map((agent, index) => {
        const existing = previous.find((item) => item.id === agent.id);
        if (existing) {
          return {
            ...existing,
            status: agent.status,
            name: agent.name || agent.id,
            color: getAvatarColor(agent.name || agent.id),
          };
        }

        const spawn = DESK_ANCHORS[index % DESK_ANCHORS.length];
        return {
          id: agent.id,
          name: agent.name || agent.id,
          status: agent.status,
          x: spawn.x,
          y: spawn.y,
          targetX: spawn.x,
          targetY: spawn.y,
          task: deriveTask(agent.status, locale),
          color: getAvatarColor(agent.name || agent.id),
        };
      })
    );
  }, [agents, locale]);

  useEffect(() => {
    if (actors.length === 0) return;

    const intentTimer = window.setInterval(() => {
      setActors((current) =>
        current.map((actor, index) => {
          const nextTarget = chooseTarget(actor.status, index);
          return {
            ...actor,
            targetX: nextTarget.x,
            targetY: nextTarget.y,
            task: deriveTask(actor.status, locale),
          };
        })
      );
    }, 2600);

    return () => window.clearInterval(intentTimer);
  }, [actors.length, locale]);

  useEffect(() => {
    if (actors.length === 0) return;

    const movementTimer = window.setInterval(() => {
      setActors((current) =>
        current.map((actor) => {
          const dx = actor.targetX - actor.x;
          const dy = actor.targetY - actor.y;
          const distance = Math.hypot(dx, dy);

          if (distance < 0.2) return actor;

          const step = Math.min(1.5, distance);
          const ratio = step / distance;
          const nextX = clamp(actor.x + dx * ratio, 4, 96);
          const nextY = clamp(actor.y + dy * ratio, 8, 92);

          return {
            ...actor,
            x: nextX,
            y: nextY,
          };
        })
      );
    }, 120);

    return () => window.clearInterval(movementTimer);
  }, [actors.length]);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>{t.title}</h2>
        <div style={styles.stats}>
          <StatChip label={t.agents} value={String(agents.length)} />
          <StatChip label={t.active} value={String(onlineCount)} />
        </div>
      </div>

      <div style={styles.floor}>
        {zones.map((zone) => (
          <div
            key={zone.id}
            style={{
              ...styles.zone,
              left: `${zone.x}%`,
              top: `${zone.y}%`,
              width: `${zone.w}%`,
              height: `${zone.h}%`,
              backgroundColor: zone.tone,
            }}
          >
            <span style={styles.zoneTitle}>{zone.title}</span>
          </div>
        ))}

        {loading ? (
          <div style={styles.loadingOverlay}>{t.spawning}</div>
        ) : actors.length === 0 ? (
          <div style={styles.loadingOverlay}>{t.empty}</div>
        ) : (
          actors.map((actor) => {
            const isSelected = actor.id === selectedAgentId;
            const statusColor = getStatusColor(actor.status);
            return (
              <button
                key={actor.id}
                type="button"
                style={{
                  ...styles.actor,
                  left: `${actor.x}%`,
                  top: `${actor.y}%`,
                  borderColor: statusColor,
                  boxShadow: isSelected ? SHADOWS.hover : SHADOWS.card,
                }}
                onClick={() => onAgentClick?.(actor.id)}
                title={`${actor.name} · ${actor.task}`}
              >
                <div style={{ ...styles.actorBody, backgroundColor: actor.color }}>
                  <span style={styles.actorFace}>{getGlyph(actor.id, actor.name)}</span>
                </div>
                <div style={styles.actorTag}>
                  <span style={styles.actorName}>{shorten(actor.name)}</span>
                  <span style={styles.actorTask}>{actor.task}</span>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.statChip}>
      <span style={styles.statLabel}>{label}</span>
      <span style={styles.statValue}>{value}</span>
    </div>
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function deriveTask(status: Agent["status"] | undefined, locale: Locale): string {
  const pack = TASKS[locale];
  if (status === "busy") return pick(pack.busy);
  if (status === "idle") return pick(pack.idle);
  if (status === "offline") return pack.offline;
  return pick(pack.online);
}

function chooseTarget(status: Agent["status"] | undefined, index: number): Point {
  if (status === "offline") {
    return pickByIndex(EXIT_ANCHORS, index);
  }

  if (status === "idle") {
    return Math.random() > 0.5
      ? pickByIndex(LOUNGE_ANCHORS, index)
      : pickByIndex(COFFEE_ANCHORS, index);
  }

  if (status === "busy") {
    const pool = Math.random() > 0.5 ? REVIEW_ANCHORS : SERVER_ANCHORS;
    return pickByIndex(pool, index + Math.floor(Math.random() * 3));
  }

  const roulette = Math.random();
  if (roulette < 0.6) return pickByIndex(DESK_ANCHORS, index + 1);
  if (roulette < 0.85) return pickByIndex(REVIEW_ANCHORS, index + 2);
  return pickByIndex(COFFEE_ANCHORS, index + 3);
}

function pick(items: string[]): string {
  return items[Math.floor(Math.random() * items.length)];
}

function pickByIndex(points: Point[], index: number): Point {
  return points[index % points.length];
}

function shorten(value: string): string {
  if (value.length <= 11) return value.toUpperCase();
  return `${value.slice(0, 9).toUpperCase()}..`;
}

function getGlyph(id: string, name: string): string {
  const seed = `${id}-${name}`.toLowerCase();
  if (seed.includes("front")) return "F";
  if (seed.includes("back")) return "B";
  if (seed.includes("design")) return "D";
  if (seed.includes("test")) return "Q";
  if (seed.includes("debug")) return "X";
  if (seed.includes("prod")) return "P";
  return name.charAt(0).toUpperCase();
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column" as const,
    height: "100%",
    width: "100%",
    backgroundColor: COLORS.bgSurface,
    borderRight: `3px solid ${COLORS.borderDefault}`,
    boxShadow: SHADOWS.panel,
    overflow: "hidden",
  } as React.CSSProperties,

  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACING.md,
    padding: SPACING.lg,
    borderBottom: `3px solid ${COLORS.borderDefault}`,
    backgroundColor: COLORS.bgPrimary,
  } as React.CSSProperties,

  title: {
    margin: 0,
    fontSize: TYPOGRAPHY.textSm,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.weight600,
  } as React.CSSProperties,

  stats: {
    display: "flex",
    alignItems: "center",
    gap: SPACING.sm,
  } as React.CSSProperties,

  statChip: {
    display: "flex",
    alignItems: "center",
    gap: SPACING.xs,
    padding: `${SPACING.xs} ${SPACING.sm}`,
    border: `2px solid ${COLORS.borderDefault}`,
    backgroundColor: COLORS.bgSurface,
    boxShadow: SHADOWS.card,
  } as React.CSSProperties,

  statLabel: {
    fontSize: "9px",
    color: COLORS.textSecondary,
  } as React.CSSProperties,

  statValue: {
    fontSize: TYPOGRAPHY.textXs,
    color: COLORS.textPrimary,
  } as React.CSSProperties,

  floor: {
    position: "relative" as const,
    flex: 1,
    backgroundColor: "#d5ef9f",
    backgroundImage:
      "linear-gradient(rgba(26, 34, 56, 0.16) 1px, transparent 1px), linear-gradient(90deg, rgba(26, 34, 56, 0.16) 1px, transparent 1px)",
    backgroundSize: "24px 24px",
    overflow: "hidden",
  } as React.CSSProperties,

  zone: {
    position: "absolute" as const,
    border: `3px solid ${COLORS.borderDefault}`,
    boxShadow: SHADOWS.card,
    padding: SPACING.xs,
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "flex-start",
  } as React.CSSProperties,

  zoneTitle: {
    fontSize: "9px",
    color: COLORS.textPrimary,
    backgroundColor: COLORS.bgSurface,
    border: `1px solid ${COLORS.borderDefault}`,
    padding: "2px 4px",
  } as React.CSSProperties,

  loadingOverlay: {
    position: "absolute" as const,
    left: "50%",
    top: "50%",
    transform: "translate(-50%, -50%)",
    padding: `${SPACING.sm} ${SPACING.md}`,
    border: `3px solid ${COLORS.borderDefault}`,
    backgroundColor: COLORS.bgSurface,
    boxShadow: SHADOWS.panel,
    fontSize: TYPOGRAPHY.textSm,
    color: COLORS.textPrimary,
  } as React.CSSProperties,

  actor: {
    position: "absolute" as const,
    transform: "translate(-50%, -50%)",
    border: `2px solid ${COLORS.borderDefault}`,
    backgroundColor: COLORS.bgSurface,
    boxShadow: SHADOWS.card,
    padding: "3px",
    display: "flex",
    alignItems: "center",
    gap: "4px",
    cursor: "pointer",
    color: COLORS.textPrimary,
    animation: "pixelPulse 1.1s steps(2, end) infinite",
  } as React.CSSProperties,

  actorBody: {
    width: "20px",
    height: "20px",
    border: `2px solid ${COLORS.borderDefault}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  } as React.CSSProperties,

  actorFace: {
    fontSize: "9px",
    fontWeight: TYPOGRAPHY.weight600,
    color: COLORS.textPrimary,
  } as React.CSSProperties,

  actorTag: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "flex-start",
    gap: "1px",
    minWidth: 0,
  } as React.CSSProperties,

  actorName: {
    fontSize: "8px",
    lineHeight: 1.4,
    color: COLORS.textPrimary,
    whiteSpace: "nowrap" as const,
  } as React.CSSProperties,

  actorTask: {
    fontSize: "7px",
    lineHeight: 1.3,
    color: COLORS.textSecondary,
    whiteSpace: "nowrap" as const,
  } as React.CSSProperties,
} as const;
