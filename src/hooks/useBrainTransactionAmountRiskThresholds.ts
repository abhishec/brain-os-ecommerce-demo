import { useState, useEffect } from 'react';

interface TransactionAmountRiskThresholds {
  risk_level: {
    high: string;
    normal: string;
    elevated: string;
  };
  large_transaction_threshold: number;
  very_large_transaction_threshold: number;
}

interface BrainResult<T> {
  data: T;
  source: 'brain' | 'fallback';
  loading: boolean;
  error: string | null;
}

export function useBrainTransactionAmountRiskThresholds(
  fallback: TransactionAmountRiskThresholds
): BrainResult<TransactionAmountRiskThresholds> {
  const [result, setResult] = useState<BrainResult<TransactionAmountRiskThresholds>>({
    data: fallback,
    source: 'fallback',
    loading: true,
    error: null,
  });

  useEffect(() => {
    const fetchBrainRule = async () => {
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
            domain: 'risk',
            context: { transaction: { amount: true } },
            transformer_id: TRANSFORMER_ID,
            fallback
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data && typeof data === 'object' && data.risk_level && data.large_transaction_threshold !== undefined && data.very_large_transaction_threshold !== undefined) {
          setResult({
            data,
            source: 'brain',
            loading: false,
            error: null,
          });
        } else {
          // No valid brain result, use fallback
          setResult({
            data: fallback,
            source: 'fallback',
            loading: false,
            error: null,
          });
        }
      } catch (error) {
        // API failed, use fallback (zero-impact guarantee)
        setResult({
          data: fallback,
          source: 'fallback',
          loading: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    };

    fetchBrainRule();
  }, [fallback]);

  return result;
}