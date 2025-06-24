export { AuthProvider } from "./auth-context";
export { AppProvider, useAppContext } from "./app-context";
export { StreamingProvider, useStreamingContext } from "./streaming-context";

// Combined provider for easy setup
import React from "react";
import { AuthProvider } from "./auth-context";
import { AppProvider } from "./app-context";
import { StreamingProvider } from "./streaming-context";
import { useAuth } from "../hooks/use-auth";

interface ProvidersProps {
  children: React.ReactNode;
}

export const Providers: React.FC<ProvidersProps> = ({ children }) => {
  return (
    <AppProvider>
      <AuthProvider>
        <StreamingProvider>{children}</StreamingProvider>
      </AuthProvider>
    </AppProvider>
  );
};
