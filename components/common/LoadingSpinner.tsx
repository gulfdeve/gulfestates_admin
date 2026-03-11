"use client";

interface LoadingSpinnerProps {
  /** Optional message shown below the spinner */
  message?: string;
  /** Full page centered layout (min-h-screen) */
  fullPage?: boolean;
  /** Inline: no background, minimal height - for use inside cards/tables */
  inline?: boolean;
  /** Minimum height when not full page */
  minHeight?: string;
  /** Size of the spinner: sm, md, lg */
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "h-6 w-6 border-2",
  md: "h-10 w-10 border-2",
  lg: "h-14 w-14 border-2",
};

export default function LoadingSpinner({
  message,
  fullPage = false,
  inline = false,
  minHeight = "min-h-[400px]",
  size = "md",
}: LoadingSpinnerProps) {
  const wrapperClass = inline
    ? "flex items-center justify-center py-12"
    : `flex items-center justify-center ${fullPage ? "min-h-screen" : minHeight} bg-gray-50`;

  return (
    <div className={wrapperClass}
    >
      <div className="flex flex-col items-center gap-4">
        <div
          className={`animate-spin rounded-full border-blue-500 border-t-transparent ${sizeClasses[size]}`}
          role="status"
          aria-label="Loading"
        />
        {message && (
          <p className="text-gray-600 text-sm">{message}</p>
        )}
      </div>
    </div>
  );
}
