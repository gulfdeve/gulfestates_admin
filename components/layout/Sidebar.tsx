"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

const navLinks = [
  { name: "Dashboard", href: "/", icon: "/icons/home.svg" },
  {
    name: "Properties",
    href: "/en/properties",
    icon: "/icons/apartment.svg",
    subLinks: [
      {
        label: "Buy",
        href: "/en/properties/buy",
        subSubLinks: [
          { label: "Ready Properties", href: "/en/properties/buy?type=ready" },
          {
            label: "Off Plan Properties",
            href: "/en/properties/buy?type=offplan",
          },
        ],
      },
      { label: "Rent", href: "/en/properties/rent" },
    ],
  },
  {
    name: "Propiedades",
    href: "/es/properties",
    icon: "/icons/spain.svg",
    subLinks: [
      {
        label: "Comprar",
        href: "/es/properties/buy",
        subSubLinks: [
          {
            label: "Propiedades listas",
            href: "/es/properties/buy?type=ready",
          },
          {
            label: "Propiedades sobre plano",
            href: "/es/properties/buy?type=offplan",
          },
        ],
      },
      { label: "Alquilar", href: "/es/properties/rent" },
    ],
  },
  {
    name: "Propriétés",
    href: "/fr/properties",
    icon: "/icons/france.svg",
    subLinks: [
      {
        label: "Acheter",
        href: "/fr/properties/buy",
        subSubLinks: [
          { label: "Propriétés prêtes", href: "/fr/properties/buy?type=ready" },
          {
            label: "Propriétés sur plan",
            href: "/fr/properties/buy?type=offplan",
          },
        ],
      },
      { label: "Louer", href: "/fr/properties/rent" },
    ],
  },
  {
    name: "Blogs",
    href: "/en/blogs",
    icon: "/icons/blog.svg",
    subLinks: [
      { label: "Create Blog", href: "/en/blogs/create-blog" },
      { label: "Manage Blogs", href: "/en/blogs/manage-blogs" },
    ],
  },
  {
    name: "Blog",
    href: "/es/blogs",
    icon: "/icons/spain.svg",
    subLinks: [
      { label: "Crear blog", href: "/es/blogs/create-blog" },
      { label: "Manage blogs", href: "/es/blogs/manage-blogs" },
    ],
  },
  {
    name: "Blogues",
    href: "/fr/blogs",
    icon: "/icons/france.svg",
    subLinks: [
      { label: "Créer un blog", href: "/fr/blogs/create-blog" },
      { label: "Gérer les blogs", href: "/fr/blogs/manage-blogs" },
    ],
  },
  {
    name: "Testimonials",
    href: "/en/testimonials",
    icon: "/icons/blog.svg",
    subLinks: [
      { label: "Create Testimonial", href: "/en/testimonials/create-testimonial" },
      { label: "Manage Testimonials", href: "/en/testimonials/manage-testimonials" },
    ],
  },
  {
    name: "Testimonios",
    href: "/es/testimonials",
    icon: "/icons/spain.svg",
    subLinks: [
      { label: "Crear testimonio", href: "/es/testimonials/create-testimonial" },
      { label: "Gestionar testimonios", href: "/es/testimonials/manage-testimonials" },
    ],
  },
  {
    name: "Témoignages",
    href: "/fr/testimonials",
    icon: "/icons/france.svg",
    subLinks: [
      { label: "Créer un témoignage", href: "/fr/testimonials/create-testimonial" },
      { label: "Gérer les témoignages", href: "/fr/testimonials/manage-testimonials" },
    ],
  },
  {
    name: "Team",
    href: "/en/team",
    icon: "/icons/our-team.svg",
  },
  {
    name: "Equipo",
    href: "/es/team",
    icon: "/icons/spain.svg",
  },
  {
    name: "Équipe",
    href: "/fr/team",
    icon: "/icons/france.svg",
  },
  {
    name: "Pages Content",
    href: "/en/pages/content",
    icon: "/icons/page-content-icon.svg",
  },
  {
    name: "Contenido de las páginas",
    href: "/es/pages/content",
    icon: "/icons/spain.svg",
  },
  {
    name: "Contenu des pages",
    href: "/fr/pages/content",
    icon: "/icons/france.svg",
  },
  {
    name: "Jobs",
    href: "/en/jobs",
    icon: "/icons/blog.svg",
    subLinks: [
      { label: "Create Job", href: "/en/jobs/create-job" },
      { label: "Manage Jobs", href: "/en/jobs/manage-jobs" },
    ],
  },
  {
    name: "Trabajos",
    href: "/es/jobs",
    icon: "/icons/spain.svg",
    subLinks: [
      { label: "Crear Trabajo", href: "/es/jobs/create-job" },
      { label: "Gestionar Trabajos", href: "/es/jobs/manage-jobs" },
    ],
  },
  {
    name: "Emplois",
    href: "/fr/jobs",
    icon: "/icons/france.svg",
    subLinks: [
      { label: "Créer un Emploi", href: "/fr/jobs/create-job" },
      { label: "Gérer les Emplois", href: "/fr/jobs/manage-jobs" },
    ],
  },
  {
    name: "Clients",
    href: "/clients",
    icon: "/icons/users.svg",
    subLinks: [
      { label: "Home Page Leads", href: "/clients/home-page-leads" },
      { label: "Contact Us Page Leads", href: "/clients/contact-us" },
      { label: "Blog Comments", href: "/clients/comments" },
      { label: "Newsletter Subscribers", href: "/clients/newsletter" },
      { label: "Job Applications", href: "/clients/job-applications" },
    ],
  },
  {
    name: "Marketing",
    href: "/marketing",
    icon: "/icons/plan.svg",
    subLinks: [
      { label: "Analytics Dashboard", href: "/marketing/analytics" },
      { label: "Email Marketing", href: "/marketing/email-marketing" },
    ],
  },
  {
    name: "Users",
    href: "/dashboard/users",
    icon: "/icons/users.svg",
    subLinks: [
      { label: "Users", href: "/dashboard/users" },
    ],
  },
  {
    name: "Settings",
    href: "/settings",
    icon: "/icons/settings.svg",
    subLinks: [
      { label: "Edit Profile", href: "/settings/edit-profile" },
      { label: "Account Settings", href: "/settings/account" },
    ],
  },
];
const isUrlActive = (pathname: any, url: any) => {
  if (!url) return false;
  if (pathname === url) return true;
  if (url.includes("?")) return pathname === url; // exact match for query links
  return pathname.startsWith(url);
};

