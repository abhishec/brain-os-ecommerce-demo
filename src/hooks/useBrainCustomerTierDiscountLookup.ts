import { useState, useEffect } from 'react';

interface CustomerTierDiscountResult {
  discount: number;
  source: 'brain' | 'fallback';
}

interface CustomerTierContext {
  customer_tier?: string;
}

export function useBrainCustomerTierDiscountLookup(
  context: CustomerTierContext,
  fallback: number = 0
): CustomerTierDiscountResult {
  const [result, setResult] = useState<CustomerTierDiscountResult>({
    discount: fallback,
    source: 'fallback'
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const evaluateRule = async () => {
      if (!context.customer_tier) {
        setResult({ discount: fallback, source: 'fallback' });
        return;
      }

      setIsLoading(true);
      
      try {
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
            domain: 'pricing', 
            context, 
            transformer_id: TRANSFORMER_ID,
            fallback 
          }),
        });

        if (!response.ok) {
          throw new Error('API request failed');
        }

        const data = await response.json();
        
        if (data && typeof data.result === 'number') {
          setResult({ discount: data.result, source: 'brain' });
        } else {
          setResult({ discount: fallback, source: 'fallback' });
        }
      } catch (error) {
        console.warn('Brain evaluation failed, using fallback:', error);
        setResult({ discount: fallback, source: 'fallback' });
      } finally {
        setIsLoading(false);
      }
    };

    evaluateRule();
  }, [context.customer_tier, fallback]);

  return result;
}