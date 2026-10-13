"use client";

import OffPlanCard from "@/components/dashboard/OffPlanCard";
import { formatFullDate } from "@/utils/dateHelper";
import Link from "next/link";
import ListingCard from "@/components/dashboard/ListingCard";
import RecentProperties from "@/components/dashboard/RecentProperties";
import DashboardCard from "@/components/dashboard/DashboardCard";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import RouteGuard from "@/components/auth/RouteGuard";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { apiUrl } from "@/utils/apiUrl";

export default function Home() {
  const today = formatFullDate();
  const { user, isAuthenticated } = useAuth();
  const adminName = user?.name || "Admin";
  const [stats, setStats] = useState({
    totalListings: 0,
    newsletterSubscribers: 0,
    recentInteractions: 0,
    totalVisitors: 0,
    leadsGenerated: 0,
    conversionRate: 0,
    emailsSent: 0,
  });
  const [offPlanProjects, setOffPlanProjects] = useState<any[]>([]);
  const [recentProperties, setRecentProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardData();
    }
  }, [isAuthenticated]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");
      if (!token) {
        setLoading(false);
        return;
      }

      // Fetch dashboard stats
      const statsResponse = await fetch(apiUrl("/api/analytics/dashboard"), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        if (statsData.success && statsData.data) {
          const data = statsData.data;
          setStats((prev) => ({
            ...prev,
            totalListings: data.overview?.totalProperties || 0,
            recentInteractions: data.overview?.totalContacts || 0,
          }));

          // Note: Recent properties are fetched and transformed separately below
          // to ensure proper data transformation and avoid object rendering issues
        }
      }

      // Fetch marketing analytics (for visitors, leads, conversion rate, emails)
      const marketingResponse = await fetch(
        apiUrl("/api/analytics/marketing?range=This Month"),
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (marketingResponse.ok) {
        const marketingData = await marketingResponse.json();
        if (marketingData.success && marketingData.data?.cards) {
          const cards = marketingData.data.cards;
          setStats((prev) => ({
            ...prev,
            totalVisitors: cards.visitors || 0,
            leadsGenerated: cards.leads || 0,
            conversionRate: cards.rate || 0,
            emailsSent: cards.emails || 0,
          }));
        }
      }

      // Fetch newsletter subscribers count
      const subscriptionResponse = await fetch(apiUrl("/api/subscribe"), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (subscriptionResponse.ok) {
        const subscriptionData = await subscriptionResponse.json();
        if (subscriptionData.success) {
          setStats((prev) => ({
            ...prev,
            newsletterSubscribers: subscriptionData.count || 0,
          }));
        }
      }

      // Fetch featured off-plan projects
      const offPlanResponse = await fetch(
        apiUrl("/api/offplans/featured?limit=6&locale=en"),
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (offPlanResponse.ok) {
        const offPlanData = await offPlanResponse.json();
        if (offPlanData.success && offPlanData.data) {
          // Transform off-plan data to match OffPlanCard format
          const transformed = Array.isArray(offPlanData.data)
            ? offPlanData.data.map((project: any) => {
              const title = typeof project.title === 'string'
                ? project.title
                : (project.title?.en || project.title?.fr || project.title?.es || "");
              const location = typeof project.location === 'string'
                ? project.location
                : (project.location?.en || project.location?.fr || project.location?.es || "");

              return {
                id: project._id || project.id,
                title: title, // Use title for OffPlanCard
                name_en: project.title?.en || title,
                name_es: project.title?.es,
                name_fr: project.title?.fr,
                developer: project.developer || "",
                location: location,
                type: project.type || "",
                handover: project.handover || "",
                priceFrom: project.priceFrom || "N/A",
                paymentPlan: project.paymentPlan || "",
                bedRange: project.bedRange || "N/A",
                bathRange: project.bathRange || "N/A",
                sizeRange: project.sizeRange || "N/A",
                status: project.status || "Available",
                progress: 0, // Not available in model
                units: 0, // Not available in model
                price: project.priceFrom || "N/A",
                image: project.image || "/images/data.jpg",
              };
            })
            : [];
          setOffPlanProjects(transformed);
        }
      }

      // Fetch recent properties for listing board
      const recentPropsResponse = await fetch(
        apiUrl("/api/properties?page=1&limit=5&locale=en"),
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (recentPropsResponse.ok) {
        const recentPropsData = await recentPropsResponse.json();
        if (recentPropsData.success && recentPropsData.data?.items) {
          // Helper function to safely extract string from object or return string
          const extractString = (value: any): string => {
            if (!value) return "";
            if (typeof value === 'string') return value;
            if (typeof value === 'object' && value !== null) {
              // Handle multi-language object
              if (value.en) return String(value.en);
              if (value.fr) return String(value.fr);
              if (value.es) return String(value.es);
              // If it's an array, join it
              if (Array.isArray(value)) return value.join(", ");
              // If it has a toString method, use it
              if (typeof value.toString === 'function') return value.toString();
            }
            return String(value || "");
          };

          // Helper function to safely extract number
          const extractNumber = (value: any): number => {
            if (typeof value === 'number') return value;
            if (typeof value === 'string') {
              const parsed = parseFloat(value);
              return isNaN(parsed) ? 0 : parsed;
            }
            if (typeof value === 'object' && value !== null) {
              if (typeof value.en === 'number') return value.en;
              if (typeof value.fr === 'number') return value.fr;
              if (typeof value.es === 'number') return value.es;
            }
            return 0;
          };

          // Transform properties for ListingCard
          const transformed = recentPropsData.data.items.map((prop: any) => {
            // Extract all values safely
            const location = extractString(prop.location);
            const priceValue = extractNumber(prop.price);
            const sizeValue = extractNumber(prop.size);
            const beds = extractNumber(prop.beds);
            const baths = extractNumber(prop.baths);
            const image = extractString(prop.image) || "/images/data.jpg";

            // Format price
            const price = priceValue > 0
              ? `AED ${priceValue.toLocaleString()}`
              : "N/A";

            // Format area
            const area = sizeValue > 0
              ? `${sizeValue} sqft`
              : "N/A";

            // Format date
            let listedTime = "N/A";
            if (prop.createdAt) {
              try {
                listedTime = new Date(prop.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
              } catch (e) {
                listedTime = "N/A";
              }
            }

            // Create the transformed object - ensure all values are primitives
            const transformedProperty = {
              id: String(prop._id || prop.id || Math.random()),
              image: String(image || "/images/data.jpg"),
              price: String(price || "N/A"),
              listedTime: String(listedTime || "N/A"),
              location: String(location || ""),
              beds: Number(beds) || 0,
              baths: Number(baths) || 0,
              area: String(area || "N/A"),
            };

            // Final validation - recursively check and convert any objects to strings
            const sanitizeValue = (val: any): any => {
              if (val === null || val === undefined) return "";
              if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
                return val;
              }
              if (Array.isArray(val)) {
                return val.map(sanitizeValue).join(", ");
              }
              if (typeof val === 'object') {
                // If it's a multi-language object, extract the first available language
                if (val.en !== undefined) return String(val.en);
                if (val.fr !== undefined) return String(val.fr);
                if (val.es !== undefined) return String(val.es);
                // Otherwise, stringify it
                return JSON.stringify(val);
              }
              return String(val);
            };

            const validatedProperty: any = {};
            for (const [key, value] of Object.entries(transformedProperty)) {
              validatedProperty[key] = sanitizeValue(value);
            }

            return validatedProperty;
          });
          setRecentProperties(transformed);
        }
      }
    } catch (err: any) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <RouteGuard>
        <LoadingSpinner fullPage message="Loading dashboard..." />
      </RouteGuard>
    );
  }

  return (
    <RouteGuard>
      <div className="min-h-screen text-black/70 py-4">
        <div className="flex gap-3">
          <h1 className="font-bold text-3xl">Welcome Back, {adminName} </h1>
        {/* <Image src="/icons/wave.svg" alt="hi" width={28} height={28} /> */}
      </div>

      <p className="font-medium text-[#7E7E7E] text-lg">{today}</p>

      {/* Dashboard Stats */}
      <div className="flex mt-6 gap-4 text-white/90">
        <DashboardCard title="Total Listings" value={stats.totalListings} />
        <div
          className="relative w-[250px] h-[140px] rounded-[14px] overflow-hidden flex flex-col p-6"
          style={{
            background:
              "linear-gradient(55.62deg, #A2913E 19.62%, #b5a77b 40.13%, #A2913E 53.89%, #b8ab85 76.06%)",
          }}
        >
          <p className="text-lg font-semibold">Newsletter Subscribers</p>
          <p className="font-semibold mt-4 text-4xl">{stats.newsletterSubscribers}</p>
        </div>
        <DashboardCard title="Recent Interactions" value={stats.recentInteractions} />
      </div>

      {/* More Stats */}
      <div className="flex my-6 gap-4 text-white/90">
        <div className="bg-secondary w-[200px] h-[140px] rounded-[14px] px-6 py-6 space-y-4">
          <p className="font-medium">Total Visitors</p>
          <p className="font-medium text-4xl">{stats.totalVisitors.toLocaleString()}</p>
        </div>
        <div className="bg-secondary w-[200px] h-[140px] rounded-[14px] px-6 py-6 space-y-4">
          <p className="font-medium">Leads Generated</p>
          <p className="font-medium text-4xl">{stats.leadsGenerated.toLocaleString()}</p>
        </div>
        <div className="bg-secondary w-[200px] h-[140px] rounded-[14px] px-6 py-6 space-y-4">
          <p className="font-medium">Conversion Rate</p>
          <p className="font-medium text-4xl">{stats.conversionRate}%</p>
        </div>
        <div className="bg-secondary w-[200px] h-[140px] rounded-[14px] px-6 py-6 space-y-4">
          <p className="font-medium">Emails Sent</p>
          <p className="font-medium text-4xl">{stats.emailsSent.toLocaleString()}</p>
        </div>
      </div>

      {/* Off Plan Properties */}
      <div className="w-full flex mt-10 justify-between gap-2">
        <div className="w-[75%] flex flex-col text-white/90">
          <div
            className="px-4 pb-4 pt-6 rounded-[14px]"
            style={{
              background:
                "linear-gradient(110.47deg, #2B7FFF 0%, #1A4C99 99.05%)",
            }}
          >
            <h3 className="font-semibold text-2xl mb-2">Off Plan Projects</h3>
            {offPlanProjects.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {offPlanProjects.map((property) => (
                    <OffPlanCard key={property.id} isDashbaordView={true} property={property} />
                  ))}
                </div>
                <div className="flex justify-center">
                  <Link
                    href={`/en/properties/buy?type=offplan`}
                    className="underline mx-auto mt-3"
                  >
                    View All
                  </Link>
                </div>
              </>
            ) : (
              <p className="text-center py-4">No off-plan projects available</p>
            )}
          </div>
          <div className="mt-4">
            <RecentProperties properties={recentProperties.map((prop: any) => ({
              id: prop._id || prop.id,
              image: prop.image || "/images/data.jpg",
              title: prop.title?.en || prop.title || "",
              location: prop.location?.en || prop.location || "",
              price: prop.price ? `AED ${prop.price.toLocaleString()}` : "N/A",
              status: "Available",
            }))} />
          </div>
        </div>
        <div className="w-[24%] bg-white px-3 py-2 rounded-[14px]">
          <h3 className="font-semibold text-2xl mb-2">Listing Board</h3>
          <div className="flex mb-2 justify-between">
            <button className="bg-secondary px-4 py-1 text-xs rounded-lg text-white/90 cursor-pointer bg-[#F3F3F3]">
              Recent Listed
            </button>
            <button className="px-4 py-1 text-xs rounded-lg cursor-pointer bg-[#F3F3F3]">
              Pending List
            </button>
          </div>

          {recentProperties.length > 0 ? (
            <>
              {recentProperties.map((property, index) => (
                <div key={property.id || `property-${index}`} className="mb-3">
                  <ListingCard property={property} />
                </div>
              ))}
              <div className="flex justify-center mt-9">
                <Link
                  href="/en/properties/buy"
                  className="text-secondary hover:text-secondary/80 underline text-sm font-medium"
                >
                  View All
                </Link>
              </div>
            </>
          ) : (
            <p className="text-center py-4 text-gray-500 text-sm">No recent listings</p>
          )}
        </div>
      </div>
      </div>
    </RouteGuard>
  );
}
