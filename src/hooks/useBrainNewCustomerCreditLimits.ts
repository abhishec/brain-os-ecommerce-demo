import { useState, useEffect } from 'react';

interface CreditLimits {
  risk_tier: string;
  auto_approval_limit: number;
  maximum_credit_limit: number;
}

interface UseBrainNewCustomerCreditLimitsResult {
  data: CreditLimits;
  loading: boolean;
  error: Error | null;
  source: 'brain' | 'fallback';
}

export function useBrainNewCustomerCreditLimits(
  fallback: CreditLimits,
  context?: { customer?: { is_new_customer?: boolean } }
): UseBrainNewCustomerCreditLimitsResult {
  const [data, setData] = useState<CreditLimits>(fallback);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [source, setSource] = useState<'brain' | 'fallback'>('fallback');

  useEffect(() => {
    let isMounted = true;
    
    const evaluateRule = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/brain/evaluate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            domain: 'eligibility',
            rule: 'new_customer_credit_limits',
            context: context || {},
            fallback
          }),
        });

        if (!response.ok) {
          throw new Error(`API call failed: ${response.status}`);
        }

        const result = await response.json();
        
        if (isMounted) {
          if (result.success && result.data) {
            setData(result.data);
            setSource('brain');
          } else {
            setData(fallback);
            setSource('fallback');
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Unknown error'));
          setData(fallback);
          setSource('fallback');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    evaluateRule();

    return () => {
      isMounted = false;
    };
  }, [fallback, context]);

  return { data, loading, error, source };
}