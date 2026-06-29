import EmployeeEditView from "@/components/hrm/EmployeeEditView";

export default async function EmployeeEditPage({ params }) {
  const { employeeId } = await params;
  return <EmployeeEditView employeeId={employeeId} />;
}
