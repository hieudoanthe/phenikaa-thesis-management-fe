import React from "react";
import PropTypes from "prop-types";
import { ErrorBoundary as ReactErrorBoundary } from "react-error-boundary";

/**
 * ErrorFallback component - hiển thị UI khi có lỗi
 * @param {Object} props - Component props
 * @param {Error} props.error - Error object
 * @param {Function} props.resetErrorBoundary - Function để reset error boundary
 */
function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
          <svg
            className="w-6 h-6 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>

        <div className="mt-4 text-center">
          <h3 className="text-lg font-medium text-gray-900">Đã xảy ra lỗi</h3>
          <p className="mt-2 text-sm text-gray-500">
            Rất tiếc, đã có lỗi xảy ra. Vui lòng thử lại.
          </p>

          <div className="mt-6">
            <button
              onClick={resetErrorBoundary}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Thử lại
            </button>
          </div>

          {process.env.NODE_ENV === "development" && error && (
            <details className="mt-4 text-left">
              <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                Chi tiết lỗi (Development)
              </summary>
              <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono overflow-auto">
                <div className="mb-2">
                  <strong>Error:</strong>
                  <pre className="whitespace-pre-wrap">{error.toString()}</pre>
                </div>
                <div>
                  <strong>Stack:</strong>
                  <pre className="whitespace-pre-wrap">{error.stack}</pre>
                </div>
              </div>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * ErrorBoundary component - bắt lỗi và hiển thị fallback UI
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 */
function ErrorBoundary({ children }) {
  return (
    <ReactErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, errorInfo) => {
        console.error("ErrorBoundary caught an error:", error, errorInfo);
      }}
      onReset={() => {
        console.log("ErrorBoundary reset triggered");
      }}
    >
      {children}
    </ReactErrorBoundary>
  );
}

// PropTypes
ErrorFallback.propTypes = {
  error: PropTypes.object.isRequired,
  resetErrorBoundary: PropTypes.func.isRequired,
};

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ErrorBoundary;
