"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getReservationDetails, updateReservation, getVehicles, getDrivers, updateAdminPayment } from "@/lib/api";
import { ArrowLeft, User, Phone, MapPin, Clock, Truck, ShieldCheck, CheckCircle, AlertCircle, CreditCard } from "lucide-react";

export default function ReservationDetailPage() {
    const { id } = useParams();
    const router = useRouter();

    const [reservation, setReservation] = useState<any>(null);
    const [vehicles, setVehicles] = useState<any[]>([]);
    const [drivers, setDrivers] = useState<any[]>([]);
    
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState("");
    
    // Assignment form state
    const [selectedVehicle, setSelectedVehicle] = useState("");
    const [selectedDriver, setSelectedDriver] = useState("");
    const [adminNote, setAdminNote] = useState("");
    const [status, setStatus] = useState("");
    const [saving, setSaving] = useState(false);

    // Payment Form state
    const [paymentStatus, setPaymentStatus] = useState("paid");
    const [amountPaid, setAmountPaid] = useState("");
    const [loggingPayment, setLoggingPayment] = useState(false);

    useEffect(() => {
        if (!id) return;
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            const [resData, vehData, drvData] = await Promise.all([
                getReservationDetails(Number(id)),
                getVehicles(),
                getDrivers()
            ]);
            
            setReservation(resData);
            setVehicles(vehData);
            setDrivers(drvData);
            
            setStatus(resData.status || "pending");
            setSelectedVehicle(resData.assigned_vehicle_id?.toString() || "");
            setSelectedDriver(resData.assigned_driver_id?.toString() || "");
            setAdminNote(resData.admin_note || "");

        } catch (error: any) {
            setErrorMsg(error.message || "Failed to load details");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload: any = { status };
            if (selectedVehicle) payload.assigned_vehicle_id = Number(selectedVehicle);
            if (selectedDriver) payload.assigned_driver_id = Number(selectedDriver);
            if (adminNote) payload.admin_note = adminNote;

            await updateReservation(Number(id), payload);
            alert("Reservation updated successfully!");
            router.push("/admin/bookings");
        } catch (error: any) {
            alert(error.message || "Failed to update reservation");
        } finally {
            setSaving(false);
        }
    };
    
    const handleLogPayment = async () => {
        if (!amountPaid || isNaN(Number(amountPaid))) return alert("Invalid amount");
        setLoggingPayment(true);
        try {
            await updateAdminPayment(Number(id), {
                payment_status: paymentStatus,
                amount_paid: Number(amountPaid),
                payment_method: "manual"
            });
            alert("Payment logged successfully");
            fetchData();
            setAmountPaid("");
        } catch (e: any) {
            alert(e.message || "Failed to log payment");
        } finally {
            setLoggingPayment(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading details...</div>;
    if (errorMsg || !reservation) return <div className="p-8 text-red-500">{errorMsg || "Not found"}</div>;

    const { customer } = reservation;

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6">
            <div className="flex items-center gap-4 mb-4">
                <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full">
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-2xl font-bold uppercase tracking-tight">Reservation Details</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Column: Booking Info */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="card">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2 border-b pb-4">
                            <Clock size={20} className="text-gray-400" /> Trip Information
                        </h2>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="text-sm text-gray-500 font-bold uppercase">Booking Code</span>
                                <div className="font-mono font-bold text-lg mt-1 bg-gray-100 inline-block px-2 py-1 rounded">
                                    {reservation.booking_code}
                                </div>
                            </div>
                            <div>
                                <span className="text-sm text-gray-500 font-bold uppercase">Status</span>
                                <div className="mt-2">
                                    <span className={`px-3 py-1 text-sm font-bold uppercase rounded-full border 
                                        ${reservation.status === 'confirmed' ? 'bg-green-50 text-green-700 border-green-200' : 
                                          reservation.status === 'assigned' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                                          reservation.status === 'pending' ? 'bg-orange-50 text-orange-700 border-orange-200' : 
                                          'bg-gray-50 text-gray-700 border-gray-200'}`}>
                                        {reservation.status}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="col-span-2 grid grid-cols-2 gap-4 mt-2">
                                <div className="bg-gray-50 p-3 rounded border">
                                    <span className="text-xs text-gray-500 font-bold uppercase block mb-1">Departure</span>
                                    <div className="font-bold">{reservation.from_location}</div>
                                </div>
                                <div className="bg-gray-50 p-3 rounded border">
                                    <span className="text-xs text-gray-500 font-bold uppercase block mb-1">Arrival</span>
                                    <div className="font-bold">{reservation.to_location}</div>
                                </div>
                            </div>

                            <div>
                                <span className="text-sm text-gray-500 font-bold uppercase">Date & Time</span>
                                <div className="font-bold">{reservation.depart_date} @ {reservation.depart_time}</div>
                            </div>
                            <div>
                                <span className="text-sm text-gray-500 font-bold uppercase">Passengers</span>
                                <div className="font-bold">{reservation.passenger_count} Pax</div>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2 border-b pb-4">
                            <User size={20} className="text-gray-400" /> Customer Information
                        </h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="text-sm text-gray-500 font-bold uppercase">Name</span>
                                <div className="font-bold text-lg">{customer?.name || "-"}</div>
                            </div>
                            <div>
                                <span className="text-sm text-gray-500 font-bold uppercase">Phone</span>
                                <div className="font-mono text-gray-700">{customer?.phone || "-"}</div>
                            </div>
                            <div className="col-span-2">
                                <span className="text-sm text-gray-500 font-bold uppercase">Special Notes</span>
                                <div className="mt-1 p-3 bg-yellow-50 text-yellow-800 border border-yellow-200 rounded text-sm min-h-[60px]">
                                    {reservation.special_note || "No special requests"}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="card">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2 border-b pb-4">
                            <CreditCard size={20} className="text-gray-400" /> Financials & Payment
                        </h2>
                        <div className="grid grid-cols-2 gap-4 items-center">
                            <div>
                                <span className="text-sm text-gray-500 font-bold uppercase">Total Amount</span>
                                <div className="font-bold text-xl text-primary">{reservation.total_amount?.toLocaleString() || "0"} ₫</div>
                            </div>
                            <div>
                                <span className="text-sm text-gray-500 font-bold uppercase">Remaining Balance</span>
                                <div className="font-bold text-xl text-red-600">{reservation.balance_amount?.toLocaleString() || "0"} ₫</div>
                            </div>
                            
                            <div className="col-span-2">
                                <span className="text-sm text-gray-500 font-bold uppercase">Payment Status</span>
                                <div className="mt-1">
                                    <span className={`px-3 py-1 text-sm font-bold uppercase rounded-full border
                                        ${reservation.payment_status === 'paid' ? 'bg-green-50 text-green-700 border-green-200' : 
                                          reservation.payment_status === 'partially_paid' ? 'bg-orange-50 text-orange-700 border-orange-200' : 
                                          'bg-red-50 text-red-700 border-red-200'}`}>
                                        {reservation.payment_status?.replace('_', ' ') || "UNPAID"}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="col-span-2 mt-4 pt-4 border-t">
                                <h3 className="text-sm font-bold text-gray-700 uppercase mb-2">Log Manual Payment</h3>
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <select 
                                        className="border p-2 rounded focus:ring-2 focus:ring-primary outline-none" 
                                        value={paymentStatus} 
                                        onChange={e=>setPaymentStatus(e.target.value)}
                                    >
                                        <option value="unpaid">Unpaid</option>
                                        <option value="partially_paid">Partially Paid</option>
                                        <option value="paid">Paid Full</option>
                                    </select>
                                    <input 
                                        type="number" 
                                        placeholder="Amount Paid (VND)..." 
                                        className="border p-2 rounded flex-1 focus:ring-2 focus:ring-primary outline-none" 
                                        value={amountPaid} 
                                        onChange={e=>setAmountPaid(e.target.value)} 
                                    />
                                    <button 
                                        className="btn btn-primary" 
                                        onClick={handleLogPayment} 
                                        disabled={loggingPayment}
                                    >
                                        {loggingPayment ? "Logging..." : "Log Payment"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Assignment & Admin Ops */}
                <div className="space-y-6">
                    <div className="card border-primary/20 bg-primary/5">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2 border-b border-primary/10 pb-4 text-primary">
                            <ShieldCheck size={20} /> Operations
                        </h2>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold uppercase text-gray-700 mb-1">Status</label>
                                <select 
                                    value={status} 
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary outline-none bg-white"
                                >
                                    <option value="pending">Pending</option>
                                    <option value="confirmed">Confirmed</option>
                                    <option value="assigned">Assigned</option>
                                    <option value="completed">Completed</option>
                                    <option value="cancelled">Cancelled</option>
                                    <option value="no_show">No Show</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold uppercase text-gray-700 mb-1 flex items-center gap-2">
                                    <Truck size={14} /> Assign Vehicle
                                </label>
                                <select 
                                    value={selectedVehicle} 
                                    onChange={(e) => setSelectedVehicle(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary outline-none bg-white"
                                >
                                    <option value="">-- No vehicle assigned --</option>
                                    {vehicles.map(v => (
                                        <option key={v.id} value={v.id}>{v.vehicle_name} ({v.plate_number}) - {v.seat_count} seats</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold uppercase text-gray-700 mb-1 flex items-center gap-2">
                                    <User size={14} /> Assign Driver
                                </label>
                                <select 
                                    value={selectedDriver} 
                                    onChange={(e) => setSelectedDriver(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary outline-none bg-white"
                                >
                                    <option value="">-- No driver assigned --</option>
                                    {drivers.map(d => (
                                        <option key={d.id} value={d.id}>{d.driver_name} ({d.phone})</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold uppercase text-gray-700 mb-1">Admin Notes</label>
                                <textarea 
                                    value={adminNote} 
                                    onChange={(e) => setAdminNote(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary outline-none bg-white"
                                    rows={3}
                                    placeholder="Internal notes (not visible to customer)"
                                ></textarea>
                            </div>

                            <button 
                                onClick={handleSave}
                                disabled={saving}
                                className="w-full btn btn-primary flex justify-center items-center gap-2 py-3"
                            >
                                {saving ? "Saving..." : <><CheckCircle size={18} /> Update Reservation</>}
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
