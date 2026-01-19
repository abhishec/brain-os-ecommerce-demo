import { useState, useEffect } from 'react';

interface TierBasedApprovalLimitMultiplierContext {
  customerTier: string;
  limit: number;
}

interface TierBasedApprovalLimitMultiplierResult {
  multipliedLimit: number;
  source: 'brain' | 'fallback';
  loading: boolean;
  error: Error | null;
}

export function useBrainTierBasedApprovalLimitMultiplier(
  context: TierBasedApprovalLimitMultiplierContext,
  fallback: number
): TierBasedApprovalLimitMultiplierResult {
  const [result, setResult] = useState<TierBasedApprovalLimitMultiplierResult>({
    multipliedLimit: fallback,
    source: 'fallback',
    loading: false,
    error: null
  });

  useEffect(() => {
    let isCancelled = false;

    async function evaluateRule() {
      try {
        setResult(prev => ({ ...prev, loading: true, error: null }));

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
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (!isCancelled) {
          if (data.success && data.result !== undefined) {
            setResult({
              multipliedLimit: data.result,
              source: 'brain',
              loading: false,
              error: null
            });
          } else {
            // No match or evaluation failed - use fallback
            setResult({
              multipliedLimit: fallback,
              source: 'fallback',
              loading: false,
              error: null
            });
          }
        }
      } catch (error) {
        if (!isCancelled) {
          // Always return fallback on error - zero impact guarantee
          setResult({
            multipliedLimit: fallback,
            source: 'fallback',
            loading: false,
            error: error instanceof Error ? error : new Error('Unknown error')
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