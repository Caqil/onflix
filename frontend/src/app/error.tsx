"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="text-red-600 text-6xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold text-white mb-4">
          Something went wrong!
        </h1>
        <p className="text-gray-400 mb-6">
          We're sorry, but something unexpected happened. Please try again.
        </p>
        <div className="space-y-4">
          <Button
            onClick={reset}
            className="bg-red-600 hover:bg-red-700 w-full"
          >
            Try again
          </Button>
          <Button
            variant="outline"
            onClick={() => (window.location.href = "/")}
            className="border-gray-600 text-white hover:bg-gray-800 w-full"
          >
            Go home
          </Button>
        </div>
        {process.env.NODE_ENV === "development" && (
          <details className="mt-6 text-left">
            <summary className="text-gray-400 cursor-pointer mb-2">
              Error details (dev only)
            </summary>
            <pre className="text-xs text-red-400 bg-gray-900 p-4 rounded overflow-auto">
              {error.message}
              {error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
