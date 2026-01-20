import { useState, useEffect } from 'react';

interface PaymentOverdueRiskThresholds {
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  high_risk_threshold: number;
  medium_risk_threshold: number;
  critical_risk_threshold: number;
}

interface PaymentOverdueRiskResult {
  data: PaymentOverdueRiskThresholds;
  source: 'brain' | 'fallback';
  loading: boolean;
  error: string | null;
}

interface PaymentOverdueContext {
  days_overdue?: number;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://fyknidhqafrhrscnexne.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_9Axs3pBaWTih_u6pCO85rg_dDh8Muf-';
const TRANSFORMER_ID = 'b2dade50-588c-4de9-8dff-9d30ee5dd81a';

export function useBrainPaymentOverdueRiskThresholds(
  context: PaymentOverdueContext,
  fallback: PaymentOverdueRiskThresholds
): PaymentOverdueRiskResult {
  const [result, setResult] = useState<PaymentOverdueRiskResult>({
    data: fallback,
    source: 'fallback',
    loading: true,
    error: null
  });

  useEffect(() => {
    let isCancelled = false;

    async function evaluateRule() {
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
          if (data && typeof data === 'object') {
            setResult({
              data: data,
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

    evaluateRule();

    return () => {
      isCancelled = true;
    };
  }, [context.days_overdue, fallback]);

  return result;
}