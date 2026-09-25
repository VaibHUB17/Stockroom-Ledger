import { useState, useRef, useCallback } from "react";

export function useSubmitGuard<T = void>() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const guardRef = useRef(false);

  const execute = useCallback(
    async (action: () => Promise<T>): Promise<T | undefined> => {
      // Synchronous check prevents simultaneous invocation from rapid clicks
      if (guardRef.current) {
        return undefined;
      }

      guardRef.current = true;
      setIsSubmitting(true);

      try {
        const result = await action();
        return result;
      } finally {
        guardRef.current = false;
        setIsSubmitting(false);
      }
    },
    []
  );

  return {
    isSubmitting,
    execute,
  };
}
