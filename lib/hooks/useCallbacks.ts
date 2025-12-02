'use client';

import { useState, useCallback, useRef } from 'react';
import type { CallbackEventData } from '@/types/callbacks';
import { CustomCallbackHandler } from '@/lib/langchain/callbacks/custom-handler';

/**
 * React hook for managing callback events
 */
export function useCallbacks() {
  const [events, setEvents] = useState<CallbackEventData[]>([]);
  const handlerRef = useRef<CustomCallbackHandler | null>(null);

  const createHandler = useCallback((executionId?: string) => {
    const handler = new CustomCallbackHandler(executionId);
    
    // Add callback to collect events
    handler.addCallback((event) => {
      setEvents((prev) => [...prev, event]);
    });

    handlerRef.current = handler;
    return handler;
  }, []);

  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  const getHandler = useCallback(() => {
    return handlerRef.current;
  }, []);

  return {
    events,
    createHandler,
    clearEvents,
    getHandler,
  };
}

