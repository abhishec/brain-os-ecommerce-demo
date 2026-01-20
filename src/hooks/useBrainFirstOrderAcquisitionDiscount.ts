import { useState, useEffect } from 'react';

interface Customer {
  order_count: number;
}

interface DiscountResult {
  discount: number;
  source: 'brain' | 'fallback';
  loading: boolean;
  error: string | null;
}

export function useBrainFirstOrderAcquisitionDiscount(
  customer: Customer,
  fallback: number = 0.10
): DiscountResult {
  const [discount, setDiscount] = useState<number>(fallback);
  const [source, setSource] = useState<'brain' | 'fallback'>('fallback');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function evaluateDiscount() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/brain/evaluate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            domain: 'pricing',
            ruleName: 'first_order_acquisition_discount',
            context: {
              customer: {
                order_count: customer.order_count
              }
            },
            fallback
          }),
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
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

    evaluateDiscount();

    return () => {
      isMounted = false;
    };
  }, [customer.order_count, fallback]);

  return {
    discount,
    source,
    loading,
    error
  };
}