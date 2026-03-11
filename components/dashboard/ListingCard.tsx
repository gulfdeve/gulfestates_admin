import Image from "next/image";
import React from "react";

interface ListingProps {
  property: {
    id: string | number;
    image: string;
    price: string;
    listedTime: string;
    location: string;
    beds: number;
    baths: number;
    area: string;
  };
}

function ListingCard({ property }: ListingProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="w-full h-[150px] rounded-md overflow-hidden">
        <Image
          src={property.image}
          alt="listing"
          width={400}
          height={300}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="flex justify-between items-center">
        <h6 className="font-semibold">{property.price}</h6>
        <p className="text-[8px] text-[#7E7E7E]">{property.listedTime}</p>
      </div>

      <p className="flex gap-1 text-xs font-light">
        <Image
          src="/icons/location.svg"
          alt="location"
          width={12}
          height={12}
        />
        {property.location}
      </p>

      <div className="flex flex-wrap items-center text-sm text-gray-700 gap-y-1">
        <div className="flex items-center pe-3">
          <div className="flex items-center gap-1 h-4">
            <Image src="/icons/bed.svg" alt="bed" width={12} height={12} />
            <p className="text-xs font-light">{property.beds} beds</p>
          </div>
        </div>

        <div className="flex items-center pe-3">
          <div className="flex items-center gap-1 h-4">
            <Image
              src="/icons/bath-tub.svg"
              alt="bath"
              width={12}
              height={12}
            />
            <p className="text-xs font-light">{property.baths} baths</p>
          </div>
        </div>

        <div className="flex items-center">
          <div className="flex items-center gap-1 h-5">
            <Image src="/icons/area.svg" alt="size" width={12} height={12} />
            <p className="text-xs font-light">{property.area}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ListingCard;
