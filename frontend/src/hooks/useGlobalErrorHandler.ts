import { toast } from 'sonner';
import { useErrorTranslator, useRateLimitMessage } from '@/lib/errorTranslator';
import { AxiosError } from 'axios';
import { useCallback } from 'react';

/**
 * Global error handler hook for consistent error handling across the application
 * Provides utilities for translating and displaying errors
 *
 * @example
 * const { handleError } = useGlobalErrorHandler();
 *
 * try {
 *   await api.call();
 * } catch (error) {
 *   handleError(error);
 * }
 */
export function useGlobalErrorHandler() {
  const translateError = useErrorTranslator();
  const rateLimitMessage = useRateLimitMessage();

  /**
   * Handle error by translating and showing toast notification
   * @param error - The error to handle
   * @param customMessage - Optional custom message to override translation
   */
  const handleError = useCallback((error: unknown, customMessage?: string) => {
    // Log error for debugging
    console.error('Error:', error);

    // Check if it's a rate limit error (429)
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 429) {
        toast.error(rateLimitMessage.title, {
          description: rateLimitMessage.description,
          duration: 5000,
        });
        return;
      }
    }

    // Use custom message or translate error
    const message = customMessage || translateError(error);
    toast.error(message);
  }, [translateError, rateLimitMessage]);

  /**
   * Get error handler for React Query mutations
   * @param customMessage - Optional custom message to override translation
   * @returns Object with onError handler
   *
   * @example
   * const mutation = useMutation({
   *   mutationFn: api.create,
   *   ...getMutationErrorHandler()
   * })
   */
  const getMutationErrorHandler = useCallback((customMessage?: string) => ({
    onError: (error: unknown) => {
      handleError(error, customMessage);
    }
  }), [handleError]);

  /**
   * Get the translated error message without showing toast
   * Useful when you want to handle the error message manually
   *
   * @example
   * const errorMessage = getErrorMessage(error);
   * setFormError(errorMessage);
   */
  const getErrorMessage = useCallback((error: unknown): string => {
    return translateError(error);
  }, [translateError]);

  return {
    handleError,
    getMutationErrorHandler,
    getErrorMessage
  };
}
