import { useState, useEffect } from 'react';

type PromotionType = 'holiday' | 'black_friday' | 'summer_sale';
type DiscountRates = Record<PromotionType, number>;
type BrainResult = {
  discountRates: DiscountRates;
  source: 'brain' | 'fallback';
  loading: boolean;
  error?: Error;
};

export function useBrainSeasonalDiscountRates(fallback: DiscountRates): BrainResult {
  const [result, setResult] = useState<BrainResult>({
    discountRates: fallback,
    source: 'fallback',
    loading: true,
    error: undefined
  });

  useEffect(() => {
    let isMounted = true;

    async function evaluateDiscountRates() {
      try {
        const response = await fetch('/api/brain/evaluate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            domain: 'pricing',
            rule: 'seasonal_discount_rates',
            context: {},
            fallback
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (isMounted) {
          setResult({
            discountRates: data.result || fallback,
            source: data.result ? 'brain' : 'fallback',
            loading: false,
            error: undefined
          });
        }
      } catch (error) {
        if (isMounted) {
          setResult({
            discountRates: fallback,
            source: 'fallback',
            loading: false,
            error: error instanceof Error ? error : new Error('Unknown error')
          });
        }
      }
    }

    evaluateDiscountRates();

    return () => {
      isMounted = false;
    };
  }, [fallback]);

  return result;
}