import { useCallback, useEffect, useState } from 'react';
import { isNetworkError } from './client';

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  /** True when the value came from the built-in demo dataset rather than the API. */
  demo: boolean;
}

/**
 * Loads data from the API, falling back to synthetic demo data if the backend is
 * unreachable. The `demo` flag drives the DEMO DATA banner so figures are never
 * presented as real operational data.
 */
export function useApiData<T>(
  loader: () => Promise<T>,
  fallback: T,
  deps: unknown[] = []
): AsyncState<T> & { reload: () => void } {
  const [state, setState] = useState<AsyncState<T>>({ data: null, loading: true, error: null, demo: false });
  const [nonce, setNonce] = useState(0);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    loader()
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null, demo: false });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (isNetworkError(err)) {
          setState({ data: fallback, loading: false, error: null, demo: true });
        } else {
          const message = err instanceof Error ? err.message : 'Unable to load records.';
          setState({ data: fallback, loading: false, error: message, demo: true });
        }
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce]);

  return { ...state, reload };
}
