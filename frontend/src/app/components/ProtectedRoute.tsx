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
      router.push("/login");
    } else if (user.role !== allowedRole) {
      router.push("/login");
    } else {
      setLoading(false); 
    }
  }, [user, allowedRole, router]);

  if (loading) return <p>Loading...</p>;
  return <>{children}</>;
}