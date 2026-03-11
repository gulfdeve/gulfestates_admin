"use client";
import AddPropertyForm from "@/components/properties/add-new/AddPropertyForm";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import RouteGuard from "@/components/auth/RouteGuard";

function EditPageContent() {
  const searchParams = useSearchParams();
  const propertyId = searchParams.get("id");

    return (
    <RouteGuard>
      <div className="min-h-screen">
        <div className="max-w-7xl mx-auto px-6">
          <AddPropertyForm lang="es" propertyId={propertyId || undefined} />
        </div>
      </div>
    </RouteGuard>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<LoadingSpinner fullPage message="Cargando..." />}>
      <EditPageContent />
    </Suspense>
  );
}
