"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

type MainLinkLabel = "Buy" | "Rent";

export default function PropertiesNavbar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const lang = pathname.startsWith("/es")
    ? "es"
    : pathname.startsWith("/fr")
    ? "fr"
    : "en";

  const translations = {
    en: {
      propertiesManagement: "Properties Management",
      addNew: "+ Add New Property",
      export: "Export Listings",
      mainLinks: {
        Buy: "Buy",
        Rent: "Rent",
      },
    },
    es: {
      propertiesManagement: "Gestión de propiedades",
      addNew: "+ Agregar Nueva Propiedad",
      export: "Exportar Listados",
      mainLinks: {
        Buy: "Comprar",
        Rent: "Alquilar",
      },
    },
    fr: {
      propertiesManagement: "Gestion des Propriétés",
      addNew: "+ Ajouter une Nouvelle Propriété",
      export: "Exporter les Annonces",
      mainLinks: {
        Buy: "Acheter",
        Rent: "Louer",
      },
    },
  };

  const mainLinks: { href: string; label: MainLinkLabel }[] = [
    { href: "/properties/buy", label: "Buy" },
    { href: "/properties/rent", label: "Rent" },
  ];

  return (
    <div className="flex flex-col gap-2 text-black/70">
      <div className="space-y-0.5">
        <p>Properties / {pathname.slice(15)}</p>

        <h1 className="font-bold text-3xl text-black/80">
          {translations[lang].propertiesManagement}
        </h1>
      </div>

      {/* Main Tabs */}
      <div className="w-full flex justify-between items-center mt-4">
        <nav className="flex gap-3">
          {mainLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={`/${lang}${href}`}
              className={`rounded-[10px] px-6 py-1 transition ${
                pathname.startsWith(`/${lang}${href}`)
                  ? "font-semibold text-white/90 bg-[url('/images/bg-blue-grad.jpg')] bg-cover bg-center"
                  : "text-gray-600 border"
              }`}
            >
              {translations[lang].mainLinks[label]}
            </Link>
          ))}
        </nav>

        <div className="flex gap-3">
          <Link href={`/${lang}/properties/add-new`}>
            <button className="min-w-40 px-4 h-10 text-sm text-white/90 font-semibold rounded-[10px] cursor-pointer bg-[url('/images/bg-blue-grad.jpg')] bg-cover bg-center">
              {translations[lang].addNew}
            </button>
          </Link>

          <button className="min-w-40 px-4 h-10 text-sm font-semibold rounded-[10px] border cursor-pointer text-black/70">
            {translations[lang].export}
          </button>
        </div>
      </div>
    </div>
  );
}
