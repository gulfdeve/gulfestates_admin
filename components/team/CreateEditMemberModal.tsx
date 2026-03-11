"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { validateImageFile } from "@/utils/fileValidation";
import { getDepartmentOptions } from "@/utils/departments";
import { toast } from "sonner";

interface MemberFormData {
  name: string;
  role: string; // Job Title
  image: string;
  department: string; // Job Category
}

interface CreateEditMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: MemberFormData) => Promise<void>;
  initialData?: MemberFormData | null;
  mode: "create" | "edit";
  loading?: boolean;
}

const CreateEditMemberModal: React.FC<CreateEditMemberModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode,
  loading = false,
}) => {
  const [formData, setFormData] = useState<MemberFormData>({
    name: "",
    role: "",
    image: "",
    department: "",
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && initialData) {
        setFormData({
          name: initialData.name || "",
          role: initialData.role || "",
          image: initialData.image || "",
          department: initialData.department || "",
        });
        if (initialData.image) {
          setImagePreview(initialData.image);
        }
      } else {
        setFormData({
          name: "",
          role: "",
          image: "",
          department: "",
        });
        setImagePreview(null);
      }
      setImageFile(null);
      setError("");
    }
  }, [isOpen, mode, initialData]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast.error(validation.error || "Invalid file");
      e.target.value = "";
      return;
    }

    setImageFile(file);
    const imageURL = URL.createObjectURL(file);
    setImagePreview(imageURL);

    await uploadImage(file);
  };

  const uploadImage = async (file: File) => {
    try {
      setUploadingImage(true);
      const token = localStorage.getItem("adminToken");
      if (!token) {
        setError("Not authenticated");
        return;
      }

      const formData = new FormData();
      formData.append("image", file);

      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${API_URL}/api/upload/image`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (data.success && data.data?.url) {
        setFormData((prev) => ({ ...prev, image: data.data.url }));
        toast.success("Image uploaded successfully");
      } else {
        toast.error(data.message || "Failed to upload image");
      }
    } catch (err: any) {
      toast.error("Error uploading image");
      console.error("Image upload error:", err);
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    setImageFile(null);
    setFormData((prev) => ({ ...prev, image: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.name || !formData.role || !formData.department) {
      setError("Name, Job Title, and Job Category are required");
      return;
    }

    if (!formData.image) {
      setError("Image is required");
      return;
    }

    try {
      await onSubmit(formData);
      toast.success(
        mode === "create" ? "Member created successfully" : "Member updated successfully"
      );
      onClose();
    } catch (err: any) {
      setError(
        err.message ||
          `Error ${mode === "create" ? "creating" : "updating"} member`
      );
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleClose = () => {
    setFormData({
      name: "",
      role: "",
      image: "",
      department: "",
    });
    setImagePreview("")
    setImageFile(null);
    setError("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold">
            {mode === "create" ? "New Team Member" : "Edit Team Member"}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>
        <div className="px-6 py-4">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="w-full flex flex-col gap-2">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-gray-900 mb-1"
                  >
                    Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>

                <div>
                  <label
                    htmlFor="role"
                    className="block text-gray-900 mb-1"
                  >
                    Job Title *
                  </label>
                  <input
                    type="text"
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>

                <div>
                  <label
                    htmlFor="department"
                    className="block text-gray-900 mb-1"
                  >
                    Department*
                  </label>
                  <select
                    id="department"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
                  >
                    <option value="">Select Department</option>
                    {getDepartmentOptions()?.map((dept) => (
                      <option key={dept.value} value={dept.value}>
                        {dept.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="image"
                  className="block text-gray-900 mb-1"
                >
                  Image * (JPG, PNG, WEBP, GIF, AVIF – max 5MB)
                </label>
                <div className="relative w-full border border-gray-400 rounded-md cursor-pointer flex items-center px-3 overflow-hidden min-h-[190px]">
                  {uploadingImage && (
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                      <p className="text-sm text-gray-600">Uploading...</p>
                    </div>
                  )}
                  {imagePreview ? (
                    <>
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-[200px] object-contain"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-1 right-1 bg-black text-white rounded-full w-6 h-6 flex items-center justify-center text-sm z-20"
                      >
                        ×
                      </button>
                    </>
                  ) : (
                    <div className="text-gray-400 py-2 w-full text-center">
                      <Image
                        src="/icons/upload-photo.png"
                        alt="Upload Icon"
                        width={28}
                        height={28}
                        className="opacity-50 mx-auto"
                      />
                      <p className="mt-2 text-sm">Upload/Drag And Drop</p>
                    </div>
                  )}

                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/avif"
                    onChange={handleImageChange}
                    className="absolute inset-0 w-full opacity-0 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading || uploadingImage}
              >
                {loading
                  ? "Saving..."
                  : mode === "create"
                  ? "Create Member"
                  : "Update Member"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateEditMemberModal;
