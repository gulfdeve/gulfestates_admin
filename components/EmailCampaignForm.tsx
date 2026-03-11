"use client";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import Dropdown from "@/components/Dropdown";
import { validateEmail, validateUrl, sanitizeInput } from "@/utils/inputValidation";
import { validateImageFile } from "@/utils/fileValidation";
import LoadingSpinner from "@/components/common/LoadingSpinner";

interface EmailFormData {
  title: string;
  audience: string;
  emailTitle: string;
  message: string;
  ctaLink: string;
  image?: FileList;
}

interface Recipient {
  email: string;
  name?: string;
}

export default function EmailCampaignForm() {
  const [selectedAudience, setSelectedAudience] = useState<string>("");
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [loadingRecipients, setLoadingRecipients] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<EmailFormData>();

  const audienceOptions = ["Home Page Leads", "Contact Us", "Newsletter"];

  // Fetch recipients when audience is selected
  useEffect(() => {
    if (selectedAudience) {
      fetchRecipients(selectedAudience);
    } else {
      setRecipients([]);
      setSelectedRecipients([]);
    }
  }, [selectedAudience]);

  const fetchRecipients = async (audience: string) => {
    try {
      setLoadingRecipients(true);
      const token = localStorage.getItem("adminToken");
      if (!token) {
        toast.error("Not authenticated");
        return;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(
        `${API_URL}/api/email-marketing/recipients?audience=${encodeURIComponent(audience)}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (data.success && data.data) {
        setRecipients(data.data);
        // Select all by default
        setSelectedRecipients(data.data.map((r: Recipient) => r.email));
      } else {
        toast.error(data.message || "Failed to load recipients");
        setRecipients([]);
      }
    } catch (err: any) {
      console.error("Error fetching recipients:", err);
      toast.error("Error loading recipients");
      setRecipients([]);
    } finally {
      setLoadingRecipients(false);
    }
  };

  const handleRecipientToggle = (email: string) => {
    setSelectedRecipients((prev) =>
      prev.includes(email)
        ? prev.filter((e) => e !== email)
        : [...prev, email]
    );
  };

  const handleSelectAll = () => {
    if (selectedRecipients.length === recipients.length) {
      setSelectedRecipients([]);
    } else {
      setSelectedRecipients(recipients.map((r) => r.email));
    }
  };

  const onSubmit = async (data: EmailFormData) => {
    try {
      if (selectedRecipients.length === 0) {
        toast.error("Please select at least one recipient");
        return;
      }

      // Validate recipient emails
      const invalidEmails = selectedRecipients.filter(email => !validateEmail(email));
      if (invalidEmails.length > 0) {
        toast.error(`Invalid email addresses detected: ${invalidEmails.join(", ")}`);
        return;
      }

      // Validate CTA link if provided
      if (data.ctaLink && data.ctaLink.trim()) {
        const sanitizedCtaLink = sanitizeInput(data.ctaLink, 500);
        if (!validateUrl(sanitizedCtaLink)) {
          toast.error("CTA Link must be a valid URL (starting with http:// or https://)");
          return;
        }
      }

      // Validate image if provided
      if (data.image && data.image.length > 0) {
        const validation = validateImageFile(data.image[0]);
        if (!validation.valid) {
          toast.error(validation.error || "Invalid image file");
          return;
        }
      }

      setLoading(true);

      const token = localStorage.getItem("adminToken");
      if (!token) {
        toast.error("Not authenticated. Please login.");
        setLoading(false);
        return;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL;

      // Prepare form data
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("audience", data.audience);
      formData.append("emailTitle", data.emailTitle);
      formData.append("message", data.message);
      formData.append("recipients", JSON.stringify(selectedRecipients));
      if (data.ctaLink && data.ctaLink.trim()) {
        formData.append("ctaLink", sanitizeInput(data.ctaLink, 500));
      }
      if (data.image && data.image.length > 0) {
        formData.append("image", data.image[0]);
      }

      const response = await fetch(`${API_URL}/api/email-marketing`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`Email campaign sent successfully to ${selectedRecipients.length} recipient(s)!`);
        reset();
        setSelectedAudience("");
        setRecipients([]);
        setSelectedRecipients([]);
        setImagePreview(null);
        // Refresh the page to show new campaign in the list
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        toast.error(result.message || "Failed to send email campaign");
      }
    } catch (err: any) {
      console.error("Error sending email campaign:", err);
      toast.error("Error sending email campaign. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Title */}
        <div>
          <label className="block font-semibold text-gray-700 mb-1">
            Title / Project Name *
          </label>
          <input
            type="text"
            {...register("title", { 
              required: "Title is required",
              maxLength: { value: 200, message: "Title must be 200 characters or less" }
            })}
            maxLength={200}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none"
            placeholder="Enter campaign title"
          />
          {errors.title && (
            <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
          )}
        </div>

        {/* Audience Dropdown */}
        <div>
          <label className="block font-semibold text-gray-700 mb-1">
            Audience *
          </label>
          <Dropdown
            label="Select Audience"
            options={audienceOptions}
            selected={selectedAudience}
            onSelect={(value) => {
              setSelectedAudience(value);
              setValue("audience", value);
            }}
          />
          <input
            type="hidden"
            {...register("audience", { required: "Audience is required" })}
          />
          {errors.audience && (
            <p className="text-red-500 text-sm mt-1">This field is required</p>
          )}
        </div>

        {/* Recipients List with Checkboxes */}
        {selectedAudience && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block font-semibold text-gray-700">
                Select Recipients ({selectedRecipients.length} selected)
              </label>
              {recipients.length > 0 && (
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {selectedRecipients.length === recipients.length
                    ? "Deselect All"
                    : "Select All"}
                </button>
              )}
            </div>

            {loadingRecipients ? (
              <LoadingSpinner inline message="Loading recipients..." />
            ) : recipients.length > 0 ? (
              <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-lg p-4 space-y-2">
                {recipients.map((recipient) => (
                  <label
                    key={recipient.email}
                    className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={selectedRecipients.includes(recipient.email)}
                      onChange={() => handleRecipientToggle(recipient.email)}
                      className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                    />
                    <span className="text-sm text-gray-700">
                      {recipient.email}
                      {recipient.name && (
                        <span className="text-gray-500 ml-2">
                          ({recipient.name})
                        </span>
                      )}
                    </span>
                  </label>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500 border border-gray-300 rounded-lg">
                No recipients found for this audience
              </div>
            )}
          </div>
        )}

        {/* Email Title */}
        <div>
          <label className="block font-semibold text-gray-700 mb-1">
            Email Title *
          </label>
          <input
            type="text"
            {...register("emailTitle", { 
              required: "Email title is required",
              maxLength: { value: 200, message: "Email title must be 200 characters or less" }
            })}
            maxLength={200}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none"
            placeholder="Enter email subject"
          />
          {errors.emailTitle && (
            <p className="text-red-500 text-sm mt-1">
              {errors.emailTitle.message}
            </p>
          )}
        </div>

        {/* Message Body */}
        <div>
          <label className="block font-semibold text-gray-700 mb-1">
            Message Body *
          </label>
          <textarea
            {...register("message", { required: "Message is required" })}
            rows={6}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none resize-none"
            placeholder="Enter your message"
          />
          {errors.message && (
            <p className="text-red-500 text-sm mt-1">
              {errors.message.message}
            </p>
          )}
        </div>

        {/* Add Image */}
        <div className="flex items-center gap-4">
          <div>
            <div
              className="w-[200px] text-center py-2 cursor-pointer font-semibold rounded-lg text-white bg-[url('/images/bg-blue-grad.jpg')] bg-cover bg-center"
              onClick={() => document.getElementById("imageInput")?.click()}
            >
              Add Image
            </div>
            <p className="text-xs text-gray-500 mt-1">
              JPG, PNG, WEBP, or AVIF (max 5MB)
            </p>
          </div>

          {/* Hidden Input */}
          <input
            id="imageInput"
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/avif"
            {...register("image")}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const validation = validateImageFile(file);
                if (validation.valid) {
                  setImagePreview(URL.createObjectURL(file));
                } else {
                  toast.error(validation.error || "Invalid image");
                  e.target.value = "";
                }
              }
            }}
          />

          {/* Preview */}
          {imagePreview && (
            <img
              src={imagePreview}
              alt="Preview"
              className="w-40 h-40 rounded object-contain"
            />
          )}
        </div>

        {/* CTA Link */}
        <div>
          <label className="block font-semibold text-gray-700 mb-1">
            CTA Link
          </label>
          <input
            type="url"
            {...register("ctaLink", {
              maxLength: { value: 500, message: "CTA Link must be 500 characters or less" }
            })}
            maxLength={500}
            placeholder="https://example.com"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none placeholder-gray-400"
          />
        </div>

        {/* Send Now Button */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading || selectedRecipients.length === 0}
            className="w-[200px] py-2 font-semibold cursor-pointer rounded-lg text-white bg-[url('/images/bg-blue-grad.jpg')] bg-cover bg-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Sending..." : "Send Now"}
          </button>
        </div>
      </form>
    </div>
  );
}
