import { useState, useEffect } from 'react';

interface RiskFactors {
  previousOrders: number;
  [key: string]: any;
}

interface RiskAssessment {
  score: number;
  flags: string[];
}

interface OrderHistoryLoyaltyScoringResult {
  scoreAdjustment: number;
  flags: string[];
  source: 'brain' | 'fallback';
}

interface OrderHistoryLoyaltyScoringFallback {
  scoreAdjustment: number;
  flags: string[];
}

export function useBrainOrderHistoryLoyaltyScoring(
  factors: RiskFactors,
  fallback: OrderHistoryLoyaltyScoringFallback
): OrderHistoryLoyaltyScoringResult {
  const [result, setResult] = useState<OrderHistoryLoyaltyScoringResult>({
    ...fallback,
    source: 'fallback'
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    const evaluateRule = async () => {
      setIsLoading(true);
      
      try {
        const response = await fetch('/api/brain/evaluate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            domain: 'risk',
            ruleName: 'order_history_loyalty_scoring',
            context: { factors },
            fallback
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (!isCancelled) {
          if (data.success && data.result) {
            setResult({
              scoreAdjustment: data.result.scoreAdjustment ?? fallback.scoreAdjustment,
              flags: data.result.flags ?? fallback.flags,
              source: 'brain'
            });
          } else {
            // No match or unsuccessful evaluation - use fallback
            setResult({
              ...fallback,
              source: 'fallback'
            });
          }
        }
      } catch (error) {
        console.warn('Brain evaluation failed, using fallback:', error);
        if (!isCancelled) {
          setResult({
            ...fallback,
            source: 'fallback'
          });
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    evaluateRule();

    return () => {
      isCancelled = true;
    };
  }, [factors.previousOrders, fallback]);

  return result;
}