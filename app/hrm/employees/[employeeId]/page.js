import EmployeeDetails from "@/components/hrm/EmployeeDetails";

export default async function EmployeeDetailsPage({ params }) {
  const { employeeId } = await params;
  return <EmployeeDetails employeeId={employeeId} />;
}
