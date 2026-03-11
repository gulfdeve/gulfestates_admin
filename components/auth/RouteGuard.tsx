"use client";

import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { checkRouteAccess } from "@/utils/routeProtection";
import LoadingSpinner from "@/components/common/LoadingSpinner";

interface RouteGuardProps {
  children: React.ReactNode;
  requiredRole?: string | string[]; // Optional: specific role requirement
}

export default function RouteGuard({ children, requiredRole }: RouteGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { role, loading, isAuthenticated } = useAuth();

  // Show loading while checking role
  if (loading) {
    return <LoadingSpinner message="Checking access..." />;
  }

  // Check if user has access to the route
  if (!isAuthenticated) {
    return null; // Will be handled by ProtectedLayout
  }

  if (role && !checkRouteAccess(pathname, role)) {
    return (
      <div className="text-black/80 p-4 min-h-[400px]">
        <div className="max-w-2xl mx-auto mt-8">
          <div className="p-6 bg-red-50 border border-red-200 rounded-lg shadow-sm">
            <div className="flex items-start gap-4">
              <div className="shrink-0">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-red-800 mb-2">
                  Access Denied
                </h3>
                <p className="text-red-700 mb-4">
                  You don't have permission to access this page. This section is restricted based on your role.
                </p>
                <div className="mt-4">
                  <button
                    onClick={() => router.push("/")}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  >
                    Go to Dashboard
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // User has access, render children
  return <>{children}</>;
}
