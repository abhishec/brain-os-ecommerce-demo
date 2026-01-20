import { useState, useEffect } from 'react';

interface MembershipDurationResult {
  memberMonths: number;
  source: 'brain' | 'fallback';
}

interface Customer {
  memberSince: Date;
  [key: string]: any;
}

const useBrainCalculateMembershipDurationMonths = (
  customer: Customer,
  fallback: number
): MembershipDurationResult => {
  const [result, setResult] = useState<MembershipDurationResult>({
    memberMonths: fallback,
    source: 'fallback'
  });

  useEffect(() => {
    const evaluateRule = async () => {
      try {
        const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://fyknidhqafrhrscnexne.supabase.co';
        const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_9Axs3pBaWTih_u6pCO85rg_dDh8Muf-';
        const TRANSFORMER_ID = 'b2dade50-588c-4de9-8dff-9d30ee5dd81a';

        const context = {
          customer: {
            memberSince: customer.memberSince?.toISOString?.() || customer.memberSince,
            ...customer
          }
        };

        const response = await fetch(`${SUPABASE_URL}/functions/v1/evaluate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'apikey': SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            domain: 'calculation',
            context,
            transformer_id: TRANSFORMER_ID,
            fallback
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data?.result?.memberMonths !== undefined) {
          setResult({
            memberMonths: data.result.memberMonths,
            source: 'brain'
          });
        } else {
          setResult({
            memberMonths: fallback,
            source: 'fallback'
          });
        }
      } catch (error) {
        console.warn('Brain evaluation failed, using fallback:', error);
        setResult({
          memberMonths: fallback,
          source: 'fallback'
        });
      }
    };

    if (customer?.memberSince) {
      evaluateRule();
    } else {
      setResult({
        memberMonths: fallback,
        source: 'fallback'
      });
    }
  }, [customer, fallback]);

  return result;
};

export default useBrainCalculateMembershipDurationMonths;