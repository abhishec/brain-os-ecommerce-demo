import { useState, useEffect } from 'react';

interface NetTermsRiskResult {
  multiplier: number;
  source: 'brain' | 'fallback';
  loading: boolean;
  error?: string;
}

export function useBrainNetTermsPaymentRiskMultiplier(
  context: { payment_method?: string },
  fallback: number = 0.5
): NetTermsRiskResult {
  const [result, setResult] = useState<NetTermsRiskResult>({
    multiplier: fallback,
    source: 'fallback',
    loading: false
  });

  useEffect(() => {
    let isMounted = true;

    async function evaluateRule() {
      if (!context.payment_method) {
        setResult({
          multiplier: fallback,
          source: 'fallback',
          loading: false
        });
        return;
      }

      setResult(prev => ({ ...prev, loading: true }));

      try {
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
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        
        if (isMounted) {
          setResult({
            multiplier: data.result ?? fallback,
            source: data.matched ? 'brain' : 'fallback',
            loading: false
          });
        }
      } catch (error) {
        if (isMounted) {
          setResult({
            multiplier: fallback,
            source: 'fallback',
            loading: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    }

    evaluateRule();

    return () => {
      isMounted = false;
    };
  }, [context.payment_method, fallback]);

  return result;
}