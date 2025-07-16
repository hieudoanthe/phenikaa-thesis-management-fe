import { useState, useCallback, useEffect } from "react";

/**
 * Custom hook để quản lý API calls
 * @param {Function} apiFunction - Function gọi API
 * @param {Object} options - Options cho hook
 * @returns {Object} - { data, loading, error, execute, reset }
 */
const useApi = (apiFunction, options = {}) => {
  const {
    immediate = false, // Có gọi API ngay khi mount không
    initialData = null, // Data ban đầu
    onSuccess = null, // Callback khi thành công
    onError = null, // Callback khi lỗi
    dependencies = [], // Dependencies để auto re-fetch
  } = options;

  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Reset state
  const reset = useCallback(() => {
    setData(initialData);
    setLoading(false);
    setError(null);
  }, [initialData]);

  // Execute API call
  const execute = useCallback(
    async (...args) => {
      try {
        setLoading(true);
        setError(null);

        const result = await apiFunction(...args);

        if (result.success) {
          setData(result.data);
          setError(null);
          onSuccess?.(result.data, result.message);
        } else {
          setError(result.error || result.message);
          setData(null);
          onError?.(result.error, result.message);
        }
      } catch (err) {
        const errorMessage = err.message || "Có lỗi xảy ra";
        setError(errorMessage);
        setData(null);
        onError?.(err, errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [apiFunction, onSuccess, onError]
  );

  // Auto execute khi dependencies thay đổi
  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [immediate, execute, ...dependencies]);

  return {
    data,
    loading,
    error,
    execute,
    reset,
    // Helper để kiểm tra có data không
    hasData: data !== null && data !== undefined,
    // Helper để kiểm tra có lỗi không
    hasError: error !== null,
  };
};

export default useApi;
