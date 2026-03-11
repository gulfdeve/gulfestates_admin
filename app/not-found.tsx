"use client";
import Link from "next/link";
import RouteGuard from "@/components/auth/RouteGuard";

export default function NotFound() {
  return (
    <RouteGuard>
      <div className="min-h-screen flex items-center justify-center text-black/80">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-9xl font-bold text-primary mb-4">404</h1>
            <h2 className="text-3xl font-semibold text-gray-800 mb-4">
              Page Not Found
            </h2>
            <p className="text-gray-600 mb-8">
              The page you're looking for doesn't exist or has been moved.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="px-6 py-3 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors font-medium text-center"
            >
              Go to Dashboard
            </Link>
          </div>
      </div>
      </div>
    </RouteGuard>
  );
}
