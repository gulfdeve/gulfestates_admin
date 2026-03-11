"use client";
import EmailCampaignForm from "@/components/EmailCampaignForm";
import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import EmailsSentTable from "@/components/EmailsSentTable";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import RouteGuard from "@/components/auth/RouteGuard";
import LoadingSpinner from "@/components/common/LoadingSpinner";

interface EmailsSentData {
  id: string;
  campaignId?: string;
  email: string;
  audience: string;
  title: string;
  status: string;
  sentDate: string;
}

export default function EmailMarketingPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [campaigns, setCampaigns] = useState<EmailsSentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch campaigns when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchCampaigns();
    }
  }, [isAuthenticated]);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("adminToken");
      if (!token) {
        setError("Not authenticated");
        setLoading(false);
        return;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${API_URL}/api/email-marketing`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.success && data.data) {
        // Transform data to match EmailsSentData interface
        const transformedCampaigns: EmailsSentData[] = data.data.map(
          (campaign: any) => ({
            id: campaign.id || campaign.campaignId,
            campaignId: campaign.campaignId,
            email: campaign.email,
            audience: campaign.audience,
            title: campaign.title,
            status: campaign.status,
            sentDate: campaign.sentDate
              ? new Date(campaign.sentDate).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })
              : "N/A",
          })
        );
        setCampaigns(transformedCampaigns);
      } else {
        setError(data.message || "Failed to load campaigns");
      }
    } catch (err: any) {
      console.error("Error fetching campaigns:", err);
      setError("Error loading campaigns");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (campaignId: string) => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        setError("Not authenticated");
        return;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(
        `${API_URL}/api/email-marketing/${campaignId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success("Campaign deleted");
        fetchCampaigns();
      } else {
        toast.error(data.message || "Failed to delete campaign");
      }
    } catch (err: any) {
      console.error("Error deleting campaign:", err);
      toast.error("Error deleting campaign. Please try again.");
    }
  };

  return (
    <RouteGuard>
      <div className="text-black/80">
        <p className="mb-1 text-sm">Marketing / Email Marketing</p>
        <h1 className="font-semibold text-3xl">Email Marketing</h1>
        <div className="mt-4">
          <EmailCampaignForm />
        </div>
        <div className="my-6">
          <h2 className="font-semibold text-3xl mb-2">Sent Campaigns</h2>
          {loading ? (
            <LoadingSpinner inline message="Loading campaigns..." />
          ) : error ? (
            <div className="p-4 text-center text-red-500">{error}</div>
          ) : campaigns.length > 0 ? (
            <EmailsSentTable data={campaigns} onDelete={handleDelete} />
          ) : (
            <div className="p-4 text-center text-gray-500">
              No campaigns sent yet
            </div>
          )}
        </div>
      </div>
    </RouteGuard>
  );
}
