"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import LoadingSpinner from "@/components/common/LoadingSpinner";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      // Check if we're on the login page - don't redirect if already there
      if (pathname === "/admin/login") {
        setIsLoading(false);
        setIsAuthenticated(true);
        return;
      }

      // Check for admin token in localStorage
      const token = localStorage.getItem("adminToken");
      const user = localStorage.getItem("adminUser");

      if (!token || !user) {
        router.push("/admin/login");
        setIsLoading(false);
        return;
      }

      // Verify token is still valid by checking with backend
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL;
        const response = await fetch(`${API_URL}/api/auth/me`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          router.push("/admin/login");
          setIsLoading(false);
          return;
        }

        // Token is valid
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Auth check error:", error);
        router.push("/admin/login");
      }
      
      setIsLoading(false);
    };

    checkAuth();
  }, [pathname, router]);

  // Show loading state while checking authentication
  if (isLoading) {
    return <LoadingSpinner fullPage message="Loading..." />;
  }

  // If on login page, show children directly
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  // If authenticated, show protected content
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // Otherwise, show nothing (redirect is happening)
  return null;
}

