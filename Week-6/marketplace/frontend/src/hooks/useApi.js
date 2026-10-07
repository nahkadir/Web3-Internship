import { useEffect, useState } from "react";
import { api } from "../lib/api";

export function useApi(path, { enabled = true } = {}) {
  const [state, setState] = useState({
    data: null,
    error: null,
    loading: enabled,
  });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!enabled || !path) return;
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    api(path)
      .then(
        (data) => !cancelled && setState({ data, error: null, loading: false }),
      )
      .catch(
        (error) =>
          !cancelled && setState({ data: null, error, loading: false }),
      );
    return () => {
      cancelled = true;
    };
  }, [path, enabled, tick]);

  return { ...state, reload: () => setTick((t) => t + 1) };
}
