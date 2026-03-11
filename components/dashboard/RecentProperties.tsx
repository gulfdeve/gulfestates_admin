"use client";
import Link from "next/link";
import React from "react";

type Property = {
  id: string;
  image: string;
  title: string;
  location: string;
  price: string;
  status?: string;
};

interface RecentPropertiesProps {
  properties?: Property[];
}

const RecentProperties: React.FC<RecentPropertiesProps> = ({ properties = [] }) => {
  return (
    <div className="antialiased text-gray-900 bg-gray-100">
      <div className="bg-white rounded-[14px] shadow-sm overflow-hidden">
        <div className="px-4 pt-6 pb-3">
          <h2 className="text-2xl font-semibold mb-6">Recent Properties</h2>
          {properties.length > 0 ? (
            <div className="overflow-x-auto custom-scrollbar">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-8 py-4 text-left text-sm font-semibold text-gray-800">
                      Image
                    </th>
                    <th className="px-8 py-4 text-left text-sm font-semibold text-gray-800">
                      Title
                    </th>
                    <th className="px-8 py-4 text-left text-sm font-semibold text-gray-800">
                      Location
                    </th>
                    <th className="px-8 py-4 text-left text-sm font-semibold text-gray-800">
                      Price
                    </th>
                    <th className="px-8 py-4 text-left text-sm font-semibold text-gray-800">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {properties.map((property) => (
                    <tr key={property.id}>
                      <td className="px-3 py-2">
                        <img
                          className="h-[60px] w-[90px] rounded-md object-cover"
                          src={property.image || "/images/data.jpg"}
                          alt={property.title}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src =
                              "https://placehold.co/100x65/f0f0f0/AAAAAA?text=Error";
                          }}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {property.title}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {property.location}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {property.price}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {property.status || "Available"}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center py-4 text-gray-500 text-sm">No recent properties</p>
          )}
        </div>
        <div className="bg-white text-center pb-3">
          <Link
            href="/en/properties/buy"
            className="text-secondary hover:text-secondary/80 underline text-sm font-medium"
          >
            View All
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RecentProperties;
