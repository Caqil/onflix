import type { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";

export const metadata: Metadata = {
  title: {
    template: "%s | Browse | OnFlix",
    default: "Browse Content | OnFlix",
  },
  description:
    "Browse and discover movies, TV shows, and premium content on OnFlix.",
};

interface BrowseLayoutProps {
  children: React.ReactNode;
}

export default function BrowseLayout({ children }: BrowseLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 lg:ml-72">{children}</main>
      </div>
    </div>
  );
}
