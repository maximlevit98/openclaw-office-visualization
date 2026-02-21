/**
 * Custom React hooks for the office dashboard
 */

import { useEffect, useRef } from "react";

/**
 * useKeyboardShortcut: Listen for keyboard shortcuts (Ctrl+K, Cmd+K, etc.)
 * 
 * Example:
 *   useKeyboardShortcut({ key: "k", ctrl: true }, () => {
 *     console.log("Ctrl+K pressed");
 *   });
 */
export function useKeyboardShortcut(
  {
    key,
    ctrl = false,
    shift = false,
    alt = false,
    meta = false,
  }: {
    key: string;
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    meta?: boolean;
  },
  callback: () => void,
  enabled = true
) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const isKeyMatch = e.key.toLowerCase() === key.toLowerCase();
      const isCtrlMatch = ctrl === (e.ctrlKey || e.metaKey);
      const isShiftMatch = shift === e.shiftKey;
      const isAltMatch = alt === e.altKey;
      const isMetaMatch = meta === e.metaKey;

      if (
        isKeyMatch &&
        isCtrlMatch &&
        isShiftMatch &&
        isAltMatch &&
        isMetaMatch
      ) {
        e.preventDefault();
        callback();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [key, ctrl, shift, alt, meta, callback, enabled]);
}

/**
 * useFocus: Get a ref and auto-focus on mount or when `shouldFocus` changes
 */
export function useFocus<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  const focus = () => {
    ref.current?.focus();
  };

  return { ref, focus };
}

/**
 * useDebounce: Debounce a value with a delay
 */
export function useDebounce<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => clearTimeout(handler);
  }, [value, delayMs]);

  return debouncedValue;
}

/**
 * useLocalStorage: Sync state with localStorage
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = React.useState<T>(() => {
    try {
      const item =
        typeof window !== "undefined" ? window.localStorage.getItem(key) : null;
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error("Error reading from localStorage:", error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error("Error writing to localStorage:", error);
    }
  };

  return [storedValue, setValue];
}

// Add React import for hooks that need it
import React from "react";
