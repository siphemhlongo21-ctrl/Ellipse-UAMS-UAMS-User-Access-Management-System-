// UpdateRequest.tsx
// Task 7644: System Admin can update requests on behalf of employees

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthProvider";
import { getRequest, updateRequest } from "../api/requestsApi";
import type { RequestDetails } from "../api/types";

const UpdateRequest: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { session } = useAuth();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [formData, setFormData] = useState<RequestDetails | null>(null);

    useEffect(() => {
        const fetchRequest = async () => {
            try {
                const data = await getRequest(parseInt(id || "0"));
                setFormData(data);
            } catch (err: any) {
                setError(err.message || "Failed to load request");
            } finally {
                setLoading(false);
            }
        };
        fetchRequest();
    }, [id]);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        if (!formData) return;
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!formData) return;
        setSubmitting(true);
        setError(null);
        setSuccess(false);

        try {
            await updateRequest(formData);
            setSuccess(true);
            setTimeout(() => navigate("/requests"), 2000);
        } catch (err: any) {
            setError(err.message || "Failed to update request");
        } finally {
            setSubmitting(false);
        }
    };

    // Check if user has SYSTEM_ADMIN role
    const isSystemAdmin = session?.roles?.includes("SYSTEM_ADMIN");

    if (!isSystemAdmin) {
        return (
            <div className="p-6 text-center">
                <p className="text-red-600">Access Denied. System Admin role required.</p>
            </div>
        );
    }

    if (loading) {
        return <div className="p-6 text-center">Loading request...</div>;
    }

    if (!formData) {
        return <div className="p-6 text-center">Request not found.</div>;
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">
                    Update Request: {formData.requestNumber || `#${formData.id}`}
                </h1>
                <span className="text-sm text-gray-500">Status: {formData.status}</span>
            </div>

            {error && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded">
                    <p className="font-medium">Error</p>
                    <p>{error}</p>
                </div>
            )}

            {success && (
                <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 mb-4 rounded">
                    <p className="font-medium">âœ… Success</p>
                    <p>Request updated successfully!</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-semibold mb-2">
                            Request Type *
                        </label>
                        <select
                            name="requestType"
                            value={formData.requestType || ""}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            required
                        >
                            <option value="New Employee">New Employee</option>
                            <option value="Amendment">Amendment</option>
                            <option value="Termination">Termination</option>
                        </select>
                    </div>

                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-semibold mb-2">
                            Environment
                        </label>
                        <select
                            name="environment"
                            value={formData.environment || ""}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        >
                            <option value="">Select Environment</option>
                            <option value="Production">Production</option>
                            <option value="Test">Test</option>
                            <option value="Development">Development</option>
                        </select>
                    </div>

                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-semibold mb-2">
                            User Access Type
                        </label>
                        <select
                            name="userAccessType"
                            value={formData.userAccessType || ""}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        >
                            <option value="Permanent">Permanent</option>
                            <option value="Temporary">Temporary</option>
                        </select>
                    </div>

                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-semibold mb-2">
                            Ellipse Position *
                        </label>
                        <input
                            type="text"
                            name="ellipsePosition"
                            value={formData.ellipsePosition || ""}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            required
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-semibold mb-2">
                            Start Date *
                        </label>
                        <input
                            type="date"
                            name="startDate"
                            value={formData.startDate ? formData.startDate.split("T")[0] : ""}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            required
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-semibold mb-2">
                            End Date
                        </label>
                        <input
                            type="date"
                            name="endDate"
                            value={formData.endDate ? formData.endDate.split("T")[0] : ""}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                    </div>

                    <div className="mb-4 md:col-span-2">
                        <label className="block text-gray-700 text-sm font-semibold mb-2">
                            Requested Date
                        </label>
                        <input
                            type="datetime-local"
                            name="requestedDate"
                            value={formData.requestedDate ? formData.requestedDate.slice(0, 16) : ""}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                    </div>
                </div>

                <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t">
                    <button
                        type="button"
                        onClick={() => navigate("/requests")}
                        className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50"
                    >
                        {submitting ? "Updating..." : "Update Request"}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default UpdateRequest;
