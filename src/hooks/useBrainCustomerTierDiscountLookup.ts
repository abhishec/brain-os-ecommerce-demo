import { useState, useEffect } from 'react';

type CustomerTier = 'basic' | 'premium' | 'vip' | 'enterprise';

interface CustomerTierDiscountResult {
  discount: number;
  source: 'brain' | 'fallback';
  loading: boolean;
  error: string | null;
}

interface CustomerTierDiscountContext {
  customer_tier: CustomerTier;
}

export function useBrainCustomerTierDiscountLookup(
  context: CustomerTierDiscountContext,
  fallback: number
): CustomerTierDiscountResult {
  const [discount, setDiscount] = useState<number>(fallback);
  const [source, setSource] = useState<'brain' | 'fallback'>('fallback');
  const [loading, setLoading] = useState<boolean>(true);
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
            domain: 'pricing',
            ruleName: 'customer_tier_discount_lookup',
            context,
            fallback
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (isMounted) {
          if (result.success && typeof result.value === 'number') {
            setDiscount(result.value);
            setSource('brain');
          } else {
            setDiscount(fallback);
            setSource('fallback');
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Unknown error');
          setDiscount(fallback);
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
  }, [context.customer_tier, fallback]);

  return {
    discount,
    source,
    loading,
    error
  };
}