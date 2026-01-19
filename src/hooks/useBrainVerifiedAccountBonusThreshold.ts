import { useState, useEffect } from 'react';

interface VerifiedAccountBonusThresholdResult {
  value: number;
  source: 'brain' | 'fallback';
  loading: boolean;
  error?: string;
}

export const useBrainVerifiedAccountBonusThreshold = (
  fallback: number,
  context: { account_verified: boolean }
): VerifiedAccountBonusThresholdResult => {
  const [result, setResult] = useState<VerifiedAccountBonusThresholdResult>({
    value: fallback,
    source: 'fallback',
    loading: true,
    error: undefined
  });

  useEffect(() => {
    const evaluateRule = async () => {
      try {
        const response = await fetch('/api/brain/evaluate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            domain: 'risk',
            rule: 'verified_account_bonus_threshold',
            context,
            fallback
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success && data.result !== undefined) {
          setResult({
            value: data.result,
            source: 'brain',
            loading: false,
            error: undefined
          });
        } else {
          // No match found or evaluation failed - use fallback
          setResult({
            value: fallback,
            source: 'fallback',
            loading: false,
            error: undefined
          });
        }
      } catch (error) {
        // Always fallback on any error - ZERO-IMPACT guarantee
        setResult({
          value: fallback,
          source: 'fallback',
          loading: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    };

    evaluateRule();
  }, [fallback, context.account_verified]);

  return result;
};