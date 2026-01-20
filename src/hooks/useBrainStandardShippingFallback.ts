import { useState, useEffect } from 'react';

interface ShippingResult {
  cost: number;
  method: string;
  threshold: number;
  freeShipping: boolean;
}

interface BrainShippingResult {
  result: ShippingResult;
  source: 'brain' | 'fallback';
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://fyknidhqafrhrscnexne.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_9Axs3pBaWTih_u6pCO85rg_dDh8Muf-';
const TRANSFORMER_ID = 'b2dade50-588c-4de9-8dff-9d30ee5dd81a';

export function useBrainStandardShippingFallback(
  orderTotal: number,
  fallback: ShippingResult
): BrainShippingResult {
  const [result, setResult] = useState<BrainShippingResult>({
    result: fallback,
    source: 'fallback'
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const evaluateShipping = async () => {
      if (!orderTotal) return;
      
      setIsLoading(true);
      
      try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/evaluate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'apikey': SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            domain: 'shipping',
            context: { orderTotal },
            transformer_id: TRANSFORMER_ID,
            fallback
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data?.result && typeof data.result === 'object') {
          setResult({
            result: data.result,
            source: 'brain'
          });
        } else {
          setResult({
            result: fallback,
            source: 'fallback'
          });
        }
      } catch (error) {
        console.warn('Brain evaluation failed, using fallback:', error);
        setResult({
          result: fallback,
          source: 'fallback'
        });
      } finally {
        setIsLoading(false);
      }
    };

    evaluateShipping();
  }, [orderTotal, fallback]);

  return result;
}