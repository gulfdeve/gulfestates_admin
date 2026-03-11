"use client";
import React, { useState, useEffect } from "react";
import UsersTable from "@/components/users/UsersTable";
import CreateEditUserModal from "@/components/users/CreateEditUserModal";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import RouteGuard from "@/components/auth/RouteGuard";
import LoadingSpinner from "@/components/common/LoadingSpinner";

interface UserData {
  id: string;
  _id?: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  createdAt?: string;
  lastLogin?: string;
}

export default function UsersPage() {
  const router = useRouter();
  const { role: userRole, isAuthenticated } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUsers();
    }
  }, [currentPage, isAuthenticated]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");
      if (!token) {
        setError("Not authenticated");
        setLoading(false);
        router.push("/en");
        return;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(
        `${API_URL}/api/admins?page=${currentPage}&limit=20`,
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
          setError("Access denied. Admin privileges required.");
        } else {
          setError(data.message || "Failed to load users");
        }
        setLoading(false);
        return;
      }

      if (data.success && data.data?.items) {
        const transformedUsers: UserData[] = data.data.items.map((user: any) => ({
          id: user._id || user.id || "",
          _id: user._id || user.id,
          name: user.name || "",
          email: user.email || "",
          phone: user.phone || "",
          role: user.role || "user",
          createdAt: user.createdAt,
          lastLogin: user.lastLogin,
        }));
        setUsers(transformedUsers);
        setTotalPages(data.data.pagination?.totalPages || 1);
      } else {
        setError("Failed to load users");
      }
    } catch (err: any) {
      setError("Error loading users");
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (userId: string) => {
    const user = users.find((u) => u.id === userId || u._id === userId);
    if (user) {
      setEditingUser(user);
      setShowEditModal(true);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleCreateUser = async (formData: any) => {
    setCreating(true);
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        throw new Error("Not authenticated");
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${API_URL}/api/admins`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to create user");
      }

      // Refresh users list
      fetchUsers();
    } catch (err: any) {
      throw err;
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateUser = async (formData: any) => {
    if (!editingUser) return;

    setCreating(true);
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        throw new Error("Not authenticated");
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const userId = editingUser._id || editingUser.id;
      
      // Remove password if empty (don't update password)
      const updateData = { ...formData };
      if (!updateData.password) {
        delete updateData.password;
      }

      const response = await fetch(`${API_URL}/api/admins/${userId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to update user");
      }

      // Refresh users list
      fetchUsers();
      setShowEditModal(false);
      setEditingUser(null);
    } catch (err: any) {
      throw err;
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <RouteGuard>
        <div className="text-black/80">
          <p className="mb-1 text-sm">Users</p>
          <h1 className="font-semibold text-3xl">Users</h1>
          <LoadingSpinner message="Loading users..." />
        </div>
      </RouteGuard>
    );
  }

  return (
    <RouteGuard>
      <div className="text-black/80">
      <div className="flex justify-between items-center mb-4">
        <h1 className="font-semibold text-3xl">Users</h1>
        {userRole === "superadmin" && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
          >
            + Create User
          </button>
        )}
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <div className="mt-4">
        <UsersTable
          data={users}
          onEdit={handleEdit}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>

      {/* Create User Modal */}
      <CreateEditUserModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateUser}
        mode="create"
        loading={creating}
      />

      {/* Edit User Modal */}
      {editingUser && (
        <CreateEditUserModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingUser(null);
          }}
          onSubmit={handleUpdateUser}
          mode="edit"
          loading={creating}
          initialData={{
            name: editingUser.name,
            email: editingUser.email,
            phone: editingUser.phone || "",
            role: editingUser.role,
          }}
        />
      )}
      </div>
    </RouteGuard>
  );
}
