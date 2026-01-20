import { useState, useEffect } from 'react';

interface CustomerTierDiscount {
  discount: number;
  breakdown: string;
}

interface UseBrainCustomerTierDiscountPricingResult {
  discount: number;
  breakdown: string;
  source: 'brain' | 'fallback';
  isLoading: boolean;
  error: Error | null;
}

interface Customer {
  tier?: string;
}

interface Context {
  customer: Customer;
}

export function useBrainCustomerTierDiscountPricing(
  context: Context,
  fallback: CustomerTierDiscount
): UseBrainCustomerTierDiscountPricingResult {
  const [result, setResult] = useState<CustomerTierDiscount & { source: 'brain' | 'fallback' }>({
    ...fallback,
    source: 'fallback'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const evaluateRule = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/brain/evaluate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            domain: 'pricing',
            ruleName: 'customer_tier_discount_pricing',
            context,
            fallback
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (!isCancelled) {
          if (data.success && data.result) {
            setResult({
              discount: data.result.discount ?? fallback.discount,
              breakdown: data.result.breakdown ?? fallback.breakdown,
              source: 'brain'
            });
          } else {
            // No match or evaluation failed, use fallback
            setResult({
              ...fallback,
              source: 'fallback'
            });
          }
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err instanceof Error ? err : new Error('Unknown error'));
          setResult({
            ...fallback,
            source: 'fallback'
          });
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    evaluateRule();

    return () => {
      isCancelled = true;
    };
  }, [context.customer.tier, fallback.discount, fallback.breakdown]);

  return {
    discount: result.discount,
    breakdown: result.breakdown,
    source: result.source,
    isLoading,
    error
  };
}