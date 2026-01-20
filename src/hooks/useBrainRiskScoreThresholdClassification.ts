import { useState, useEffect } from 'react';

interface RiskThresholds {
  low_threshold: number;
  medium_threshold: number;
  high_threshold: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  action: string;
}

interface UseBrainRiskScoreThresholdClassificationResult {
  data: RiskThresholds;
  loading: boolean;
  error: string | null;
  source: 'brain' | 'fallback';
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://fyknidhqafrhrscnexne.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_9Axs3pBaWTih_u6pCO85rg_dDh8Muf-';
const TRANSFORMER_ID = 'b2dade50-588c-4de9-8dff-9d30ee5dd81a';

export const useBrainRiskScoreThresholdClassification = (
  riskScore: number,
  fallback: RiskThresholds
): UseBrainRiskScoreThresholdClassificationResult => {
  const [data, setData] = useState<RiskThresholds>(fallback);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<'brain' | 'fallback'>('fallback');

  useEffect(() => {
    const evaluateRiskThresholds = async () => {
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
            context: { risk_score: riskScore },
            transformer_id: TRANSFORMER_ID,
            fallback
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (result && result.data) {
          setData(result.data);
          setSource('brain');
        } else {
          setData(fallback);
          setSource('fallback');
        }
      } catch (err) {
        console.warn('Brain evaluation failed, using fallback:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setData(fallback);
        setSource('fallback');
      } finally {
        setLoading(false);
      }
    };

    evaluateRiskThresholds();
  }, [riskScore, fallback]);

  return { data, loading, error, source };
};