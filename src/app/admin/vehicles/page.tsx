"use client";

import { useState, useEffect } from "react";
import { getVehicles, createVehicle, deleteVehicle } from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";
import { Plus, Bus, Edit, Trash2, CheckCircle, XCircle } from "lucide-react";

interface Vehicle {
    id: string;
    plate_number: string;
    type: string;
    status: string;
    seat_layout: any;
}

export default function VehicleManagementPage() {
    const { t } = useLanguage();
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        plate_number: "",
        type: "Limousine 9",
        status: "active"
    });

    useEffect(() => {
        fetchVehicles();
    }, []);

    const fetchVehicles = async () => {
        setLoading(true);
        try {
            const data = await getVehicles();
            setVehicles(data || []);
        } catch (error) {
            console.error('Error fetching vehicles:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCheckPlate = async (plate: string) => {
        // Quick check if plate exists (simple validation)
        // For now, just uppercase
        setFormData({ ...formData, plate_number: plate.toUpperCase() });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Define standard layouts based on type
        let seatLayout = { rows: 4, total_seats: 9 }; // Default Limo 9
        if (formData.type === "Limousine 12S") seatLayout = { rows: 4, total_seats: 12 };
        if (formData.type === "Van 16") seatLayout = { rows: 5, total_seats: 16 };

        try {
            await createVehicle({
                plate_number: formData.plate_number,
                vehicle_type: formData.type,
                vehicle_name: formData.type, // simplifying for MVP
                seat_count: seatLayout.total_seats,
                luggage_capacity: 10,
                active: formData.status === "active"
            });
            setShowModal(false);
            setFormData({ plate_number: "", type: "Limousine 9", status: "active" });
            fetchVehicles();
        } catch (error: any) {
            alert("Error adding vehicle: " + error.message);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm(t.confirmDeleteVehicle || "Are you sure you want to delete this vehicle?")) return;

        try {
            await deleteVehicle(Number(id));
            fetchVehicles();
        } catch (error: any) {
            alert("Error deleting: " + error.message);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{t.vehicleMgmt || "Vehicle Management"}</h1>
                    <p className="text-gray-500">{t.vehicleMgmtDesc || "Manage your fleet of buses and vans."}</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors"
                >
                    <Plus size={20} /> {t.addVehicle || "Add Vehicle"}
                </button>
            </div>

            {/* Vehicle List */}
            {loading ? (
                <div className="text-center py-10">{t.loadingFleet || "Loading fleet..."}</div>
            ) : vehicles.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
                    <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Bus size={32} className="text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">{t.noVehicles || "No vehicles found"}</h3>
                    <p className="text-gray-500 mb-6">{t.addFirstVehicle || "Get started by adding your first vehicle."}</p>
                    <button
                        onClick={() => setShowModal(true)}
                        className="text-blue-600 font-medium hover:underline"
                    >
                        {t.addNewVehicle || "Add New Vehicle"}
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {vehicles.map((vehicle) => (
                        <div key={vehicle.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div className="bg-blue-50 text-blue-700 p-3 rounded-lg">
                                    <Bus size={24} />
                                </div>
                                <div className={`px-2 py-1 rounded text-xs font-bold uppercase ${vehicle.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                    }`}>
                                    {vehicle.status}
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-1">{vehicle.plate_number}</h3>
                            <p className="text-sm text-gray-500 mb-4">{vehicle.type}</p>

                            <div className="flex gap-2 pt-4 border-t border-gray-100">
                                <button className="flex-1 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded flex items-center justify-center gap-1">
                                    <Edit size={16} /> {t.btnEdit || "Edit"}
                                </button>
                                <button
                                    onClick={() => handleDelete(vehicle.id)}
                                    className="flex-1 py-2 text-sm text-red-600 hover:bg-red-50 rounded flex items-center justify-center gap-1"
                                >
                                    <Trash2 size={16} /> {t.btnDelete || "Delete"}
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
                            <h2 className="text-xl font-bold">{t.addNewVehicle || "Add New Vehicle"}</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                <XCircle size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t.plateNumber || "Plate Number"}</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. 51B-123.45"
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none uppercase"
                                    value={formData.plate_number}
                                    onChange={(e) => handleCheckPlate(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t.vehicleType || "Vehicle Type"}</label>
                                <select
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                >
                                    <option value="Limousine 9">Limousine 9 Seats</option>
                                    <option value="Limousine 12S">Limousine 12 Seats</option>
                                    <option value="Van 16">Transit Van 16 Seats</option>
                                    <option value="Sleeper Bus 40">Sleeper Bus 40</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t.status || "Status"}</label>
                                <select
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                >
                                    <option value="active">Active (Ready)</option>
                                    <option value="maintenance">Maintenance</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                                >
                                    {t.cancel || "Cancel"}
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                                >
                                    {t.saveVehicle || "Save Vehicle"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
