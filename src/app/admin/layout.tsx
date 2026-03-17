"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { adminLogout } from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";
import { LayoutDashboard, CalendarDays, Users, Settings, LogOut, Bus, UserSquare, Map, CalendarClock } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { t, language, setLanguage } = useLanguage();

    const menuItems = [
        { icon: LayoutDashboard, label: t.adminDashboard, href: "/admin" },
        { icon: CalendarDays, label: t.adminBookings, href: "/admin/bookings" },
        { icon: CalendarClock, label: t.adminSchedule, href: "/admin/schedule" },
        { icon: Map, label: t.adminFleet, href: "/admin/fleet" },
        { icon: Bus, label: t.adminVehicles, href: "/admin/vehicles" },
        { icon: UserSquare, label: t.adminDrivers, href: "/admin/drivers" },
        { icon: Users, label: t.adminCustomers, href: "/admin/customers" },
        { icon: Settings, label: t.adminSettings, href: "/admin/settings" },
    ];

    // Protected Route Check
    useEffect(() => {
        if (pathname === "/admin/login") return;

        const token = localStorage.getItem("admin_token");
        if (!token) {
            router.replace("/admin/login");
        }
    }, [pathname, router]);

    // If on login page, render without sidebar
    if (pathname === "/admin/login") {
        return <>{children}</>;
    }

    const handleLogout = () => {
        adminLogout();
        router.push("/admin/login");
    };

    return (
        <div className="flex min-h-screen bg-gray-100">
            {/* Sidebar */}
            <aside className="w-[260px] bg-slate-900 text-white flex flex-col fixed h-screen z-50">
                <div className="p-6 border-b border-slate-800">
                    <div className="text-xl font-extrabold text-blue-500">
                        Phuong Nam <span className="text-white">ADMIN</span>
                    </div>
                </div>

                <nav className="flex-1 p-6 py-4">
                    <ul className="space-y-2">
                        {menuItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <li key={item.href}>
                                    <Link href={item.href} className={`
                                        flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium
                                        ${isActive
                                            ? "bg-blue-600 text-white shadow-lg shadow-blue-900/50"
                                            : "text-slate-400 hover:bg-slate-800 hover:text-white"
                                        }
                                    `}>
                                        <item.icon size={20} />
                                        {item.label}
                                    </Link>
                                </li>
                            )
                        })}
                    </ul>
                </nav>

                <div className="px-6 pb-2">
                    <div className="flex gap-2">
                        <button onClick={() => setLanguage('ko')} className={`flex-1 py-1.5 text-xs font-bold rounded transition-colors ${language === 'ko' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>한국어</button>
                        <button onClick={() => setLanguage('en')} className={`flex-1 py-1.5 text-xs font-bold rounded transition-colors ${language === 'en' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>ENG</button>
                        <button onClick={() => setLanguage('vi')} className={`flex-1 py-1.5 text-xs font-bold rounded transition-colors ${language === 'vi' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>VIỆT</button>
                    </div>
                </div>

                <div className="p-6 border-t border-slate-800">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors font-medium"
                    >
                        <LogOut size={20} /> {t.adminExit}
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="ml-[260px] flex-1 p-8">
                {children}
            </main>
        </div>
    );
}
