import { useState, useEffect } from 'react';

type MinimumOrderValueResult = {
  value: number;
  source: 'brain' | 'fallback';
  loading: boolean;
  error: string | null;
};

export function useBrainMinimumOrderValueThreshold(fallback: number): MinimumOrderValueResult {
  const [result, setResult] = useState<MinimumOrderValueResult>({
    value: fallback,
    source: 'fallback',
    loading: false,
    error: null
  });

  useEffect(() => {
    let isMounted = true;

    const evaluateRule = async () => {
      try {
        setResult(prev => ({ ...prev, loading: true, error: null }));

        const response = await fetch('/api/evaluate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            domain: 'limits',
            rule: 'minimum_order_value_threshold',
            context: {},
            fallback
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (isMounted) {
          if (data.success && data.result !== undefined) {
            setResult({
              value: typeof data.result === 'number' ? data.result : fallback,
              source: 'brain',
              loading: false,
              error: null
            });
          } else {
            // No match or invalid result - use fallback
            setResult({
              value: fallback,
              source: 'fallback',
              loading: false,
              error: null
            });
          }
        }
      } catch (error) {
        if (isMounted) {
          // ZERO-IMPACT: Always return fallback on error
          setResult({
            value: fallback,
            source: 'fallback',
            loading: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    };

    evaluateRule();

    return () => {
      isMounted = false;
    };
  }, [fallback]);

  return result;
}