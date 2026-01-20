import { useState, useEffect } from 'react';

interface NewCustomerCreditLimits {
  risk_tier: string;
  auto_approval_limit: number;
  maximum_credit_limit: number;
}

interface BrainResult<T> {
  data: T;
  source: 'brain' | 'fallback';
  loading: boolean;
  error: string | null;
}

export function useBrainNewCustomerCreditLimits(
  context: Record<string, any>,
  fallback: NewCustomerCreditLimits
): BrainResult<NewCustomerCreditLimits> {
  const [result, setResult] = useState<BrainResult<NewCustomerCreditLimits>>({
    data: fallback,
    source: 'fallback',
    loading: false,
    error: null
  });

  useEffect(() => {
    const evaluateRule = async () => {
      try {
        setResult(prev => ({ ...prev, loading: true, error: null }));

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
            domain: 'eligibility', 
            context, 
            transformer_id: TRANSFORMER_ID,
            fallback 
          }),
        });

        if (!response.ok) {
          throw new Error(`API request failed: ${response.status}`);
        }

        const apiResult = await response.json();
        
        if (apiResult && apiResult.risk_tier && 
            typeof apiResult.auto_approval_limit === 'number' && 
            typeof apiResult.maximum_credit_limit === 'number') {
          setResult({
            data: apiResult,
            source: 'brain',
            loading: false,
            error: null
          });
        } else {
          // No valid match found, use fallback
          setResult({
            data: fallback,
            source: 'fallback',
            loading: false,
            error: null
          });
        }
      } catch (error) {
        // API error, use fallback (zero-impact guarantee)
        setResult({
          data: fallback,
          source: 'fallback',
          loading: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    };

    evaluateRule();
  }, [context, fallback]);

  return result;
}