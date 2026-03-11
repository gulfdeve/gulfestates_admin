"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import RouteGuard from "@/components/auth/RouteGuard";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import DeleteConfirmModal from "@/components/common/DeleteConfirmModal";

interface PageContent {
  _id: string;
  pageType: string;
  title: string;
  subtitle?: string;
  bannerType: "video" | "image";
  updatedAt: string;
}

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface PagesContentTableProps {
  locale: "en" | "fr" | "es";
}

export default function PagesContentTable({ locale }: PagesContentTableProps) {
  const { user, role, isAuthenticated, loading: authLoading } = useAuth();
  const [error, setError] = useState<string>("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [pageContents, setPageContents] = useState<PageContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  useEffect(() => {
    // Only fetch if authenticated and user is superadmin
    if (isAuthenticated && role === "superadmin") {
      fetchPageContents();
    } else if (!authLoading && (!isAuthenticated || role !== "superadmin")) {
      setError("Access denied. Superadmin privileges required.");
      setLoading(false);
    }
  }, [currentPage, isAuthenticated, role, authLoading, locale]);

  const fetchPageContents = async () => {
    try {
      setLoading(true);
      setError("");

      // Verify user is superadmin
      if (role !== "superadmin") {
        setError("Access denied. Superadmin privileges required.");
        setLoading(false);
        return;
      }

      const token = localStorage.getItem("adminToken");
      if (!token) {
        setError("Not authenticated");
        setLoading(false);
        return;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(
        `${API_URL}/api/pages/content?page=${currentPage}&limit=${pagination.limit}&locale=${locale}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 403) {
          setError("Access denied. Superadmin privileges required.");
        } else {
          setError(data.message || "Failed to load pages content");
        }
        setLoading(false);
        return;
      }

      if (data.success && data.data) {
        const transformedContents: PageContent[] = data.data.map(
          (content: any) => ({
            _id: content._id,
            pageType: content.pageType,
            title: content.title || "",
            subtitle: content.subtitle || undefined,
            bannerType: content.bannerType,
            updatedAt: content.updatedAt,
          })
        );
        setPageContents(transformedContents);
        if (data.pagination) {
          setPagination(data.pagination);
        }
      } else {
        setError("Failed to load pages content");
      }
    } catch (err: any) {
      setError("Error loading pages content");
      console.error("Error fetching pages content:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    // Verify user is superadmin
    if (role !== "superadmin") {
      toast.error("Access denied. Superadmin privileges required.");
      return;
    }

    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        toast.error("Not authenticated");
        return;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${API_URL}/api/pages/content/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success("Page content deleted");
        fetchPageContents();
      } else {
        toast.error(data.message || "Failed to delete page content");
      }
    } catch (err: any) {
      toast.error("Error deleting page content");
      console.error("Error deleting page content:", err);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "N/A";
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <RouteGuard>
      <div className="text-black/80">
        <p className="mb-1 text-sm">Dashboard / Pages / Content</p>
        <div className="flex items-center justify-between">
          <h1 className="font-semibold text-3xl">Pages Content</h1>
          <Link
            href={`/${locale}/pages/content/create`}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 font-medium"
          >
            <span className="text-lg">+</span>
            <span>Add Page Content</span>
          </Link>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="mt-8">
            <LoadingSpinner inline message="Loading pages content..." />
          </div>
        ) : (
          <>
            <div className="mt-4">
              <div className="relative w-full overflow-x-auto custom-scrollbar rounded-lg shadow-md">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-primary text-white">
                      <th className="px-6 py-4 text-left text-sm font-semibold">
                        Page Type
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">
                        Title ({locale.toUpperCase()})
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">
                        Subtitle ({locale.toUpperCase()})
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">
                        Banner Type
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">
                        Updated At
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageContents.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-6 py-8 text-center text-gray-500"
                        >
                          No pages content found
                        </td>
                      </tr>
                    ) : (
                      pageContents.map((content) => (
                        <tr
                          key={content._id}
                          className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4 text-sm text-gray-900">
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {content.pageType}
                            </span>
                          </td>
                          <td
                            className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate"
                            title={content.title}
                          >
                            {content.title}
                          </td>
                          <td
                            className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate"
                            title={content.subtitle}
                          >
                            {content.subtitle || "-"}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                content.bannerType === "video"
                                  ? "bg-purple-100 text-purple-800"
                                  : "bg-green-100 text-green-800"
                              }`}
                            >
                              {content.bannerType === "video"
                                ? "Video"
                                : "Image"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {formatDate(content.updatedAt)}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5">
                              <Link
                                href={`/${locale}/pages/content/edit/${content._id}`}
                                aria-label="Edit"
                                className="hover:opacity-70 transition-opacity"
                              >
                                <Image
                                  src="/icons/edit.svg"
                                  width={16}
                                  height={16}
                                  alt="edit"
                                  className="cursor-pointer"
                                />
                              </Link>
                              <button
                                onClick={() => setDeleteConfirmId(content._id)}
                                aria-label="Delete"
                                className="p-1 hover:bg-red-100 rounded transition-colors"
                                title="Delete"
                              >
                                <Image
                                  src="/icons/delete.svg"
                                  alt="Delete"
                                  width={18}
                                  height={18}
                                />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <DeleteConfirmModal
                isOpen={!!deleteConfirmId}
                title="Delete Page Content"
                message={`Are you sure you want to delete this page content (${locale.toUpperCase()} version)? This will only remove the ${locale.toUpperCase()} content, not other locales.`}
                onConfirm={() => {
                  if (deleteConfirmId) {
                    handleDelete(deleteConfirmId);
                    setDeleteConfirmId(null);
                  }
                }}
                onCancel={() => setDeleteConfirmId(null)}
              />
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {(currentPage - 1) * pagination.limit + 1} to{" "}
                  {Math.min(currentPage * pagination.limit, pagination.total)}{" "}
                  of {pagination.total} results
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from(
                      { length: pagination.totalPages },
                      (_, i) => i + 1
                    )
                      .filter((page) => {
                        // Show first page, last page, current page, and pages around current
                        return (
                          page === 1 ||
                          page === pagination.totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1)
                        );
                      })
                      .map((page, index, array) => {
                        // Add ellipsis if there's a gap
                        const showEllipsisBefore =
                          index > 0 && page - array[index - 1] > 1;
                        return (
                          <div key={page} className="flex items-center gap-1">
                            {showEllipsisBefore && (
                              <span className="px-2">...</span>
                            )}
                            <button
                              onClick={() => handlePageChange(page)}
                              className={`px-4 py-2 border rounded-lg transition-colors ${
                                currentPage === page
                                  ? "bg-primary text-white border-primary"
                                  : "border-gray-300 hover:bg-gray-50"
                              }`}
                            >
                              {page}
                            </button>
                          </div>
                        );
                      })}
                  </div>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === pagination.totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </RouteGuard>
  );
}
