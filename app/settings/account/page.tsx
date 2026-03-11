"use client";
import Image from "next/image";
import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function AccountSettings() {
  const { role } = useAuth();
  const isSuperAdmin = role === "superadmin";
  
  const [language, setLanguage] = useState("English");
  const [OpenLanguage, setOpenLanguage] = useState(false);
  const [inputTools, setInputTools] = useState(
    "Type more easily in your language"
  );
  const [highContrast, setHighContrast] = useState(false);
  const [password, setPassword] = useState("");
  const [OpenPassword, setOpenPassword] = useState(false);
  const [lastChanged, setLastChanged] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  // Fetch admin data on mount
  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        setLoading(false);
        return;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${API_URL}/api/auth/me`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.success && data.data?.admin) {
        const admin = data.data.admin;
        setAdminEmail(admin.email || "");
        // Format last changed date if available
        if (admin.updatedAt) {
          const date = new Date(admin.updatedAt);
          setLastChanged(date.toLocaleDateString("en-US", { month: "short", day: "numeric" }));
        }
      }
    } catch (err: any) {
      console.error("Error fetching admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageClick = () => {
    setOpenLanguage(!OpenLanguage);
    // Navigate to language settings
    console.log("Navigate to Language settings");
  };

  const handleInputToolsClick = () => {
    // Navigate to input tools settings
    console.log("Navigate to Input Tools settings");
  };

  const handleAccessibilityClick = () => {
    // Navigate to accessibility settings
    console.log("Navigate to Accessibility settings");
  };

  const handlePasswordClick = () => {
    setOpenPassword(!OpenPassword);
    setPasswordError("");
    setPasswordSuccess("");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
  };

  const handlePasswordChange = async () => {
    setPasswordError("");
    setPasswordSuccess("");

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setPasswordError("All fields are required");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError("New password and confirm password do not match");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return;
    }

    try {
      setChangingPassword(true);
      const token = localStorage.getItem("adminToken");
      if (!token) {
        setPasswordError("Not authenticated");
        return;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${API_URL}/api/admins/change-password`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setPasswordSuccess("Password changed successfully");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
        setLastChanged(new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }));
        setTimeout(() => {
          setOpenPassword(false);
          setPasswordSuccess("");
        }, 2000);
      } else {
        setPasswordError(data.message || "Failed to change password");
      }
    } catch (err: any) {
      setPasswordError("Error changing password");
      console.error("Error changing password:", err);
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSearchClick = () => {
    // Navigate to search
    console.log("Search Gulf Estate Account");
  };

  const handleHelpClick = () => {
    // Navigate to help
    console.log("Open Help Options");
  };

  const handleFeedbackClick = () => {
    // Navigate to feedback
    console.log("Open Feedback form");
  };

  return (
    <div className="min-h-screen">
      <div className="mx-auto p-4 md:p-6">
        {/* General Preferences Section */}
        <div className="bg-white rounded-lg shadow-sm mb-4 p-6">
          <h1 className="text-3xl md:text-3xl mb-4 font-semibold text-gray-700">
            Account Settings
          </h1>
          <div className="mb-4">
            <h2 className="text-xl font-medium text-gray-700">
              General Preferences
            </h2>
            <p className="text-gray-500">
              Manage your account preferences
            </p>
            {adminEmail && (
              <p className="text-sm text-gray-600 mt-2">
                Account: <span className="font-medium">{adminEmail}</span>
              </p>
            )}
          </div>

          {/* Language */}
          <button
            onClick={handleLanguageClick}
            className="w-full flex px-4 rounded-lg items-center justify-between py-4 border-b border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 flex items-center justify-center">
                <Image
                  src="/icons/globe.svg"
                  width={24}
                  height={24}
                  alt="languages"
                />
              </div>
              <div className="text-left">
                <p className="text-base font-medium text-gray-900">Language</p>
                <p className=" text-gray-500">{language}</p>
              </div>
            </div>
            <Image
              src="/icons/arrow-up.svg"
              width={20}
              height={20}
              alt="languages"
              className={`invert transition-all duration-300 opacity-50 ${OpenLanguage ? "rotate-180" : "rotate-270"
                }`}
            />
          </button>
          <div
            className={`overflow-hidden transition-all duration-500 ${OpenLanguage ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
              }`}
          >
            <div className="border-t border-gray-300 p-4 text-black/90">
              <p
                onClick={() => {
                  setLanguage("Spanish");
                  setOpenLanguage(false);
                }}
                className="px-4 hover:bg-gray-100 py-2 rounded-lg max-w-[300px]"
              >
                Spanish
              </p>
              <p
                onClick={() => {
                  setLanguage("French");
                  setOpenLanguage(false);
                }}
                className="px-4 hover:bg-gray-100 py-2 rounded-lg max-w-[300px]"
              >
                French
              </p>
            </div>
          </div>

          {/* Input Tools */}
          <button
            onClick={handleInputToolsClick}
            className="w-full flex px-4 rounded-lg items-center justify-between py-4 border-b border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 flex items-center justify-center">
                <Image
                  src="/icons/settings.svg"
                  width={24}
                  height={24}
                  alt="languages"
                  className="invert"
                />
              </div>
              <div className="text-left">
                <p className="text-base font-medium text-gray-900">
                  Input Tools
                </p>
                <p className=" text-gray-500">{inputTools}</p>
              </div>
            </div>
            <Image
              src="/icons/arrow-up.svg"
              width={20}
              height={20}
              alt="languages"
              className="invert rotate-270 opacity-50"
            />
          </button>

          {/* Accessibility */}
          <button
            onClick={handleAccessibilityClick}
            className="w-full flex px-4 rounded-lg items-center justify-between py-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 flex items-center justify-center">
                <Image
                  src="/icons/accessibility.svg"
                  width={24}
                  height={24}
                  alt="languages"
                />
              </div>
              <div className="text-left">
                <p className="text-base font-medium text-gray-900">
                  Accessibility
                </p>
                <p className=" text-gray-500">
                  High-contrast colors {highContrast ? "ON" : "OFF"}
                </p>
              </div>
            </div>
            <Image
              src="/icons/arrow-up.svg"
              width={20}
              height={20}
              alt="languages"
              className="invert rotate-270 opacity-50"
            />
          </button>
        </div>

        {/* Password Section - Only visible to superadmin */}
        {isSuperAdmin && (
          <div className="bg-white rounded-lg shadow-sm mb-4 p-6">
            <div className="mb-4">
              <h2 className="text-xl font-medium text-gray-900">Password</h2>
              <p className="text-gray-500">
                A secure password helps protect your account
              </p>
            </div>

            <button
              onClick={handlePasswordClick}
              className="w-full flex px-4 rounded-lg items-center justify-between py-4 hover:bg-gray-50 transition-colors"
            >
              <div className="text-left">
                <p className="text-xl text-gray-400 tracking-wider mb-1">
                  {password}
                </p>
                {lastChanged && (
                  <p className=" text-gray-500">Last changed {lastChanged}</p>
                )}
                {!lastChanged && (
                  <p className=" text-gray-500">Click to change password</p>
                )}
              </div>
              <Image
                src="/icons/arrow-up.svg"
                width={20}
                height={20}
                alt="languages"
                className="invert rotate-270 opacity-50"
              />
            </button>
            <div
              className={`overflow-hidden transition-all duration-500 ${OpenPassword ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                }`}
            >
              <div className="border-t border-gray-300 p-4 text-black/90 space-y-4">
                {passwordError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm">{passwordError}</p>
                  </div>
                )}

                {passwordSuccess && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-600 text-sm">{passwordSuccess}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="px-4 focus:bg-gray-100 focus:outline-none border border-gray-400 py-2 rounded-lg w-full max-w-[300px]"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="px-4 focus:bg-gray-100 focus:outline-none border border-gray-400 py-2 rounded-lg w-full max-w-[300px]"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="px-4 focus:bg-gray-100 focus:outline-none border border-gray-400 py-2 rounded-lg w-full max-w-[300px]"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handlePasswordChange}
                    disabled={changingPassword}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-700 text-white/90 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {changingPassword ? "Changing..." : "Change Password"}
                  </button>
                  <button
                    onClick={() => {
                      setOpenPassword(false);
                      setPasswordError("");
                      setPasswordSuccess("");
                      setCurrentPassword("");
                      setNewPassword("");
                      setConfirmNewPassword("");
                    }}
                    className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Looking for something else Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-medium text-gray-900 mb-4">
            Looking for something else?
          </h2>

          {/* Search Gulf Estate Account */}
          <button
            onClick={handleSearchClick}
            className="w-full flex px-4 rounded-lg items-center justify-between py-4 border-b border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 flex items-center justify-center">
                <Image
                  src="/icons/search.svg"
                  width={24}
                  height={24}
                  alt="languages"
                  className="invert"
                />
              </div>
              <p className="text-base text-gray-900">
                Search Gulf Estate Account
              </p>
            </div>
            <Image
              src="/icons/arrow-up.svg"
              width={20}
              height={20}
              alt="languages"
              className="invert rotate-270 opacity-50"
            />
          </button>

          {/* See Help Options */}
          <button
            onClick={handleHelpClick}
            className="w-full flex px-4 rounded-lg items-center justify-between py-4 border-b border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 flex items-center justify-center">
                <Image
                  src="/icons/question.svg"
                  width={24}
                  height={24}
                  alt="languages"
                />
              </div>
              <p className="text-base text-gray-900">See Help Options</p>
            </div>
            <Image
              src="/icons/arrow-up.svg"
              width={20}
              height={20}
              alt="languages"
              className="invert rotate-270 opacity-50"
            />
          </button>

          {/* Send Feedback */}
          <button
            onClick={handleFeedbackClick}
            className="w-full flex px-4 rounded-lg items-center justify-between py-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 flex items-center justify-center">
                <Image
                  src="/icons/problem.svg"
                  width={24}
                  height={24}
                  alt="languages"
                />
              </div>
              <p className="text-base text-gray-900">Send feedback</p>
            </div>
            <Image
              src="/icons/arrow-up.svg"
              width={20}
              height={20}
              alt="languages"
              className="invert rotate-270 opacity-50"
            />
          </button>
        </div>
      </div>
    </div>
  );
}
