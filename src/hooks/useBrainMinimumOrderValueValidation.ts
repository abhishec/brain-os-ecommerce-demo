import { useState, useEffect } from 'react';

interface ValidationResult {
  valid: boolean;
  warning?: string;
  breakdown_message?: string;
}

interface UseBrainMinimumOrderValueValidationResult {
  result: ValidationResult | null;
  loading: boolean;
  error: string | null;
  source: 'brain' | 'fallback';
}

export function useBrainMinimumOrderValueValidation(
  finalPrice: number,
  minOrderValue: number,
  fallback: ValidationResult | null = null
): UseBrainMinimumOrderValueValidationResult {
  const [result, setResult] = useState<ValidationResult | null>(fallback);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<'brain' | 'fallback'>('fallback');

  useEffect(() => {
    let isCancelled = false;

    async function evaluateRule() {
      if (finalPrice === undefined || minOrderValue === undefined) {
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
            domain: 'validation',
            rule: 'minimum_order_value_validation',
            context: {
              final_price: finalPrice,
              MIN_ORDER_VALUE: minOrderValue
            },
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
          setError(err instanceof Error ? err.message : 'Unknown error');
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
  }, [finalPrice, minOrderValue, fallback]);

  return {
    result,
    loading,
    error,
    source
  };
}