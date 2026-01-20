import { useState, useEffect } from 'react';

interface ProductRestrictedCategoryResult {
  reason: string;
  requires_approval: boolean;
}

interface BrainResult {
  result: ProductRestrictedCategoryResult | null;
  source: 'brain' | 'fallback';
  loading: boolean;
  error: string | null;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://fyknidhqafrhrscnexne.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_9Axs3pBaWTih_u6pCO85rg_dDh8Muf-';
const TRANSFORMER_ID = 'b2dade50-588c-4de9-8dff-9d30ee5dd81a';

export const useBrainProductRestrictedCategoryCheck = (
  productCategory: string,
  fallback: ProductRestrictedCategoryResult | null = null
): BrainResult => {
  const [result, setResult] = useState<ProductRestrictedCategoryResult | null>(fallback);
  const [source, setSource] = useState<'brain' | 'fallback'>('fallback');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!productCategory) {
      setResult(fallback);
      setSource('fallback');
      return;
    }

    const evaluateRule = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/evaluate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'apikey': SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            domain: 'eligibility',
            context: {
              product: {
                category: productCategory
              }
            },
            transformer_id: TRANSFORMER_ID,
            fallback
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.result !== null && data.result !== undefined) {
          setResult(data.result);
          setSource('brain');
        } else {
          setResult(fallback);
          setSource('fallback');
        }
      } catch (err) {
        console.warn('Brain evaluation failed, using fallback:', err);
        setResult(fallback);
        setSource('fallback');
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    evaluateRule();
  }, [productCategory, fallback]);

  return { result, source, loading, error };
};