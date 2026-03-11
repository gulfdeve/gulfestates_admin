import { useEffect, useState } from "react";
import { UseFormRegister, UseFormSetValue, FieldErrors } from "react-hook-form";
import { PropertyFormData } from "./AddPropertyForm";
import Dropdown from "@/components/Dropdown";
import { AMENITIES } from "@/utils/amenities";

export default function PricingAndDetails({
  register,
  setValue,
  watch,
  errors,
}: {
  register: UseFormRegister<PropertyFormData>;
  setValue: UseFormSetValue<PropertyFormData>;
  watch: any;
  errors: FieldErrors<PropertyFormData>;
}) {
  const [showAmenitiesModal, setShowAmenitiesModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const INITIAL_AMENITIES_COUNT = 30;
  const displayedAmenities = AMENITIES.slice(0, INITIAL_AMENITIES_COUNT);
  
  // Watch category to determine which price field to show
  const category = watch("category");
  const isOffPlan = category === "Off Plan";
  const purpose = watch("purpose");
  const isRent = purpose === "Rent";

  useEffect(() => {
    if (!isRent) {
      setValue("rentDuration", undefined as any, { shouldValidate: true });
    }
  }, [isRent, setValue]);
  
  // Filter amenities based on search query
  const filteredAmenities = searchQuery.trim() === ""
    ? AMENITIES
    : AMENITIES.filter((amenity) =>
        amenity.toLowerCase().includes(searchQuery.toLowerCase())
      );
  return (
    <>
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Pricing */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Pricing</h2>

          {/* Show different price field based on category */}
          {isOffPlan ? (
            // OffPlan: Price From
            <div className="mb-4">
              <label className="block  font-medium text-gray-600 mb-1">
                Price From <span className="text-red-500">*</span>
              </label>
              <input
                {...register("startingPrice", { required: "Price From is required" })}
                type="text"
                placeholder="AED 1.1 Million"
                className={`w-full px-3 py-3 border rounded-md focus:outline-none ${
                  errors.startingPrice ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.startingPrice && (
                <p className="mt-1 text-sm text-red-500">{errors.startingPrice.message as string}</p>
              )}
            </div>
          ) : (
            // Property (Ready): Starting Price
            <div className="mb-4">
              <label className="block  font-medium text-gray-600 mb-1">
                Starting Price <span className="text-red-500">*</span>
              </label>
              <input
                {...register("startingPrice", { 
                  required: "Starting Price is required",
                  valueAsNumber: true,
                  validate: (value) => {
                    if (isNaN(Number(value)) || Number(value) <= 0) {
                      return "Starting Price must be a valid positive number";
                    }
                    return true;
                  }
                })}
                type="number"
                step="0.01"
                placeholder="e.g. 1100000"
                className={`w-full px-3 py-3 border rounded-md focus:outline-none ${
                  errors.startingPrice ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.startingPrice && (
                <p className="mt-1 text-sm text-red-500">{errors.startingPrice.message as string}</p>
              )}
            </div>
          )}

          {/* Payment Plan - Only for OffPlan (exists in OffPlan model) */}
          {isOffPlan && (
            <div className="mb-4">
              <label className="block  font-medium text-gray-600 mb-1">
                Payment Plan
              </label>
              <input
                {...register("paymentPlan")}
                type="text"
                placeholder="Installment (e.g. 60/40)"
                className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none "
              />
            </div>
          )}

          {isRent && (
            <div className="mb-4">
              <label className="block  font-medium text-gray-600 mb-1">
                Rent Duration <span className="text-red-500">*</span>
              </label>
              <Dropdown
                label="Select Duration"
                options={["Day", "Week", "Month", "3 Month", "6 Month", "Year", "5 Year"]}
                selected={watch("rentDuration") || ""}
                onSelect={(value) => setValue("rentDuration", value, { shouldValidate: true })}
              />
              <input
                type="hidden"
                {...register("rentDuration", {
                  validate: (value) => {
                    if (!isRent) return true;
                    return value ? true : "Rent duration is required";
                  }
                })}
              />
              {errors.rentDuration && (
                <p className="mt-1 text-sm text-red-500">{errors.rentDuration.message as string}</p>
              )}
            </div>
          )}
        </div>
        {/* Property Details */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Property Details</h2>

          {/* Property Type Details - Only for OffPlan (maps to propertyType in backend) */}
          {isOffPlan && (
            <div className="mb-4">
              <label className="block  font-medium text-gray-600 mb-1">
                Property Type
              </label>
              <input
                {...register("propertyTypeDetails")}
                type="text"
                placeholder="e.g. Luxury Apartment, Beach Villa, etc."
                className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none "
              />
            </div>
          )}

          {/* Bedrooms - Number for Property, Text for OffPlan */}
          <div className="mb-4">
            <label className="block  font-medium text-gray-600 mb-1">
              Bedrooms {isOffPlan ? "Range" : ""}
            </label>
            <input
              {...register("bedroomsOption")}
              type={isOffPlan ? "text" : "number"}
              placeholder={isOffPlan ? "e.g. 1BR / 2BR / 3BR / Penthouse" : "e.g. 1, 2, 3"}
              className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none "
            />
          </div>

          {/* Bathrooms - Number for Property, Text for OffPlan */}
          <div className="mb-4">
            <label className="block  font-medium text-gray-600 mb-1">
              Bathrooms {isOffPlan ? "Range" : ""}
            </label>
            <input
              {...register("bathrooms")}
              type={isOffPlan ? "text" : "number"}
              placeholder={isOffPlan ? "e.g. 1-2, 2-3" : "e.g. 1, 2, 3"}
              className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none "
            />
          </div>

          {/* Property Size - Text for both (allows "600" or "600 - 600" range) */}
          <div className="mb-4">
            <label className="block  font-medium text-gray-600 mb-1">
              Property Size {isOffPlan ? "Range" : ""}
            </label>
            <input
              {...register("propertySizeRange")}
              type="text"
              placeholder={isOffPlan ? "e.g. 500 - 2,500 sq ft" : "e.g. 1500 or 600 - 600"}
              className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none "
            />
          </div>

          {/* Service Charges - Only for OffPlan (maps to serviceCharges in OffPlan model) */}
          {isOffPlan && (
            <div className="mb-4">
              <label className="block  font-medium text-gray-600 mb-1">
                Service Charges
              </label>
              <input
                {...register("serviceChargesValue")}
                type="text"
                placeholder="5 AED per sq ft"
                className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none "
              />
            </div>
          )}

          <div className="mb-4">
            <label className="block font-medium text-gray-600 mb-1">
              Location
            </label>
            <input
              {...register("cityArea")}
              type="text"
              placeholder="Enter location (e.g. Jumeirah, Downtown, Marina)"
              className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none "
            />
          </div>

        </div>
      </div>

      {/* Amenities Section - Full Width */}
      <div className="w-full mb-6">
        <h2 className="text-2xl font-semibold mb-4">Amenities</h2>
        <div className="p-4 border border-gray-300 rounded-lg bg-gray-50">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {displayedAmenities.map((amenity, index) => {
              const currentAmenities = watch("amenities") || [];
              // Filter to only string values and check if amenity is included
              const stringAmenities = Array.isArray(currentAmenities)
                ? currentAmenities.filter((a: any) => typeof a === 'string' && a !== 'true' && a !== 'false')
                : [];
              const isChecked = stringAmenities.includes(amenity);
              
              return (
                <div key={index} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`amenity-${index}`}
                    checked={isChecked}
                    onChange={(e) => {
                      const currentAmenities = watch("amenities") || [];
                      // Filter out non-string values and boolean strings
                      const cleanAmenities = Array.isArray(currentAmenities)
                        ? currentAmenities.filter((a: any) => typeof a === 'string' && a !== 'true' && a !== 'false')
                        : [];
                      
                      let updatedAmenities: string[];
                      
                      if (e.target.checked) {
                        // Add amenity if not already present
                        if (!cleanAmenities.includes(amenity)) {
                          updatedAmenities = [...cleanAmenities, amenity];
                        } else {
                          updatedAmenities = cleanAmenities;
                        }
                      } else {
                        // Remove amenity
                        updatedAmenities = cleanAmenities.filter((a: string) => a !== amenity);
                      }
                      
                      setValue("amenities", updatedAmenities, { shouldValidate: true });
                    }}
                    className="w-4 h-4 cursor-pointer border-gray-300 rounded text-black focus:ring-black"
                  />
                  <label
                    className="ml-2 cursor-pointer text-gray-600 text-sm"
                    htmlFor={`amenity-${index}`}
                  >
                    {amenity}
                  </label>
                </div>
              );
            })}
          </div>
          {AMENITIES.length > INITIAL_AMENITIES_COUNT && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setShowAmenitiesModal(true)}
                className="text-primary cursor-pointer underline text-sm"
              >
                See More ({AMENITIES.length - INITIAL_AMENITIES_COUNT} more)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Amenities Modal */}
      {showAmenitiesModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowAmenitiesModal(false)}
        >
          <div 
            className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-semibold">All Amenities</h2>
              <button
                type="button"
                onClick={() => {
                  setShowAmenitiesModal(false);
                  setSearchQuery(""); // Reset search when closing modal
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            {/* Search Bar */}
            <div className="p-6 max-w-sm">
              <input
                type="text"
                placeholder="Search amenities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              {searchQuery && (
                <p className="mt-2 text-sm text-gray-500">
                  Found {filteredAmenities.length} amenit{filteredAmenities.length === 1 ? 'y' : 'ies'}
                </p>
              )}
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1">
              {filteredAmenities.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No amenities found matching "{searchQuery}"</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {filteredAmenities.map((amenity, index) => {
                  const currentAmenities = watch("amenities") || [];
                  // Filter to only string values and check if amenity is included
                  const stringAmenities = Array.isArray(currentAmenities)
                    ? currentAmenities.filter((a: any) => typeof a === 'string' && a !== 'true' && a !== 'false')
                    : [];
                  const isChecked = stringAmenities.includes(amenity);
                  
                  return (
                    <div key={index} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`modal-amenity-${index}`}
                        checked={isChecked}
                        onChange={(e) => {
                          const currentAmenities = watch("amenities") || [];
                          // Filter out non-string values and boolean strings
                          const cleanAmenities = Array.isArray(currentAmenities)
                            ? currentAmenities.filter((a: any) => typeof a === 'string' && a !== 'true' && a !== 'false')
                            : [];
                          
                          let updatedAmenities: string[];
                          
                          if (e.target.checked) {
                            // Add amenity if not already present
                            if (!cleanAmenities.includes(amenity)) {
                              updatedAmenities = [...cleanAmenities, amenity];
                            } else {
                              updatedAmenities = cleanAmenities;
                            }
                          } else {
                            // Remove amenity
                            updatedAmenities = cleanAmenities.filter((a: string) => a !== amenity);
                          }
                          
                          setValue("amenities", updatedAmenities, { shouldValidate: true });
                        }}
                        className="w-4 h-4 cursor-pointer border-gray-300 rounded text-black focus:ring-black"
                      />
                      <label
                        className="ml-2 cursor-pointer text-gray-600 text-sm"
                        htmlFor={`modal-amenity-${index}`}
                      >
                        {amenity}
                      </label>
                    </div>
                  );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end p-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  setShowAmenitiesModal(false);
                  setSearchQuery(""); // Reset search when closing modal
                }}
                className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors duration-200 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
