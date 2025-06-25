"use client";
import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/layout/header";
import { ContentGrid, ContentLoadingSkeleton } from "@/components";
import {
  Play,
  Star,
  TrendingUp,
  Sparkles,
  Clock,
  Users,
  Shield,
  Zap,
  Crown,
  ArrowRight,
} from "lucide-react";
import { APP_CONFIG } from "@/lib/utils/constants";
import { cn } from "@/lib/utils/helpers";

// export const metadata: Metadata = {
//   title: "Home",
//   description:
//     "Discover premium movies and TV shows. Stream unlimited entertainment with crystal clear quality.",
//   openGraph: {
//     title: `${APP_CONFIG.NAME} - Premium Streaming Platform`,
//     description:
//       "Discover premium movies and TV shows. Stream unlimited entertainment with crystal clear quality.",
//     images: ["/og-home.png"],
//   },
// };

// Featured content section
function FeaturedSection() {
  return (
    <section className="relative bg-gradient-to-r from-primary/20 via-primary/10 to-transparent">
      <div className="container mx-auto px-4 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <Badge variant="secondary" className="w-fit">
                <Sparkles className="w-3 h-3 mr-1" />
                Featured Content
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                Stream Premium{" "}
                <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  Entertainment
                </span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-lg">
                Discover thousands of movies and TV shows in stunning 4K
                quality. Start your premium streaming experience today.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" asChild>
                <Link href="/browse">
                  <Play className="w-5 h-5 mr-2" />
                  Start Watching
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/register">
                  Get Started Free
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>

            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span>4.8/5 Rating</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>1M+ Users</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>Secure & Private</span>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="aspect-video rounded-2xl overflow-hidden shadow-2xl border">
              <div className="bg-gradient-to-br from-primary/20 to-purple-600/20 h-full flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto">
                    <Play className="w-8 h-8 ml-1" />
                  </div>
                  <p className="text-lg font-medium">
                    Experience Premium Quality
                  </p>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-6 -left-6 bg-background rounded-xl p-4 shadow-lg border">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">Instant Streaming</p>
                  <p className="text-xs text-muted-foreground">
                    Zero buffering
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Features section
function FeaturesSection() {
  const features = [
    {
      icon: Crown,
      title: "4K Ultra HD",
      description: "Crystal clear streaming in the highest quality available",
    },
    {
      icon: Zap,
      title: "Instant Access",
      description: "Start watching immediately with zero buffering",
    },
    {
      icon: Shield,
      title: "Secure Platform",
      description: "Your data is protected with enterprise-grade security",
    },
    {
      icon: Users,
      title: "Multiple Profiles",
      description: "Create profiles for every family member",
    },
    {
      icon: Clock,
      title: "Offline Downloads",
      description: "Download content to watch anywhere, anytime",
    },
    {
      icon: Star,
      title: "Premium Content",
      description: "Exclusive movies and shows you won't find elsewhere",
    },
  ];

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center space-y-4 mb-16">
          <Badge variant="outline" className="w-fit mx-auto">
            <TrendingUp className="w-3 h-3 mr-1" />
            Why Choose Us
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold">
            Everything You Need for Perfect Streaming
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Experience entertainment like never before with our premium features
            designed for the ultimate viewing experience.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group p-6 rounded-2xl border bg-card hover:shadow-lg transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Content sections component
function ContentSections() {
  return (
    <div className="space-y-16 py-16">
      {/* Featured Content */}
      <section className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold mb-2">
              Featured Content
            </h2>
            <p className="text-muted-foreground">
              Handpicked selections just for you
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/browse?featured=true">
              View All
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>

        <Suspense fallback={<ContentLoadingSkeleton count={5} />}>
          <FeaturedContentGrid />
        </Suspense>
      </section>

      {/* Trending Now */}
      <section className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold mb-2">
              Trending Now
            </h2>
            <p className="text-muted-foreground">What everyone's watching</p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/browse?trending=true">
              View All
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>

        <Suspense fallback={<ContentLoadingSkeleton count={5} />}>
          <TrendingContentGrid />
        </Suspense>
      </section>

      {/* New Releases */}
      <section className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold mb-2">
              New Releases
            </h2>
            <p className="text-muted-foreground">Fresh content added weekly</p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/browse?sort=release_date">
              View All
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>

        <Suspense fallback={<ContentLoadingSkeleton count={5} />}>
          <NewReleasesGrid />
        </Suspense>
      </section>
    </div>
  );
}

// Async components for content sections
async function FeaturedContentGrid() {
  try {
    // This would typically fetch from your API
    // For now, we'll show a placeholder
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">
          Featured content will be loaded here
        </p>
        <Button variant="outline" asChild>
          <Link href="/browse">Browse All Content</Link>
        </Button>
      </div>
    );
  } catch (error) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">
          Unable to load featured content
        </p>
        <Button variant="outline" asChild>
          <Link href="/browse">Browse All Content</Link>
        </Button>
      </div>
    );
  }
}

async function TrendingContentGrid() {
  try {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">
          Trending content will be loaded here
        </p>
        <Button variant="outline" asChild>
          <Link href="/browse">Browse All Content</Link>
        </Button>
      </div>
    );
  } catch (error) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">
          Unable to load trending content
        </p>
        <Button variant="outline" asChild>
          <Link href="/browse">Browse All Content</Link>
        </Button>
      </div>
    );
  }
}

async function NewReleasesGrid() {
  try {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">
          New releases will be loaded here
        </p>
        <Button variant="outline" asChild>
          <Link href="/browse">Browse All Content</Link>
        </Button>
      </div>
    );
  } catch (error) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">
          Unable to load new releases
        </p>
        <Button variant="outline" asChild>
          <Link href="/browse">Browse All Content</Link>
        </Button>
      </div>
    );
  }
}

// CTA Section
function CTASection() {
  return (
    <section className="py-20 bg-primary/5">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold">
              Ready to Start Your Streaming Journey?
            </h2>
            <p className="text-lg text-muted-foreground">
              Join millions of users who trust {APP_CONFIG.NAME} for their
              entertainment needs. Start your free trial today and experience
              premium streaming.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-lg px-8" asChild>
              <Link href="/register">Start Free Trial</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8"
              asChild
            >
              <Link href="/browse">Explore Content</Link>
            </Button>
          </div>

          <div className="pt-8 border-t">
            <p className="text-sm text-muted-foreground">
              No credit card required • Cancel anytime • 7-day free trial
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <FeaturedSection />
        <FeaturesSection />
        <ContentSections />
        <CTASection />
      </main>

      {/* <Footer /> */}
    </div>
  );
}
