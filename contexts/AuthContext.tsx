"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { checkRouteAccess } from "@/utils/routeProtection";
import { apiUrl } from "@/utils/apiUrl";

interface AdminUser {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  phone?: string;
  role?: 'superadmin' | 'admin' | 'customer-manager' | 'user';
  avatar?: string;
  createdAt?: string;
  lastLogin?: string;
}

interface AuthContextType {
  user: AdminUser | null;
  role: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  checkAccess: (route: string) => boolean;
  refreshUser: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchUserData = async (): Promise<void> => {
    try {
      setLoading(true);
      
      // First check localStorage
      const adminUser = localStorage.getItem("adminUser");
      if (adminUser) {
        try {
          const parsed = JSON.parse(adminUser);
          if (parsed.role && parsed.email) {
            setUser(parsed);
            setRole(parsed.role);
            setLoading(false);
            // Still fetch from API to ensure data is fresh, but don't block UI
            fetchUserFromAPI();
            return;
          }
        } catch (e) {
          console.error("Error parsing admin user from localStorage:", e);
        }
      }

      // If no valid data in localStorage, fetch from API
      await fetchUserFromAPI();
    } catch (error) {
      console.error("Error fetching user data:", error);
      setLoading(false);
    }
  };

  const fetchUserFromAPI = async (): Promise<void> => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(apiUrl("/api/auth/me"), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.admin) {
          const adminData = data.data.admin;
          setUser(adminData);
          setRole(adminData.role || null);
          
          // Update localStorage
          localStorage.setItem("adminUser", JSON.stringify(adminData));
        } else {
          // Invalid response, clear auth
          localStorage.removeItem("adminToken");
          localStorage.removeItem("adminUser");
          setUser(null);
          setRole(null);
        }
      } else {
        // Unauthorized or error, clear auth
        if (response.status === 401) {
          localStorage.removeItem("adminToken");
          localStorage.removeItem("adminUser");
          setUser(null);
          setRole(null);
        }
      }
    } catch (err) {
      console.error("Error fetching user from API:", err);
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async (): Promise<void> => {
    await fetchUserFromAPI();
  };

  const logout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    setUser(null);
    setRole(null);
    router.push("/admin/login");
  };

  const checkAccess = (route: string): boolean => {
    return checkRouteAccess(route, role);
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const value: AuthContextType = {
    user,
    role,
    loading,
    isAuthenticated: !!user && !!role,
    checkAccess,
    refreshUser,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
