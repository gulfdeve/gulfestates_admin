"use client";
import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { UseFormRegister, UseFormSetValue, FieldErrors } from "react-hook-form";
import { PropertyFormData } from "./AddPropertyForm";
import Dropdown from "@/components/Dropdown";
import dynamic from "next/dynamic";
import { validateDocumentFile, validateQRImage } from "@/utils/fileValidation";
import { COMMUNITY_CATEGORIES } from "@/utils/communityCategories";

const JoditEditor = dynamic(() => import("jodit-react"), {
  ssr: false,
});

interface Props {
  lang?: "en" | "es" | "fr";
  register: UseFormRegister<PropertyFormData>;
  handleMainImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleAdditionalImagesChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  mainImagePreview: string | null;
  additionalImagesPreviews: string[];
  setValue: UseFormSetValue<PropertyFormData>;
  watch: any;
  handleSingleFileChange: (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "brochure" | "qrImage"
  ) => void;
  fileNames: {
    brochure: string;
    qrImage: string;
  };
  handleRemoveMainImage: () => void;
  handleRemoveAdditionalImage: (index: number) => void;
  errors: FieldErrors<PropertyFormData>;
}

export default function BasicInformation({
  lang = "en",
  register,
  handleMainImageChange,
  handleAdditionalImagesChange,
  mainImagePreview,
  additionalImagesPreviews,
  setValue,
  watch,
  handleSingleFileChange,
  handleRemoveMainImage,
  handleRemoveAdditionalImage,
  fileNames,
  errors,
}: Props) {
  const editor = useRef(null);
  const [content, setContent] = useState("");
  
  // Watch category to conditionally show/hide fields
  const category = watch("category");
  const isOffPlan = category === "Off Plan";

  // Get register handlers for brochure and qrImage to properly combine onChange handlers
  const brochureRegister = register("brochure", {
    required: false,
    validate: (value) => {
      if (value && value instanceof FileList && value.length > 0) {
        const file = value[0];
        const validation = validateDocumentFile(file);
        if (!validation.valid) {
          return validation.error || "Invalid PDF file";
        }
      }
      return true;
    }
  });

  const qrImageRegister = register("qrImage", {
    required: false,
    validate: (value) => {
      if (value && value instanceof FileList && value.length > 0) {
        const file = value[0];
        const validation = validateQRImage(file);
        if (!validation.valid) {
          return validation.error || "Invalid image file";
        }
      }
      return true;
    }
  });

  const imageRegister = register("image", {
    required: false, // Handle validation manually
    validate: (value) => {
      const formValue = watch("image");
      const hasFileInValue = value && value instanceof FileList && value.length > 0;
      const hasFileInForm = formValue && formValue instanceof FileList && formValue.length > 0;
      if (hasFileInValue || hasFileInForm) {
        return true;
      }
      if (mainImagePreview) {
        return true;
      }
      return "Main image is required";
    }
  });

  const imagesRegister = register("images");
  
  // Sync JoditEditor content with form
  useEffect(() => {
    const description = watch("description");
    if (description && description !== content) {
      setContent(description);
    }
  }, [watch("description")]);
  
  // Update form when editor content changes
  const handleEditorBlur = (newContent: string) => {
    setContent(newContent);
    setValue("description", newContent, { shouldValidate: true });
  };
  return (
    <>
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Property Title - only show when lang is EN (FR/ES use locale-specific field above) */}
        {lang === "en" && (
          <div>
            <label className="block font-medium text-gray-600 mb-1">
              {lang === "en" ? "Property Title" : "Property Title (English)"} {lang === "en" && <span className="text-red-500">*</span>}
            </label>
            <input
              {...register("propertyTitle", {
                required: lang === "en" ? "Property Title is required" : false,
              })}
              type="text"
              placeholder={lang === "en" ? "Title" : "Optional - add English translation"}
              className={`w-full px-3 py-3 border rounded-md focus:outline-none ${
                errors.propertyTitle ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.propertyTitle && (
              <p className="mt-1 text-sm text-red-500">{errors.propertyTitle.message as string}</p>
            )}
          </div>
        )}

        {/* Property Type */}
        <div>
          <label className="block font-medium text-gray-600 mb-1">
            Property Type <span className="text-red-500">*</span>
          </label>
          <Dropdown
            label="Select Type"
            options={[
              "Apartment",
              "Villa",
              "Townhouse",
              "Penthouse",
              "Office",
              "Studio",
            ]}
            selected={watch("propertyType")}
            onSelect={(value) => setValue("propertyType", value, { shouldValidate: true })}
          />
          {errors.propertyType && (
            <p className="mt-1 text-sm text-red-500">{errors.propertyType.message as string}</p>
          )}
        </div>

        {/* Community/Lifestyle Categories - shown on the public homepage's "Find Home" cards */}
        <div>
          <label className="block font-medium text-gray-600 mb-1">
            Lifestyle Categories <span className="text-xs text-gray-500">(Optional)</span>
          </label>
          <div className="flex flex-wrap gap-4">
            {COMMUNITY_CATEGORIES.map(({ value, label }) => {
              const current: string[] = watch("communityCategories") || [];
              const isChecked = current.includes(value);
              return (
                <label key={value} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => {
                      const updated = e.target.checked
                        ? [...current, value]
                        : current.filter((v) => v !== value);
                      setValue("communityCategories", updated, { shouldValidate: true });
                    }}
                  />
                  {label}
                </label>
              );
            })}
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block font-medium text-gray-600 mb-1">
            Category <span className="text-red-500">*</span>
          </label>
          <Dropdown
            label="Select Category"
            options={["Off Plan", "Ready"]}
            selected={watch("category")}
            onSelect={(value) => setValue("category", value, { shouldValidate: true })}
          />
          {errors.category && (
            <p className="mt-1 text-sm text-red-500">{errors.category.message as string}</p>
          )}
        </div>

        {/* Purpose */}
        <div>
          <label className="block font-medium text-gray-600 mb-1">
            Purpose <span className="text-red-500">*</span>
          </label>
          <Dropdown
            label="Select Purpose"
            options={["Buy", "Rent"]}
            selected={watch("purpose")}
            onSelect={(value) => setValue("purpose", value, { shouldValidate: true })}
          />
          {errors.purpose && (
            <p className="mt-1 text-sm text-red-500">{errors.purpose.message as string}</p>
          )}
        </div>

        {/* Developer Name */}
        <div>
          <label className="block font-medium text-gray-600 mb-1">
            Developer Name
          </label>
          <input
            {...register("developerName")}
            type="text"
            placeholder="Emaar Properties"
            className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none "
          />
        </div>

        {/* Project Status */}
        <div>
          <label className="block font-medium text-gray-600 mb-1">
            Project Status
          </label>
          <Dropdown
            label="Select Status"
            options={["Under Construction", "Completed"]}
            selected={watch("projectStatus")}
            onSelect={(value) => setValue("projectStatus", value)}
          />
        </div>

        {/* Handover Date - Only show for Off Plan */}
        {isOffPlan && (
          <div>
            <label className="block font-medium text-gray-600 mb-1">
              Handover Date
            </label>
            <input
              {...register("handoverDate")}
              type="text"
              placeholder="Q4 2028"
              className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none "
            />
          </div>
        )}

        {/* Brochure */}
        <div>
          <label className="block font-medium text-gray-600 mb-1">
            Brochure <span className="text-xs text-gray-500">(Optional)</span>
            <span className="text-xs text-gray-500 ml-2">(PDF only - Max 15MB)</span>
          </label>
          <div className={`border-2 border-dashed rounded-md p-3 cursor-pointer ${
            errors.brochure ? "border-red-500" : "border-gray-300"
          }`}>
            <input
              name={brochureRegister.name}
              ref={brochureRegister.ref}
              onBlur={brochureRegister.onBlur}
              type="file"
              accept="application/pdf"
              className="hidden"
              id="brochure"
              onChange={(e) => {
                // IMPORTANT: Call our custom handler first to ensure file is stored
                // The custom handler will also call setValue to store the FileList
                handleSingleFileChange(e, "brochure");
                // Then call register's onChange to ensure react-hook-form tracking
                brochureRegister.onChange(e);
              }}
            />
            <label htmlFor="brochure" className="cursor-pointer text-gray-500">
              {fileNames.brochure || "Upload PDF file"}
            </label>
          </div>
          {errors.brochure && (
            <p className="mt-1 text-sm text-red-500">{errors.brochure.message as string}</p>
          )}
        </div>
        {/* DLD Permit */}
        <div>
          <label className="block font-medium text-gray-600 mb-1">
            DLD Permit Number
          </label>
          <input
            {...register("dldPermitNumber")}
            type="text"
            placeholder="Enter DLD Permit Number"
            className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none"
          />
        </div>

        {/* QR Image */}
        <div>
          <label className="block font-medium text-gray-600 mb-1">
            Upload QR Image <span className="text-xs text-gray-500">(Optional)</span>
            <span className="text-xs text-gray-500 ml-2">(JPG, JPEG, PNG, WEBP, AVIF - Max 1MB)</span>
          </label>
          <div className={`border-2 border-dashed rounded-md p-3 cursor-pointer ${
            errors.qrImage ? "border-red-500" : "border-gray-300"
          }`}>
            <input
              name={qrImageRegister.name}
              ref={qrImageRegister.ref}
              onBlur={qrImageRegister.onBlur}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/avif"
              className="hidden"
              id="qrImage"
              onChange={(e) => {
                // IMPORTANT: Call our custom handler first to ensure file is stored
                // The custom handler will also call setValue to store the FileList
                handleSingleFileChange(e, "qrImage");
                // Then call register's onChange to ensure react-hook-form tracking
                qrImageRegister.onChange(e);
              }}
            />
            <label htmlFor="qrImage" className="cursor-pointer text-gray-500">
              {fileNames.qrImage || "Upload QR Image"}
            </label>
          </div>
          {errors.qrImage && (
            <p className="mt-1 text-sm text-red-500">{errors.qrImage.message as string}</p>
          )}
        </div>

        {/* Latitude */}
        <div>
          <label className="block font-medium text-gray-600 mb-1">
            Latitude
          </label>
          <input
            {...register("latitude")}
            type="text"
            placeholder="25.19183"
            className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none"
          />
        </div>

        {/* Longitude */}
        <div>
          <label className="block font-medium text-gray-600 mb-1">
            Longitude
          </label>
          <input
            {...register("longitude")}
            type="text"
            placeholder="55.26076"
            className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none"
          />
        </div>

        {/* Main Image Upload */}
        <div className="mb-6">
          <label className="block font-medium text-gray-600 mb-1">
            Main Image <span className="text-red-500">*</span>
            <span className="text-xs text-gray-500 ml-2">(JPG, JPEG, PNG, WEBP, AVIF - Max 1MB)</span>
          </label>
          <div className={`border-2 border-dashed bg-gray-100 rounded-md px-4 py-6 text-center cursor-pointer ${
            errors.image ? "border-red-500" : "border-gray-300"
          }`}>
            <input
              {...imageRegister}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/avif"
              className="hidden"
              id="main-image"
              onChange={handleMainImageChange}
            />
            {!mainImagePreview ? (
              <label
                htmlFor="main-image"
                className="cursor-pointer flex flex-col justify-center items-center gap-2"
              >
                <Image
                  src="/icons/upload-photo.png"
                  width={80}
                  height={80}
                  alt="upload"
                  className="opacity-25"
                />
                <div className="text-gray-500">
                  Upload Main Image or <span className="text-black">Browse</span>
                </div>
              </label>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="relative">
                  <Image
                    src={mainImagePreview}
                    alt="Main Image"
                    width={200}
                    height={150}
                    className="object-cover rounded-md"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveMainImage}
                    className="absolute top-1 cursor-pointer hover:bg-black/70 right-1 bg-black bg-opacity-60 text-white rounded-full px-2"
                  >
                    ×
                  </button>
                </div>
                <label
                  htmlFor="main-image"
                  className="cursor-pointer text-sm text-gray-600 underline"
                >
                  Change Image
                </label>
              </div>
            )}
          </div>
          {errors.image && (
            <p className="mt-1 text-sm text-red-500 text-center">{errors.image.message as string}</p>
          )}
        </div>

        {/* Additional Images Upload */}
        <div className="mb-6">
          <label className="block font-medium text-gray-600 mb-1">
            Additional Images
            <span className="text-xs text-gray-500 ml-2">(JPG, JPEG, PNG, WEBP, AVIF - Max 20 images, Total max 15MB)</span>
          </label>
          <div className={`border-2 border-dashed bg-gray-100 rounded-md px-4 py-6 text-center cursor-pointer ${
            errors.images ? "border-red-500" : "border-gray-300"
          }`}>
            <input
              {...imagesRegister}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/avif"
              className="hidden"
              id="additional-images"
              multiple
              onChange={handleAdditionalImagesChange}
            />
            {additionalImagesPreviews.length === 0 ? (
              <label
                htmlFor="additional-images"
                className="cursor-pointer flex flex-col justify-center items-center gap-2"
              >
                <Image
                  src="/icons/upload-photo.png"
                  width={80}
                  height={80}
                  alt="upload"
                  className="opacity-25"
                />
                <div className="text-gray-500">
                  Upload Additional Images or <span className="text-black">Browse</span>
                </div>
              </label>
            ) : (
              <div className="flex flex-wrap gap-2 justify-center items-center">
                {additionalImagesPreviews.map((src, idx) => (
                  <div key={idx} className="relative">
                    <Image
                      src={src}
                      alt={`Additional Image ${idx + 1}`}
                      width={150}
                      height={100}
                      className="object-cover rounded-md"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveAdditionalImage(idx)}
                      className="absolute top-1 cursor-pointer hover:bg-black/70 right-1 bg-black bg-opacity-60 text-white rounded-full px-2"
                    >
                      ×
                    </button>
                  </div>
                ))}

                {additionalImagesPreviews.length < 20 && (
                  <label
                    htmlFor="additional-images"
                    className="cursor-pointer flex flex-col justify-center items-center gap-2 border-2 border-dashed border-gray-300 rounded-md px-4 py-6 text-center"
                  >
                    <Image
                      src="/icons/upload-photo.png"
                      width={80}
                      height={80}
                      alt="upload"
                      className="opacity-25"
                    />
                    <div className="text-gray-500">
                      Upload More ({additionalImagesPreviews.length}/20) or{" "}
                      <span className="text-black">Browse</span>
                    </div>
                  </label>
                )}
              </div>
            )}
          </div>
          {errors.images && (
            <p className="mt-1 text-sm text-red-500 text-center">{errors.images.message as string}</p>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="mb-6">
        <label className="block font-medium text-gray-600 mb-1">
          Description <span className="text-red-500">*</span>
        </label>
        <div className={errors.description ? "border-2 border-red-500 rounded-md" : ""}>
          <JoditEditor
            ref={editor}
            value={content}
            onBlur={handleEditorBlur}
            config={{
            readonly: false,
            height: 400,
            toolbar: true,
            uploader: {
              insertImageAsBase64URI: true,
            },
            cleanHTML: {
              removeEmptyElements: true,
              fillEmptyParagraph: false,
            },
            processPasteFromWord: true,
            askBeforePasteFromWord: false,
            askBeforePasteHTML: false,
          }}
        />
        </div>
        {errors.description && (
          <p className="mt-1 text-sm text-red-500">{errors.description.message as string}</p>
        )}
      </div>
    </>
  );
}
