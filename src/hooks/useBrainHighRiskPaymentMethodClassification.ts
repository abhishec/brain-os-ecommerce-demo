import { useState, useEffect } from 'react';

interface RiskClassification {
  risk_level: string;
  risk_factor: string;
  payment_method_risk: boolean;
}

interface UseBrainHighRiskPaymentMethodClassificationResult {
  data: RiskClassification | null;
  loading: boolean;
  error: Error | null;
  source: 'brain' | 'fallback';
}

interface UseBrainHighRiskPaymentMethodClassificationParams {
  paymentMethod: string;
  fallback: RiskClassification | null;
}

export function useBrainHighRiskPaymentMethodClassification({
  paymentMethod,
  fallback
}: UseBrainHighRiskPaymentMethodClassificationParams): UseBrainHighRiskPaymentMethodClassificationResult {
  const [data, setData] = useState<RiskClassification | null>(fallback);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [source, setSource] = useState<'brain' | 'fallback'>('fallback');

  useEffect(() => {
    const evaluateRule = async () => {
      if (!paymentMethod) {
        setData(fallback);
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
            ruleName: 'high_risk_payment_method_classification',
            context: {
              payment_method: paymentMethod
            },
            fallback
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
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
        setError(err instanceof Error ? err : new Error('Unknown error'));
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