import { Loader2, Play } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { APP_CONFIG } from '@/lib/utils/constants'

// Main loading component
export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header Skeleton */}
      <HeaderSkeleton />
      
      {/* Main Content Skeleton */}
      <main className="flex-1">
        <HeroSkeleton />
        <ContentSectionsSkeleton />
      </main>

      {/* Footer Skeleton */}
      <FooterSkeleton />
    </div>
  )
}

// Header loading skeleton
function HeaderSkeleton() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo and nav skeleton */}
        <div className="flex items-center gap-6">
          <div className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
              <span className="text-lg font-bold text-primary-foreground">
                {APP_CONFIG.NAME.charAt(0)}
              </span>
            </div>
            <Skeleton className="h-4 w-16" />
          </div>
          
          {/* Navigation skeleton */}
          <div className="hidden md:flex items-center space-x-6">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-14" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-12" />
          </div>
        </div>

        {/* Right side skeleton */}
        <div className="flex items-center space-x-4">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>
    </header>
  )
}

// Hero section loading skeleton
function HeroSkeleton() {
  return (
    <section className="relative bg-gradient-to-r from-primary/20 via-primary/10 to-transparent">
      <div className="container mx-auto px-4 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <Skeleton className="h-6 w-32 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-4/5" />
                <Skeleton className="h-12 w-3/5" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-4/5" />
                <Skeleton className="h-6 w-3/5" />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Skeleton className="h-11 w-36" />
              <Skeleton className="h-11 w-36" />
            </div>

            <div className="flex items-center gap-6">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-28" />
            </div>
          </div>

          <div className="relative">
            <Skeleton className="aspect-video rounded-2xl" />
          </div>
        </div>
      </div>
    </section>
  )
}

// Content sections loading skeleton
function ContentSectionsSkeleton() {
  return (
    <div className="space-y-16 py-16">
      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-16">
            <Skeleton className="h-6 w-32 mx-auto rounded-full" />
            <Skeleton className="h-10 w-96 mx-auto" />
            <Skeleton className="h-6 w-[600px] mx-auto" />
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="p-6 rounded-2xl border bg-card">
                <Skeleton className="w-12 h-12 rounded-xl mb-4" />
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Content Sections */}
      {Array.from({ length: 3 }).map((_, sectionIndex) => (
        <section key={sectionIndex} className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-9 w-20" />
          </div>
          
          <ContentGridSkeleton />
        </section>
      ))}

      {/* CTA Section */}
      <section className="py-20 bg-primary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="space-y-4">
              <Skeleton className="h-10 w-96 mx-auto" />
              <Skeleton className="h-6 w-[600px] mx-auto" />
              <Skeleton className="h-6 w-[500px] mx-auto" />
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Skeleton className="h-11 w-36" />
              <Skeleton className="h-11 w-36" />
            </div>

            <div className="pt-8 border-t">
              <Skeleton className="h-4 w-80 mx-auto" />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

// Content grid loading skeleton
function ContentGridSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="w-full h-72 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-3/4" />
            <div className="flex gap-1">
              <Skeleton className="h-5 w-12 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// Footer loading skeleton
function FooterSkeleton() {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-5 w-24" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-18" />
                <Skeleton className="h-4 w-14" />
              </div>
            </div>
          ))}
        </div>
        
        <div className="border-t mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <Skeleton className="h-4 w-64" />
          <div className="flex gap-4 mt-4 md:mt-0">
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-8 w-8 rounded" />
          </div>
        </div>
      </div>
    </footer>
  )
}

// Centered loading spinner for inline loading states
export function LoadingSpinner({ size = 'default' }: { size?: 'sm' | 'default' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    default: 'w-6 h-6', 
    lg: 'w-8 h-8'
  }

  return (
    <div className="flex items-center justify-center p-4">
      <Loader2 className={`animate-spin ${sizeClasses[size]}`} />
    </div>
  )
}

// Fullscreen loading for page transitions
export function FullscreenLoading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
              <Play className="w-6 h-6 text-primary" />
            </div>
            <Loader2 className="w-20 h-20 absolute -top-2 -left-2 animate-spin text-primary/40" />
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="font-medium">{APP_CONFIG.NAME}</h3>
          <p className="text-sm text-muted-foreground">Loading your content...</p>
        </div>
      </div>
    </div>
  )
}

// Content loading placeholder
export function ContentLoading({ message = 'Loading content...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="text-center space-y-4 max-w-md">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Please wait</h3>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
      </div>
    </div>
  )
}