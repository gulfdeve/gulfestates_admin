"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface RedirectEntry {
  _id: string;
  locale: "en" | "fr" | "es";
  oldSlug: string;
  createdAt: string;
}

export default function RedirectsManager({
  entityType,
  entityId,
}: {
  entityType: "offplan" | "property";
  entityId: string;
}) {
  const [redirects, setRedirects] = useState<RedirectEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSlug, setNewSlug] = useState("");
  const [newLocale, setNewLocale] = useState<"en" | "fr" | "es">("en");
  const [saving, setSaving] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
  });

  const fetchRedirects = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/redirects/${entityType}/${entityId}`, {
        headers: authHeaders(),
      });
      const json = await res.json();
      setRedirects(json.success ? json.data : []);
    } catch (err) {
      console.error("Failed to load redirects:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (entityType && entityId) fetchRedirects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityType, entityId]);

  const handleAdd = async () => {
    if (!newSlug.trim()) return;
    try {
      setSaving(true);
      const res = await fetch(`${API_URL}/api/redirects/${entityType}/${entityId}`, {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ oldSlug: newSlug.trim(), locale: newLocale }),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.message || "Failed to add redirect");
        return;
      }
      toast.success("Redirect added");
      setNewSlug("");
      fetchRedirects();
    } catch (err) {
      toast.error("Failed to add redirect");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (redirectId: string) => {
    try {
      const res = await fetch(
        `${API_URL}/api/redirects/${entityType}/${entityId}/${redirectId}`,
        { method: "DELETE", headers: authHeaders() }
      );
      const json = await res.json();
      if (!json.success) {
        toast.error(json.message || "Failed to delete redirect");
        return;
      }
      setRedirects((prev) => prev.filter((r) => r._id !== redirectId));
    } catch (err) {
      toast.error("Failed to delete redirect");
      console.error(err);
    }
  };

  return (
    <div className="mb-6">
      <h2 className="text-2xl font-semibold text-primary mb-4">Redirects</h2>
      <p className="text-sm text-gray-500 mb-4">
        Old URLs that automatically forward to this listing's current page. Entries here are
        added automatically whenever the slug changes above, or you can add old URLs manually.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="text"
          value={newSlug}
          onChange={(e) => setNewSlug(e.target.value)}
          placeholder="Old slug, e.g. moonsa-residences"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none"
        />
        <select
          value={newLocale}
          onChange={(e) => setNewLocale(e.target.value as "en" | "fr" | "es")}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none"
        >
          <option value="en">EN</option>
          <option value="fr">FR</option>
          <option value="es">ES</option>
        </select>
        <button
          type="button"
          onClick={handleAdd}
          disabled={saving || !newSlug.trim()}
          className="px-4 py-2 bg-primary text-white rounded-md disabled:opacity-50"
        >
          {saving ? "Adding..." : "Add Redirect"}
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading redirects...</p>
      ) : redirects.length === 0 ? (
        <p className="text-sm text-gray-500">No redirects yet.</p>
      ) : (
        <ul className="divide-y divide-gray-200 border border-gray-200 rounded-md">
          {redirects.map((r) => (
            <li key={r._id} className="flex items-center justify-between px-3 py-2 text-sm">
              <span>
                <span className="uppercase text-gray-400 mr-2">{r.locale}</span>
                {r.oldSlug}
              </span>
              <button
                type="button"
                onClick={() => handleDelete(r._id)}
                className="text-red-500 hover:text-red-700"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
