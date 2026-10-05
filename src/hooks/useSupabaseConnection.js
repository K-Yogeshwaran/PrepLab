import { useState, useEffect, useCallback } from 'react';
import { verifySupabaseConnection } from '../lib/supabase';

export function useSupabaseConnection() {
  const [status, setStatus] = useState('Connecting'); // 'Connecting' | 'Connected' | 'Connection Error'
  const [errorMessage, setErrorMessage] = useState(null);

  const checkConnection = useCallback(async () => {
    setStatus('Connecting');
    setErrorMessage(null);
    try {
      const result = await verifySupabaseConnection();
      if (result.connected) {
        setStatus('Connected');
        setErrorMessage(null);
      } else {
        setStatus('Connection Error');
        setErrorMessage(result.error);
      }
    } catch (err) {
      setStatus('Connection Error');
      setErrorMessage(err.message || 'Unknown connection error');
    }
  }, []);

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  return {
    status,
    errorMessage,
    retry: checkConnection,
  };
}
