"use client";
import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import RouteGuard from "@/components/auth/RouteGuard";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import TeamBasicInfoForm from "@/components/team/TeamBasicInfoForm";
import TeamSliderSection from "@/components/team/TeamSliderSection";
import TeamMembersSection from "@/components/team/TeamMembersSection";

interface TeamBasicInfoData {
  owner: {
    name: string;
    role: string;
    description: { en: string; fr: string; es: string };
    image: string;
  };
  title: { en: string; fr: string; es: string };
  description: { en: string; fr: string; es: string };
}

export default function TeamPage() {
  const { role, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [teamBasicData, setTeamBasicData] = useState<TeamBasicInfoData | null>(
    null
  );

  useEffect(() => {
    if (isAuthenticated && role === "superadmin") {
      fetchTeamBasicData();
    }
  }, [isAuthenticated, role]);

  const fetchTeamBasicData = async () => {
    try {
      setLoading(true);
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const token = localStorage.getItem("adminToken");
      
      // Fetch full multilingual data (without locale to get all languages)
      const response = await fetch(`${API_URL}/api/team`, {
        headers: token ? {
          Authorization: `Bearer ${token}`,
        } : {},
      });

      const data = await response.json();

      if (data.success && data.data) {
        const team = data.data;
        // Ensure we have the full multilingual structure
        setTeamBasicData({
          owner: {
            name: team.owner?.name || "",
            role: team.owner?.role || "",
            description: typeof team.owner?.description === 'object' 
              ? {
                  en: team.owner?.description?.en || "",
                  fr: team.owner?.description?.fr || "",
                  es: team.owner?.description?.es || "",
                }
              : {
                  en: "",
                  fr: "",
                  es: "",
                },
            image: team.owner?.image || "",
          },
          title: typeof team.title === 'object'
            ? {
                en: team.title?.en || "",
                fr: team.title?.fr || "",
                es: team.title?.es || "",
              }
            : { en: "", fr: "", es: "" },
          description: typeof team.description === 'object'
            ? {
                en: team.description?.en || "",
                fr: team.description?.fr || "",
                es: team.description?.es || "",
              }
            : { en: "", fr: "", es: "" },
        });
      } else if (response.status === 404) {
        // Team data doesn't exist yet, keep default null
      }
    } catch (err: any) {
      console.error("Error fetching team data:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <RouteGuard>
        <div className="text-black/80">
          <p className="mb-1 text-sm">Tableau de bord / Notre équipe</p>
          <h1 className="font-bold text-4xl">Gestion de l'équipe</h1>
          <LoadingSpinner message="Chargement des données de l'équipe..." />
        </div>
      </RouteGuard>
    );
  }

  if (role !== "superadmin") {
    return (
      <RouteGuard>
        <div className="text-black/80 p-4 min-h-[400px]">
          <div className="max-w-2xl mx-auto mt-8">
            <div className="p-6 bg-red-50 border border-red-200 rounded-lg shadow-sm">
              <div className="flex items-start gap-4">
                <div className="shrink-0">
                  <svg
                    className="h-6 w-6 text-red-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-red-800 mb-2">
                    Accès refusé
                  </h3>
                  <p className="text-red-700 mb-4">
                    Vous n'avez pas la permission d'accéder à cette page. Seul
                    le superadmin peut gérer les données de l'équipe.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </RouteGuard>
    );
  }

  return (
    <RouteGuard>
      <div className="text-black/80">
        <p className="mb-1 text-sm">Tableau de bord / Notre équipe</p>
        <h1 className="font-bold text-4xl">Gestion de l'équipe</h1>
        <p className="text-gray-600 text-sm max-w-lg mt-2">
          Gérez les membres de l'équipe par département. Ajoutez, modifiez ou supprimez les profils
          affichés sur le site Web.
        </p>

        <div className="mt-6 space-y-6">
          {/* CEO Section, Title, Description Form */}
          <TeamBasicInfoForm initialData={teamBasicData} locale="fr" />

          {/* Team Slider Section */}
          <TeamSliderSection />

          {/* Team Members Section */}
          <TeamMembersSection />
        </div>
      </div>
    </RouteGuard>
  );
}
