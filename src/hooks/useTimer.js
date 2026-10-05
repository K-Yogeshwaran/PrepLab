import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * High-precision timer hook using performance.now() to avoid drift.
 */
export function useTimer(autoStart = false) {
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isRunning, setIsRunning] = useState(autoStart);

  const startTimeRef = useRef(null);
  const accumulatedMsRef = useRef(0);
  const animationFrameRef = useRef(null);

  const tick = useCallback(() => {
    if (!startTimeRef.current) return;
    const now = performance.now();
    const currentElapsed = accumulatedMsRef.current + (now - startTimeRef.current);
    setElapsedMs(Math.round(currentElapsed));
    animationFrameRef.current = requestAnimationFrame(tick);
  }, []);

  const start = useCallback(() => {
    if (!isRunning) {
      startTimeRef.current = performance.now();
      setIsRunning(true);
    }
  }, [isRunning]);

  const pause = useCallback(() => {
    if (isRunning) {
      if (startTimeRef.current) {
        accumulatedMsRef.current += performance.now() - startTimeRef.current;
      }
      startTimeRef.current = null;
      setIsRunning(false);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
  }, [isRunning]);

  const reset = useCallback(() => {
    startTimeRef.current = isRunning ? performance.now() : null;
    accumulatedMsRef.current = 0;
    setElapsedMs(0);
  }, [isRunning]);

  const getElapsedMs = useCallback(() => {
    if (isRunning && startTimeRef.current) {
      return Math.round(accumulatedMsRef.current + (performance.now() - startTimeRef.current));
    }
    return Math.round(accumulatedMsRef.current);
  }, [isRunning]);

  useEffect(() => {
    if (isRunning) {
      startTimeRef.current = performance.now();
      animationFrameRef.current = requestAnimationFrame(tick);
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isRunning, tick]);

  return {
    elapsedMs,
    isRunning,
    start,
    pause,
    reset,
    getElapsedMs,
  };
}
