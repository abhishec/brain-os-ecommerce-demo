import { useState, useEffect } from 'react';

interface PaymentFailurePenaltyScoringResult {
  value: number;
  source: 'brain' | 'fallback';
  loading: boolean;
  error: Error | null;
}

interface PaymentFailurePenaltyScoringContext {
  event_type: 'payment_failure' | 'dispute';
}

export function useBrainPaymentFailurePenaltyScoring(
  context: PaymentFailurePenaltyScoringContext,
  fallback: number
): PaymentFailurePenaltyScoringResult {
  const [result, setResult] = useState<PaymentFailurePenaltyScoringResult>({
    value: fallback,
    source: 'fallback',
    loading: false,
    error: null
  });

  useEffect(() => {
    let isCancelled = false;

    const evaluateRule = async () => {
      setResult(prev => ({ ...prev, loading: true, error: null }));

      try {
        const response = await fetch('/api/brain/evaluate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            domain: 'risk',
            ruleName: 'payment_failure_penalty_scoring',
            context,
            fallback
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (!isCancelled) {
          if (data.success && typeof data.result === 'number') {
            setResult({
              value: data.result,
              source: 'brain',
              loading: false,
              error: null
            });
          } else {
            // No match or invalid result - use fallback
            setResult({
              value: fallback,
              source: 'fallback',
              loading: false,
              error: null
            });
          }
        }
      } catch (error) {
        if (!isCancelled) {
          // Always use fallback on error - zero impact guarantee
          setResult({
            value: fallback,
            source: 'fallback',
            loading: false,
            error: error instanceof Error ? error : new Error('Unknown error')
          });
        }
      }
    };

    evaluateRule();

    return () => {
      isCancelled = true;
    };
  }, [context.event_type, fallback]);

  return result;
}