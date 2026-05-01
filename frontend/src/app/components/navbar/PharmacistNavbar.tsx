"use client";

import Link from "next/link";
import { Menu, User, Pill, FileText, Bell } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import useAuthStore from "@/app/shared/store/auth.store";
import { getNotificationsPharmacistApi } from "@/app/shared/api/pharmacy.api";

export default function PharmacistNavbar() {
  const pathname = usePathname();
  const hideNavbarOn = ["/auth/login", "/auth/register"];

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const [notifCount, setNotifCount] = useState(0);

  const { isHydrated } = useAuthStore();

  // ✅ close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ✅ notifications fetch (FIXED)
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await getNotificationsPharmacistApi();
        setNotifCount(res?.count || 0);
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
      }
    };

    fetchNotifications();

    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!isHydrated) return null;

  if (hideNavbarOn.includes(pathname)) return null;

  return (
    <nav className="bg-cyan-600 text-white flex justify-between items-center px-6 py-3 shadow-md relative z-50">

      {/* LEFT */}
      <div className="flex items-center gap-5">
        <button
          onClick={() => setMenuOpen((prev) => !prev)}
          className="hover:text-indigo-200 transition"
        >
          <Menu size={26} />
        </button>

        <Link href="/pharmacy/dashboard" className="font-semibold text-lg">
          PharmaCare
        </Link>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-5">

        {/* Notifications */}
        <div className="relative">
          <Link href="/pharmacy/notifications">
            <Bell
              size={26}
              className="text-white hover:text-gray-200 transition"
            />

            {notifCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-[10px] min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full font-semibold">
                {notifCount > 9 ? "9+" : notifCount}
              </span>
            )}
          </Link>
        </div>

        {/* Profile */}
        <Link href="/pharmacy/profile">
          <User
            size={26}
            className="text-gray-200 hover:text-white transition"
          />
        </Link>
      </div>

      {/* DROPDOWN MENU */}
      {menuOpen && (
        <div
          ref={menuRef}
          className="absolute top-16 left-4 w-56 bg-gray-900/95 backdrop-blur-md border border-gray-800 rounded-xl shadow-2xl flex flex-col overflow-hidden z-[100]"
        >
          {[
            
            {
              name: "Medicines",
              path: "/pharmacy/medicines",
              icon: <Pill size={16} />,
            },
            
            {
              name: "Bills",
              path: "/pharmacy/bills",
              icon: <FileText size={16} />,
            },
          ].map((item) => (
            <Link
              key={item.path}
              href={item.path}
              onClick={() => setMenuOpen(false)}
              className="px-4 py-3 text-sm text-gray-300 hover:bg-gray-800 hover:text-indigo-300 transition flex items-center gap-2"
            >
              {item.icon}
              {item.name}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}