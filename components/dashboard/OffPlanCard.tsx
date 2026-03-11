"use client";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";

interface Property {
  id: string | number;
  title?: string;
  name_en?: string;
  name_es?: string;
  name_fr?: string;
  location: string;
  developer: string;
  type: string;
  handover: string;
  priceFrom: string;
  paymentPlan?: string;
  bedRange?: string;
  bathRange?: string;
  sizeRange?: string;
  image: string;
}

interface OffPlanCardProps {
  property: Property;
  isDashbaordView?: boolean;
}

export default function OffPlanCard({ property, isDashbaordView = false }: OffPlanCardProps) {
  const params = useParams() as { locale?: string };
  const locale = params.locale || "en";
  
  // Get title based on locale or fallback
  const getTitle = () => {
    if (property.title) return property.title;
    if (locale === "es" && property.name_es) return property.name_es;
    if (locale === "fr" && property.name_fr) return property.name_fr;
    return property.name_en || "Property";
  };
  
  const title = getTitle();
  const altText = title || "Property image";

  return (
    <div className="container">
      <Link href={isDashbaordView ? `https://gulfestates.ae/${locale}/off-plan/${property.id}` : `/${locale}/off-plan/${property.id}`}>
        <div className="bg-white text-black/70 cursor-pointer rounded-lg w-full">
          {/* Image Section */}
          <div className="h-40 rounded-t-lg overflow-hidden bg-gray-200">
            <Image
              src={property.image || "/images/data.jpg"}
              alt={altText}
              width={400}
              height={300}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Details Section */}
          <div className="px-3 py-2">
            <h6 className="font-bold" title={title}>
              {title}
            </h6>
            <p
              className="text-sm font-light line-clamp-2"
              title={property.location}
            >
              {property.location}
            </p>

            <p className="font-light text-sm">
              <span className="font-semibold">Developer: </span>
              {property.developer}
            </p>
            <p className="font-light text-sm">
              <span className="font-semibold">Type: </span>
              {property.type}
            </p>
            <p className="font-light text-sm">
              <span className="font-semibold">Handover Date: </span>
              {property.handover}
            </p>
            <p className="font-light text-sm">
              <span className="font-semibold">Price From: </span>
              {property.priceFrom}
            </p>
            {property.paymentPlan && (
              <p className="font-light text-sm">
                <span className="font-semibold">Payment Plan: </span>
                {property.paymentPlan}
              </p>
            )}

            {/* Bed / Bath / Size Info */}
            {(property.bedRange || property.bathRange || property.sizeRange) && (
              <div className="flex flex-wrap items-center text-sm text-gray-700 mt-3 gap-y-2">
                {property.bedRange && (
                  <div className="flex items-center pe-3">
                    <div className="flex items-center gap-1 border-r-2 pr-2 h-4">
                      <Image
                        src="/icons/bed.svg"
                        alt="bed"
                        width={12}
                        height={12}
                      />
                      <p className="text-sm">{property.bedRange}</p>
                    </div>
                  </div>
                )}

                {property.bathRange && (
                  <div className="flex items-center pe-3">
                    <div className="flex items-center gap-1 border-r-2 pr-2 h-4">
                      <Image
                        src="/icons/bath-tub.svg"
                        alt="bath"
                        width={12}
                        height={12}
                      />
                      <p className="text-sm">{property.bathRange}</p>
                    </div>
                  </div>
                )}

                {property.sizeRange && (
                  <div className="flex items-center">
                    <div className="flex items-center gap-1 h-5">
                      <Image
                        src="/icons/area.svg"
                        alt="size"
                        width={12}
                        height={12}
                      />
                      <p className="text-sm">{property.sizeRange}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
