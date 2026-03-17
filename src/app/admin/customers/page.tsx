"use client";

import { useEffect, useState } from "react";
import { getReservations } from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";
import { User, Phone, DollarSign, Calendar } from "lucide-react";

interface Customer {
    passenger_name: string;
    passenger_phone: string;
    total_spent: number;
    last_booking: string;
    booking_count: number;
}

export default function AdminCustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            // Aggregate customers from the backend reservations API
            const reservations = await getReservations();
            
            if (reservations && Array.isArray(reservations)) {
                const customerMap = new Map<string, Customer>();

                // Sort reservations desc to get most recent last_booking easily
                reservations.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

                reservations.forEach((booking: any) => {
                    const phone = booking.customer?.phone || booking.customer_id?.toString() || "Unknown";
                    const name = booking.customer?.name || "Unknown";
                    const key = phone; 

                    if (!customerMap.has(key)) {
                        customerMap.set(key, {
                            passenger_name: name,
                            passenger_phone: phone,
                            total_spent: 0,
                            last_booking: booking.created_at,
                            booking_count: 0
                        });
                    }

                    const customer = customerMap.get(key)!;
                    customer.total_spent += booking.total_amount || 0;
                    customer.booking_count += 1;
                });

                setCustomers(Array.from(customerMap.values()));
            }
        } catch (error) {
            console.error("Failed to load customers:", error);
        } finally {
            setLoading(false);
        }
    };

    const { t } = useLanguage();

    if (loading) return <div>{t.loadingBooking || "Loading customers..."}</div>;

    return (
        <div>
            <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#171717", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "24px" }}>
                {t.adminCustomers || "Customer Database"}
            </h1>

            <div className="card" style={{ padding: 0, border: "2px solid #171717", borderRadius: "0px" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead style={{ backgroundColor: "#171717", color: "white" }}>
                        <tr>
                            <th style={{ padding: "16px", textAlign: "left" }}>{t.customerName || "Name"}</th>
                            <th style={{ padding: "16px", textAlign: "left" }}>{t.customerPhone || "Phone"}</th>
                            <th style={{ padding: "16px", textAlign: "left" }}>{t.customerBookings || "Bookings"}</th>
                            <th style={{ padding: "16px", textAlign: "left" }}>{t.customerSpent || "Total Spent"}</th>
                            <th style={{ padding: "16px", textAlign: "right" }}>{t.customerActive || "Last Active"}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {customers.map((c, idx) => (
                            <tr key={idx} style={{ borderBottom: "1px solid #e5e5e5" }}>
                                <td style={{ padding: "16px", fontWeight: "700" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                        <div style={{ width: "32px", height: "32px", backgroundColor: "#f3f4f6", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                            <User size={16} />
                                        </div>
                                        {c.passenger_name}
                                    </div>
                                </td>
                                <td style={{ padding: "16px", fontFamily: "monospace" }}>{c.passenger_phone}</td>
                                <td style={{ padding: "16px" }}>
                                    <span style={{ backgroundColor: "#eff6ff", color: "#1d4ed8", padding: "4px 12px", borderRadius: "12px", fontSize: "12px", fontWeight: "700" }}>
                                        {c.booking_count} {t.trips || "trips"}
                                    </span>
                                </td>
                                <td style={{ padding: "16px", fontWeight: "700", color: "#059669" }}>
                                    {c.total_spent.toLocaleString()} ₫
                                </td>
                                <td style={{ padding: "16px", textAlign: "right", color: "#6b7280", fontSize: "14px" }}>
                                    {new Date(c.last_booking).toLocaleDateString()}
                                </td>
                            </tr>
                        ))}
                        {customers.length === 0 && (
                            <tr>
                                <td colSpan={5} style={{ padding: "32px", textAlign: "center", color: "#9ca3af" }}>{t.noCustomersFound || "No customers found."}</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
