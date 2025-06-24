"use client";

import React from "react";
import { UserProvider } from "./UserContext";
import { SubscriptionProvider } from "./SubscriptionContext";

export function AppProvider({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <SubscriptionProvider>{children}</SubscriptionProvider>
    </UserProvider>
  );
}
