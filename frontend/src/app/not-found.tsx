import React from "react";

export default function NotFoundPage() {
  const suggestions = [
    { title: "Popular Movies", href: "/movies", icon: "🎬" },
    { title: "TV Shows", href: "/tv-shows", icon: "📺" },
    { title: "My Watchlist", href: "/my-list", icon: "📋" },
    { title: "Browse by Genre", href: "/genres", icon: "🎭" },
  ];

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="text-center max-w-2xl mx-auto">
        {/* OnFlix Logo */}
        <div className="mb-8">
          <a
            href="/"
            className="text-red-600 text-3xl font-bold hover:text-red-500 transition-colors"
          >
            OnFlix
          </a>
        </div>

        {/* 404 Animation */}
        <div className="mb-8">
          <div className="text-8xl font-bold text-red-600 mb-4 animate-pulse">
            404
          </div>
          <div className="text-4xl mb-4">🎭</div>
        </div>

        {/* Error Message */}
        <h1 className="text-white text-3xl font-bold mb-4">
          This page has left the building
        </h1>

        <p className="text-gray-400 text-lg mb-8 leading-relaxed">
          The page you're looking for doesn't exist. It might have been moved,
          deleted, or you entered the wrong URL. But don't worry - there's
          plenty of great content waiting for you!
        </p>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-md mx-auto">
            <input
              type="text"
              placeholder="Search for movies, TV shows..."
              className="w-full bg-gray-800 text-white px-4 py-3 pr-12 rounded-lg border border-gray-700 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  const query = (e.target as HTMLInputElement).value;
                  if (query.trim()) {
                    window.location.href = `/search?q=${encodeURIComponent(
                      query.trim()
                    )}`;
                  }
                }
              }}
            />
            <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors">
              <SearchIcon />
            </button>
          </div>
        </div>

        {/* Quick Navigation */}
        <div className="mb-8">
          <h2 className="text-white text-xl font-semibold mb-4">
            Popular destinations
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {suggestions.map((item, index) => (
              <a
                key={index}
                href={item.href}
                className="bg-gray-800 hover:bg-gray-700 p-4 rounded-lg transition-colors group"
              >
                <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">
                  {item.icon}
                </div>
                <h3 className="text-white font-medium text-sm">{item.title}</h3>
              </a>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4 mb-8">
          <a
            href="/"
            className="bg-red-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
          >
            <HomeIcon />
            <span>Go Home</span>
          </a>

          <button
            onClick={() => window.history.back()}
            className="bg-gray-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-600 transition-colors flex items-center justify-center space-x-2"
          >
            <ArrowLeftIcon />
            <span>Go Back</span>
          </button>
        </div>

        {/* Fun Section */}
        <div className="bg-gray-900 rounded-lg p-6 mb-8">
          <h3 className="text-white text-lg font-semibold mb-3">
            While you're here...
          </h3>
          <p className="text-gray-400 text-sm mb-4">
            Did you know OnFlix has over 10,000 hours of content? That's enough
            to watch for 416 days straight!
          </p>
          <div className="flex justify-center space-x-8 text-center">
            <div>
              <div className="text-red-500 text-2xl font-bold">1,000+</div>
              <div className="text-gray-400 text-xs">Movies</div>
            </div>
            <div>
              <div className="text-red-500 text-2xl font-bold">500+</div>
              <div className="text-gray-400 text-xs">TV Shows</div>
            </div>
            <div>
              <div className="text-red-500 text-2xl font-bold">50+</div>
              <div className="text-gray-400 text-xs">Genres</div>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="border-t border-gray-800 pt-6">
          <p className="text-gray-500 text-sm mb-2">
            Need help finding what you're looking for?
          </p>
          <a
            href="/help"
            className="text-red-500 hover:text-red-400 text-sm underline"
          >
            Visit our Help Center
          </a>
        </div>
      </div>
    </div>
  );
}

// Icon Components
function SearchIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
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

function ArrowLeftIcon() {
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
        d="M10 19l-7-7m0 0l7-7m-7 7h18"
      />
    </svg>
  );
}
