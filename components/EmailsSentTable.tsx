"use client";
import React, { useState } from "react";
import Image from "next/image";

// Types
interface EmailsSentData {
  id: string;
  campaignId?: string;
  email: string;
  audience: string;
  title: string;
  status: string;
  sentDate: string;
}

interface EmailsSentTableProps {
  data: EmailsSentData[];
  onDelete?: (campaignId: string) => void;
}

const EmailsSentTable: React.FC<EmailsSentTableProps> = ({
  data,
  onDelete,
}) => {
  const [deleteConfirmCampaign, setDeleteConfirmCampaign] = useState<string | null>(null);

  const handleDeleteClick = (campaignId: string) => {
    setDeleteConfirmCampaign(campaignId);
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmCampaign) {
      onDelete?.(deleteConfirmCampaign);
      setDeleteConfirmCampaign(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmCampaign(null);
  };

  // Group by campaignId to show unique campaigns with recipient count
  const campaignsMap = data.reduce(
    (
      acc: {
        [key: string]: {
          campaign: EmailsSentData;
          recipientCount: number;
          recipients: string[];
        };
      },
      item
    ) => {
      const campaignId = item.campaignId || item.id.split("-")[0];
      if (!acc[campaignId]) {
        acc[campaignId] = {
          campaign: { ...item, campaignId },
          recipientCount: 1,
          recipients: [item.email],
        };
      } else {
        acc[campaignId].recipientCount += 1;
        if (!acc[campaignId].recipients.includes(item.email)) {
          acc[campaignId].recipients.push(item.email);
        }
      }
      return acc;
    },
    {}
  );

  const campaignsList = Object.values(campaignsMap);

  return (
    <div className="relative w-full overflow-x-auto rounded-lg shadow-md">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-primary text-white">
            <th className="px-4 py-4 text-left text-sm font-semibold">
              Campaign ID
            </th>
            <th className="px-4 py-4 text-left text-sm font-semibold">
              Recipients
            </th>
            <th className="px-4 py-4 text-left text-sm font-semibold">
              Audience
            </th>
            <th className="px-4 py-4 text-left text-sm font-semibold">Title</th>
            <th className="px-4 py-4 text-left text-sm font-semibold">
              Status
            </th>
            <th className="px-4 py-4 text-left text-sm font-semibold">
              Sent Date
            </th>
            <th className="px-4 py-4 text-left text-sm font-semibold">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {campaignsList.map((campaignData) => {
            const campaign = campaignData.campaign;
            const campaignId = campaign.campaignId || campaign.id.split("-")[0];
            return (
              <tr
                key={campaign.id}
                className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <td className="px-4 py-4 text-sm text-gray-900">
                  {campaignId.substring(0, 8)}...
                </td>
                <td className="px-4 py-4 text-sm text-gray-900">
                  {campaignData.recipientCount} recipient(s)
                </td>
                <td className="px-4 py-4 text-sm text-gray-900">
                  {campaign.audience}
                </td>
                <td className="px-4 py-4 text-sm text-gray-900">
                  {campaign.title}
                </td>
                <td className="px-4 py-4 text-sm text-gray-900">
                  {campaign.status}
                </td>
                <td className="px-4 py-4 text-sm text-gray-900">
                  {campaign.sentDate}
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-1.5">
                    <button
                      aria-label="Delete"
                      onClick={() => handleDeleteClick(campaignId)}
                      className="hover:opacity-70 transition-opacity"
                    >
                      <Image
                        src="/icons/delete.svg"
                        width={16}
                        height={16}
                        alt="delete"
                        className="cursor-pointer"
                      />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Delete confirmation popup */}
      {deleteConfirmCampaign && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={handleCancelDelete}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden border border-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-14 h-14 rounded-full bg-amber-500/10 flex items-center justify-center ring-4 ring-amber-500/20">
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900">Delete Campaign</h3>
                  <p className="text-amber-700/80 text-sm font-medium mt-0.5">This action cannot be undone</p>
                </div>
                <button
                  onClick={handleCancelDelete}
                  aria-label="Close"
                  className="flex-shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-5">
              <p className="text-gray-600 leading-relaxed">
                Are you sure you want to delete this campaign? This will permanently remove all email records associated with it.
              </p>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={handleCancelDelete}
                className="px-5 py-2.5 rounded-lg font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 rounded-lg font-medium text-white bg-red-600 hover:bg-red-700 transition-colors shadow-sm"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailsSentTable;
