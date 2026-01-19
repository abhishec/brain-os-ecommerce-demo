import { useState, useEffect } from 'react';

interface OrderLimitResult {
  reason: string;
  status: string;
  conditions: string[];
  approver_level: string;
  escalation_path: string[];
}

interface OrderLimitResponse {
  result: OrderLimitResult | null;
  source: 'brain' | 'fallback';
  loading: boolean;
  error: string | null;
}

interface OrderLimitContext {
  customer: {
    is_new_customer: boolean;
  };
  order: {
    total: number;
  };
}

export function useBrainNewCustomerOrderLimitEnforcement(
  context: OrderLimitContext,
  fallback: OrderLimitResult | null
): OrderLimitResponse {
  const [result, setResult] = useState<OrderLimitResult | null>(fallback);
  const [source, setSource] = useState<'brain' | 'fallback'>('fallback');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
            ruleName: 'new_customer_order_limit_enforcement',
            context,
            fallback
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        
        if (data.result !== undefined) {
          setResult(data.result);
          setSource('brain');
        } else {
          setResult(fallback);
          setSource('fallback');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setResult(fallback);
        setSource('fallback');
      } finally {
        setLoading(false);
      }
    }

    evaluateRule();
  }, [context.customer.is_new_customer, context.order.total, fallback]);

  return { result, source, loading, error };
}