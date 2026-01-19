import { useState, useEffect } from 'react';

interface ValidationResult {
  valid: boolean;
  message?: string;
}

interface ValidationResultWithSource extends ValidationResult {
  source: 'brain' | 'fallback';
}

interface PromotionValidationContext {
  cart_total: number;
  promo: {
    min_order: number;
  };
}

export function useBrainValidatePromotionMinimumOrder(
  context: PromotionValidationContext,
  fallback: ValidationResult
): ValidationResultWithSource {
  const [result, setResult] = useState<ValidationResultWithSource>({
    ...fallback,
    source: 'fallback'
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function evaluateRule() {
      setIsLoading(true);
      
      try {
        const response = await fetch('/api/brain/evaluate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            domain: 'validation',
            rule: 'validate_promotion_minimum_order',
            context,
            fallback
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (isMounted) {
          if (data.result !== undefined && data.result !== null) {
            setResult({
              ...data.result,
              source: 'brain'
            });
          } else {
            setResult({
              ...fallback,
              source: 'fallback'
            });
          }
        }
      } catch (error) {
        console.warn('Brain evaluation failed, using fallback:', error);
        if (isMounted) {
          setResult({
            ...fallback,
            source: 'fallback'
          });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    evaluateRule();

    return () => {
      isMounted = false;
    };
  }, [context.cart_total, context.promo.min_order, fallback]);

  return result;
}