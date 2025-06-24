import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/auth/auth-forms";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Play,
  ArrowLeft,
  Shield,
  Check,
  AlertTriangle,
  Lock,
  Eye,
  Clock,
} from "lucide-react";
import { APP_CONFIG } from "@/lib/utils/constants";

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Create a new password for your OnFlix account.",
  robots: {
    index: false,
    follow: false,
  },
};

// Password requirements component
function PasswordRequirements() {
  const requirements = [
    "At least 8 characters long",
    "Contains uppercase and lowercase letters",
    "Contains at least one number",
    "Contains at least one special character (@$!%*?&)",
  ];

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium flex items-center gap-2">
        <Shield className="w-4 h-4" />
        Password Requirements
      </h3>
      <ul className="space-y-2">
        {requirements.map((requirement, index) => (
          <li
            key={index}
            className="flex items-center gap-2 text-xs text-muted-foreground"
          >
            <div className="w-3 h-3 rounded-full border border-muted-foreground/50 flex items-center justify-center">
              <div className="w-1 h-1 rounded-full bg-muted-foreground/50" />
            </div>
            <span>{requirement}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Security tips component
function SecurityTips() {
  const tips = [
    {
      icon: Lock,
      title: "Keep it secure",
      description: "Don't share your password with anyone",
    },
    {
      icon: Eye,
      title: "Make it unique",
      description: "Use a password you don't use elsewhere",
    },
    {
      icon: Shield,
      title: "Consider 2FA",
      description: "Enable two-factor authentication for extra security",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold">Secure Your Account</h2>
        <p className="text-sm text-muted-foreground">
          Follow these tips to keep your account safe
        </p>
      </div>

      <div className="space-y-4">
        {tips.map((tip, index) => (
          <div
            key={index}
            className="flex items-start gap-3 p-3 rounded-lg border bg-card/50"
          >
            <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center flex-shrink-0">
              <tip.icon className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <div className="space-y-1">
              <h3 className="font-medium text-sm">{tip.title}</h3>
              <p className="text-xs text-muted-foreground">{tip.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Token validation states
function InvalidToken() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 text-center">
        {/* Header */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Play className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">{APP_CONFIG.NAME}</span>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4 text-center">
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>

              <div className="space-y-2">
                <h1 className="text-xl font-semibold">Invalid Reset Link</h1>
                <p className="text-sm text-muted-foreground">
                  This password reset link is invalid or has expired. Please
                  request a new one.
                </p>
              </div>

              <div className="space-y-3 pt-4">
                <Button asChild className="w-full">
                  <Link href="/forgot-password">Request New Reset Link</Link>
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

function ExpiredToken() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 text-center">
        {/* Header */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Play className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">{APP_CONFIG.NAME}</span>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4 text-center">
              <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center mx-auto">
                <Clock className="w-8 h-8 text-orange-600 dark:text-orange-400" />
              </div>

              <div className="space-y-2">
                <h1 className="text-xl font-semibold">Link Expired</h1>
                <p className="text-sm text-muted-foreground">
                  This password reset link has expired. Reset links are valid
                  for 1 hour for security reasons.
                </p>
              </div>

              <div className="space-y-3 pt-4">
                <Button asChild className="w-full">
                  <Link href="/forgot-password">Get New Reset Link</Link>
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

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: { token?: string; error?: string; success?: string };
}) {
  const token = searchParams.token;
  const hasError = searchParams.error;
  const isSuccess = searchParams.success === "true";

  // Handle different error states
  if (hasError === "invalid-token") {
    return <InvalidToken />;
  }

  if (hasError === "expired-token") {
    return <ExpiredToken />;
  }

  // Success state
  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6 text-center">
          {/* Header */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <Play className="h-6 w-6 text-primary-foreground" />
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
                  <h1 className="text-xl font-semibold">
                    Password Reset Successful
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Your password has been successfully updated. You can now
                    sign in with your new password.
                  </p>
                </div>

                <div className="space-y-3 pt-4">
                  <Button asChild className="w-full">
                    <Link href="/login">Sign In Now</Link>
                  </Button>
                </div>

                <div className="pt-4 text-xs text-muted-foreground">
                  <p>
                    For your security, you'll need to sign in on all your
                    devices again.
                  </p>
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

  // No token provided
  if (!token) {
    return <InvalidToken />;
  }

  // Main reset password form
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left side - Form */}
      <div className="flex items-center justify-center p-4 lg:p-8">
        <div className="w-full max-w-md space-y-6">
          {/* Header */}
          <div className="space-y-2 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to sign in
            </Link>
            <div className="flex items-center justify-center mb-6">
              <div className="flex items-center space-x-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                  <Play className="h-6 w-6 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold">{APP_CONFIG.NAME}</span>
              </div>
            </div>
          </div>

          <Card>
            <CardHeader className="text-center">
              <CardTitle>Create New Password</CardTitle>
              <CardDescription>
                Enter a strong password to secure your account.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* General Error Alert */}
              {hasError &&
                hasError !== "invalid-token" &&
                hasError !== "expired-token" && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      {hasError === "weak-password"
                        ? "Password does not meet security requirements."
                        : hasError === "password-mismatch"
                        ? "Passwords do not match."
                        : "An error occurred. Please try again."}
                    </AlertDescription>
                  </Alert>
                )}

              {/* Reset Password Form */}
              <Suspense fallback={<div>Loading...</div>}>
                <ResetPasswordForm token={token} />
              </Suspense>

              {/* Password Requirements */}
              <PasswordRequirements />
            </CardContent>
          </Card>

          {/* Footer Links */}
          <div className="text-center space-y-4">
            <div className="flex justify-center space-x-4 text-xs text-muted-foreground">
              <Link href="/help/security" className="hover:underline">
                Security Help
              </Link>
              <Link href="/contact" className="hover:underline">
                Contact Support
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Security tips */}
      <div className="hidden lg:flex items-center justify-center p-8 bg-muted/30">
        <div className="w-full max-w-md">
          <SecurityTips />
        </div>
      </div>
    </div>
  );
}
