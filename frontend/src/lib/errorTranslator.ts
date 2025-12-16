import { useTranslations } from 'next-intl';
import { AxiosError } from 'axios';

/**
 * Extracts error code from various error types
 * Supports Axios errors, custom error objects, and generic errors
 */
function extractErrorCode(error: unknown): string | null {
  // Handle Axios errors with error code in response data
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as AxiosError<{ code?: string; message?: string }>;

    // Check for error code in response data
    if (axiosError.response?.data?.code) {
      return axiosError.response.data.code;
    }

    // Fallback to HTTP status code mapping
    if (axiosError.response?.status === 429) {
      return 'RATE_LIMIT';
    }

    if (axiosError.response?.status === 401) {
      return 'UNAUTHORIZED';
    }

    if (axiosError.response?.status === 403) {
      return 'FORBIDDEN';
    }

    if (axiosError.response?.status === 404) {
      return 'NOT_FOUND';
    }

    if (axiosError.response?.status === 400) {
      return 'BAD_REQUEST';
    }

    if (axiosError.response?.status && axiosError.response.status >= 500) {
      return 'INTERNAL_SERVER_ERROR';
    }
  }

  // Handle custom error objects with code property
  if (error && typeof error === 'object' && 'code' in error && typeof error.code === 'string') {
    return error.code;
  }

  // Handle network errors (no response)
  if (error && typeof error === 'object' && 'isAxiosError' in error) {
    const axiosError = error as AxiosError;
    if (!axiosError.response) {
      return 'NETWORK_ERROR';
    }
  }

  return null;
}

/**
 * Hook to translate error codes to user-friendly messages
 * Uses next-intl for localization
 *
 * @example
 * const translateError = useErrorTranslator();
 *
 * try {
 *   await api.call();
 * } catch (error) {
 *   const message = translateError(error);
 *   toast.error(message);
 * }
 */
export function useErrorTranslator() {
  const t = useTranslations('errors');

  return (error: unknown): string => {
    const code = extractErrorCode(error);

    // Special handling for rate limiting
    if (code === 'RATE_LIMIT') {
      return t('rateLimiting.title');
    }

    // If we have a code, try to translate it
    if (code) {
      // Try to get translation from errors.api namespace
      const translationKey = `api.${code}`;
      const translation = t(translationKey);

      // If translation exists and is not the key itself, return it
      if (translation && translation !== translationKey) {
        return translation;
      }

      // Try generic errors
      const genericKey = `generic.${code}`;
      const genericTranslation = t(genericKey);
      if (genericTranslation && genericTranslation !== genericKey) {
        return genericTranslation;
      }
    }

    // Fallback to generic error message
    return t('fallback');
  };
}

/**
 * Get special message for rate limiting with description
 * Used for enhanced error display with toast descriptions
 */
export function useRateLimitMessage() {
  const t = useTranslations('errors.rateLimiting');

  return {
    title: t('title'),
    description: t('description')
  };
}
