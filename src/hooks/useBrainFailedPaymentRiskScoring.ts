import { useState, useEffect } from 'react';

interface FailedPaymentRiskResult {
  flags: string[];
  score_increase: number;
  required_actions: string[];
  source: 'brain' | 'fallback';
}

interface RiskFactors {
  failedPayments: number;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://fyknidhqafrhrscnexne.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_9Axs3pBaWTih_u6pCO85rg_dDh8Muf-';
const TRANSFORMER_ID = 'b2dade50-588c-4de9-8dff-9d30ee5dd81a';

export function useBrainFailedPaymentRiskScoring(
  factors: RiskFactors,
  fallback: Omit<FailedPaymentRiskResult, 'source'>
): FailedPaymentRiskResult {
  const [result, setResult] = useState<FailedPaymentRiskResult>({
    ...fallback,
    source: 'fallback'
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const evaluateRisk = async () => {
      if (isLoading) return;
      
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
            domain: 'risk',
            context: { factors },
            transformer_id: TRANSFORMER_ID,
            fallback
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data && typeof data === 'object' && 
            Array.isArray(data.flags) && 
            typeof data.score_increase === 'number' &&
            Array.isArray(data.required_actions)) {
          setResult({
            flags: data.flags,
            score_increase: data.score_increase,
            required_actions: data.required_actions,
            source: 'brain'
          });
        } else {
          // Invalid response format, use fallback
          setResult({ ...fallback, source: 'fallback' });
        }
      } catch (error) {
        console.warn('Brain evaluation failed, using fallback:', error);
        setResult({ ...fallback, source: 'fallback' });
      } finally {
        setIsLoading(false);
      }
    };

    evaluateRisk();
  }, [factors.failedPayments, JSON.stringify(fallback)]);

  return result;
}