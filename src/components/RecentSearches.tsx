import Link from "next/link";
import { Clock, MapPin, ArrowRight } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function RecentSearches() {
    const { t } = useLanguage();

    // Mock data mimicking the user's screenshot
    const searches = [
        { from: "TP. Vung Tau", to: "TP. Ho Chi Minh", time: "19:30", date: "Thứ 3, 11/11/2026", duration: "03h 30p" },
        { from: "TP. Ho Chi Minh", to: "TP. Vung Tau", time: "22:00", date: "Thứ 3, 11/11/2026", duration: "03h 30p" },
        { from: "TP. Vung Tau", to: "TP. Ho Chi Minh", time: "14:30", date: "Thứ 4, 12/11/2026", duration: "03h 30p" },
        { from: "TP. Ho Chi Minh", to: "TP. Vung Tau", time: "08:00", date: "Thứ 4, 12/11/2026", duration: "03h 30p" },
    ];

    return (
        <div className="container" style={{ marginTop: "32px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "16px", color: "var(--secondary)" }}>
                {t.recentSearches || "Recent Searches"}
            </h3>

            <div style={{
                display: "flex",
                gap: "16px",
                overflowX: "auto",
                paddingBottom: "8px",
                scrollbarWidth: "none" // Firefox
            }} className="no-scrollbar">
                {searches.map((item, idx) => (
                    <Link href="/booking" key={idx} style={{ textDecoration: "none" }}>
                        <div className="card hover:shadow-md transition-shadow" style={{
                            minWidth: "280px",
                            padding: "16px",
                            border: "1px solid #e5e7eb",
                            borderRadius: "12px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "12px",
                            backgroundColor: "white"
                        }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div>
                                    <div style={{ fontSize: "12px", color: "#6b7280" }}>{item.from}</div>
                                    <div style={{ fontSize: "18px", fontWeight: "bold", color: "var(--secondary)" }}>{item.time}</div>
                                    <div style={{ fontSize: "12px", color: "#9ca3af" }}>{item.date}</div>
                                </div>

                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                                    <div style={{ fontSize: "10px", color: "var(--primary)", fontWeight: "600" }}>{item.duration}</div>
                                    <ArrowRight size={16} style={{ color: "var(--primary)" }} />
                                </div>

                                <div style={{ textAlign: "right" }}>
                                    <div style={{ fontSize: "12px", color: "#6b7280" }}>{item.to}</div>
                                    <div style={{ fontSize: "18px", fontWeight: "bold", color: "var(--secondary)" }}>--:--</div>
                                    {/* Arrival time calculated or hidden */}
                                    <div style={{ fontSize: "12px", color: "#9ca3af" }}>{item.date}</div>
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
