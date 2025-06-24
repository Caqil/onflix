import React from "react";

export default function LoadingPage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        {/* OnFlix Logo */}
        <div className="mb-8">
          <h1 className="text-red-600 text-4xl font-bold">OnFlix</h1>
        </div>

        {/* Loading Animation */}
        <div className="relative">
          {/* Outer spinning ring */}
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600 mx-auto mb-4"></div>

          {/* Inner pulsing dot */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-4 h-4 bg-red-600 rounded-full animate-pulse"></div>
          </div>
        </div>

        {/* Loading Text */}
        <div className="space-y-2">
          <p className="text-white text-lg font-medium">Loading OnFlix...</p>
          <p className="text-gray-400 text-sm">Preparing your entertainment</p>
        </div>

        {/* Loading Progress Bar */}
        <div className="mt-6 w-64 mx-auto">
          <div className="bg-gray-800 rounded-full h-1 overflow-hidden">
            <div className="bg-red-600 h-full rounded-full animate-pulse w-full"></div>
          </div>
        </div>

        {/* Loading Dots Animation */}
        <div className="flex justify-center space-x-2 mt-8">
          <div className="w-2 h-2 bg-red-600 rounded-full animate-bounce"></div>
          <div
            className="w-2 h-2 bg-red-600 rounded-full animate-bounce"
            style={{ animationDelay: "0.1s" }}
          ></div>
          <div
            className="w-2 h-2 bg-red-600 rounded-full animate-bounce"
            style={{ animationDelay: "0.2s" }}
          ></div>
        </div>

        {/* Optional Loading Tips */}
        <div className="mt-12 max-w-md mx-auto">
          <p className="text-gray-500 text-xs">
            💡 Tip: Add content to your watchlist for easy access later
          </p>
        </div>
      </div>
    </div>
  );
}
