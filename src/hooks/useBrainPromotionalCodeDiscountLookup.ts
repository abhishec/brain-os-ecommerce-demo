import { useState, useEffect, useMemo } from 'react';
import { evaluate } from '@/lib/brain/evaluate';

type PromotionalCodeDiscountMap = {
  [key: string]: number;
};

type BrainResult = {
  data: PromotionalCodeDiscountMap;
  source: 'brain' | 'fallback';
  loading: boolean;
  error: Error | null;
};

export function useBrainPromotionalCodeDiscountLookup(
  fallback: PromotionalCodeDiscountMap
): BrainResult {
  const [data, setData] = useState<PromotionalCodeDiscountMap>(fallback);
  const [source, setSource] = useState<'brain' | 'fallback'>('fallback');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchBrainData = async () => {
      try {
        setLoading(true);
        setError(null);

        const result = await evaluate({
          domain: 'pricing',
          rule: 'promotional_code_discount_lookup',
          context: {},
          fallback
        });

        if (isMounted) {
          if (result && typeof result === 'object' && !Array.isArray(result)) {
            setData(result as PromotionalCodeDiscountMap);
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
    };

    fetchBrainData();

    return () => {
      isMounted = false;
    };
  }, [fallback]);

  return { data, source, loading, error };
}