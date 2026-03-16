"use client";

import { Save } from "lucide-react";

export default function SettingsPage() {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "800px" }}>
            <h1 style={{ fontSize: "24px", fontWeight: "bold" }}>System Settings</h1>

            {/* Pricing Settings */}
            <div className="card">
                <h2 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "16px" }}>Pricing Configuration</h2>
                <div className="grid-cols-2" style={{ display: "grid", gap: "24px", gridTemplateColumns: "1fr 1fr" }}>
                    <div className="input-group">
                        <label className="input-label">Standard Seat Price (VND)</label>
                        <input type="number" className="input-field" defaultValue={250000} />
                    </div>
                    <div className="input-group">
                        <label className="input-label">Charter Price (VND)</label>
                        <input type="number" className="input-field" defaultValue={3000000} />
                    </div>
                </div>
            </div>

            {/* Company Info */}
            <div className="card">
                <h2 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "16px" }}>Company Information</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div className="input-group">
                        <label className="input-label">Company Name</label>
                        <input type="text" className="input-field" defaultValue="Phuong Nam Transport" />
                    </div>
                    <div className="grid-cols-2" style={{ display: "grid", gap: "24px", gridTemplateColumns: "1fr 1fr" }}>
                        <div className="input-group">
                            <label className="input-label">Hotline</label>
                            <input type="text" className="input-field" defaultValue="0999 888 777" />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Support Email</label>
                            <input type="email" className="input-field" defaultValue="support@maianh.vn" />
                        </div>
                    </div>
                    <div className="input-group">
                        <label className="input-label">Payment Bank Account</label>
                        <input type="text" className="input-field" defaultValue="VIETCOMBANK - 9938 2212 9999 - PHUONG NAM TRANSPORT" />
                    </div>
                </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button className="btn btn-primary" style={{ gap: "8px" }}>
                    <Save size={18} /> Save Changes
                </button>
            </div>
        </div>
    );
}
