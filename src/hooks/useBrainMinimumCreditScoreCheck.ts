import { useState, useEffect } from 'react';

interface CreditCheckResult {
  name: string;
  passed: boolean;
  message: string;
}

interface UseBrainMinimumCreditScoreCheckResult {
  result: CreditCheckResult | null;
  loading: boolean;
  error: Error | null;
  source: 'brain' | 'fallback';
}

interface UseBrainMinimumCreditScoreCheckParams {
  creditScore: number;
  fallback: CreditCheckResult | null;
  enabled?: boolean;
}

export function useBrainMinimumCreditScoreCheck({
  creditScore,
  fallback,
  enabled = true
}: UseBrainMinimumCreditScoreCheckParams): UseBrainMinimumCreditScoreCheckResult {
  const [result, setResult] = useState<CreditCheckResult | null>(fallback);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [source, setSource] = useState<'brain' | 'fallback'>('fallback');

  useEffect(() => {
    if (!enabled) {
      setResult(fallback);
      setSource('fallback');
      return;
    }

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
            domain: 'eligibility',
            ruleName: 'minimum_credit_score_check',
            context: { creditScore },
            fallback
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (isMounted) {
          // If brain returns a result, use it; otherwise use fallback
          if (data.result !== undefined && data.result !== null) {
            setResult(data.result);
            setSource('brain');
          } else {
            setResult(fallback);
            setSource('fallback');
          }
        }
      } catch (err) {
        console.warn('Brain evaluation failed, using fallback:', err);
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Unknown error'));
          setResult(fallback);
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
  }, [creditScore, fallback, enabled]);

  return { result, loading, error, source };
}