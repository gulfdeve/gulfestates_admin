"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import NotificationDropdown from "../notifications/NotificationDropdown";
import { useAuth } from "@/contexts/AuthContext";

interface Notification {
  _id: string;
  type: string;
  action: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export default function Navbar() {
  const { user, refreshUser, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [avatarError, setAvatarError] = useState(false);

  // Fetch notifications on mount
  useEffect(() => {
    fetchNotifications();

    // Listen for profile updates
    const handleProfileUpdate = () => {
      refreshUser();
    };

    window.addEventListener('profileUpdated', handleProfileUpdate);

    // Also refresh when window gets focus (in case profile was updated in another tab)
    window.addEventListener('focus', refreshUser);

    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
      window.removeEventListener('focus', refreshUser);
    };
  }, [refreshUser]);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) return;

      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${API_URL}/api/notifications?limit=20`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      if (data.success && data.data) {
        setNotifications(data.data.notifications || []);
        setUnreadCount(data.data.unreadCount || 0);
      }
    } catch (err: any) {
      console.error("Error fetching notifications:", err);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) return;

      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      await fetch(`${API_URL}/api/notifications/${id}/read`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      // Update local state
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err: any) {
      console.error("Error marking notification as read:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) return;

      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      await fetch(`${API_URL}/api/notifications/read-all`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      // Update local state
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err: any) {
      console.error("Error marking all as read:", err);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) return;

      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      await fetch(`${API_URL}/api/notifications/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      // Update local state
      const notification = notifications.find((n) => n._id === id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      if (notification && !notification.read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err: any) {
      console.error("Error deleting notification:", err);
    }
  };

  const handleSignOut = () => {
    // Close dropdown
    setIsDropdownOpen(false);
    // Use logout from AuthContext which handles clearing data
    logout();
  };

  const adminAvatar = user?.avatar || "";
  const adminName = user?.name || "";

  return (
    <nav className="bg-primary text-white w-full shadow-md">
      <div className="mx-auto flex h-24 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-12">
        {/* 1. Logo Section */}
        <div className="flex items-center">
          <Link href="/" className="flex shrink-0 items-center">
            <Image
              src="/logo.svg"
              width={150}
              height={100}
              alt="gulf estates"
            />
          </Link>
        </div>

        {/* 2. Search Bar Section */}
        <div className="flex-1 px-8 lg:px-16">
          <div className="relative mx-auto max-w-lg">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4">
              <Image
                src="/icons/search.svg"
                width={16}
                height={16}
                alt="search"
                className="cursor-pointer"
              />
            </div>
            <input
              type="search"
              name="search"
              id="search"
              className="block w-full rounded-2xl border-0 py-3 pl-12 pr-4 sm:text-sm focus:outline-none bg-white/10"
              placeholder="Search Property, Agent, or Client..."
            />
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Notification Bell */}
          <div className="relative">
            <button
              type="button"
              className="rounded-full p-1 text-blue-200 hover:text-white focus:outline-none cursor-pointer relative"
              aria-label="View notifications"
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
            >
              <Image src="/icons/bell.svg" width={20} height={20} alt="notifications" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center text-[10px] font-bold">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
            {isNotificationOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsNotificationOpen(false)}
                ></div>
                <NotificationDropdown
                  notifications={notifications}
                  unreadCount={unreadCount}
                  onMarkAsRead={handleMarkAsRead}
                  onMarkAllAsRead={handleMarkAllAsRead}
                  onDelete={handleDeleteNotification}
                  onClose={() => setIsNotificationOpen(false)}
                />
              </>
            )}
          </div>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              type="button"
              className="flex max-w-xs items-center gap-2 rounded-full text-sm focus:outline-none cursor-pointer"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              aria-expanded={isDropdownOpen}
              aria-haspopup="true"
            >
              {adminAvatar && !avatarError ? (
                <img
                  className="h-9 w-9 rounded-full object-cover border-2 border-white/20"
                  src={adminAvatar}
                  alt="Admin avatar"
                  onError={() => {
                    // If image fails to load, set error to show placeholder instead
                    setAvatarError(true);
                  }}
                />
              ) : (
                <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center text-white font-semibold text-sm">
                  {adminName ? adminName.charAt(0).toUpperCase() : 'A'}
                </div>
              )}
              <Image
                src="/icons/arrow-up.svg"
                width={16}
                height={16}
                alt="open/close"
                className={`${isDropdownOpen ? "rotate-180" : "rotate-0"
                  } transition-all duration-200`}
              />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div
                className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                role="menu"
                aria-orientation="vertical"
                aria-labelledby="user-menu-button"
              >
                <Link
                  href="/settings/edit-profile"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  role="menuitem"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  Your Profile
                </Link>
                <Link
                  href="/settings/account"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  role="menuitem"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  Settings
                </Link>
                <button
                  onClick={handleSignOut}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  role="menuitem"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
