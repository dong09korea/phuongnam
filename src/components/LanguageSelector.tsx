"use client";

import { useLanguage } from "@/context/LanguageContext";
import { Language } from "@/lib/translations";
import clsx from "clsx";

export default function LanguageSelector() {
    const { language, setLanguage } = useLanguage();

    const languages: { code: Language; label: string }[] = [
        { code: "vi", label: "VN Tiếng Việt" },
        { code: "ko", label: "KR 한국어" },
        { code: "en", label: "US English" },
    ];

    return (
        <div style={{ display: "flex", alignItems: "center", backgroundColor: "#f3f4f6", padding: "4px", borderRadius: "999px", border: "1px solid #e5e7eb" }}>
            {languages.map((lang) => (
                <button
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)}
                    style={{
                        padding: "6px 12px", borderRadius: "999px", fontSize: "14px", fontWeight: "500", transition: "0.2s", display: "flex", alignItems: "center", gap: "8px", border: "none", cursor: "pointer",
                        backgroundColor: language === lang.code ? "white" : "transparent",
                        color: language === lang.code ? "var(--primary)" : "#6b7280",
                        boxShadow: language === lang.code ? "0 1px 2px rgba(0,0,0,0.1)" : "none"
                    }}
                >
                    <span className="font-bold">
                        {lang.label}
                    </span>
                </button>
            ))}
        </div>
    );
}
