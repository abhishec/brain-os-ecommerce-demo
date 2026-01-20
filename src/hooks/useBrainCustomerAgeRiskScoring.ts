import { useState, useEffect } from 'react';

interface RiskScoringResult {
  score: number;
  flags: string[];
  requiredActions: string[];
  source: 'brain' | 'fallback';
}

interface RiskFactors {
  customerAge: number;
}

interface UseBrainCustomerAgeRiskScoringParams {
  factors: RiskFactors;
  initialScore: number;
  fallback: RiskScoringResult;
}

export function useBrainCustomerAgeRiskScoring({
  factors,
  initialScore,
  fallback
}: UseBrainCustomerAgeRiskScoringParams) {
  const [result, setResult] = useState<RiskScoringResult>({
    ...fallback,
    source: 'fallback'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isCancelled = false;
    
    const evaluateRule = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch('/api/brain/evaluate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            domain: 'risk',
            ruleName: 'customer_age_risk_scoring',
            context: {
              factors,
              score: initialScore
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
              ...data.result,
              source: 'brain'
            });
          } else {
            // No match found, use fallback
            setResult({
              ...fallback,
              source: 'fallback'
            });
          }
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err instanceof Error ? err : new Error('Unknown error'));
          // On error, always return fallback (zero-impact guarantee)
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
  }, [factors.customerAge, initialScore, fallback]);

  return {
    result,
    isLoading,
    error
  };
}