import Link from "next/link";
import { Edit3, Eye, Trash2 } from "lucide-react";

import { employmentBadgeClass, formatLabel, initials, toneFromText } from "@/components/hrm/hrmUi";

export default function EmployeesTable({ data, loading, page, onPageChange, onDelete }) {
  if (loading) {
    return (
      <div className="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
        <div className="space-y-3">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-12 animate-pulse rounded-md bg-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  if (!data.items.length) {
    return (
      <div className="rounded-md border border-dashed border-gray-300 bg-white p-10 text-center shadow-sm">
        <h2 className="text-lg font-semibold text-gray-950">No employees found</h2>
        <p className="mt-2 text-sm text-gray-600">Create the first employee or adjust the current filters.</p>
        <Link href="/hrm/employees/create" className="mt-5 inline-flex rounded-md bg-accdoo-blue px-4 py-2 text-sm font-semibold text-white hover:bg-accdoo-blueDark">
          Add Employee
        </Link>
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              {["Employee Id", "Name", "Branch", "Department", "Designation", "Employment Type", "Date Of Joining", "Actions"].map((heading) => (
                <th key={heading} className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500">{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {data.items.map((employee) => (
              <tr key={employee.id} className="hover:bg-gray-50">
                <td className="px-5 py-4">
                  <span className="font-semibold text-accdoo-blue">{employee.employee_code}</span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${toneFromText(`${employee.first_name} ${employee.last_name}`).bg}`}>
                      {initials(`${employee.first_name || ""} ${employee.last_name || ""}`, "E")}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-950">{employee.first_name} {employee.last_name}</div>
                      <div className="text-xs text-gray-500">{employee.email || employee.phone || "-"}</div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 text-gray-600">{employee.branch_name || "-"}</td>
                <td className="px-5 py-4 text-gray-600">{employee.department_name || "-"}</td>
                <td className="px-5 py-4 text-gray-600">{employee.designation || "-"}</td>
                <td className="px-5 py-4">
                  <EmploymentBadge employee={employee} />
                </td>
                <td className="px-5 py-4 text-gray-600">{employee.date_of_joining}</td>
                <td className="px-5 py-4">
                  <div className="flex items-center justify-end gap-1">
                    <Link href={`/hrm/employees/${employee.id}`} className="rounded-md p-2 text-emerald-600 hover:bg-emerald-50" title="View employee"><Eye className="h-4 w-4" /></Link>
                    <Link href={`/hrm/employees/${employee.id}/edit`} className="rounded-md p-2 text-blue-600 hover:bg-blue-50" title="Edit employee"><Edit3 className="h-4 w-4" /></Link>
                    <button type="button" onClick={() => onDelete(employee)} className="rounded-md p-2 text-red-600 hover:bg-red-50" title="Delete"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col gap-3 border-t border-gray-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-600">Showing {data.items.length} of {data.total} employees</p>
        <div className="flex items-center gap-2">
          <button type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)} className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-50">
            Previous
          </button>
          <span className="rounded-md bg-accdoo-blue px-3 py-2 text-sm font-semibold text-white">{data.page}</span>
          <button type="button" disabled={data.pages === 0 || page >= data.pages} onClick={() => onPageChange(page + 1)} className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-50">
            Next
          </button>
        </div>
      </div>
    </section>
  );
}

function EmploymentBadge({ employee }) {
  const label = employee.employment_type_name || formatLabel(employee.employment_type);
  return <span className={`rounded-md px-2.5 py-1 text-xs font-semibold ring-1 ${employmentBadgeClass(employee)}`}>{label}</span>;
}
