import { useState, useEffect } from 'react';

interface RiskDecision {
  reason: string;
  status: string;
  conditions: string[];
  approverLevel: string;
  escalationPath: string[];
}

interface RiskDecisionResult {
  data: RiskDecision | null;
  loading: boolean;
  error: string | null;
  source: 'brain' | 'fallback';
}

interface UseBrainCriticalRiskAutoRejectParams {
  riskLevel: string;
  fallback: RiskDecision | null;
  enabled?: boolean;
}

export function useBrainCriticalRiskAutoReject({
  riskLevel,
  fallback,
  enabled = true
}: UseBrainCriticalRiskAutoRejectParams): RiskDecisionResult {
  const [data, setData] = useState<RiskDecision | null>(fallback);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<'brain' | 'fallback'>('fallback');

  useEffect(() => {
    if (!enabled) {
      setData(fallback);
      setSource('fallback');
      return;
    }

    const evaluateRule = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/brain/evaluate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            domain: 'risk',
            ruleName: 'critical_risk_auto_reject',
            context: {
              riskLevel
            },
            fallback
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.success && result.data !== undefined) {
          setData(result.data);
          setSource('brain');
        } else {
          // No match from brain logic, use fallback
          setData(fallback);
          setSource('fallback');
        }
      } catch (err) {
        // On any error, always fall back to original behavior
        setError(err instanceof Error ? err.message : 'Unknown error');
        setData(fallback);
        setSource('fallback');
      } finally {
        setLoading(false);
      }
    };

    evaluateRule();
  }, [riskLevel, fallback, enabled]);

  return {
    data,
    loading,
    error,
    source
  };
}