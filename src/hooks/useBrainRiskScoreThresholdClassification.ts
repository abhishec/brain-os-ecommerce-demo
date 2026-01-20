import { useState, useEffect } from 'react';

type RiskClassification = {
  action: string;
  risk_level: string;
  low_threshold: number;
  high_threshold: number;
  medium_threshold: number;
};

type RiskClassificationResult = {
  data: RiskClassification;
  loading: boolean;
  error: Error | null;
  source: 'brain' | 'fallback';
};

type UseBrainRiskScoreThresholdClassificationParams = {
  risk_score: number;
  fallback: RiskClassification;
};

export function useBrainRiskScoreThresholdClassification({
  risk_score,
  fallback
}: UseBrainRiskScoreThresholdClassificationParams): RiskClassificationResult {
  const [data, setData] = useState<RiskClassification>(fallback);
  const [loading, setLoading] = useState(false);
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
            ruleName: 'risk_score_threshold_classification',
            context: {
              risk_score
            },
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
  }, [risk_score, fallback]);

  return {
    data,
    loading,
    error,
    source
  };
}