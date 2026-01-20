import { useState, useEffect } from 'react';

interface SpendThreshold {
  minSpend: number;
  discount: number;
}

interface BrainSpendBonusResult {
  thresholds: SpendThreshold[];
  source: 'brain' | 'fallback';
}

interface SpendBonusContext {
  cart_total?: number;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://fyknidhqafrhrscnexne.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_9Axs3pBaWTih_u6pCO85rg_dDh8Muf-';
const TRANSFORMER_ID = 'b2dade50-588c-4de9-8dff-9d30ee5dd81a';

export function useBrainSpendBonusVolumeDiscount(
  context: SpendBonusContext,
  fallback: SpendThreshold[]
): BrainSpendBonusResult {
  const [result, setResult] = useState<BrainSpendBonusResult>({
    thresholds: fallback,
    source: 'fallback'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function evaluateRule() {
      if (loading) return;
      
      setLoading(true);
      
      try {
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
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (isMounted && data?.result) {
          // Validate the brain result matches expected structure
          if (Array.isArray(data.result) && 
              data.result.every((item: any) => 
                typeof item.minSpend === 'number' && 
                typeof item.discount === 'number'
              )) {
            setResult({
              thresholds: data.result,
              source: 'brain'
            });
          } else {
            // Invalid structure, use fallback
            setResult({
              thresholds: fallback,
              source: 'fallback'
            });
          }
        }
      } catch (error) {
        console.warn('Brain evaluation failed, using fallback:', error);
        if (isMounted) {
          setResult({
            thresholds: fallback,
            source: 'fallback'
          });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    evaluateRule();

    return () => {
      isMounted = false;
    };
  }, [context.cart_total, JSON.stringify(fallback)]);

  return result;
}