// Route access mapping
const roleAccessMap: Record<string, string[]> = {
  superadmin: ['*'], // all routes - superadmin can access everything
  admin: ['properties', 'blogs', 'marketing', 'testimonials', 'settings'],
  'customer-manager': ['clients', 'settings'],
  user: ['settings'] // only settings
};

// Helper function to check if user has access to a route
// Rule: If user has access to add and view, they automatically have edit access
const hasAccessToRoute = (routeName: string, userRole: string | null): boolean => {
  if (!userRole) return false;
  
  // Superadmin has access to all routes
  if (userRole === 'superadmin') {
    return true;
  }
  
  // Get allowed routes for the role
  const allowedRoutes = roleAccessMap[userRole] || [];
  
  // Check if route is in allowed list
  // Map route names to their access keys
  const routeMap: Record<string, string> = {
    'Dashboard': 'dashboard',
    'Properties': 'properties',
    'Propiedades': 'properties',
    'Propriétés': 'properties',
    'Blogs': 'blogs',
    'Blog': 'blogs',
    'Blogues': 'blogs',
    'Testimonials': 'testimonials',
    'Testimonios': 'testimonials',
    'Témoignages': 'testimonials',
    'Jobs': 'jobs', // Not in plan, but keeping for now
    'Trabajos': 'jobs',
    'Emplois': 'jobs',
    'Clients': 'clients',
    'Marketing': 'marketing',
    'Users': 'users', // superadmin only
    'Team': 'team', // superadmin only
    'Settings': 'settings'
  };
  
  const routeKey = routeMap[routeName];
  if (!routeKey) return false;
  
  // Settings is accessible to all roles
  if (routeKey === 'settings') return true;
  
  // Users is only for superadmin (already checked above)
  if (routeKey === 'users') return false;
  
  // Team is only for superadmin (already checked above)
  if (routeKey === 'team') return false;
  
  // If user has access to the resource, they can add, view, AND edit
  return allowedRoutes.includes(routeKey);
};

