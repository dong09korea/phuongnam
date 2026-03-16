"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Lock, User, Bus } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
    const router = useRouter();
    const { t } = useLanguage();
    const [loading, setLoading] = useState(false);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            router.push("/");
        } catch (error: any) {
            alert("Login failed: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: "100vh", backgroundColor: "#f9fafb", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "16px" }}>
            <div style={{ width: "100%", maxWidth: "400px", display: "flex", flexDirection: "column", gap: "24px" }}>

                <div style={{ textAlign: "center" }}>
                    <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "var(--primary)", fontWeight: "bold", fontSize: "24px", textDecoration: "none", marginBottom: "8px" }}>
                        <Bus size={32} />
                        <span>Phuong Nam</span>
                    </Link>
                    <h1 style={{ fontSize: "24px", fontWeight: "bold", color: "#1f2937" }}>Welcome back</h1>
                    <p style={{ color: "#6b7280" }}>Sign in to manage your bookings</p>
                </div>

                <div className="card">
                    <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        <div className="input-group">
                            <label className="input-label">Email</label>
                            <div style={{ position: "relative" }}>
                                <User size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
                                <input
                                    type="email"
                                    className="input-field"
                                    placeholder="example@email.com"
                                    style={{ paddingLeft: "40px" }}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="input-group">
                            <label className="input-label">Password</label>
                            <div style={{ position: "relative" }}>
                                <Lock size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
                                <input
                                    type="password"
                                    className="input-field"
                                    placeholder="••••••••"
                                    style={{ paddingLeft: "40px" }}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
                            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                                <input type="checkbox" style={{ borderRadius: "4px" }} />
                                <span style={{ color: "#6b7280" }}>Remember me</span>
                            </label>
                            <a href="#" style={{ color: "var(--primary)", textDecoration: "none" }}>Forgot Password?</a>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary"
                            style={{ width: "100%", marginTop: "8px", opacity: loading ? 0.7 : 1 }}
                            disabled={loading}
                        >
                            {loading ? "Signing in..." : "Sign In"}
                        </button>
                    </form>

                    <div style={{ marginTop: "24px", textAlign: "center", fontSize: "14px", color: "#6b7280" }}>
                        Don't have an account? <Link href="/signup" style={{ color: "var(--primary)", fontWeight: "600", textDecoration: "none" }}>Create free account</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
