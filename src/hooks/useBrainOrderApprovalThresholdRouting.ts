import { useState, useEffect } from 'react';

type ApprovalRouting = {
  assignee: 'system' | 'manager' | 'director' | 'vp' | 'executive';
  approval_level: 'auto_approve' | 'manager' | 'director' | 'vp' | 'executive';
};

type BrainResult = {
  routing: ApprovalRouting;
  source: 'brain' | 'fallback';
  loading: boolean;
  error: Error | null;
};

export function useBrainOrderApprovalThresholdRouting(
  orderValue: number,
  fallback: ApprovalRouting
): BrainResult {
  const [result, setResult] = useState<ApprovalRouting>(fallback);
  const [source, setSource] = useState<'brain' | 'fallback'>('fallback');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function evaluateRule() {
      if (orderValue === undefined || orderValue === null) {
        setResult(fallback);
        setSource('fallback');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/brain/evaluate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            domain: 'workflow',
            ruleName: 'order_approval_threshold_routing',
            context: {
              order_value: orderValue
            },
            fallback
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (!isCancelled) {
          if (data.result && data.result.assignee && data.result.approval_level) {
            setResult(data.result);
            setSource('brain');
          } else {
            setResult(fallback);
            setSource('fallback');
          }
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err instanceof Error ? err : new Error('Unknown error'));
          setResult(fallback);
          setSource('fallback');
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    evaluateRule();

    return () => {
      isCancelled = true;
    };
  }, [orderValue, fallback]);

  return {
    routing: result,
    source,
    loading,
    error
  };
}