import { useState, useEffect } from 'react';

type OverduePaymentResult = {
  risk_factors: {
    high: string;
    medium: string;
    critical: string;
  };
  score_adjustment: {
    high: number;
    medium: number;
    critical: number;
  };
};

type UseBrainOverduePaymentResult = {
  data: OverduePaymentResult;
  loading: boolean;
  error: Error | null;
  source: 'brain' | 'fallback';
};

export function useBrainOverduePaymentScoringPenalties(
  profile: { daysOverdue: number },
  fallback: OverduePaymentResult
): UseBrainOverduePaymentResult {
  const [data, setData] = useState<OverduePaymentResult>(fallback);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [source, setSource] = useState<'brain' | 'fallback'>('fallback');

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
            domain: 'risk',
            ruleName: 'overdue_payment_scoring_penalties',
            context: { profile },
            fallback
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (isMounted) {
          if (result.success && result.data) {
            setData(result.data);
            setSource('brain');
          } else {
            setData(fallback);
            setSource('fallback');
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Unknown error'));
          setData(fallback);
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
  }, [profile.daysOverdue, fallback]);

  return { data, loading, error, source };
}