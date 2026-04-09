"use client";

import Link from "next/link";
import { Menu, User, Bell } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import useAuthStore from "@/app/shared/store/auth.store";
import { getNotificationsDoctorApi } from "@/app/shared/api/doctor.api";

export default function AdminNavbar() {
  // Get current path for conditional rendering
  const pathname = usePathname();
  
  // Pages where the navbar should be hidden
  const hideNavbarOn = ["/auth/login", "/auth/register"];
  if (hideNavbarOn.includes(pathname)) return null;

  // State to toggle menu dropdown and track notification count
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifCount, setNotifCount] = useState(0);

  // Ref for detecting clicks outside the menu
  const menuRef = useRef<HTMLDivElement>(null);

  // Zustand store for user data and hydration check
  const { user, isHydrated } = useAuthStore();

  // -----------------------------
  // Effect: Close dropdown when clicking outside
  // -----------------------------
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false); // Close menu
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // -----------------------------
  // Effect: Poll for notifications every 5 seconds
  // -----------------------------
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await getNotificationsDoctorApi();
        console.log("res", res);
        setNotifCount(res.count);
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
      }
    };

    fetchNotifications(); // Initial fetch
    const interval = setInterval(fetchNotifications, 5000); // Poll every 5s

    return () => clearInterval(interval); // Clean up interval
  }, []);

  // Wait for Zustand store to hydrate before rendering
  if (!isHydrated) return null;

  return (
    <nav className="bg-cyan-600 text-white flex justify-between items-center px-6 py-3 shadow-md relative z-50">
      
      {/* -----------------------------
          Left Section: Menu button + Logo
      ----------------------------- */}
      <div className="flex items-center gap-5">
        <button
          onClick={() => setMenuOpen((prev) => !prev)}
          className="hover:text-cyan-200 transition"
          aria-label="Toggle Menu"
        >
          <Menu size={26} />
        </button>

        <Link href="/doctor/dashboard" className="font-semibold text-lg tracking-wide">
          Nalanda
        </Link>
      </div>

      {/* -----------------------------
          Right Section: Notifications + Profile
      ----------------------------- */}
      <div className="flex items-center gap-5">
        
        {/* Notifications */}
        <div className="relative cursor-pointer">
          <Link href="/doctor/notifications">
            <Bell size={26} className="text-gray-200 hover:text-white transition" />
            {notifCount > 0 && (
              <span
                className="absolute -top-2 -right-2 bg-red-500 text-[10px] min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full font-semibold"
              >
                {notifCount > 9 ? "9+" : notifCount}
              </span>
            )}
          </Link>
        </div>

        {/* Profile */}
        <Link href="/doctor/profile">
          <User size={26} className="text-gray-200 hover:text-white transition cursor-pointer" />
        </Link>
      </div>

     
      {menuOpen && (
        <div
          ref={menuRef}
          className="absolute top-16 left-4 w-56 bg-gray-900/95 backdrop-blur-md border border-gray-800 rounded-xl shadow-2xl flex flex-col overflow-hidden z-[100]"
        >
          {[
            { name: "Patients", path: "/doctor/my-patients" },
            { name: "Leaves", path: "/doctor/leave" },
          ].map((item) => (
            <Link
              key={item.path}
              href={item.path}
              onClick={() => setMenuOpen(false)} // Close menu on navigation
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