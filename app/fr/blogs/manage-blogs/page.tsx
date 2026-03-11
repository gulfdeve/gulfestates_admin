"use client";
import React, { useState, useEffect } from "react";
import BlogTable from "@/components/blogs/BlogTable";
import { useRouter } from "next/navigation";
import { sanitizeHtml } from "@/utils/htmlCleaner";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import RouteGuard from "@/components/auth/RouteGuard";
import LoadingSpinner from "@/components/common/LoadingSpinner";

interface BlogData {
  _id?: string;
  id: string;
  title: string;
  title_es?: string;
  title_fr?: string;
  category: string;
  dateCreated: string;
  published?: boolean;
}

export default function ManageBlogs() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewBlog, setViewBlog] = useState<any>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Fetch blogs when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchBlogs();
    }
  }, [isAuthenticated]);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");
      if (!token) {
        setError("Non authentifié");
        setLoading(false);
        return;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      // Fetch all blogs for admin (without locale filtering), then filter on frontend
      const response = await fetch(`${API_URL}/api/blogs?page=1&limit=1000&admin=true`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "x-admin-view": "true",
        },
      });

      const data = await response.json();

      if (data.success && data.data?.items) {
        // Get all blogs to find English counterparts
        const allBlogs = data.data.items;

        // Filter to only show French blogs
        // A blog is French if the main title matches languages.fr.title (meaning it was created from French page)
        const frenchBlogs = allBlogs.filter((blog: any) => {
          const mainTitle = blog.title?.trim();
          const frenchTitle = blog.languages?.fr?.title?.trim();

          // Must have both main title and French title
          if (!mainTitle || !frenchTitle) {
            return false;
          }

          // Include if main title matches French title (it's a French blog)
          if (mainTitle === frenchTitle) {
            return true;
          }

          // Exclude everything else
          return false;
        });

        // Transform data to match BlogTable format
        const transformedBlogs: any[] = frenchBlogs.map((blog: any) => {
          const frenchTitle = blog.languages?.fr?.title?.trim();
          const mainTitle = blog.title?.trim();

          // Find English title: Match by title - find English blog that has this French title in languages.fr.title
          let englishTitle = "-"; // Default to "-" if not found

          // The French blog's mainTitle IS the French title
          // Find an English blog where languages.fr.title matches the French blog's title
          const englishBlog = allBlogs.find((b: any) => {
            if (!b || !b.title) return false;
            const bMainTitle = b.title?.trim();
            const bFrenchTitle = b.languages?.fr?.title?.trim();
            const bSpanishTitle = b.languages?.es?.title?.trim();
            // It's an English blog if title doesn't match French or Spanish
            const isEnglish = bMainTitle &&
              bMainTitle !== bFrenchTitle &&
              bMainTitle !== bSpanishTitle;
            // Check if this English blog has the French blog's title in its languages.fr.title
            return isEnglish && bFrenchTitle && bFrenchTitle === mainTitle;
          });

          if (englishBlog && englishBlog.title) {
            englishTitle = englishBlog.title.trim();
          } else if (blog.languages?.en?.title) {
            englishTitle = blog.languages.en.title.trim();
          }

          return {
            _id: blog._id || blog.id,
            id: blog._id || blog.id,
            title: englishTitle, // English title for Title (EN) column
            title_es: blog.languages?.es?.title,
            title_fr: frenchTitle || mainTitle, // French title for Title (FR) column
            category: blog.category || blog.tags?.[0] || "General",
            dateCreated: blog.createdAt
              ? (() => {
                const date = new Date(blog.createdAt);
                const month = date.toLocaleDateString("en-US", { month: "short" });
                const day = date.getDate();
                const year = date.getFullYear();
                const time = date.toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true
                });
                return `${month} ${day}, ${year}, ${time}`;
              })()
              : blog.date || "N/A",
            slug: blog.slug,
            published: blog.published || false,
            image: blog.image,
            excerpt: blog.excerpt,
            languages: blog.languages,
          };
        });
        setBlogs(transformedBlogs);
      } else {
        setError("Échec du chargement des blogs");
      }
    } catch (err: any) {
      setError("Erreur lors du chargement des blogs");
      console.error("Error fetching blogs:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (blogId: string) => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        setError("Non authentifié");
        return;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${API_URL}/api/blogs/${blogId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Blog supprimé avec succès");
        // Remove blog from list
        setBlogs(blogs.filter((blog) => blog._id !== blogId));
      } else {
        toast.error(data.message || "Échec de la suppression du blog");
      }
    } catch (err: any) {
      console.error("Error deleting blog:", err);
      toast.error("Erreur lors de la suppression du blog");
    }
  };

  const handleBulkDelete = async (ids: string[]) => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        setError("Non authentifié");
        return;
      }
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const results = await Promise.allSettled(
        ids.map((id) =>
          fetch(`${API_URL}/api/blogs/${id}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }).then((res) => res.json())
        )
      );
      const successCount = results.filter(
        (r) => r.status === "fulfilled" && r.value?.success
      ).length;
      const failCount = ids.length - successCount;
      if (successCount > 0) {
        toast.success(`${successCount} blog${successCount > 1 ? "s" : ""} supprimé${successCount > 1 ? "s" : ""} avec succès`);
        setBlogs(blogs.filter((blog) => !ids.includes(blog._id || blog.id)));
      }
      if (failCount > 0) {
        toast.error(`Échec de la suppression de ${failCount} blog${failCount > 1 ? "s" : ""}`);
      }
      setSelectedIds([]);
    } catch (err: any) {
      console.error("Error bulk deleting blogs:", err);
      toast.error("Erreur lors de la suppression des blogs");
    }
  };

  const handleEdit = (blogId: string) => {
    router.push(`/fr/blogs/edit-blog/${blogId}`);
  };

  const handleView = async (blogId: string) => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        toast.error("Non authentifié");
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
        setViewBlog(blog);
        setShowViewModal(true);
      } else {
        toast.error(data.message || "Échec du chargement du blog");
      }
    } catch (err: any) {
      console.error("Error fetching blog:", err);
      toast.error("Erreur lors du chargement du blog");
    }
  };

  if (loading) {
    return (
      <RouteGuard>
        <div className="text-black/80">
          <p className="mb-1 text-sm">Blogs / Gérer les blogs</p>
          <h1 className="font-semibold text-3xl">Gérer les blogs</h1>
          <LoadingSpinner message="Chargement des blogs..." />
        </div>
      </RouteGuard>
    );
  }

  return (
    <RouteGuard>
      <div className="text-black/80">
      <p className="mb-1 text-sm">Blogs / Gérer les blogs</p>
      <h1 className="font-semibold text-3xl">Gérer les blogs</h1>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <div className="mt-4">
        <BlogTable
          data={blogs}
          lang="fr"
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={handleView}
          onBulkDelete={handleBulkDelete}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
        />
      </div>

      {/* View Blog Modal */}
      {showViewModal && viewBlog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => {
            setShowViewModal(false);
            setViewBlog(null);
          }}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-3xl w-full overflow-hidden border border-gray-100 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-b border-gray-100">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center ring-4 ring-primary/20 overflow-hidden">
                  {viewBlog.image ? (
                    <img src={viewBlog.image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold text-primary">
                      {(viewBlog.languages?.fr?.title || viewBlog.title || "?").charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold text-gray-900 truncate">
                    {viewBlog.languages?.fr?.title || viewBlog.title || "—"}
                  </h2>
                  <p className="text-gray-600 text-sm mt-0.5">
                    {viewBlog.category || "General"} • {viewBlog.author || "Admin"}
                  </p>
                  <span
                    className={`inline-flex mt-2 rounded-full px-3 py-1 text-xs font-medium ${
                      viewBlog.published ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {viewBlog.published ? "Publié" : "Brouillon"}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setViewBlog(null);
                  }}
                  aria-label="Close"
                  className="flex-shrink-0 p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Body - scrollable */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {viewBlog.image && (
                <div className="mb-4">
                  <img
                    src={viewBlog.image}
                    alt={viewBlog.languages?.fr?.title || viewBlog.title}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                </div>
              )}

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Titre</label>
                <p className="text-lg font-semibold text-gray-900">
                  {viewBlog.languages?.fr?.title || viewBlog.title}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Catégorie</label>
                  <p className="text-gray-900">{viewBlog.category || "General"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Statut</label>
                  <p>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${viewBlog.published
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                        }`}
                    >
                      {viewBlog.published ? "Publié" : "Brouillon"}
                    </span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Auteur</label>
                  <p className="text-gray-900">{viewBlog.author || "Admin"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Date</label>
                  <p className="text-gray-900">
                    {viewBlog.date
                      ? new Date(viewBlog.date).toLocaleDateString("fr-FR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                      : viewBlog.createdAt
                        ? new Date(viewBlog.createdAt).toLocaleDateString("fr-FR", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                        : "N/A"}
                  </p>
                </div>
              </div>

              {viewBlog.slug && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Slug</label>
                  <p className="text-gray-900 font-mono text-sm">{viewBlog.slug}</p>
                </div>
              )}

              {(viewBlog.languages?.fr?.excerpt || viewBlog.excerpt) && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Extrait</label>
                  <p className="text-gray-900">{viewBlog.languages?.fr?.excerpt || viewBlog.excerpt}</p>
                </div>
              )}

              {viewBlog.tags && viewBlog.tags.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Étiquettes</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {viewBlog.tags.map((tag: string, index: number) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {viewBlog.seo && (
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Paramètres SEO</h3>
                  {viewBlog.seo.title && (
                    <div className="mb-2">
                      <label className="text-sm font-medium text-gray-600">Titre SEO</label>
                      <p className="text-gray-900">{viewBlog.seo.title}</p>
                    </div>
                  )}
                  {viewBlog.seo.description && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Description SEO</label>
                      <p className="text-gray-900">{viewBlog.seo.description}</p>
                    </div>
                  )}
                </div>
              )}

              {(viewBlog.languages?.fr?.content || viewBlog.content) && (
                <div className="border-t pt-4">
                  <label className="text-sm font-medium text-gray-600">Contenu</label>
                  <div
                    className="text-gray-900 mt-2 prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(viewBlog.languages?.fr?.content || viewBlog.content) }}
                  />
                </div>
              )}
            </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setViewBlog(null);
                }}
                className="px-5 py-2.5 rounded-lg font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </RouteGuard>
  );
}
