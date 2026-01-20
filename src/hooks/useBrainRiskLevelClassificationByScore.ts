import { useState, useEffect } from 'react';

type RiskLevel = 'critical' | 'high' | 'medium' | 'low';

interface UseBrainRiskLevelClassificationByScoreResult {
  riskLevel: RiskLevel;
  loading: boolean;
  error: string | null;
  source: 'brain' | 'fallback';
}

interface UseBrainRiskLevelClassificationByScoreParams {
  score: number;
  fallback: RiskLevel;
}

export function useBrainRiskLevelClassificationByScore({
  score,
  fallback
}: UseBrainRiskLevelClassificationByScoreParams): UseBrainRiskLevelClassificationByScoreResult {
  const [riskLevel, setRiskLevel] = useState<RiskLevel>(fallback);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<'brain' | 'fallback'>('fallback');

  useEffect(() => {
    let isCancelled = false;

    async function evaluateRiskLevel() {
      if (typeof score !== 'number' || isNaN(score)) {
        setRiskLevel(fallback);
        setSource('fallback');
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
            ruleName: 'risk_level_classification_by_score',
            context: { score },
            fallback
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (!isCancelled) {
          if (result.success && result.value) {
            setRiskLevel(result.value);
            setSource('brain');
          } else {
            setRiskLevel(fallback);
            setSource('fallback');
          }
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err instanceof Error ? err.message : 'Unknown error');
          setRiskLevel(fallback);
          setSource('fallback');
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    evaluateRiskLevel();

    return () => {
      isCancelled = true;
    };
  }, [score, fallback]);

  return {
    riskLevel,
    loading,
    error,
    source
  };
}