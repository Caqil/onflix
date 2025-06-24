import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/auth-forms";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  Shield,
  Star,
  Users,
  ArrowLeft,
  Github,
  Chrome,
  Apple,
} from "lucide-react";
import { APP_CONFIG } from "@/lib/utils/constants";

export const metadata: Metadata = {
  title: "Sign In",
  description:
    "Sign in to your OnFlix account to access premium streaming content.",
  robots: {
    index: false,
    follow: false,
  },
};

// // Social login buttons component
// function SocialLogin() {
//   if (!FEATURE_FLAGS.ENABLE_SOCIAL_LOGIN) return null;

//   const socialProviders = [
//     {
//       name: "Google",
//       icon: Chrome,
//       provider: "google",
//       disabled: false,
//     },
//     {
//       name: "Apple",
//       icon: Apple,
//       provider: "apple",
//       disabled: false,
//     },
//     {
//       name: "GitHub",
//       icon: Github,
//       provider: "github",
//       disabled: true, // Example: disabled provider
//     },
//   ];

//   const handleSocialLogin = (provider: string) => {
//     // This would integrate with your social auth system
//     console.log(`Login with ${provider}`);
//     // Example: window.location.href = `/api/auth/${provider}`
//   };

//   return (
//     <div className="space-y-4">
//       <div className="relative">
//         <div className="absolute inset-0 flex items-center">
//           <Separator className="w-full" />
//         </div>
//         <div className="relative flex justify-center text-xs uppercase">
//           <span className="bg-background px-2 text-muted-foreground">
//             Or continue with
//           </span>
//         </div>
//       </div>

//       <div className="grid grid-cols-1 gap-3">
//         {socialProviders.map((provider) => (
//           <Button
//             key={provider.provider}
//             variant="outline"
//             onClick={() => handleSocialLogin(provider.provider)}
//             disabled={provider.disabled}
//             className="w-full"
//           >
//             <provider.icon className="w-4 h-4 mr-2" />
//             Continue with {provider.name}
//           </Button>
//         ))}
//       </div>
//     </div>
//   );
// }

// Features showcase component
function LoginFeatures() {
  const features = [
    {
      icon: Play,
      title: "Unlimited Streaming",
      description: "Access to thousands of movies and TV shows",
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Your data is protected with enterprise-grade security",
    },
    {
      icon: Star,
      title: "Premium Quality",
      description: "Stream in 4K Ultra HD with Dolby sound",
    },
    {
      icon: Users,
      title: "Multiple Profiles",
      description: "Create profiles for your whole family",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">
          Welcome back to {APP_CONFIG.NAME}
        </h2>
        <p className="text-muted-foreground">
          Sign in to continue your streaming journey
        </p>
      </div>

      <div className="grid gap-4">
        {features.map((feature, index) => (
          <div
            key={index}
            className="flex items-start gap-3 p-3 rounded-lg border bg-card/50"
          >
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <feature.icon className="w-4 h-4 text-primary" />
            </div>
            <div className="space-y-1">
              <h3 className="font-medium text-sm">{feature.title}</h3>
              <p className="text-xs text-muted-foreground">
                {feature.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Demo account info
function DemoInfo() {
  if (process.env.NODE_ENV !== "development") return null;

  return (
    <Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/20">
      <CardContent className="pt-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Demo</Badge>
            <span className="text-sm font-medium">Test Accounts</span>
          </div>
          <div className="text-xs space-y-2">
            <div>
              <p className="font-medium">Regular User:</p>
              <p>Email: user@example.com</p>
              <p>Password: password123</p>
            </div>
            <div>
              <p className="font-medium">Admin User:</p>
              <p>Email: admin@example.com</p>
              <p>Password: admin123</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: { redirect?: string; error?: string };
}) {
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

          {/* Error Alert */}
          {hasError && (
            <Card className="border-destructive bg-destructive/5">
              <CardContent className="pt-6">
                <div className="text-sm text-destructive">
                  {hasError === "CredentialsSignin"
                    ? "Invalid email or password. Please try again."
                    : "An error occurred during sign in. Please try again."}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Login Form */}
          <Suspense fallback={<div>Loading...</div>}>
            <LoginForm redirectTo={redirectTo} />
          </Suspense>

          {/* Social Login */}
          {/* <SocialLogin /> */}

          {/* Demo Info */}
          <DemoInfo />

          {/* Footer Links */}
          <div className="text-center space-y-4">
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
              <Link href="/privacy" className="hover:underline">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:underline">
                Terms of Service
              </Link>
              <Link href="/help" className="hover:underline">
                Help
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Features showcase */}
      <div className="hidden lg:flex items-center justify-center p-8 bg-muted/30">
        <div className="w-full max-w-md">
          <LoginFeatures />
        </div>
      </div>
    </div>
  );
}
