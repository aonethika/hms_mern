"use client";


import { useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import useAuthStore from "../shared/store/auth.store";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRole: "admin" | "patient" | "doctor";
}
export default function ProtectedRoute({ children, allowedRole }: ProtectedRouteProps) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  if (user === undefined) return;

  if (!user) {
    router.push("/auth/login");
    return;
  }

  if (user.role !== allowedRole) {
    router.push("/auth/login");
    return;
  }

  setLoading(false);
}, [user, allowedRole, router]);

  if (loading || user === undefined) {
  return <p>Loading...</p>;
}
  return <>{children}</>;
}