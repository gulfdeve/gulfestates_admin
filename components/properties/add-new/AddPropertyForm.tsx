"use client";
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BasicInformation from "./BasicInformation";
import PricingAndDetails from "./PricingAndDetails";
import SeoSection from "./SeoSection";
import RedirectsManager from "./RedirectsManager";
import { translations } from "@/data/translations";
import { validateDocumentFile, validateMainImage, validateAdditionalImages, validateQRImage } from "@/utils/fileValidation";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { toast } from "sonner";

export interface PropertyFormData {
  propertyTitle: string;
  propertyTitle_es?: string;
  propertyTitle_fr?: string;
  propertyType: string;
  category: string;
  purpose: string;
  developerName: string;
  projectStatus: string;
  handoverDate: string;
  brochure: FileList | null;
  dldPermitNumber: string;
  qrImage: FileList | null;
  image: FileList | null; // Main image (single, max 1MB)
  images: FileList | null; // Additional images (multiple, max 20, total max 15MB)
  description: string;
  startingPrice: string;
  paymentPlan: string;
  serviceCharges: string;
  propertyTypeDetails: string;
  bedroomsOption: string;
  bathrooms: string;
  propertySizeRange: string;
  serviceChargesValue: string;
  cityArea: string;
  amenities: string[];
  seoTitle: string;
  seoTitle_fr?: string;
  seoTitle_es?: string;
  seoSchema: string;
  seoSchema_fr?: string;
  seoSchema_es?: string;
  seoDescription: string;
  seoDescription_fr?: string;
  seoDescription_es?: string;
  slug?: string;
  rentDuration?: string;
  latitude?: string;
  longitude?: string;
}
interface AddPropertyFormProps {
  lang: "en" | "es" | "fr";
  propertyId?: string;
}

const isRemoteImageUrl = (url: string) =>
  url.startsWith("http://") || url.startsWith("https://");

type AppendPropertyImagesOptions = {
  imageValue: FileList | null | undefined;
  imagesValue: FileList | null | undefined;
  mainImagePreview: string | null;
  additionalImagesPreviews: string[];
  isEditMode: boolean;
};

type AppendPropertyImagesResult =
  | { ok: true }
  | { ok: false; error: string };

function appendPropertyImagesToFormData(
  formData: FormData,
  options: AppendPropertyImagesOptions
): AppendPropertyImagesResult {
  const {
    imageValue,
    imagesValue,
    mainImagePreview,
    additionalImagesPreviews,
    isEditMode,
  } = options;

  const newMainFile = imageValue?.length ? imageValue[0] : null;
  const existingMainUrl =
    mainImagePreview && isRemoteImageUrl(mainImagePreview) ? mainImagePreview : null;
  let remainingAdditionalUrls = additionalImagesPreviews.filter(isRemoteImageUrl);
  const newAdditionalFiles =
    imagesValue && imagesValue.length > 0 ? Array.from(imagesValue) : [];

  if (newMainFile) {
    formData.append("image", newMainFile);
  } else if (existingMainUrl) {
    formData.append("image", existingMainUrl);
  } else if (remainingAdditionalUrls.length > 0) {
    formData.append("image", remainingAdditionalUrls[0]);
    remainingAdditionalUrls = remainingAdditionalUrls.slice(1);
  } else if (newAdditionalFiles.length > 0) {
    formData.append("image", newAdditionalFiles[0]);
    const restNewFiles = newAdditionalFiles.slice(1);
    remainingAdditionalUrls.forEach((url) => formData.append("images", url));
    restNewFiles.forEach((file) => formData.append("images", file));
    if (isEditMode && remainingAdditionalUrls.length === 0 && restNewFiles.length === 0) {
      formData.append("images", JSON.stringify([]));
    }
    return { ok: true };
  } else if (isEditMode) {
    formData.append("image", "");
  } else {
    return {
      ok: false,
      error:
        "Main image is required. Please upload a main image (max 1MB) or at least one additional image.",
    };
  }

  remainingAdditionalUrls.forEach((url) => formData.append("images", url));
  newAdditionalFiles.forEach((file) => formData.append("images", file));

  if (isEditMode && remainingAdditionalUrls.length === 0 && newAdditionalFiles.length === 0) {
    formData.append("images", JSON.stringify([]));
  }

  return { ok: true };
}

