"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getReservations, updateReservation } from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";
import {
    Calendar, Clock, MapPin, Users, Phone, Search,
    ChevronDown, ChevronUp, CheckCircle, XCircle, AlertCircle, Bus
} from "lucide-react";

interface Customer {
    id: number;
    name: string;
    phone: string;
}

interface Reservation {
    id: number;
    booking_code: string;
    trip_type: string;
    from_location: string;
    to_location: string;
    depart_date: string;
    depart_time: string;
    passenger_count: number;
    seat_number: string | null;
    status: string;
    payment_status: string;
    payment_transactions?: any[];
    total_amount: number;
    customer: Customer;
    created_at: string;
}

export default function BookingDashboard() {
    const { t } = useLanguage();
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [bookings, setBookings] = useState<Reservation[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedTrips, setExpandedTrips] = useState<string[]>([]);

    useEffect(() => {
        fetchBookings();
    }, [selectedDate]);

    const fetchBookings = async () => {
        setLoading(true);
        try {
            // Note: Our API currently doesn't filter by date directly via param in `getReservations`, 
            // so we will fetch all and filter locally for MVP, or modify API. 
            // We'll filter locally for now.
            const data = await getReservations();
            const filtered = data.filter((b: Reservation) => b.depart_date === selectedDate);
            setBookings(filtered);
        } catch (error) {
            console.error("Error fetching bookings:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id: number, newStatus: string) => {
        try {
            await updateReservation(id, { status: newStatus });
            setBookings(bookings.map(b => b.id === id ? { ...b, status: newStatus } : b));
        } catch (error) {
            console.error("Error updating status:", error);
            alert("Failed to update status");
        }
    };

    // Group bookings into trips (time + route)
    const trips: any[] = [];
    const grouped = bookings.reduce((acc, booking) => {
        const key = `${booking.depart_time}|${booking.from_location} - ${booking.to_location}`;
        if (!acc[key]) {
            acc[key] = {
                time: booking.depart_time,
                route: `${booking.from_location} - ${booking.to_location}`,
                bookings: [],
                totalSeats: 12, // Default assumption
                bookedSeats: 0
            };
        }
        acc[key].bookings.push(booking);
        if (booking.status !== 'cancelled') {
            acc[key].bookedSeats += booking.passenger_count;
        }
        return acc;
    }, {} as Record<string, any>);

    Object.values(grouped).sort((a, b) => a.time.localeCompare(b.time)).forEach(t => trips.push(t));

    const toggleTrip = (key: string) => {
        if (expandedTrips.includes(key)) {
            setExpandedTrips(expandedTrips.filter(k => k !== key));
        } else {
            setExpandedTrips([...expandedTrips, key]);
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-gray-900 uppercase tracking-tight">{t.dailyOperations || "Daily Operations"}</h1>
                    <p className="text-gray-500 text-sm">{t.dailyOperationsDesc || "Manage manifests and passenger check-ins."}</p>
                </div>

                {/* Date Picker */}
                <div className="flex items-center gap-4 bg-white p-2 rounded-xl shadow-sm border border-gray-200">
                    <button
                        onClick={() => {
                            const d = new Date(selectedDate);
                            d.setDate(d.getDate() - 1);
                            setSelectedDate(d.toISOString().split('T')[0]);
                        }}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
                    >
                        <ChevronDown className="rotate-90" size={20} />
                    </button>

                    <div className="flex items-center gap-2 px-2">
                        <Calendar size={18} className="text-primary" />
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="font-bold text-lg text-gray-900 outline-none bg-transparent"
                        />
                    </div>

                    <button
                        onClick={() => {
                            const d = new Date(selectedDate);
                            d.setDate(d.getDate() + 1);
                            setSelectedDate(d.toISOString().split('T')[0]);
                        }}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
                    >
                        <ChevronDown className="-rotate-90" size={20} />
                    </button>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                    <div className="text-xs font-bold text-blue-600 uppercase mb-1">{t.totalTrips || "Total Trips"}</div>
                    <div className="text-2xl font-black text-blue-900">{trips.length}</div>
                </div>
                <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                    <div className="text-xs font-bold text-green-600 uppercase mb-1">{t.confirmedPax || "Confirmed Pax"}</div>
                    <div className="text-2xl font-black text-green-900">
                        {bookings.filter(b => b.status === 'confirmed').reduce((sum, b) => sum + b.passenger_count, 0)}
                    </div>
                </div>
                <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                    <div className="text-xs font-bold text-orange-600 uppercase mb-1">{t.dashboardPending || "Pending"}</div>
                    <div className="text-2xl font-black text-orange-900">
                        {bookings.filter(b => b.status === 'pending').reduce((sum, b) => sum + b.passenger_count, 0)}
                    </div>
                </div>
                <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                    <div className="text-xs font-bold text-red-600 uppercase mb-1">{t.seatsSold || "Seats Sold"}</div>
                    <div className="text-2xl font-black text-red-900">
                        {bookings.filter(b => b.status !== 'cancelled').reduce((sum, b) => sum + b.passenger_count, 0)}
                    </div>
                </div>
            </div>

            {/* Trip List */}
            {loading ? (
                <div className="text-center py-20 text-gray-400">Loading schedule...</div>
            ) : trips.length === 0 ? (
                <div className="bg-gray-50 rounded-xl border-dashed border-2 border-gray-300 p-20 text-center">
                    <h3 className="text-lg font-bold text-gray-400 mb-2">{t.noScheduledTrips || "No Scheduled Trips"}</h3>
                    <p className="text-gray-400">{t.noBookingsForDate || "There are no bookings for this date yet."}</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {trips.map((trip) => {
                        const tripKey = `${trip.time}|${trip.route}`;
                        const isExpanded = expandedTrips.includes(tripKey);
                        const occupancyRate = (trip.bookedSeats / trip.totalSeats) * 100;
                        const occupancyColor = occupancyRate >= 80 ? "text-green-600" : occupancyRate >= 50 ? "text-orange-600" : "text-gray-600";

                        return (
                            <div key={tripKey} className={`bg-white rounded-xl border transition-all duration-200 ${isExpanded ? 'shadow-lg border-primary/20' : 'shadow-sm border-gray-200 hover:border-gray-300'}`}>
                                {/* Trip Header (Click to Expand) */}
                                <div
                                    onClick={() => toggleTrip(tripKey)}
                                    className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between cursor-pointer gap-4"
                                >
                                    <div className="flex items-center gap-6">
                                        <div className="bg-gray-100 rounded-lg p-3 text-center min-w-[80px]">
                                            <div className="text-xl font-black text-gray-900">{trip.time}</div>
                                            <div className="text-[10px] font-bold text-gray-500 uppercase">{t.departureCap || "Departure"}</div>
                                        </div>

                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                                {trip.route}
                                            </h3>
                                            <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                                                <span className="flex items-center gap-1"><Users size={14} /> {trip.bookedSeats} {t.pax || "pax"}</span>
                                                <span className="flex items-center gap-1"><Bus size={14} /> {t.tbd || "TBD"}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                                        <button className={`p-2 rounded-full transition-transform duration-200 ${isExpanded ? 'bg-primary/10 text-primary rotate-180' : 'bg-gray-50 text-gray-400'}`}>
                                            <ChevronDown size={20} />
                                        </button>
                                    </div>
                                </div>

                                {/* Passenger Manifest (Expanded) */}
                                {isExpanded && (
                                    <div className="border-t border-gray-100 bg-gray-50/50 p-4 md:p-6 animate-in slide-in-from-top-2 duration-200">
                                        <div className="flex justify-between items-center mb-4">
                                            <h4 className="text-sm font-bold text-gray-500 uppercase flex items-center gap-2">
                                                <Users size={16} /> {t.passengerManifest || "Passenger Manifest"}
                                            </h4>
                                        </div>

                                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs border-b border-gray-200">
                                                    <tr>
                                                        <th className="px-4 py-3">{t.tblCode || "Code"}</th>
                                                        <th className="px-4 py-3">{t.tblPassenger || "Passenger"}</th>
                                                        <th className="px-4 py-3">{t.tblContact || "Contact"}</th>
                                                        <th className="px-4 py-3 text-center">{t.tblSeats || "Seats"}</th>
                                                        <th className="px-4 py-3 text-center">{t.tblPax || "Pax"}</th>
                                                        <th className="px-4 py-3">{t.tblPayment || "Payment"}</th>
                                                        <th className="px-4 py-3">{t.tblStatus || "Status"}</th>
                                                        <th className="px-4 py-3 text-right">{t.tblActions || "Actions"}</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {trip.bookings.map((booking: Reservation) => (
                                                        <tr key={booking.id} className="hover:bg-blue-50/50 transition-colors">
                                                            <td className="px-4 py-3 font-mono font-bold text-gray-600">
                                                                {booking.booking_code.slice(0, 8)}
                                                            </td>
                                                            <td className="px-4 py-3 font-medium text-gray-900">
                                                                {booking.customer?.name || "-"}
                                                            </td>
                                                            <td className="px-4 py-3 text-gray-600 font-mono">
                                                                {booking.customer?.phone || "-"}
                                                            </td>
                                                            <td className="px-4 py-3 text-center font-bold text-primary">
                                                                {booking.seat_number || "Any"}
                                                            </td>
                                                            <td className="px-4 py-3 text-center font-bold text-gray-900">
                                                                {booking.passenger_count}
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <div className="flex flex-col gap-1 items-start">
                                                                    <span className={`
                                                                        inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border
                                                                        ${booking.payment_status === 'paid' ? 'bg-green-50 text-green-700 border-green-200' :
                                                                            booking.payment_status === 'partially_paid' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                                                                'bg-red-50 text-red-700 border-red-200'}
                                                                    `}>
                                                                        {booking.payment_status?.replace('_', ' ') || "UNPAID"}
                                                                    </span>
                                                                    {booking.payment_transactions && booking.payment_transactions.length > 0 && (
                                                                        booking.payment_transactions[booking.payment_transactions.length - 1].payment_method === 'cash' ? (
                                                                            <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded border border-gray-200 uppercase">
                                                                                CASH (Pay on Board)
                                                                            </span>
                                                                        ) : (
                                                                            <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 uppercase">
                                                                                {booking.payment_transactions[booking.payment_transactions.length - 1].payment_method}
                                                                            </span>
                                                                        )
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <span className={`
                                                                    inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase
                                                                    ${booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                                                        booking.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                                                                            'bg-gray-100 text-gray-600'}
                                                                `}>
                                                                    {booking.status === 'confirmed' && <CheckCircle size={10} />}
                                                                    {booking.status === 'pending' && <AlertCircle size={10} />}
                                                                    {booking.status === 'confirmed' ? (t.dashboardConfirmed || "Confirmed") : 
                                                                     booking.status === 'pending' ? (t.dashboardPending || "Pending") : 
                                                                     (t.cancelled || "CANCELLED")}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 text-right">
                                                                <div className="flex justify-end gap-2">
                                                                    {booking.status === 'pending' && (
                                                                        <button
                                                                            onClick={() => handleStatusUpdate(booking.id, 'confirmed')}
                                                                            className="text-green-600 hover:bg-green-50 p-1.5 rounded"
                                                                            title="Confirm"
                                                                        >
                                                                            <CheckCircle size={16} />
                                                                        </button>
                                                                    )}
                                                                    {booking.status !== 'cancelled' && (
                                                                        <button
                                                                            onClick={() => handleStatusUpdate(booking.id, 'cancelled')}
                                                                            className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded"
                                                                            title="Cancel (No-show)"
                                                                        >
                                                                            <XCircle size={16} />
                                                                        </button>
                                                                    )}
                                                                    <Link href={`/admin/bookings/${booking.id}`} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded font-bold uppercase text-xs flex items-center gap-1 border border-blue-200 ml-2">
                                                                        {t.btnDetails || "Details"}
                                                                    </Link>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
