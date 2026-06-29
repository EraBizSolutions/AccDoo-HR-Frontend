"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Edit3, FileText, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { deleteEmployee, getEmployee } from "@/lib/api/hrmEmployeesApi";
import { formatLabel, formatMoney } from "@/components/hrm/hrmUi";

function DetailItem({ label, value }) {
  return (
    <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-gray-950">{value || "-"}</p>
    </div>
  );
}

export default function EmployeeDetails({ employeeId }) {
  const router = useRouter();
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

  async function handleDelete() {
    if (!window.confirm("Delete this employee permanently?")) return;
    try {
      await deleteEmployee(employeeId);
      router.push("/hrm/employees");
      router.refresh();
    } catch (err) {
      setError(err.message || "Unable to delete employee");
    }
  }

  if (loading) {
    return <div className="rounded-md border border-gray-200 bg-white p-6 text-sm text-gray-600 shadow-sm">Loading employee...</div>;
  }

  if (error) {
    return <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-gray-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-accdoo-blue">HRM / Employees</p>
          <h1 className="mt-1 text-2xl font-semibold text-gray-950">{employee.first_name} {employee.last_name}</h1>
          <p className="mt-1 text-sm text-gray-500">{employee.employee_code}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/hrm/employees" className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <Link href={`/hrm/employees/${employeeId}/edit`} className="inline-flex items-center gap-2 rounded-md bg-accdoo-blue px-4 py-2 text-sm font-semibold text-white hover:bg-accdoo-blueDark">
            <Edit3 className="h-4 w-4" />
            Edit
          </Link>
          <button type="button" onClick={handleDelete} className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      </div>

      <section className="rounded-md border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-950">Employee Profile</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <DetailItem label="Employee ID" value={employee.employee_code} />
          <DetailItem label="Biometric ID" value={employee.biometric_employee_id} />
          <DetailItem label="Gender" value={formatLabel(employee.gender)} />
          <DetailItem label="Date of Birth" value={employee.date_of_birth} />
          <DetailItem label="Branch" value={employee.branch_name} />
          <DetailItem label="Department" value={employee.department_name} />
          <DetailItem label="Designation" value={employee.designation} />
          <DetailItem label="Employment Type" value={employee.employment_type_name || formatLabel(employee.employment_type)} />
          <DetailItem label="Shift" value={employee.shift_name} />
          <DetailItem label="Date of Joining" value={employee.date_of_joining} />
          <DetailItem label="Status" value={formatLabel(employee.employee_status)} />
          <DetailItem label="Email" value={employee.email} />
          <DetailItem label="Phone" value={employee.phone} />
        </div>
      </section>

      <section className="rounded-md border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-950">Banking & Rates</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <DetailItem label="Bank" value={employee.bank_name} />
          <DetailItem label="Account Holder" value={employee.account_holder_name} />
          <DetailItem label="Account Number" value={employee.account_number} />
          <DetailItem label="Basic Salary" value={formatMoney(employee.basic_salary)} />
          <DetailItem label="Hourly Rate" value={employee.hourly_rate ? formatMoney(employee.hourly_rate) : "-"} />
          <DetailItem label="Pay Frequency" value={formatLabel(employee.pay_frequency)} />
          <DetailItem label="EPF Number" value={employee.epf_number} />
          <DetailItem label="Tax Number" value={employee.tax_number} />
        </div>
      </section>

      <section className="rounded-md border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-950">Documents</h2>
        {employee.document_items?.length ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {employee.document_items.map((document, index) => (
              <div key={`${document.file_name}-${index}`} className="flex items-center gap-3 rounded-md border border-gray-200 bg-gray-50 p-4">
                <FileText className="h-5 w-5 text-accdoo-blue" />
                <div>
                  <p className="text-sm font-semibold text-gray-950">{document.document_type}</p>
                  <p className="text-xs text-gray-500">{document.file_name}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-gray-500">No documents added.</p>
        )}
      </section>
    </div>
  );
}
