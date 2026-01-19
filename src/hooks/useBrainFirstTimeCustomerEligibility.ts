import { useState, useEffect } from 'react';

interface FirstTimeCustomerResult {
  reason: string;
  discount: {
    name: string;
    type: string;
    amount: number;
  };
  eligible: boolean;
}

interface UseBrainFirstTimeCustomerEligibilityResult {
  result: FirstTimeCustomerResult | null;
  loading: boolean;
  error: Error | null;
  source: 'brain' | 'fallback';
}

interface Context {
  isFirstOrder?: boolean;
  orderCount?: number;
}

export function useBrainFirstTimeCustomerEligibility(
  context: Context,
  fallback: FirstTimeCustomerResult | null
): UseBrainFirstTimeCustomerEligibilityResult {
  const [result, setResult] = useState<FirstTimeCustomerResult | null>(fallback);
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
            domain: 'eligibility',
            ruleName: 'first_time_customer_eligibility',
            context,
            fallback
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (!isCancelled) {
          if (data.result !== undefined) {
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

    evaluateRule();

    return () => {
      isCancelled = true;
    };
  }, [context.isFirstOrder, context.orderCount, fallback]);

  return {
    result,
    loading,
    error,
    source
  };
}