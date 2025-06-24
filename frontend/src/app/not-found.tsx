import type { Metadata } from 'next'
import Link from 'next/link'
import { 
  Search, 
  Home, 
  ArrowLeft, 
  Film, 
  Tv, 
  Play,
  TrendingUp,
  Star
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Header } from '@/components/layout/header'
//import { Footer } from '@/components/layout/footer'
import { APP_CONFIG } from '@/lib/utils/constants'

export const metadata: Metadata = {
  title: '404 - Page Not Found',
  description: 'The page you are looking for could not be found.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function NotFound() {
  // Popular content suggestions (these would typically come from an API)
  const suggestions = [
    {
      id: '1',
      title: 'Popular Movies',
      description: 'Discover trending movies',
      icon: Film,
      href: '/browse?type=movie&sort=popularity'
    },
    {
      id: '2', 
      title: 'TV Shows',
      description: 'Binge-worthy series',
      icon: Tv,
      href: '/browse?type=tv_show'
    },
    {
      id: '3',
      title: 'New Releases',
      description: 'Latest additions',
      icon: Star,
      href: '/browse?sort=release_date'
    },
    {
      id: '4',
      title: 'Trending Now',
      description: 'What everyone\'s watching',
      icon: TrendingUp,
      href: '/browse?trending=true'
    }
  ]

  const helpfulLinks = [
    { label: 'Browse All Content', href: '/browse' },
    { label: 'My Watchlist', href: '/my-list' },
    { label: 'Search', href: '/search' },
    { label: 'Help Center', href: '/help' },
    { label: 'Contact Support', href: '/contact' }
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-4xl w-full text-center space-y-12">
          {/* Hero Section */}
          <div className="space-y-6">
            {/* 404 Visual */}
            <div className="relative mx-auto w-64 h-32">
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-8xl font-bold text-primary/20 select-none">
                  404
                </span>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <Play className="w-8 h-8 text-primary" />
                </div>
              </div>
            </div>

            {/* Error Message */}
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold">
                Oops! Page Not Found
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                The page you're looking for doesn't exist. It might have been moved, 
                deleted, or you entered the wrong URL.
              </p>
            </div>

            {/* Search Bar */}
            <div className="max-w-md mx-auto">
              <form action="/search" method="get" className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  name="q"
                  placeholder="Search for movies, TV shows..."
                  className="pl-9 h-12"
                />
                <Button 
                  type="submit" 
                  className="absolute right-1 top-1 h-10"
                  size="sm"
                >
                  Search
                </Button>
              </form>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/">
                  <Home className="w-5 h-5 mr-2" />
                  Go Home
                </Link>
              </Button>
              <Button size="lg" variant="outline" onClick={() => window.history.back()}>
                <ArrowLeft className="w-5 h-5 mr-2" />
                Go Back
              </Button>
            </div>
          </div>

          {/* Content Suggestions */}
          <div className="space-y-8">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold">Explore Our Content</h2>
              <p className="text-muted-foreground">
                While you're here, check out these popular sections
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {suggestions.map((suggestion) => (
                <Card 
                  key={suggestion.id}
                  className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20"
                >
                  <CardContent className="p-6 text-center space-y-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto group-hover:bg-primary/20 transition-colors">
                      <suggestion.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-semibold">{suggestion.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {suggestion.description}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" asChild className="w-full">
                      <Link href={suggestion.href}>
                        Explore
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium">Quick Links</h3>
            <div className="flex flex-wrap justify-center gap-4">
              {helpfulLinks.map((link, index) => (
                <Button key={index} variant="ghost" size="sm" asChild>
                  <Link href={link.href} className="text-muted-foreground hover:text-foreground">
                    {link.label}
                  </Link>
                </Button>
              ))}
            </div>
          </div>

          {/* Help Section */}
          <div className="bg-muted/30 rounded-2xl p-8 space-y-4">
            <h3 className="text-xl font-semibold">Still need help?</h3>
            <p className="text-muted-foreground">
              If you believe this page should exist or you're experiencing technical issues, 
              please don't hesitate to contact our support team.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="outline" asChild>
                <Link href="/help">
                  Visit Help Center
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/contact">
                  Contact Support
                </Link>
              </Button>
            </div>
          </div>

          {/* Additional Info */}
          <div className="text-sm text-muted-foreground space-y-2">
            <p>Error Code: 404 - Page Not Found</p>
            <p>
              If you typed the URL manually, please check the spelling. 
              If you clicked a link, please report it to us.
            </p>
          </div>
        </div>
      </main>

      {/* <Footer /> */}
    </div>
  )
}

// Alternative minimal 404 for API routes or when layout is not needed
export function SimpleNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="space-y-4">
          <h1 className="text-6xl font-bold text-primary/20">404</h1>
          <h2 className="text-2xl font-semibold">Page Not Found</h2>
          <p className="text-muted-foreground">
            The page you are looking for doesn't exist.
          </p>
        </div>
        
        <div className="flex flex-col gap-3">
          <Button asChild>
            <Link href="/">
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Link>
          </Button>
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    </div>
  )
}