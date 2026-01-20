import { useState, useEffect } from 'react';

interface ShippingResult {
  cost: number;
  method: string;
  threshold: number;
  freeShipping: boolean;
}

interface BrainShippingResult extends ShippingResult {
  source: 'brain' | 'fallback';
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://fyknidhqafrhrscnexne.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_9Axs3pBaWTih_u6pCO85rg_dDh8Muf-';
const TRANSFORMER_ID = 'b2dade50-588c-4de9-8dff-9d30ee5dd81a';

export const useBrainStandardShippingFallback = (
  context: { orderTotal?: number },
  fallback: ShippingResult
): BrainShippingResult => {
  const [result, setResult] = useState<BrainShippingResult>({
    ...fallback,
    source: 'fallback'
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const evaluateRule = async () => {
      try {
        setIsLoading(true);
        
        const response = await fetch(`${SUPABASE_URL}/functions/v1/evaluate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'apikey': SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            domain: 'shipping',
            context,
            transformer_id: TRANSFORMER_ID,
            fallback
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data && typeof data === 'object' && 'cost' in data) {
          setResult({
            cost: data.cost ?? fallback.cost,
            method: data.method ?? fallback.method,
            threshold: data.threshold ?? fallback.threshold,
            freeShipping: data.freeShipping ?? fallback.freeShipping,
            source: 'brain'
          });
        } else {
          setResult({ ...fallback, source: 'fallback' });
        }
      } catch (error) {
        console.warn('Brain evaluation failed, using fallback:', error);
        setResult({ ...fallback, source: 'fallback' });
      } finally {
        setIsLoading(false);
      }
    };

    evaluateRule();
  }, [context.orderTotal, fallback.cost, fallback.method, fallback.threshold, fallback.freeShipping]);

  return result;
};