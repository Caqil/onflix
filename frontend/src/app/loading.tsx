import { LoadingSpinner } from "@/components/layout/LoadingSpinner";

export default function Loading() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="text-white mt-4 text-lg">Loading Onflix...</p>
      </div>
    </div>
  );
}
