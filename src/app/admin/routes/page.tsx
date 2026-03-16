"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, Map, Edit, Trash2, ArrowRight, XCircle } from "lucide-react";

interface Route {
    id: string;
    origin: string;
    destination: string;
    base_price: number;
    estimated_duration: string;
    is_active: boolean;
}

export default function RouteManagementPage() {
    const [routes, setRoutes] = useState<Route[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        origin: "TP. Vung Tau",
        destination: "TP. Ho Chi Minh",
        base_price: 250000,
        estimated_duration: "03h 00m"
    });

    useEffect(() => {
        fetchRoutes();
    }, []);

    const fetchRoutes = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('routes')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) console.error('Error fetching routes:', error);
        else setRoutes(data || []);
        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const { error } = await supabase
            .from('routes')
            .insert([{
                ...formData,
                is_active: true
            }]);

        if (error) {
            alert("Error adding route: " + error.message);
        } else {
            setShowModal(false);
            fetchRoutes();
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure? deleting a route will cascade delete all trips!")) return;

        const { error } = await supabase.from('routes').delete().eq('id', id);
        if (error) alert("Error deleting: " + error.message);
        else fetchRoutes();
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Route Configuration</h1>
                    <p className="text-gray-500">Define standard routes and base prices.</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors"
                >
                    <Plus size={20} /> Add Route
                </button>
            </div>

            {/* List */}
            {loading ? (
                <div className="text-center py-10">Loading routes...</div>
            ) : routes.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
                    <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Map size={32} className="text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">No routes defined</h3>
                    <p className="text-gray-500 mb-6">Create your first transport route.</p>
                    <button
                        onClick={() => setShowModal(true)}
                        className="text-blue-600 font-medium hover:underline"
                    >
                        Add New Route
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {routes.map((route) => (
                        <div key={route.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>

                            <div className="pl-4">
                                <div className="flex items-center gap-3 text-xl font-bold text-gray-900 mb-2">
                                    {route.origin} <ArrowRight size={20} className="text-gray-400" /> {route.destination}
                                </div>
                                <div className="flex gap-6 text-sm text-gray-600 mb-4">
                                    <div className="bg-green-50 text-green-700 px-2 py-1 rounded font-medium">
                                        {route.base_price.toLocaleString()} ₫
                                    </div>
                                    <div className="flex items-center gap-1">
                                        ⏱ {route.estimated_duration}
                                    </div>
                                </div>

                                <div className="flex gap-2 justify-end">
                                    <button
                                        onClick={() => handleDelete(route.id)}
                                        className="text-red-500 hover:bg-red-50 p-2 rounded"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">Add New Route</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                <XCircle size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Origin</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                        value={formData.origin}
                                        onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                        value={formData.destination}
                                        onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Base Price (VND)</label>
                                <input
                                    type="number"
                                    required
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    value={formData.base_price}
                                    onChange={(e) => setFormData({ ...formData, base_price: parseInt(e.target.value) })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Travel Duration</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. 02h 30m"
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    value={formData.estimated_duration}
                                    onChange={(e) => setFormData({ ...formData, estimated_duration: e.target.value })}
                                />
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                                >
                                    Save Route
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
