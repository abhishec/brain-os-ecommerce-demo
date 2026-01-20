import { useState, useEffect } from 'react';

interface LargeFirstOrderResult {
  flag: string | null;
  score_adjustment: number;
  source: 'brain' | 'fallback';
}

interface RiskFactors {
  previousOrders: number;
  transactionAmount: number;
}

export function useBrainLargeFirstOrderVelocityCheck(
  factors: RiskFactors,
  fallback: { flag: string | null; score_adjustment: number }
): LargeFirstOrderResult {
  const [result, setResult] = useState<LargeFirstOrderResult>({
    ...fallback,
    source: 'fallback'
  });

  useEffect(() => {
    const evaluateRule = async () => {
      try {
        const response = await fetch('/api/brain/evaluate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            domain: 'risk',
            ruleName: 'large_first_order_velocity_check',
            context: { factors },
            fallback
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.result !== undefined) {
          setResult({
            flag: data.result.flag || null,
            score_adjustment: data.result.score_adjustment || 0,
            source: 'brain'
          });
        } else {
          // No match from brain, use fallback
          setResult({
            ...fallback,
            source: 'fallback'
          });
        }
      } catch (error) {
        console.warn('Brain evaluation failed, using fallback:', error);
        // Always fallback on error - zero impact guarantee
        setResult({
          ...fallback,
          source: 'fallback'
        });
      }
    };

    evaluateRule();
  }, [factors.previousOrders, factors.transactionAmount, fallback]);

  return result;
}