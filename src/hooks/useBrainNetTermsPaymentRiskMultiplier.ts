import { useState, useEffect } from 'react';

type NetTermsRiskMultiplierResult = {
  value: number;
  loading: boolean;
  error: Error | null;
  source: 'brain' | 'fallback';
};

type NetTermsRiskMultiplierContext = {
  payment_method?: string;
};

export function useBrainNetTermsPaymentRiskMultiplier(
  context: NetTermsRiskMultiplierContext,
  fallback: number
): NetTermsRiskMultiplierResult {
  const [value, setValue] = useState<number>(fallback);
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
            ruleName: 'net_terms_payment_risk_multiplier',
            context,
            fallback
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.success && result.value !== undefined) {
          setValue(result.value);
          setSource('brain');
        } else {
          setValue(fallback);
          setSource('fallback');
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
        setValue(fallback);
        setSource('fallback');
      } finally {
        setLoading(false);
      }
    };

    evaluateRule();
  }, [context.payment_method, fallback]);

  return {
    value,
    loading,
    error,
    source
  };
}