export default function Sidebar() {
  const pathname = usePathname();
  const { role: userRole } = useAuth();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [openNestedDropdown, setOpenNestedDropdown] = useState<string | null>(
    null
  );

  const toggleDropdown = (name: string) => {
    setOpenDropdown(openDropdown === name ? null : name);
  };

  const toggleNestedDropdown = (label: string) => {
    setOpenNestedDropdown(openNestedDropdown === label ? null : label);
  };

  // Filter navLinks based on user role
  const filteredNavLinks = navLinks.filter((link) => {
    return hasAccessToRoute(link.name, userRole);
  });

  if (
    pathname === "/en/properties/add-new" ||
    pathname === "/es/properties/add-new" ||
    pathname === "/fr/properties/add-new" ||
    pathname === "/en/properties/edit" ||
    pathname === "/es/properties/edit" ||
    pathname === "/fr/properties/edit"
  )
    return null;
  return (
    <aside className="custom-scrollbar pb-4 w-60 bg-primary text-white flex flex-col h-[calc(100vh-84px)] overflow-y-auto py-3">
      <nav className="flex-1">
        <ul className="space-y-1">
          {filteredNavLinks.map(({ name, href, icon, subLinks },index) => {
            const isActive =
              pathname === href ||
              pathname.startsWith(`${href}/`) ||
              pathname.includes(`${href}?`);

            const isDashboard = name === "Dashboard";
            const isDirectLink = !subLinks || subLinks.length === 0;
            const isOpen = openDropdown === name;

            return (
              <li key={index}>
                {isDashboard || isDirectLink ? (
                  <Link
                    href={href}
                    className={`flex items-center justify-between gap-2 px-6 py-2 rounded-r-2xl transition-colors duration-200 cursor-pointer ${isActive
                      ? "bg-white/10"
                      : "hover:bg-white/10 text-white/80"
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      <Image
                        src={icon}
                        alt={`${name} icon`}
                        width={18}
                        height={18}
                        className="shrink-0"
                      />
                      <span
                        className={`${isActive
                          ? "bg-clip-text text-transparent font-semibold"
                          : "font-medium"
                          }`}
                        style={
                          isActive
                            ? {
                                background:
                                  "linear-gradient(65.62deg, #A2913E 19.62%, #D7C590 40.13%, #A2913E 53.89%, #D7C58F 76.06%)",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                              }
                            : {}
                        }
                      >
                        {name}
                      </span>
                    </div>
                  </Link>
                ) : (
                  <div
                    onClick={() => toggleDropdown(name)}
                    className={`flex items-center justify-between gap-2 px-6 py-2 rounded-r-2xl transition-colors duration-200 cursor-pointer ${isActive
                      ? "bg-white/10"
                      : "hover:bg-white/10 text-white/80"
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      <Image
                        src={icon}
                        alt={`${name} icon`}
                        width={18}
                        height={18}
                        className="shrink-0"
                      />
                      <span
                        className={`${isActive
                          ? "bg-clip-text text-transparent font-semibold"
                          : "font-medium"
                          }`}
                        style={
                          isActive
                            ? {
                                background:
                                  "linear-gradient(65.62deg, #A2913E 19.62%, #D7C590 40.13%, #A2913E 53.89%, #D7C58F 76.06%)",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                              }
                            : {}
                        }
                      >
                        {name}
                      </span>
                    </div>

                    <Image
                      src="/icons/arrow-up.svg"
                      alt="arrow"
                      width={14}
                      height={14}
                      className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""
                        }`}
                    />
                  </div>
                )}

                {!isDashboard && !isDirectLink && isOpen && subLinks && (
                  <ul className="ml-12 mt-1 space-y-1 text-white/80 w-[78%]">
                    {subLinks.map(({ label, href, subSubLinks }) => {
                      const isNestedOpen = openNestedDropdown === label;
                      return (
                        <li key={label}>
                          <div
                            onClick={() =>
                              subSubLinks && toggleNestedDropdown(label)
                            }
                            className={`flex justify-between items-center cursor-pointer py-1 px-5 rounded-lg ${isUrlActive(pathname, href)
                              ? "bg-white/10 backdrop-blur-2xl"
                              : "hover:text-white"
                              }`}
                          >
                            {!subSubLinks ? (
                              <Link href={href} className="block w-full">
                                {label}
                              </Link>
                            ) : (
                              <span>{label}</span>
                            )}

                            {subSubLinks && (
                              <Image
                                src="/icons/arrow-up.svg"
                                alt="arrow"
                                width={12}
                                height={12}
                                className={`transition-transform duration-200 ${isNestedOpen ? "rotate-180" : ""
                                  }`}
                              />
                            )}
                          </div>

                          {subSubLinks && isNestedOpen && (
                            <ul className="ml-6 mt-1 space-y-1 text-white/60">
                              {subSubLinks.map(({ label, href }) => (
                                <li key={label}>
                                  <Link
                                    href={href}
                                    className={`block py-1 px-2 rounded ${isUrlActive(pathname, href)
                                      ? "bg-gray-400 text-black"
                                      : "hover:text-white"
                                      }`}
                                  >
                                    {label}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
