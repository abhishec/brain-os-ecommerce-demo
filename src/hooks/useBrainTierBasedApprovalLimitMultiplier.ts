import { useState, useEffect } from 'react';

interface TierBasedApprovalLimitResult {
  multipliedLimit: number;
  source: 'brain' | 'fallback';
}

interface TierBasedApprovalLimitContext {
  customerTier: string;
  limit: number;
}

export function useBrainTierBasedApprovalLimitMultiplier(
  context: TierBasedApprovalLimitContext,
  fallback: number
): TierBasedApprovalLimitResult {
  const [result, setResult] = useState<TierBasedApprovalLimitResult>({
    multipliedLimit: fallback,
    source: 'fallback'
  });

  useEffect(() => {
    let isCancelled = false;

    async function evaluateRule() {
      try {
        const response = await fetch('/api/brain/evaluate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            domain: 'eligibility',
            ruleName: 'tier_based_approval_limit_multiplier',
            context,
            fallback
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        
        if (!isCancelled) {
          if (data.result !== undefined && data.result !== null) {
            setResult({
              multipliedLimit: data.result,
              source: 'brain'
            });
          } else {
            setResult({
              multipliedLimit: fallback,
              source: 'fallback'
            });
          }
        }
      } catch (error) {
        console.warn('Brain evaluation failed, using fallback:', error);
        if (!isCancelled) {
          setResult({
            multipliedLimit: fallback,
            source: 'fallback'
          });
        }
      }
    }

    evaluateRule();

    return () => {
      isCancelled = true;
    };
  }, [context.customerTier, context.limit, fallback]);

  return result;
}