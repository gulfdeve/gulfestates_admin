"use client";

import { usePathname } from "next/navigation";
import PropertiesNavbar from "@/components/properties/PropertiesNavbar";
import { Suspense } from "react";
import LoadingSpinner from "@/components/common/LoadingSpinner";

export default function PropertiesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Hide navbar + filters on /properties/add-new
  const isAddNewPage = pathname === "/es/properties/add-new";

  return (
    <div className="min-h-screen px-6 py-4">
      {!isAddNewPage && (
        <>
          <Suspense fallback={<LoadingSpinner inline message="Cargando navegación..." />}>
            <PropertiesNavbar />
          </Suspense>
        </>
      )}

      <div>{children}</div>
    </div>
  );
}
