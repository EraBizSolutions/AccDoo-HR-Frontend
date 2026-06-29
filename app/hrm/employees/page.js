"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, RefreshCw } from "lucide-react";

import EmployeeFilters from "@/components/hrm/EmployeeFilters";
import EmployeesTable from "@/components/hrm/EmployeesTable";
import { deleteEmployee, getEmployees } from "@/lib/api/hrmEmployeesApi";
import { formatLabel } from "@/components/hrm/hrmUi";

const initialFilters = {
  search: "",
  branch_name: "",
  department_name: "",
  designation: "",
  employment_type: "",
  status: "",
};

export default function EmployeesPage() {
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(8);
  const [data, setData] = useState({ items: [], total: 0, pages: 0, page: 1, limit: 10 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const query = useMemo(() => ({ ...filters, page, limit }), [filters, page, limit]);

  async function loadEmployees() {
    setLoading(true);
    setError("");
    try {
      const response = await getEmployees(query);
      setData(response);
    } catch (err) {
      setError(err.message || "Unable to load employees");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEmployees();
  }, [query]);

  async function handleDelete(employee) {
    if (!window.confirm(`Delete ${employee.first_name} ${employee.last_name}?`)) {
      return;
    }
    try {
      await deleteEmployee(employee.id);
      await loadEmployees();
    } catch (err) {
      setError(err.message || "Unable to update employee");
    }
  }

  function exportEmployees() {
    const columns = [
      ["Employee ID", (employee) => employee.employee_code],
      ["Name", (employee) => `${employee.first_name || ""} ${employee.last_name || ""}`.trim()],
      ["Email", (employee) => employee.email || ""],
      ["Branch", (employee) => employee.branch_name || ""],
      ["Department", (employee) => employee.department_name || ""],
      ["Designation", (employee) => employee.designation || ""],
      ["Employment Type", (employee) => employee.employment_type_name || formatLabel(employee.employment_type, "")],
      ["Date of Joining", (employee) => employee.date_of_joining || ""],
      ["Status", (employee) => formatLabel(employee.employee_status, "")],
    ];
    const lines = [
      columns.map(([heading]) => csvValue(heading)).join(","),
      ...data.items.map((employee) => columns.map(([, getter]) => csvValue(getter(employee))).join(",")),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "employees.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-gray-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">HRM / Employees</p>
          <h1 className="mt-1 text-2xl font-semibold text-gray-950">Manage Employees</h1>
          <p className="mt-1 text-sm text-gray-500">View and manage your team across all branches.</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={loadEmployees}
            className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <Link
            href="/hrm/employees/create"
            className="inline-flex items-center gap-2 rounded-md bg-accdoo-blue px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-accdoo-blueDark"
          >
            <Plus className="h-4 w-4" />
            Add Employee
          </Link>
        </div>
      </div>

      <EmployeeFilters
        filters={filters}
        limit={limit}
        onLimitChange={(value) => {
          setLimit(value);
          setPage(1);
        }}
        onChange={(nextFilters) => {
          setFilters(nextFilters);
          setPage(1);
        }}
        onReset={() => {
          setFilters(initialFilters);
          setPage(1);
        }}
        onExport={exportEmployees}
      />

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      <EmployeesTable data={data} loading={loading} page={page} onPageChange={setPage} onDelete={handleDelete} />
    </div>
  );
}

function csvValue(value) {
  return `"${String(value ?? "").replaceAll("\"", "\"\"")}"`;
}
