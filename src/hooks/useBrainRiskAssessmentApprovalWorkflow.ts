import { useState, useEffect } from 'react';

interface RiskAssessmentResult {
  level: 'critical' | 'high' | 'medium' | 'low';
  assignee: 'risk_team' | 'manager' | 'reviewer' | 'system';
  next_state: 'risk_team_review' | 'manager_approval' | 'standard_review' | 'auto_approved';
  recommendation: 'decline' | 'review' | 'approve';
  required_actions?: string[];
}

interface UseBrainRiskAssessmentApprovalWorkflowResult {
  data: RiskAssessmentResult;
  loading: boolean;
  error: Error | null;
  source: 'brain' | 'fallback';
}

interface RiskAssessmentContext {
  risk_score: number;
  [key: string]: any;
}

export function useBrainRiskAssessmentApprovalWorkflow(
  context: RiskAssessmentContext,
  fallback: RiskAssessmentResult
): UseBrainRiskAssessmentApprovalWorkflowResult {
  const [data, setData] = useState<RiskAssessmentResult>(fallback);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [source, setSource] = useState<'brain' | 'fallback'>('fallback');

  useEffect(() => {
    if (!context?.risk_score && context?.risk_score !== 0) {
      setData(fallback);
      setSource('fallback');
      return;
    }

    setLoading(true);
    setError(null);

    const evaluateRule = async () => {
      try {
        const response = await fetch('/api/brain/evaluate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            domain: 'workflow',
            ruleName: 'risk_assessment_approval_workflow',
            context,
            fallback
          }),
        });

        if (!response.ok) {
          throw new Error(`API request failed: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.success && result.data) {
          setData(result.data);
          setSource('brain');
        } else {
          setData(fallback);
          setSource('fallback');
        }
      } catch (err) {
        console.warn('Brain evaluation failed, using fallback:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
        setData(fallback);
        setSource('fallback');
      } finally {
        setLoading(false);
      }
    };

    evaluateRule();
  }, [context, fallback]);

  return {
    data,
    loading,
    error,
    source
  };
}