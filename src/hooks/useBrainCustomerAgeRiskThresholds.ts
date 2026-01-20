import { useState, useEffect } from 'react';

interface CustomerAgeRiskThresholds {
  risk_category: {
    new: string;
    very_new: string;
    established: string;
  };
  new_customer_threshold_days: number;
  very_new_customer_threshold_days: number;
}

interface BrainResult<T> {
  data: T;
  source: 'brain' | 'fallback';
  loading: boolean;
  error: string | null;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://fyknidhqafrhrscnexne.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_9Axs3pBaWTih_u6pCO85rg_dDh8Muf-';
const TRANSFORMER_ID = 'b2dade50-588c-4de9-8dff-9d30ee5dd81a';

export function useBrainCustomerAgeRiskThresholds(
  fallback: CustomerAgeRiskThresholds,
  context?: Record<string, any>
): BrainResult<CustomerAgeRiskThresholds> {
  const [result, setResult] = useState<BrainResult<CustomerAgeRiskThresholds>>({
    data: fallback,
    source: 'fallback',
    loading: false,
    error: null
  });

  useEffect(() => {
    let isCancelled = false;

    async function fetchBrainRule() {
      setResult(prev => ({ ...prev, loading: true, error: null }));

      try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/evaluate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'apikey': SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            domain: 'risk',
            context: {
              rule_name: 'customer_age_risk_thresholds',
              ...context
            },
            transformer_id: TRANSFORMER_ID,
            fallback
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (!isCancelled) {
          if (data && data.risk_category && typeof data.new_customer_threshold_days === 'number') {
            setResult({
              data,
              source: 'brain',
              loading: false,
              error: null
            });
          } else {
            setResult({
              data: fallback,
              source: 'fallback',
              loading: false,
              error: null
            });
          }
        }
      } catch (error) {
        if (!isCancelled) {
          setResult({
            data: fallback,
            source: 'fallback',
            loading: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    }

    fetchBrainRule();

    return () => {
      isCancelled = true;
    };
  }, [JSON.stringify(context), JSON.stringify(fallback)]);

  return result;
}