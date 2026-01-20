import { useState, useEffect } from 'react';

type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

interface PaymentOverdueRiskThresholds {
  risk_level: RiskLevel;
  high_risk_threshold: number;
  medium_risk_threshold: number;
  critical_risk_threshold: number;
}

interface PaymentOverdueRiskResult {
  data: PaymentOverdueRiskThresholds;
  loading: boolean;
  error: Error | null;
  source: 'brain' | 'fallback';
}

interface PaymentOverdueContext {
  days_overdue?: number;
}

export function useBrainPaymentOverdueRiskThresholds(
  fallback: PaymentOverdueRiskThresholds,
  context: PaymentOverdueContext = {}
): PaymentOverdueRiskResult {
  const [data, setData] = useState<PaymentOverdueRiskThresholds>(fallback);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [source, setSource] = useState<'brain' | 'fallback'>('fallback');

  useEffect(() => {
    let isCancelled = false;

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
            rule: 'payment_overdue_risk_thresholds',
            context,
            fallback
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (!isCancelled) {
          if (result.success && result.data) {
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
  }, [JSON.stringify(context), JSON.stringify(fallback)]);

  return { data, loading, error, source };
}