export default function AddPropertyForm({ lang, propertyId }: AddPropertyFormProps) {
  const t = translations[lang];
  const router = useRouter();
  const isEditMode = !!propertyId;
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PropertyFormData>({
    mode: "onChange",
    defaultValues: {
      category: "Ready", // Default to Ready (Property)
    },
  });
  
  const [mainImagePreview, setMainImagePreview] = useState<string | null>(null);
  const [additionalImagesPreviews, setAdditionalImagesPreviews] = useState<string[]>([]);
  
  // Register validation for dropdowns and description
  useEffect(() => {
    register("propertyType", { required: "Property Type is required" });
    register("category", { required: "Category is required" });
    register("purpose", { required: "Purpose is required" });
    register("description", { 
      required: "Description is required",
      validate: (value) => {
        if (!value || value.trim() === "" || value === "<p><br></p>") {
          return "Description is required";
        }
        return true;
      }
    });
    register("image", {
      required: false, // Not strictly required if we have fallback
      validate: (value) => {
        // Check if file is selected (FileList has files)
        // For new uploads, check FileList
        if (value && value instanceof FileList && value.length > 0) {
          return true;
        }
        // For edit mode, check preview (existing image loaded from server)
        if (mainImagePreview) {
          return true;
        }
        // Check if there are additional images (fallback)
        const additionalImages = watch("images");
        if (additionalImages && additionalImages.length > 0) {
          return true;
        }
        if (additionalImagesPreviews.length > 0) {
          return true;
        }
        // If no images at all, return error
        return "Main image is required. Please upload a main image (max 1MB) or at least one additional image.";
      }
    });
  }, [register, mainImagePreview, additionalImagesPreviews]);

  const [fileNames, setFileNames] = useState({
    brochure: "",
    qrImage: "",
  });
  const [brochureFile, setBrochureFile] = useState<File | null>(null);
  const [qrImageFile, setQrImageFile] = useState<File | null>(null);
  const [existingFileUrls, setExistingFileUrls] = useState({
    brochure: "",
    qrImage: "",
  });
  // Floor Plans - Commented Out
  // const [floorPlans, setFloorPlans] = useState([{ id: 1 }]);
  const [attachments, setAttachments] = useState({
    // brochure removed - handled in BasicInformation section
    // floorPlan: null as string | null, // Commented out - Floor Plans removed
    masterPlan: null as string | null,
  });
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(isEditMode);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [originalCategory, setOriginalCategory] = useState<string | null>(null);

  // Fetch property data when in edit mode
  useEffect(() => {
    if (isEditMode && propertyId) {
      fetchPropertyData();
    }
  }, [propertyId, isEditMode]);

  const fetchPropertyData = async () => {
    try {
      setLoadingData(true);
      const token = localStorage.getItem("adminToken");
      if (!token) {
        toast.error("Not authenticated");
        setLoadingData(false);
        return;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL;

      // Capitalize purpose value for display
      const capitalizePurpose = (purpose: string) => {
        if (!purpose) return "Buy";
        const purposeMap: { [key: string]: string } = {
          buy: "Buy",
          rent: "Rent"
        };
        return purposeMap[purpose.toLowerCase()] || "Buy";
      };

      // Try Property API first
      let response = await fetch(`${API_URL}/api/properties/${propertyId}?locale=${lang}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      let data = await response.json();
      let isOffPlan = false;

      // If property not found (404), try OffPlan API
      if (response.status === 404 || !data.success || !data.data) {
        console.log("Property not found, trying OffPlan API...");
        try {
          response = await fetch(`${API_URL}/api/offplans/${propertyId}?locale=${lang}`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });
          data = await response.json();
          isOffPlan = true;

          // If OffPlan also not found, show error
          if (response.status === 404 || !data.success || !data.data) {
            const errorMsg = data.message || `Property/OffPlan with ID ${propertyId} not found`;
            setError(errorMsg);
            setLoadingData(false);
            return;
          }
        } catch (offPlanError: any) {
          console.error("Error fetching OffPlan:", offPlanError);
          setError(`Failed to load data. ${offPlanError.message || "Unknown error"}`);
          setLoadingData(false);
          return;
        }
      }

      if (data.success && data.data) {
        const item = data.data;
console.log({item});
        if (isOffPlan) {
          // Handle OffPlan data - use languages (raw) or titleRaw for multilingual
          const titleObj = item.languages?.title ?? item.titleRaw ?? item.title;
          const locationObj = item.languages?.location ?? item.locationRaw ?? item.location;
          const titleEn = typeof titleObj === "object" ? titleObj?.en : "";
          const titleEs = typeof titleObj === "object" ? titleObj?.es : "";
          const titleFr = typeof titleObj === "object" ? titleObj?.fr : (typeof item.title === "string" ? item.title : "");
          const locationEn = typeof locationObj === "object" ? locationObj?.en : (typeof item.location === "string" ? item.location : "");
          const locationEs = typeof locationObj === "object" ? locationObj?.es : "";
          const locationFr = typeof locationObj === "object" ? locationObj?.fr : "";
          setOriginalCategory("Off Plan"); // Track original category
          reset({
            propertyTitle: titleEn || item.title || "",
            propertyTitle_es: titleEs || "",
            propertyTitle_fr: titleFr || "",
            propertyType: item.type || "",
            category: "Off Plan",
            purpose: capitalizePurpose(item.for || "buy"),
            description: item.languages?.description?.en ?? item.description?.en ?? item.description ?? "",
            startingPrice: item.priceFrom || "",
            bathrooms: item.bathRange || "",
            bedroomsOption: item.bedRange || "",
            propertySizeRange: item.sizeRange || "",
            cityArea: locationEn || locationEs || locationFr || item.location || "",
            amenities: item.amenities || [],
            developerName: item.developer || "",
            handoverDate: item.handover || "",
            paymentPlan: item.paymentPlan || "",
            propertyTypeDetails: item.propertyType || "",
            serviceChargesValue: item.serviceCharges || "",
            dldPermitNumber: item.dldPermitNumber || "",
            latitude: item.geoLocation?.latitude || "",
            longitude: item.geoLocation?.longitude || "",
            projectStatus: item.projectStatus || "",
            seoTitle: item.seo?.title?.en || "",
            seoTitle_fr: item.seo?.title?.fr || "",
            seoTitle_es: item.seo?.title?.es || "",
            seoDescription: item.seo?.description?.en || "",
            seoDescription_fr: item.seo?.description?.fr || "",
            seoDescription_es: item.seo?.description?.es || "",
            seoSchema: item.seo?.schema?.en ?? "",
            seoSchema_fr: item.seo?.schema?.fr ?? "",
            seoSchema_es: item.seo?.schema?.es ?? "",
            slug: item.slug?.en || "",
          });

          // Set brochure and QR image previews if they exist
          if (item.brochure) {
            setFileNames((prev) => ({ ...prev, brochure: "Existing brochure" }));
            setExistingFileUrls((prev) => ({ ...prev, brochure: item.brochure }));
          }
          if (item.qrImage) {
            setFileNames((prev) => ({ ...prev, qrImage: "Existing QR image" }));
            setExistingFileUrls((prev) => ({ ...prev, qrImage: item.qrImage }));
          }

          if (item.image) {
            setMainImagePreview(item.image);
          }
          if (item.images && item.images.length > 0) {
            setAdditionalImagesPreviews(item.images);
          }
        } else {
          // Handle Property data - use titleRaw for multilingual, fallback to title (localized string)
          const titleObj = item.titleRaw ?? item.title;
          const titleEn = typeof titleObj === "object" ? titleObj?.en : "";
          const titleEs = typeof titleObj === "object" ? titleObj?.es : "";
          const titleFr = typeof titleObj === "object" ? titleObj?.fr : (typeof item.title === "string" ? item.title : "");
          const locationObj = item.locationRaw ?? item.location;
          const locationEn = typeof locationObj === "object" ? locationObj?.en : (typeof item.location === "string" ? item.location : "");
          const locationEs = typeof locationObj === "object" ? locationObj?.es : "";
          const locationFr = typeof locationObj === "object" ? locationObj?.fr : "";
          const descriptionObj = item.descriptionRaw ?? item.description;
          const descriptionEn = typeof descriptionObj === "object" ? descriptionObj?.en : (typeof item.description === "string" ? item.description : "");
          setOriginalCategory("Ready"); // Track original category
          reset({
            propertyTitle: titleEn || item.title || "",
            propertyTitle_es: titleEs || "",
            propertyTitle_fr: titleFr || "",
            propertyType: item.type || "",
            category: "Ready",
            purpose: capitalizePurpose(item.for || "buy"),
            description: descriptionEn || item.description || "",
            startingPrice: item.price ? String(item.price) : "",
            bathrooms: item.baths ? String(item.baths) : "",
            bedroomsOption: item.beds ? String(item.beds) : "",
            propertySizeRange: item.size ? String(item.size) : "",
            cityArea: locationEn || locationEs || locationFr || item.location || "",
            amenities: item.amenities || [],
            developerName: item.agent?.name || "",
            dldPermitNumber: item.dldPermitNumber || "",
            latitude: item.geoLocation?.latitude || "",
            longitude: item.geoLocation?.longitude || "",
            projectStatus: item.projectStatus || "",
            seoTitle: item.seo?.title?.en || "",
            seoDescription: item.seo?.description?.en || "",
            seoSchema: item.seo?.schema?.en ?? "",
            seoSchema_fr: item.seo?.schema?.fr ?? "",
            seoSchema_es: item.seo?.schema?.es ?? "",
            rentDuration: item.rentDuration || "",
            slug: item.slug?.en || "",
          });

          // Set brochure and QR image previews if they exist
          if (item.brochure) {
            setFileNames((prev) => ({ ...prev, brochure: "Existing brochure" }));
          }
          if (item.qrImage) {
            setFileNames((prev) => ({ ...prev, qrImage: "Existing QR image" }));
          }

          if (item.image) {
            setMainImagePreview(item.image);
          }
          if (item.images && item.images.length > 0) {
            setAdditionalImagesPreviews(item.images);
          }
        }
      } else {
        setError(`Failed to load property/offplan data. ${data.message || "Unknown error"}`);
      }
    } catch (err: any) {
      console.error("Error fetching property/offplan:", err);
      setError(`Error loading data: ${err.message || "Unknown error"}`);
    } finally {
      setLoadingData(false);
    }
  };

  const onSubmit = async (data: PropertyFormData) => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      // Debug: Log brochure file state
      const brochureValue = watch("brochure");
      console.log("🔍 Form submission - Brochure state:", {
        dataBrochure: data.brochure,
        watchBrochure: brochureValue,
        hasBrochure: !!brochureFile,
        brochureType: data.brochure ? (data.brochure instanceof FileList ? "FileList" : typeof data.brochure) : "null",
        brochureLength: data.brochure && data.brochure instanceof FileList ? data.brochure.length : 0,
        brochureName: brochureFile ? brochureFile.name : "N/A",
        brochureFile: brochureFile ? { name: brochureFile.name, size: brochureFile.size, type: brochureFile.type } : null,
        isEditMode,
        existingBrochureUrl: existingFileUrls.brochure,
        fileNamesBrochure: fileNames.brochure
      });

      const token = localStorage.getItem("adminToken");
      if (!token) {
        toast.error("Not authenticated. Please login.");
        setLoading(false);
        return;
      }

      // Filter amenities to only include actual amenity names (strings), not boolean values
      const filteredAmenities = Array.isArray(data.amenities)
        ? data.amenities.filter((amenity: any) => typeof amenity === 'string' && amenity !== 'true' && amenity !== 'false')
        : [];

    
      const titleByLang: Record<string, string> = {};
      if (lang === "en") {
        titleByLang.en = data.propertyTitle || "";
        if (data.propertyTitle_es) titleByLang.es = data.propertyTitle_es;
        if (data.propertyTitle_fr) titleByLang.fr = data.propertyTitle_fr;
      } else if (lang === "fr") {
        titleByLang.fr = data.propertyTitle_fr || data.propertyTitle || "";
        if (data.propertyTitle_es) titleByLang.es = data.propertyTitle_es;
        // Don't include en - property won't show on EN table
      } else {
        // lang === "es"
        titleByLang.es = data.propertyTitle_es || data.propertyTitle || "";
        if (data.propertyTitle_fr) titleByLang.fr = data.propertyTitle_fr;
        // Don't include en - property won't show on EN table
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL;

      // Prepare FormData for file uploads
      const formData = new FormData();

      const imageValue = data.image || watch("image");
      const imagesValue = data.images || watch("images");

      const imageAppendResult = appendPropertyImagesToFormData(formData, {
        imageValue,
        imagesValue,
        mainImagePreview,
        additionalImagesPreviews,
        isEditMode,
      });

      if (!imageAppendResult.ok) {
        setError(imageAppendResult.error);
        setLoading(false);
        return;
      }

      // Add brochure file - prioritize new file upload over existing URL
      if (brochureFile) {
        formData.append("brochure", brochureFile);
        console.log("📤 Sending brochure file:", brochureFile.name, "Size:", brochureFile.size);
      } else if (isEditMode && existingFileUrls.brochure) {
        // In edit mode, if no new brochure uploaded but existing one exists, send it as URL string
        formData.append("brochure", existingFileUrls.brochure);
        console.log("📄 Sending existing brochure URL:", existingFileUrls.brochure);
      }

      // Add QR image file
      if (qrImageFile) {
        formData.append("qrImage", qrImageFile);
      } else if (isEditMode && existingFileUrls.qrImage) {
        // In edit mode, if no new QR image uploaded but existing one exists, send it as URL string
        formData.append("qrImage", existingFileUrls.qrImage);
      }

      // Check category to determine which API to use
      const isOffPlan = data.category === "Off Plan";
      const categoryChanged = isEditMode && originalCategory && originalCategory !== data.category;

      // If category changed, we need to create in new model and delete from old
      if (categoryChanged) {
        // Category changed: Off Plan -> Ready or Ready -> Off Plan
        if (originalCategory === "Off Plan" && data.category === "Ready") {
          // Moving from OffPlan to Property - use titleByLang (respects locale: no en when FR/ES)
          const propertyData: any = {
            title: titleByLang,
            location: {
              en: data.cityArea || "",
              es: data.cityArea || "",
              fr: data.cityArea || "",
            },
            price: Number(data.startingPrice) || 0,
            type: data.propertyType || "",
            beds: Number(data.bedroomsOption) || 0,
            baths: Number(data.bathrooms) || 0,
            size: data.propertySizeRange?.trim() || 0,
            for: data.purpose === "Rent" ? "rent" : "buy",
            ...(data.rentDuration && { rentDuration: data.rentDuration }),
            description: {
              en: data.description || "",
              es: "",
              fr: "",
            },
            amenities: filteredAmenities,
            ...(data.latitude && data.longitude && {
              geoLocation: {
                latitude: data.latitude,
                longitude: data.longitude,
              }
            }),
          };

          if (data.developerName) {
            propertyData.agent = {
              name: data.developerName,
              email: "",
              phone: "",
            };
          }

          if (data.seoTitle || data.seoDescription || data.seoSchema) {
            propertyData.seo = {
              title: {
                en: data.seoTitle || "",
              },
              description: {
                en: data.seoDescription || "",
              },
              ...(data.seoSchema && { schema: data.seoSchema }),
            };
          }

          const propertyFormData = new FormData();
          const propertyImageResult = appendPropertyImagesToFormData(propertyFormData, {
            imageValue,
            imagesValue,
            mainImagePreview,
            additionalImagesPreviews,
            isEditMode,
          });
          if (!propertyImageResult.ok) {
            setError(propertyImageResult.error);
            setLoading(false);
            return;
          }
          // Add brochure file - prioritize new file upload over existing URL
          if (brochureFile) {
            propertyFormData.append("brochure", brochureFile);
            console.log("📤 Sending brochure file (Property):", brochureFile.name, "Size:", brochureFile.size);
          } else if (isEditMode && existingFileUrls.brochure) {
            // In edit mode, if no new brochure uploaded but existing one exists, send it as URL string
            propertyFormData.append("brochure", existingFileUrls.brochure);
            console.log("📄 Sending existing brochure URL (Property):", existingFileUrls.brochure);
          }
          // Add QR image file
          if (qrImageFile) {
            propertyFormData.append("qrImage", qrImageFile);
          } else if (isEditMode && existingFileUrls.qrImage) {
            propertyFormData.append("qrImage", existingFileUrls.qrImage);
          }

          propertyFormData.append("title", JSON.stringify(propertyData.title));
          propertyFormData.append("location", JSON.stringify(propertyData.location));
          propertyFormData.append("price", String(propertyData.price));
          propertyFormData.append("type", propertyData.type);
          propertyFormData.append("beds", String(propertyData.beds));
          propertyFormData.append("baths", String(propertyData.baths));
          propertyFormData.append("size", String(propertyData.size));
          propertyFormData.append("for", propertyData.for);
          if (propertyData.rentDuration) {
            propertyFormData.append("rentDuration", propertyData.rentDuration);
          }
          propertyFormData.append("description", JSON.stringify(propertyData.description));
          if (propertyData.amenities.length > 0) {
            propertyFormData.append("amenities", JSON.stringify(propertyData.amenities));
          }
          if (propertyData.agent) {
            propertyFormData.append("agent", JSON.stringify(propertyData.agent));
          }
          if (propertyData.seo) {
            propertyFormData.append("seo", JSON.stringify(propertyData.seo));
          }
          // Add DLD Permit Number
          if (data.dldPermitNumber) {
            propertyFormData.append("dldPermitNumber", data.dldPermitNumber);
          }
          // Add projectStatus
          if (data.projectStatus) {
            propertyFormData.append("projectStatus", data.projectStatus);
          }
          // Add geoLocation
          if (data.latitude && data.longitude) {
            propertyFormData.append("geoLocation", JSON.stringify({
              latitude: data.latitude,
              longitude: data.longitude,
            }));
          }

          // Create new Property
          const createResponse = await fetch(`${API_URL}/api/properties`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: propertyFormData,
          });

          const createResult = await createResponse.json();

          if (createResult.success) {
            // Delete old OffPlan
            await fetch(`${API_URL}/api/offplans/${propertyId}`, {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });

            toast.success("Property moved from Off Plan to Ready successfully!");
            setTimeout(() => router.back(), 1500);
          } else {
            toast.error(createResult.message || "Failed to create property");
          }
          setLoading(false);
          return;
        } else if (originalCategory === "Ready" && data.category === "Off Plan") {
          // Moving from Property to OffPlan
          // First, create new OffPlan
          const offPlanData: any = {
            title: titleByLang,
            ...(data.cityArea && {
              location: {
                en: data.cityArea,
                es: data.cityArea,
                fr: data.cityArea,
              }
            }),
            ...(data.developerName && { developer: data.developerName }),
            ...(data.propertyType && { type: data.propertyType }),
            for: data.purpose === "Rent" ? "rent" : "buy",
            ...(data.rentDuration && { rentDuration: data.rentDuration }),
            ...(data.handoverDate && { handover: data.handoverDate }),
            ...(data.startingPrice && { priceFrom: data.startingPrice }),
            ...(data.paymentPlan && { paymentPlan: data.paymentPlan }),
            ...(data.bedroomsOption && { bedRange: data.bedroomsOption }),
            ...(data.bathrooms && { bathRange: data.bathrooms }),
            ...(data.propertySizeRange && { sizeRange: data.propertySizeRange }),
            ...(data.description && {
              description: {
                en: data.description,
                es: "",
                fr: "",
              }
            }),
            ...(filteredAmenities && filteredAmenities.length > 0 && { amenities: filteredAmenities }),
            ...(data.propertyTypeDetails && { propertyType: data.propertyTypeDetails }),
            ...(data.serviceChargesValue && { serviceCharges: data.serviceChargesValue }),
          };

          if (data.seoTitle || data.seoDescription || data.seoSchema || data.seoTitle_fr || data.seoTitle_es || data.seoDescription_fr || data.seoDescription_es || data.seoSchema_fr || data.seoSchema_es) {
            offPlanData.seo = {
              title: {
                en: data.seoTitle || "",
                fr: data.seoTitle_fr || "",
                es: data.seoTitle_es || "",
              },
              description: {
                en: data.seoDescription || "",
                fr: data.seoDescription_fr || "",
                es: data.seoDescription_es || "",
              },
              ...((data.seoSchema || data.seoSchema_fr || data.seoSchema_es) && {
                schema: {
                  en: data.seoSchema || "",
                  fr: data.seoSchema_fr || "",
                  es: data.seoSchema_es || "",
                },
              }),
            };
          }

          const offPlanFormData = new FormData();
          const offPlanImageResult = appendPropertyImagesToFormData(offPlanFormData, {
            imageValue,
            imagesValue,
            mainImagePreview,
            additionalImagesPreviews,
            isEditMode,
          });
          if (!offPlanImageResult.ok) {
            setError(offPlanImageResult.error);
            setLoading(false);
            return;
          }
          // Add brochure file - prioritize new file upload over existing URL
          if (brochureFile) {
            offPlanFormData.append("brochure", brochureFile);
            console.log("📤 Sending brochure file (OffPlan - legacy path):", brochureFile.name, "Size:", brochureFile.size);
          } else if (isEditMode && existingFileUrls.brochure) {
            // In edit mode, if no new brochure uploaded but existing one exists, send it as URL string
            offPlanFormData.append("brochure", existingFileUrls.brochure);
            console.log("📄 Sending existing brochure URL (OffPlan - legacy path):", existingFileUrls.brochure);
          }
          // Add QR image file
          if (qrImageFile) {
            offPlanFormData.append("qrImage", qrImageFile);
          } else if (isEditMode && existingFileUrls.qrImage) {
            offPlanFormData.append("qrImage", existingFileUrls.qrImage);
          }
          // Add DLD Permit Number
          if (data.dldPermitNumber) {
            offPlanFormData.append("dldPermitNumber", data.dldPermitNumber);
          }

          if (offPlanData.title) offPlanFormData.append("title", JSON.stringify(offPlanData.title));
          if (offPlanData.location) offPlanFormData.append("location", JSON.stringify(offPlanData.location));
          if (offPlanData.developer) offPlanFormData.append("developer", offPlanData.developer);
          if (offPlanData.type) offPlanFormData.append("type", offPlanData.type);
          offPlanFormData.append("for", offPlanData.for);
          if (offPlanData.rentDuration) {
            offPlanFormData.append("rentDuration", offPlanData.rentDuration);
          }
          if (offPlanData.handover) offPlanFormData.append("handover", offPlanData.handover);
          if (offPlanData.priceFrom) offPlanFormData.append("priceFrom", offPlanData.priceFrom);
          if (offPlanData.paymentPlan) offPlanFormData.append("paymentPlan", offPlanData.paymentPlan);
          if (offPlanData.bedRange) offPlanFormData.append("bedRange", offPlanData.bedRange);
          if (offPlanData.bathRange) offPlanFormData.append("bathRange", offPlanData.bathRange);
          if (offPlanData.sizeRange) offPlanFormData.append("sizeRange", offPlanData.sizeRange);
          if (offPlanData.description) {
            offPlanFormData.append("description", JSON.stringify(offPlanData.description));
          }
        if (offPlanData.amenities && offPlanData.amenities.length > 0) {
          offPlanFormData.append("amenities", JSON.stringify(offPlanData.amenities));
        }
        if (offPlanData.geoLocation) {
          offPlanFormData.append("geoLocation", JSON.stringify(offPlanData.geoLocation));
        }
        if (offPlanData.propertyType) {
          offPlanFormData.append("propertyType", offPlanData.propertyType);
        }
        if (offPlanData.serviceCharges) {
          offPlanFormData.append("serviceCharges", offPlanData.serviceCharges);
        }
        if (offPlanData.seo) {
          offPlanFormData.append("seo", JSON.stringify(offPlanData.seo));
        }

          // Create new OffPlan
          const createResponse = await fetch(`${API_URL}/api/offplans`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: offPlanFormData,
          });

          const createResult = await createResponse.json();

          if (createResult.success) {
            // Delete old Property
            await fetch(`${API_URL}/api/properties/${propertyId}`, {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });

            toast.success("Property moved from Ready to Off Plan successfully!");
            setTimeout(() => router.back(), 1500);
          } else {
            toast.error(createResult.message || "Failed to create off plan");
          }
          setLoading(false);
          return;
        }
      }

      if (isOffPlan) {
        // Prepare OffPlan data (all fields optional)
        const offPlanData: any = {
          title: titleByLang,
          ...(data.cityArea && {
            location: {
              en: data.cityArea,
              es: data.cityArea,
              fr: data.cityArea,
            }
          }),
          ...(data.developerName && { developer: data.developerName }),
          ...(data.propertyType && { type: data.propertyType }),
          for: data.purpose === "Rent" ? "rent" : "buy",
          ...(data.rentDuration && { rentDuration: data.rentDuration }),
          ...(data.handoverDate && { handover: data.handoverDate }),
          ...(data.startingPrice && { priceFrom: data.startingPrice }),
          ...(data.paymentPlan && { paymentPlan: data.paymentPlan }),
          ...(data.bedroomsOption && { bedRange: data.bedroomsOption }),
          ...(data.bathrooms && { bathRange: data.bathrooms }),
          ...(data.propertySizeRange && { sizeRange: data.propertySizeRange }),
          ...(data.description && {
            description: {
              en: data.description,
              es: "",
              fr: "",
            }
          }),
          ...(filteredAmenities && filteredAmenities.length > 0 && { amenities: filteredAmenities }),
          ...(data.latitude && data.longitude && {
            geoLocation: {
              latitude: data.latitude,
              longitude: data.longitude,
            }
          }),
          ...(data.propertyTypeDetails && { propertyType: data.propertyTypeDetails }),
          ...(data.serviceChargesValue && { serviceCharges: data.serviceChargesValue }),
        };

        // Add SEO if available (3 languages for off-plan per OffPlan model)
        if (data.seoTitle || data.seoDescription || data.seoSchema || data.seoTitle_fr || data.seoTitle_es || data.seoDescription_fr || data.seoDescription_es || data.seoSchema_fr || data.seoSchema_es) {
          offPlanData.seo = {
            title: {
              en: data.seoTitle || "",
              fr: data.seoTitle_fr || "",
              es: data.seoTitle_es || "",
            },
            description: {
              en: data.seoDescription || "",
              fr: data.seoDescription_fr || "",
              es: data.seoDescription_es || "",
            },
            ...((data.seoSchema || data.seoSchema_fr || data.seoSchema_es) && {
              schema: {
                en: data.seoSchema || "",
                fr: data.seoSchema_fr || "",
                es: data.seoSchema_es || "",
              },
            }),
          };
        }

        // Brochure and QR Image files are already appended above (lines 390-406)
        // No need to append them again here

        // Append JSON data as string for OffPlan (only if fields exist)
        if (offPlanData.title) formData.append("title", JSON.stringify(offPlanData.title));
        if (offPlanData.location) formData.append("location", JSON.stringify(offPlanData.location));
        if (offPlanData.developer) formData.append("developer", offPlanData.developer);
        if (offPlanData.type) formData.append("type", offPlanData.type);
        formData.append("for", offPlanData.for);
        if (offPlanData.rentDuration) {
          formData.append("rentDuration", offPlanData.rentDuration);
        }
        if (offPlanData.handover) formData.append("handover", offPlanData.handover);
        if (offPlanData.priceFrom) formData.append("priceFrom", offPlanData.priceFrom);
        if (offPlanData.paymentPlan) formData.append("paymentPlan", offPlanData.paymentPlan);
        if (offPlanData.bedRange) formData.append("bedRange", offPlanData.bedRange);
        if (offPlanData.bathRange) formData.append("bathRange", offPlanData.bathRange);
        if (offPlanData.sizeRange) formData.append("sizeRange", offPlanData.sizeRange);
        if (offPlanData.description) {
          formData.append("description", JSON.stringify(offPlanData.description));
        }
        if (offPlanData.amenities && offPlanData.amenities.length > 0) {
          formData.append("amenities", JSON.stringify(offPlanData.amenities));
        }
        if (offPlanData.geoLocation) {
          formData.append("geoLocation", JSON.stringify(offPlanData.geoLocation));
        }
        if (offPlanData.propertyType) {
          formData.append("propertyType", offPlanData.propertyType);
        }
        if (offPlanData.serviceCharges) {
          formData.append("serviceCharges", offPlanData.serviceCharges);
        }
        if (data.projectStatus) {
          formData.append("projectStatus", data.projectStatus);
        }
        if (offPlanData.seo) {
          formData.append("seo", JSON.stringify(offPlanData.seo));
        }
        // Slug is only ever changed explicitly on edit; on create it's auto-generated
        if (isEditMode && data.slug) {
          formData.append("slug", JSON.stringify({ en: data.slug }));
        }
        // Add DLD Permit Number
        if (data.dldPermitNumber) {
          formData.append("dldPermitNumber", data.dldPermitNumber);
        }
        // Add QR image file (already appended above if new file)
        // If no new file but existing, send URL
        if (!data.qrImage && isEditMode && additionalImagesPreviews.length === 0) {
          // QR image will be handled by backend from existing data
        }

        const url = isEditMode
          ? `${API_URL}/api/offplans/${propertyId}`
          : `${API_URL}/api/offplans`;

        const method = isEditMode ? "PUT" : "POST";

        const response = await fetch(url, {
          method,
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        const result = await response.json();

        if (result.success) {
          toast.success(isEditMode ? "Off Plan updated successfully!" : "Off Plan created successfully!");
          setTimeout(() => {
            const purposeForUrl = data.purpose === "Rent" ? "rent" : "buy";
            router.push(`/${lang}/properties/${purposeForUrl}`);
          }, 1500);
        } else {
          toast.error(result.message || (isEditMode ? "Failed to update off plan" : "Failed to create off plan"));
        }
        setLoading(false);
        return;
      }

      // Prepare Property data (for Ready category)
      const propertyData: any = {
        title: titleByLang,
        location: {
          en: data.cityArea || "",
          es: data.cityArea || "",
          fr: data.cityArea || "",
        },
        price: Number(data.startingPrice) || 0,
        type: data.propertyType || "",
        beds: Number(data.bedroomsOption) || 0,
        baths: Number(data.bathrooms) || 0,
        size: data.propertySizeRange?.trim() || 0,
        for: data.purpose === "Rent" ? "rent" : "buy",
        ...(data.rentDuration && { rentDuration: data.rentDuration }),
        description: {
          en: data.description || "",
          es: "",
          fr: "",
        },
        amenities: filteredAmenities,
        ...(data.latitude && data.longitude && {
          geoLocation: {
            latitude: data.latitude,
            longitude: data.longitude,
          }
        }),
      };

      // Add agent info if available
      if (data.developerName) {
        propertyData.agent = {
          name: data.developerName,
          email: "",
          phone: "",
        };
      }

      // Add SEO if available
      if (data.seoTitle || data.seoDescription || data.seoSchema) {
        propertyData.seo = {
          title: {
            en: data.seoTitle || "",
          },
          description: {
            en: data.seoDescription || "",
          },
          ...(data.seoSchema && { schema: data.seoSchema }),
        };
      }

      // Append JSON data as string for Property
      formData.append("title", JSON.stringify(propertyData.title));
      formData.append("location", JSON.stringify(propertyData.location));
      formData.append("price", String(propertyData.price));
      formData.append("type", propertyData.type);
      formData.append("beds", String(propertyData.beds));
      formData.append("baths", String(propertyData.baths));
      formData.append("size", String(propertyData.size));
      formData.append("for", propertyData.for);
      if (propertyData.rentDuration) {
        formData.append("rentDuration", propertyData.rentDuration);
      }
      formData.append("description", JSON.stringify(propertyData.description));
      if (propertyData.amenities.length > 0) {
        formData.append("amenities", JSON.stringify(propertyData.amenities));
      }
      if (propertyData.agent) {
        formData.append("agent", JSON.stringify(propertyData.agent));
      }
      if (propertyData.seo) {
        formData.append("seo", JSON.stringify(propertyData.seo));
      }
      // Slug is only ever changed explicitly on edit; on create it's auto-generated
      if (isEditMode && data.slug) {
        formData.append("slug", JSON.stringify({ en: data.slug }));
      }
      // Add DLD Permit Number
      if (data.dldPermitNumber) {
        formData.append("dldPermitNumber", data.dldPermitNumber);
      }
      // Add projectStatus
      if (data.projectStatus) {
        formData.append("projectStatus", data.projectStatus);
      }
      // Add geoLocation
      if (propertyData.geoLocation) {
        formData.append("geoLocation", JSON.stringify(propertyData.geoLocation));
      }
      // Brochure and QR Image files are already appended above

      const url = isEditMode
        ? `${API_URL}/api/properties/${propertyId}`
        : `${API_URL}/api/properties`;

      const method = isEditMode ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        toast.success(isEditMode ? "Property updated successfully!" : "Property created successfully!");
        setTimeout(() => {
          // Convert purpose to lowercase for URL
          const purposeForUrl = data.purpose === "Rent" ? "rent" : "buy";
          router.push(`/${lang}/properties/${purposeForUrl}`);
        }, 1500);
      } else {
        toast.error(result.message || (isEditMode ? "Failed to update property" : "Failed to create property"));
      }
    } catch (err: any) {
      console.error("Error creating property:", err);
      toast.error("Error creating property. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Floor Plans - Commented Out
  // const addFloorPlan = () =>
  //   setFloorPlans([...floorPlans, { id: floorPlans.length + 1 }]);

  // Handle main image upload (single image, max 1MB)
  const handleMainImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setMainImagePreview(null);
      setValue("image", null as any, { shouldValidate: true });
      return;
    }

    // Validate main image
    const validation = validateMainImage(file);
    
    if (!validation.valid) {
      toast.error(validation.error || "Invalid file");
      e.target.value = ""; // Clear the input
      setMainImagePreview(null);
      setValue("image", null as any, { shouldValidate: true });
      return;
    }

    // Create preview first
    if (typeof window !== "undefined") {
      const previewURL = URL.createObjectURL(file);
      setMainImagePreview(previewURL);
    }

    // Persist FileList using DataTransfer to avoid live FileList issues
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    const fileList = dataTransfer.files;
    setValue("image", fileList as any, { shouldValidate: true, shouldDirty: true });

  };

  // Handle additional images upload (multiple images, max 20, total max 15MB)
  const handleAdditionalImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // Validate additional images
    const validation = validateAdditionalImages(files);
    
    if (!validation.valid) {
      toast.error(validation.errors.join("; "));
      e.target.value = ""; // Clear the input
      return;
    }

    // Create previews
    if (typeof window !== "undefined") {
      const newPreviews = validation.validFiles.map((file) =>
        URL.createObjectURL(file)
      );
      setAdditionalImagesPreviews((prev) => [...prev, ...newPreviews]);
    }

    // Append new files to existing ones in react-hook-form
    const existingFiles = watch("images"); // get current value
    const newFiles = existingFiles
      ? [...Array.from(existingFiles), ...validation.validFiles]
      : validation.validFiles;
    setValue("images", newFiles as any, { shouldValidate: true });
  };

  const handleSingleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "brochure" | "qrImage"
  ) => {
    const file = e.target.files?.[0];
    if (!file) {
      // Clear the field if no file selected
      setValue(field, null as any, { shouldValidate: true });
      setFileNames((prev) => ({ ...prev, [field]: "" }));
      if (field === "brochure") {
        setBrochureFile(null);
      } else {
        setQrImageFile(null);
      }
      return;
    }

    // Validate file based on field type
    // QR images: single image, max 1MB
    // Brochures: PDFs
    const validation = field === "brochure" 
      ? validateDocumentFile(file)
      : validateQRImage(file);
    
    if (!validation.valid) {
      toast.error(validation.error || "Invalid file");
      e.target.value = ""; // Clear the input
      // Clear the file name for this field
      setFileNames((prev) => ({ ...prev, [field]: "" }));
      // Clear the form value
      setValue(field, null as any, { shouldValidate: true });
      if (field === "brochure") {
        setBrochureFile(null);
      } else {
        setQrImageFile(null);
      }
      return;
    }

    setFileNames((prev) => ({ ...prev, [field]: file.name }));
    if (field === "brochure") {
      setBrochureFile(file);
    } else {
      setQrImageFile(file);
    }
    
    // IMPORTANT: Create a new FileList using DataTransfer API
    // e.target.files is a live FileList that can become empty, so we need to create a persistent one
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    const fileList = dataTransfer.files;
    
    // Store the FileList in react-hook-form state
    setValue(field, fileList as any, { shouldValidate: true, shouldDirty: true });
    
    // Debug log to verify file is stored
    console.log(`✅ ${field} file stored in form:`, {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      fileListLength: fileList.length,
      fileListType: fileList.constructor.name
    });
    
    // Verify it's stored correctly after a short delay
    setTimeout(() => {
      const storedValue = watch(field);
      console.log(`🔍 Verification - ${field} stored value:`, {
        hasValue: !!storedValue,
        isFileList: storedValue instanceof FileList,
        length: storedValue instanceof FileList ? storedValue.length : 0,
        fileName: storedValue instanceof FileList && storedValue[0] ? storedValue[0].name : "N/A"
      });
    }, 100);
  };

  const handleAttachmentChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "masterPlan" // "brochure" removed - Brochure is handled in BasicInformation, "floorPlan" removed - Floor Plans commented out
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith("image/")) {
        const previewURL = URL.createObjectURL(file);
        setAttachments((prev) => ({ ...prev, [type]: previewURL }));
      } else {
        setAttachments((prev) => ({ ...prev, [type]: file.name }));
      }
    } else {
      setAttachments((prev) => ({ ...prev, [type]: null }));
    }

    e.target.value = "";
  };
  // Remove main image
  const handleRemoveMainImage = () => {
    setMainImagePreview(null);
    setValue("image", null as any, { shouldValidate: true });
  };

  // Remove additional image by index
  const handleRemoveAdditionalImage = (index: number) => {
    const removedPreview = additionalImagesPreviews[index];
    setAdditionalImagesPreviews((prev) => prev.filter((_, i) => i !== index));

    // Only sync FileList when removing a newly uploaded file (blob preview)
    if (removedPreview?.startsWith("blob:")) {
      const blobIndexBefore = additionalImagesPreviews
        .slice(0, index)
        .filter((src) => src.startsWith("blob:")).length;
      const existingFiles = watch("images");
      if (existingFiles?.length) {
        const updatedFiles = Array.from(existingFiles).filter(
          (_, i) => i !== blobIndexBefore
        );
        setValue("images", updatedFiles as any, { shouldValidate: true });
      }
    }
  };

  const handleCancel = () => {
    reset();
    setMainImagePreview(null);
    setAdditionalImagesPreviews([]);
    setFileNames({
      brochure: "",
      qrImage: "",
    });
    setExistingFileUrls({
      brochure: "",
      qrImage: "",
    });
    setAttachments({
      masterPlan: null,
    });
    router.back();
  };

  if (loadingData) {
    return (
      <div className="text-gray-600 rounded-lg">
        <LoadingSpinner message="Loading property data..." />
      </div>
    );
  }

  return (
    <div className="text-gray-600 rounded-lg">
      <div className="flex items-center justify-between px-6 py-4">
        <h1 className="text-3xl font-semibold">
          {isEditMode ? (lang === "en" ? "Edit Property" : lang === "es" ? "Editar Propiedad" : "Modifier la Propriété") : t.title}
        </h1>
        <Link
          href={`/${lang}/properties/buy`}
          className="text-gray-500 bg-gray-100 hover:bg-gray-200 cursor-pointer border px-6 py-2 rounded-lg"
        >
          {t.close}
        </Link>
      </div>

      {error && (
        <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="mx-6 mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-600 text-sm">{success}</p>
        </div>
      )}

      {loadingData && (
        <div className="mx-6 mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-blue-600 text-sm">Loading property data...</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="p-6 overflow-hidden" style={{ display: loadingData ? 'none' : 'block' }}>
        {lang !== "en" && (
          <div className="mb-6">
            <label className="block font-semibold mb-1">
              {lang === "es"
                ? "Título de la Propiedad (Español)"
                : "Titre de la Propriété (Français)"}{" "}
              <span className="text-red-500">*</span>
            </label>

            <input
              type="text"
              {...register(`propertyTitle_${lang}` as const, {
                required: lang === "fr"
                  ? "Titre de la propriété (Français) est requis"
                  : lang === "es"
                  ? "Título de la propiedad (Español) es requerido"
                  : false,
              })}
              className={`w-full border rounded-lg px-4 py-2 ${
                errors[`propertyTitle_${lang}`] ? "border-red-500" : "border-gray-300"
              }`}
              placeholder={
                lang === "es"
                  ? "Ingrese el título en Español"
                  : "Saisissez le titre en Français"
              }
            />
            {errors[`propertyTitle_${lang}`] && (
              <p className="mt-1 text-sm text-red-500">{errors[`propertyTitle_${lang}`]?.message as string}</p>
            )}
          </div>
        )}

        <BasicInformation
          lang={lang}
          register={register}
          handleMainImageChange={handleMainImageChange}
          handleAdditionalImagesChange={handleAdditionalImagesChange}
          mainImagePreview={mainImagePreview}
          additionalImagesPreviews={additionalImagesPreviews}
          setValue={setValue}
          watch={watch}
          handleSingleFileChange={handleSingleFileChange}
          fileNames={fileNames}
          handleRemoveMainImage={handleRemoveMainImage}
          handleRemoveAdditionalImage={handleRemoveAdditionalImage}
          errors={errors}
        />

        <PricingAndDetails
          register={register}
          setValue={setValue}
          watch={watch}
          errors={errors}
        />

        <SeoSection register={register} errors={errors} isEditMode={isEditMode} />

        {isEditMode && propertyId && (
          <RedirectsManager
            entityType={watch("category") === "Off Plan" ? "offplan" : "property"}
            entityId={propertyId}
          />
        )}

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={handleCancel}
            className="px-6 py-2 cursor-pointer text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            {t.cancel}
          </button>
          <button
            type="submit"
            disabled={loading || loadingData}
            className="px-6 py-2 cursor-pointer text-white bg-primary rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? (isEditMode ? "Updating..." : "Creating...")
              : (isEditMode ? "Update Property" : t.save)}
          </button>
        </div>
      </form>
    </div>
  );
}
