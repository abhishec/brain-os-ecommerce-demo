import { useState, useEffect } from 'react';

interface FirstTimeCustomerResult {
  reason: string;
  discount: {
    name: string;
    type: string;
    amount: string;
  };
  eligible: boolean;
}

interface EvaluationResult {
  result: FirstTimeCustomerResult | null;
  source: 'brain' | 'fallback';
}

interface CustomerContext {
  isFirstOrder?: boolean;
  orderCount?: number;
  [key: string]: any;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://fyknidhqafrhrscnexne.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_9Axs3pBaWTih_u6pCO85rg_dDh8Muf-';
const TRANSFORMER_ID = 'b2dade50-588c-4de9-8dff-9d30ee5dd81a';

export function useBrainFirstTimeCustomerEligibility(
  context: CustomerContext,
  fallback: FirstTimeCustomerResult | null
): EvaluationResult {
  const [result, setResult] = useState<EvaluationResult>({
    result: fallback,
    source: 'fallback'
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    async function evaluateEligibility() {
      if (!context || isLoading) return;

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
            domain: 'eligibility',
            context,
            transformer_id: TRANSFORMER_ID,
            fallback
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (!isCancelled) {
          if (data.result !== null && data.result !== undefined) {
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
        }
      } catch (error) {
        console.warn('Brain evaluation failed, using fallback:', error);
        if (!isCancelled) {
          setResult({
            result: fallback,
            source: 'fallback'
          });
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    evaluateEligibility();

    return () => {
      isCancelled = true;
    };
  }, [context.isFirstOrder, context.orderCount, fallback]);

  return result;
}