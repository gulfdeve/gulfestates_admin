"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { validateImageFile } from "@/utils/fileValidation";
import { toast } from "sonner";

interface TeamBasicInfoData {
  owner: {
    name: string;
    role: string;
    description: { en: string; fr: string; es: string };
    image: string;
  };
  title: { en: string; fr: string; es: string };
  description: { en: string; fr: string; es: string };
}

interface TeamBasicInfoFormProps {
  initialData?: TeamBasicInfoData | null;
  locale?: "en" | "fr" | "es";
}

const TeamBasicInfoForm: React.FC<TeamBasicInfoFormProps> = ({
  initialData,
  locale = "en",
}) => {
  const [formData, setFormData] = useState<TeamBasicInfoData>({
    owner: {
      name: "",
      role: "",
      description: { en: "", fr: "", es: "" },
      image: "",
    },
    title: { en: "", fr: "", es: "" },
    description: { en: "", fr: "", es: "" },
  });

  const [ownerImagePreview, setOwnerImagePreview] = useState<string | null>(
    null
  );
  const [uploadingOwnerImage, setUploadingOwnerImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (initialData) {
      console.log({ initialData });

      // Ensure proper multilingual structure
      const ownerDescription =
        typeof initialData.owner?.description === "object" &&
        initialData.owner?.description !== null
          ? {
              en: initialData.owner.description.en || "",
              fr: initialData.owner.description.fr || "",
              es: initialData.owner.description.es || "",
            }
          : { en: "", fr: "", es: "" };

      const title =
        typeof initialData.title === "object" && initialData.title !== null
          ? {
              en: initialData.title.en || "",
              fr: initialData.title.fr || "",
              es: initialData.title.es || "",
            }
          : { en: "", fr: "", es: "" };

      const description =
        typeof initialData.description === "object" &&
        initialData.description !== null
          ? {
              en: initialData.description.en || "",
              fr: initialData.description.fr || "",
              es: initialData.description.es || "",
            }
          : { en: "", fr: "", es: "" };

      setFormData({
        owner: {
          name: initialData.owner?.name || "",
          role: initialData.owner?.role || "",
          description: ownerDescription,
          image: initialData.owner?.image || "",
        },
        title: title,
        description: description,
      });

      if (initialData.owner?.image) {
        setOwnerImagePreview(initialData.owner.image);
      }
    }
  }, [initialData]);

  const processOwnerImage = async (file: File) => {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error || "Invalid file");
      return;
    }

    const imageURL = URL.createObjectURL(file);
    setOwnerImagePreview(imageURL);

    await uploadOwnerImage(file);
  };

  const uploadOwnerImage = async (file: File) => {
    try {
      setUploadingOwnerImage(true);
      const token = localStorage.getItem("adminToken");
      if (!token) {
        toast.error("Not authenticated");
        return;
      }

      const formDataObj = new FormData();
      formDataObj.append("image", file);

      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${API_URL}/api/upload/image`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataObj,
      });

      const data = await response.json();

      if (data.success && data.data?.url) {
        setFormData((prev) => ({
          ...prev,
          owner: { ...prev.owner, image: data.data.url },
        }));
      } else {
        toast.error("Failed to upload image");
      }
    } catch (err: any) {
      toast.error("Error uploading image");
      console.error("Image upload error:", err);
    } finally {
      setUploadingOwnerImage(false);
    }
  };

  const handleOwnerImageChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = "";
    await processOwnerImage(file);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    field: string,
    lang?: "en" | "fr" | "es"
  ) => {
    const value = e.target.value;

    if (field.startsWith("owner.")) {
      const ownerField = field.replace("owner.", "");
      if (ownerField === "name" || ownerField === "role") {
        setFormData((prev) => ({
          ...prev,
          owner: { ...prev.owner, [ownerField]: value },
        }));
      } else if (ownerField === "description" && lang) {
        setFormData((prev) => ({
          ...prev,
          owner: {
            ...prev.owner,
            description: { ...prev.owner.description, [lang]: value },
          },
        }));
      }
    } else if (field === "title" && lang) {
      setFormData((prev) => ({
        ...prev,
        title: { ...prev.title, [lang]: value },
      }));
    } else if (field === "description" && lang) {
      setFormData((prev) => ({
        ...prev,
        description: { ...prev.description, [lang]: value },
      }));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError("");

      const token = localStorage.getItem("adminToken");
      if (!token) {
        toast.error("Not authenticated");
        setSaving(false);
        return;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${API_URL}/api/team`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          owner: formData.owner,
          title: formData.title,
          description: formData.description,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Server error: ${response.status}`
        );
      }

      const data = await response.json();

      if (data.success) {
        toast.success("Team data saved successfully");
        setError(""); // Clear any previous errors
        setIsEditing(false); // Disable editing after successful save
      } else {
        toast.error(data.message || "Failed to save team data");
      }
    } catch (err: any) {
      console.error("Error saving team data:", err);
      toast.error(err.message || "Error saving team data. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4">
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSave}>
        {/* CEO Section (Owner) */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">CEO Section</h2>
          </div>

          <div className="space-y-4">
            {/* Owner Image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Image (JPG, PNG, WEBP, GIF, AVIF – max 5MB)
              </label>
              <div className="flex items-start justify-between gap-4">
                <div className={`relative w-32 h-32 border border-gray-300 rounded-md overflow-hidden bg-gray-100 ${!isEditing ? 'opacity-60' : ''}`}>
                  {uploadingOwnerImage && (
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                      <p className="text-xs text-gray-600">Uploading...</p>
                    </div>
                  )}
                  {ownerImagePreview ? (
                    <>
                      <img
                        src={ownerImagePreview}
                        alt="Owner"
                        className="w-full h-full object-cover"
                      />
                      {isEditing && (
                        <button
                          type="button"
                          onClick={() => {
                            setOwnerImagePreview(null);
                            setFormData((prev) => ({
                              ...prev,
                              owner: { ...prev.owner, image: "" },
                            }));
                          }}
                          className="absolute top-1 right-1 bg-black text-white rounded-full w-6 h-6 flex items-center justify-center text-sm z-20"
                        >
                          ×
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Image
                        src="/icons/upload-photo.png"
                        alt="Upload"
                        width={24}
                        height={24}
                        className="opacity-50"
                      />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/avif"
                    onChange={handleOwnerImageChange}
                    disabled={!isEditing}
                    className={`absolute inset-0 w-full opacity-0 ${isEditing ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                  />
                </div>
                {!isEditing ? (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="px-6 py-2 font-semibold bg-blue-500 text-white border border-gray-300 rounded-md hover:bg-blue-600 transition-colors"
                  >
                    Edit
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-6 py-2 font-semibold bg-blue-500 text-white border border-gray-300 rounded-md hover:bg-blue-600 transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>

            <div className="flex w-full items-center gap-4">
              {/* Owner Name - Single field */}
              <div className="w-full">
                <label className="block text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={formData.owner.name}
                  onChange={(e) => handleInputChange(e, "owner.name")}
                  disabled={!isEditing}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
                  required
                />
              </div>

              {/* Owner Title/Role - Single field */}
              <div className="w-full">
                <label className="block text-gray-700 mb-1">Title/Role *</label>
                <input
                  type="text"
                  value={formData.owner.role}
                  onChange={(e) => handleInputChange(e, "owner.role")}
                  disabled={!isEditing}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
                  required
                />
              </div>
            </div>

            {/* Owner Description - Multilingual */}
            <div>
              <label className="block text-gray-700 mb-1">
                Description ({locale?.toUpperCase()})*
              </label>
              <div className="space-y-3">
                <div>
                  <textarea
                    value={formData.owner.description[locale]}
                    onChange={(e) =>
                      handleInputChange(e, "owner.description", locale)
                    }
                    placeholder="Enter description..."
                    rows={8}
                    disabled={!isEditing}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
                    required
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Title Section */}
        <div className="p-4">
          <h2 className="font-semibold mb-1">
            Title ({locale?.toUpperCase()})
          </h2>
          <div className="space-y-3">
            <div>
              <input
                type="text"
                value={formData.title[locale]}
                onChange={(e) => handleInputChange(e, "title", locale)}
                disabled={!isEditing}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
                required
                placeholder="Enter title..."
              />
            </div>
          </div>
        </div>

        {/* Description Section */}
        <div className="p-4">
          <h2 className="font-semibold mb-1">
            Description ({locale?.toUpperCase()})
          </h2>
          <div className="space-y-3">
            <div>
              <textarea
                value={formData.description[locale]}
                onChange={(e) => handleInputChange(e, "description", locale)}
                rows={4}
                disabled={!isEditing}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
                required
                placeholder="Enter description..."
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        {isEditing && (
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving || uploadingOwnerImage}
              className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Save Team Data"}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default TeamBasicInfoForm;
