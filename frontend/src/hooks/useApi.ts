import { useState, useEffect } from 'react';
import { ApiResponse } from '../types';

export function useApi<T>(apiFunc: () => Promise<ApiResponse<T>>, deps: any[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    apiFunc()
      .then((res) => {
        if (!isMounted) return;
        if (res.success && res.data !== undefined) {
          setData(res.data);
        } else {
          setError(res.error?.message || 'An error occurred while fetching data');
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || 'Network request failed');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, deps);

  return { data, loading, error };
}
