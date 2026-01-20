import { useState, useEffect } from 'react';

type CategoryDiscountRates = Record<string, number>;

interface UseBrainCategoryDiscountRatesResult {
  data: CategoryDiscountRates;
  loading: boolean;
  error: Error | null;
  source: 'brain' | 'fallback';
}

export function useBrainCategoryDiscountRates(
  fallback: CategoryDiscountRates,
  context?: { product?: { category?: string } }
): UseBrainCategoryDiscountRatesResult {
  const [data, setData] = useState<CategoryDiscountRates>(fallback);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [source, setSource] = useState<'brain' | 'fallback'>('fallback');

  useEffect(() => {
    let isMounted = true;

    async function evaluateRule() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/brain/evaluate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            domain: 'pricing',
            ruleName: 'category_discount_rates',
            context: context || {},
            fallback
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (isMounted) {
          if (result.success && result.data) {
            setData(result.data);
            setSource('brain');
          } else {
            setData(fallback);
            setSource('fallback');
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Unknown error'));
          setData(fallback);
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
  }, [fallback, context]);

  return { data, loading, error, source };
}