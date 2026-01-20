import { useState, useEffect, useCallback } from 'react';

interface RiskEvaluationResult {
  reason: string;
  status: string;
  conditions: string[];
  approverLevel: string;
  escalationPath: string[];
}

interface BrainRiskEvaluationResponse {
  result: RiskEvaluationResult;
  source: 'brain' | 'fallback';
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://fyknidhqafrhrscnexne.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_9Axs3pBaWTih_u6pCO85rg_dDh8Muf-';
const TRANSFORMER_ID = 'b2dade50-588c-4de9-8dff-9d30ee5dd81a';

export const useBrainCriticalRiskAutoReject = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const evaluate = useCallback(async (
    context: { riskLevel: string },
    fallback: RiskEvaluationResult
  ): Promise<BrainRiskEvaluationResponse> => {
    // Start with fallback value for zero-impact
    if (!context.riskLevel || context.riskLevel !== 'critical') {
      return { result: fallback, source: 'fallback' };
    }

    setIsLoading(true);
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
      
      if (data.result) {
        return { result: data.result, source: 'brain' };
      }
      
      // No match found, use fallback
      return { result: fallback, source: 'fallback' };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.warn('Brain evaluation failed, using fallback:', errorMessage);
      
      // Always return fallback on error for zero-impact
      return { result: fallback, source: 'fallback' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    evaluate,
    isLoading,
    error
  };
};