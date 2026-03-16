"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Shield, Clock, Wifi, Star, User, Lock } from "lucide-react";
import SearchWidget from "@/components/SearchWidget";
import RecentSearches from "@/components/RecentSearches";
import LanguageSelector from "@/components/LanguageSelector";
import { useLanguage } from "@/context/LanguageContext";

function HeroCarousel() {
  const { t } = useLanguage();
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    { image: "/minibus-exterior.png", alt: "Premium Minibus Exterior" },
    { image: "/minibus-interior.png", alt: "Luxury Interior" }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000); // Change every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <section style={{
      height: "500px",
      position: "relative",
      overflow: "hidden",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "white",
      textAlign: "center"
    }}>
      {slides.map((slide, idx) => (
        <div
          key={idx}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundImage: `linear-gradient(rgba(61, 23, 41, 0.6), rgba(61, 23, 41, 0.6)), url('${slide.image}')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: currentSlide === idx ? 1 : 0,
            transition: "opacity 1.5s ease-in-out",
            zIndex: currentSlide === idx ? 1 : 0
          }}
        />
      ))}

      <div style={{ position: "relative", zIndex: 10, padding: "0 20px" }}>
        <h1 style={{ fontSize: "48px", fontWeight: "800", marginBottom: "16px", textShadow: "0 2px 4px rgba(0,0,0,0.5)" }}>
          {t.heroTitle}
        </h1>
        <p style={{ fontSize: "18px", opacity: 0.95, textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}>
          {t.heroSubtitle}
        </p>
      </div>

      {/* Slide Indicators */}
      <div style={{ position: "absolute", bottom: "30px", zIndex: 10, display: "flex", gap: "10px" }}>
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentSlide(idx)}
            style={{
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              border: "2px solid white",
              background: currentSlide === idx ? "white" : "transparent",
              cursor: "pointer",
              transition: "all 0.3s"
            }}
            aria-label={`Slide ${idx + 1}`}
          />
        ))}
      </div>
    </section>
  );
}

export default function Home() {
  const { t } = useLanguage();
  // MVP: Customers do not need login, only Admins. 
  const user = null;

  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "var(--primary)" }}>
      {/* Navigation */}
      <nav style={{ background: "rgba(0,0,0,0.2)", padding: "20px 0", borderBottom: "1px solid rgba(255,255,255,0.2)" }}>
        <div className="container flex justify-between items-center">
          <div style={{ fontSize: "24px", fontWeight: "800", color: "white" }}>
            Phuong Nam <span style={{ color: "var(--secondary)" }}>TRANSPORT</span>
          </div>
          <div className="flex gap-6 font-medium items-center">
            <Link href="/" className="text-white hover:text-secondary transition-colors">{t.home}</Link>
            <Link href="/booking" className="text-white hover:text-secondary transition-colors">{t.booking}</Link>
            <Link href="#" className="text-white hover:text-secondary transition-colors">{t.contact}</Link>

            <div className="h-6 w-px bg-white/30 mx-2"></div>

            <LanguageSelector />
            
            <Link href="/admin/login" className="btn btn-primary" style={{ padding: "8px 16px", borderRadius: "999px", fontSize: "14px", marginLeft: "8px", fontWeight: "bold" }}>
              <User size={18} style={{ marginRight: "6px" }} /> SIGN IN
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section with Auto-Sliding Images */}
      <HeroCarousel />

      {/* Widget Container */}
      <div className="container">
        <SearchWidget />
      </div>

      {/* Recent Searches */}
      <RecentSearches />

      {/* Features Section */}
      {/* Features Section */}
      <section className="container" style={{ marginTop: "80px", flex: 1, paddingBottom: "80px" }}>
        <h2 style={{ fontSize: "28px", fontWeight: "700", marginBottom: "40px", textAlign: "center", color: "white" }}>
          {t.whyChooseUs}
        </h2>

        {/* Using standard Tailwind grid classes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: Shield, title: t.safeJourney, desc: t.safeJourneyDesc },
            { icon: Clock, title: t.onTime, desc: t.onTimeDesc },
            { icon: Wifi, title: t.freeWifi, desc: t.freeWifiDesc },
            { icon: Star, title: t.premiumSeats, desc: t.premiumSeatsDesc },
          ].map((feature, idx) => (
            <div key={idx} className="card flex flex-col items-center text-center p-6 hover:shadow-lg transition-shadow">
              <div style={{
                background: "rgba(61, 23, 41, 0.1)",
                padding: "16px",
                borderRadius: "50%",
                color: "var(--primary)",
                marginBottom: "16px"
              }}>
                <feature.icon size={32} />
              </div>
              <h3 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "8px" }}>{feature.title}</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ backgroundColor: "rgba(0,0,0,0.3)", color: "white", padding: "40px 0", marginTop: "80px" }}>
        <div className="container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ opacity: 0.7, fontSize: "14px" }}>
            © 2026 Phuong Nam Transport. All rights reserved.
          </div>
          <div style={{ display: "flex", gap: "24px", alignItems: "center" }}>
            <Link href="#" style={{ color: "white", textDecoration: "none", fontSize: "14px", opacity: 0.7 }} className="hover:opacity-100">Privacy Policy</Link>
            <Link href="#" style={{ color: "white", textDecoration: "none", fontSize: "14px", opacity: 0.7 }} className="hover:opacity-100">Terms of Service</Link>
            <Link href="/admin/login" style={{ display: "flex", alignItems: "center", gap: "6px", color: "#fb7185", textDecoration: "none", fontSize: "12px", background: "rgba(255,255,255,0.1)", padding: "4px 10px", borderRadius: "4px" }}>
              <Lock size={12} /> Admin Access
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
