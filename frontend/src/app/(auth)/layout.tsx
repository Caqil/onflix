import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | OnFlix",
    default: "Authentication | OnFlix",
  },
  description:
    "Sign in or create an account to access OnFlix streaming platform.",
};

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return <div className="min-h-screen bg-background">{children}</div>;
}
