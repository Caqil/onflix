"use client";

import { Header } from "@/components/layout/Header";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-black">
        <Header />
        <main className="pt-16">{children}</main>
      </div>
    </ProtectedRoute>
  );
}
