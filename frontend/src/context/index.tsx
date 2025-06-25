"use client";
import React from "react";
import { AuthProvider } from "./auth-context";
import { AppProvider } from "./app-context";
import { StreamingProvider } from "./streaming-context";
import { AuthInitialization } from "../components/providers/auth-initialization";

interface ProvidersProps {
  children: React.ReactNode;
}

export const Providers: React.FC<ProvidersProps> = ({ children }) => {
  return (
    <AppProvider>
      <AuthInitialization>
        <AuthProvider>
          <StreamingProvider>{children}</StreamingProvider>
        </AuthProvider>
      </AuthInitialization>
    </AppProvider>
  );
};
