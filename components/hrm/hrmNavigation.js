export const hrmNavigation = [
  {
    id: "hrm",
    label: "HRM",
    items: [
      { label: "Employees", slug: "employees", href: "/hrm/employees", description: "Employee records and profiles." },
      { label: "Payslip", slug: "payslip", href: "/hrm/payslip", description: "Payroll documents and payslip workflows." },
      { label: "Attendance", slug: "attendance", href: "/hrm/attendance", description: "Attendance tracking foundation." },
      { label: "Leave Management", slug: "leave-management", href: "/hrm/leave-management", description: "Leave requests and balances foundation." },
      { label: "Holidays", slug: "holidays", href: "/hrm/holidays", description: "Holiday calendar foundation." },
      { label: "Awards", slug: "awards", href: "/hrm/awards", description: "Employee recognition foundation." },
      { label: "Promotions", slug: "promotions", href: "/hrm/promotions", description: "Promotion records foundation." },
      { label: "Resignations", slug: "resignations", href: "/hrm/resignations", description: "Resignation workflows foundation." },
      { label: "Terminations", slug: "terminations", href: "/hrm/terminations", description: "Termination workflows foundation." },
      { label: "Warnings", slug: "warnings", href: "/hrm/warnings", description: "Warning records foundation." },
      { label: "Complaints", slug: "complaints", href: "/hrm/complaints", description: "Complaint records foundation." },
      { label: "Transfers", slug: "transfers", href: "/hrm/transfers", description: "Employee transfer foundation." },
      { label: "Documents", slug: "documents", href: "/hrm/documents", description: "Employee document center foundation." },
      { label: "Acknowledgments", slug: "acknowledgments", href: "/hrm/acknowledgments", description: "Acknowledgment workflows foundation." },
      { label: "Announcements", slug: "announcements", href: "/hrm/announcements", description: "Internal announcements foundation." },
      { label: "Events", slug: "events", href: "/hrm/events", description: "Company events foundation." },
      { label: "Company Policies", slug: "company-policies", href: "/hrm/company-policies", description: "Policy library foundation." },
      { label: "System Setup", slug: "system-setup", href: "/hrm/system-setup", description: "HRM settings foundation." },
    ],
  },
  {
    id: "performance",
    label: "Performance",
    items: [
      { label: "Performance Indicators", slug: "performance-indicators", href: "/hrm/performance-indicators", description: "Performance indicator setup foundation." },
      { label: "Employee Goals", slug: "employee-goals", href: "/hrm/employee-goals", description: "Goal tracking foundation." },
      { label: "Review Cycles", slug: "review-cycles", href: "/hrm/review-cycles", description: "Review cycle foundation." },
      { label: "Employee Reviews", slug: "employee-reviews", href: "/hrm/employee-reviews", description: "Employee review foundation." },
    ],
  },
];

export function getModuleBySlug(slug) {
  return hrmNavigation.flatMap((section) => section.items).find((item) => item.slug === slug);
}
