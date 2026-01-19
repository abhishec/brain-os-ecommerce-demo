import { useState, useEffect } from 'react';

interface UseBrainMaximumTotalDiscountLimitResult {
  isAllowed: boolean;
  source: 'brain' | 'fallback';
  loading: boolean;
  error: string | null;
}

export function useBrainMaximumTotalDiscountLimit(
  totalDiscountPercentage: number,
  fallback: boolean = true
): UseBrainMaximumTotalDiscountLimitResult {
  const [result, setResult] = useState<boolean>(fallback);
  const [source, setSource] = useState<'brain' | 'fallback'>('fallback');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function evaluateRule() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/brain/evaluate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            domain: 'limits',
            ruleName: 'maximum_total_discount_limit',
            context: {
              total_discount_percentage: totalDiscountPercentage
            },
            fallback
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (isMounted) {
          if (data.success && data.result !== undefined) {
            setResult(data.result);
            setSource('brain');
          } else {
            setResult(fallback);
            setSource('fallback');
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Unknown error');
          setResult(fallback);
          setSource('fallback');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    evaluateRule();

    return () => {
      isMounted = false;
    };
  }, [totalDiscountPercentage, fallback]);

  return {
    isAllowed: result,
    source,
    loading,
    error
  };
}