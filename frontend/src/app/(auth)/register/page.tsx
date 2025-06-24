import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { RegisterForm } from "@/components/auth/auth-forms";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  Shield,
  Star,
  Users,
  ArrowLeft,
  Check,
  Crown,
  Download,
  Smartphone,
  Tv,
  Chrome,
  Apple,
  Github,
} from "lucide-react";
import {
  APP_CONFIG,
  FEATURE_FLAGS,
  SUBSCRIPTION_PLANS,
} from "@/lib/utils/constants";

export const metadata: Metadata = {
  title: "Sign Up",
  description:
    "Create your OnFlix account and start streaming premium content today.",
  robots: {
    index: false,
    follow: false,
  },
};

// Social registration component
function SocialRegistration() {
  if (!FEATURE_FLAGS.ENABLE_SOCIAL_LOGIN) return null;

  const socialProviders = [
    {
      name: "Google",
      icon: Chrome,
      provider: "google",
      disabled: false,
    },
    {
      name: "Apple",
      icon: Apple,
      provider: "apple",
      disabled: false,
    },
  ];

  const handleSocialRegistration = (provider: string) => {
    // This would integrate with your social auth system
    console.log(`Register with ${provider}`);
    // Example: window.location.href = `/api/auth/${provider}?mode=signup`
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3">
        {socialProviders.map((provider) => (
          <Button
            key={provider.provider}
            variant="outline"
            onClick={() => handleSocialRegistration(provider.provider)}
            disabled={provider.disabled}
            className="w-full"
          >
            <provider.icon className="w-4 h-4 mr-2" />
            Continue with {provider.name}
          </Button>
        ))}
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Separator className="w-full" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or create account
          </span>
        </div>
      </div>
    </div>
  );
}

// Benefits showcase component
function RegistrationBenefits() {
  const benefits = [
    {
      icon: Crown,
      title: "7-Day Free Trial",
      description: "Start with premium features at no cost",
      highlight: true,
    },
    {
      icon: Play,
      title: "Unlimited Streaming",
      description: "Access to our entire content library",
    },
    {
      icon: Download,
      title: "Offline Downloads",
      description: "Watch anywhere, even without internet",
    },
    {
      icon: Smartphone,
      title: "Multi-Device Access",
      description: "Stream on phone, tablet, TV, and computer",
    },
    {
      icon: Shield,
      title: "No Ads",
      description: "Enjoy uninterrupted viewing experience",
    },
    {
      icon: Users,
      title: "Family Profiles",
      description: "Up to 4 profiles with personalized recommendations",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Join {APP_CONFIG.NAME} Today</h2>
        <p className="text-muted-foreground">
          Start your free trial and discover unlimited entertainment
        </p>
      </div>

      <div className="space-y-3">
        {benefits.map((benefit, index) => (
          <div
            key={index}
            className={`flex items-start gap-3 p-3 rounded-lg border ${
              benefit.highlight
                ? "bg-primary/5 border-primary/20"
                : "bg-card/50"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                benefit.highlight
                  ? "bg-primary/20 text-primary"
                  : "bg-primary/10 text-primary"
              }`}
            >
              <benefit.icon className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-sm">{benefit.title}</h3>
                {benefit.highlight && (
                  <Badge variant="secondary" className="text-xs">
                    Popular
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {benefit.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Pricing Preview */}
      <Card className="border-2 border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="text-center space-y-3">
            <Badge className="bg-primary text-primary-foreground">
              <Crown className="w-3 h-3 mr-1" />
              Premium Plan
            </Badge>
            <div>
              <div className="text-2xl font-bold">
                ${SUBSCRIPTION_PLANS.PREMIUM.price}
                <span className="text-sm font-normal text-muted-foreground">
                  /month
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Cancel anytime • No commitments
              </p>
            </div>
            <div className="space-y-2 text-left">
              {SUBSCRIPTION_PLANS.PREMIUM.features
                .slice(0, 3)
                .map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs">
                    <Check className="w-3 h-3 text-primary" />
                    <span>{feature}</span>
                  </div>
                ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Trust indicators
function TrustIndicators() {
  const indicators = [
    {
      icon: Shield,
      text: "SSL Encrypted",
    },
    {
      icon: Users,
      text: "1M+ Users",
    },
    {
      icon: Star,
      text: "4.8/5 Rating",
    },
  ];

  return (
    <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
      {indicators.map((indicator, index) => (
        <div key={index} className="flex items-center gap-1">
          <indicator.icon className="w-3 h-3" />
          <span>{indicator.text}</span>
        </div>
      ))}
    </div>
  );
}

export default function RegisterPage({
  searchParams,
}: {
  searchParams: { plan?: string; redirect?: string; error?: string };
}) {
  const selectedPlan = searchParams.plan;
  const redirectTo = searchParams.redirect || "/browse";
  const hasError = searchParams.error;

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left side - Form */}
      <div className="flex items-center justify-center p-4 lg:p-8">
        <div className="w-full max-w-md space-y-6">
          {/* Header */}
          <div className="space-y-2 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to home
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

          {/* Selected Plan Info */}
          {selectedPlan && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-6">
                <div className="text-center space-y-2">
                  <Badge variant="secondary">Selected Plan</Badge>
                  <div className="text-sm">
                    <p className="font-medium capitalize">
                      {selectedPlan} Plan
                    </p>
                    <p className="text-muted-foreground text-xs">
                      You can change this later
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error Alert */}
          {hasError && (
            <Card className="border-destructive bg-destructive/5">
              <CardContent className="pt-6">
                <div className="text-sm text-destructive">
                  {hasError === "EmailExists"
                    ? "An account with this email already exists. Try signing in instead."
                    : "An error occurred during registration. Please try again."}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Social Registration */}
          <SocialRegistration />

          {/* Registration Form */}
          <Suspense fallback={<div>Loading...</div>}>
            <RegisterForm redirectTo={redirectTo} />
          </Suspense>

          {/* Trust Indicators */}
          <TrustIndicators />

          {/* Footer Links */}
          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium text-primary hover:underline"
              >
                Sign in
              </Link>
            </p>

            <p className="text-xs text-muted-foreground">
              By creating an account, you agree to our{" "}
              <Link href="/terms" className="underline hover:text-foreground">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="underline hover:text-foreground">
                Privacy Policy
              </Link>
            </p>

            <div className="flex justify-center space-x-4 text-xs text-muted-foreground">
              <Link href="/pricing" className="hover:underline">
                View Plans
              </Link>
              <Link href="/help" className="hover:underline">
                Help Center
              </Link>
              <Link href="/contact" className="hover:underline">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Benefits showcase */}
      <div className="hidden lg:flex items-center justify-center p-8 bg-muted/30">
        <div className="w-full max-w-md">
          <RegistrationBenefits />
        </div>
      </div>
    </div>
  );
}
