import { useState, useEffect } from 'react';

type SanctionsCheckResult = {
  reason: string;
  eligible: boolean;
  check_name: string;
};

type SanctionsCheckResponse = {
  result: SanctionsCheckResult | null;
  source: 'brain' | 'fallback';
  loading: boolean;
  error: Error | null;
};

export function useBrainRestrictedCountrySanctionsCheck(
  userCountry: string,
  fallback: SanctionsCheckResult | null
): SanctionsCheckResponse {
  const [result, setResult] = useState<SanctionsCheckResult | null>(fallback);
  const [source, setSource] = useState<'brain' | 'fallback'>('fallback');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    const evaluateRule = async () => {
      if (!userCountry) {
        setResult(fallback);
        setSource('fallback');
        return;
      }

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
            ruleName: 'restricted_country_sanctions_check',
            context: {
              user: {
                country: userCountry
              }
            },
            fallback
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (isMounted) {
          if (data.result !== undefined) {
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
  }, [userCountry, fallback]);

  return {
    result,
    source,
    loading,
    error
  };
}