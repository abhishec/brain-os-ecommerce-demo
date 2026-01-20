import { useState, useEffect } from 'react';

type LoyaltyTierResult = {
  tier: string | null;
  discount: number;
  eligible: boolean;
  threshold: number;
};

type UseBrainResult = {
  result: LoyaltyTierResult;
  loading: boolean;
  error: Error | null;
  source: 'brain' | 'fallback';
};

type CustomerContext = {
  customer: {
    lifetime_spend: number;
  };
};

export function useBrainCustomerLoyaltyTierEligibility(
  context: CustomerContext,
  fallback: LoyaltyTierResult
): UseBrainResult {
  const [result, setResult] = useState<LoyaltyTierResult>(fallback);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [source, setSource] = useState<'brain' | 'fallback'>('fallback');

  useEffect(() => {
    let isCancelled = false;

    async function evaluate() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/brain/evaluate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            domain: 'eligibility',
            ruleName: 'customer_loyalty_tier_eligibility',
            context,
            fallback
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (!isCancelled) {
          if (data.result !== undefined && data.result !== null) {
            setResult(data.result);
            setSource('brain');
          } else {
            setResult(fallback);
            setSource('fallback');
          }
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err instanceof Error ? err : new Error('Unknown error'));
          setResult(fallback);
          setSource('fallback');
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    evaluate();

    return () => {
      isCancelled = true;
    };
  }, [context.customer.lifetime_spend, fallback]);

  return { result, loading, error, source };
}