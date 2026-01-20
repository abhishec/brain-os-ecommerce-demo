import { useState, useEffect } from 'react';

type GeographicRiskResult = {
  action: 'REJECT' | 'REVIEW';
  reason: string;
  risk_level: 'BLOCKED' | 'HIGH';
};

type BrainResult = {
  result: GeographicRiskResult;
  source: 'brain' | 'fallback';
  loading: boolean;
  error: string | null;
};

type TransactionContext = {
  country_code: string;
};

export function useBrainGeographicRiskAssessment(
  transaction: TransactionContext,
  fallback: GeographicRiskResult
): BrainResult {
  const [result, setResult] = useState<GeographicRiskResult>(fallback);
  const [source, setSource] = useState<'brain' | 'fallback'>('fallback');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function evaluateRule() {
      if (!transaction?.country_code) {
        return;
      }

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
            ruleName: 'geographic_risk_assessment',
            context: {
              transaction
            },
            fallback
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (isMounted) {
          if (data.result && typeof data.result === 'object') {
            setResult(data.result);
            setSource('brain');
          } else {
            // No match from brain, use fallback
            setResult(fallback);
            setSource('fallback');
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Unknown error');
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
  }, [transaction.country_code, fallback]);

  return {
    result,
    source,
    loading,
    error
  };
}