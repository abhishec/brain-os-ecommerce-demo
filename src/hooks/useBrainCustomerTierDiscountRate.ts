import { useState, useEffect } from 'react';

type CustomerTier = 'basic' | 'premium' | 'vip' | 'enterprise';
type DiscountRate = number;

interface UseBrainCustomerTierDiscountRateResult {
  discountRate: DiscountRate;
  loading: boolean;
  error: Error | null;
  source: 'brain' | 'fallback';
}

interface UseBrainCustomerTierDiscountRateParams {
  customerTier: CustomerTier;
  fallback: DiscountRate;
}

export function useBrainCustomerTierDiscountRate({
  customerTier,
  fallback
}: UseBrainCustomerTierDiscountRateParams): UseBrainCustomerTierDiscountRateResult {
  const [discountRate, setDiscountRate] = useState<DiscountRate>(fallback);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [source, setSource] = useState<'brain' | 'fallback'>('fallback');

  useEffect(() => {
    let isCancelled = false;

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
            ruleName: 'customer_tier_discount_rate',
            context: {
              customer_tier: customerTier
            },
            fallback
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (!isCancelled) {
          if (result.success && result.value !== undefined) {
            setDiscountRate(result.value);
            setSource('brain');
          } else {
            setDiscountRate(fallback);
            setSource('fallback');
          }
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err instanceof Error ? err : new Error('Unknown error'));
          setDiscountRate(fallback);
          setSource('fallback');
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    evaluateRule();

    return () => {
      isCancelled = true;
    };
  }, [customerTier, fallback]);

  return {
    discountRate,
    loading,
    error,
    source
  };
}