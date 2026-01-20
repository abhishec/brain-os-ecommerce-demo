import { useState, useEffect } from 'react';

interface ProductRestrictedCategoryResult {
  reason?: string;
  requires_approval: boolean;
}

interface UseBrainProductRestrictedCategoryCheckResult {
  result: ProductRestrictedCategoryResult;
  loading: boolean;
  error: Error | null;
  source: 'brain' | 'fallback';
}

interface ProductContext {
  product: {
    category: string;
  };
}

export function useBrainProductRestrictedCategoryCheck(
  context: ProductContext,
  fallback: ProductRestrictedCategoryResult
): UseBrainProductRestrictedCategoryCheckResult {
  const [result, setResult] = useState<ProductRestrictedCategoryResult>(fallback);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [source, setSource] = useState<'brain' | 'fallback'>('fallback');

  useEffect(() => {
    let isCancelled = false;

    async function evaluate() {
      if (!context?.product?.category) {
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
            domain: 'eligibility',
            rule: 'product_restricted_category_check',
            context,
            fallback
          })
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

    evaluate();

    return () => {
      isCancelled = true;
    };
  }, [context.product.category, fallback]);

  return { result, loading, error, source };
}