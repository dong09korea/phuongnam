"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
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
        // Since we don't have a dedicated public profiles table sync set up yet,
        // we will aggregate customers from the 'bookings' table.
        const { data: bookings } = await supabase
            .from('bookings')
            .select('*')
            .order('created_at', { ascending: false });

        if (bookings) {
            const customerMap = new Map<string, Customer>();

            bookings.forEach(booking => {
                const key = booking.passenger_phone || booking.passenger_name; // Use phone as unique key if possible

                if (!customerMap.has(key)) {
                    customerMap.set(key, {
                        passenger_name: booking.passenger_name,
                        passenger_phone: booking.passenger_phone,
                        total_spent: 0,
                        last_booking: booking.created_at,
                        booking_count: 0
                    });
                }

                const customer = customerMap.get(key)!;
                customer.total_spent += booking.total_amount || 0;
                customer.booking_count += 1;
                // keep earliest date? No, we sorted by desc, so first one encountered is latest.
                // Wait, if we iterate list sorted desc, the first one is the latest.
                // So we just set it once.
            });

            setCustomers(Array.from(customerMap.values()));
        }
        setLoading(false);
    };

    if (loading) return <div>Loading customers...</div>;

    return (
        <div>
            <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#171717", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "24px" }}>
                Customer Database
            </h1>

            <div className="card" style={{ padding: 0, border: "2px solid #171717", borderRadius: "0px" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead style={{ backgroundColor: "#171717", color: "white" }}>
                        <tr>
                            <th style={{ padding: "16px", textAlign: "left" }}>Name</th>
                            <th style={{ padding: "16px", textAlign: "left" }}>Phone</th>
                            <th style={{ padding: "16px", textAlign: "left" }}>Bookings</th>
                            <th style={{ padding: "16px", textAlign: "left" }}>Total Spent</th>
                            <th style={{ padding: "16px", textAlign: "right" }}>Last Active</th>
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
                                        {c.booking_count} trips
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
                                <td colSpan={5} style={{ padding: "32px", textAlign: "center", color: "#9ca3af" }}>No customers found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
