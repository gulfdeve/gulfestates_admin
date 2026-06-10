"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { AuthProvider } from "@/contexts/AuthContext";
import LoadingSpinner from "@/components/common/LoadingSpinner";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (pathname === "/admin/login") {
        setIsLoading(false);
        return;
      }

      const token = localStorage.getItem("adminToken");
      const user = localStorage.getItem("adminUser");

      if (!token || !user) {
        router.push("/admin/login");
        setIsLoading(false);
        return;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://backend.gulfestates.ae";
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      try {
        const response = await fetch(`${API_URL}/api/auth/me`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
          localStorage.removeItem("adminToken");
          localStorage.removeItem("adminUser");
          router.push("/admin/login");
          setIsLoading(false);
          return;
        }

        setIsAuthenticated(true);
      } catch (error) {
        clearTimeout(timeoutId);
        // Network error or timeout: trust cached token, let API calls handle invalid tokens
        if (error instanceof Error && error.name === "AbortError") {
          console.warn("Auth check timed out, using cached token");
        }
        setIsAuthenticated(true);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [pathname, router]);

  // If on login page, don't show navbar/sidebar
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  // Show loading state while checking authentication
  if (isLoading) {
    return <LoadingSpinner fullPage message="Loading..." />;
  }

  // If not authenticated, show nothing (redirect is happening)
  if (!isAuthenticated) {
    return null;
  }

  // Authenticated - show full layout with Navbar and Sidebar
  return (
    <AuthProvider>
      {/* Navbar stays fixed at top */}
      <Navbar />

      {/* Sidebar + Main content container */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar stays fixed */}
        <Sidebar />

        {/* Only main area scrolls */}
        <main className="flex-1 overflow-y-auto custom-scrollbar p-3 lg:p-6 bg-gray-50">
          {children}
        </main>
      </div>
    </AuthProvider>
  );
}

