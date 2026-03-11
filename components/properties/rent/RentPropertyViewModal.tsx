"use client";

import { sanitizeHtml } from "@/utils/htmlCleaner";

export type RentPropertyViewData = {
  title?: { en?: string; es?: string; fr?: string } | string;
  location?: { en?: string; es?: string; fr?: string } | string;
  type?: string;
  price?: number;
  rentDuration?: string;
  beds?: number;
  baths?: number;
  size?: number;
  description?: { en?: string; es?: string; fr?: string } | string;
};

interface RentPropertyViewModalProps {
  open: boolean;
  property: RentPropertyViewData | null;
  onClose: () => void;
  title?: string;
}

export default function RentPropertyViewModal({
  open,
  property,
  onClose,
  title = "Property Details (Rent)",
}: RentPropertyViewModalProps) {
  if (!open || !property) return null;

  const titleEn = typeof property.title === "string" ? property.title : property.title?.en;
  const titleEs = typeof property.title === "object" ? property.title?.es : undefined;
  const titleFr = typeof property.title === "object" ? property.title?.fr : undefined;
  const locationEn = typeof property.location === "string" ? property.location : property.location?.en;
  const descriptionEn =
    typeof property.description === "string"
      ? property.description
      : property.description?.en || (property.description as string);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white text-gray-800 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <strong>Title (EN):</strong> {titleEn || "N/A"}
          </div>
          {titleEs && (
            <div>
              <strong>Title (ES):</strong> {titleEs}
            </div>
          )}
          {titleFr && (
            <div>
              <strong>Title (FR):</strong> {titleFr}
            </div>
          )}
          <div>
            <strong>Location:</strong> {locationEn || (property.location as string) || "N/A"}
          </div>
          <div>
            <strong>Type:</strong> {property.type || "N/A"}
          </div>
          <div>
            <strong>Rent:</strong>{" "}
            {property.price ? `AED ${property.price.toLocaleString()}/year` : "N/A"}
          </div>
          {property.rentDuration && (
            <div>
              <strong>Rent Duration:</strong> {property.rentDuration}
            </div>
          )}
          <div>
            <strong>Beds:</strong> {property.beds ?? "N/A"}
          </div>
          <div>
            <strong>Baths:</strong> {property.baths ?? "N/A"}
          </div>
          <div>
            <strong>Size:</strong> {property.size ? `${property.size} sqft` : "N/A"}
          </div>
          {(descriptionEn || property.description) && (
            <div>
              <strong>Description:</strong>
              <div
                className="mt-1 prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{
                  __html: sanitizeHtml(descriptionEn || String(property.description) || "N/A"),
                }}
              />
            </div>
          )}
        </div>
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
