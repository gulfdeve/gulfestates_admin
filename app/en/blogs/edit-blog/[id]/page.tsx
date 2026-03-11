"use client";
import React, { useState, useRef, useEffect, useMemo } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import RouteGuard from "@/components/auth/RouteGuard";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { validateImageFile } from "@/utils/fileValidation";
import TagInput from "@/components/blogs/TagInput";

const JoditEditor = dynamic(() => import("jodit-react"), {
  ssr: false,
});

export default function EditBlog() {
  const router = useRouter();
  const params = useParams();
  const blogId = params.id as string;
  const { isAuthenticated } = useAuth();

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string>("");
  const editor = useRef(null);
  const [content, setContent] = useState("");

  const editorConfig = useMemo(
    () => ({
      readonly: false,
      height: 400,
      toolbar: true,
      uploader: {
        insertImageAsBase64URI: true,
      },
    }),
    []
  );

  // Form fields - English (default)
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [slug, setSlug] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [seoSchema, setSeoSchema] = useState("");
  const [published, setPublished] = useState(false);
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [loadingBlog, setLoadingBlog] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Fetch blog data when authenticated
  useEffect(() => {
    if (isAuthenticated && blogId) {
      fetchBlogData();
    }
  }, [isAuthenticated, blogId]);

  const fetchBlogData = async () => {
    try {
      setLoadingBlog(true);
      const token = localStorage.getItem("adminToken");
      if (!token) {
        toast.error("Not authenticated");
        setLoadingBlog(false);
        return;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${API_URL}/api/blogs/${blogId}?admin=true`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "x-admin-view": "true",
        },
      });

      const data = await response.json();

      if (data.success && data.data) {
        const blog = data.data;
        setTitle(blog.title || "");
        setExcerpt(blog.excerpt || "");
        setCategory(blog.category || "");
        setTags(Array.isArray(blog.tags) ? blog.tags : []);
        setSlug(blog.slug || "");
        setSeoTitle(blog.seo?.title || "");
        setSeoDescription(blog.seo?.description || "");
        setSeoSchema(blog.seo?.schema || "");
        setPublished(blog.published || false);
        setContent(blog.content || "");
        setImageUrl(blog.image || "");
        setImagePreview(blog.image || null);
      } else {
        toast.error("Failed to load blog data");
      }
    } catch (err: any) {
      toast.error("Error loading blog data");
      console.error("Error fetching blog:", err);
    } finally {
      setLoadingBlog(false);
    }
  };

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

    // Auto-upload image
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
        setImageUrl(data.data.url);
      } else {
        toast.error("Failed to upload image");
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
    setImageUrl("");
  };

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    // Auto-generate slug if not manually set
    if (!slug || slug === generateSlug(title)) {
      setSlug(generateSlug(newTitle));
    }
    // Auto-generate SEO title if empty
    if (!seoTitle) {
      setSeoTitle(newTitle);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !content || !imageUrl) {
      toast.error("Please fill in all required fields (Title, Content, Featured Image)");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");
      if (!token) {
        toast.error("Not authenticated");
        return;
      }

      const blogData = {
        title,
        excerpt: excerpt || title.substring(0, 150),
        content,
        image: imageUrl,
        slug: slug || generateSlug(title),
        author: "Admin",
        date: new Date().toISOString(),
        tags,
        category: category || "General",
        featured: false,
        published,
        seo: {
          title: seoTitle || title,
          description: seoDescription || excerpt || title.substring(0, 150),
          schema: seoSchema || undefined,
        },
      };

      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${API_URL}/api/blogs/${blogId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(blogData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Blog updated successfully!");
        setTimeout(() => {
          router.push("/en/blogs/manage-blogs");
        }, 1500);
      } else {
        toast.error(data.message || "Failed to update blog");
      }
    } catch (err: any) {
      toast.error("Error updating blog");
      console.error("Blog update error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loadingBlog) {
    return (
      <RouteGuard>
      <div className="text-black/80">
        <p className="mb-1 text-sm">Blogs / Edit Blog</p>
        <h1 className="font-semibold text-3xl">Edit Blog</h1>
        <LoadingSpinner message="Loading blog data..." />
      </div>
      </RouteGuard>
    );
  }

  return (
    <RouteGuard>
      <div className="text-black/80">
      <p className="mb-1 text-sm">Blogs / Edit Blog</p>
      <h1 className="font-semibold text-3xl">Edit Blog</h1>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
          {/* Blog Title */}
          <div className="flex flex-col gap-1">
            <label>Blog Title *</label>
            <input
              type="text"
              value={title}
              onChange={handleTitleChange}
              required
              className="w-full px-3 py-2 border border-gray-400 rounded-md focus:outline-none"
              placeholder="Enter blog title"
            />
          </div>

          {/* Category */}
          <div className="flex flex-col gap-1">
            <label>Category</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-400 rounded-md focus:outline-none"
              placeholder="Enter category"
            />
          </div>

          {/* Slug */}
          <div className="flex flex-col gap-1">
            <label>Slug</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full px-3 py-2 border border-gray-400 rounded-md focus:outline-none"
              placeholder="Auto-generated from title"
            />
          </div>

          {/* Tags */}
          <div className="flex flex-col gap-1">
            <label>Tags (type and press Enter to add)</label>
            <TagInput
              tags={tags}
              onChange={setTags}
              placeholder="Type and press Enter to add tag"
            />
          </div>

          {/* Featured Image */}
          <div className="flex flex-col gap-1">
            <label>Featured Image *</label>
            <div className="relative w-full border border-gray-400 rounded-md cursor-pointer flex items-center px-3 overflow-hidden">
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
                <div className="text-gray-400 py-2">
                  <Image
                    src="/icons/upload-photo.png"
                    alt="Upload Icon"
                    width={28}
                    height={28}
                    className="opacity-50"
                  />
                </div>
              )}

              {/* Invisible input */}
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                onChange={handleImageChange}
                className="absolute inset-0 w-full opacity-0 cursor-pointer"
              />
            </div>
          </div>

          {/* Status */}
          <div className="flex flex-col">
            <label>Status</label>
            <div className="flex flex-col mt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  checked={published}
                  onChange={() => setPublished(true)}
                />
                Publish
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  checked={!published}
                  onChange={() => setPublished(false)}
                />
                Draft
              </label>
            </div>
          </div>
        </div>

        {/* Excerpt */}
        <div className="flex flex-col gap-1 my-4">
          <label>Excerpt</label>
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-400 rounded-md focus:outline-none"
            placeholder="Brief description of the blog"
          />
        </div>

        {/* SEO Section */}
        <div className="my-6 p-4 border border-gray-300 rounded-md bg-gray-50">
          <h3 className="font-semibold text-lg mb-4">SEO Settings</h3>
          <div className="grid grid-cols-1 gap-4">
            <div className="flex flex-col gap-1">
              <label>SEO Title</label>
              <input
                type="text"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-400 rounded-md focus:outline-none"
                placeholder="SEO title for search engines"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label>SEO Description</label>
              <textarea
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-400 rounded-md focus:outline-none"
                placeholder="SEO description for search engines"
              />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex flex-col gap-1">
              <label>SEO Schema</label>
              <textarea
                value={seoSchema}
                onChange={(e) => setSeoSchema(e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border border-gray-400 rounded-md focus:outline-none"
                placeholder="JSON-LD Schema (optional)"
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-1">
          <label htmlFor="content">Content *</label>
          <JoditEditor
            ref={editor}
            value={content}
            onBlur={(newContent) => setContent(newContent)}
            onChange={(newContent) => setContent(newContent)}
            config={editorConfig}
          />
        </div>

        {/* Submit Button */}
        <div className="mt-6 flex gap-4">
          <button
            type="submit"
            disabled={loading || uploadingImage}
            className="px-6 py-2 bg-primary text-white rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Updating..." : published ? "Update & Publish" : "Update as Draft"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/en/blogs/manage-blogs")}
            className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </form>
      </div>
    </RouteGuard>
  );
}

