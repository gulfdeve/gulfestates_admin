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

  // Form fields - French (with English fallback)
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [slug, setSlug] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [seoSchema, setSeoSchema] = useState("");
  const [published, setPublished] = useState(false);

  // English fields (for reference/fallback)
  const [titleEn, setTitleEn] = useState("");
  const [excerptEn, setExcerptEn] = useState("");
  const [contentEn, setContentEn] = useState("");

  // Spanish fields (optional)
  const [titleEs, setTitleEs] = useState("");
  const [excerptEs, setExcerptEs] = useState("");
  const [contentEs, setContentEs] = useState("");

  const editorEs = useRef(null);

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

  // Fetch blog data on mount
  useEffect(() => {
    if (blogId) {
      fetchBlogData();
    }
  }, [blogId]);

  const fetchBlogData = async () => {
    try {
      setLoadingBlog(true);
      const token = localStorage.getItem("adminToken");
      if (!token) {
        toast.error("Non authentifié");
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
        // Load French content (with English fallback)
        setTitle(blog.languages?.fr?.title || blog.title || "");
        setExcerpt(blog.languages?.fr?.excerpt || blog.excerpt || "");
        setContent(blog.languages?.fr?.content || blog.content || "");

        // Load English for reference
        setTitleEn(blog.title || "");
        setExcerptEn(blog.excerpt || "");
        setContentEn(blog.content || "");

        // Load Spanish if available
        setTitleEs(blog.languages?.es?.title || "");
        setExcerptEs(blog.languages?.es?.excerpt || "");
        setContentEs(blog.languages?.es?.content || "");

        setCategory(blog.category || "");
        setTags(Array.isArray(blog.tags) ? blog.tags : []);
        setSlug(blog.slug || "");
        setSeoTitle(blog.seo?.title || "");
        setSeoDescription(blog.seo?.description || "");
        setSeoSchema(blog.seo?.schema || "");
        setPublished(blog.published || false);
        setImageUrl(blog.image || "");
        setImagePreview(blog.image || null);
      } else {
        toast.error("Échec du chargement des données du blog");
      }
    } catch (err: any) {
      toast.error("Erreur lors du chargement des données du blog");
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
      toast.error(validation.error || "Fichier non valide");
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
        toast.error("Non authentifié");
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
        toast.error("Échec du téléchargement de l'image");
      }
    } catch (err: any) {
      toast.error("Erreur lors du téléchargement de l'image");
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
    // Auto-generate slug if not manually set (use English title for slug)
    if (!slug || slug === generateSlug(titleEn || title)) {
      setSlug(generateSlug(titleEn || newTitle));
    }
    // Auto-generate SEO title if empty
    if (!seoTitle) {
      setSeoTitle(newTitle);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if ((!title && !titleEn) || (!content && !contentEn) || !imageUrl) {
      toast.error("Veuillez remplir tous les champs requis (Titre, Contenu, Image en vedette)");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");
      if (!token) {
        toast.error("Non authentifié");
        return;
      }

      const blogData = {
        title: titleEn, // Keep English title as default
        excerpt: excerptEn, // Keep English excerpt as default
        content: contentEn, // Keep English content as default
        image: imageUrl,
        slug: slug || generateSlug(titleEn || title),
        author: "Admin",
        date: new Date().toISOString(),
        tags,
        category: category || "General",
        featured: false,
        published,
        seo: {
          title: seoTitle || titleEn || title,
          description: seoDescription || excerptEn || excerpt || (titleEn || title).substring(0, 150),
          schema: seoSchema || undefined,
        },
        languages: {
          es: {
            title: titleEs || undefined,
            excerpt: excerptEs || undefined,
            content: contentEs || undefined,
          },
          fr: {
            title: title || undefined,
            excerpt: excerpt || undefined,
            content: content || undefined,
          },
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
        toast.success("Blog mis à jour avec succès!");
        setTimeout(() => {
          router.push("/fr/blogs/manage-blogs");
        }, 1500);
      } else {
        toast.error(data.message || "Échec de la mise à jour du blog");
      }
    } catch (err: any) {
      toast.error("Erreur lors de la mise à jour du blog");
      console.error("Blog update error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loadingBlog) {
    return (
      <RouteGuard>
        <div className="text-black/80">
        <p className="mb-1 text-sm">Blogs / Modifier le blog</p>
        <h1 className="font-semibold text-3xl">Modifier le blog</h1>
        <LoadingSpinner message="Chargement des données du blog..." />
      </div>
      </RouteGuard>
    );
  }

  return (
    <RouteGuard>
      <div className="text-black/80">
      <p className="mb-1 text-sm">Blogs / Modifier le blog</p>
      <h1 className="font-semibold text-3xl">Modifier le blog</h1>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
          {/* Blog Title */}
          <div className="flex flex-col gap-1">
            <label>Titre du blog *</label>
            <input
              type="text"
              value={title}
              onChange={handleTitleChange}
              required
              className="w-full px-3 py-2 border border-gray-400 rounded-md focus:outline-none"
              placeholder="Entrez le titre du blog"
            />
          </div>

          {/* Category */}
          <div className="flex flex-col gap-1">
            <label>Catégorie</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-400 rounded-md focus:outline-none"
              placeholder="Entrez la catégorie"
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
              placeholder="Généré automatiquement à partir du titre"
            />
          </div>

          {/* Tags */}
          <div className="flex flex-col gap-1">
            <label>Étiquettes (tapez et appuyez sur Entrée pour ajouter)</label>
            <TagInput
              tags={tags}
              onChange={setTags}
              placeholder="Tapez et appuyez sur Entrée pour ajouter une étiquette"
            />
          </div>

          {/* Featured Image */}
          <div className="flex flex-col gap-1">
            <label>Image en vedette *</label>
            <div className="relative w-full border border-gray-400 rounded-md cursor-pointer flex items-center px-3 overflow-hidden">
              {uploadingImage && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                  <p className="text-sm text-gray-600">Téléchargement...</p>
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
            <label>Statut</label>
            <div className="flex flex-col mt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  checked={published}
                  onChange={() => setPublished(true)}
                />
                Publier
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  checked={!published}
                  onChange={() => setPublished(false)}
                />
                Brouillon
              </label>
            </div>
          </div>
        </div>

        {/* Excerpt */}
        <div className="flex flex-col gap-1 my-4">
          <label>Extrait</label>
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-400 rounded-md focus:outline-none"
            placeholder="Brève description du blog"
          />
        </div>

        {/* SEO Section */}
        <div className="my-6 p-4 border border-gray-300 rounded-md bg-gray-50">
          <h3 className="font-semibold text-lg mb-4">Paramètres SEO</h3>
          <div className="grid grid-cols-1 gap-4">
            <div className="flex flex-col gap-1">
              <label>Titre SEO</label>
              <input
                type="text"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-400 rounded-md focus:outline-none"
                placeholder="Titre SEO pour les moteurs de recherche"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label>Description SEO</label>
              <textarea
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-400 rounded-md focus:outline-none"
                placeholder="Description SEO pour les moteurs de recherche"
              />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex flex-col gap-1">
              <label>Schéma SEO</label>
              <textarea
                value={seoSchema}
                onChange={(e) => setSeoSchema(e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border border-gray-400 rounded-md focus:outline-none"
                placeholder="Schéma JSON-LD (optionnel)"
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-1">
          <label htmlFor="content">Contenu *</label>
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
            {loading ? "Mise à jour..." : published ? "Mettre à jour et publier" : "Mettre à jour comme brouillon"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/fr/blogs/manage-blogs")}
            className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
          >
            Annuler
          </button>
        </div>
      </form>
      </div>
    </RouteGuard>
  );
}

