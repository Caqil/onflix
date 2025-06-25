"use client";
import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, X, ArrowLeft, Mail, RefreshCw, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/use-auth";
import { PageLoading } from "@/components/common/loading";
import { APP_CONFIG } from "@/lib/utils/constants";

// Success State Component
function VerificationSuccess() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 text-center">
        {/* Header */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Mail className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">{APP_CONFIG.NAME}</span>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4 text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto">
                <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>

              <div className="space-y-2">
                <h1 className="text-xl font-semibold">Email Verified!</h1>
                <p className="text-sm text-muted-foreground">
                  Your email has been successfully verified. You can now access all features of your account.
                </p>
              </div>

              <div className="space-y-3 pt-4">
                <Button asChild className="w-full">
                  <Link href="/browse">Start Watching</Link>
                </Button>

                <Button variant="outline" asChild className="w-full">
                  <Link href="/profile">Go to Profile</Link>
                </Button>
              </div>

              <div className="pt-4 text-xs text-muted-foreground">
                <p>You're all set! Welcome to {APP_CONFIG.NAME}.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}

// Error States Components
function InvalidToken() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Mail className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">{APP_CONFIG.NAME}</span>
          </div>
        </div>

        <Card className="border-destructive/20">
          <CardContent className="pt-6">
            <div className="space-y-4 text-center">
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
                <X className="w-8 h-8 text-destructive" />
              </div>

              <div className="space-y-2">
                <h1 className="text-xl font-semibold">Invalid Verification Link</h1>
                <p className="text-sm text-muted-foreground">
                  This verification link is invalid or has already been used. Please request a new one.
                </p>
              </div>

              <div className="space-y-3 pt-4">
                <Button asChild className="w-full">
                  <Link href="/resend-verification">Send New Link</Link>
                </Button>

                <Button variant="outline" asChild className="w-full">
                  <Link href="/login">Back to Sign In</Link>
                </Button>
              </div>

              <div className="pt-4 text-xs text-muted-foreground">
                <p>Need help? Contact our support team.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ExpiredToken() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Mail className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">{APP_CONFIG.NAME}</span>
          </div>
        </div>

        <Card className="border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/20">
          <CardContent className="pt-6">
            <div className="space-y-4 text-center">
              <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8 text-orange-600 dark:text-orange-400" />
              </div>

              <div className="space-y-2">
                <h1 className="text-xl font-semibold">Link Expired</h1>
                <p className="text-sm text-muted-foreground">
                  This verification link has expired. Verification links are valid for 24 hours for security reasons.
                </p>
              </div>

              <div className="space-y-3 pt-4">
                <Button asChild className="w-full">
                  <Link href="/resend-verification">Get New Link</Link>
                </Button>

                <Button variant="outline" asChild className="w-full">
                  <Link href="/login">Back to Sign In</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}

// Main Verification Component
function EmailVerificationContent() {
  const searchParams = useSearchParams();
  const { verifyEmail, user } = useAuth();
  const router = useRouter();

  const [status, setStatus] = useState<'verifying' | 'success' | 'error' | 'expired' | 'invalid'>('verifying');
  const [error, setError] = useState<string | null>(null);

  const token = searchParams.get('token');

  useEffect(() => {
    const verifyEmailToken = async () => {
      if (!token) {
        setStatus('invalid');
        return;
      }

      try {
        const response = await verifyEmail(token);
        
        if (response.success) {
          setStatus('success');
          // Optionally redirect after a delay
          setTimeout(() => {
            router.push('/browse');
          }, 3000);
        } else {
          throw new Error(response.message);
        }
      } catch (error: any) {
        console.error('Email verification failed:', error);
        
        // Check error type to show appropriate message
        if (error.message?.includes('expired')) {
          setStatus('expired');
        } else if (error.message?.includes('invalid') || error.message?.includes('not found')) {
          setStatus('invalid');
        } else {
          setStatus('error');
          setError(error.message || 'Verification failed');
        }
      }
    };

    verifyEmailToken();
  }, [token, verifyEmail, router]);

  // Render based on status
  switch (status) {
    case 'success':
      return <VerificationSuccess />;
    case 'invalid':
      return <InvalidToken />;
    case 'expired':
      return <ExpiredToken />;
    case 'error':
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="w-full max-w-md space-y-6 text-center">
            <Card className="border-destructive/20">
              <CardContent className="pt-6">
                <div className="space-y-4 text-center">
                  <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
                    <X className="w-8 h-8 text-destructive" />
                  </div>
                  <h1 className="text-xl font-semibold">Verification Failed</h1>
                  <p className="text-sm text-muted-foreground">{error}</p>
                  <Button asChild className="w-full">
                    <Link href="/resend-verification">Try Again</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      );
    default:
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="w-full max-w-md space-y-6 text-center">
            <div className="flex items-center justify-center mb-8">
              <div className="flex items-center space-x-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                  <Mail className="h-6 w-6 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold">{APP_CONFIG.NAME}</span>
              </div>
            </div>

            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4 text-center">
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto">
                    <RefreshCw className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
                  </div>
                  <h1 className="text-xl font-semibold">Verifying Email...</h1>
                  <p className="text-sm text-muted-foreground">
                    Please wait while we verify your email address.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      );
  }
}

// Main Page Component
export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<PageLoading message="Loading verification..." />}>
      <EmailVerificationContent />
    </Suspense>
  );
}