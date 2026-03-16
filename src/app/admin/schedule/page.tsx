"use client";

import { useState, useEffect } from "react";
import { getAdminTrips, createAdminTrip, updateAdminTrip, deleteAdminTrip, createAdminSchedule, deleteAdminSchedule, getVehicles, getDrivers, getAdminSchedules } from "@/lib/api";
import { Plus, Calendar, Clock, Bus, User, MapPin, ChevronLeft, ChevronRight, XCircle, Search, CalendarClock, ArrowRight, Trash2, Copy, Settings, Save, CalendarDays } from "lucide-react";

// --- Types ---
interface Trip {
    id: string;
    route_id: string;
    driver_id: string | null;
    vehicle_id: string | null;
    departure_date: string;
    departure_time: string;
    price: number;
    status: string;
    routes?: { origin: string; destination: string; base_price: number };
    vehicles?: { plate_number: string; type: string };
    drivers?: { name: string; phone: string };
}

interface Template {
    id: string;
    route_id: string;
    departure_time: string;
    price: number;
    vehicle_id: string | null;
    routes?: { origin: string; destination: string };
}

interface Resource {
    id: string;
    label: string; // visual label
    subLabel?: string;
}

export default function SchedulePage() {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [trips, setTrips] = useState<Trip[]>([]);
    const [loading, setLoading] = useState(true);

    // Resource Lists for Dropdowns
    const [vehicles, setVehicles] = useState<Resource[]>([]);
    const [drivers, setDrivers] = useState<Resource[]>([]);
    const [routes, setRoutes] = useState<any[]>([]);

    // Modal State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState<Trip | null>(null);
    const [showTemplateModal, setShowTemplateModal] = useState(false);

    // Bulk Gen State
    const [bulkStartDate, setBulkStartDate] = useState(selectedDate);
    const [bulkEndDate, setBulkEndDate] = useState(selectedDate);

    // Templates State
    const [templates, setTemplates] = useState<Template[]>([]);

    // Initial Fetch
    useEffect(() => {
        fetchResources();
    }, []);

    // Fetch trips when date changes
    useEffect(() => {
        fetchTrips(selectedDate);
    }, [selectedDate]);

    const fetchResources = async () => {
        try {
            const vParams = await getVehicles();
            const dParams = await getDrivers();
            const rParams = await getAdminSchedules();

            if (vParams) setVehicles(vParams.map((v: any) => ({ id: v.id, label: v.plate_number, subLabel: v.vehicle_type })));
            if (dParams) setDrivers(dParams.map((d: any) => ({ id: d.id, label: d.driver_name, subLabel: d.phone })));
            if (rParams) setRoutes(rParams);
        } catch (error) {
            console.error("Error fetching resources:", error);
        }
    };

    const fetchTrips = async (date: string) => {
        setLoading(true);
        try {
            const data = await getAdminTrips(date);
            const adapted = data.map((t: any) => {
                const dt = new Date(t.planned_departure_time);
                return {
                    id: t.id.toString(),
                    route_id: t.schedule_id?.toString() || "",
                    departure_time: dt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
                    departure_date: dt.toISOString().split('T')[0],
                    routes: { origin: t.from_location, destination: t.to_location, base_price: 250000 },
                    price: 250000,
                    status: t.current_status,
                    vehicle_id: t.vehicle_id?.toString() || null,
                    driver_id: t.driver_id?.toString() || null,
                    vehicles: t.vehicle ? { plate_number: t.vehicle.plate_number, type: t.vehicle.vehicle_type } : undefined,
                    drivers: t.driver ? { name: t.driver.driver_name, phone: t.driver.phone } : undefined
                };
            });
            setTrips(adapted);
        } catch (error) {
            console.error("Error fetching trips:", error);
        }
        setLoading(false);
    };

    const fetchTemplates = async () => {
        try {
            const data = await getAdminSchedules();
            const adapted = data.map((s: any) => ({
                id: s.id.toString(),
                route_id: s.id.toString(),
                departure_time: s.departure_time,
                price: s.base_price,
                vehicle_id: null,
                routes: { origin: s.from_location, destination: s.to_location }
            }));
            setTemplates(adapted);
        } catch (error) {
            console.error(error);
        }
    };

    // --- Actions ---

    // 1. Create Daily Schedule (Bulk or Single)
    const handleCreateTrip = async (e: React.FormEvent) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const routeId = form.route_id.value;
        const time = form.time.value;
        const price = form.price.value;

        // Validation
        if (!routeId) { alert("Please select a route"); return; }
        
        const route = routes.find(r => r.id.toString() === routeId);
        if (!route) return;

        const dtStr = `${selectedDate}T${time}:00`;
        const planned_departure_time = new Date(dtStr).toISOString();

        try {
            await createAdminTrip({
                trip_code: "",
                schedule_id: parseInt(routeId),
                vehicle_id: vehicles.length > 0 ? parseInt(vehicles[0].id) : 1,
                driver_id: drivers.length > 0 ? parseInt(drivers[0].id) : 1,
                route_name: `${route.from_location} -> ${route.to_location}`,
                from_location: route.from_location,
                to_location: route.to_location,
                planned_departure_time: planned_departure_time,
                current_status: "scheduled"
            });
            setShowCreateModal(false);
            fetchTrips(selectedDate);
        } catch (error: any) {
            alert("Error: " + error.message);
        }
    };

    // 2. Assign Driver/Vehicle
    const handleAssign = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!showAssignModal) return;

        const form = e.target as HTMLFormElement;
        const driverId = form.driver_id.value || null;
        const vehicleId = form.vehicle_id.value || null;

        try {
            await updateAdminTrip(parseInt(showAssignModal.id), {
                driver_id: driverId ? parseInt(driverId) : null,
                vehicle_id: vehicleId ? parseInt(vehicleId) : null
            });
            setShowAssignModal(null);
            fetchTrips(selectedDate);
        } catch (error: any) {
            alert("Error: " + error.message);
        }
    };

    const handleDeleteTrip = async (id: string) => {
        if (!confirm("Cancel this trip? This will affect bookings!")) return;
        try {
            await deleteAdminTrip(parseInt(id));
            fetchTrips(selectedDate);
        } catch (error: any) {
            alert("Error: " + error.message);
        }
    }

    // --- Template Actions ---

    const handleOpenTemplates = () => {
        fetchTemplates();
        setShowTemplateModal(true);
    };

    const handleCreateTemplate = async (e: React.FormEvent) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const routeId = form.t_route_id.value;
        const time = form.t_time.value;
        const price = form.price.value;

        const route = routes.find((r: any) => r.id.toString() === routeId);
        if (!route) return;

        try {
            await createAdminSchedule({
                route_name: `${route.from_location} -> ${route.to_location}`,
                from_location: route.from_location,
                to_location: route.to_location,
                departure_time: time,
                estimated_duration: 2.5,
                base_price: parseInt(price),
                available_vehicle_type: "Limousine",
                active: true
            });
            fetchTemplates();
        } catch (error: any) {
            alert(error.message);
        }
    };

    const handleDeleteTemplate = async (id: string) => {
        try {
            await deleteAdminSchedule(parseInt(id));
            fetchTemplates();
        } catch (error) {
            console.error(error);
        }
    };

    // Modified Auto Fill / Bulk Gen
    const handleBulkGenerate = async () => {
        if (!bulkStartDate || !bulkEndDate) { alert("Please select both dates."); return; }
        if (new Date(bulkStartDate) > new Date(bulkEndDate)) { alert("Start date cannot be after end date."); return; }
        if (!confirm(`Generate schedule from ${bulkStartDate} to ${bulkEndDate}?`)) return;

        let dbTemplates: any[] = [];
        try { dbTemplates = await getAdminSchedules(); } catch (err) {}
        
        if (dbTemplates.length === 0) {
            alert("No templates found! Create some templates first.");
            return;
        }

        setLoading(true);
        let count = 0;
        let curr = new Date(bulkStartDate);
        const end = new Date(bulkEndDate);

        while (curr <= end) {
            const dateStr = curr.toISOString().split('T')[0];
            for (const t of dbTemplates) {
                const dtStr = `${dateStr}T${t.departure_time}:00`;
                await createAdminTrip({
                    trip_code: "",
                    schedule_id: t.id,
                    vehicle_id: vehicles.length > 0 ? parseInt(vehicles[0].id) : 1,
                    driver_id: drivers.length > 0 ? parseInt(drivers[0].id) : 1,
                    route_name: `${t.from_location} -> ${t.to_location}`,
                    from_location: t.from_location,
                    to_location: t.to_location,
                    planned_departure_time: new Date(dtStr).toISOString(),
                    current_status: "scheduled"
                }).catch(console.error);
                count++;
            }
            curr.setDate(curr.getDate() + 1);
        }

        setLoading(false);
        alert(`Successfully created ${count} trips!`);
        fetchTrips(selectedDate);
        setShowTemplateModal(false);
    };

    const handleAutoFill = async () => {
        if (!confirm(`Generate daily schedule for ${selectedDate} from templates?`)) return;

        let dbTemplates: any[] = [];
        try { dbTemplates = await getAdminSchedules(); } catch (err) {}
        
        if (dbTemplates.length === 0) {
            alert("No templates found! Create some templates first.");
            return;
        }

        let count = 0;
        for (const t of dbTemplates) {
            const dtStr = `${selectedDate}T${t.departure_time}:00`;
            await createAdminTrip({
                trip_code: "",
                schedule_id: t.id,
                vehicle_id: vehicles.length > 0 ? parseInt(vehicles[0].id) : 1,
                driver_id: drivers.length > 0 ? parseInt(drivers[0].id) : 1,
                route_name: `${t.from_location} -> ${t.to_location}`,
                from_location: t.from_location,
                to_location: t.to_location,
                planned_departure_time: new Date(dtStr).toISOString(),
                current_status: "scheduled"
            }).catch(console.error);
            count++;
        }

        fetchTrips(selectedDate);
        alert(`Successfully created ${count} trips!`);
        setShowTemplateModal(false);
    };

    return (
        <div className="h-full flex flex-col">
            {/* Header / Date Control */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold flex items-center gap-2">
                        <CalendarClock size={24} className="text-primary" />
                        Dispatch Schedule
                    </h1>
                    <div className="h-8 w-[1px] bg-gray-200"></div>
                    <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-lg border border-gray-200">
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="bg-transparent text-sm font-bold text-gray-700 outline-none px-2"
                        />
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={handleOpenTemplates}
                        className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg flex items-center gap-2 font-medium text-sm transition-colors"
                    >
                        <Settings size={16} /> Manage Templates & Auto-fill
                    </button>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium text-sm transition-colors shadow-sm"
                    >
                        <Plus size={16} /> Add Single Trip
                    </button>
                </div>
            </div>

            {/* Timeline / List View */}
            {loading ? (
                <div className="flex-1 flex items-center justify-center text-gray-400">Loading schedule...</div>
            ) : trips.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50/50 rounded-xl border-2 border-dashed border-gray-200 m-2">
                    <Calendar size={48} className="mb-4 opacity-20" />
                    <p>No trips scheduled for {selectedDate}.</p>
                    <div className="flex gap-4 mt-4">
                        <button onClick={handleOpenTemplates} className="text-primary font-bold hover:underline flex items-center gap-1">
                            <Copy size={16} /> Bulk Generate
                        </button>
                        <span className="text-gray-300">|</span>
                        <button onClick={() => setShowCreateModal(true)} className="text-primary font-bold hover:underline">
                            Create manually
                        </button>
                    </div>
                </div>
            ) : (
                <div className="grid gap-4">
                    {trips.map(trip => (
                        <div key={trip.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all flex items-center gap-6">
                            {/* Time */}
                            <div className="text-center min-w-[80px]">
                                <div className="text-2xl font-bold text-gray-900">{trip.departure_time.substring(0, 5)}</div>
                                <div className="text-xs text-gray-500 bg-gray-100 rounded px-1.5 py-0.5 inline-block">{trip.departure_date}</div>
                            </div>

                            {/* Route Info */}
                            <div className="flex-1">
                                <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-1">
                                    <span className="text-gray-900 text-base">{trip.routes?.origin}</span>
                                    <ArrowRight size={14} className="text-gray-400" />
                                    <span className="text-gray-900 text-base">{trip.routes?.destination}</span>
                                </div>
                                <div className="text-xs text-gray-500 flex gap-3">
                                    <span>Price: <b>{trip.price.toLocaleString()}</b></span>
                                    <span className={`px-1.5 rounded ${trip.status === 'scheduled' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>{trip.status}</span>
                                </div>
                            </div>

                            {/* Dispatch Info (Driver/Vehicle) */}
                            <div className="flex flex-col gap-2 min-w-[200px]">
                                <div
                                    onClick={() => setShowAssignModal(trip)}
                                    className={`
                                        cursor-pointer text-sm px-3 py-2 rounded-lg border border-dashed flex items-center gap-2 transition-colors
                                        ${trip.vehicle_id
                                            ? "bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
                                            : "bg-gray-50 border-gray-300 text-gray-400 hover:bg-gray-100 hover:text-gray-600"}
                                    `}
                                >
                                    <Bus size={14} />
                                    <span className="truncate max-w-[150px] font-medium">
                                        {trip.vehicles ? `${trip.vehicles.plate_number} (${trip.vehicles.type})` : "Assign Vehicle"}
                                    </span>
                                </div>

                                <div
                                    onClick={() => setShowAssignModal(trip)}
                                    className={`
                                        cursor-pointer text-sm px-3 py-2 rounded-lg border border-dashed flex items-center gap-2 transition-colors
                                        ${trip.driver_id
                                            ? "bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                                            : "bg-gray-50 border-gray-300 text-gray-400 hover:bg-gray-100 hover:text-gray-600"}
                                    `}
                                >
                                    <User size={14} />
                                    <span className="truncate max-w-[150px] font-medium">
                                        {trip.drivers ? trip.drivers.name : "Assign Driver"}
                                    </span>
                                </div>
                            </div>

                            {/* Delete */}
                            <button onClick={() => handleDeleteTrip(trip.id)} className="text-gray-300 hover:text-red-500 p-2">
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
                        <h3 className="text-lg font-bold mb-4">Add New Trip</h3>
                        <form onSubmit={handleCreateTrip} className="flex flex-col gap-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Route</label>
                                <select name="route_id" className="w-full p-2 border rounded" required>
                                    <option value="">Select a Route</option>
                                    {routes.map(r => (
                                        <option key={r.id} value={r.id}>{r.from_location} - {r.to_location}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Departure Time</label>
                                <input name="time" type="time" className="w-full p-2 border rounded" required defaultValue="09:00" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Price</label>
                                <input name="price" type="number" className="w-full p-2 border rounded" required defaultValue={250000} />
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 py-2 border rounded">Cancel</button>
                                <button type="submit" className="flex-1 py-2 bg-primary text-white rounded font-bold">Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Template Modal */}
            {showTemplateModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-xl font-bold">Manage Schedule Templates</h3>
                                <p className="text-sm text-gray-500">Define standard daily trips here.</p>
                            </div>
                            <button onClick={() => setShowTemplateModal(false)} className="text-gray-400 hover:text-gray-600">
                                <XCircle size={24} />
                            </button>
                        </div>

                        {/* List of Templates */}
                        <div className="flex-1 overflow-y-auto border rounded-lg mb-6 bg-gray-50 p-2 space-y-2">
                            {templates.length === 0 ? (
                                <div className="text-center py-8 text-gray-400">No templates yet. Add one below!</div>
                            ) : templates.map(t => (
                                <div key={t.id} className="bg-white p-3 rounded border flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <div className="font-bold text-lg w-16">{t.departure_time.substring(0, 5)}</div>
                                        <div>
                                            <div className="text-sm font-semibold">{t.routes?.origin} ➝ {t.routes?.destination}</div>
                                            <div className="text-xs text-gray-500">{t.price.toLocaleString()} ₫</div>
                                        </div>
                                    </div>
                                    <button onClick={() => handleDeleteTemplate(t.id)} className="text-gray-300 hover:text-red-500 p-2">
                                        <XCircle size={20} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Add Template Form */}
                        <form onSubmit={handleCreateTemplate} className="bg-gray-100 p-4 rounded-lg flex items-end gap-3 mb-6">
                            <div className="flex-1">
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Route</label>
                                <select name="t_route_id" className="w-full p-2 border rounded text-sm" required>
                                    <option value="">Select Route</option>
                                    {routes.map(r => (
                                        <option key={r.id} value={r.id}>{r.from_location} - {r.to_location}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="w-24">
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Time</label>
                                <input name="t_time" type="time" className="w-full p-2 border rounded text-sm" required defaultValue="07:00" />
                            </div>
                            <div className="w-28">
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Price</label>
                                <input name="price" type="number" className="w-full p-2 border rounded text-sm" required defaultValue={250000} />
                            </div>
                            <button type="submit" className="bg-primary hover:bg-primary/90 text-white p-2 rounded-lg h-[38px] w-[38px] flex items-center justify-center">
                                <Plus size={20} />
                            </button>
                        </form>

                        {/* Bulk Generation Section */}
                        <div className="bg-blue-50 p-5 rounded-lg border border-blue-100">
                            <h4 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                                <CalendarDays size={18} /> Bulk Schedule Generator
                            </h4>
                            <div className="flex items-end gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 block mb-1">From Date</label>
                                    <input
                                        type="date"
                                        value={bulkStartDate}
                                        onChange={e => setBulkStartDate(e.target.value)}
                                        className="p-2 border border-blue-200 rounded text-sm focus:outline-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 block mb-1">To Date</label>
                                    <input
                                        type="date"
                                        value={bulkEndDate}
                                        onChange={e => setBulkEndDate(e.target.value)}
                                        className="p-2 border border-blue-200 rounded text-sm focus:outline-blue-500"
                                    />
                                </div>
                                <button
                                    onClick={handleBulkGenerate}
                                    className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-blue-700 flex-1 shadow-sm transition-colors"
                                >
                                    Generate Logic
                                </button>
                            </div>
                            <p className="text-xs text-blue-400 mt-2">
                                * Takes {templates.length} templates and copies them for every day in the range.
                            </p>
                        </div>

                    </div>
                </div>
            )}

            {/* Assign Modal */}
            {showAssignModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
                        <h3 className="text-lg font-bold mb-1">Assign Resources</h3>
                        <p className="text-xs text-gray-500 mb-4">
                            For trip at {showAssignModal.departure_time}
                        </p>
                        <form onSubmit={handleAssign} className="flex flex-col gap-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Vehicle</label>
                                <select name="vehicle_id" className="w-full p-2 border rounded" defaultValue={showAssignModal.vehicle_id || ""}>
                                    <option value="">-- No Vehicle --</option>
                                    {vehicles.map(v => (
                                        <option key={v.id} value={v.id}>{v.label} ({v.subLabel})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Driver</label>
                                <select name="driver_id" className="w-full p-2 border rounded" defaultValue={showAssignModal.driver_id || ""}>
                                    <option value="">-- No Driver --</option>
                                    {drivers.map(d => (
                                        <option key={d.id} value={d.id}>{d.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button type="button" onClick={() => setShowAssignModal(null)} className="flex-1 py-2 border rounded">Cancel</button>
                                <button type="submit" className="flex-1 py-2 bg-primary text-white rounded font-bold">Save Assignment</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
