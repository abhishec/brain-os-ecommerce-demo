import { useState, useEffect } from 'react';

interface CreditCheckResult {
  name: string;
  passed: boolean;
  message: string;
}

interface UseBrainPremiumCreditEligibilityCheckResult {
  result: CreditCheckResult | null;
  loading: boolean;
  error: string | null;
  source: 'brain' | 'fallback';
}

interface UseBrainPremiumCreditEligibilityCheckParams {
  creditScore: number;
  fallback: CreditCheckResult | null;
}

export function useBrainPremiumCreditEligibilityCheck({
  creditScore,
  fallback
}: UseBrainPremiumCreditEligibilityCheckParams): UseBrainPremiumCreditEligibilityCheckResult {
  const [result, setResult] = useState<CreditCheckResult | null>(fallback);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<'brain' | 'fallback'>('fallback');

  useEffect(() => {
    let mounted = true;

    async function evaluate() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/brain/evaluate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            domain: 'eligibility',
            ruleName: 'premium_credit_eligibility_check',
            context: {
              creditScore
            },
            fallback
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (mounted) {
          if (data.success && data.result !== undefined) {
            setResult(data.result);
            setSource('brain');
          } else {
            setResult(fallback);
            setSource('fallback');
          }
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Unknown error');
          setResult(fallback);
          setSource('fallback');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    evaluate();

    return () => {
      mounted = false;
    };
  }, [creditScore, fallback]);

  return {
    result,
    loading,
    error,
    source
  };
}