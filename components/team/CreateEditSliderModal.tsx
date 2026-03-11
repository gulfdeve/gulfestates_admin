"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { validateImageFile } from "@/utils/fileValidation";

interface SliderItemFormData {
  image: string;
  name: string;
  index: number;
}

interface CreateEditSliderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SliderItemFormData) => void;
  initialData?: SliderItemFormData | null;
  mode: "create" | "edit";
  maxIndex?: number;
}

const CreateEditSliderModal: React.FC<CreateEditSliderModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode,
  maxIndex = 0,
}) => {
  const [formData, setFormData] = useState<SliderItemFormData>({
    image: "",
    name: "",
    index: 0,
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && initialData) {
        setFormData({
          image: initialData.image || "",
          name: initialData.name || "",
          index: initialData.index || 0,
        });
        if (initialData.image) {
          setImagePreview(initialData.image);
        }
      } else {
        setFormData({
          image: "",
          name: "",
          index: maxIndex + 1,
        });
        setImagePreview(null);
      }
      setImageFile(null);
      setError("");
    }
  }, [isOpen, mode, initialData, maxIndex]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error || "Invalid file");
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
        toast.error("Not authenticated");
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
        toast.success("Image uploaded to Cloudinary successfully");
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.image || !formData.name) {
      toast.error("Image and name are required");
      return;
    }

    onSubmit(formData);
    handleClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "index" ? parseInt(value) || 0 : value,
    }));
  };

  const handleClose = () => {
    setFormData({
      image: "",
      name: "",
      index: 0,
    });
    setImagePreview(null);
    setImageFile(null);
    setError("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold">
            {mode === "create"
              ? "Add Team Slider Item"
              : "Edit Team Slider Item"}
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
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Name / Image Alt Text*
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
                  htmlFor="image"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Image * (JPG, PNG, WEBP, GIF, AVIF – max 5MB)
                </label>
                <div className="relative w-full border border-gray-400 rounded-md cursor-pointer flex items-center px-3 overflow-hidden min-h-[200px]">
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
            <div className="flex justify-end gap-4 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={uploadingImage}
              >
                {mode === "create" ? "Add Item" : "Update Item"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateEditSliderModal;
