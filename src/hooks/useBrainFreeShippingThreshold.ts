import { useState, useEffect } from 'react';

interface FreeShippingResult {
  method: string;
  threshold: number;
  freeShipping: boolean;
  source: 'brain' | 'fallback';
}

interface UseBrainFreeShippingThresholdParams {
  orderTotal: number;
  isExpedited: boolean;
  fallback: Omit<FreeShippingResult, 'source'>;
}

export function useBrainFreeShippingThreshold({
  orderTotal,
  isExpedited,
  fallback
}: UseBrainFreeShippingThresholdParams): FreeShippingResult {
  const [result, setResult] = useState<FreeShippingResult>({
    ...fallback,
    source: 'fallback'
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const evaluateRule = async () => {
      setIsLoading(true);
      
      try {
        const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://fyknidhqafrhrscnexne.supabase.co';
        const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_9Axs3pBaWTih_u6pCO85rg_dDh8Muf-';
        const TRANSFORMER_ID = 'b2dade50-588c-4de9-8dff-9d30ee5dd81a';
        
        const context = {
          orderTotal,
          isExpedited
        };
        
        const response = await fetch(`${SUPABASE_URL}/functions/v1/evaluate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'apikey': SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ 
            domain: 'shipping', 
            context, 
            transformer_id: TRANSFORMER_ID,
            fallback 
          }),
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data && data.method && typeof data.threshold === 'number' && typeof data.freeShipping === 'boolean') {
          setResult({
            method: data.method,
            threshold: data.threshold,
            freeShipping: data.freeShipping,
            source: 'brain'
          });
        } else {
          // No valid brain result, use fallback
          setResult({
            ...fallback,
            source: 'fallback'
          });
        }
      } catch (error) {
        console.warn('Brain evaluation failed, using fallback:', error);
        setResult({
          ...fallback,
          source: 'fallback'
        });
      } finally {
        setIsLoading(false);
      }
    };

    evaluateRule();
  }, [orderTotal, isExpedited, fallback]);

  return result;
}