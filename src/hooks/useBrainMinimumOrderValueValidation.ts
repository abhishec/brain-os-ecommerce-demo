import { useState, useEffect } from 'react';

interface MinimumOrderValidationResult {
  valid: boolean;
  warning?: string;
  breakdown_message?: string;
  source: 'brain' | 'fallback';
}

interface MinimumOrderValidationContext {
  final_price: number;
  MIN_ORDER_VALUE: number;
}

export const useBrainMinimumOrderValueValidation = (
  context: MinimumOrderValidationContext,
  fallback: MinimumOrderValidationResult
) => {
  const [result, setResult] = useState<MinimumOrderValidationResult>({
    ...fallback,
    source: 'fallback'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const evaluateRule = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://fyknidhqafrhrscnexne.supabase.co';
        const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_9Axs3pBaWTih_u6pCO85rg_dDh8Muf-';
        const TRANSFORMER_ID = 'b2dade50-588c-4de9-8dff-9d30ee5dd81a';

        const response = await fetch(`${SUPABASE_URL}/functions/v1/evaluate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'apikey': SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            domain: 'validation',
            context,
            transformer_id: TRANSFORMER_ID,
            fallback
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data && typeof data === 'object') {
          setResult({
            ...data,
            source: 'brain'
          });
        } else {
          setResult({
            ...fallback,
            source: 'fallback'
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setResult({
          ...fallback,
          source: 'fallback'
        });
      } finally {
        setIsLoading(false);
      }
    };

    evaluateRule();
  }, [context.final_price, context.MIN_ORDER_VALUE, fallback]);

  return { result, isLoading, error };
};