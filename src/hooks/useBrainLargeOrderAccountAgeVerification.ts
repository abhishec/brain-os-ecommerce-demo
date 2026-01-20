import { useState, useEffect } from 'react';

interface UseBrainLargeOrderAccountAgeVerificationParams {
  orderTotal: number;
  accountAgeDays: number;
  fallback: boolean;
}

interface UseBrainLargeOrderAccountAgeVerificationResult {
  shouldVerify: boolean;
  loading: boolean;
  error: Error | null;
  source: 'brain' | 'fallback';
}

export function useBrainLargeOrderAccountAgeVerification({
  orderTotal,
  accountAgeDays,
  fallback
}: UseBrainLargeOrderAccountAgeVerificationParams): UseBrainLargeOrderAccountAgeVerificationResult {
  const [shouldVerify, setShouldVerify] = useState<boolean>(fallback);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [source, setSource] = useState<'brain' | 'fallback'>('fallback');

  useEffect(() => {
    let isMounted = true;

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
            domain: 'limits',
            ruleName: 'large_order_account_age_verification',
            context: {
              order_total: orderTotal,
              account_age_days: accountAgeDays
            },
            fallback
          }),
        });

        if (!response.ok) {
          throw new Error(`API request failed: ${response.status}`);
        }

        const result = await response.json();
        
        if (isMounted) {
          if (result.success && result.data !== undefined) {
            setShouldVerify(result.data);
            setSource('brain');
          } else {
            setShouldVerify(fallback);
            setSource('fallback');
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Unknown error'));
          setShouldVerify(fallback);
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
  }, [orderTotal, accountAgeDays, fallback]);

  return {
    shouldVerify,
    loading,
    error,
    source
  };
}