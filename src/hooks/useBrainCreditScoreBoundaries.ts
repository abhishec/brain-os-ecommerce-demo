import { useState, useEffect } from 'react';

interface CreditScoreBoundaries {
  max_score: number;
  min_score: number;
  base_score: number;
}

interface UseBrainCreditScoreBoundariesResult {
  boundaries: CreditScoreBoundaries;
  loading: boolean;
  error: string | null;
  source: 'brain' | 'fallback';
}

export function useBrainCreditScoreBoundaries(
  fallback: CreditScoreBoundaries,
  context: { scoring_request?: boolean } = {}
): UseBrainCreditScoreBoundariesResult {
  const [boundaries, setBoundaries] = useState<CreditScoreBoundaries>(fallback);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
            domain: 'risk',
            ruleName: 'credit_score_boundaries',
            context,
            fallback
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (isMounted) {
          if (result.success && result.data) {
            setBoundaries(result.data);
            setSource('brain');
          } else {
            setBoundaries(fallback);
            setSource('fallback');
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Unknown error');
          setBoundaries(fallback);
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
  }, [JSON.stringify(context), JSON.stringify(fallback)]);

  return {
    boundaries,
    loading,
    error,
    source
  };
}