import { useState, useEffect } from 'react';

interface FirstTimeCustomerContext {
  isFirstOrder?: boolean;
  orderCount?: number;
}

interface FirstTimeCustomerResult {
  reason: string;
  discount: {
    name: string;
    type: string;
    amount: string;
  };
  eligible: boolean;
}

interface FirstTimeCustomerResponse {
  result: FirstTimeCustomerResult;
  source: 'brain' | 'fallback';
  loading: boolean;
  error?: Error;
}

export function useBrainFirstTimeCustomerEligibility(
  context: FirstTimeCustomerContext,
  fallback: FirstTimeCustomerResult
): FirstTimeCustomerResponse {
  const [result, setResult] = useState<FirstTimeCustomerResult>(fallback);
  const [source, setSource] = useState<'brain' | 'fallback'>('fallback');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | undefined>();

  useEffect(() => {
    let isCancelled = false;

    async function evaluate() {
      setLoading(true);
      setError(undefined);

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
          if (data.result !== null && data.result !== undefined) {
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
  }, [context.isFirstOrder, context.orderCount, fallback]);

  return {
    result,
    source,
    loading,
    error
  };
}