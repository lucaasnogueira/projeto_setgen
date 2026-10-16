"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const FULL_BLEED_PATTERNS = [
  /^\/clients\/new/,
  /^\/clients\/[^/]+\/edit/,
  /^\/quotes\/new/,
  /^\/quotes\/[^/]+\/edit/,
  /^\/orders\/new/,
  /^\/orders\/[^/]+\/edit/,
  /^\/suppliers\/new/,
  /^\/suppliers\/[^/]+\/edit/,
  /^\/visits\/new/,
  /^\/visits\/[^/]+\/edit/,
  /^\/invoices\/new/,
  /^\/invoices\/[^/]+\/edit/,
  /^\/equipment\/new/,
  /^\/equipment\/[^/]+\/edit/,
  /^\/fleet\/new/,
  /^\/fleet\/[^/]+\/edit/,
  /^\/financial\/expenses\/new/,
  /^\/inventory\/new/,
  /^\/inventory\/[^/]+\/edit/,
];

export function PortalMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";

  const isFullBleed = FULL_BLEED_PATTERNS.some((pattern) => pattern.test(pathname));

  return (
    <main
      className={cn(
        "flex-1 min-h-0 print:overflow-visible print:p-0 print:m-0 print:h-auto print:static",
        isFullBleed
          ? "overflow-hidden p-0 flex flex-col bg-white"
          : "overflow-y-auto px-6 py-4.5"
      )}
    >
      {children}
    </main>
  );
}

