"use client";
import React, { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { validateImageFile } from "@/utils/fileValidation";

interface AdminData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
}

export default function EditProfile() {
  const [profileImage, setProfileImage] = useState<string>("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [isEditingPersonal, setIsEditingPersonal] = useState(false);

  const [tempFullName, setTempFullName] = useState(fullName);
  const [tempEmail, setTempEmail] = useState(email);
  const [tempPhone, setTempPhone] = useState(phone);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch admin data on mount
  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        toast.error("Not authenticated");
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
        setFullName(admin.name || "");
        setEmail(admin.email || "");
        setPhone(admin.phone || "");
        setProfileImage(admin.avatar || "");
        setTempFullName(admin.name || "");
        setTempEmail(admin.email || "");
        setTempPhone(admin.phone || "");
      } else {
        toast.error("Failed to load admin data");
      }
    } catch (err: any) {
      toast.error("Error loading profile data");
      console.error("Error fetching admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type and size
    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast.error(validation.error || "Invalid file");
      return;
    }

    try {
      setUploadingImage(true);

      const token = localStorage.getItem("adminToken");
      if (!token) {
        toast.error("Not authenticated");
        return;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const formData = new FormData();
      formData.append("image", file);

      const uploadResponse = await fetch(`${API_URL}/api/upload/image`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const uploadData = await uploadResponse.json();

      if (!uploadData.success || !uploadData.data?.url) {
        toast.error(uploadData.message || "Failed to upload image");
        return;
      }

      const cloudinaryUrl = uploadData.data.url;
      setProfileImage(cloudinaryUrl);
      await updateProfile({ avatar: cloudinaryUrl });
    } catch (err: unknown) {
      toast.error("Error uploading image");
      console.error("Error uploading image:", err);
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const updateProfile = async (updates: { name?: string; phone?: string; avatar?: string }) => {
    try {
      setSaving(true);

      const token = localStorage.getItem("adminToken");
      if (!token) {
        toast.error("Not authenticated");
        return;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${API_URL}/api/admins/profile`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (data.success) {
        const isAvatarOnly = Object.keys(updates).length === 1 && updates.avatar;
        toast.success(isAvatarOnly ? "Profile photo updated" : "Profile updated successfully");
        if (data.data?.admin) {
          const admin = data.data.admin;
          setFullName(admin.name || fullName);
          setPhone(admin.phone || phone);
          if (admin.avatar) setProfileImage(admin.avatar);
          
          // Update localStorage
          localStorage.setItem("adminUser", JSON.stringify(admin));
          
          // Dispatch event to update navbar
          window.dispatchEvent(new Event('profileUpdated'));
        }
        setIsEditingPersonal(false);
      } else {
        toast.error(data.message || "Failed to update profile");
      }
    } catch (err: any) {
      toast.error("Error updating profile");
      console.error("Error updating profile:", err);
    } finally {
      setSaving(false);
    }
  };

  const handlePersonalEdit = () => {
    if (isEditingPersonal) {
      // Save changes
      updateProfile({
        name: tempFullName,
        phone: tempPhone,
      });
    } else {
      // Start editing
      setTempFullName(fullName);
      setTempEmail(email);
      setTempPhone(phone);
      setIsEditingPersonal(true);
    }
  };

  if (loading) {
    return <LoadingSpinner fullPage message="Loading profile..." />;
  }

  return (
    <div className="min-h-screen p-4 text-black/90">
      <div className="mx-auto">
        {/* Header */}
        <div className="p-6 rounded-lg shadow-sm">
          <span className="text-3xl font-semibold">Edit Profile</span>
          {/* Profile Picture Upload */}
          <div className="flex items-center gap-4 mt-6">
            <div
              className={`w-20 h-20 rounded-full bg-yellow-100 flex items-center justify-center overflow-hidden ${uploadingImage ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
              onClick={() => !uploadingImage && fileInputRef.current?.click()}
            >
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="Profile"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // If image fails to load, show placeholder
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <span className="text-2xl text-yellow-600">👤</span>
              )}
            </div>
            <div>
              <button
                type="button"
                onClick={() => !uploadingImage && fileInputRef.current?.click()}
                disabled={uploadingImage}
                className="text-gray-800 font-medium hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploadingImage ? "Uploading..." : "Upload New Photo"}
              </button>
              <p className="text-xs text-gray-500 mt-1">
                At least 800×800 recommended
                <br />
                JPG, PNG, WEBP, or AVIF allowed (max 5MB)
              </p>
              {uploadingImage && (
                <p className="text-xs text-blue-600 mt-1">Uploading...</p>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/avif"
                onChange={handleImageUpload}
                className="hidden"
                disabled={uploadingImage}
              />
            </div>
          </div>
        </div>

        {/* Personal Info Section */}
        <div className="p-6 rounded-lg shadow-sm mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-gray-700">
              Personal Info
            </h2>
            <button
              onClick={handlePersonalEdit}
              disabled={saving}
              className="w-24 py-2 bg-blue-500 cursor-pointer text-white text-sm font-medium rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : isEditingPersonal ? "Save" : "Edit"}
            </button>
          </div>

          {isEditingPersonal ? (
            <div className="flex flex-col gap-8">
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={tempFullName}
                  onChange={(e) => setTempFullName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={tempEmail}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none bg-gray-100 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={tempPhone}
                  onChange={(e) => setTempPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-8">
              <div>
                <p className="font-medium text-gray-400">Full Name</p>
                <p className="text-gray-700 font-semibold text-lg">
                  {fullName}
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-400">Email</p>
                <p className="text-gray-700 font-semibold text-lg">{email}</p>
              </div>
              <div>
                <p className="font-medium text-gray-400">Phone</p>
                <p className="text-gray-700 font-semibold text-lg">{phone}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
