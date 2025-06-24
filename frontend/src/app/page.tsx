import React from "react";

const { useState, useEffect } = React;

interface Movie {
  id: string;
  title: string;
  description: string;
  poster_url: string;
  backdrop_url: string;
  rating: number;
  type: string;
  genre: string[];
  duration?: number;
}

export default function HomePage() {
  const [featuredContent, setFeaturedContent] = useState<Movie | null>(null);
  const [trendingMovies, setTrendingMovies] = useState<Movie[]>([]);
  const [newReleases, setNewReleases] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        setLoading(true);

        // Fetch featured content
        const featuredResponse = await fetch(
          "http://localhost:8080/api/v1/content/featured"
        );
        if (featuredResponse.ok) {
          const featuredData = await featuredResponse.json();
          if (featuredData.success && featuredData.data.length > 0) {
            setFeaturedContent(featuredData.data[0]);
          }
        }

        // Fetch trending content
        const trendingResponse = await fetch(
          "http://localhost:8080/api/v1/content/trending?limit=10"
        );
        if (trendingResponse.ok) {
          const trendingData = await trendingResponse.json();
          if (trendingData.success) {
            setTrendingMovies(trendingData.data || []);
          }
        }

        // Fetch new releases
        const newReleasesResponse = await fetch(
          "http://localhost:8080/api/v1/content/new-releases?limit=10"
        );
        if (newReleasesResponse.ok) {
          const newReleasesData = await newReleasesResponse.json();
          if (newReleasesData.success) {
            setNewReleases(newReleasesData.data || []);
          }
        }
      } catch (err) {
        setError("Failed to load content");
        console.error("Error fetching home data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  if (loading) {
    return <LoadingPage />;
  }

  if (error) {
    return <ErrorPage error={error} />;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      {/* Hero Section */}
      {featuredContent && <HeroSection content={featuredContent} />}

      {/* Content Sections */}
      <div className="relative z-10 -mt-32 pb-20">
        <div className="px-4 md:px-12 space-y-12">
          {trendingMovies.length > 0 && (
            <ContentRow title="Trending Now" movies={trendingMovies} />
          )}

          {newReleases.length > 0 && (
            <ContentRow title="New Releases" movies={newReleases} />
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}

// Navigation Component
function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled ? "bg-black/90 backdrop-blur-md" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <a href="/" className="text-red-600 text-2xl font-bold">
              OnFlix
            </a>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <a
                href="/"
                className="text-white hover:text-red-500 px-3 py-2 text-sm font-medium transition-colors"
              >
                Home
              </a>
              <a
                href="/movies"
                className="text-gray-300 hover:text-red-500 px-3 py-2 text-sm font-medium transition-colors"
              >
                Movies
              </a>
              <a
                href="/tv-shows"
                className="text-gray-300 hover:text-red-500 px-3 py-2 text-sm font-medium transition-colors"
              >
                TV Shows
              </a>
              <a
                href="/my-list"
                className="text-gray-300 hover:text-red-500 px-3 py-2 text-sm font-medium transition-colors"
              >
                My List
              </a>
            </div>
          </div>

          {/* User Menu */}
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6 space-x-4">
              <button className="p-2 rounded-full hover:bg-gray-800 transition-colors">
                <SearchIcon />
              </button>
              <button className="p-2 rounded-full hover:bg-gray-800 transition-colors">
                <BellIcon />
              </button>
              <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center cursor-pointer">
                <span className="text-sm font-medium">U</span>
              </div>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700"
            >
              {isMobileMenuOpen ? <XIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-black/95 backdrop-blur-md">
            <a
              href="/"
              className="block text-white hover:bg-gray-700 px-3 py-2 text-base font-medium"
            >
              Home
            </a>
            <a
              href="/movies"
              className="block text-gray-300 hover:bg-gray-700 px-3 py-2 text-base font-medium"
            >
              Movies
            </a>
            <a
              href="/tv-shows"
              className="block text-gray-300 hover:bg-gray-700 px-3 py-2 text-base font-medium"
            >
              TV Shows
            </a>
            <a
              href="/my-list"
              className="block text-gray-300 hover:bg-gray-700 px-3 py-2 text-base font-medium"
            >
              My List
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}

// Hero Section Component
function HeroSection({ content }: { content: Movie }) {
  return (
    <div className="relative h-screen">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={content.backdrop_url}
          alt={content.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            const img = e.target as HTMLImageElement;
            img.src = "/placeholder-backdrop.jpg";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex items-center h-full">
        <div className="px-4 md:px-12 max-w-4xl">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight">
            {content.title}
          </h1>

          <p className="text-lg md:text-xl text-gray-200 mb-8 max-w-2xl line-clamp-3">
            {content.description}
          </p>

          <div className="flex items-center space-x-4 mb-8">
            <div className="flex items-center space-x-2">
              <StarIcon className="text-yellow-400" />
              <span className="font-semibold">{content.rating}</span>
            </div>

            {content.duration && (
              <span className="text-gray-300">
                {Math.floor(content.duration / 60)}h {content.duration % 60}m
              </span>
            )}

            <div className="flex space-x-1">
              {content.genre.slice(0, 3).map((genre, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-gray-700 rounded text-sm"
                >
                  {genre}
                </span>
              ))}
            </div>
          </div>

          <div className="flex space-x-4">
            <button className="flex items-center space-x-2 bg-white text-black px-8 py-3 rounded font-semibold hover:bg-gray-200 transition-colors">
              <PlayIcon />
              <span>Play</span>
            </button>

            <button className="flex items-center space-x-2 bg-gray-600/80 text-white px-8 py-3 rounded font-semibold hover:bg-gray-600 transition-colors">
              <InfoIcon />
              <span>More Info</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Content Row Component
function ContentRow({ title, movies }: { title: string; movies: Movie[] }) {
  const [scrollPosition, setScrollPosition] = useState(0);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      const newPosition =
        direction === "left"
          ? scrollPosition - scrollAmount
          : scrollPosition + scrollAmount;

      scrollRef.current.scrollTo({ left: newPosition, behavior: "smooth" });
      setScrollPosition(newPosition);
    }
  };

  return (
    <div className="group relative">
      <h2 className="text-2xl font-bold mb-4 text-white">{title}</h2>

      <div className="relative">
        {/* Left Arrow */}
        {scrollPosition > 0 && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-black/50 hover:bg-black/80 p-2 rounded-full transition-all opacity-0 group-hover:opacity-100"
          >
            <ChevronLeftIcon />
          </button>
        )}

        {/* Movie Cards Container */}
        <div
          ref={scrollRef}
          className="flex space-x-4 overflow-x-scroll scrollbar-hide pb-4"
          onScroll={(e) => setScrollPosition(e.currentTarget.scrollLeft)}
        >
          {movies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>

        {/* Right Arrow */}
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-black/50 hover:bg-black/80 p-2 rounded-full transition-all opacity-0 group-hover:opacity-100"
        >
          <ChevronRightIcon />
        </button>
      </div>
    </div>
  );
}

// Movie Card Component
function MovieCard({ movie }: { movie: Movie }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="relative min-w-[200px] cursor-pointer transition-transform duration-300 hover:scale-105"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative aspect-[2/3] rounded-lg overflow-hidden">
        <img
          src={movie.poster_url}
          alt={movie.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            const img = e.target as HTMLImageElement;
            img.src = "/placeholder-poster.jpg";
          }}
        />

        {/* Hover Overlay */}
        {isHovered && (
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent flex flex-col justify-end p-4">
            <h3 className="font-semibold text-white text-sm mb-1 line-clamp-2">
              {movie.title}
            </h3>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <StarIcon className="text-yellow-400 w-3 h-3" />
                <span className="text-white text-xs">{movie.rating}</span>
              </div>
              <span className="text-gray-300 text-xs">{movie.type}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Footer Component
function Footer() {
  return (
    <footer className="bg-gray-900 border-t border-gray-800 mt-20">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center">
              <span className="text-red-600 text-2xl font-bold">OnFlix</span>
            </div>
            <p className="mt-4 text-gray-400 text-sm">
              Your ultimate streaming platform for movies and TV shows. Enjoy
              unlimited entertainment with high-quality streaming.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white tracking-wider uppercase">
              Company
            </h3>
            <ul className="mt-4 space-y-2">
              <li>
                <a
                  href="/about"
                  className="text-gray-400 hover:text-white text-sm"
                >
                  About
                </a>
              </li>
              <li>
                <a
                  href="/careers"
                  className="text-gray-400 hover:text-white text-sm"
                >
                  Careers
                </a>
              </li>
              <li>
                <a
                  href="/press"
                  className="text-gray-400 hover:text-white text-sm"
                >
                  Press
                </a>
              </li>
              <li>
                <a
                  href="/contact"
                  className="text-gray-400 hover:text-white text-sm"
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white tracking-wider uppercase">
              Support
            </h3>
            <ul className="mt-4 space-y-2">
              <li>
                <a
                  href="/help"
                  className="text-gray-400 hover:text-white text-sm"
                >
                  Help Center
                </a>
              </li>
              <li>
                <a
                  href="/terms"
                  className="text-gray-400 hover:text-white text-sm"
                >
                  Terms of Service
                </a>
              </li>
              <li>
                <a
                  href="/privacy"
                  className="text-gray-400 hover:text-white text-sm"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="/billing"
                  className="text-gray-400 hover:text-white text-sm"
                >
                  Billing
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-800 pt-8">
          <p className="text-gray-400 text-sm text-center">
            © 2024 OnFlix. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

// Loading Page Component
function LoadingPage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600 mx-auto mb-4"></div>
        <p className="text-white text-lg">Loading OnFlix...</p>
      </div>
    </div>
  );
}

// Error Page Component
function ErrorPage({ error }: { error: string }) {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="text-red-500 text-6xl mb-4">⚠️</div>
        <h1 className="text-white text-2xl font-bold mb-2">
          Something went wrong
        </h1>
        <p className="text-gray-400 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
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

function BellIcon() {
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
        d="M15 17h5l-5-5-5 5h5zM7 12l5 5 5-5H7z"
      />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg
      className="h-6 w-6"
      stroke="currentColor"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 6h16M4 12h16M4 18h16"
      />
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      className="h-6 w-6"
      stroke="currentColor"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function InfoIcon() {
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
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function StarIcon({ className = "h-5 w-5" }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 19l-7-7 7-7"
      />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 5l7 7-7 7"
      />
    </svg>
  );
}
