import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * State hook persisted in web storage, so the admin UI (active tabs,
 * filters, search terms, expanded panels) survives tab switches and reloads.
 * Defaults to sessionStorage; pass 'local' for state that should also survive
 * closing and reopening the browser (e.g. the active admin tab).
 * Falls back to plain state when storage is unavailable.
 */
const PREFIX = 'lega-admin:';

type StorageKind = 'session' | 'local';

function getStore(kind: StorageKind): Storage | null {
  try {
    return kind === 'local' ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

function read<T>(key: string, fallback: T, kind: StorageKind): T {
  try {
    const raw = getStore(kind)?.getItem(PREFIX + key);
    if (raw === null || raw === undefined) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function usePersistentState<T>(key: string, initialValue: T, storage: StorageKind = 'session') {
  const [value, setValue] = useState<T>(() => read(key, initialValue, storage));
  const keyRef = useRef(key);

  // Re-hydrate when the storage key changes (e.g. per-item panels)
  useEffect(() => {
    if (keyRef.current !== key) {
      keyRef.current = key;
      setValue(read(key, initialValue, storage));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    try {
      getStore(storage)?.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
      /* storage full or unavailable — ignore */
    }
  }, [key, value, storage]);

  const set = useCallback((next: T | ((prev: T) => T)) => setValue(next), []);

  return [value, set] as const;
}

export default usePersistentState;
