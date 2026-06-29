"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";

import EmployeeForm from "@/components/hrm/EmployeeForm";
import { getEmployee } from "@/lib/api/hrmEmployeesApi";

export default function EmployeeEditView({ employeeId }) {
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadEmployee() {
      setLoading(true);
      setError("");
      try {
        setEmployee(await getEmployee(employeeId));
      } catch (err) {
        setError(err.message || "Unable to load employee");
      } finally {
        setLoading(false);
      }
    }
    loadEmployee();
  }, [employeeId]);

  if (loading) {
    return <div className="rounded-md border border-gray-200 bg-white p-6 text-sm text-gray-600 shadow-sm">Loading employee...</div>;
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        <Link href="/hrm/employees" className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700">
          <ArrowLeft className="h-4 w-4" />
          Back to Employees
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-5">
        <p className="text-sm font-medium text-accdoo-blue">HRM / Employees</p>
        <h1 className="mt-1 text-2xl font-semibold text-gray-950">Edit {employee.employee_code}</h1>
      </div>
      <EmployeeForm mode="edit" employeeId={employeeId} initialEmployee={employee} />
    </div>
  );
}
