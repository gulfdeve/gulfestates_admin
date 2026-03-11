"use client";

import React from "react";
import Image from "next/image";

interface DashboardCardProps {
  title: string;
  value: number | string;
}

export default function DashboardCard({ title, value }: DashboardCardProps) {
  // Format numbers with commas
  const formattedValue =
    typeof value === "number" ? value.toLocaleString("en-US") : value;

  return (
    <div className="relative w-[250px] h-[140px] rounded-[14px] overflow-hidden text-white/90">
      <Image
        src="/images/bg-blue-grad.jpg"
        alt="background"
        fill
        className="object-cover"
      />
      <div className="absolute inset-0 flex flex-col py-6 px-4">
        <p className="text-lg font-semibold leading-tight h-12">{title}</p>
        <p className="font-semibold mt-2 text-4xl">{formattedValue}</p>
      </div>
    </div>
  );
}
