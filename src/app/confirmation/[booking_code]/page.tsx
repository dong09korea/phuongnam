"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle, Download, Home, Loader2, Bus, AlertCircle } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { getBooking, initializePayment } from "@/lib/api";

export default function ConfirmationPage({ params }: { params: Promise<{ booking_code: string }> }) {
    const { t } = useLanguage();
    const resolvedParams = React.use(params);
    const bookingCode = resolvedParams.booking_code;

    const [booking, setBooking] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState("");
    const [paymentLoading, setPaymentLoading] = useState(false);

    useEffect(() => {
        if (!bookingCode) {
            setErrorMsg("Invalid booking code");
            setLoading(false);
            return;
        }
        fetchBooking(bookingCode);
    }, [bookingCode]);

    const fetchBooking = async (code: string) => {
        try {
            const data = await getBooking(code);
            setBooking(data);
        } catch (error: any) {
            setErrorMsg(error.message || "Booking not found");
        } finally {
            setLoading(false);
        }
    };

    const handlePayment = async (paymentType: "deposit" | "full") => {
        try {
            setPaymentLoading(true);
            const txn = await initializePayment(bookingCode, "vnpay", paymentType);
            // Mock gateway redirect
            if (txn.payment_url) {
                window.location.href = txn.payment_url;
            } else {
                alert("Payment initialized successfully, but no URL returned.");
            }
        } catch (error: any) {
            alert(error.message || "Target payment gateway error");
        } finally {
            setPaymentLoading(false);
        }
    };

    if (loading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-primary" size={40} /></div>;
    }

    if (errorMsg || !booking) {
        return (
            <div className="flex h-screen items-center justify-center flex-col gap-4">
                <AlertCircle className="text-red-500" size={48} />
                <h2 className="text-xl font-bold">Error loading booking</h2>
                <p className="text-gray-500">{errorMsg}</p>
                <Link href="/" className="btn btn-primary mt-4">Return Home</Link>
            </div>
        );
    }

    const {
        booking_code,
        status,
        trip_type,
        from_location,
        to_location,
        depart_date,
        depart_time,
        passenger_count,
        seat_number,
        total_amount,
        payment_status,
        deposit_amount,
        balance_amount,
        customer,
        vehicle
    } = booking;

    const fromCity = from_location.replace("TP. ", "");
    const toCity = to_location.replace("TP. ", "");
    const isCancelled = status === "cancelled";

    return (
        <div style={{
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            minHeight: "100vh", padding: "20px", background: "#f9fafb"
        }}>
            <div style={{
                width: "100%", maxWidth: "380px", backgroundColor: "white",
                boxShadow: "10px 10px 0px 0px rgba(0, 0, 0, 0.1)", border: "2px solid #171717",
                overflow: "hidden", position: "relative", opacity: isCancelled ? 0.7 : 1
            }}>
                {/* Header */}
                <div style={{
                    backgroundColor: isCancelled ? "#525252" : "var(--primary)",
                    padding: "32px 24px", color: "white", textAlign: "center",
                    borderBottom: "2px solid #171717", marginBottom: "-24px", paddingBottom: "48px"
                }}>
                    <h1 style={{ fontSize: "24px", fontWeight: "800", letterSpacing: "-0.5px", textTransform: "uppercase" }}>
                        {isCancelled ? "CANCELLED" : "Booking Confirmed"}
                    </h1>
                    <p style={{ fontSize: "14px", opacity: 0.9, letterSpacing: "2px", marginTop: "4px", textTransform: "uppercase" }}>{t.boardingPass}</p>
                </div>

                {/* Ticket Card Content */}
                <div style={{ padding: "0 24px 32px 24px", paddingTop: "0" }}>
                    <div style={{ backgroundColor: "white", padding: "20px", border: "2px solid #e5e5e5", marginBottom: "24px", marginTop: "24px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                            <div style={{ fontSize: "12px", color: "#6b7280", fontWeight: "700", textTransform: "uppercase" }}>{t.from}</div>
                            <div style={{ fontSize: "12px", color: "#6b7280", fontWeight: "700", textTransform: "uppercase" }}>{t.to}</div>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div style={{ textAlign: "left" }}>
                                <div style={{ fontSize: "18px", fontWeight: "800", color: "#171717" }}>{fromCity}</div>
                                <div style={{ fontSize: "24px", fontWeight: "800", color: "var(--primary)", marginTop: "4px" }}>{depart_time || "TBD"}</div>
                            </div>

                            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", margin: "0 12px" }}>
                                <div style={{ fontSize: "12px", fontWeight: "700", color: "#6b7280", marginBottom: "4px" }}>{trip_type === "round_trip" ? "Round Trip" : "One Way"}</div>
                                <div style={{ width: "100%", height: "1px", background: "#e5e5e5", position: "relative" }}>
                                    <div style={{ position: "absolute", top: "-6px", left: "50%", transform: "translateX(-50%)", background: "white", padding: "0 4px", color: "#171717" }}>
                                        <Bus size={14} />
                                    </div>
                                </div>
                            </div>

                            <div style={{ textAlign: "right" }}>
                                <div style={{ fontSize: "18px", fontWeight: "800", color: "#171717" }}>{toCity}</div>
                                <div style={{ fontSize: "24px", fontWeight: "800", color: "#171717", marginTop: "4px" }}>
                                    {/* Mock arrival time since API might not return it natively without schedule join yet */}
                                    {"TBD"}
                                </div>
                            </div>
                        </div>

                        <div style={{ display: "flex", justifyContent: "center", marginTop: "16px" }}>
                            <div style={{
                                display: "inline-flex", alignItems: "center", gap: "6px",
                                backgroundColor: status === "pending" ? "#fef08a" : "#bbf7d0", 
                                color: status === "pending" ? "#854d0e" : "#166534",
                                padding: "6px 16px", fontSize: "13px", fontWeight: "700", textTransform: "uppercase", 
                                border: `1px solid ${status === "pending" ? "#854d0e" : "#166534"}`
                            }}>
                                {status === "pending" ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />} 
                                {status.toUpperCase()}
                            </div>
                        </div>
                    </div>

                    {/* Details Grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px 16px", marginBottom: "32px", border: "2px solid #e5e5e5", padding: "16px" }}>
                        <div style={{ gridColumn: "span 2", borderBottom: "1px solid #e5e5e5", paddingBottom: "12px", marginBottom: "4px", display: "flex", justifyContent: "space-between" }}>
                            <div>
                                <div style={{ fontSize: "12px", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px", fontWeight: "700" }}>{t.passengerName}</div>
                                <div style={{ fontWeight: "800", color: "#171717", fontSize: "18px" }}>{customer?.name || "Guest"}</div>
                            </div>
                            <div style={{ textAlign: "right" }}>
                                <div style={{ fontSize: "12px", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px", fontWeight: "700" }}>{t.passengers}</div>
                                <div style={{ fontWeight: "800", color: "#171717", fontSize: "18px" }}>{passenger_count} {t.people}</div>
                            </div>
                        </div>
                        
                        <div>
                            <div style={{ fontSize: "12px", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px", fontWeight: "700" }}>{t.date}</div>
                            <div style={{ fontWeight: "700", color: "#171717" }}>{depart_date}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: "12px", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px", fontWeight: "700" }}>Seat No.</div>
                            <div style={{ fontWeight: "800", color: "var(--primary)" }}>{seat_number || "Any"}</div>
                        </div>
                        <div style={{ gridColumn: "span 2", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", backgroundColor: "#f8fafc", padding: "12px", border: "1px solid #e2e8f0" }}>
                            <div style={{ gridColumn: "span 2", fontSize: "14px", fontWeight: "700", borderBottom: "1px solid #cbd5e1", paddingBottom: "8px", marginBottom: "4px" }}>
                                Payment Details
                            </div>
                            
                            <div>
                                <div style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", fontWeight: "600" }}>Total Amount</div>
                                <div style={{ fontWeight: "800", color: "#0f172a", fontSize: "18px" }}>{total_amount?.toLocaleString() || "0"} ₫</div>
                            </div>
                            
                            <div style={{ textAlign: "right" }}>
                                <div style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", fontWeight: "600" }}>Status</div>
                                <div style={{ 
                                    fontWeight: "800", fontSize: "16px",
                                    color: payment_status === "paid" ? "#166534" : payment_status === "partially_paid" ? "#854d0e" : "#991b1b"
                                }}>
                                    {payment_status?.toUpperCase().replace("_", " ") || "UNPAID"}
                                </div>
                            </div>
                            
                            {(payment_status === "unpaid" || payment_status === "partially_paid") && (
                                <div style={{ gridColumn: "span 2", marginTop: "8px", paddingTop: "12px", borderTop: "1px dashed #cbd5e1", display: "flex", gap: "8px", flexDirection: "column" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <div style={{ fontSize: "13px", fontWeight: "600" }}>Remaining Balance:</div>
                                        <div style={{ fontSize: "16px", fontWeight: "800", color: "#b91c1c" }}>{balance_amount?.toLocaleString() || total_amount?.toLocaleString() || "0"} ₫</div>
                                    </div>
                                    
                                    {!isCancelled && (
                                        <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                                            {payment_status === "unpaid" && (
                                                <button onClick={() => handlePayment("deposit")} disabled={paymentLoading} className="btn" style={{ flex: 1, backgroundColor: "white", color: "#0f172a", border: "1px solid #cbd5e1", fontSize: "12px", padding: "8px" }}>
                                                    Pay Deposit (30%)
                                                </button>
                                            )}
                                            <button onClick={() => handlePayment("full")} disabled={paymentLoading} className="btn btn-primary" style={{ flex: payment_status === "unpaid" ? 1 : 2, fontSize: "12px", padding: "8px" }}>
                                                {paymentLoading ? <Loader2 size={14} className="animate-spin text-white mx-auto" /> : "Pay Balance Online"}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* QR Code Section */}
                    {isCancelled ? (
                        <div style={{ textAlign: "center", padding: "20px", color: "#991b1b", fontWeight: "bold", border: "2px dashed #991b1b" }}>
                            TICKET VOID
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                            <div style={{ padding: "8px", border: "2px solid #171717", background: "white" }}>
                                <img
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${booking_code}`}
                                    alt="Ticket QR"
                                    width={160} height={160}
                                />
                            </div>
                            <div style={{ marginTop: "12px", fontSize: "14px", fontFamily: "monospace", letterSpacing: "0.1em", color: "#171717", fontWeight: "600" }}>
                                {booking_code}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Action Buttons */}
            <div style={{ marginTop: "32px", display: "flex", flexDirection: "column", gap: "12px", width: "100%", maxWidth: "380px" }}>
                <div style={{ display: "flex", gap: "16px" }}>
                    <Link href="/" className="btn" style={{
                        flex: 1, display: "flex", justifyContent: "center", gap: "8px",
                        backgroundColor: "white", color: "#171717", border: "2px solid #171717",
                        boxShadow: "4px 4px 0px 0px rgba(0,0,0,0.1)"
                    }}>
                        <Home size={18} /> {t.home}
                    </Link>
                    <button className="btn btn-primary" onClick={() => window.print()} style={{ flex: 1, display: "flex", justifyContent: "center", gap: "8px", boxShadow: "4px 4px 0px 0px rgba(0,0,0,0.9)" }}>
                        <Download size={18} /> {t.save}
                    </button>
                </div>
            </div>
        </div>
    );
}
