import { useState, useEffect } from 'react';

interface AccountAgeCheckResult {
  reason: string;
  eligible: boolean;
  check_name: string;
}

interface UseBrainLargeOrderAccountAgeCheckResult {
  data: AccountAgeCheckResult | null;
  loading: boolean;
  error: Error | null;
  source: 'brain' | 'fallback';
}

interface Context {
  order_total: number;
  account_age_days: number;
}

export function useBrainLargeOrderAccountAgeCheck(
  context: Context,
  fallback: AccountAgeCheckResult | null
): UseBrainLargeOrderAccountAgeCheckResult {
  const [data, setData] = useState<AccountAgeCheckResult | null>(fallback);
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
            ruleName: 'large_order_account_age_check',
            context,
            fallback
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (!isCancelled) {
          if (result.matched && result.data) {
            setData(result.data);
            setSource('brain');
          } else {
            setData(fallback);
            setSource('fallback');
          }
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err instanceof Error ? err : new Error('Unknown error'));
          setData(fallback);
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
  }, [context.order_total, context.account_age_days, fallback]);

  return { data, loading, error, source };
}