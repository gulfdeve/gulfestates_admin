"use client";
import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useRouter, useParams } from "next/navigation";
import { formatSalaryForDisplay, parseSalaryInput } from "@/utils/salaryFormat";
import LoadingSpinner from "@/components/common/LoadingSpinner";

const JoditEditor = dynamic(() => import("jodit-react"), {
    ssr: false,
});

export default function EditJob() {
    const router = useRouter();
    const params = useParams();
    const jobId = params.id as string;
    const editor = useRef(null);

    // Form fields - English only
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [location, setLocation] = useState("On-site");
    const [type, setType] = useState("Full Time");
    const [status, setStatus] = useState("Open");
    const [department, setDepartment] = useState("");
    const [experience, setExperience] = useState("");
    const [salary, setSalary] = useState("");
    const [salaryDisplay, setSalaryDisplay] = useState("");
    const [seoTitle, setSeoTitle] = useState("");
    const [seoDescription, setSeoDescription] = useState("");

    // UI states
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        if (jobId) {
            fetchJobData();
        }
    }, [jobId]);

    const fetchJobData = async () => {
        try {
            setLoadingData(true);
            const token = localStorage.getItem("adminToken");
            if (!token) {
                setError("Not authenticated");
                setLoadingData(false);
                return;
            }

            const API_URL = process.env.NEXT_PUBLIC_API_URL;
            const response = await fetch(`${API_URL}/api/jobs/${jobId}?admin=true`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                    "x-admin-view": "true",
                },
            });

            const data = await response.json();

            if (data.success && data.data) {
                const job = data.data;
                setTitle(job.title || "");
                setDescription(job.description || "");
                setLocation(job.location || "On-site");
                setType(job.type || "Full Time");
                setStatus(job.status || "Open");
                setDepartment(job.department || "");
                setExperience(job.experience || "");
                const salaryValue = job.salary || "";
                setSalary(salaryValue);
                // If salary is already formatted, use it; otherwise format it
                setSalaryDisplay(salaryValue.includes("M") ? salaryValue : (salaryValue ? formatSalaryForDisplay(salaryValue) : ""));
                setSeoTitle(job.seo?.title || "");
                setSeoDescription(job.seo?.description || "");
            } else {
                setError("Failed to load job data");
            }
        } catch (err: any) {
            setError("Error loading job data");
            console.error("Error fetching job:", err);
        } finally {
            setLoadingData(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (!title || !description) {
            setError("Title and description are required");
            return;
        }

        try {
            setLoading(true);
            const token = localStorage.getItem("adminToken");
            if (!token) {
                setError("Not authenticated");
                return;
            }

            const jobData = {
                title,
                description,
                location,
                type,
                status,
                department: department || undefined,
                experience: experience || undefined,
                salary: salaryDisplay || salary || undefined,
                seo: seoTitle || seoDescription ? {
                    title: seoTitle || undefined,
                    description: seoDescription || undefined,
                } : undefined,
            };

            const API_URL = process.env.NEXT_PUBLIC_API_URL;
            const response = await fetch(`${API_URL}/api/jobs/${jobId}`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(jobData),
            });

            const data = await response.json();

            if (data.success) {
                setSuccess("Job updated successfully!");
                setTimeout(() => {
                    router.push("/en/jobs/manage-jobs");
                }, 1500);
            } else {
                setError(data.message || "Failed to update job");
            }
        } catch (err: any) {
            setError("Error updating job");
            console.error("Error updating job:", err);
        } finally {
            setLoading(false);
        }
    };

    if (loadingData) {
        return (
            <div className="text-black/80">
                <p className="mb-1 text-sm">Jobs / Edit Job</p>
                <h1 className="font-semibold text-3xl">Edit Job</h1>
                <LoadingSpinner message="Loading job data..." />
            </div>
        );
    }

    return (
        <div className="text-black/80">
            <p className="mb-1 text-sm">Jobs / Edit Job</p>
            <h1 className="font-semibold text-3xl">Edit Job</h1>

            <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-red-600 text-sm">{error}</p>
                    </div>
                )}

                {success && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                        <p className="text-green-600 text-sm">{success}</p>
                    </div>
                )}

                {/* English Fields Only */}
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h2 className="text-xl font-semibold mb-4">Job Content (English)</h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Title *
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description *
                            </label>
                            <JoditEditor
                                ref={editor}
                                value={description}
                                onBlur={(newContent) => setDescription(newContent)}
                                onChange={(newContent) => setDescription(newContent)}
                            />
                        </div>
                    </div>
                </div>

                {/* Job Details */}
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h2 className="text-xl font-semibold mb-4">Job Details</h2>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Location *
                            </label>
                            <select
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            >
                                <option value="On-site">On-site</option>
                                <option value="Remote">Remote</option>
                                <option value="Hybrid">Hybrid</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Type *
                            </label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            >
                                <option value="Full Time">Full Time</option>
                                <option value="Part Time">Part Time</option>
                                <option value="Contract">Contract</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Status *
                            </label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            >
                                <option value="Open">Open</option>
                                <option value="Closed">Closed</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Department
                            </label>
                            <input
                                type="text"
                                value={department}
                                onChange={(e) => setDepartment(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Experience
                            </label>
                            <select
                                value={experience}
                                onChange={(e) => setExperience(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">Select Experience</option>
                                <option value="Entry Level">Entry Level</option>
                                <option value="Mid Level">Mid Level</option>
                                <option value="Senior">Senior</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Salary
                            </label>
                            <input
                                type="text"
                                value={salaryDisplay}
                                onChange={(e) => {
                                    const input = e.target.value;
                                    setSalaryDisplay(input);
                                    // Parse the input to get the numeric value
                                    const parsed = parseSalaryInput(input);
                                    setSalary(parsed);
                                }}
                                onBlur={(e) => {
                                    // Format for display when user leaves the field
                                    if (salary) {
                                        setSalaryDisplay(formatSalaryForDisplay(salary));
                                    }
                                }}
                                placeholder="e.g., 1550000 or 1.55 (for 1.55M)"
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            {salary && (
                                <p className="mt-1 text-sm text-gray-500">
                                    Will display as: {formatSalaryForDisplay(salary)}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* SEO Settings */}
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h2 className="text-xl font-semibold mb-4">SEO Settings (Optional)</h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                SEO Title
                            </label>
                            <input
                                type="text"
                                value={seoTitle}
                                onChange={(e) => setSeoTitle(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                SEO Description
                            </label>
                            <textarea
                                value={seoDescription}
                                onChange={(e) => setSeoDescription(e.target.value)}
                                rows={4}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex justify-end gap-4">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? "Updating..." : "Update Job"}
                    </button>
                </div>
            </form>
        </div>
    );
}

