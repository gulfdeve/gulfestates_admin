"use client";
import AnalyticsCharts from "@/components/AnalyticsCharts";
import DashboardCard from "@/components/dashboard/DashboardCard";
import Image from "next/image";
import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import RouteGuard from "@/components/auth/RouteGuard";
import LoadingSpinner from "@/components/common/LoadingSpinner";

type Range = "Today" | "This Week" | "This Month" | "This Year";

interface AnalyticsData {
  cards: {
    visitors: number;
    leads: number;
    rate: number;
    emails: number;
  };
  visitorsData: Array<{
    day: string;
    visitors: number;
    leads: number;
  }>;
  conversionsData: Array<{
    source: string;
    conversions: number;
  }>;
}

export default function HomePageLeads() {
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Range>("Today");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch analytics when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchAnalytics(selected);
    }
  }, [isAuthenticated, selected]);

  const options: Range[] = ["Today", "This Week", "This Month", "This Year"];

  const handleSelect = (value: Range) => {
    setSelected(value);
    setOpen(false);
  };

  const fetchAnalytics = async (range: Range) => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("adminToken");
      const API_URL = process.env.NEXT_PUBLIC_API_URL;

      const response = await fetch(
        `${API_URL}/api/analytics/marketing?range=${range}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.message || "Failed to fetch analytics data");
      }
    } catch (err: any) {
      setError("Error fetching analytics data");
      console.error("Error fetching analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(selected);
  }, [selected]);

  // Default empty data structure
  const defaultData: AnalyticsData = {
    cards: {
      visitors: 0,
      leads: 0,
      rate: 0,
      emails: 0,
    },
    visitorsData: [],
    conversionsData: [],
  };

  const { cards, visitorsData, conversionsData } = data || defaultData;

  return (
    <RouteGuard>
      <div className="text-black/80 p-3">
      <p className="mb-1 text-sm">Marketing / Analytics Dashboard</p>

      <div className="flex justify-between items-center relative">
        <h1 className="font-semibold text-3xl">Analytics Dashboard</h1>

        {/* Dropdown */}
        <div className="relative">
          <button
            onClick={() => setOpen(!open)}
            className="w-28 py-2 bg-[#D9D9D999] rounded-full shadow-sm text-sm font-medium hover:bg-gray-200 flex justify-center cursor-pointer items-center gap-4"
          >
            {selected}
            <Image
              src="/icons/arrow-up.svg"
              width={12}
              height={12}
              alt="select time range"
              className="invert"
            />
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-md z-20">
              {options.map((option) => (
                <div
                  key={option}
                  onClick={() => handleSelect(option)}
                  className="px-4 py-2 cursor-pointer hover:bg-gray-100 text-sm"
                >
                  {option}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CARDS */}
      <div className="mt-4">
        {loading ? (
          <LoadingSpinner inline message="Loading analytics data..." />
        ) : error ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-red-500">{error}</p>
          </div>
        ) : (
          <>
            <div className="flex gap-3">
              <DashboardCard title="Total Visitors" value={cards.visitors} />
              <DashboardCard title="Leads Generated" value={cards.leads} />
              <DashboardCard title="Conversion Rate %" value={cards.rate} />
              <DashboardCard title="Emails Sent" value={cards.emails} />
            </div>

            {/* CHARTS */}
            <div className="mt-6">
              <AnalyticsCharts
                visitorsData={visitorsData}
                conversionsData={conversionsData}
              />
            </div>
          </>
        )}

        <div className="mt-6 flex gap-4">
          <div className="p-6 min-h-[200px] bg-white rounded-lg shadow-sm flex-1">
            <h4 className="font-semibold text-xl">Top Visitor Region</h4>
          </div>
          <div className="p-6 min-h-[200px] bg-white rounded-lg shadow-sm min-w-[400px]">
            <h4 className="font-semibold text-xl">Rent</h4>
          </div>
        </div>
      </div>
      </div>
    </RouteGuard>
  );
}
