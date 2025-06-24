"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useContentStore } from "@/hooks/useContent";
import { Header } from "@/components/layout/Header";
import { LoadingSpinner } from "@/components/layout/LoadingSpinner";
import { ContentRow } from "@/components/home/ContentRow";
import { HeroSection } from "@/components/content/HeroSection";
import { FeatureSection } from "@/components/home/FeatureSection";
import { LandingHero } from "@/components/home/LandingHero";
import { PricingSection } from "@/components/home/PricingSection";
import { Footer } from "react-day-picker";

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const {
    featuredContent,
    trendingContent,
    newReleases,
    originals,
    isLoading,
  } = useContentStore();

  useEffect(() => {
    if (isAuthenticated) {
    }
  }, [isAuthenticated]);

  // Authenticated user dashboard
  if (isAuthenticated) {
    if (isLoading && featuredContent.length === 0) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center">
          <LoadingSpinner size="md" className="text-white" />
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-black">
        <Header />

        {/* Hero Section with Featured Content */}
        {featuredContent.length > 0 && (
          <HeroSection content={featuredContent[0]} />
        )}

        {/* Content Rows */}
        <div className="relative z-10 -mt-32 space-y-12 pb-16">
          {trendingContent.length > 0 && (
            <ContentRow
              title="Trending Now"
              content={trendingContent}
              priority
              variant="large"
            />
          )}

          {newReleases.length > 0 && (
            <ContentRow
              title="New Releases"
              content={newReleases}
              variant="medium"
            />
          )}

          {originals.length > 0 && (
            <ContentRow
              title="Onflix Originals"
              content={originals}
              variant="medium"
              showBadge
            />
          )}

          {featuredContent.length > 1 && (
            <ContentRow
              title="Featured Content"
              content={featuredContent.slice(1)}
              variant="small"
            />
          )}

          {/* Continue Watching - You can add this when you have watch history */}
          {/* <ContentRow
            title="Continue Watching"
            content={continueWatching}
            variant="small"
            showProgress
          /> */}
        </div>
      </div>
    );
  }

  // Landing page for non-authenticated users
  return <LandingPage />;
}

function LandingPage() {
  return (
    <div className="min-h-screen bg-black">
      <LandingHero />
      <FeatureSection />
      <PricingSection />
      <Footer />
    </div>
  );
}
