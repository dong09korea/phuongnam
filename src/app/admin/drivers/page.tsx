"use client";

import { useState, useEffect } from "react";
import { getDrivers, createDriver, deleteDriver } from "@/lib/api";
import { Plus, UserSquare, Edit, Trash2, Phone, CreditCard, CheckCircle, XCircle } from "lucide-react";

interface Driver {
    id: string;
    driver_name: string;
    phone: string;
    license_info: string;
    active: boolean;
}

export default function DriverManagementPage() {
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        license_number: "",
        status: "active"
    });

    useEffect(() => {
        fetchDrivers();
    }, []);

    const fetchDrivers = async () => {
        setLoading(true);
        try {
            const data = await getDrivers();
            setDrivers(data || []);
        } catch (error) {
            console.error('Error fetching drivers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            await createDriver({
                driver_name: formData.name,
                phone: formData.phone,
                license_info: formData.license_number,
                active: formData.status === "active"
            });
            setShowModal(false);
            setFormData({ name: "", phone: "", license_number: "", status: "active" });
            fetchDrivers();
        } catch (error: any) {
            alert("Error adding driver: " + error.message);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this driver?")) return;

        try {
            await deleteDriver(Number(id));
            fetchDrivers();
        } catch (error: any) {
            alert("Error deleting: " + error.message);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Driver Management</h1>
                    <p className="text-gray-500">Manage your drivers and staff.</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors"
                >
                    <Plus size={20} /> Add Driver
                </button>
            </div>

            {/* List */}
            {loading ? (
                <div className="text-center py-10">Loading drivers...</div>
            ) : drivers.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
                    <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <UserSquare size={32} className="text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">No drivers found</h3>
                    <p className="text-gray-500 mb-6">Register your first driver to the system.</p>
                    <button
                        onClick={() => setShowModal(true)}
                        className="text-blue-600 font-medium hover:underline"
                    >
                        Add New Driver
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {drivers.map((driver) => (
                        <div key={driver.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-bold text-lg">
                                        {driver.driver_name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900">{driver.driver_name}</h3>
                                        <div className={`text-xs inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${driver.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                            }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${driver.active ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                                            {driver.active ? 'active' : 'inactive'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2 text-sm text-gray-600 mb-4">
                                <div className="flex items-center gap-2">
                                    <Phone size={14} className="text-gray-400" />
                                    {driver.phone}
                                </div>
                                <div className="flex items-center gap-2">
                                    <CreditCard size={14} className="text-gray-400" />
                                    License: {driver.license_info || "N/A"}
                                </div>
                            </div>

                            <div className="flex gap-2 pt-4 border-t border-gray-100">
                                <button className="flex-1 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded flex items-center justify-center gap-1">
                                    <Edit size={16} /> Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(driver.id)}
                                    className="flex-1 py-2 text-sm text-red-600 hover:bg-red-50 rounded flex items-center justify-center gap-1"
                                >
                                    <Trash2 size={16} /> Delete
                                </button>
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
                            <h2 className="text-xl font-bold">Add New Driver</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                <XCircle size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Nguyen Van A"
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                <input
                                    type="tel"
                                    required
                                    placeholder="e.g. 0901234567"
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">License Number</label>
                                <input
                                    type="text"
                                    placeholder="Optional"
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none uppercase"
                                    value={formData.license_number}
                                    onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                >
                                    <option value="active">Active (On Duty)</option>
                                    <option value="off_duty">Off Duty</option>
                                    <option value="terminated">Terminated</option>
                                </select>
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
                                    Save Driver
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
