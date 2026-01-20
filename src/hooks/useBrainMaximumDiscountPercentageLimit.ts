import { useState, useEffect } from 'react';

interface MaximumDiscountPercentageLimitResult {
  value: number;
  source: 'brain' | 'fallback';
  loading: boolean;
  error: string | null;
}

export function useBrainMaximumDiscountPercentageLimit(
  fallback: number,
  requestedDiscountPercentage?: number
): MaximumDiscountPercentageLimitResult {
  const [result, setResult] = useState<MaximumDiscountPercentageLimitResult>({
    value: fallback,
    source: 'fallback',
    loading: false,
    error: null
  });

  useEffect(() => {
    let isCancelled = false;

    async function evaluateRule() {
      setResult(prev => ({ ...prev, loading: true, error: null }));

      try {
        const response = await fetch('/api/brain/evaluate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            domain: 'limits',
            rule: 'maximum_discount_percentage_limit',
            context: {
              requested_discount_percentage: requestedDiscountPercentage
            },
            fallback
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        
        if (!isCancelled) {
          setResult({
            value: data.result !== undefined ? data.result : fallback,
            source: data.result !== undefined ? 'brain' : 'fallback',
            loading: false,
            error: null
          });
        }
      } catch (error) {
        if (!isCancelled) {
          setResult({
            value: fallback,
            source: 'fallback',
            loading: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    }

    evaluateRule();

    return () => {
      isCancelled = true;
    };
  }, [fallback, requestedDiscountPercentage]);

  return result;
}