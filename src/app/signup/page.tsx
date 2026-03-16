"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Lock, User, Mail, Phone, Bus } from "lucide-react";
import { supabase } from "@/lib/supabase"; // Assuming supabase client is initialized here

export default function SignupPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [fullName, setFullName] = useState("");
    const [username, setUsername] = useState(""); // Added Username
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                        username: username, // Save Username
                        phone: phone,
                    },
                },
            });

            if (error) throw error;

            alert("Signup successful! Please check your email to confirm.");
            router.push("/login"); // Direct login might require email confirmation depending on Supabase settings
        } catch (error: any) {
            alert("Error: " + error.message);
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
                    <h1 style={{ fontSize: "24px", fontWeight: "bold", color: "#1f2937" }}>Create Account</h1>
                    <p style={{ color: "#6b7280" }}>Join us for premium transport services</p>
                </div>

                <div className="card">
                    <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

                        <div className="input-group">
                            <label className="input-label">Username (ID)</label>
                            <div style={{ position: "relative" }}>
                                <User size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="your_id"
                                    style={{ paddingLeft: "40px" }}
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="input-group">
                            <label className="input-label">Full Name</label>
                            <div style={{ position: "relative" }}>
                                <User size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="Nguyen Van A"
                                    style={{ paddingLeft: "40px" }}
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="input-group">
                            <label className="input-label">Phone Number</label>
                            <div style={{ position: "relative" }}>
                                <Phone size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
                                <input
                                    type="tel"
                                    className="input-field"
                                    placeholder="0912 345 678"
                                    style={{ paddingLeft: "40px" }}
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="input-group">
                            <label className="input-label">Email Address</label>
                            <div style={{ position: "relative" }}>
                                <Mail size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
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

                        <button
                            type="submit"
                            className="btn btn-primary"
                            style={{ width: "100%", marginTop: "8px", opacity: loading ? 0.7 : 1 }}
                            disabled={loading}
                        >
                            {loading ? "Create Account" : "Sign Up"}
                        </button>
                    </form>

                    <div style={{ marginTop: "24px", textAlign: "center", fontSize: "14px", color: "#6b7280" }}>
                        Already have an account? <Link href="/login" style={{ color: "var(--primary)", fontWeight: "600", textDecoration: "none" }}>Sign in</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
