import { useState, useEffect } from 'react';

interface FailedPaymentRiskResult {
  action: 'flag_payment' | 'block_payment';
  risk_level: 'high' | 'critical';
  threshold_exceeded: 'MAX_FAILED_PAYMENTS' | 'CRITICAL_FAILED_PAYMENTS';
}

interface UseBrainFailedPaymentRiskThresholdResult {
  result: FailedPaymentRiskResult;
  source: 'brain' | 'fallback';
  loading: boolean;
  error: string | null;
}

interface FailedPaymentContext {
  failed_payment_count: number;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://fyknidhqafrhrscnexne.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_9Axs3pBaWTih_u6pCO85rg_dDh8Muf-';
const TRANSFORMER_ID = 'b2dade50-588c-4de9-8dff-9d30ee5dd81a';

export function useBrainFailedPaymentRiskThreshold(
  context: FailedPaymentContext,
  fallback: FailedPaymentRiskResult
): UseBrainFailedPaymentRiskThresholdResult {
  const [result, setResult] = useState<FailedPaymentRiskResult>(fallback);
  const [source, setSource] = useState<'brain' | 'fallback'>('fallback');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function evaluateFailedPaymentRisk() {
      if (!context.failed_payment_count && context.failed_payment_count !== 0) {
        return;
      }

      setLoading(true);
      setError(null);

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
        
        if (isMounted) {
          if (data.result && typeof data.result === 'object') {
            setResult(data.result);
            setSource('brain');
          } else {
            setResult(fallback);
            setSource('fallback');
          }
        }
      } catch (err) {
        console.warn('Failed payment risk evaluation failed, using fallback:', err);
        if (isMounted) {
          setResult(fallback);
          setSource('fallback');
          setError(err instanceof Error ? err.message : 'Unknown error');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    evaluateFailedPaymentRisk();

    return () => {
      isMounted = false;
    };
  }, [context.failed_payment_count, fallback]);

  return {
    result,
    source,
    loading,
    error
  };
}