import { useState, useEffect } from 'react';

interface LimitReductionResult {
  effectiveAutoLimit: number;
  conditions: string[];
  source: 'brain' | 'fallback';
}

interface LimitReductionFallback {
  effectiveAutoLimit: number;
  conditions: string[];
}

export const useBrainMediumRiskAutoLimitReduction = (
  riskLevel: string,
  baseAutoLimit: number,
  fallback: LimitReductionFallback
): LimitReductionResult => {
  const [result, setResult] = useState<LimitReductionResult>({
    ...fallback,
    source: 'fallback'
  });

  useEffect(() => {
    const evaluateRule = async () => {
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
            context: {
              riskLevel,
              baseAutoLimit
            },
            transformer_id: TRANSFORMER_ID,
            fallback
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data && data.effectiveAutoLimit !== undefined) {
          setResult({
            effectiveAutoLimit: data.effectiveAutoLimit,
            conditions: data.conditions || [],
            source: 'brain'
          });
        } else {
          // No match from brain, use fallback
          setResult({
            ...fallback,
            source: 'fallback'
          });
        }
      } catch (error) {
        console.warn('Brain evaluation failed, using fallback:', error);
        setResult({
          ...fallback,
          source: 'fallback'
        });
      }
    };

    evaluateRule();
  }, [riskLevel, baseAutoLimit, fallback]);

  return result;
};