"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Calendar, Users, ArrowRight } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function SearchWidget() {
    const router = useRouter();
    const { t, language } = useLanguage();
    const [formData, setFormData] = useState({
        from: "HCMC District 1",
        to: "Vung Tau City Center",
        date: "",
        passengers: 1,
    });

    const locations = [
        "HCMC District 1",
        "Vung Tau City Center",
        "Tan Son Nhat Airport"
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.push(`/booking?from=${formData.from}&to=${formData.to}&date=${formData.date}`);
    };

    // Helper to format date relative to selected language
    // Note: <input type="date"> display is browser-dependent, so we can't fully control the input's visual format 
    // without a custom library. But we can ensure standard defaults.

    return (
        <div className="card" style={{ maxWidth: "1000px", margin: "0 auto", marginTop: "-50px", position: "relative", zIndex: 10, borderRadius: "0px", border: "2px solid #171717", boxShadow: "8px 8px 0px 0px rgba(220, 38, 38, 1)" }}>
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <div className="grid-cols-4" style={{ display: "grid", gap: "16px" }}>

                    {/* Origin */}
                    <div className="input-group">
                        <label className="input-label flex items-center gap-2">
                            <MapPin size={16} /> {t.from}
                        </label>
                        <select
                            className="input-field"
                            value={formData.from}
                            onChange={(e) => setFormData({ ...formData, from: e.target.value })}
                        >
                            {locations.map(loc => (
                                <option key={loc} value={loc}>{loc}</option>
                            ))}
                        </select>
                    </div>

                    {/* Destination */}
                    <div className="input-group">
                        <label className="input-label flex items-center gap-2">
                            <MapPin size={16} /> {t.to}
                        </label>
                        <select
                            className="input-field"
                            value={formData.to}
                            onChange={(e) => setFormData({ ...formData, to: e.target.value })}
                        >
                            {locations.map(loc => (
                                <option key={loc} value={loc} disabled={loc === formData.from}>
                                    {loc}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Date */}
                    <div className="input-group">
                        <label className="input-label flex items-center gap-2">
                            <Calendar size={16} /> {t.date}
                        </label>
                        {/* 
                           Note: The native date input format is determined by the User's Browser/OS Locale, NOT the page language.
                           To force a specific format, we would need a custom DatePicker component. 
                           For now, we use standard input.
                        */}
                        <input
                            type="date"
                            className="input-field"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            required
                        />
                    </div>

                    {/* Passengers */}
                    <div className="input-group">
                        <label className="input-label flex items-center gap-2">
                            <Users size={16} /> {t.passengers}
                        </label>
                        <select
                            className="input-field"
                            value={formData.passengers}
                            onChange={(e) => setFormData({ ...formData, passengers: Number(e.target.value) })}
                        >
                            {[1, 2, 3, 4, 5, 12].map((num) => (
                                <option key={num} value={num}>
                                    {num} {num === 1 ? t.person : t.people}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex justify-between items-center" style={{ borderTop: "1px solid var(--border)", paddingTop: "16px" }}>
                    <div className="text-sm text-gray-500">
                        {t.recentSearches}: <span className="font-medium text-orange-500">{formData.from.split(' ')[0]} → {formData.to.split(' ')[0]}</span>
                    </div>
                    <button type="submit" className="btn btn-primary">
                        {t.searchButton} <ArrowRight size={18} style={{ marginLeft: "8px" }} />
                    </button>
                </div>
            </form>
        </div>
    );
}
