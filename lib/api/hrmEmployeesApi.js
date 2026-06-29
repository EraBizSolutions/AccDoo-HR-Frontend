import { cleanParams, request } from "@/lib/api/request";

export async function getEmployees(params) {
  const searchParams = new URLSearchParams(cleanParams(params));
  return request(`/hrm/employees?${searchParams.toString()}`);
}

export async function getNextEmployeeCode() {
  return request("/hrm/employees/next-code");
}

export async function getEmployee(employeeId) {
  return request(`/hrm/employees/${employeeId}`);
}

export async function createEmployee(payload) {
  return request("/hrm/employees", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateEmployee(employeeId, payload) {
  return request(`/hrm/employees/${employeeId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteEmployee(employeeId) {
  return request(`/hrm/employees/${employeeId}`, {
    method: "DELETE",
  });
}
