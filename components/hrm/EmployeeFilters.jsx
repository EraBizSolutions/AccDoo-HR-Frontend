import { useState } from "react";
import { Download, Filter, Search, X } from "lucide-react";

const employmentTypes = [
  ["", "All employment types"],
  ["full_time", "Full time"],
  ["part_time", "Part time"],
  ["contract", "Contract"],
  ["intern", "Intern"],
  ["temporary", "Temporary"],
];

const statuses = [
  ["", "All statuses"],
  ["active", "Active"],
  ["inactive", "Inactive"],
  ["probation", "Probation"],
  ["terminated", "Terminated"],
  ["resigned", "Resigned"],
];

export default function EmployeeFilters({ filters, limit, onChange, onLimitChange, onReset, onExport }) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const hasFilters = filters.employment_type || filters.status || filters.branch_name || filters.department_name || filters.designation;

  function update(name, value) {
    onChange({ ...filters, [name]: value });
  }

  return (
    <section className="rounded-md border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <label className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={filters.search}
            onChange={(event) => update("search", event.target.value)}
            placeholder="Search by name, ID, branch, department..."
            className="h-11 w-full rounded-md border border-gray-300 pl-10 pr-3 text-sm outline-none focus:border-accdoo-blue focus:ring-2 focus:ring-accdoo-blue/10"
          />
        </label>
        <button type="button" onClick={onExport} className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-blue-100 bg-blue-50 px-4 text-sm font-semibold text-accdoo-blue hover:bg-blue-100">
          <Download className="h-4 w-4" />
          Export Excel
        </button>
        <select value={limit} onChange={(event) => onLimitChange(Number(event.target.value))} className="h-11 rounded-md border border-gray-300 px-3 text-sm outline-none focus:border-accdoo-blue focus:ring-2 focus:ring-accdoo-blue/10">
          {[8, 10, 25, 50].map((value) => (
            <option key={value} value={value}>{value} per page</option>
          ))}
        </select>
        <button type="button" onClick={() => setFiltersOpen((current) => !current)} className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50">
          <Filter className="h-4 w-4" />
          Filters
        </button>
        {hasFilters ? (
          <button type="button" onClick={onReset} className="inline-flex h-11 items-center justify-center rounded-md border border-gray-300 bg-white px-3 text-gray-500 hover:bg-gray-50" aria-label="Clear filters">
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>
      {filtersOpen ? (
      <div className="mt-3 grid gap-3 border-t border-gray-100 pt-3 md:grid-cols-2 xl:grid-cols-5">
        <label>
          <span className="text-xs font-medium text-gray-600">Branch</span>
          <input value={filters.branch_name} onChange={(event) => update("branch_name", event.target.value)} placeholder="Main Office" className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-accdoo-blue focus:ring-2 focus:ring-accdoo-blue/10" />
        </label>
        <label>
          <span className="text-xs font-medium text-gray-600">Department</span>
          <input value={filters.department_name} onChange={(event) => update("department_name", event.target.value)} placeholder="Customer Service" className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-accdoo-blue focus:ring-2 focus:ring-accdoo-blue/10" />
        </label>
        <label>
          <span className="text-xs font-medium text-gray-600">Designation</span>
          <input value={filters.designation} onChange={(event) => update("designation", event.target.value)} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-accdoo-blue focus:ring-2 focus:ring-accdoo-blue/10" />
        </label>
        <label>
          <span className="text-xs font-medium text-gray-600">Employment type</span>
          <select value={filters.employment_type} onChange={(event) => update("employment_type", event.target.value)} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-accdoo-blue focus:ring-2 focus:ring-accdoo-blue/10">
            {employmentTypes.map(([value, label]) => (
              <option key={label} value={value}>{label}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="text-xs font-medium text-gray-600">Status</span>
          <select value={filters.status} onChange={(event) => update("status", event.target.value)} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-accdoo-blue focus:ring-2 focus:ring-accdoo-blue/10">
            {statuses.map(([value, label]) => (
              <option key={label} value={value}>{label}</option>
            ))}
          </select>
        </label>
      </div>
      ) : null}
    </section>
  );
}
