"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Award,
  Banknote,
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  ChevronDown,
  ClipboardCheck,
  FileText,
  Goal,
  Megaphone,
  Settings,
  ShieldAlert,
  Star,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";

import { hrmNavigation } from "@/components/hrm/hrmNavigation";

const iconMap = {
  employees: Users,
  payslip: Banknote,
  attendance: ClipboardCheck,
  "leave-management": CalendarDays,
  holidays: CalendarDays,
  awards: Award,
  promotions: Star,
  resignations: UserCheck,
  terminations: ShieldAlert,
  warnings: ShieldAlert,
  complaints: FileText,
  transfers: BriefcaseBusiness,
  documents: FileText,
  acknowledgments: UserCheck,
  announcements: Megaphone,
  events: Bell,
  "company-policies": FileText,
  "system-setup": Settings,
  "performance-indicators": Star,
  "employee-goals": Goal,
  "review-cycles": CalendarDays,
  "employee-reviews": ClipboardCheck,
};

export default function HrmSidebar({ open, onClose }) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState({ hrm: true, performance: true });

  return (
    <>
      <div className={open ? "fixed inset-0 z-30 bg-gray-950/30 lg:hidden" : "hidden"} onClick={onClose} />
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 transform flex-col border-r border-gray-200 bg-white transition-transform duration-200 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-20 items-center justify-between border-b border-gray-200 px-5">
          <Link href="/hrm/employees" className="flex min-w-0 items-center" onClick={onClose}>
            <span className="flex h-12 w-44 items-center rounded-md bg-white">
              <Image src="/accdoo-logo.svg" alt="AccDoo" width={152} height={34} priority className="h-auto w-40 object-contain" />
            </span>
          </Link>
          <button type="button" className="rounded-md p-2 text-gray-500 lg:hidden" onClick={onClose} aria-label="Close navigation">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-4 overflow-y-auto px-4 py-5">
          {hrmNavigation.map((section) => (
            <div key={section.id}>
              <button
                type="button"
                onClick={() => setExpanded((current) => ({ ...current, [section.id]: !current[section.id] }))}
                className="flex w-full items-center justify-between rounded-md px-2 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500"
              >
                {section.label}
                <ChevronDown className={`h-4 w-4 transition ${expanded[section.id] ? "rotate-180" : ""}`} />
              </button>
              {expanded[section.id] ? (
                <div className="mt-1 space-y-1">
                  {section.items.map((item) => {
                    const Icon = iconMap[item.slug] || FileText;
                    const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onClose}
                        className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition ${
                          active ? "bg-accdoo-blue text-white shadow-sm" : "text-gray-700 hover:bg-gray-100 hover:text-gray-950"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              ) : null}
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
