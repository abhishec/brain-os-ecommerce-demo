import { useState, useEffect } from 'react';

interface FailedPaymentRiskResult {
  flags: string[];
  score_increase: number;
  required_actions: string[];
}

interface UseBrainFailedPaymentRiskScoringResult {
  result: FailedPaymentRiskResult;
  loading: boolean;
  error: Error | null;
  source: 'brain' | 'fallback';
}

interface RiskFactors {
  failedPayments: number;
  [key: string]: any;
}

export function useBrainFailedPaymentRiskScoring(
  factors: RiskFactors,
  fallback: FailedPaymentRiskResult
): UseBrainFailedPaymentRiskScoringResult {
  const [result, setResult] = useState<FailedPaymentRiskResult>(fallback);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [source, setSource] = useState<'brain' | 'fallback'>('fallback');

  useEffect(() => {
    const evaluateRule = async () => {
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
            ruleName: 'failed_payment_risk_scoring',
            context: { factors },
            fallback
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.result !== undefined) {
          setResult(data.result);
          setSource('brain');
        } else {
          setResult(fallback);
          setSource('fallback');
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
        setResult(fallback);
        setSource('fallback');
      } finally {
        setLoading(false);
      }
    };

    evaluateRule();
  }, [factors.failedPayments, fallback]);

  return { result, loading, error, source };
}