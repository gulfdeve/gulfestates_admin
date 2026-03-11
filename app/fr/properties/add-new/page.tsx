"use client";
import AddPropertyForm from "@/components/properties/add-new/AddPropertyForm";
import RouteGuard from "@/components/auth/RouteGuard";

export default function Page() {
  return (
    <RouteGuard>
      <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-6">
        <AddPropertyForm lang="fr" />
      </div>
      </div>
    </RouteGuard>
  );
}
