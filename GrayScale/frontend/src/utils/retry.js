// Retry a request on TEMPORARY failures only (slow/dropped connection, server busy).
// Business answers (400 bad request, 402 declined, 404, 409 conflict) are returned at once.
// Only use this for requests the backend treats as safe to repeat (all payment confirmations are).

export const isTransientError = (error) => {
  if (!error?.response) return true; // network error, timeout, CORS/offline
  const status = error.response.status;
  return status === 429 || status >= 500;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * @param {() => Promise<T>} fn         the request
 * @param {object} opts
 * @param {number} opts.retries         extra attempts after the first (default 3)
 * @param {number} opts.baseDelay       first wait in ms, doubles each time (default 1000)
 * @param {(attempt:number) => void} opts.onRetry  e.g. show "Still confirming..."
 */
export const withRetry = async (fn, { retries = 3, baseDelay = 1000, onRetry } = {}) => {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (!isTransientError(error) || attempt === retries) throw error;
      onRetry?.(attempt + 1);
      await sleep(baseDelay * 2 ** attempt); // 1s, 2s, 4s ...
    }
  }
  throw lastError;
};
