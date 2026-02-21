export type Locale = "en" | "ru";

export const LOCALE_STORAGE_KEY = "openclaw-office-locale";
export const LOCALE_CHANGED_EVENT = "openclaw-office-locale-changed";

const STATUS_LABELS: Record<Locale, Record<string, string>> = {
  en: {
    online: "ONLINE",
    busy: "BUSY",
    idle: "IDLE",
    offline: "OFFLINE",
    active: "ACTIVE",
  },
  ru: {
    online: "ОНЛАЙН",
    busy: "ЗАНЯТ",
    idle: "ОЖИДАНИЕ",
    offline: "ОФФЛАЙН",
    active: "АКТИВЕН",
  },
};

export function isLocale(value: string | null): value is Locale {
  return value === "en" || value === "ru";
}

export function getStatusLabel(status: string | undefined, locale: Locale): string {
  if (!status) return locale === "ru" ? "ОФФЛАЙН" : "OFFLINE";
  return STATUS_LABELS[locale][status.toLowerCase()] || status.toUpperCase();
}

export function getLocaleButtonLabel(locale: Locale): string {
  return locale === "en" ? "EN" : "RU";
}

export function readStoredLocale(fallback: Locale = "en"): Locale {
  if (typeof window === "undefined") return fallback;
  const saved = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  return isLocale(saved) ? saved : fallback;
}

export function applyDocumentLocale(locale: Locale): void {
  if (typeof document === "undefined") return;
  document.documentElement.lang = locale;
}

export function writeStoredLocale(locale: Locale): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  window.dispatchEvent(
    new CustomEvent<{ locale: Locale }>(LOCALE_CHANGED_EVENT, {
      detail: { locale },
    })
  );
}
