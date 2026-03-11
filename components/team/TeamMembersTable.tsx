"use client";
import React from "react";
import { getDepartmentName } from "@/utils/departments";

interface TeamMember {
  _id: string;
  name: string;
  role: string;
  image: string;
  department: string;
}

interface TeamMembersTableProps {
  data: TeamMember[];
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const TeamMembersTable: React.FC<TeamMembersTableProps> = ({
  data,
  onEdit,
  onDelete,
}) => {
  if (data.length === 0) {
    return (
      <div className="w-full p-8 text-center border border-gray-200 rounded-lg bg-gray-50">
        <p className="text-gray-500">No team members found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="shadow-2xl w-full border-collapse bg-white rounded-lg overflow-hidden">
        <thead>
          <tr className="bg-primary text-white border-b border-gray-200">
            <th className="px-4 py-3 text-left text-sm font-semibold">
              Image
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold">
              Name
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold">
              Department
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold">
              Job Title
            </th>
            <th className="px-4 py-3 text-center text-sm font-semibold">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((member) => (
            <tr
              key={member._id}
              className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <td className="px-4 py-3">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center relative">
                  {member.image ? (
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : null}
                  {(!member.image || !member.image.trim()) && (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              </td>
              <td className="px-4 py-3 text-sm text-gray-900">{member.name}</td>
              <td className="px-4 py-3 text-sm text-gray-600">
                {getDepartmentName(member.department)}
              </td>
              <td className="px-4 py-3 text-sm text-gray-600">{member.role}</td>
              <td className="px-4 py-3">
                <div className="flex justify-center gap-2">
                  {onEdit && (
                    <button
                      onClick={() => onEdit(member._id)}
                      className="p-2 text-gray-600 rounded-md"
                      title="Edit"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => onDelete(member._id)}
                      className="p-2 text-gray-500"
                      title="Delete"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TeamMembersTable;
