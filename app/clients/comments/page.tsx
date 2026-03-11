"use client";

import React, { useState, useEffect } from "react";
import CommentsTable from "@/components/clients/CommentsTable";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import RouteGuard from "@/components/auth/RouteGuard";
import LoadingSpinner from "@/components/common/LoadingSpinner";

export interface CommentData {
  _id: string;
  blog: { _id: string; title?: string; slug?: string };
  name: string;
  email: string;
  comment: string;
  approved: boolean;
  createdAt: string;
}

export default function CommentsPage() {
  const { isAuthenticated } = useAuth();
  const [comments, setComments] = useState<CommentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewComment, setViewComment] = useState<CommentData | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchComments();
    }
  }, [isAuthenticated]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");
      if (!token) {
        setError("Not authenticated");
        setLoading(false);
        return;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${API_URL}/api/comments`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.success && Array.isArray(data.data)) {
        setComments(data.data);
      } else {
        setError("Failed to load comments");
      }
    } catch (err) {
      setError("Error loading comments");
      console.error("Error fetching comments:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (commentId: string) => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        toast.error("Not authenticated");
        return;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${API_URL}/api/comments/${commentId}/approve`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Comment approved");
        setComments((prev) =>
          prev.map((c) =>
            c._id === commentId ? { ...c, approved: true } : c
          )
        );
      } else {
        toast.error(data.message || "Failed to approve comment");
      }
    } catch (err) {
      console.error("Error approving comment:", err);
      toast.error("Error approving comment");
    }
  };

  const handleBulkDelete = async (commentIds: string[]) => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        toast.error("Not authenticated");
        return;
      }
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      let successCount = 0;
      for (const id of commentIds) {
        const response = await fetch(`${API_URL}/api/comments/${id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const data = await response.json();
        if (data.success) {
          successCount++;
          setComments((prev) => prev.filter((c) => c._id !== id));
          if (viewComment && commentIds.includes(viewComment._id)) {
            setShowViewModal(false);
            setViewComment(null);
          }
        }
      }
      if (successCount > 0) toast.success(`${successCount} comment(s) deleted`);
      if (successCount < commentIds.length) toast.error(`Failed to delete ${commentIds.length - successCount} comment(s)`);
    } catch (err) {
      console.error("Error deleting comments:", err);
      toast.error("Error deleting comments");
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        toast.error("Not authenticated");
        return;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${API_URL}/api/comments/${commentId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Comment deleted");
        setComments((prev) => prev.filter((c) => c._id !== commentId));
        if (viewComment?._id === commentId) {
          setShowViewModal(false);
          setViewComment(null);
        }
      } else {
        toast.error(data.message || "Failed to delete comment");
      }
    } catch (err) {
      console.error("Error deleting comment:", err);
      toast.error("Error deleting comment");
    }
  };

  const handleView = (commentId: string) => {
    const comment = comments.find((c) => c._id === commentId);
    if (comment) {
      setViewComment(comment);
      setShowViewModal(true);
    }
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setViewComment(null);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "N/A";
    }
  };

  if (loading) {
    return (
      <RouteGuard>
        <div className="text-black/80">
          <p className="mb-1 text-sm">Clients / Blog Comments</p>
          <h1 className="font-semibold text-3xl">Blog Comments</h1>
          <div className="mt-4">
            <LoadingSpinner inline message="Loading comments..." />
          </div>
        </div>
      </RouteGuard>
    );
  }

  if (error) {
    return (
      <RouteGuard>
        <div className="text-black/80">
          <p className="mb-1 text-sm">Clients / Blog Comments</p>
          <h1 className="font-semibold text-3xl">Blog Comments</h1>
          <div className="mt-4 flex items-center justify-center py-12">
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </RouteGuard>
    );
  }

  return (
    <RouteGuard>
      <div className="text-black/80">
        <p className="mb-1 text-sm">Clients / Blog Comments</p>
        <h1 className="font-semibold text-3xl">Blog Comments</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage and approve comments submitted on blog posts
        </p>
        <div className="mt-4">
          <CommentsTable
            data={comments}
            onApprove={handleApprove}
            onDelete={handleDelete}
            onBulkDelete={handleBulkDelete}
            onView={handleView}
          />
        </div>

        {/* View Modal */}
        {showViewModal && viewComment && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={closeViewModal}
          >
            <div
              className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden border border-gray-100 max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-5 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center ring-4 ring-primary/20">
                      <span className="text-2xl font-bold text-primary">
                        {(viewComment.name || "?").charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        {viewComment.name}
                      </h2>
                      <p className="text-gray-600 text-sm">{viewComment.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        viewComment.approved
                          ? "bg-green-100 text-green-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {viewComment.approved ? "Approved" : "Pending"}
                    </span>
                    <button
                      onClick={closeViewModal}
                      aria-label="Close"
                      className="p-2 rounded-lg text-primary hover:text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="22"
                        height="22"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                <div className="p-4 rounded-lg bg-gray-50/80 border border-gray-100">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                    Blog Post
                  </p>
                  <p className="text-gray-900 font-medium">
                    {(viewComment.blog as any)?.title || "Unknown"}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-gray-50/80 border border-gray-100">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                    Comment
                  </p>
                  <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">
                    {viewComment.comment}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                  <p className="text-xs font-medium text-primary/80 uppercase tracking-wider mb-1">
                    Submitted
                  </p>
                  <p className="text-gray-900 font-medium">
                    {formatDate(viewComment.createdAt)}
                  </p>
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3">
                {!viewComment.approved && (
                  <button
                    onClick={() => {
                      handleApprove(viewComment._id);
                      setViewComment({ ...viewComment, approved: true });
                    }}
                    className="px-5 py-2.5 rounded-lg font-medium text-white bg-green-600 hover:bg-green-700 transition-colors"
                  >
                    Approve
                  </button>
                )}
                <button
                  onClick={() => handleDelete(viewComment._id)}
                  className="px-5 py-2.5 rounded-lg font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors"
                >
                  Delete
                </button>
                <button
                  onClick={closeViewModal}
                  className="px-5 py-2.5 rounded-lg font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
