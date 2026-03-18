"use client";

import { useEffect, useState } from "react";
import { getDashboardStats } from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";
import { DollarSign, Ticket, Users, TrendingUp } from "lucide-react";

export default function AdminDashboard() {
    const { t } = useLanguage();
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalBookings: 0,
        confirmedBookings: 0,
        pendingBookings: 0
    });
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState("");

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await getDashboardStats();
                setStats({
                    totalRevenue: data.total_revenue || 0,
                    totalBookings: data.total_bookings || 0,
                    confirmedBookings: data.confirmed_bookings || 0,
                    pendingBookings: data.pending_bookings || 0
                });
            } catch (err: any) {
                console.error("Failed to load dashboard stats:", err);
                setErrorMsg(err.message || "Failed to load stats. Please check login session.");
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) return <div>{t.dashboardLoading || "Loading dashboard..."}</div>;

    if (errorMsg) return (
        <div>
            <h1 className="text-2xl font-bold mb-4">{t.dashboardError || "Dashboard Error"}</h1>
            <div className="bg-red-50 text-red-600 p-4 rounded">{errorMsg}</div>
        </div>
    );

    const cards = [
        { label: t.totalRevenue || "Total Revenue", value: `${stats.totalRevenue.toLocaleString()} ₫`, icon: DollarSign, color: "#10b981", bg: "#ecfdf5" },
        { label: t.totalBookings || "Total Bookings", value: stats.totalBookings, icon: Ticket, color: "#3b82f6", bg: "#eff6ff" },
        { label: t.dashboardConfirmed || "Confirmed", value: stats.confirmedBookings, icon: CheckSquare, color: "#f59e0b", bg: "#fffbeb" },
        { label: t.dashboardPending || "Pending", value: stats.pendingBookings, icon: TrendingUp, color: "#6366f1", bg: "#eef2ff" },
    ];

    return (
        <div>
            <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#111827", marginBottom: "8px" }}>{t.dashboardOverview || "Dashboard Overview"}</h1>
            <p style={{ color: "#6b7280", marginBottom: "32px" }}>{t.welcomeAdmin || "Welcome back, Administrator."}</p>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" style={{ marginBottom: "40px" }}>
                {cards.map((card, idx) => (
                    <div key={idx} className="card" style={{ padding: "24px", display: "flex", alignItems: "center", gap: "20px" }}>
                        <div style={{
                            width: "56px", height: "56px", borderRadius: "12px",
                            backgroundColor: card.bg, color: card.color,
                            display: "flex", alignItems: "center", justifyContent: "center"
                        }}>
                            <card.icon size={28} color={card.color} />
                        </div>
                        <div>
                            <div style={{ fontSize: "14px", color: "#6b7280", fontWeight: "500" }}>{card.label}</div>
                            <div style={{ fontSize: "24px", fontWeight: "800", color: "#111827" }}>{card.value}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Activity Placeholder */}
            <div className="card">
                <h2 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "16px", color: "#1f2937" }}>{t.recentActivity || "Recent Activity"}</h2>
                <div style={{ padding: "20px", textAlign: "center", color: "#9ca3af", backgroundColor: "#f9fafb", borderRadius: "8px", border: "1px dashed #e5e7eb" }}>
                    {t.recentActivityDesc || "Chart or Recent Activity List will go here."}
                </div>
            </div>
        </div>
    );
}

// Icon helper
function CheckSquare({ size, color = "currentColor" }: { size: number, color?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 11 12 14 22 4"></polyline>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
        </svg>
    )
}
