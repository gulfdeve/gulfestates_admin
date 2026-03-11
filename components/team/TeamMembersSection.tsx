"use client";
import React, { useState, useEffect } from "react";
import TeamMembersTable from "./TeamMembersTable";
import CreateEditMemberModal from "./CreateEditMemberModal";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import DeleteConfirmModal from "@/components/common/DeleteConfirmModal";
import { toast } from "sonner";

interface TeamMember {
  _id: string;
  name: string;
  role: string;
  image: string;
  department: string;
}

const TeamMembersSection: React.FC = () => {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${API_URL}/api/team/members`);

      const data = await response.json();

      if (data.success && data.data) {
        setMembers(data.data || []);
      } else {
        toast.error(data.message || "Failed to load members");
      }
    } catch (err: any) {
      console.error("Error fetching members:", err);
      toast.error("Error loading members");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMember = async (memberData: {
    name: string;
    role: string;
    image: string;
    department: string;
  }) => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        throw new Error("Not authenticated");
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${API_URL}/api/team/members`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(memberData),
      });

      const data = await response.json();

      if (data.success) {
        await fetchMembers();
        setShowMemberModal(false);
      } else {
        throw new Error(data.message || "Failed to create member");
      }
    } catch (err: any) {
      throw err;
    }
  };

  const handleUpdateMember = async (memberData: {
    name: string;
    role: string;
    image: string;
    department: string;
  }) => {
    if (!editingMember) return;

    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        throw new Error("Not authenticated");
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(
        `${API_URL}/api/team/members/${editingMember._id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(memberData),
        }
      );

      const data = await response.json();

      if (data.success) {
        await fetchMembers();
        setShowMemberModal(false);
        setEditingMember(null);
      } else {
        throw new Error(data.message || "Failed to update member");
      }
    } catch (err: any) {
      throw err;
    }
  };

  const handleDeleteMember = (memberId: string) => {
    setDeleteConfirmId(memberId);
  };

  const confirmDeleteMember = async () => {
    if (!deleteConfirmId) return;

    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        toast.error("Not authenticated");
        setDeleteConfirmId(null);
        return;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${API_URL}/api/team/members/${deleteConfirmId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.success) {
        await fetchMembers();
        toast.success("Member deleted successfully");
      } else {
        toast.error(data.message || "Failed to delete member");
      }
    } catch (err: any) {
      console.error("Error deleting member:", err);
      toast.error("Error deleting member");
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const handleEditMember = (memberId: string) => {
    const member = members.find((m) => m._id === memberId);
    if (member) {
      setEditingMember(member);
      setShowMemberModal(true);
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold mb-4">Team Members Table</h2>
        <button
          type="button"
          onClick={() => {
            setEditingMember(null);
            setShowMemberModal(true);
          }}
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors text-sm"
        >
          + Add New Member
        </button>
      </div>

      {loading ? (
        <LoadingSpinner inline size="sm" />
      ) : (
        <TeamMembersTable
          data={members}
          onEdit={handleEditMember}
          onDelete={handleDeleteMember}
        />
      )}

      <CreateEditMemberModal
        isOpen={showMemberModal}
        onClose={() => {
          setShowMemberModal(false);
          setEditingMember(null);
        }}
        onSubmit={editingMember ? handleUpdateMember : handleCreateMember}
        mode={editingMember ? "edit" : "create"}
        initialData={
          editingMember
            ? {
                name: editingMember.name,
                role: editingMember.role,
                image: editingMember.image,
                department: editingMember.department,
              }
            : null
        }
      />

      <DeleteConfirmModal
        isOpen={!!deleteConfirmId}
        title="Delete Team Member"
        message="Are you sure you want to delete this team member? This action cannot be undone."
        onConfirm={confirmDeleteMember}
        onCancel={() => setDeleteConfirmId(null)}
      />
    </div>
  );
};

export default TeamMembersSection;
