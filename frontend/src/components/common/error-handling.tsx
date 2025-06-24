"use client";
import React from "react";
import { AlertTriangle, RefreshCw, Home, ChevronLeft } from "lucide-react";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Alert, AlertDescription } from "../ui/alert";
import { useRouter } from "next/navigation";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      const { fallback: Fallback } = this.props;

      if (Fallback) {
        return (
          <Fallback
            error={this.state.error!}
            reset={() => this.setState({ hasError: false, error: null })}
          />
        );
      }

      return (
        <DefaultErrorFallback
          error={this.state.error!}
          reset={() => window.location.reload()}
        />
      );
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error: Error;
  reset: () => void;
}

export const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  reset,
}) => {
  const router = useRouter();

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-destructive" />
          </div>
          <CardTitle>Something went wrong</CardTitle>
          <CardDescription>
            An unexpected error occurred. Please try refreshing the page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {process.env.NODE_ENV === "development" && (
            <Alert>
              <AlertDescription className="text-xs font-mono">
                {error.message}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col gap-2">
            <Button onClick={reset} className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/")}
              className="w-full"
            >
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

interface ApiErrorDisplayProps {
  error: string | null;
  onRetry?: () => void;
  className?: string;
}

export const ApiErrorDisplay: React.FC<ApiErrorDisplayProps> = ({
  error,
  onRetry,
  className,
}) => {
  if (!error) return null;

  return (
    <Alert className={className}>
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span>{error}</span>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RefreshCw className="w-3 h-3 mr-1" />
            Retry
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
};

interface NotFoundProps {
  title?: string;
  description?: string;
  showBackButton?: boolean;
  backText?: string;
  backAction?: () => void;
}

export const NotFound: React.FC<NotFoundProps> = ({
  title = "Page Not Found",
  description = "The page you are looking for does not exist.",
  showBackButton = true,
  backText = "Go Back",
  backAction,
}) => {
  const router = useRouter();

  const handleBack = () => {
    if (backAction) {
      backAction();
    } else {
      router.back();
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center space-y-4">
        <div className="text-6xl font-bold text-muted-foreground">404</div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-muted-foreground max-w-md">{description}</p>

        <div className="flex justify-center gap-2">
          {showBackButton && (
            <Button variant="outline" onClick={handleBack}>
              <ChevronLeft className="w-4 h-4 mr-2" />
              {backText}
            </Button>
          )}
          <Button asChild>
            <a href="/">
              <Home className="w-4 h-4 mr-2" />
              Home
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
};
