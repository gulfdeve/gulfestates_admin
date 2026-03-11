"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import * as Yup from "yup";
import { validateImageFile, validateVideoFile } from "@/utils/fileValidation";

const PAGE_TYPES = [
  { name: "Home", value: "home" },
  { name: "Off plan", value: "offplan" },
  { name: "Properties", value: "properties" },
  { name: "Buy", value: "buy" },
  { name: "Rent", value: "rent" },
  { name: "Blogs", value: "blogs" },
  { name: "About", value: "about" },
  { name: "Our Team", value: "ourteam" },
  { name: "Contact", value: "contact" },
  { name: "Privacy", value: "privacy" },
  { name: "Terms", value: "terms" },
  { name: "Careers", value: "careers" },
];

interface FormValues {
  pageType: string;
  title: string;
  subtitle: string;
  bannerType: "image" | "video";
  bannerUrl: string;
}

interface PageContentFormProps {
  locale: "en" | "fr" | "es";
}

const validationSchema = Yup.object().shape({
  pageType: Yup.string().required("Page Type is required"),
  title: Yup.string(),
  subtitle: Yup.string(),
  bannerType: Yup.string().oneOf(["image", "video"]).required("Banner Type is required"),
  bannerUrl: Yup.string().when("bannerType", {
    is: (val: string) => val === "image" || val === "video",
    then: (schema) => schema.required("Banner media is required"),
    otherwise: (schema) => schema,
  }),
});

