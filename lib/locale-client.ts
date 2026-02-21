"use client";

import { useCallback, useEffect, useState } from "react";
import {
  LOCALE_CHANGED_EVENT,
  LOCALE_STORAGE_KEY,
  Locale,
  applyDocumentLocale,
  isLocale,
  readStoredLocale,
  writeStoredLocale,
} from "@/lib/i18n";

type LocaleChangeEvent = CustomEvent<{ locale: Locale }>;

export function useSyncedLocale(defaultLocale: Locale = "en") {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);

  useEffect(() => {
    const initial = readStoredLocale(defaultLocale);
    setLocaleState(initial);
    applyDocumentLocale(initial);
  }, [defaultLocale]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== LOCALE_STORAGE_KEY) return;
      if (!isLocale(event.newValue)) return;
      setLocaleState(event.newValue);
      applyDocumentLocale(event.newValue);
    };

    const onLocaleChanged = (event: Event) => {
      const localeEvent = event as LocaleChangeEvent;
      const nextLocale = localeEvent.detail?.locale;
      if (!isLocale(nextLocale)) return;
      setLocaleState(nextLocale);
      applyDocumentLocale(nextLocale);
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener(LOCALE_CHANGED_EVENT, onLocaleChanged as EventListener);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(LOCALE_CHANGED_EVENT, onLocaleChanged as EventListener);
    };
  }, []);

  const setLocale = useCallback((nextLocale: Locale) => {
    setLocaleState(nextLocale);
    applyDocumentLocale(nextLocale);
    writeStoredLocale(nextLocale);
  }, []);

  return [locale, setLocale] as const;
}
