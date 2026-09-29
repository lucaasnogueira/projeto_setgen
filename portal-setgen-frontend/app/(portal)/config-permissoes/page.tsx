"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ConfigPermissoesRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/users?tab=permissions");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E2661D]"></div>
    </div>
  );
}
