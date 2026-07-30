import { UseFormRegister, FieldErrors } from "react-hook-form";
import { PropertyFormData } from "./AddPropertyForm";

export default function SeoSection({
  register,
  errors,
  isEditMode,
}: {
  register: UseFormRegister<PropertyFormData>;
  errors: FieldErrors<PropertyFormData>;
  isEditMode?: boolean;
}) {
  return (
    <>
    <h2 className="text-2xl font-semibold text-primary mb-4">SEO</h2>
      <div className="mb-6 space-y-4">
        {isEditMode && (
          <div>
            <label className="block font-medium text-gray-600 mb-1">
              URL Slug
            </label>
            <input
              {...register("slug")}
              type="text"
              placeholder="e.g. moonsa-residences"
              className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none"
            />
            <p className="mt-1 text-xs text-gray-500">
              Changing this updates the page URL. The old URL will keep redirecting here automatically.
            </p>
          </div>
        )}
        <div>
          <label className="block  font-medium text-gray-600 mb-1">
            Seo Title
          </label>
          <input
            {...register("seoTitle")}
            type="text"
            placeholder="Optional"
            className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none"
          />
        </div>
        <div>
          <label className="block  font-medium text-gray-600 mb-1">
            Seo Description
          </label>
          <textarea
            {...register("seoDescription")}
            rows={4}
            placeholder="Optional"
            className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none"
          />
        </div>
        <div>
          <label className="block  font-medium text-gray-600 mb-1">
            Seo Schema
          </label>
          <textarea
            {...register("seoSchema")}
            rows={4}
            placeholder="Optional"
            className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none"
          />
        </div>
      </div>
    </>
  );
}
