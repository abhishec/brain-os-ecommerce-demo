import { useState, useEffect } from 'react';

interface UseBrainReferralCustomerDiscountResult {
  discount: number;
  loading: boolean;
  error: string | null;
  source: 'brain' | 'fallback';
}

interface UseBrainReferralCustomerDiscountParams {
  customer: {
    referral_status: string;
    [key: string]: any;
  };
  fallback: number;
}

export function useBrainReferralCustomerDiscount({
  customer,
  fallback
}: UseBrainReferralCustomerDiscountParams): UseBrainReferralCustomerDiscountResult {
  const [discount, setDiscount] = useState<number>(fallback);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<'brain' | 'fallback'>('fallback');

  useEffect(() => {
    let isMounted = true;

    async function evaluateRule() {
      if (!customer) {
        setDiscount(fallback);
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
            domain: 'pricing',
            rule: 'referral_customer_discount',
            context: {
              customer
            },
            fallback
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (isMounted) {
          if (result.success && typeof result.value === 'number') {
            setDiscount(result.value);
            setSource('brain');
          } else {
            setDiscount(fallback);
            setSource('fallback');
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Unknown error');
          setDiscount(fallback);
          setSource('fallback');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    evaluateRule();

    return () => {
      isMounted = false;
    };
  }, [customer?.referral_status, fallback]);

  return {
    discount,
    loading,
    error,
    source
  };
}