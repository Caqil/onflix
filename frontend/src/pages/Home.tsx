import React from "react";
import {
  useFeaturedContent,
  useTrendingContent,
  useContinueWatching,
} from "../hooks/useContent";
import Hero from "../components/content/Hero";
import MovieRow from "../components/content/MovieRow";
import Loading from "../components/common/Loading";

const Home: React.FC = () => {
  const { content: featuredContent, loading: featuredLoading } =
    useFeaturedContent();
  const { content: trendingContent, loading: trendingLoading } =
    useTrendingContent();
  const { content: continueWatching, loading: continueLoading } =
    useContinueWatching();

  if (featuredLoading && trendingLoading && continueLoading) {
    return <Loading fullScreen text="Loading your content..." />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      {featuredContent.length > 0 && <Hero content={featuredContent[0]} />}

      {/* Content Rows */}
      <div className="relative -mt-32 z-10">
        <div className="space-y-8 px-4 md:px-6 lg:px-8">
          {/* Continue Watching */}
          {continueWatching.length > 0 && (
            <MovieRow
              title="Continue Watching"
              content={continueWatching}
              loading={continueLoading}
            />
          )}

          {/* Trending Now */}
          <MovieRow
            title="Trending Now"
            content={trendingContent}
            loading={trendingLoading}
          />

          {/* Featured Content */}
          <MovieRow
            title="Featured"
            content={featuredContent}
            loading={featuredLoading}
          />

          {/* Action Movies */}
          <MovieRow
            title="Action Movies"
            content={[]} // Will be fetched by MovieRow component
            genre="action"
            type="movie"
          />

          {/* Comedy TV Shows */}
          <MovieRow
            title="Comedy Series"
            content={[]}
            genre="comedy"
            type="tv_show"
          />

          {/* Documentaries */}
          <MovieRow title="Documentaries" content={[]} type="documentary" />

          {/* Recently Added */}
          <MovieRow
            title="Recently Added"
            content={[]}
            sortBy="createdAt"
            sortOrder="desc"
          />

          {/* Top Rated */}
          <MovieRow
            title="Top Rated"
            content={[]}
            sortBy="rating"
            sortOrder="desc"
          />
        </div>
      </div>
    </div>
  );
};

export default Home;
