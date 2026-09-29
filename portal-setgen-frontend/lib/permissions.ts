import { useAuthStore } from "@/store/auth";
import { useEffect, useState } from "react";

export const ADMINISTRATIVE_ROLES = ["ADMIN", "MANAGER", "ADMINISTRATIVE"] as const;

export function canViewFinancialValues(role?: string | null): boolean {
  if (!role) return false;
  const normalized = role.trim().toUpperCase();
  return (ADMINISTRATIVE_ROLES as readonly string[]).includes(normalized);
}

export function useCanViewValues(): boolean {
  const storeUser = useAuthStore((state) => state.user);

  const [canView, setCanView] = useState<boolean>(() => {
    if (storeUser?.role) return canViewFinancialValues(storeUser.role);
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("user");
        if (raw) {
          const parsed = JSON.parse(raw);
          return canViewFinancialValues(parsed.role);
        }
      } catch {
        // no-op
      }
    }
    return false;
  });

  useEffect(() => {
    if (storeUser?.role) {
      setCanView(canViewFinancialValues(storeUser.role));
    } else if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("user");
        if (raw) {
          const parsed = JSON.parse(raw);
          setCanView(canViewFinancialValues(parsed.role));
        }
      } catch {
        // no-op
      }
    }
  }, [storeUser?.role]);

  return canView;
}
