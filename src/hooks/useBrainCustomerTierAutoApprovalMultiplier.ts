import { useState, useEffect } from 'react';

interface MultiplierResult {
  multiplier: number;
  reason: string;
  source: 'brain' | 'fallback';
}

interface MultiplierFallback {
  multiplier: number;
  reason: string;
}

export function useBrainCustomerTierAutoApprovalMultiplier(
  customerTier: string,
  fallback: MultiplierFallback
): MultiplierResult {
  const [result, setResult] = useState<MultiplierResult>({
    ...fallback,
    source: 'fallback'
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!customerTier) {
      setResult({ ...fallback, source: 'fallback' });
      return;
    }

    setIsLoading(true);

    const evaluateRule = async () => {
      try {
        const response = await fetch('/api/brain/evaluate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            domain: 'eligibility',
            ruleName: 'customer_tier_auto_approval_multiplier',
            context: {
              customer_tier: customerTier
            },
            fallback
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success && data.result) {
          setResult({
            multiplier: data.result.multiplier || fallback.multiplier,
            reason: data.result.reason || fallback.reason,
            source: 'brain'
          });
        } else {
          setResult({ ...fallback, source: 'fallback' });
        }
      } catch (error) {
        console.warn('Brain evaluation failed, using fallback:', error);
        setResult({ ...fallback, source: 'fallback' });
      } finally {
        setIsLoading(false);
      }
    };

    evaluateRule();
  }, [customerTier, fallback.multiplier, fallback.reason]);

  return result;
}