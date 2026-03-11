"use client";

import { usePathname } from "next/navigation";
import PropertiesNavbar from "@/components/properties/PropertiesNavbar";
import { Suspense } from "react";
import path from "path";
import LoadingSpinner from "@/components/common/LoadingSpinner";

export default function PropertiesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isAddNewPage =
    pathname === "/en/properties/add-new" || pathname === "/en/properties/edit";

  return (
    <div className="min-h-screen px-6 py-4">
      {!isAddNewPage && (
        <>
          <Suspense fallback={<LoadingSpinner inline message="Loading navigation..." />}>
            <PropertiesNavbar />
          </Suspense>
        </>
      )}

      <div>{children}</div>
    </div>
  );
}
