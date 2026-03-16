"use client";

import { useState, useEffect } from "react";
import { getActiveFleet } from "@/lib/api";
import { Map, Navigation, Clock, AlertCircle } from "lucide-react";

type ActiveFleetVehicle = {
    trip_code: string;
    route_name: string;
    status: string;
    vehicle_name: string;
    driver_name: string;
    from_location: string;
    to_location: string;
    latest_location: {
        latitude: number | null;
        longitude: number | null;
        speed: number;
        recorded_at: string | null;
    };
};

export default function FleetMonitoringPage() {
    const [fleet, setFleet] = useState<ActiveFleetVehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
    const [selectedVehicle, setSelectedVehicle] = useState<ActiveFleetVehicle | null>(null);

    const fetchFleet = async () => {
        try {
            const data = await getActiveFleet();
            setFleet(data || []);
            setLastUpdated(new Date());
        } catch (error) {
            console.error('Error fetching fleet:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFleet();
        // Poll every 10 seconds for admin view
        const interval = setInterval(fetchFleet, 10000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)]">
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Map className="text-blue-600" /> Live Fleet Tracking
                    </h1>
                    <p className="text-gray-500 mt-1">Monitor all active trips and vehicle locations in real-time.</p>
                </div>
                <div className="text-sm text-gray-500 flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-gray-200">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                    Last updated: {lastUpdated.toLocaleTimeString()}
                </div>
            </div>

            <div className="flex flex-1 gap-6 min-h-0">
                
                {/* Simulated Map Area */}
                <div className="flex-1 bg-gray-100 rounded-xl border border-gray-300 relative overflow-hidden flex flex-col items-center justify-center">
                    {/* Placeholder Map Background img */}
                    <div className="absolute inset-0 opacity-50 bg-[url('https://api.maptiler.com/maps/streets-v2/256/0/0/0.png')] bg-cover bg-center"></div>
                    
                    {/* Map UI Container */}
                    <div className="relative w-full h-full p-6">
                        {loading ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm">
                                <div className="text-blue-600 font-medium">Loading fleet data...</div>
                            </div>
                        ) : fleet.length === 0 ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm">
                                <div className="bg-white p-6 rounded-xl shadow-lg text-center">
                                    <AlertCircle className="mx-auto mb-2 text-yellow-500" size={32} />
                                    <h3 className="font-bold text-gray-900">No Active Trips</h3>
                                    <p className="text-gray-500 text-sm">There are currently no vehicles on the road.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="relative w-full h-full border-4 border-dashed border-blue-200/50 rounded-xl bg-white/20">
                                {/* Simulated Vehicle Markers on Map */}
                                {fleet.map((v, idx) => (
                                    <div 
                                        key={v.trip_code}
                                        // Random positions for mockup, in real life use lat/lng to px mapping
                                        style={{ 
                                            top: `${30 + (idx * 20)}%`, 
                                            left: `${20 + (idx * 30)}%` 
                                        }}
                                        className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                                        onClick={() => setSelectedVehicle(v)}
                                    >
                                        <div className={`
                                            p-2 rounded-full shadow-lg transition-transform
                                            ${selectedVehicle?.trip_code === v.trip_code ? 'bg-blue-600 scale-125' : 'bg-slate-800 hover:scale-110'}
                                        `}>
                                            <Navigation className="text-white w-5 h-5" />
                                        </div>
                                        
                                        {/* Label */}
                                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white px-2 py-1 rounded shadow text-xs font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                                            {v.vehicle_name}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar Details Panel */}
                <div className="w-[380px] bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col shrink-0 overflow-y-auto">
                    <div className="p-4 border-b border-gray-100 bg-gray-50/50 font-semibold text-gray-700">
                        {fleet.length} Active Vehicles
                    </div>

                    <div className="flex-1 p-4 space-y-4">
                        {fleet.length === 0 && !loading && (
                            <div className="text-center text-gray-500 py-10">No fleet data available.</div>
                        )}

                        {fleet.map(vehicle => (
                            <div 
                                key={vehicle.trip_code}
                                onClick={() => setSelectedVehicle(vehicle)}
                                className={`
                                    p-4 rounded-xl border cursor-pointer transition-all
                                    ${selectedVehicle?.trip_code === vehicle.trip_code 
                                        ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' 
                                        : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'}
                                `}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="font-bold text-gray-900">{vehicle.vehicle_name}</div>
                                    <div className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full capitalize font-medium">
                                        {vehicle.status.replace('_', ' ')}
                                    </div>
                                </div>
                                
                                <div className="text-sm font-medium text-slate-700 mb-3">{vehicle.route_name}</div>
                                
                                <div className="space-y-2 text-sm text-gray-600 mb-4 bg-white p-3 rounded border border-gray-100">
                                    <div className="flex justify-between">
                                        <span>Driver:</span>
                                        <span className="font-medium text-gray-900">{vehicle.driver_name}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-blue-600 font-medium">
                                        <span>Current Speed:</span>
                                        <span>{Math.round(vehicle.latest_location.speed)} km/h</span>
                                    </div>
                                </div>

                                <a 
                                    href={`/display/live/${vehicle.trip_code}`} 
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block w-full text-center py-2 bg-slate-900 text-white rounded hover:bg-slate-800 transition-colors text-sm font-medium"
                                    onClick={(e) => e.stopPropagation()} // Prevent card selection when clicking link
                                >
                                    Open Passenger Monitor View
                                </a>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}
