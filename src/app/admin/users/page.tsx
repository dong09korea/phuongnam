"use client";

import { Search, MoreHorizontal, Mail, Phone, ShoppingBag } from "lucide-react";

export default function UsersPage() {
    const users = [
        { id: 1, name: "Nguyen Van A", email: "nguyenvana@gmail.com", phone: "0912 345 678", joined: "2026-01-15", bookings: 12, spent: "3,500,000 ₫", status: "VIP" },
        { id: 2, name: "Tran Ha My", email: "mytran@yahoo.com", phone: "0909 090 909", joined: "2026-02-10", bookings: 3, spent: "750,000 ₫", status: "Active" },
        { id: 3, name: "Le Hoang", email: "hoang.le@company.com", phone: "0988 777 666", joined: "2026-03-05", bookings: 1, spent: "250,000 ₫", status: "Active" },
        { id: 4, name: "Pham Tuan", email: "tuanpham@gmail.com", phone: "0911 222 333", joined: "2026-05-20", bookings: 0, spent: "0 ₫", status: "Inactive" },
        { id: 5, name: "Doan Van Hau", email: "haudoan@football.vn", phone: "0999 999 999", joined: "2026-06-01", bookings: 5, spent: "1,250,000 ₫", status: "Banned" },
    ];

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h1 style={{ fontSize: "24px", fontWeight: "bold" }}>Member Management</h1>
                <button className="btn btn-secondary">Export List</button>
            </div>

            <div className="card" style={{ padding: "0" }}>
                {/* Toolbar */}
                <div style={{ padding: "16px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: "16px" }}>
                    <div style={{ flex: 1, position: "relative", maxWidth: "400px" }}>
                        <Search size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
                        <input
                            type="text"
                            className="input-field"
                            placeholder="Search by name, email, phone..."
                            style={{ paddingLeft: "40px" }}
                        />
                    </div>
                </div>

                {/* User Table */}
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead style={{ backgroundColor: "#f9fafb" }}>
                        <tr>
                            <th style={{ padding: "16px", textAlign: "left", fontSize: "14px", color: "#6b7280" }}>Member Info</th>
                            <th style={{ padding: "16px", textAlign: "left", fontSize: "14px", color: "#6b7280" }}>Contact</th>
                            <th style={{ padding: "16px", textAlign: "left", fontSize: "14px", color: "#6b7280" }}>History</th>
                            <th style={{ padding: "16px", textAlign: "left", fontSize: "14px", color: "#6b7280" }}>Status</th>
                            <th style={{ padding: "16px", textAlign: "right", fontSize: "14px", color: "#6b7280" }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                                <td style={{ padding: "16px" }}>
                                    <div style={{ fontWeight: "600" }}>{user.name}</div>
                                    <div style={{ fontSize: "12px", color: "#9ca3af" }}>Joined {user.joined}</div>
                                </td>
                                <td style={{ padding: "16px" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", marginBottom: "4px" }}>
                                        <Mail size={14} color="#9ca3af" /> {user.email}
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }}>
                                        <Phone size={14} color="#9ca3af" /> {user.phone}
                                    </div>
                                </td>
                                <td style={{ padding: "16px" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: "500" }}>
                                        <ShoppingBag size={14} color="var(--primary)" /> {user.bookings} bookings
                                    </div>
                                    <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>Total: {user.spent}</div>
                                </td>
                                <td style={{ padding: "16px" }}>
                                    <span style={{
                                        padding: "4px 8px", borderRadius: "999px", fontSize: "12px", fontWeight: "600",
                                        backgroundColor: user.status === "VIP" ? "#fef3c7" : user.status === "Active" ? "#dcfce7" : user.status === "Banned" ? "#fee2e2" : "#f3f4f6",
                                        color: user.status === "VIP" ? "#d97706" : user.status === "Active" ? "#16a34a" : user.status === "Banned" ? "#dc2626" : "#6b7280"
                                    }}>
                                        {user.status}
                                    </span>
                                </td>
                                <td style={{ padding: "16px", textAlign: "right" }}>
                                    <button style={{ padding: "8px", borderRadius: "50%", border: "none", background: "transparent", cursor: "pointer", color: "#6b7280" }}>
                                        <MoreHorizontal size={20} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
