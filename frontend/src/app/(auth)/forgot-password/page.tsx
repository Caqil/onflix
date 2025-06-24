import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ForgotPasswordForm } from "@/components/auth/auth-forms";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, ArrowLeft, Mail, Shield, Clock, HelpCircle } from "lucide-react";
import { APP_CONFIG } from "@/lib/utils/constants";

export const metadata: Metadata = {
  title: "Forgot Password",
  description:
    "Reset your OnFlix account password to regain access to your account.",
  robots: {
    index: false,
    follow: false,
  },
};

// Help information component
function ForgotPasswordHelp() {
  const helpSteps = [
    {
      icon: Mail,
      title: "Check your email",
      description: "We'll send a password reset link to your email address",
    },
    {
      icon: Shield,
      title: "Secure reset",
      description:
        "The reset link is valid for 1 hour and can only be used once",
    },
    {
      icon: Clock,
      title: "Quick process",
      description: "Follow the link to create a new password and sign in",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold">Password Reset Process</h2>
        <p className="text-sm text-muted-foreground">
          Here's how we'll help you get back into your account
        </p>
      </div>

      <div className="space-y-4">
        {helpSteps.map((step, index) => (
          <div
            key={index}
            className="flex items-start gap-3 p-3 rounded-lg border bg-card/50"
          >
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <step.icon className="w-4 h-4 text-primary" />
            </div>
            <div className="space-y-1">
              <h3 className="font-medium text-sm">{step.title}</h3>
              <p className="text-xs text-muted-foreground">
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Additional help section
function AdditionalHelp() {
  const helpTopics = [
    {
      question: "Can't access your email?",
      answer: "Contact our support team for manual account recovery.",
      action: "Contact Support",
      link: "/contact",
    },
    {
      question: "Didn't receive the email?",
      answer: "Check your spam folder or try requesting another reset email.",
      action: "Try Again",
      link: "#",
    },
    {
      question: "Account security concerns?",
      answer:
        "Learn about our security measures and how to protect your account.",
      action: "Security Help",
      link: "/help/security",
    },
  ];

  return (
    <Card className="bg-muted/30">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <HelpCircle className="w-5 h-5" />
          Need Additional Help?
        </CardTitle>
        <CardDescription>
          Common issues and solutions for password reset
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {helpTopics.map((topic, index) => (
          <div key={index} className="space-y-2">
            <h4 className="text-sm font-medium">{topic.question}</h4>
            <p className="text-xs text-muted-foreground">{topic.answer}</p>
            <Button variant="outline" size="sm" asChild>
              <Link href={topic.link}>{topic.action}</Link>
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: { email?: string; success?: string; error?: string };
}) {
  const prefilledEmail = searchParams.email;
  const isSuccess = searchParams.success === "true";
  const hasError = searchParams.error;

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
                  <Mail className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>

                <div className="space-y-2">
                  <h1 className="text-xl font-semibold">Check Your Email</h1>
                  <p className="text-sm text-muted-foreground">
                    We've sent a password reset link to your email address.
                    Click the link to create a new password.
                  </p>
                </div>

                <div className="space-y-3 pt-4">
                  <Button asChild className="w-full">
                    <Link href="/login">Back to Sign In</Link>
                  </Button>

                  <Button variant="outline" asChild className="w-full">
                    <Link href="/forgot-password">Send Another Email</Link>
                  </Button>
                </div>

                <div className="pt-4 text-xs text-muted-foreground">
                  <p>Didn't receive the email? Check your spam folder.</p>
                  <p>The reset link expires in 1 hour.</p>
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

  // Main forgot password form
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
              <CardTitle>Forgot your password?</CardTitle>
              <CardDescription>
                Enter your email address and we'll send you a link to reset your
                password.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Error Alert */}
              {hasError && (
                <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <div className="text-sm text-destructive">
                    {hasError === "UserNotFound"
                      ? "No account found with this email address."
                      : hasError === "RateLimited"
                      ? "Too many reset attempts. Please wait before trying again."
                      : "An error occurred. Please try again."}
                  </div>
                </div>
              )}

              {/* Forgot Password Form */}
              <Suspense fallback={<div>Loading...</div>}>
                <ForgotPasswordForm initialEmail={prefilledEmail} />
              </Suspense>
            </CardContent>
          </Card>

          {/* Footer Links */}
          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Remember your password?{" "}
              <Link
                href="/login"
                className="font-medium text-primary hover:underline"
              >
                Sign in
              </Link>
            </p>

            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link
                href="/register"
                className="font-medium text-primary hover:underline"
              >
                Sign up for free
              </Link>
            </p>

            <div className="flex justify-center space-x-4 text-xs text-muted-foreground">
              <Link href="/help" className="hover:underline">
                Help Center
              </Link>
              <Link href="/contact" className="hover:underline">
                Contact Support
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Help information */}
      <div className="hidden lg:flex items-center justify-center p-8 bg-muted/30">
        <div className="w-full max-w-md space-y-6">
          <ForgotPasswordHelp />
          <AdditionalHelp />
        </div>
      </div>
    </div>
  );
}
