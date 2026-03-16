"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Clock, MapPin, Bus, CheckCircle2, Navigation } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { searchSchedules, createBooking } from "@/lib/api";

type TripType = "one_way" | "round_trip";

export default function BookingPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-bold text-xl">Loading booking...</div>}>
            <BookingContent />
        </Suspense>
    );
}

function BookingContent() {
    const { t } = useLanguage();
    const router = useRouter();
    const searchParams = useSearchParams();

    // From Query Params
    const initialFrom = searchParams.get('from') || "HCMC District 1";
    const initialTo = searchParams.get('to') || "Vung Tau City Center";
    const initialDate = searchParams.get('date') || new Date().toISOString().split('T')[0];

    const [tripType, setTripType] = useState<TripType>("one_way");
    const [fromLoc, setFromLoc] = useState(initialFrom);
    const [toLoc, setToLoc] = useState(initialTo);
    const [departDate, setDepartDate] = useState(initialDate);
    const [returnDate, setReturnDate] = useState("");
    
    const [loadingSchedules, setLoadingSchedules] = useState(false);
    const [schedules, setSchedules] = useState<any[]>([]);
    const [selectedSchedule, setSelectedSchedule] = useState<any | null>(null);

    // Form Data
    const [passengerCount, setPassengerCount] = useState(1);
    const [luggageCount, setLuggageCount] = useState(0);
    const [customerName, setCustomerName] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [specialNote, setSpecialNote] = useState("");
    
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const locations = [
        "HCMC District 1",
        "Vung Tau City Center",
        "Tan Son Nhat Airport"
    ];

    useEffect(() => {
        fetchSchedules();
    }, [fromLoc, toLoc, departDate]);

    const fetchSchedules = async () => {
        setLoadingSchedules(true);
        setErrorMsg("");
        setSelectedSchedule(null);
        try {
            const data = await searchSchedules(fromLoc, toLoc, departDate);
            setSchedules(data);
        } catch (error: any) {
            console.error("Error fetching schedules:", error);
            setErrorMsg(error.message || "Failed to load schedules.");
        } finally {
            setLoadingSchedules(false);
        }
    };

    const handleSwapLocations = () => {
        const temp = fromLoc;
        setFromLoc(toLoc);
        setToLoc(temp);
    };

    const handleSubmitBooking = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!selectedSchedule) {
            setErrorMsg("Please select a schedule time.");
            return;
        }

        if (tripType === "round_trip" && !returnDate) {
            setErrorMsg("Please select a return date for round trip.");
            return;
        }

        if (!customerName.trim() || !customerPhone.trim()) {
            setErrorMsg(t.enterPassengerInfo);
            return;
        }

        setSubmitting(true);
        setErrorMsg("");

        try {
            const payload = {
                trip_type: tripType,
                from_location: fromLoc,
                to_location: toLoc,
                depart_date: departDate,
                depart_time: selectedSchedule.departure_time,
                return_date: tripType === "round_trip" ? returnDate : null,
                return_time: null, // MVP simplicity
                passenger_count: passengerCount,
                luggage_count: luggageCount,
                special_note: specialNote,
                customer: {
                    name: customerName,
                    phone: customerPhone,
                    notes: specialNote
                }
            };
            
            const result = await createBooking(payload);
            router.push(`/confirmation/${result.booking_code}`);
        } catch (error: any) {
            console.error("Booking failed:", error);
            setErrorMsg("Booking failed: " + (error.message || "Unknown error"));
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <header className="bg-primary text-white pt-6 pb-6 shadow-md">
                <div className="container">
                    <Link href="/" className="inline-flex items-center text-white/80 hover:text-white transition-colors mb-4">
                        <ArrowLeft size={20} className="mr-2" /> {t.home}
                    </Link>
                    <h1 className="text-2xl font-bold">{t.selectTrip}</h1>
                </div>
            </header>

            <div className="container mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Left Column: Search & Schedule Selection */}
                <div className="flex flex-col gap-6">
                    {/* Search Params Editor */}
                    <div className="card">
                        <div className="flex justify-between items-center mb-4 border-b pb-4">
                            <h2 className="font-bold text-lg">{t.route}</h2>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input 
                                        type="radio" 
                                        name="tripType" 
                                        checked={tripType === "one_way"}
                                        onChange={() => setTripType("one_way")}
                                        className="text-primary"
                                    />
                                    <span className="text-sm font-medium">{t.oneWay}</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input 
                                        type="radio" 
                                        name="tripType" 
                                        checked={tripType === "round_trip"}
                                        onChange={() => setTripType("round_trip")}
                                        className="text-primary"
                                    />
                                    <span className="text-sm font-medium">{t.roundTrip}</span>
                                </label>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="input-label mb-2 text-xs">{t.from}</label>
                                <select 
                                    value={fromLoc} 
                                    onChange={(e) => setFromLoc(e.target.value)}
                                    className="input-field py-2 px-3 text-sm"
                                >
                                    {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                                </select>
                            </div>
                            <div className="relative">
                                <div className="absolute top-1/2 -left-2 md:-left-4 transform -translate-y-1/2 z-10 cursor-pointer bg-gray-100 rounded-full p-1" onClick={handleSwapLocations}>
                                    <ArrowRight size={16} className="text-gray-500 hidden md:block" />
                                </div>
                                <label className="input-label mb-2 text-xs">{t.to}</label>
                                <select 
                                    value={toLoc} 
                                    onChange={(e) => setToLoc(e.target.value)}
                                    className="input-field py-2 px-3 text-sm"
                                >
                                    {locations.map(loc => <option key={loc} value={loc} disabled={loc === fromLoc}>{loc}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="input-label mb-2 text-xs">{t.departDate}</label>
                                <input 
                                    type="date"
                                    value={departDate}
                                    onChange={(e) => setDepartDate(e.target.value)}
                                    className="input-field py-2 px-3 text-sm"
                                    min={new Date().toISOString().split('T')[0]}
                                />
                            </div>
                            {tripType === "round_trip" && (
                                <div>
                                    <label className="input-label mb-2 text-xs">{t.returnDate}</label>
                                    <input 
                                        type="date"
                                        value={returnDate}
                                        onChange={(e) => setReturnDate(e.target.value)}
                                        className="input-field py-2 px-3 text-sm"
                                        min={departDate}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Schedule List */}
                    <div>
                        <h3 className="font-bold mb-4 text-gray-700 uppercase tracking-wide text-sm">{t.availableSchedules}</h3>
                        {loadingSchedules ? (
                            <div className="text-center py-8 text-gray-500">Loading schedules...</div>
                        ) : schedules.length === 0 ? (
                            <div className="text-center py-8 bg-white border border-dashed rounded text-gray-500">
                                {t.noSchedules}
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {schedules.map(schedule => (
                                    <div 
                                        key={schedule.id}
                                        onClick={() => setSelectedSchedule(schedule)}
                                        className={`p-4 rounded border-2 cursor-pointer transition-all ${selectedSchedule?.id === schedule.id ? 'border-primary bg-red-50' : 'border-gray-200 bg-white hover:border-primary/50'}`}
                                    >
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-4">
                                                <div className="text-center">
                                                    <div className="text-xl font-bold text-gray-900">{schedule.departure_time}</div>
                                                </div>
                                                <div className="w-8 h-[2px] bg-gray-300"></div>
                                                <div className="text-center text-gray-500 text-sm">
                                                    {schedule.estimated_duration} hours
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-lg font-bold text-primary">{schedule.base_price.toLocaleString()} VNĐ</div>
                                                <div className="text-xs flex items-center gap-1 justify-end text-gray-500 mt-1">
                                                    <Bus size={12} /> {schedule.available_vehicle_type}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Customer Details & Submission */}
                <div>
                    <div className="card sticky top-6">
                        <h2 className="font-bold text-lg mb-6 border-b pb-4">{t.passengerDetails} (Booking Form)</h2>
                        
                        <form onSubmit={handleSubmitBooking} className="flex flex-col gap-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="input-label mb-2 text-xs">{t.passengers}</label>
                                    <input 
                                        type="number" 
                                        min={1} max={15}
                                        value={passengerCount}
                                        onChange={(e) => setPassengerCount(parseInt(e.target.value))}
                                        className="input-field text-sm"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="input-label mb-2 text-xs">{t.luggageCount}</label>
                                    <input 
                                        type="number" 
                                        min={0} max={20}
                                        value={luggageCount}
                                        onChange={(e) => setLuggageCount(parseInt(e.target.value))}
                                        className="input-field text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="input-label mb-2 text-xs">{t.fullName}</label>
                                <input 
                                    type="text" 
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    className="input-field text-sm"
                                    placeholder="e.g. Nguyen Van A"
                                    required
                                />
                            </div>

                            <div>
                                <label className="input-label mb-2 text-xs">{t.phoneNumber}</label>
                                <input 
                                    type="tel" 
                                    value={customerPhone}
                                    onChange={(e) => setCustomerPhone(e.target.value)}
                                    className="input-field text-sm"
                                    placeholder="+84 90..."
                                    required
                                />
                            </div>

                            <div>
                                <label className="input-label mb-2 text-xs">{t.specialRequests}</label>
                                <textarea 
                                    value={specialNote}
                                    onChange={(e) => setSpecialNote(e.target.value)}
                                    className="input-field text-sm min-h-[80px]"
                                    placeholder={t.pickupDetails}
                                ></textarea>
                            </div>

                            {/* Summary Box */}
                            <div className="bg-gray-50 p-4 rounded mt-2 border border-gray-100">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-gray-500">{t.tripTotal}</span>
                                    <span className="font-bold text-xl text-primary">
                                        {selectedSchedule ? (selectedSchedule.base_price * passengerCount * (tripType === "round_trip" ? 2 : 1)).toLocaleString() : 0} ₫
                                    </span>
                                </div>
                                <p className="text-xs text-gray-400">{t.totalConfirmationNotice}</p>
                            </div>

                            {errorMsg && (
                                <div className="bg-red-50 text-red-600 p-3 text-sm rounded border border-red-100">
                                    {errorMsg}
                                </div>
                            )}

                            <button 
                                type="submit" 
                                disabled={submitting || !selectedSchedule}
                                className="btn btn-primary w-full mt-2"
                            >
                                {submitting ? "Processing..." : t.confirmBooking}
                            </button>
                        </form>
                    </div>
                </div>

            </div>
        </div>
    );
}
