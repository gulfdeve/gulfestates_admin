"use client";
import React from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

interface VisitorData {
  day: string;
  visitors: number;
  leads: number;
}

interface ConversionData {
  source: string;
  conversions: number;
}

interface AnalyticsChartsProps {
  visitorsData: VisitorData[];
  conversionsData: ConversionData[];
}

export default function AnalyticsCharts({
  visitorsData,
  conversionsData,
}: AnalyticsChartsProps) {
  // Calculate max values for dynamic Y-axis scaling
  const maxVisitors = Math.max(
    ...visitorsData.map((d) => Math.max(d.visitors, d.leads)),
    1
  );
  const maxConversions = Math.max(
    ...conversionsData.map((d) => d.conversions),
    1
  );

  // Generate Y-axis ticks based on max values
  const getVisitorTicks = () => {
    const step = Math.ceil(maxVisitors / 4);
    const ticks = [];
    for (let i = 0; i <= maxVisitors; i += step) {
      ticks.push(i);
    }
    return ticks.length > 0 ? ticks : [0, 1];
  };

  const getConversionTicks = () => {
    const step = Math.ceil(maxConversions / 4);
    const ticks = [];
    for (let i = 0; i <= maxConversions; i += step) {
      ticks.push(i);
    }
    return ticks.length > 0 ? ticks : [0, 1];
  };

  return (
    <div className="flex gap-4 bg-gray-50">
      {/* Visitors vs Leads Chart */}
      <div className="bg-white rounded-lg shadow-sm p-6 flex-1">
        <h2 className="text-lg font-semibold text-gray-700 mb-6">
          Visitors vs Leads
        </h2>
        {visitorsData.length === 0 ? (
          <div className="flex items-center justify-center h-[250px] text-gray-500">
            No data available for the selected period
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart
              data={visitorsData}
              margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#6b7280", fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#6b7280", fontSize: 12 }}
                ticks={getVisitorTicks()}
                domain={[0, maxVisitors * 1.1]}
              />
              <Line
                type="linear"
                dataKey="leads"
                stroke="#000000"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Conversions by Source Chart */}
      <div className="bg-white rounded-lg shadow-sm p-6 min-w-[400px]">
        <h2 className="text-lg font-semibold text-gray-700 mb-6">
          Conversions by Source
        </h2>
        {conversionsData.length === 0 ? (
          <div className="flex items-center justify-center h-[250px] text-gray-500">
            No data available for the selected period
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              data={conversionsData}
              margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="source"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#6b7280", fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#6b7280", fontSize: 12 }}
                ticks={getConversionTicks()}
                domain={[0, maxConversions * 1.1]}
              />
              <Bar dataKey="conversions" fill="#000000" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
