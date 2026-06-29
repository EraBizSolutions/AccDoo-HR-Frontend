"use client";

import Image from "next/image";
import { Menu } from "lucide-react";
import { useState } from "react";

import HrmSidebar from "@/components/hrm/HrmSidebar";

export default function HrmShell({ children }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <HrmSidebar open={open} onClose={() => setOpen(false)} />
      <div className="min-w-0 lg:pl-72">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-gray-200 bg-white px-4 shadow-sm lg:hidden">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-md border border-gray-200 p-2 text-gray-700"
            aria-label="Open HRM navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Image src="/accdoo-logo.svg" alt="AccDoo" width={152} height={34} priority className="h-auto w-32 object-contain" />
        </header>
        <main className="mx-auto min-w-0 max-w-7xl overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
