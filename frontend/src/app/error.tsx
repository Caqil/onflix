'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home, Bug, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { APP_CONFIG } from '@/lib/utils/constants'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error to monitoring service
    console.error('Application error:', error)
    
    // You can integrate with error tracking services here
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
      // Example: Sentry, LogRocket, etc.
      // Sentry.captureException(error)
    }
  }, [error])

  // Determine error type for better UX
  const getErrorInfo = () => {
    const message = error.message.toLowerCase()
    
    if (message.includes('network') || message.includes('fetch')) {
      return {
        type: 'network',
        title: 'Connection Problem',
        description: 'Unable to connect to our servers. Please check your internet connection.',
        variant: 'destructive' as const,
        recovery: 'Try refreshing the page or check your network connection.'
      }
    }
    
    if (message.includes('chunk') || message.includes('loading')) {
      return {
        type: 'chunk',
        title: 'Loading Error',
        description: 'There was a problem loading the page resources.',
        variant: 'destructive' as const,
        recovery: 'Please refresh the page to reload the latest version.'
      }
    }
    
    if (message.includes('auth') || message.includes('unauthorized')) {
      return {
        type: 'auth',
        title: 'Authentication Error',
        description: 'Your session has expired or you need to sign in.',
        variant: 'destructive' as const,
        recovery: 'Please sign in again to continue.'
      }
    }
    
    if (message.includes('subscription') || message.includes('premium')) {
      return {
        type: 'subscription',
        title: 'Subscription Required',
        description: 'This content requires an active subscription.',
        variant: 'default' as const,
        recovery: 'Upgrade your plan to access premium content.'
      }
    }
    
    // Generic error
    return {
      type: 'generic',
      title: 'Something went wrong',
      description: 'An unexpected error occurred while processing your request.',
      variant: 'destructive' as const,
      recovery: 'Try refreshing the page or contact support if the problem persists.'
    }
  }

  const errorInfo = getErrorInfo()

  const handleGoHome = () => {
    window.location.href = '/'
  }

  const handleGoBack = () => {
    if (window.history.length > 1) {
      window.history.back()
    } else {
      handleGoHome()
    }
  }

  const handleReportError = () => {
    const subject = encodeURIComponent(`Error Report: ${errorInfo.title}`)
    const body = encodeURIComponent(`
Error Details:
- Type: ${errorInfo.type}
- Message: ${error.message}
- Digest: ${error.digest || 'N/A'}
- URL: ${window.location.href}
- User Agent: ${navigator.userAgent}
- Timestamp: ${new Date().toISOString()}

Please describe what you were doing when this error occurred:
[Your description here]
    `)
    
    window.open(`mailto:support@${APP_CONFIG.APP_URL}?subject=${subject}&body=${body}`)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md space-y-6">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
            <CardTitle className="text-xl">{errorInfo.title}</CardTitle>
            <CardDescription className="text-center">
              {errorInfo.description}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Error details for development */}
            {process.env.NODE_ENV === 'development' && (
              <div className="space-y-2">
                <Badge variant="outline" className="w-fit">
                  <Bug className="w-3 h-3 mr-1" />
                  Development Mode
                </Badge>
                <details className="text-xs">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                    Error Details
                  </summary>
                  <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                    {error.message}
                    {error.digest && `\nDigest: ${error.digest}`}
                    {error.stack && `\n\nStack:\n${error.stack}`}
                  </pre>
                </details>
              </div>
            )}

            {/* Recovery suggestion */}
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium mb-1">What can you do?</p>
              <p className="text-sm text-muted-foreground">{errorInfo.recovery}</p>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-3">
              <Button onClick={reset} className="w-full">
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" onClick={handleGoBack}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Go Back
                </Button>
                <Button variant="outline" onClick={handleGoHome}>
                  <Home className="w-4 h-4 mr-2" />
                  Home
                </Button>
              </div>

              {/* Report error button for production */}
              {process.env.NODE_ENV === 'production' && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleReportError}
                  className="text-xs"
                >
                  Report this error
                </Button>
              )}
            </div>

            {/* Additional help links */}
            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground text-center mb-3">
                Need help?
              </p>
              <div className="flex justify-center gap-4 text-xs">
                <a 
                  href="/help" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Help Center
                </a>
                <a 
                  href="/contact" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Contact Support
                </a>
                <a 
                  href="/status" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Service Status
                </a>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional context for specific error types */}
        {errorInfo.type === 'network' && (
          <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <p className="text-sm font-medium">Connection Tips</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Check your internet connection</li>
                  <li>• Try disabling VPN if enabled</li>
                  <li>• Clear your browser cache</li>
                  <li>• Contact your ISP if problems persist</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}

        {errorInfo.type === 'auth' && (
          <Card className="bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900">
            <CardContent className="pt-6 text-center">
              <Button variant="outline" asChild className="w-full">
                <a href="/login">Sign In Again</a>
              </Button>
            </CardContent>
          </Card>
        )}

        {errorInfo.type === 'subscription' && (
          <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
            <CardContent className="pt-6 text-center space-y-3">
              <p className="text-sm font-medium">Upgrade to Premium</p>
              <Button asChild className="w-full">
                <a href="/pricing">View Plans</a>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

// Global error boundary for unhandled errors
export function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Global error:', error)
  }, [error])

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="text-center space-y-6 max-w-md">
            <div className="w-20 h-20 mx-auto bg-destructive/10 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-10 h-10 text-destructive" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">Something went seriously wrong</h1>
              <p className="text-muted-foreground">
                We encountered a critical error. Our team has been notified.
              </p>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <details className="text-left">
                <summary className="cursor-pointer">Error Details</summary>
                <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                  {error.message}
                  {error.stack}
                </pre>
              </details>
            )}

            <div className="flex flex-col gap-3">
              <button
                onClick={reset}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Try Again
              </button>
              <a
                href="/"
                className="px-4 py-2 border border-input rounded-md hover:bg-accent transition-colors"
              >
                Go Home
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}