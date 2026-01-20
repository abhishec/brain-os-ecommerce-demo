import { useState, useEffect } from 'react';

interface RiskAssessmentResult {
  level: 'critical' | 'high' | 'medium' | 'low';
  assignee: 'risk_team' | 'manager' | 'reviewer' | 'system';
  next_state: 'risk_team_review' | 'manager_approval' | 'standard_review' | 'auto_approved';
  recommendation: 'decline' | 'review' | 'approve';
  required_actions?: string[];
  source: 'brain' | 'fallback';
}

interface UseBrainRiskAssessmentApprovalWorkflowOptions {
  context: {
    risk_score: number;
  };
  fallback: Omit<RiskAssessmentResult, 'source'>;
  enabled?: boolean;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://fyknidhqafrhrscnexne.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_9Axs3pBaWTih_u6pCO85rg_dDh8Muf-';
const TRANSFORMER_ID = 'b2dade50-588c-4de9-8dff-9d30ee5dd81a';

export function useBrainRiskAssessmentApprovalWorkflow({
  context,
  fallback,
  enabled = true
}: UseBrainRiskAssessmentApprovalWorkflowOptions) {
  const [result, setResult] = useState<RiskAssessmentResult>({
    ...fallback,
    source: 'fallback'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled || !context?.risk_score) {
      setResult({ ...fallback, source: 'fallback' });
      return;
    }

    const evaluateRiskAssessment = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`${SUPABASE_URL}/functions/v1/evaluate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'apikey': SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            domain: 'workflow',
            context,
            transformer_id: TRANSFORMER_ID,
            fallback
          }),
        });

        if (!response.ok) {
          throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();
        
        if (data && typeof data === 'object' && data.level) {
          setResult({
            level: data.level,
            assignee: data.assignee,
            next_state: data.next_state,
            recommendation: data.recommendation,
            required_actions: data.required_actions,
            source: 'brain'
          });
        } else {
          setResult({ ...fallback, source: 'fallback' });
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
        setResult({ ...fallback, source: 'fallback' });
      } finally {
        setIsLoading(false);
      }
    };

    evaluateRiskAssessment();
  }, [context?.risk_score, enabled, JSON.stringify(fallback)]);

  return {
    result,
    isLoading,
    error,
    isBrainResult: result.source === 'brain'
  };
}