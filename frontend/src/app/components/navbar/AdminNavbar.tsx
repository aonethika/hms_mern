"use client";

import Link from "next/link";
import { Menu, User, Bell } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import useAuthStore from "@/app/shared/store/auth.store";
import { getAdminNotificationsApi } from "@/app/shared/api/admin.api";

export default function AdminNavbar() {
  const pathname = usePathname();
  const hideNavbarOn = ["/auth/login", "/auth/register"];
  if (hideNavbarOn.includes(pathname)) return null; // Hide navbar on auth pages

  const [menuOpen, setMenuOpen] = useState(false); // Dropdown menu state
  const [notifCount, setNotifCount] = useState(0); // Notification count
  const menuRef = useRef<HTMLDivElement>(null); // Ref for dropdown click outside

  const { user, isHydrated } = useAuthStore();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch notifications every 5 seconds
  useEffect(() => {
    const fetchNotifications = async () => {
      const res = await getAdminNotificationsApi();
      setNotifCount(res.count);
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!isHydrated) return null; // Wait for store hydration

  return (
    <nav className="bg-cyan-600 text-white flex justify-between items-center px-6 py-3 shadow-md relative z-50">
      
      {/* Left: Menu button + logo */}
      <div className="flex items-center gap-5">
        <button
          onClick={() => setMenuOpen((prev) => !prev)}
          className="hover:text-cyan-200 transition"
        >
          <Menu size={26} />
        </button>

        <Link href="/admin/dashboard" className="font-semibold text-lg tracking-wide">
          Nalanda
        </Link>
      </div>

      {/* Right: Notifications + Profile */}
      <div className="flex items-center gap-5">
        {/* Notifications */}
        <div className="relative cursor-pointer">
          <Link href="/admin/notifications">
            <Bell size={26} className="text-gray-200 hover:text-white transition" />
          </Link>
          {notifCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-[10px] min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full font-semibold">
              {notifCount > 9 ? "9+" : notifCount}
            </span>
          )}
        </div>

        {/* Profile */}
        <Link href="/admin/profile">
          <User size={26} className="text-gray-200 hover:text-white transition cursor-pointer" />
        </Link>
      </div>

      {/* Dropdown Menu */}
      {menuOpen && (
        <div
          ref={menuRef}
          className="absolute top-16 left-4 w-56 bg-gray-900/95 backdrop-blur-md border border-gray-800 rounded-xl shadow-2xl flex flex-col overflow-hidden z-[100]"
        >
          {[
            { name: "Doctors", path: "/admin/doctors" },
            { name: "Patients", path: "/admin/patients" },
            { name: "Add Doctor", path: "/admin/add-doctor" },
            { name: "Departments", path: "/admin/departments" },
            { name: "Leaves", path: "/admin/leaves" },
          ].map((item) => (
            <Link
              key={item.path}
              href={item.path}
              onClick={() => setMenuOpen(false)} // Close menu on click
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