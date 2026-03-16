"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User, Calendar, MapPin, Clock, Ticket } from "lucide-react";

export default function ProfilePage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push("/login");
                return;
            }
            setUser(user);

            // Fetch bookings for this user
            const { data, error } = await supabase
                .from('bookings')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (data) setBookings(data);
            setLoading(false);
        };

        checkUser();
    }, [router]);

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

    return (
        <div style={{ minHeight: "100vh", backgroundColor: "#f9fafb", paddingBottom: "80px" }}>
            {/* Header */}
            <header style={{ backgroundColor: "white", borderBottom: "1px solid #e5e7eb", padding: "16px 0" }}>
                <div className="container" style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <Link href="/" className="hover:text-primary transition-colors">
                        <ArrowLeft size={24} />
                    </Link>
                    <h1 style={{ fontSize: "20px", fontWeight: "bold" }}>My Profile</h1>
                </div>
            </header>

            <div className="container mt-8 grid-responsive" style={{ alignItems: "start" }}>

                {/* User Info Card */}
                <div className="card">
                    <div style={{ display: "flex", flexDirection: "column", items: "center", textAlign: "center", gap: "12px" }}>
                        <div style={{
                            width: "80px", height: "80px",
                            backgroundColor: "#eff6ff", color: "var(--primary)",
                            borderRadius: "50%",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            margin: "0 auto"
                        }}>
                            <User size={40} />
                        </div>
                        <h2 style={{ fontSize: "18px", fontWeight: "bold" }}>
                            {user?.user_metadata?.name || user?.email?.split('@')[0]}
                        </h2>
                        <div style={{ color: "#6b7280", fontSize: "14px" }}>
                            {user?.email}
                        </div>
                        <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #e5e7eb", width: "100%" }}>
                            <button
                                onClick={async () => {
                                    await supabase.auth.signOut();
                                    router.push("/");
                                }}
                                className="text-red-500 font-medium hover:text-red-700 w-full"
                            >
                                Log Out
                            </button>
                        </div>
                    </div>
                </div>

                {/* Bookings List */}
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                    <h3 style={{ fontSize: "18px", fontWeight: "bold", display: "flex", alignItems: "center", gap: "8px" }}>
                        <Ticket size={20} /> My Bookings
                    </h3>

                    {bookings.length === 0 ? (
                        <div className="card text-center py-12">
                            <div style={{ opacity: 0.5, marginBottom: "16px" }}>No bookings found.</div>
                            <Link href="/booking" className="btn btn-primary inline-block">
                                Book a Trip
                            </Link>
                        </div>
                    ) : (
                        bookings.map((booking) => (
                            <Link href={`/ticket?booking_id=${booking.id}`} key={booking.id} style={{ textDecoration: "none", color: "inherit" }}>
                                <div className="card hover:shadow-md transition-shadow cursor-pointer" style={{ borderLeft: `4px solid ${booking.status === 'confirmed' ? 'var(--primary)' : '#9ca3af'}` }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                                        <div style={{ fontWeight: "600", color: "var(--secondary)" }}>
                                            {booking.route}
                                        </div>
                                        <div style={{
                                            fontSize: "12px",
                                            padding: "4px 8px",
                                            borderRadius: "99px",
                                            backgroundColor: booking.status === 'confirmed' ? "#ecfdf5" : "#f3f4f6",
                                            color: booking.status === 'confirmed' ? "#059669" : "#4b5563",
                                            fontWeight: "600",
                                            textTransform: "capitalize"
                                        }}>
                                            {booking.status}
                                        </div>
                                    </div>

                                    <div style={{ display: "flex", gap: "24px", fontSize: "14px", color: "#4b5563" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                            <Calendar size={14} /> {booking.departure_date}
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                            <Clock size={14} /> {booking.departure_time || "07:30"}
                                        </div>
                                    </div>

                                    <div style={{ marginTop: "12px", fontSize: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <span style={{ color: "#6b7280" }}>
                                            Seats: <span style={{ fontWeight: "600", color: "black" }}>{Array.isArray(booking.seats) ? booking.seats.join(", ") : booking.seats}</span>
                                        </span>
                                        <span style={{ fontWeight: "bold", color: "var(--primary)" }}>
                                            {booking.total_amount?.toLocaleString()} ₫
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
