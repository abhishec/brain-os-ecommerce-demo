import { useState, useEffect } from 'react';

interface DiscountRates {
  holiday: number;
  summer_sale: number;
  black_friday: number;
}

interface UseBrainSeasonalDiscountRatesResult {
  discountRates: DiscountRates;
  loading: boolean;
  error: string | null;
  source: 'brain' | 'fallback';
}

interface UseBrainSeasonalDiscountRatesParams {
  promotionType?: string;
  fallback: DiscountRates;
}

export function useBrainSeasonalDiscountRates({
  promotionType,
  fallback
}: UseBrainSeasonalDiscountRatesParams): UseBrainSeasonalDiscountRatesResult {
  const [discountRates, setDiscountRates] = useState<DiscountRates>(fallback);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<'brain' | 'fallback'>('fallback');

  useEffect(() => {
    async function evaluateDiscountRates() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/brain/evaluate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            domain: 'pricing',
            rule: 'seasonal_discount_rates',
            context: {
              promotion_type: promotionType
            },
            fallback
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.success && result.data) {
          // Transform single discount rate to full rates object if needed
          if (typeof result.data === 'number' && promotionType) {
            const newRates = { ...fallback };
            if (promotionType in newRates) {
              newRates[promotionType as keyof DiscountRates] = result.data;
            }
            setDiscountRates(newRates);
          } else if (typeof result.data === 'object') {
            setDiscountRates({ ...fallback, ...result.data });
          } else {
            setDiscountRates(fallback);
          }
          setSource('brain');
        } else {
          setDiscountRates(fallback);
          setSource('fallback');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setDiscountRates(fallback);
        setSource('fallback');
      } finally {
        setLoading(false);
      }
    }

    evaluateDiscountRates();
  }, [promotionType, JSON.stringify(fallback)]);

  return {
    discountRates,
    loading,
    error,
    source
  };
}