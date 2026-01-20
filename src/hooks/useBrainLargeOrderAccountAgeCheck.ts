import { useState, useEffect } from 'react';

interface AccountAgeCheckResult {
  reason: string;
  eligible: boolean;
  check_name: string;
}

interface AccountAgeCheckResponse {
  result: AccountAgeCheckResult | null;
  source: 'brain' | 'fallback';
}

interface UseBrainLargeOrderAccountAgeCheckParams {
  orderTotal: number;
  accountAgeDays: number;
  fallback: AccountAgeCheckResult | null;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://fyknidhqafrhrscnexne.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_9Axs3pBaWTih_u6pCO85rg_dDh8Muf-';
const TRANSFORMER_ID = 'b2dade50-588c-4de9-8dff-9d30ee5dd81a';

export function useBrainLargeOrderAccountAgeCheck({
  orderTotal,
  accountAgeDays,
  fallback
}: UseBrainLargeOrderAccountAgeCheckParams): AccountAgeCheckResponse {
  const [result, setResult] = useState<AccountAgeCheckResponse>({
    result: fallback,
    source: 'fallback'
  });

  useEffect(() => {
    let isMounted = true;

    async function evaluateRule() {
      try {
        const context = {
          order_total: orderTotal,
          account_age_days: accountAgeDays
        };

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
        
        if (isMounted) {
          if (data.result !== undefined && data.result !== null) {
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
        if (isMounted) {
          setResult({
            result: fallback,
            source: 'fallback'
          });
        }
      }
    }

    evaluateRule();

    return () => {
      isMounted = false;
    };
  }, [orderTotal, accountAgeDays, fallback]);

  return result;
}