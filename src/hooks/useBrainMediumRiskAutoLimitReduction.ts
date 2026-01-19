import { useState, useEffect } from 'react';

interface LimitReductionResult {
  effectiveAutoLimit: number;
  conditions: string[];
  source: 'brain' | 'fallback';
}

interface LimitReductionContext {
  riskLevel: string;
  originalAutoLimit: number;
}

export function useBrainMediumRiskAutoLimitReduction(
  context: LimitReductionContext,
  fallback: LimitReductionResult
): LimitReductionResult {
  const [result, setResult] = useState<LimitReductionResult>({
    ...fallback,
    source: 'fallback'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function evaluateRule() {
      setLoading(true);
      
      try {
        const response = await fetch('/api/brain/evaluate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            domain: 'risk',
            ruleName: 'medium_risk_auto_limit_reduction',
            context,
            fallback
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (isMounted) {
          if (data.success && data.result) {
            setResult({
              ...data.result,
              source: 'brain'
            });
          } else {
            setResult({
              ...fallback,
              source: 'fallback'
            });
          }
        }
      } catch (error) {
        console.warn('Brain evaluation failed, using fallback:', error);
        if (isMounted) {
          setResult({
            ...fallback,
            source: 'fallback'
          });
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
  }, [context.riskLevel, context.originalAutoLimit, fallback]);

  return result;
}