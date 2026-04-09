"use client";

import Link from "next/link";
import { Menu, User, Bell } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import useAuthStore from "@/app/shared/store/auth.store";
import { getNotificationsPatientApi } from "@/app/shared/api/patient.api";

export default function AdminNavbar() {
  const pathname = usePathname();
  const hideNavbarOn = ["/auth/login", "/auth/register"];
  if (hideNavbarOn.includes(pathname)) return null;

  const [menuOpen, setMenuOpen] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  const { isHydrated, patients, selectedPatient, setSelectedPatient } =
    useAuthStore();

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const fetchNotifications = async () => {
    if (!selectedPatient?._id) return;
    try {
      const res = await getNotificationsPatientApi();
      setNotifCount(res.count || 0);
    } catch {}
  };

  useEffect(() => {
    if (!selectedPatient) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, [selectedPatient]);

  if (!isHydrated) return null;

  return (
    <nav className="bg-cyan-600 text-white flex justify-between items-center px-4 md:px-6 py-3 shadow-md relative z-50">
      {/* Left side */}
      <div className="flex items-center gap-4 md:gap-6">
        <button
          onClick={() => setMenuOpen((prev) => !prev)}
          className="hover:text-cyan-200 transition"
        >
          <Menu size={26} />
        </button>

        {/* Hospital name hidden on mobile */}
        <Link
          href="/patient/dashboard"
          className="font-semibold text-lg tracking-wide hidden sm:inline"
        >
          Nalanda
        </Link>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3 md:gap-5">
        {/* Patient Selector */}
        {patients.length > 0 && (
          <select
            value={selectedPatient?._id || ""}
            onChange={(e) => {
              const patient = patients.find((p) => p._id === e.target.value);
              if (patient) setSelectedPatient(patient);
            }}
            className="bg-cyan-700 text-white text-sm px-3 py-1 rounded-md outline-none cursor-pointer"
          >
            {patients.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </select>
        )}

        {/* Notifications */}
        <div className="relative">
          <Link href="/patient/notifications">
            <Bell size={26} className="text-white hover:text-gray-200 transition" />
            {notifCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-[10px] min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full font-semibold z-50">
                {notifCount > 9 ? "9+" : notifCount}
              </span>
            )}
          </Link>
        </div>

        {/* Profile */}
        <Link href="/patient/profile">
          <User size={26} className="text-white hover:text-gray-200 transition cursor-pointer" />
        </Link>
      </div>

      {/* Menu Dropdown */}
      {menuOpen && (
        <div
          ref={menuRef}
          className="absolute top-16 left-4 w-56 bg-gray-900/95 backdrop-blur-md border border-gray-800 rounded-xl flex flex-col overflow-hidden z-[100]"
        >
         
          {[
            { name: "Dashboard", path: "/patient/dashboard" },
            { name: "Appointments", path: "/patient/appointments" },
          ].map((item) => (
            <Link
              key={item.path}
              href={item.path}
              onClick={() => setMenuOpen(false)}
              className="px-4 py-3 text-sm text-gray-300 hover:bg-gray-800 hover:text-cyan-400 transition"
            >
              {item.name}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}