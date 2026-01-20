import { useState, useEffect } from 'react';

interface B2BEligibilityResult {
  reason: string;
  eligible: boolean;
  source: 'brain' | 'fallback';
}

interface UseBrainB2bDomainEligibilityCheckProps {
  emailDomain: string;
  fallback: B2BEligibilityResult;
}

export function useBrainB2bDomainEligibilityCheck({ emailDomain, fallback }: UseBrainB2bDomainEligibilityCheckProps) {
  const [result, setResult] = useState<B2BEligibilityResult>({
    ...fallback,
    source: 'fallback'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!emailDomain) {
      setResult({ ...fallback, source: 'fallback' });
      return;
    }

    const evaluateEligibility = async () => {
      setLoading(true);
      setError(null);

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
            domain: 'eligibility',
            context: { email_domain: emailDomain },
            transformer_id: TRANSFORMER_ID,
            fallback
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data && typeof data.eligible === 'boolean' && data.reason) {
          setResult({
            reason: data.reason,
            eligible: data.eligible,
            source: 'brain'
          });
        } else {
          // No valid brain result, use fallback
          setResult({ ...fallback, source: 'fallback' });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        // Always use fallback on error
        setResult({ ...fallback, source: 'fallback' });
      } finally {
        setLoading(false);
      }
    };

    evaluateEligibility();
  }, [emailDomain, fallback]);

  return { result, loading, error };
}