import { useState, useEffect } from 'react';

interface CustomerTierDiscountResult {
  discount: number;
  breakdown: string;
}

interface CustomerTierDiscountResponse {
  result: CustomerTierDiscountResult;
  source: 'brain' | 'fallback';
}

interface Customer {
  tier: string;
}

export function useBrainCustomerTierDiscountPricing(
  customer: Customer,
  fallback: CustomerTierDiscountResult
): CustomerTierDiscountResponse {
  const [result, setResult] = useState<CustomerTierDiscountResponse>({
    result: fallback,
    source: 'fallback'
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const evaluateRule = async () => {
      try {
        setIsLoading(true);
        
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
            context: { customer },
            transformer_id: TRANSFORMER_ID,
            fallback
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data && data.result) {
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

    evaluateRule();
  }, [customer.tier, fallback]);

  return result;
}