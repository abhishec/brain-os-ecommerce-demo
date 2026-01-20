import { useState, useEffect } from 'react';

interface FailedPaymentResult {
  adjustedScore: number;
  factors: string[];
  source: 'brain' | 'fallback';
}

interface FailedPaymentFallback {
  adjustedScore: number;
  factors: string[];
}

interface Profile {
  failedPayments: number;
}

interface UseBrainFailedPaymentPenaltyScoringParams {
  profile: Profile;
  score: number;
  fallback: FailedPaymentFallback;
}

export function useBrainFailedPaymentPenaltyScoring({
  profile,
  score,
  fallback
}: UseBrainFailedPaymentPenaltyScoringParams): FailedPaymentResult {
  const [result, setResult] = useState<FailedPaymentResult>({
    ...fallback,
    source: 'fallback'
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    async function evaluateRule() {
      if (!profile || typeof score !== 'number') {
        setResult({ ...fallback, source: 'fallback' });
        return;
      }

      setIsLoading(true);
      
      try {
        const response = await fetch('/api/brain/evaluate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            domain: 'risk',
            rule: 'failed_payment_penalty_scoring',
            context: {
              profile,
              score
            },
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
              adjustedScore: data.result.adjustedScore ?? fallback.adjustedScore,
              factors: Array.isArray(data.result.factors) ? data.result.factors : fallback.factors,
              source: 'brain'
            });
          } else {
            setResult({ ...fallback, source: 'fallback' });
          }
        }
      } catch (error) {
        console.warn('Brain evaluation failed, using fallback:', error);
        if (!isCancelled) {
          setResult({ ...fallback, source: 'fallback' });
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    evaluateRule();

    return () => {
      isCancelled = true;
    };
  }, [profile?.failedPayments, score, fallback]);

  return result;
}