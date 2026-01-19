import { useState, useEffect } from 'react';

interface ApprovalThresholds {
  approval_type: string;
  auto_approval_limit: number;
  review_required_threshold: number;
}

interface BrainResult {
  data: ApprovalThresholds;
  source: 'brain' | 'fallback';
  loading: boolean;
  error: Error | null;
}

export function useBrainHighRiskCustomerApprovalThresholds(
  fallback: ApprovalThresholds,
  context?: { customer?: { risk_level?: string } }
): BrainResult {
  const [result, setResult] = useState<BrainResult>({
    data: fallback,
    source: 'fallback',
    loading: false,
    error: null
  });

  useEffect(() => {
    let isMounted = true;

    async function evaluate() {
      if (!context?.customer?.risk_level) {
        return;
      }

      setResult(prev => ({ ...prev, loading: true, error: null }));

      try {
        const response = await fetch('/api/brain/evaluate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            domain: 'risk',
            ruleName: 'high_risk_customer_approval_thresholds',
            context,
            fallback
          })
        });

        if (!response.ok) {
          throw new Error(`Evaluation failed: ${response.status}`);
        }

        const evaluation = await response.json();
        
        if (isMounted) {
          if (evaluation.matched && evaluation.result) {
            setResult({
              data: evaluation.result,
              source: 'brain',
              loading: false,
              error: null
            });
          } else {
            setResult({
              data: fallback,
              source: 'fallback',
              loading: false,
              error: null
            });
          }
        }
      } catch (error) {
        if (isMounted) {
          setResult({
            data: fallback,
            source: 'fallback',
            loading: false,
            error: error instanceof Error ? error : new Error('Unknown error')
          });
        }
      }
    }

    evaluate();

    return () => {
      isMounted = false;
    };
  }, [fallback, context?.customer?.risk_level]);

  return result;
}