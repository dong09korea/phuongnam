"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Clock, MapPin, Navigation, Info, ShieldCheck, Wifi } from "lucide-react";
import { fetchWithConfig } from "@/lib/api";
import { translations, Language } from "@/lib/translations";
import dynamic from 'next/dynamic';

const LiveMap = dynamic(() => import('@/components/live/LiveMap'), { ssr: false });

type TripLiveStatus = {
    trip_code: string;
    route_name: string;
    from_location: string;
    to_location: string;
    status: string;
    vehicle_name: string;
    latest_location: {
        latitude: number | null;
        longitude: number | null;
        speed: number | null;
        recorded_at: string | null;
    };
    metrics: {
        progress_percent: number;
        remaining_distance_km: number | null;
        estimated_mins_remaining: number | null;
    };
    messages: string[];
};

export default function LiveTripDisplay() {
    const params = useParams();
    const tripCode = params.trip_code as string;
    
    const [currentTime, setCurrentTime] = useState(new Date());
    const [tripData, setTripData] = useState<TripLiveStatus | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Language Cycling
    const displayLanguages: Language[] = ['vi', 'en', 'ko'];
    const [langIndex, setLangIndex] = useState(0);
    const currentLang = displayLanguages[langIndex];
    const t = translations[currentLang];

    // Language Rotation Timer (every 5 seconds)
    useEffect(() => {
        const langTimer = setInterval(() => {
            setLangIndex((prev) => (prev + 1) % displayLanguages.length);
        }, 5000);
        return () => clearInterval(langTimer);
    }, [displayLanguages.length]);

    // Live Clock
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Fetch Live GPS Data (Polling)
    useEffect(() => {
        const fetchStatus = async () => {
            try {
                // Using the exact structure from the new Python backend endpoint
                const data = await fetchWithConfig(`/live/trips/${tripCode}/status`);
                setTripData(data);
                setError(null);
            } catch (err: any) {
                console.error("Failed to fetch live trip data", err);
                setError(err.message || "Failed to load live data");
            }
        };

        fetchStatus(); // initial load
        const interval = setInterval(fetchStatus, 5000); // Poll every 5 seconds
        
        return () => clearInterval(interval);
    }, [tripCode]);

    if (error) {
        return (
            <div className="min-h-screen bg-[#3D1729] flex items-center justify-center text-white p-8">
                <div className="text-center bg-red-900/50 p-8 rounded-2xl border border-red-500 max-w-2xl">
                    <ShieldCheck size={64} className="mx-auto mb-6 text-red-400 opacity-50" />
                    <h1 className="text-3xl font-bold mb-4">System Unavailable</h1>
                    <p className="text-xl text-red-200">{error}</p>
                    <p className="mt-8 text-sm opacity-50">Trip Code: {tripCode}</p>
                </div>
            </div>
        );
    }

    if (!tripData) {
        return (
            <div className="min-h-screen bg-[#3D1729] flex items-center justify-center text-white">
                <div className="animate-pulse flex flex-col items-center">
                    <Navigation size={48} className="mb-4 text-orange-500 animate-bounce" />
                    <h2 className="text-2xl font-semibold">Connecting to Satellite...</h2>
                </div>
            </div>
        );
    }

    // Calc formatted ETA
    const etaDate = new Date();
    if (tripData.metrics.estimated_mins_remaining) {
        etaDate.setMinutes(etaDate.getMinutes() + tripData.metrics.estimated_mins_remaining);
    }

    return (
        <main className="h-screen w-screen overflow-hidden flex flex-col bg-[#3D1729] text-white">
            
            {/* Top Navigation Bar */}
            <header className="h-[100px] bg-black/40 backdrop-blur-md flex items-center justify-between px-10 border-b border-white/10 shrink-0 shadow-lg relative z-20">
                <div className="flex items-center gap-6">
                    <div className="text-3xl font-extrabold tracking-tight">
                        Phuong Nam <span className="text-[#FF5722]">TRANSPORT</span>
                    </div>
                    <div className="h-10 w-[2px] bg-white/20"></div>
                    <div>
                        <div className="text-sm text-gray-400 font-medium tracking-widest uppercase transition-opacity duration-500">{t.route}</div>
                        <div className="text-2xl font-bold">{tripData.route_name}</div>
                    </div>
                </div>

                <div className="flex items-center gap-8">
                    {tripData.vehicle_name && (
                        <div className="bg-white/10 px-4 py-2 rounded-full border border-white/20 text-lg font-medium transition-opacity duration-500">
                            {t.vehicle}: {tripData.vehicle_name}
                        </div>
                    )}
                    <div className="flex flex-col items-end">
                        <div className="text-4xl font-black tabular-nums">
                            {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="text-sm text-gray-400 font-medium">
                            {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <div className="flex-1 flex relative overflow-hidden">
                
                {/* Left Area: Live Map */}
                <div className="flex-1 relative bg-black overflow-hidden flex flex-col justify-end shadow-inset-dark">
                    
                    {/* Real-time Map underneath everything */}
                    <div className="absolute inset-0 z-0">
                        {tripData.latest_location.latitude && tripData.latest_location.longitude ? (
                            <LiveMap 
                                latitude={tripData.latest_location.latitude} 
                                longitude={tripData.latest_location.longitude} 
                                vehicleName={tripData.vehicle_name || "Phuong Nam VIP"}
                                speed={tripData.latest_location.speed}
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-[#1a1a1a]">
                                <span className="text-gray-500 font-medium">Waiting for GPS Fix...</span>
                            </div>
                        )}
                    </div>
                    
                    {/* Status Heading OVERLAY */}
                    <div className="absolute top-10 left-0 right-0 z-10 text-center pointer-events-none">
                        <div className="inline-flex items-center gap-3 bg-green-500/80 backdrop-blur-md text-white border border-green-400/50 px-6 py-3 rounded-full text-2xl font-bold shadow-[0_0_30px_rgba(34,197,94,0.5)]">
                            <span className="relative flex h-4 w-4">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-300 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-4 w-4 bg-green-400"></span>
                            </span>
                            LIVE TRACKING ACTIVE
                        </div>
                    </div>

                    {/* Progression Visual OVERLAY (Bottom) */}
                    <div className="relative z-10 w-full max-w-4xl mx-auto mb-10 pointer-events-none">
                        <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl mx-10">
                            
                            <div className="flex justify-between items-end mb-6 text-xl">
                                <div className="font-bold flex items-center gap-3"><MapPin className="text-[#FF5722]" /> {tripData.from_location}</div>
                                <div className="font-bold flex items-center gap-3">{tripData.to_location} <MapPin className="text-gray-400" /></div>
                            </div>

                            <div className="relative h-6 bg-white/10 rounded-full overflow-visible my-8">
                                {/* Track Line */}
                                <div 
                                    className="absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-in-out" 
                                    style={{ 
                                        width: `${tripData.metrics.progress_percent}%`,
                                        background: 'linear-gradient(90deg, #FF5722 0%, #ff9800 100%)',
                                        boxShadow: '0 0 20px rgba(255, 87, 34, 0.5)'
                                    }}
                                ></div>
                                
                                {/* Live Bus Icon Position */}
                                <div 
                                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-1000 ease-in-out z-10 bg-white rounded-full p-2 shadow-[0_0_15px_rgba(255,255,255,0.8)]"
                                    style={{ left: `${tripData.metrics.progress_percent}%` }}
                                >
                                    <Navigation className="text-[#3D1729] transform rotate-90 w-8 h-8" />
                                </div>
                            </div>

                            <div className="flex justify-between items-center text-gray-400 text-lg font-medium transition-opacity duration-500">
                                <div>{t.departure}</div>
                                <div className="text-white text-3xl font-bold">{tripData.metrics.progress_percent}% </div>
                                <div>{t.arrival}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Area: Flight-Style Dashboard Info */}
                <div className="w-[500px] bg-white/5 backdrop-blur-3xl border-l border-white/10 flex flex-col p-8 gap-6 shrink-0 z-20">
                    
                    <div className="bg-black/30 rounded-2xl p-6 border border-white/5 transition-opacity duration-500">
                        <div className="text-gray-400 font-medium uppercase tracking-wider mb-2">{t.time ?? "Estimated Arrival"} (ETA)</div>
                        <div className="text-6xl font-black text-white flex items-baseline gap-2">
                            {tripData.metrics.estimated_mins_remaining !== null ? (
                                <>
                                    {etaDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                </>
                            ) : (
                                "TBD"
                            )}
                        </div>
                        {tripData.metrics.estimated_mins_remaining !== null && (
                            <div className="text-orange-400 text-2xl font-bold mt-2">
                                {currentLang === 'ko' ? `${tripData.metrics.estimated_mins_remaining} 분 후` : 
                                 currentLang === 'vi' ? `Sau ${tripData.metrics.estimated_mins_remaining} Phút` : 
                                 `In ${tripData.metrics.estimated_mins_remaining} Minutes`}
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 flex-1">
                        <div className="bg-white/5 rounded-2xl p-6 border border-white/5 flex flex-col justify-center transition-opacity duration-500">
                            <div className="text-gray-400 uppercase tracking-wider text-sm mb-2">{currentLang === 'vi' ? 'Còn lại' : currentLang === 'ko' ? '남은 거리' : 'To Go'}</div>
                            <div className="text-4xl font-bold">
                                {tripData.metrics.remaining_distance_km ? `${tripData.metrics.remaining_distance_km} km` : '--'}
                            </div>
                        </div>
                        <div className="bg-white/5 rounded-2xl p-6 border border-white/5 flex flex-col justify-center transition-opacity duration-500">
                            <div className="text-gray-400 uppercase tracking-wider text-sm mb-2">{currentLang === 'vi' ? 'Tốc độ' : currentLang === 'ko' ? '현재 속도' : 'Current Speed'}</div>
                            <div className="text-4xl font-bold">
                                {tripData.latest_location.speed ? `${Math.round(tripData.latest_location.speed)} km/h` : '--'}
                            </div>
                        </div>
                        <div className="bg-white/5 rounded-2xl p-6 border border-white/5 col-span-2 flex flex-col justify-center transition-opacity duration-500">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="bg-[#FF5722]/20 p-3 rounded-full text-[#FF5722]">
                                    <Wifi size={32} />
                                </div>
                                <div>
                                    <div className="text-gray-400 uppercase tracking-wider text-sm">{t.freeWifi}</div>
                                    <div className="text-2xl font-bold">Network: PhuongNam_VIP</div>
                                    <div className="text-xl text-gray-300">Password: 12345678</div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

            </div>

            {/* Bottom Ticker/Marquee */}
            {tripData.messages && tripData.messages.length > 0 && (
                <footer className="h-[60px] bg-[#FF5722] text-black shrink-0 relative overflow-hidden flex items-center font-bold text-xl px-10 shadow-inner z-30 transition-colors duration-500">
                    <div className="bg-black text-white h-full flex items-center px-6 absolute left-0 z-10 shrink-0 font-black tracking-widest uppercase shadow-[10px_0_20px_rgba(0,0,0,0.5)]">
                        <Info className="mr-3" /> {currentLang === 'vi' ? 'THÔNG BÁO' : currentLang === 'ko' ? '안내 말씀' : 'INFO'}
                    </div>
                    {/* Simple CSS Marquee */}
                    <div className="w-full pl-[250px]">
                        <div className="whitespace-nowrap animate-[marquee_20s_linear_infinite]" style={{
                            ['@keyframes marquee' as any]: {
                                '0%': { transform: 'translateX(100%)' },
                                '100%': { transform: 'translateX(-100%)' }
                            }
                        }}>
                            {currentLang === 'vi' ? 'Chào mừng quý khách đến với Phương Nam Transport!' : currentLang === 'ko' ? '푸엉남 트랜스포트에 탑승하신 것을 환영합니다!' : 'Welcome aboard Phuong Nam Transport!'} • {tripData.messages.join(' • ')} • {currentLang === 'vi' ? 'Quý khách vui lòng kiểm tra hành lý trước khi xuống xe.' : currentLang === 'ko' ? '내리실 때 소지품을 확인하시기 바랍니다.' : 'Remember to take your belongings when exiting.'}
                        </div>
                    </div>
                </footer>
            )}

        </main>
    );
}
