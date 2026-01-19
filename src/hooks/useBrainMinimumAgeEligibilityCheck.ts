import { useState, useEffect } from 'react';

interface AgeEligibilityResult {
  reason: string;
  eligible: boolean;
  check_name: string;
}

interface UseBrainMinimumAgeEligibilityCheckResult {
  result: AgeEligibilityResult | null;
  loading: boolean;
  error: Error | null;
  source: 'brain' | 'fallback';
}

interface UserContext {
  age: number;
}

export function useBrainMinimumAgeEligibilityCheck(
  user: UserContext,
  fallback: AgeEligibilityResult | null
): UseBrainMinimumAgeEligibilityCheckResult {
  const [result, setResult] = useState<AgeEligibilityResult | null>(fallback);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [source, setSource] = useState<'brain' | 'fallback'>('fallback');

  useEffect(() => {
    let isMounted = true;

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
            domain: 'eligibility',
            ruleName: 'minimum_age_eligibility_check',
            context: { user },
            fallback
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (isMounted) {
          if (data.result !== undefined && data.result !== null) {
            setResult(data.result);
            setSource('brain');
          } else {
            setResult(fallback);
            setSource('fallback');
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Unknown error'));
          setResult(fallback);
          setSource('fallback');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    evaluateRule();

    return () => {
      isMounted = false;
    };
  }, [user.age, fallback]);

  return { result, loading, error, source };
}