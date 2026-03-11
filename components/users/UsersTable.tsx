import Image from "next/image";
import React from "react";

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

interface UsersTableProps {
  data: UserData[];
  onEdit?: (id: string) => void;
  // onDelete removed - delete functionality not needed
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const UsersTable: React.FC<UsersTableProps> = ({ 
  data, 
  onEdit, 
  // onDelete removed - delete functionality not needed
  currentPage,
  totalPages,
  onPageChange 
}) => {
  const getShortId = (id: string) => {
    if (!id) return "N/A";
    return `#${id.slice(-8)}`;
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'superadmin':
        return 'bg-purple-100 text-purple-800';
      case 'admin':
        return 'bg-blue-100 text-blue-800';
      case 'marketing':
        return 'bg-green-100 text-green-800';
      case 'user':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      const month = date.toLocaleDateString("en-US", { month: "short" });
      const day = date.getDate();
      const year = date.getFullYear();
      const time = date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true
      });
      return `${month} ${day}, ${year}, ${time}`;
    } catch {
      return dateString;
    }
  };

  const handleEdit = (user: UserData) => {
    if (onEdit) {
      onEdit(user._id || user.id);
    }
  };

  // handleDelete removed - delete functionality not needed

  if (data.length === 0) {
    return (
      <div className="w-full p-8 text-center border border-gray-200 rounded-lg">
        <p className="text-gray-500">No users found.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="w-full overflow-x-auto rounded-lg">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-primary text-white">
              <th className="px-6 py-4 text-left text-sm font-semibold">
                User ID
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold">
                Name
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold">
                Email
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold">
                Phone
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold">
                Role
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold">
                Created At
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold">
                Last Login
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {data.map((user, index) => (
              <tr
                key={`${user.id || user._id}-${index}`}
                className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <td className="px-6 py-4 text-sm text-gray-900">
                  {getShortId(user._id || user.id)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {user.name}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {user.email}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {user.phone || "N/A"}
                </td>
                <td className="px-6 py-4 text-sm">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}
                  >
                    {user.role || 'user'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {formatDate(user.createdAt)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {formatDate(user.lastLogin)}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5">
                    {onEdit && (
                      <button
                        onClick={() => handleEdit(user)}
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
                      </button>
                    )}
                    {/* Delete button removed - delete functionality not needed */}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded-md border ${
                currentPage === 1
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-white text-gray-700 hover:bg-gray-50 border-gray-300"
              }`}
            >
              Previous
            </button>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`px-4 py-2 rounded-md border ${
                currentPage === totalPages
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-white text-gray-700 hover:bg-gray-50 border-gray-300"
              }`}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersTable;
