import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="text-red-600 text-6xl mb-4">404</div>
        <h1 className="text-3xl font-bold text-white mb-4">Page Not Found</h1>
        <p className="text-gray-400 mb-6">
          Sorry, we couldn't find the page you're looking for. It might have
          been moved or deleted.
        </p>
        <div className="space-y-4">
          <Button asChild className="bg-red-600 hover:bg-red-700 w-full">
            <Link href="/">Go back home</Link>
          </Button>
          <Button
            variant="outline"
            asChild
            className="border-gray-600 text-white hover:bg-gray-800 w-full"
          >
            <Link href="/browse">Browse content</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
