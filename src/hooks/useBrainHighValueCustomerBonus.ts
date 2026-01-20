import { useState, useEffect } from 'react';

interface HighValueCustomerBonusResult {
  bonus: number;
  source: 'brain' | 'fallback';
  loading: boolean;
  error: string | null;
}

interface HighValueCustomerBonusContext {
  lifetime_spend: number;
}

export function useBrainHighValueCustomerBonus(
  context: HighValueCustomerBonusContext,
  fallback: number = 25
): HighValueCustomerBonusResult {
  const [result, setResult] = useState<HighValueCustomerBonusResult>({
    bonus: fallback,
    source: 'fallback',
    loading: false,
    error: null
  });

  useEffect(() => {
    let isMounted = true;

    async function evaluateRule() {
      setResult(prev => ({ ...prev, loading: true, error: null }));

      try {
        const response = await fetch('/api/brain/evaluate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            domain: 'risk',
            rule: 'high_value_customer_bonus',
            context,
            fallback
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (isMounted) {
          if (data.success && data.result !== undefined) {
            setResult({
              bonus: data.result,
              source: 'brain',
              loading: false,
              error: null
            });
          } else {
            // No match or evaluation failed - use fallback
            setResult({
              bonus: fallback,
              source: 'fallback',
              loading: false,
              error: data.error || 'No matching rule found'
            });
          }
        }
      } catch (error) {
        if (isMounted) {
          // ZERO-IMPACT: Always fallback on any error
          setResult({
            bonus: fallback,
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
  }, [context.lifetime_spend, fallback]);

  return result;
}