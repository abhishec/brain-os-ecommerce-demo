import { useState, useEffect } from 'react';

interface CustomerAgeRiskThresholds {
  risk_category: {
    new: string;
    very_new: string;
    established: string;
  };
  new_customer_threshold_days: number;
  very_new_customer_threshold_days: number;
}

interface UseBrainCustomerAgeRiskThresholdsResult {
  data: CustomerAgeRiskThresholds;
  loading: boolean;
  error: Error | null;
  source: 'brain' | 'fallback';
}

export const useBrainCustomerAgeRiskThresholds = (
  fallback: CustomerAgeRiskThresholds,
  context?: Record<string, any>
): UseBrainCustomerAgeRiskThresholdsResult => {
  const [data, setData] = useState<CustomerAgeRiskThresholds>(fallback);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [source, setSource] = useState<'brain' | 'fallback'>('fallback');

  useEffect(() => {
    const evaluateRule = async () => {
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
            ruleName: 'customer_age_risk_thresholds',
            context: context || {},
            fallback
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.success && result.data) {
          setData(result.data);
          setSource('brain');
        } else {
          // No match or evaluation failed - use fallback
          setData(fallback);
          setSource('fallback');
        }
      } catch (err) {
        // ZERO-IMPACT: Always return fallback on error
        setError(err instanceof Error ? err : new Error('Unknown error'));
        setData(fallback);
        setSource('fallback');
      } finally {
        setLoading(false);
      }
    };

    evaluateRule();
  }, [fallback, context]);

  return { data, loading, error, source };
};