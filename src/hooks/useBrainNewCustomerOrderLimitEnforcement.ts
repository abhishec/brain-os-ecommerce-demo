import { useState, useEffect } from 'react';

interface OrderLimitResult {
  reason: string;
  status: string;
  conditions: string[];
  approver_level: string;
  escalation_path: string[];
}

interface UseBrainResult {
  result: OrderLimitResult | null;
  loading: boolean;
  error: Error | null;
  source: 'brain' | 'fallback';
}

interface EvaluateContext {
  customer: {
    is_new_customer: boolean;
  };
  order: {
    total: number;
  };
}

export function useBrainNewCustomerOrderLimitEnforcement(
  context: EvaluateContext,
  fallback: OrderLimitResult | null
): UseBrainResult {
  const [result, setResult] = useState<OrderLimitResult | null>(fallback);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [source, setSource] = useState<'brain' | 'fallback'>('fallback');

  useEffect(() => {
    let isCancelled = false;

    async function evaluateRule() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/brain/evaluate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            domain: 'limits',
            rule: 'new_customer_order_limit_enforcement',
            context,
            fallback
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (!isCancelled) {
          if (data.result !== undefined) {
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
  }, [context.customer.is_new_customer, context.order.total, fallback]);

  return { result, loading, error, source };
}