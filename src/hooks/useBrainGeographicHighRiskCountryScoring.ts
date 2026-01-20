import { useState, useEffect } from 'react';

interface GeographicRiskResult {
  flags: string[];
  score_increment: number;
  required_actions: string[];
  source: 'brain' | 'fallback';
}

interface GeographicRiskFallback {
  flags: string[];
  score_increment: number;
  required_actions: string[];
}

export function useBrainGeographicHighRiskCountryScoring(
  countryCode: string,
  fallback: GeographicRiskFallback
): GeographicRiskResult {
  const [result, setResult] = useState<GeographicRiskResult>({
    ...fallback,
    source: 'fallback'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!countryCode) {
      setResult({ ...fallback, source: 'fallback' });
      return;
    }

    setLoading(true);

    const evaluateRule = async () => {
      try {
        const response = await fetch('/api/brain/evaluate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            domain: 'risk',
            ruleName: 'geographic_high_risk_country_scoring',
            context: {
              factors: {
                countryCode
              }
            },
            fallback
          })
        });

        if (!response.ok) {
          throw new Error('Failed to evaluate rule');
        }

        const data = await response.json();
        
        if (data.result && typeof data.result === 'object') {
          setResult({
            flags: data.result.flags || fallback.flags,
            score_increment: data.result.score_increment ?? fallback.score_increment,
            required_actions: data.result.required_actions || fallback.required_actions,
            source: 'brain'
          });
        } else {
          setResult({ ...fallback, source: 'fallback' });
        }
      } catch (error) {
        console.warn('Brain evaluation failed, using fallback:', error);
        setResult({ ...fallback, source: 'fallback' });
      } finally {
        setLoading(false);
      }
    };

    evaluateRule();
  }, [countryCode, fallback]);

  return result;
}