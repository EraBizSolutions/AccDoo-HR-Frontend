import EmployeeForm from "@/components/hrm/EmployeeForm";

export default function CreateEmployeePage() {
  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-5">
        <p className="text-sm font-medium text-gray-500">HRM / Employees / Create</p>
        <h1 className="mt-1 text-2xl font-semibold text-gray-950">Create Employee</h1>
        <p className="mt-1 text-sm text-gray-500">Add a new team member using your configured HRM setup data.</p>
      </div>
      <EmployeeForm />
    </div>
  );
}
