import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "Admin Login - Gulf Estate",
  description: "Admin login for Gulf Estate dashboard",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-full">
      {children}
    </div>
  );
}

