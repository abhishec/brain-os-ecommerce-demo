import { useState, useEffect } from 'react';

interface HighRiskPaymentMethodResult {
  flags: string[];
  required_actions: string[];
  score_adjustment: number;
}

interface UseBrainHighRiskPaymentMethodScoringResult {
  data: HighRiskPaymentMethodResult | null;
  loading: boolean;
  error: string | null;
  source: 'brain' | 'fallback';
}

export function useBrainHighRiskPaymentMethodScoring(
  paymentMethod: string,
  fallback: HighRiskPaymentMethodResult | null
): UseBrainHighRiskPaymentMethodScoringResult {
  const [data, setData] = useState<HighRiskPaymentMethodResult | null>(fallback);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<'brain' | 'fallback'>('fallback');

  useEffect(() => {
    if (!paymentMethod) {
      setData(fallback);
      setSource('fallback');
      return;
    }

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
            ruleName: 'high_risk_payment_method_scoring',
            context: {
              factors: {
                paymentMethod
              }
            },
            fallback
          }),
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.success && result.data !== undefined) {
          setData(result.data);
          setSource('brain');
        } else {
          setData(fallback);
          setSource('fallback');
        }
      } catch (err) {
        console.warn('Brain evaluation failed, using fallback:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setData(fallback);
        setSource('fallback');
      } finally {
        setLoading(false);
      }
    };

    evaluateRule();
  }, [paymentMethod, fallback]);

  return { data, loading, error, source };
}