"use client";

import React from "react";

const { useState, useEffect } = React;

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application error:", error);
  }, [error]);

  const handleRetry = async () => {
    setIsRetrying(true);

    // Add a small delay to show the loading state
    await new Promise((resolve) => setTimeout(resolve, 1000));

    try {
      reset();
    } finally {
      setIsRetrying(false);
    }
  };

  const getErrorMessage = () => {
    if (error.message.includes("fetch")) {
      return "Unable to connect to OnFlix servers. Please check your internet connection.";
    }
    if (error.message.includes("404")) {
      return "The content you're looking for could not be found.";
    }
    if (error.message.includes("401") || error.message.includes("403")) {
      return "You don't have permission to access this content. Please sign in.";
    }
    if (error.message.includes("500")) {
      return "OnFlix servers are temporarily unavailable. Please try again later.";
    }
    return "Something unexpected happened. We're working to fix it.";
  };

  const getErrorIcon = () => {
    if (error.message.includes("fetch") || error.message.includes("network")) {
      return "📡";
    }
    if (error.message.includes("404")) {
      return "🔍";
    }
    if (error.message.includes("401") || error.message.includes("403")) {
      return "🔐";
    }
    return "⚠️";
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="text-center max-w-md mx-auto">
        {/* OnFlix Logo */}
        <div className="mb-8">
          <h1 className="text-red-600 text-3xl font-bold">OnFlix</h1>
        </div>

        {/* Error Icon */}
        <div className="text-6xl mb-6 animate-bounce">{getErrorIcon()}</div>

        {/* Error Title */}
        <h1 className="text-white text-2xl font-bold mb-4">
          Oops! Something went wrong
        </h1>

        {/* Error Description */}
        <p className="text-gray-400 mb-6 leading-relaxed">
          {getErrorMessage()}
        </p>

        {/* Error Details (Development Mode) */}
        {process.env.NODE_ENV === "development" && (
          <details className="mb-6 text-left">
            <summary className="text-gray-500 text-sm cursor-pointer hover:text-gray-400">
              Technical Details (Dev Mode)
            </summary>
            <div className="mt-2 p-4 bg-gray-900 rounded-lg text-xs text-gray-300 font-mono break-all">
              <p>
                <strong>Error:</strong> {error.message}
              </p>
              {error.digest && (
                <p>
                  <strong>Digest:</strong> {error.digest}
                </p>
              )}
              {error.stack && (
                <details className="mt-2">
                  <summary className="cursor-pointer">Stack Trace</summary>
                  <pre className="mt-2 text-xs overflow-auto">
                    {error.stack}
                  </pre>
                </details>
              )}
            </div>
          </details>
        )}

        {/* Action Buttons */}
        <div className="space-y-4">
          <button
            onClick={handleRetry}
            disabled={isRetrying}
            className="w-full bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isRetrying ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Retrying...</span>
              </>
            ) : (
              <>
                <RefreshIcon />
                <span>Try Again</span>
              </>
            )}
          </button>

          <button
            onClick={() => (window.location.href = "/")}
            className="w-full bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-600 transition-colors flex items-center justify-center space-x-2"
          >
            <HomeIcon />
            <span>Go Home</span>
          </button>
        </div>

        {/* Support Information */}
        <div className="mt-8 pt-6 border-t border-gray-800">
          <p className="text-gray-500 text-sm mb-2">Still having issues?</p>
          <a
            href="/help"
            className="text-red-500 hover:text-red-400 text-sm underline"
          >
            Contact Support
          </a>
        </div>

        {/* Error ID for Support */}
        {error.digest && (
          <div className="mt-4">
            <p className="text-gray-600 text-xs">
              Error ID:{" "}
              <code className="bg-gray-800 px-1 rounded">
                {error.digest.slice(0, 8)}
              </code>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Icon Components
function RefreshIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
      />
    </svg>
  );
}
