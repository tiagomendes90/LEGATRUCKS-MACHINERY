import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * State hook persisted in sessionStorage, so the admin UI (active tabs,
 * filters, search terms, expanded panels) survives tab switches and reloads.
 * Falls back to plain state when storage is unavailable.
 */
const PREFIX = 'lega-admin:';

function read<T>(key: string, fallback: T): T {
  try {
    const raw = sessionStorage.getItem(PREFIX + key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function usePersistentState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => read(key, initialValue));
  const keyRef = useRef(key);

  // Re-hydrate when the storage key changes (e.g. per-item panels)
  useEffect(() => {
    if (keyRef.current !== key) {
      keyRef.current = key;
      setValue(read(key, initialValue));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    try {
      sessionStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
      /* storage full or unavailable — ignore */
    }
  }, [key, value]);

  const set = useCallback((next: T | ((prev: T) => T)) => setValue(next), []);

  return [value, set] as const;
}

export default usePersistentState;