export default function PageContentForm({ locale }: PageContentFormProps) {
  const router = useRouter();
  const params = useParams();
  const isEditMode = params?.id !== undefined;
  const contentId = params?.id as string;

  // Form values (only for current locale)
  const [formValues, setFormValues] = useState<FormValues>({
    pageType: "",
    title: "",
    subtitle: "",
    bannerType: "image",
    bannerUrl: "",
  });

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Media upload states
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [actualMediaType, setActualMediaType] = useState<"image" | "video" | null>(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  // UI states
  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch data if in edit mode
  useEffect(() => {
    if (isEditMode && contentId) {
      fetchContentData();
    }
  }, [isEditMode, contentId, locale]);

  const fetchContentData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");
      if (!token) {
        toast.error("Not authenticated");
        return;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${API_URL}/api/pages/content/${contentId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.success && data.data) {
        const content = data.data;
        setFormValues({
          pageType: content.pageType || "",
          title: content.title || "",
          subtitle: content.subtitle || "",
          bannerType: content.bannerType || "image",
          bannerUrl: content.bannerUrl || "",
        });
        if (content.bannerUrl) {
          setMediaPreview(content.bannerUrl);
          const isVideoUrl = content.bannerUrl.match(/\.(mp4|webm|ogg|mov|quicktime)/i);
          setActualMediaType(isVideoUrl ? "video" : "image");
        }
      } else {
        toast.error("Failed to load content data");
      }
    } catch (err: any) {
      toast.error("Error loading content data");
      console.error("Error fetching content:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleMediaChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    let validation;
    if (formValues.bannerType === "image") {
      const imageValidation = validateImageFile(file);
      if (!imageValidation.valid) {
        toast.error(imageValidation.error || "Invalid image file");
        e.target.value = "";
        return;
      }
      if (file.size > 3 * 1024 * 1024) {
        toast.error(`Image size exceeds 3MB. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
        e.target.value = "";
        return;
      }
    } else {
      const videoValidation = validateVideoFile(file);
      if (!videoValidation.valid) {
        toast.error(videoValidation.error || "Invalid video file");
        e.target.value = "";
        return;
      }
    }

    setMediaFile(file);

    // Detect actual media type from file
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    const detectedType = isImage ? "image" : isVideo ? "video" : formValues.bannerType;
    setActualMediaType(detectedType);

    // Create preview
    const previewURL = URL.createObjectURL(file);
    setMediaPreview(previewURL);

    // Auto-upload media
    await uploadMedia(file);
  };

  const uploadMedia = async (file: File) => {
    try {
      setUploadingMedia(true);
      const token = localStorage.getItem("adminToken");
      if (!token) {
        toast.error("Not authenticated");
        return;
      }

      const formData = new FormData();
      const isImage = file.type.startsWith("image/");
      formData.append(isImage ? "image" : "video", file);

      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const endpoint = isImage ? "/api/upload/image" : "/api/upload/video";
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (data.success && data.data?.url) {
        setFormValues((prev) => ({ ...prev, bannerUrl: data.data.url }));
        // Clear error for bannerUrl
        if (errors.bannerUrl) {
          setErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors.bannerUrl;
            return newErrors;
          });
        }
      } else {
        toast.error("Failed to upload media");
      }
    } catch (err: any) {
      toast.error("Error uploading media");
      console.error("Media upload error:", err);
    } finally {
      setUploadingMedia(false);
    }
  };

  const removeMedia = () => {
    setMediaPreview(null);
    setMediaFile(null);
    setFormValues((prev) => ({ ...prev, bannerUrl: "" }));
    setActualMediaType(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      // Validate with Yup
      await validationSchema.validate(formValues, { abortEarly: false });
      
      setLoading(true);
      const token = localStorage.getItem("adminToken");
      if (!token) {
        toast.error("Not authenticated");
        return;
      }

      // Each locale has its own document - create/edit only affects this locale
      const contentData = isEditMode
        ? {
            pageType: formValues.pageType,
            title: formValues.title || "",
            subtitle: formValues.subtitle || "",
            bannerType: formValues.bannerType,
            bannerUrl: formValues.bannerUrl,
          }
        : {
            pageType: formValues.pageType,
            locale,
            title: formValues.title || "",
            subtitle: formValues.subtitle || "",
            bannerType: formValues.bannerType,
            bannerUrl: formValues.bannerUrl,
          };

      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const url = isEditMode
        ? `${API_URL}/api/pages/content/${contentId}`
        : `${API_URL}/api/pages/content`;
      const method = isEditMode ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(contentData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(isEditMode ? "Page content updated successfully" : "Page content created successfully");
        setTimeout(() => {
          router.push(`/${locale}/pages/content`);
        }, 1500);
      } else {
        toast.error(data.message || "Failed to save page content");
      }
    } catch (err: any) {
      if (err.inner) {
        // Yup validation errors
        const validationErrors: Record<string, string> = {};
        err.inner.forEach((error: Yup.ValidationError) => {
          if (error.path) {
            validationErrors[error.path] = error.message;
          }
        });
        setErrors(validationErrors);
      } else {
        toast.error("Error saving page content");
        console.error("Save error:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="text-black/80">
      <p className="mb-1 text-sm">Dashboard / Pages / Content / {isEditMode ? "Edit" : "Create"}</p>
      <h1 className="font-semibold text-4xl">{isEditMode ? "Hero Banner Edit" : "Hero Banner Create"}</h1>
      <p className="mt-2 text-gray-600 max-w-md">
        Upload, preview, and update the main banner displayed on the website ({locale.toUpperCase()})
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6 max-w-7xl mx-auto">
        <h2 className="text-xl font-semibold mb-4">Banner Media Selection</h2>

        {/* Page Type */}
        <div className="max-w-[250px]">
          <div className="space-y-4">
            <div>
              <label className="block mb-1">Page Type *</label>
              <select
                name="pageType"
                value={formValues.pageType}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 outline-0 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Page Type</option>
                {PAGE_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.name}
                  </option>
                ))}
              </select>
              {errors.pageType && (
                <div className="text-red-500 text-sm mt-1">{errors.pageType}</div>
              )}
            </div>
          </div>
        </div>

        {/* Title and Subtitle (Current locale only) */}
        <div>
          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block mb-1">Title ({locale.toUpperCase()})</label>
              <input
                type="text"
                name="title"
                placeholder={`Enter title in ${locale === "en" ? "English" : locale === "fr" ? "French" : "Spanish"}`}
                value={formValues.title}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 outline-0 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.title && (
                <div className="text-red-500 text-sm mt-1">{errors.title}</div>
              )}
            </div>

            {/* Subtitle */}
            <div>
              <label className="block mb-1">Subtitle ({locale.toUpperCase()})</label>
              <input
                type="text"
                name="subtitle"
                placeholder={`Enter subtitle in ${locale === "en" ? "English" : locale === "fr" ? "French" : "Spanish"}`}
                value={formValues.subtitle}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 outline-0 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.subtitle && (
                <div className="text-red-500 text-sm mt-1">{errors.subtitle}</div>
              )}
            </div>
          </div>
        </div>

        {/* Banner Media Selection */}
        <div className="p-3">
          {/* Banner Type Selection */}
          <div className="mb-4">
            <select
              name="bannerType"
              value={formValues.bannerType}
              onChange={(e) => {
                handleChange(e);
                removeMedia();
              }}
              className="w-full max-w-[180px] outline-none"
            >
              <option value="image">Upload New Image</option>
              <option value="video">Upload New Video</option>
            </select>
            {errors.bannerType && (
              <div className="text-red-500 text-sm mt-1">{errors.bannerType}</div>
            )}
          </div>

          {/* Upload Section */}
          <div className="mt-4">
            <div className="relative max-w-md w-full border border-gray-400 rounded-md cursor-pointer flex items-center justify-center px-3 overflow-hidden min-h-[200px] bg-gray-50 hover:bg-gray-100 transition-colors">
              {uploadingMedia && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                  <p className="text-sm text-gray-600">Uploading...</p>
                </div>
              )}
              {mediaPreview ? (
                <div className="w-full h-full flex items-center justify-center">
                  {(actualMediaType === "video" || formValues.bannerType === "video") ? (
                    <video
                      src={mediaPreview}
                      controls
                      autoPlay
                      muted
                      loop
                      className="w-full h-auto max-h-[300px] object-contain"
                    />
                  ) : (
                    <img
                      src={mediaPreview}
                      alt="Preview"
                      className="w-full h-auto max-h-[300px] object-contain"
                    />
                  )}
                </div>
              ) : (
                <div className="text-gray-400 py-2 w-full text-center">
                  <Image
                    src="/icons/upload-photo.png"
                    alt="Upload Icon"
                    width={48}
                    height={48}
                    className="opacity-50 mx-auto mb-2"
                  />
                  <p className="mt-2 text-sm">Upload/Drag And Drop</p>
                  <p className="text-xs mt-1">
                    {formValues.bannerType === "image"
                      ? "JPG, PNG, WebP, AVIF (max 3MB). Executables blocked."
                      : "MP4, WebM, OGG, QuickTime (max 10MB). Executables blocked."}
                  </p>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept={
                  formValues.bannerType === "image"
                    ? "image/jpeg,image/jpg,image/png,image/webp,image/avif"
                    : "video/mp4,video/webm,video/ogg,video/quicktime"
                }
                onChange={handleMediaChange}
                className="absolute inset-0 w-full opacity-0 cursor-pointer"
              />
            </div>
            {errors.bannerUrl && (
              <div className="text-red-500 text-sm mt-1">{errors.bannerUrl}</div>
            )}
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-4 pt-4">
          <button
            type="button"
            onClick={() => router.push(`/${locale}/pages/content`)}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || uploadingMedia}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Saving..." : isEditMode ? "Update Content" : "Create Content"}
          </button>
        </div>
      </form>
    </div>
  );
}
